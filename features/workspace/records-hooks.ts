"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { recordsApi } from "./records-api";
import { workspaceKeys } from "./query-keys";
import type {
  AssessmentScheme,
  CourseOffering,
  ResultRecord,
  Student,
} from "./types";

export function useAssessmentSchemes(workspaceId: string) {
  return useQuery({
    queryKey: workspaceKeys.assessmentSchemes(workspaceId),
    queryFn: ({ signal }) => recordsApi.assessmentSchemes(workspaceId, signal),
    enabled: Boolean(workspaceId),
    meta: { requiresAuth: true },
  });
}

export function useAssessmentSchemeMutations(workspaceId: string) {
  const client = useQueryClient();
  const refresh = () =>
    client.invalidateQueries({
      queryKey: workspaceKeys.assessmentSchemes(workspaceId),
    });
  return {
    create: useMutation({
      mutationFn: (
        input: Parameters<typeof recordsApi.createAssessmentScheme>[1],
      ) => recordsApi.createAssessmentScheme(workspaceId, input),
      retry: false,
      onSuccess: async (scheme) => {
        client.setQueryData(
          workspaceKeys.assessmentScheme(workspaceId, scheme.id),
          scheme,
        );
        await refresh();
      },
    }),
    update: useMutation({
      mutationFn: ({
        id,
        input,
      }: {
        id: string;
        input: Parameters<typeof recordsApi.updateAssessmentScheme>[2];
      }) => recordsApi.updateAssessmentScheme(workspaceId, id, input),
      retry: false,
      onSuccess: async (scheme) => {
        client.setQueryData<AssessmentScheme>(
          workspaceKeys.assessmentScheme(workspaceId, scheme.id),
          scheme,
        );
        await refresh();
      },
    }),
    remove: useMutation({
      mutationFn: (id: string) =>
        recordsApi.removeAssessmentScheme(workspaceId, id),
      retry: false,
      onSuccess: async (_, id) => {
        client.removeQueries({
          queryKey: workspaceKeys.assessmentScheme(workspaceId, id),
          exact: true,
        });
        await refresh();
      },
    }),
  };
}

export function useStudents(workspaceId: string) {
  return useQuery({
    queryKey: workspaceKeys.students(workspaceId),
    queryFn: ({ signal }) => recordsApi.students(workspaceId, signal),
    enabled: Boolean(workspaceId),
    meta: { requiresAuth: true },
  });
}

export function useStudentMutations(workspaceId: string) {
  const client = useQueryClient();
  const refresh = () =>
    client.invalidateQueries({ queryKey: workspaceKeys.students(workspaceId) });
  return {
    create: useMutation({
      mutationFn: (input: Parameters<typeof recordsApi.createStudent>[1]) =>
        recordsApi.createStudent(workspaceId, input),
      retry: false,
      onSuccess: async (student) => {
        client.setQueryData(
          workspaceKeys.student(workspaceId, student.id),
          student,
        );
        await refresh();
      },
    }),
    update: useMutation({
      mutationFn: ({
        id,
        input,
      }: {
        id: string;
        input: Parameters<typeof recordsApi.updateStudent>[2];
      }) => recordsApi.updateStudent(workspaceId, id, input),
      retry: false,
      onSuccess: async (student) => {
        client.setQueryData<Student>(
          workspaceKeys.student(workspaceId, student.id),
          student,
        );
        await refresh();
      },
    }),
    remove: useMutation({
      mutationFn: (id: string) => recordsApi.removeStudent(workspaceId, id),
      retry: false,
      onSuccess: async (_, id) => {
        client.removeQueries({
          queryKey: workspaceKeys.student(workspaceId, id),
          exact: true,
        });
        await refresh();
      },
    }),
  };
}

export function useCourseOfferings(workspaceId: string) {
  return useQuery({
    queryKey: workspaceKeys.courseOfferings(workspaceId),
    queryFn: ({ signal }) => recordsApi.courseOfferings(workspaceId, signal),
    enabled: Boolean(workspaceId),
    meta: { requiresAuth: true },
  });
}

export function useResolveCourseOffering(workspaceId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (
      input: Parameters<typeof recordsApi.resolveCourseOffering>[1],
    ) => recordsApi.resolveCourseOffering(workspaceId, input),
    retry: false,
    onSuccess: async (offering) => {
      client.setQueryData<CourseOffering>(
        workspaceKeys.courseOffering(workspaceId, offering.id),
        offering,
      );
      await client.invalidateQueries({
        queryKey: workspaceKeys.courseOfferings(workspaceId),
      });
    },
  });
}

export function useResults(workspaceId: string) {
  return useQuery({
    queryKey: workspaceKeys.results(workspaceId),
    queryFn: ({ signal }) => recordsApi.results(workspaceId, signal),
    enabled: Boolean(workspaceId),
    meta: { requiresAuth: true },
  });
}

export function useResultMutations(workspaceId: string) {
  const client = useQueryClient();
  const refresh = () =>
    client.invalidateQueries({ queryKey: workspaceKeys.results(workspaceId) });
  return {
    create: useMutation({
      mutationFn: (input: Parameters<typeof recordsApi.createResult>[1]) =>
        recordsApi.createResult(workspaceId, input),
      retry: false,
      onSuccess: async (result) => {
        client.setQueryData(
          workspaceKeys.result(workspaceId, result.id),
          result,
        );
        await refresh();
      },
    }),
    update: useMutation({
      mutationFn: ({
        id,
        input,
      }: {
        id: string;
        input: Parameters<typeof recordsApi.updateResult>[2];
      }) => recordsApi.updateResult(workspaceId, id, input),
      retry: false,
      onSuccess: async (result) => {
        client.setQueryData<ResultRecord>(
          workspaceKeys.result(workspaceId, result.id),
          result,
        );
        await refresh();
      },
    }),
    remove: useMutation({
      mutationFn: (id: string) => recordsApi.removeResult(workspaceId, id),
      retry: false,
      onSuccess: async (_, id) => {
        client.removeQueries({
          queryKey: workspaceKeys.result(workspaceId, id),
          exact: true,
        });
        await refresh();
      },
    }),
  };
}
