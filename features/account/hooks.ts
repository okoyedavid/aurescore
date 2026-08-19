"use client";

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { normalizeApiError } from "@/lib/api/errors";
import { accountApi } from "./api";
import { accountKeys } from "./query-keys";
import type { AccountUser } from "./types";

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
    onSuccess: (user) => queryClient.setQueryData(accountKeys.me, user),
  });
}

export function useUpdatePreferences() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: accountApi.updatePreferences,
    onSuccess: (preferences) => {
      queryClient.setQueryData<AccountUser | null>(accountKeys.me, (current) =>
        current ? { ...current, preferences } : current,
      );
    },
  });
}

export function useChangePassword() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: accountApi.changePassword,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: accountKeys.sessions }),
  });
}

export function useRequestEmailChange() {
  return useMutation({ mutationFn: accountApi.requestEmailChange });
}

export function useConfirmEmailChange() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: accountApi.confirmEmailChange,
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
