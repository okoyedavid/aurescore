"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { workspaceApi } from "./api";
import { workspaceKeys } from "./query-keys";
import type { WorkspaceDetails } from "./types";

export function useWorkspaces() {
  return useQuery({
    queryKey: workspaceKeys.all,
    queryFn: ({ signal }) => workspaceApi.list(signal),
    meta: { requiresAuth: true },
  });
}
export function useWorkspace(workspaceId: string) {
  return useQuery({
    queryKey: workspaceKeys.detail(workspaceId),
    queryFn: ({ signal }) => workspaceApi.detail(workspaceId, signal),
    enabled: Boolean(workspaceId),
    meta: { requiresAuth: true },
  });
}
export function useCreateWorkspace() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: workspaceApi.create,
    retry: false,
    onSuccess: async (workspace) => {
      client.setQueryData(workspaceKeys.detail(workspace.id), workspace);
      await client.invalidateQueries({ queryKey: workspaceKeys.all });
    },
  });
}
export function usePatchWorkspace(workspaceId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: Parameters<typeof workspaceApi.patch>[1]) =>
      workspaceApi.patch(workspaceId, input),
    retry: false,
    onSuccess: async (workspace) => {
      client.setQueryData<WorkspaceDetails>(
        workspaceKeys.detail(workspaceId),
        workspace,
      );
      await client.invalidateQueries({ queryKey: workspaceKeys.all });
    },
  });
}
export function useDeleteWorkspace(workspaceId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: () => workspaceApi.remove(workspaceId),
    retry: false,
    onSuccess: async () => {
      client.removeQueries({ queryKey: ["workspace", workspaceId] });
      await client.invalidateQueries({ queryKey: workspaceKeys.all });
    },
  });
}

async function invalidateChild(
  client: ReturnType<typeof useQueryClient>,
  workspaceId: string,
  kind: "sessions" | "levels" | "courses",
) {
  await Promise.all([
    client.invalidateQueries({ queryKey: workspaceKeys[kind](workspaceId) }),
    client.invalidateQueries({
      queryKey: workspaceKeys.detail(workspaceId),
      exact: true,
    }),
  ]);
}

export function useSessions(workspaceId: string) {
  return useQuery({
    queryKey: workspaceKeys.sessions(workspaceId),
    queryFn: ({ signal }) => workspaceApi.sessions(workspaceId, signal),
    enabled: Boolean(workspaceId),
    meta: { requiresAuth: true },
  });
}
export function useSessionMutations(workspaceId: string) {
  const client = useQueryClient();
  const done = () => invalidateChild(client, workspaceId, "sessions");
  return {
    create: useMutation({
      mutationFn: (input: Parameters<typeof workspaceApi.createSession>[1]) =>
        workspaceApi.createSession(workspaceId, input),
      retry: false,
      onSuccess: done,
    }),
    update: useMutation({
      mutationFn: ({
        sessionId,
        input,
      }: {
        sessionId: string;
        input: Parameters<typeof workspaceApi.updateSession>[2];
      }) => workspaceApi.updateSession(workspaceId, sessionId, input),
      retry: false,
      onSuccess: done,
    }),
    remove: useMutation({
      mutationFn: (sessionId: string) =>
        workspaceApi.removeSession(workspaceId, sessionId),
      retry: false,
      onSuccess: done,
    }),
  };
}
export function useLevels(workspaceId: string) {
  return useQuery({
    queryKey: workspaceKeys.levels(workspaceId),
    queryFn: ({ signal }) => workspaceApi.levels(workspaceId, signal),
    enabled: Boolean(workspaceId),
    meta: { requiresAuth: true },
  });
}
export function useLevelMutations(workspaceId: string) {
  const client = useQueryClient();
  const done = () => invalidateChild(client, workspaceId, "levels");
  return {
    create: useMutation({
      mutationFn: (input: Parameters<typeof workspaceApi.createLevel>[1]) =>
        workspaceApi.createLevel(workspaceId, input),
      retry: false,
      onSuccess: done,
    }),
    update: useMutation({
      mutationFn: ({
        levelId,
        input,
      }: {
        levelId: string;
        input: Parameters<typeof workspaceApi.updateLevel>[2];
      }) => workspaceApi.updateLevel(workspaceId, levelId, input),
      retry: false,
      onSuccess: done,
    }),
    remove: useMutation({
      mutationFn: (levelId: string) =>
        workspaceApi.removeLevel(workspaceId, levelId),
      retry: false,
      onSuccess: done,
    }),
  };
}
export function useCourses(workspaceId: string) {
  return useQuery({
    queryKey: workspaceKeys.courses(workspaceId),
    queryFn: ({ signal }) => workspaceApi.courses(workspaceId, signal),
    enabled: Boolean(workspaceId),
    meta: { requiresAuth: true },
  });
}
export function useCourseMutations(workspaceId: string) {
  const client = useQueryClient();
  const done = () => invalidateChild(client, workspaceId, "courses");
  return {
    create: useMutation({
      mutationFn: (input: Parameters<typeof workspaceApi.createCourse>[1]) =>
        workspaceApi.createCourse(workspaceId, input),
      retry: false,
      onSuccess: done,
    }),
    update: useMutation({
      mutationFn: ({
        courseId,
        input,
      }: {
        courseId: string;
        input: Parameters<typeof workspaceApi.updateCourse>[2];
      }) => workspaceApi.updateCourse(workspaceId, courseId, input),
      retry: false,
      onSuccess: done,
    }),
    remove: useMutation({
      mutationFn: (courseId: string) =>
        workspaceApi.removeCourse(workspaceId, courseId),
      retry: false,
      onSuccess: done,
    }),
  };
}
