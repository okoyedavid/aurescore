# AureScore frontend

AureScore is a Next.js frontend for academic result management. Authentication is owned by the NestJS API and uses HTTP-only access and refresh cookies. The frontend never receives or stores authentication tokens.

## Local setup

Install dependencies and create `.env.local`:

```bash
npm install
```

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001/api

CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_KEY=your-api-key
CLOUDINARY_SECRET=your-api-secret
```

Start the frontend at `http://localhost:3000`:

```bash
npm run dev
```

For production, set:

```env
NEXT_PUBLIC_API_BASE_URL=https://api.aurescore.okoyedavid.com/api
```

The production frontend origin is `https://aurescore.okoyedavid.com`. The API must allow that exact origin with credentialed CORS requests and must configure its cookies correctly for cross-origin use.

`CLOUDINARY_SECRET` is server-only. Never rename it to a `NEXT_PUBLIC_` variable.

## Authentication architecture

The frontend extends one authentication system rather than maintaining separate password, Google, or account-settings stores.

| Concern                  | Implementation                                                                                  |
| ------------------------ | ----------------------------------------------------------------------------------------------- |
| HTTP client              | One Axios client in `lib/api/client.ts`                                                         |
| Credentials              | `withCredentials: true` on the instance and every intercepted request                           |
| Tokens                   | HTTP-only backend cookies; never read by JavaScript                                             |
| Current user             | TanStack Query key `['account', 'me']` backed by `GET /account/me`                              |
| Protected routes         | `ProtectedRoute` around the product route group                                                 |
| Mutations                | Typed TanStack Query mutation hooks in `features/auth/hooks.ts` and `features/account/hooks.ts` |
| Errors                   | Normalized into status, backend code, message, and field errors by `lib/api/errors.ts`          |
| Temporary workflow state | Limited non-secret values in `sessionStorage`; details below                                    |
| OAuth                    | Backend-owned authorization-code flow started with full-page browser navigation                 |

The Axios client sends no `Authorization` header. Access and refresh credentials are supplied automatically by the browser as cookies.

## Canonical authentication state

`GET /account/me` is the authoritative source for the authenticated user. `useCurrentUser` uses the stable query key:

```ts
["account", "me"];
```

Authentication is not inferred from cookie visibility, local storage, a boolean context value, or the presence of cached tokens.

During initial protected-route rendering:

1. `ProtectedRoute` mounts `useCurrentUser`.
2. The page displays a session-checking screen while the query is unresolved.
3. A valid user renders the protected application.
4. A final unauthenticated result redirects to `/sign-in` with a sanitized local `returnTo` path.
5. Network or non-authentication failures show a retryable error state instead of protected content.

The query does not retry ordinary authentication failures. The Axios interceptor still receives the first access-token `401` and may restore the request through the refresh flow described below.

Successful password login and login-code verification return a user object. That object is placed directly into the canonical current-user cache as fresh data before navigation. It is not immediately invalidated, preventing an unnecessary authentication-bootstrap race.

## Registration and email verification

Frontend routes:

- `/register`
- `/email-verification`

Backend requests:

- `POST /auth/register`
- `POST /auth/email-verification/verify`
- `POST /auth/email-verification/resend`

Registration submits the normalized email, trimmed name, and password. The UI preserves the backend's generic registration response and does not reveal whether an address already exists.

After a successful registration:

1. Only the pending normalized email is placed in `sessionStorage`.
2. The password is discarded from component state when the page is left and is never persisted.
3. The user is sent to `/email-verification`.
4. The verification page accepts exactly six numeric digits and supports full-code paste through one accessible OTP input.
5. Successful verification clears the pending email and replaces the route with `/sign-in?verified=1`.

Resending has an independent pending state and a client-side 60-second countdown. The server remains authoritative and may still return `429`, expired-code, exhausted-code, or delivery errors.

If password login reports that the email is not verified, the login form does not leave the user blocked. It stores the normalized pending email, marks an automatic resend request, and opens `/email-verification`. That screen consumes the one-time marker and requests a fresh verification code.

## Password login

Frontend route: `/sign-in`

Backend request: `POST /auth/login`

Before starting a new login, any stale login challenge is cleared. The destination is read from `returnTo` and sanitized so it must remain an application-local path. External URLs and protocol-relative paths fall back to `/dashboard`.

The backend can return one of two successful states.

### Login completed

When the response contains the user and does not require verification:

1. The refresh-failure redirect lock is reset.
2. The returned user populates `['account', 'me']`.
3. Other authenticated queries are invalidated without invalidating the fresh current-user value.
4. `router.replace` opens the sanitized destination, defaulting to `/dashboard`.

### Login verification required

When `requiresTwoFactor` is `true`:

1. The frontend does not mark the user authenticated.
2. The opaque challenge ID, resend timestamp, and sanitized destination are stored temporarily in `sessionStorage`.
3. The user is sent to `/login-verification`.
4. No password or verification code is stored.

## Email-based login verification

Frontend route: `/login-verification`

Backend requests:

- `POST /auth/login-verification/verify`
- `POST /auth/login-verification/resend`

The page requires a pending challenge before enabling the form. A missing challenge returns the visitor to sign-in with a helpful notice.

The form accepts exactly six numeric digits. Verify and resend operations have independent pending states, duplicate-request guards, normalized errors, and a 60-second resend countdown.

After successful verification:

1. The page marks verification complete before deleting the stored challenge. This prevents challenge cleanup from triggering the missing-challenge redirect while navigation is still pending.
2. The challenge and pending destination are cleared.
3. The returned user populates the canonical current-user query.
4. Other authenticated queries are invalidated.
5. The route is replaced with the pending protected destination, defaulting to `/dashboard`.

The backend establishes the cookie session only after verification succeeds. The frontend never marks the user authenticated before that response.

## Google sign-in

Google OAuth is fully owned by the backend. The frontend does not use the Google JavaScript SDK, a popup, Axios, `fetch`, or a TanStack mutation to begin authorization.

The shared login and registration form provides “Continue with Google.” Activating it immediately disables the button and performs full-page navigation to the configured API's `/api/auth/google` route. The URL builder supports configured API values with or without a trailing `/api`, avoiding a duplicated path segment.

The frontend never receives, exchanges, logs, or stores:

- Google access or refresh tokens
- Google ID tokens
- authorization codes
- client secrets
- PKCE verifiers
- OAuth state

### Google callback

Frontend route: `/auth/callback`

The server-rendered page parses only `provider`, `status`, and `challengeId`. Duplicate values, unknown parameters, an unknown provider, a missing status, or a malformed challenge produce the generic failed state. Raw callback values and provider errors are never displayed.

Callback query parameters are removed from browser history after they are parsed.

#### `status=success`

1. The page stays in a finishing-sign-in loading state.
2. It invalidates and immediately fetches `['account', 'me']` from `GET /account/me`.
3. The existing refresh interceptor may repair one access-cookie `401`.
4. Only a confirmed current user permits `router.replace('/dashboard')`.
5. A final failure stays on the callback page with “Retry session check” and “Return to login” actions.

The callback does not optimistically authenticate based only on the query status. A ref guard and TanStack's request deduplication prevent duplicate callback processing under React Strict Mode.

#### `status=verification-required`

A non-empty opaque `challengeId` is required. It remains only in route/component state and is never written to local or session storage.

The callback reuses the standard accessible six-digit OTP input and the existing login-verification mutation hooks. Verification and resend use the same backend endpoints as password-based login verification. After verification succeeds, the callback ignores optimistic assumptions, fetches `/account/me`, and navigates only after the cookie session is confirmed.

#### `status=account-link-required`

The page explains that an AureScore account already uses the email but Google is not linked. It offers password sign-in and a return-to-login action. It does not create another account, restart Google automatically, or call a nonexistent linking endpoint.

#### Failed callback

`status=failed`, missing values, unknown providers, and malformed parameters display:

> Google sign-in could not be completed. Please try again.

The page offers a fresh Google attempt and a return-to-login action without exposing backend details.

## Access-token refresh

Normal authenticated API requests are protected by the Axios response interceptor.

When an eligible request receives `401`:

1. Its private `_retry` flag is checked. A request is retried at most once.
2. The module-level `refreshPromise` starts `POST /auth/refresh` if no refresh is active.
3. Other requests receiving `401` in the same tab await that shared promise instead of rotating the refresh token again.
4. The shared promise is cleared in `finally`.
5. After refresh succeeds, every queued original Axios configuration is retried once with cookies.

Refresh outcomes:

| Refresh response              | Frontend behavior                                                                                |
| ----------------------------- | ------------------------------------------------------------------------------------------------ |
| `200`                         | Retry the original request once                                                                  |
| `409 REFRESH_ALREADY_ROTATED` | Treat another request or tab as the rotation winner and retry with the browser's current cookies |
| `401 REFRESH_REJECTED`        | Clear authenticated query state and redirect to sign-in                                          |
| Other unrecoverable failure   | Clear authenticated query state and redirect to sign-in                                          |

Only one global authentication-failure redirect is allowed at a time, preventing several failed queued requests from producing repeated redirects.

The interceptor never refreshes recursively and excludes:

- `/auth/login`
- `/auth/register`
- `/auth/refresh`
- `/auth/google`
- `/auth/email-verification/*`
- `/auth/login-verification/*`

A `401` identified as an incorrect current password is returned to the account form as a field error. It does not refresh repeatedly or log the user out.

While `/auth/callback` is confirming an OAuth session, the global hard redirect is suppressed so the callback can display its required retryable error state.

## Account security flows

All account endpoints use the same cookie-authenticated Axios client.

### Login-verification preference

`PATCH /account/preferences` changes `twoFactorEnabled`. The user must confirm the change with their current password in a dialog. The password is never cached or persisted and is cleared when the request settles. The cached account preference changes only after backend success.

This setting currently enables email-based verification after password or Google authentication requires an additional challenge.

### Password change

`PATCH /account/password` sends only `currentPassword` and `newPassword`; confirmation is frontend-only. A successful change:

- keeps the caller's current session active;
- clears all password fields;
- invalidates `['account', 'sessions']`; and
- informs the user that every other device was signed out.

An incorrect current password remains a field-level error and does not clear authentication.

### Email change

The request step sends the new email and current password to `POST /account/email-change/request`. The visible account email and current-user cache are not changed yet.

Only the opaque challenge ID and pending new email are stored temporarily in `sessionStorage`. The current password and confirmation code are never stored.

The confirmation step sends the six-digit code to `POST /account/email-change/confirm`. On success it clears pending state, refetches `['account', 'me']`, invalidates the sessions query, keeps the caller logged in, and explains that other sessions were revoked.

### Session management

`GET /sessions` populates `['account', 'sessions']` and distinguishes current, active, revoked, and expired sessions.

- `DELETE /sessions/:sessionId` revokes the selected backend `userSessionId` after confirmation.
- Revoking another session refreshes the list and keeps the caller logged in.
- Revoking the current session clears authenticated query state and returns to sign-in.
- `DELETE /sessions/others` keeps the current session and reports how many other sessions were revoked.
- Password and confirmed email changes invalidate the sessions query because the backend revokes other sessions.

## Browser storage policy

Authentication credentials are never stored in `localStorage`, `sessionStorage`, IndexedDB, React state, context, Redux, Zustand, or TanStack Query.

The following temporary, non-credential workflow values may use `sessionStorage`:

- pending registration-verification email;
- email-verification resend timestamp and one-time automatic-resend marker;
- pending password-login challenge ID;
- login-verification resend timestamp;
- sanitized post-login destination;
- pending email-change challenge ID and new email address.

Google callback challenges are deliberately not persisted. Passwords and six-digit codes remain only in form state and are cleared or discarded with the form lifecycle.

TanStack Query stores user and server data, never access or refresh tokens.

## Error and UX behavior

Axios failures are converted to a reusable `ApiError` containing only safe application information:

- HTTP status;
- backend error code;
- backend message;
- validation-message arrays; and
- inferred or explicit field errors.

Raw Axios stack traces and complete authentication responses are not rendered or logged. Forms use mutation-specific pending states, ref guards against double submission, accessible labels, `aria-invalid`, described errors, and live regions for asynchronous feedback.

Common statuses are handled as follows:

- `400`: validation or invalid/expired workflow state;
- `401`: unauthenticated session or sensitive-action password error;
- `403`: including the unverified-email login resolution flow;
- `404`: missing session;
- `409`: conflicts or refresh rotation already won elsewhere;
- `429`: server-enforced rate limit despite the client countdown;
- `503`: email or dependent-service delivery failure.

## Profile-image authentication boundary

Profile-image bytes are not sent to the AureScore account API. After the user selects an image and explicitly saves the profile:

1. The frontend requests a short-lived signature from `/api/uploads/profile-image/signature`.
2. The Next.js route confirms the caller through `GET /account/me` and signs parameters with the server-only Cloudinary secret.
3. The browser uploads directly to Cloudinary and displays upload progress.
4. Only the final HTTPS URL is sent to `PATCH /account/profile`.
5. The returned user updates the canonical current-user cache, which updates the profile, sidebar, and header avatar.

In production, authentication cookies must be available to the frontend signing route. If API cookies are host-only to `api.aurescore.okoyedavid.com`, signature generation should move to an authenticated backend endpoint instead of weakening the signing route.

## Validation commands

```bash
npm run format
npm run lint
npm run typecheck
npm test
npm run build
```

Authentication coverage includes password login, unverified-email resolution, email and login OTP verification, resend cooldowns, Google callback states, Strict Mode callback deduplication, current-user hydration, simultaneous refresh locking, refresh rotation conflicts, refresh rejection, retry-loop prevention, password and email changes, current/other session revocation, and Cloudinary upload authorization.
#   a u r e s c o r e  
 