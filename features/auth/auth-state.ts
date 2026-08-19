import type { QueryClient } from "@tanstack/react-query";
import { accountApi } from "@/features/account/api";
import { accountKeys } from "@/features/account/query-keys";
import type { AuthUser } from "./types";

export const authUserQueryKey = accountKeys.me;

export function cacheAuthenticatedUser(
  queryClient: QueryClient,
  user: AuthUser,
) {
  queryClient.setQueryData(authUserQueryKey, user);
}

function isAuthUserQuery(queryKey: readonly unknown[]) {
  return (
    queryKey.length === authUserQueryKey.length &&
    queryKey.every((part, index) => part === authUserQueryKey[index])
  );
}

export function clearAuthenticatedUser(queryClient: QueryClient) {
  queryClient.setQueryData(authUserQueryKey, null);
  queryClient.removeQueries({
    predicate: (query) =>
      query.meta?.requiresAuth === true &&
      !(
        query.queryKey[0] === authUserQueryKey[0] &&
        query.queryKey[1] === authUserQueryKey[1]
      ),
  });
}

export function invalidateAuthenticatedQueries(queryClient: QueryClient) {
  return queryClient.invalidateQueries({
    predicate: (query) =>
      query.meta?.requiresAuth === true && !isAuthUserQuery(query.queryKey),
  });
}

export async function hydrateAuthenticatedUser(queryClient: QueryClient) {
  await queryClient.invalidateQueries({
    queryKey: authUserQueryKey,
    exact: true,
    refetchType: "none",
  });
  const user = await queryClient.fetchQuery({
    queryKey: authUserQueryKey,
    queryFn: ({ signal }) => accountApi.currentUser(signal),
    staleTime: 0,
  });

  if (!user) {
    throw new Error("The authenticated session could not be confirmed.");
  }

  return user;
}
