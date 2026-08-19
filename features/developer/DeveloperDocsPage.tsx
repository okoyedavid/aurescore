import Link from "next/link";
import { CheckCircle2, ExternalLink, ShieldCheck } from "lucide-react";
import Footer from "@/components/layout/Footer";
import SiteHeader from "@/components/layout/SiteHeader";
import CodeBlock from "./components/CodeBlock";

const sections = [
  "overview",
  "quickstart",
  "register",
  "pkce",
  "endpoints",
  "scopes",
  "validation",
  "userinfo",
  "errors",
  "security",
  "production",
] as const;
const labels = {
  overview: "Overview",
  quickstart: "Quickstart",
  register: "Register an app",
  pkce: "Authorization Code + PKCE",
  endpoints: "Endpoints",
  scopes: "Scopes and claims",
  validation: "Token validation",
  userinfo: "UserInfo",
  errors: "Errors",
  security: "Security",
  production: "Production checklist",
};
const authorize = `GET https://api.aurescore.okoyedavid.com/api/oauth/authorize
  ?client_id=auc_example
  &redirect_uri=https%3A%2F%2Fapp.example.com%2Fcallback
  &response_type=code
  &scope=openid%20profile%20email
  &state=<random-state>
  &code_challenge=<base64url-sha256>
  &code_challenge_method=S256`;
const exchange = `curl -X POST https://api.aurescore.okoyedavid.com/api/oauth/token \\
  -u 'auc_example:YOUR_SERVER_SIDE_SECRET' \\
  -H 'Content-Type: application/x-www-form-urlencoded' \\
  --data-urlencode 'grant_type=authorization_code' \\
  --data-urlencode 'code=ONE_TIME_CODE' \\
  --data-urlencode 'redirect_uri=https://app.example.com/callback' \\
  --data-urlencode 'code_verifier=ORIGINAL_PKCE_VERIFIER'`;

export default function DeveloperDocsPage() {
  return (
    <main className="min-h-screen bg-cream text-ink">
      <SiteHeader />
      <section className="border-b border-line bg-navy-deep text-white">
        <div className="mx-auto max-w-7xl px-6 py-16 md:px-10 md:py-24">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider">
            <ShieldCheck size={14} />
            OAuth provider
          </span>
          <h1 className="mt-6 max-w-4xl font-display text-5xl font-semibold md:text-7xl">
            Sign in with AureScore.
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-white/65">
            Integrate standards-based OpenID Connect using Authorization Code
            flow with PKCE. This release supports confidential server-side web
            clients only and does not issue refresh tokens.
          </p>
        </div>
      </section>
      <div className="mx-auto grid max-w-7xl gap-12 px-6 py-14 md:grid-cols-[240px_minmax(0,1fr)] md:px-10">
        <aside className="md:sticky md:top-24 md:self-start">
          <nav aria-label="Developer documentation" className="grid gap-1">
            {sections.map((id) => (
              <a
                key={id}
                href={`#${id}`}
                className="focus-ring rounded px-3 py-2 text-sm text-muted hover:bg-white hover:text-ink"
              >
                {labels[id]}
              </a>
            ))}
          </nav>
          <Link
            href="/api"
            className="focus-ring mt-5 inline-flex items-center gap-2 rounded px-3 text-sm font-semibold text-blue-700"
          >
            Manage applications <ExternalLink size={14} />
          </Link>
        </aside>
        <article className="min-w-0 space-y-16">
          <section id="overview">
            <Title>Overview</Title>
            <P>
              AureScore acts as an OpenID Connect identity provider. Your server
              redirects the browser to AureScore, receives a short-lived
              one-time authorization code, and exchanges it from your backend.
              Keep the client secret and token exchange out of browser
              JavaScript.
            </P>
          </section>
          <section id="quickstart">
            <Title>Quickstart</Title>
            <Steps
              items={[
                "Register a confidential OAuth application in the developer area.",
                "Generate a cryptographically random state and PKCE verifier on your server.",
                "Redirect the browser to the authorization endpoint.",
                "Validate state, then exchange the code from your backend.",
                "Validate the returned ID token and optionally call UserInfo.",
              ]}
            />
            <CodeBlock code={authorize} language="HTTP" />
          </section>
          <section id="register">
            <Title>Register an app</Title>
            <P>
              Provide a name, exact redirect URIs, and the scopes your app may
              request. Redirect URIs must use HTTPS, except HTTP loopback
              addresses for local development, and cannot contain a query or
              fragment. Save the one-time secret immediately in a server-side
              secret manager.
            </P>
          </section>
          <section id="pkce">
            <Title>Authorization Code + PKCE</Title>
            <P>
              Use S256 PKCE for every authorization request. Authorization codes
              are single-use and expire after two minutes. The token request
              must authenticate the confidential client and present the original
              verifier.
            </P>
            <CodeBlock code={exchange} language="Shell" />
          </section>
          <section id="endpoints">
            <Title>Endpoints</Title>
            <Table
              rows={[
                ["Discovery", "/.well-known/openid-configuration"],
                ["Authorization", "/api/oauth/authorize"],
                ["Token", "/api/oauth/token"],
                ["UserInfo", "/api/oauth/userinfo"],
                ["JWKS", "/api/oauth/jwks"],
              ]}
            />
          </section>
          <section id="scopes">
            <Title>Scopes and claims</Title>
            <Table
              rows={[
                ["openid", "Required; identifies the OpenID Connect request."],
                [
                  "profile",
                  "Provides name, username, and avatar claims when available.",
                ],
                ["email", "Provides email and email verification claims."],
              ]}
            />
          </section>
          <section id="validation">
            <Title>Token validation</Title>
            <P>
              Fetch signing keys from JWKS and verify the ID token signature,
              issuer, audience, expiry, and nonce when supplied. Cache keys
              according to response headers and support key rotation. Access
              tokens are opaque, expire after ten minutes, and should not be
              parsed by clients.
            </P>
          </section>
          <section id="userinfo">
            <Title>UserInfo</Title>
            <P>
              Call UserInfo from your server with the opaque bearer access
              token. Returned claims are limited by the granted scopes. Treat
              absent optional claims as normal.
            </P>
            <CodeBlock
              code={`curl https://api.aurescore.okoyedavid.com/api/oauth/userinfo \\
  -H 'Authorization: Bearer ACCESS_TOKEN'`}
              language="Shell"
            />
          </section>
          <section id="errors">
            <Title>Errors</Title>
            <P>
              Authorization failures return standard OAuth error values to a
              validated redirect URI. Token failures use JSON error responses.
              Show safe messages to users, retain state correlation, and never
              expose client secrets or raw provider details in logs or URLs.
            </P>
          </section>
          <section id="security">
            <Title>Security</Title>
            <Steps
              items={[
                "Generate state, nonce, and PKCE values with a cryptographically secure random source.",
                "Keep secrets and token exchanges on your server.",
                "Use exact redirect matching and HTTPS in production.",
                "Use short-lived server sessions and protect callback endpoints against CSRF.",
                "Rotate a secret immediately if it may have been exposed.",
              ]}
            />
          </section>
          <section id="production">
            <Title>Production checklist</Title>
            <Steps
              items={[
                "Use the production issuer and discovery document.",
                "Store the client secret in a managed secret store.",
                "Validate ID tokens against the production JWKS and expected audience.",
                "Confirm every production redirect URI is exact and HTTPS.",
                "Test denied consent, expired codes, state mismatch, and key rotation.",
                "Do not expect refresh tokens in this release.",
              ]}
            />
          </section>
        </article>
      </div>
      <Footer />
    </main>
  );
}
function Title({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-5 scroll-mt-28 font-display text-3xl font-semibold">
      {children}
    </h2>
  );
}
function P({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-6 max-w-3xl text-[15px] leading-7 text-muted">
      {children}
    </p>
  );
}
function Steps({ items }: { items: string[] }) {
  return (
    <ol className="mb-7 space-y-3">
      {items.map((item, index) => (
        <li key={item} className="flex gap-3 text-sm leading-6 text-muted">
          <CheckCircle2
            size={18}
            className="mt-0.5 shrink-0 text-emerald-600"
          />
          <span>
            <strong className="text-ink">{index + 1}.</strong> {item}
          </span>
        </li>
      ))}
    </ol>
  );
}
function Table({ rows }: { rows: string[][] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-line bg-white">
      <table className="w-full text-left text-sm">
        <tbody>
          {rows.map(([key, value]) => (
            <tr key={key} className="border-b border-line last:border-0">
              <th className="p-4 font-mono text-xs">{key}</th>
              <td className="p-4 text-muted">{value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
