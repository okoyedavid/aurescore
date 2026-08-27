"use client";

import { FormEvent, useRef, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/FormField";
import { getApiErrorMessage, normalizeApiError } from "@/lib/api/errors";
import { useCreateOAuthClient } from "./hooks";
import type { OAuthScope } from "./types";
import {
  normalizeOAuthClientInput,
  validateOAuthClient,
  type OAuthClientFieldErrors,
} from "./validation";
import OneTimeSecretDialog from "./components/OneTimeSecretDialog";

export default function CreateOAuthClientPage() {
  const router = useRouter();
  const locked = useRef(false);
  const [redirectUris, setRedirectUris] = useState([""]);
  const [scopes, setScopes] = useState<OAuthScope[]>(["openid"]);
  const [errors, setErrors] = useState<OAuthClientFieldErrors>({});
  const [secret, setSecret] = useState<string | null>(null);
  const [createdId, setCreatedId] = useState("");
  const create = useCreateOAuthClient(setSecret);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (locked.current || create.isPending) return;
    const form = new FormData(event.currentTarget);
    const input = normalizeOAuthClientInput({
      name: String(form.get("name") ?? ""),
      description: String(form.get("description") ?? ""),
      homepageUrl: String(form.get("homepageUrl") ?? ""),
      logoUrl: String(form.get("logoUrl") ?? ""),
      redirectUris,
      allowedScopes: scopes,
    });
    const nextErrors = validateOAuthClient(input);
    setErrors(nextErrors);
    create.reset();
    if (Object.keys(nextErrors).length) return;
    locked.current = true;
    try {
      const result = await create.mutateAsync(input);
      setCreatedId(result.clientId);
    } catch {
    } finally {
      locked.current = false;
    }
  }
  const backend = create.isError ? normalizeApiError(create.error) : null;
  return (
    <div className="mx-auto w-full max-w-[1500px] px-[clamp(20px,4.5vw,72px)] pb-[72px] pt-[clamp(28px,4vw,58px)] max-[900px]:px-5 max-[900px]:pb-14 max-[900px]:pt-7">
      <header className="border-b border-[var(--app-border)] pb-6">
        <p className="mb-2 text-[10px] font-bold uppercase leading-normal tracking-[0.13em] text-blue-600">
          Developer
        </p>
        <h1 className="m-0 font-display text-[clamp(38px,4vw,50px)] font-medium leading-none tracking-[-0.045em] max-[650px]:text-[39px]">
          Create an OAuth application
        </h1>
        <p className="mt-2.5 max-w-[660px] text-xs leading-normal text-[var(--app-muted)]">
          Redirect URI matching is exact. This release supports confidential
          server-side web clients only.
        </p>
      </header>
      <form
        onSubmit={submit}
        noValidate
        className="app-panel mt-8 max-w-3xl space-y-6 border border-[var(--app-border)] p-6 md:p-8"
      >
        <label className="block text-sm font-semibold">
          Application name
          <Input
            name="name"
            autoFocus
            required
            minLength={3}
            maxLength={80}
            className="mt-2"
            aria-invalid={Boolean(errors.name || backend?.fieldErrors?.name)}
          />
          <span className="mt-1 block text-xs text-red-600">
            {errors.name || backend?.fieldErrors?.name?.[0]}
          </span>
        </label>
        <label className="block text-sm font-semibold">
          Description{" "}
          <span className="font-normal text-[var(--app-muted)]">
            (optional)
          </span>
          <Textarea name="description" rows={3} className="mt-2" />
        </label>
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block text-sm font-semibold">
            Homepage URL{" "}
            <span className="font-normal text-[var(--app-muted)]">
              (optional)
            </span>
            <Input
              name="homepageUrl"
              type="url"
              className="mt-2"
              aria-invalid={Boolean(errors.homepageUrl)}
            />
            <span className="text-xs text-red-600">{errors.homepageUrl}</span>
          </label>
          <label className="block text-sm font-semibold">
            Logo URL{" "}
            <span className="font-normal text-[var(--app-muted)]">
              (optional)
            </span>
            <Input
              name="logoUrl"
              type="url"
              className="mt-2"
              aria-invalid={Boolean(errors.logoUrl)}
            />
            <span className="text-xs text-red-600">{errors.logoUrl}</span>
          </label>
        </div>
        <fieldset>
          <legend className="text-sm font-semibold">Exact redirect URIs</legend>
          <p className="mt-1 text-xs text-[var(--app-muted)]">
            HTTPS is required except for localhost development. Query strings
            and fragments are not allowed.
          </p>
          <div className="mt-3 space-y-3">
            {redirectUris.map((uri, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  aria-label={`Redirect URI ${index + 1}`}
                  value={uri}
                  onChange={(e) =>
                    setRedirectUris((values) =>
                      values.map((v, i) => (i === index ? e.target.value : v)),
                    )
                  }
                  placeholder="https://example.com/callback"
                  aria-invalid={Boolean(errors.redirectUris)}
                />
                <button
                  type="button"
                  aria-label={`Remove redirect URI ${index + 1}`}
                  disabled={redirectUris.length === 1}
                  onClick={() =>
                    setRedirectUris((values) =>
                      values.filter((_, i) => i !== index),
                    )
                  }
                  className="app-icon-button"
                >
                  <Minus size={17} />
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            disabled={redirectUris.length >= 10}
            onClick={() => setRedirectUris((values) => [...values, ""])}
            className="focus-ring mt-3 inline-flex items-center gap-2 rounded text-sm font-semibold text-blue-600"
          >
            <Plus size={15} />
            Add redirect URI
          </button>
          {errors.redirectUris && (
            <p role="alert" className="mt-2 text-xs text-red-600">
              {errors.redirectUris}
            </p>
          )}
        </fieldset>
        <fieldset>
          <legend className="text-sm font-semibold">Allowed scopes</legend>
          <div className="mt-3 flex flex-wrap gap-4">
            {(["openid", "profile", "email"] as OAuthScope[]).map((scope) => (
              <label key={scope} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={scopes.includes(scope)}
                  disabled={scope === "openid"}
                  onChange={(e) =>
                    setScopes((current) =>
                      e.target.checked
                        ? [...current, scope]
                        : current.filter((item) => item !== scope),
                    )
                  }
                />
                <code>{scope}</code>
                {scope === "openid" && (
                  <span className="text-xs text-[var(--app-muted)]">
                    required
                  </span>
                )}
              </label>
            ))}
          </div>
        </fieldset>
        {backend && (
          <p
            role="alert"
            aria-live="assertive"
            className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700"
          >
            {getApiErrorMessage(backend)}
          </p>
        )}
        <Button type="submit" disabled={create.isPending}>
          {create.isPending ? "Creating application…" : "Create application"}
        </Button>
      </form>
      <OneTimeSecretDialog
        secret={secret}
        onAcknowledge={() => {
          setSecret(null);
          router.replace(`/api/applications/${encodeURIComponent(createdId)}`);
        }}
      />
    </div>
  );
}
