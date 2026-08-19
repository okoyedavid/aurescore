import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { developerApi } from "./api";

export const oauthClientKeys = {
  all: ["oauth-clients"] as const,
  detail: (clientId: string) => ["oauth-client", clientId] as const,
};

export function useOAuthClients() {
  return useQuery({
    queryKey: oauthClientKeys.all,
    queryFn: ({ signal }) => developerApi.listClients(signal),
    meta: { requiresAuth: true },
  });
}
export function useOAuthClient(clientId: string) {
  return useQuery({
    queryKey: oauthClientKeys.detail(clientId),
    queryFn: ({ signal }) => developerApi.getClient(clientId, signal),
    enabled: Boolean(clientId),
    meta: { requiresAuth: true },
  });
}
export function useCreateOAuthClient(onSecret: (secret: string) => void) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (
      input: Parameters<typeof developerApi.createClient>[0],
    ) => {
      const { clientSecret, ...metadata } =
        await developerApi.createClient(input);
      onSecret(clientSecret);
      return metadata;
    },
    retry: false,
    onSuccess: () =>
      client.invalidateQueries({ queryKey: oauthClientKeys.all }),
  });
}
export function useRotateOAuthSecret(
  clientId: string,
  onSecret: (secret: string) => void,
) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { clientSecret, ...metadata } =
        await developerApi.rotateSecret(clientId);
      onSecret(clientSecret);
      return metadata;
    },
    retry: false,
    onSuccess: () =>
      client.invalidateQueries({ queryKey: oauthClientKeys.detail(clientId) }),
  });
}
export function useDisableOAuthClient(clientId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: () => developerApi.disableClient(clientId),
    retry: false,
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: oauthClientKeys.all }),
        client.invalidateQueries({
          queryKey: oauthClientKeys.detail(clientId),
        }),
      ]);
    },
  });
}
