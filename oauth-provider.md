# Sign in with Aurescore

Aurescore is an OpenID Connect provider. Applications use Authorization Code flow with PKCE (`S256`) to authenticate an Aurescore user and receive the identity claims that user approved.

This first release supports confidential server-rendered or backend-for-frontend web applications. A client secret must never be shipped to browser, mobile, or desktop code. Public clients and refresh tokens are not supported yet.

## Endpoints

| Purpose | Development | Production |
| --- | --- | --- |
| Discovery | `http://localhost:5000/.well-known/openid-configuration` | `https://api.aurescore.okoyedavid.com/.well-known/openid-configuration` |
| Authorization | `http://localhost:5000/api/oauth/authorize` | `https://api.aurescore.okoyedavid.com/api/oauth/authorize` |
| Token | `http://localhost:5000/api/oauth/token` | `https://api.aurescore.okoyedavid.com/api/oauth/token` |
| UserInfo | `http://localhost:5000/api/oauth/userinfo` | `https://api.aurescore.okoyedavid.com/api/oauth/userinfo` |
| JWKS | `http://localhost:5000/api/oauth/jwks` | `https://api.aurescore.okoyedavid.com/api/oauth/jwks` |

Use discovery instead of hard-coding the protocol endpoints where your OIDC library supports it. The configured `OIDC_ISSUER` must exactly match the issuer used by clients.

## Register an application

An authenticated Aurescore user can manage their applications through these cookie-authenticated endpoints:

- `POST /api/developer/oauth-clients` creates a client and returns its secret once.
- `GET /api/developer/oauth-clients` lists the caller's clients.
- `GET /api/developer/oauth-clients/:clientId` returns one owned client.
- `POST /api/developer/oauth-clients/:clientId/rotate-secret` replaces the secret and returns the new value once.
- `DELETE /api/developer/oauth-clients/:clientId` disables the client and revokes its grants.

Create request:

```json
{
  "name": "Example App",
  "description": "Signs users into Example App",
  "homepageUrl": "https://example.com",
  "logoUrl": "https://example.com/logo.png",
  "redirectUris": ["https://example.com/auth/aurescore/callback"],
  "allowedScopes": ["openid", "profile", "email"]
}
```

The response includes a `clientId` beginning with `auc_` and a `clientSecret` beginning with `aus_`. Copy the secret immediately: subsequent reads return only `clientSecretHint`. Redirect URI matching is exact. Production URIs must use HTTPS; HTTP is accepted only for localhost development. Redirect URIs cannot have credentials, a query string, or a fragment.

## Authorization flow

1. Generate a high-entropy `state`, `nonce`, and PKCE `code_verifier` for each attempt. Store them in the relying application's server-side session.
2. Compute `code_challenge = BASE64URL(SHA256(code_verifier))`.
3. Navigate the browser to the authorization endpoint.
4. Aurescore authenticates the user and displays its own consent screen when consent is needed.
5. Aurescore redirects to the exact registered callback with `code` and the original `state`.
6. The relying application's backend verifies `state`, then exchanges the code. Codes live for two minutes and are single-use.
7. Validate the ID token signature and claims using discovery and JWKS. In particular validate `iss`, `aud`, `exp`, and the original `nonce`.

Authorization request:

```text
GET /api/oauth/authorize?
  response_type=code&
  client_id=auc_...&
  redirect_uri=https%3A%2F%2Fexample.com%2Fauth%2Faurescore%2Fcallback&
  scope=openid%20profile%20email&
  state=RANDOM_STATE&
  nonce=RANDOM_NONCE&
  code_challenge=BASE64URL_SHA256_VERIFIER&
  code_challenge_method=S256
```

`openid` is required. Add `prompt=consent` when the user must see consent again even if an active grant already covers all requested scopes.

Exchange the returned code from the relying application's backend. Client credentials use HTTP Basic authentication; do not put the secret in the body or URL.

```bash
curl -X POST "https://api.aurescore.okoyedavid.com/api/oauth/token" \
  -u "CLIENT_ID:CLIENT_SECRET" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  --data-urlencode "grant_type=authorization_code" \
  --data-urlencode "code=RETURNED_CODE" \
  --data-urlencode "redirect_uri=https://example.com/auth/aurescore/callback" \
  --data-urlencode "code_verifier=ORIGINAL_CODE_VERIFIER"
```

Successful response:

```json
{
  "token_type": "Bearer",
  "access_token": "aat_...",
  "expires_in": 600,
  "scope": "email openid profile",
  "id_token": "eyJ..."
}
```

The access token is opaque, expires after ten minutes, and currently has no refresh token. To obtain a new token, start a new authorization flow; an existing sufficient grant normally avoids another consent prompt.

## Scopes and claims

| Scope | Claims |
| --- | --- |
| `openid` | stable pairwise `sub` for this user/client pair |
| `profile` | `name`, `picture`, and UserInfo `preferred_username` |
| `email` | `email`, `email_verified` |

The same Aurescore user has a different `sub` at a different OAuth client. Use `(issuer, sub)` as the external identity key; do not use email as the durable account key.

UserInfo request:

```bash
curl "https://api.aurescore.okoyedavid.com/api/oauth/userinfo" \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

## Browser and CORS behavior

Authorization and callback steps are top-level browser navigations, so they do not require CORS. Token exchange belongs on the relying application's backend because it requires the client secret. Aurescore intentionally does not open CORS to arbitrary OAuth client origins. Do not call the token endpoint from browser JavaScript and do not send Aurescore cookies to a third-party origin.

## Errors and operational security

Authorization errors that can safely return to a validated callback use `error` and the original `state`. Token errors are JSON with `error` and `error_description`. Clients must handle `invalid_request`, `invalid_scope`, `access_denied`, `invalid_client`, `invalid_grant`, `unauthorized_client`, `temporarily_unavailable`, and `server_error`.

Client secrets are Argon2id hashes at rest. Authorization interactions, codes, and opaque access tokens live in Redis with short expirations. Consent is CSRF-bound, authorization codes are one-time, PKCE is mandatory, grants and clients are rechecked when tokens are used, and security events are audited and rate-limited.

For production, generate a persistent RSA signing key with:

```bash
npm run oidc:generate-key
```

Store both printed variables in the deployment secret manager. Keep the key stable across deployments. Rotating it requires publishing the previous public key during the overlap period; the current implementation publishes only the active key, so plan key rotation before changing it.
