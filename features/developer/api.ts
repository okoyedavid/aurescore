import { apiClient } from "@/lib/api/client";
import { normalizeApiError } from "@/lib/api/errors";
import type {
  CreateOAuthClientInput,
  OAuthClient,
  OAuthClientWithSecret,
  RotatedOAuthSecret,
} from "./types";

async function request<T>(operation: Promise<{ data: T }>) {
  try {
    return (await operation).data;
  } catch (error) {
    throw normalizeApiError(error);
  }
}

export const developerApi = {
  listClients: (signal?: AbortSignal) =>
    request<OAuthClient[]>(
      apiClient.get("/developer/oauth-clients", { signal }),
    ),
  getClient: (clientId: string, signal?: AbortSignal) =>
    request<OAuthClient>(
      apiClient.get(
        `/developer/oauth-clients/${encodeURIComponent(clientId)}`,
        { signal },
      ),
    ),
  createClient: (input: CreateOAuthClientInput) =>
    request<OAuthClientWithSecret>(
      apiClient.post("/developer/oauth-clients", input),
    ),
  rotateSecret: (clientId: string) =>
    request<RotatedOAuthSecret>(
      apiClient.post(
        `/developer/oauth-clients/${encodeURIComponent(clientId)}/rotate-secret`,
      ),
    ),
  disableClient: (clientId: string) =>
    request<void>(
      apiClient.delete(
        `/developer/oauth-clients/${encodeURIComponent(clientId)}`,
      ),
    ),
};
