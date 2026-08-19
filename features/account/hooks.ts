"use client";

import { useRef } from "react";

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { normalizeApiError } from "@/lib/api/errors";
import { accountApi } from "./api";
import { accountKeys } from "./query-keys";
import type {
  AccountUser,
  ChangePasswordInput,
  UpdatePreferencesInput,
} from "./types";

export function useCurrentUser() {
  return useQuery({
    queryKey: accountKeys.me,
    queryFn: ({ signal }) => accountApi.currentUser(signal),
    retry: false,
    staleTime: 30_000,
    meta: { requiresAuth: true },
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: accountApi.updateProfile,
    onSuccess: (user) =>
      queryClient.setQueryData<AccountUser | null>(accountKeys.me, (current) =>
        current ? { ...current, ...user } : user,
      ),
  });
}

export function useUpdatePreferences() {
  const queryClient = useQueryClient();
  const input = useRef<UpdatePreferencesInput | null>(null);
  const mutation = useMutation({
    mutationFn: () => {
      if (!input.current) throw new Error("Missing preference update.");
      return accountApi.updatePreferences(input.current);
    },
    retry: false,
    onSuccess: (preferences) => {
      queryClient.setQueryData<AccountUser | null>(accountKeys.me, (current) =>
        current ? { ...current, preferences } : current,
      );
    },
    onSettled: () => {
      input.current = null;
    },
  });
  return {
    ...mutation,
    mutateAsync: (value: UpdatePreferencesInput) => {
      input.current = value;
      return mutation.mutateAsync();
    },
  };
}

export function useChangePassword() {
  const queryClient = useQueryClient();
  const input = useRef<ChangePasswordInput | null>(null);
  const mutation = useMutation({
    mutationFn: () => {
      if (!input.current) throw new Error("Missing password update.");
      return accountApi.changePassword(input.current);
    },
    retry: false,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: accountKeys.sessions }),
    onSettled: () => {
      input.current = null;
    },
  });
  return {
    ...mutation,
    mutateAsync: (value: ChangePasswordInput) => {
      input.current = value;
      return mutation.mutateAsync();
    },
  };
}

export function useRequestEmailChange() {
  const input = useRef<
    Parameters<typeof accountApi.requestEmailChange>[0] | null
  >(null);
  const mutation = useMutation({
    mutationFn: () => {
      if (!input.current) throw new Error("Missing email update.");
      return accountApi.requestEmailChange(input.current);
    },
    retry: false,
    onSettled: () => {
      input.current = null;
    },
  });
  return {
    ...mutation,
    mutateAsync: (
      value: Parameters<typeof accountApi.requestEmailChange>[0],
    ) => {
      input.current = value;
      return mutation.mutateAsync();
    },
  };
}

export function useConfirmEmailChange() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: accountApi.confirmEmailChange,
    retry: false,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: accountKeys.sessions });
      try {
        await queryClient.fetchQuery({
          queryKey: accountKeys.me,
          queryFn: ({ signal }) => accountApi.currentUser(signal),
          staleTime: 0,
        });
      } catch {
        await queryClient.invalidateQueries({ queryKey: accountKeys.me });
      }
    },
  });
}

export function useRequestSecurityVerification() {
  return useMutation({
    mutationFn: accountApi.requestSecurityVerification,
    retry: false,
  });
}

export function useVerifySecurityVerification(
  challengeId: string | null,
  code: string,
  onVerified: (reauthToken: string) => Promise<void>,
) {
  return useMutation({
    mutationFn: async () => {
      if (!challengeId) throw new Error("Missing security challenge.");
      const { reauthToken, expiresIn } =
        await accountApi.verifySecurityVerification({ challengeId, code });
      await onVerified(reauthToken);
      return { expiresIn };
    },
    retry: false,
  });
}

export function useLinkGoogle() {
  return useMutation({ mutationFn: accountApi.googleLink, retry: false });
}

export function useOAuthGrants() {
  return useQuery({
    queryKey: accountKeys.oauthGrants,
    queryFn: ({ signal }) => accountApi.oauthGrants(signal),
    meta: { requiresAuth: true },
  });
}

export function useRevokeOAuthGrant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: accountApi.revokeOAuthGrant,
    retry: false,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: accountKeys.oauthGrants }),
  });
}

export function useSessions() {
  return useQuery({
    queryKey: accountKeys.sessions,
    queryFn: ({ signal }) => accountApi.sessions(signal),
    meta: { requiresAuth: true },
  });
}

export function useRevokeSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: accountApi.revokeSession,
    onSuccess: (response) =>
      response.currentSessionRevoked
        ? queryClient.removeQueries({ queryKey: accountKeys.sessions })
        : queryClient.invalidateQueries({ queryKey: accountKeys.sessions }),
  });
}

export function useRevokeOtherSessions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: accountApi.revokeOtherSessions,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: accountKeys.sessions }),
  });
}

export function useAuditEvents(limit = 30) {
  const queryClient = useQueryClient();
  const queryKey = accountKeys.auditEvents({ limit });
  const query = useInfiniteQuery({
    queryKey,
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam, signal }) =>
      accountApi.auditEvents({ limit, cursor: pageParam, signal }),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    retry: (failureCount, error) =>
      normalizeApiError(error).status !== 400 && failureCount < 1,
    meta: { requiresAuth: true },
  });

  async function loadNextPage() {
    try {
      const result = await query.fetchNextPage();
      if (result.isError && normalizeApiError(result.error).status === 400) {
        await queryClient.resetQueries({ queryKey, exact: true });
        return undefined;
      }
      return result;
    } catch (error) {
      if (normalizeApiError(error).status !== 400) throw error;
      await queryClient.resetQueries({ queryKey, exact: true });
      return undefined;
    }
  }

  return { ...query, loadNextPage };
}
