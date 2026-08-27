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

function bumpAcademicRevision(
  client: ReturnType<typeof useQueryClient>,
  workspaceId: string,
) {
  client.setQueryData<number>(
    workspaceKeys.academicRevision(workspaceId),
    (current = 0) => current + 1,
  );
}

export function useAcademicRevision(workspaceId: string) {
  return useQuery({
    queryKey: workspaceKeys.academicRevision(workspaceId),
    queryFn: () => 0,
    initialData: 0,
    staleTime: Infinity,
  });
}

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
        bumpAcademicRevision(client, workspaceId);
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
        bumpAcademicRevision(client, workspaceId);
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
        bumpAcademicRevision(client, workspaceId);
        await refresh();
      },
    }),
  };
}

export function useGradingSchemes(workspaceId: string) {
  return useQuery({
    queryKey: workspaceKeys.gradingSchemes(workspaceId),
    queryFn: ({ signal }) => recordsApi.gradingSchemes(workspaceId, signal),
    enabled: Boolean(workspaceId),
    meta: { requiresAuth: true },
  });
}

export function useGradingSchemeMutations(workspaceId: string) {
  const client = useQueryClient();
  const refresh = () =>
    client.invalidateQueries({
      queryKey: workspaceKeys.gradingSchemes(workspaceId),
      exact: true,
    });
  return {
    create: useMutation({
      mutationFn: (
        input: Parameters<typeof recordsApi.createGradingScheme>[1],
      ) => recordsApi.createGradingScheme(workspaceId, input),
      retry: false,
      onSuccess: async (scheme) => {
        client.setQueryData(
          workspaceKeys.gradingScheme(workspaceId, scheme.id),
          scheme,
        );
        bumpAcademicRevision(client, workspaceId);
        await client.invalidateQueries({
          queryKey: workspaceKeys.academicRecords(workspaceId),
        });
        await refresh();
      },
    }),
    update: useMutation({
      mutationFn: ({
        id,
        input,
      }: {
        id: string;
        input: Parameters<typeof recordsApi.updateGradingScheme>[2];
      }) => recordsApi.updateGradingScheme(workspaceId, id, input),
      retry: false,
      onSuccess: async (scheme) => {
        client.setQueryData(
          workspaceKeys.gradingScheme(workspaceId, scheme.id),
          scheme,
        );
        bumpAcademicRevision(client, workspaceId);
        await client.invalidateQueries({
          queryKey: workspaceKeys.academicRecords(workspaceId),
        });
        await refresh();
      },
    }),
    remove: useMutation({
      mutationFn: (id: string) =>
        recordsApi.removeGradingScheme(workspaceId, id),
      retry: false,
      onSuccess: async (_, id) => {
        client.removeQueries({
          queryKey: workspaceKeys.gradingScheme(workspaceId, id),
          exact: true,
        });
        bumpAcademicRevision(client, workspaceId);
        await client.invalidateQueries({
          queryKey: workspaceKeys.academicRecords(workspaceId),
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

export function useUpdateCourseOfferingConfiguration(workspaceId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: Parameters<typeof recordsApi.updateCourseOfferingConfiguration>[2];
    }) => recordsApi.updateCourseOfferingConfiguration(workspaceId, id, input),
    retry: false,
    onSuccess: async (offering) => {
      client.setQueryData<CourseOffering>(
        workspaceKeys.courseOffering(workspaceId, offering.id),
        offering,
      );
      bumpAcademicRevision(client, workspaceId);
      await Promise.all([
        client.invalidateQueries({
          queryKey: workspaceKeys.courseOfferings(workspaceId),
          exact: true,
        }),
        client.invalidateQueries({
          queryKey: workspaceKeys.results(workspaceId),
          exact: true,
        }),
        client.invalidateQueries({
          queryKey: workspaceKeys.academicRecords(workspaceId),
        }),
      ]);
    },
  });
}

export function useCalculateGpa(workspaceId: string) {
  return useMutation({
    mutationFn: (input: Parameters<typeof recordsApi.calculateGpa>[1]) =>
      recordsApi.calculateGpa(workspaceId, input),
    retry: false,
  });
}

export function useSaveGpa(workspaceId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: Parameters<typeof recordsApi.saveGpa>[1]) =>
      recordsApi.saveGpa(workspaceId, input),
    retry: false,
    onSuccess: async (response) => {
      if (!response.ready || !("summary" in response)) return;
      await client.invalidateQueries({
        queryKey: workspaceKeys.academicRecord(
          workspaceId,
          response.summary.studentId,
        ),
        exact: true,
      });
    },
  });
}

export function useSaveBatchGpa(workspaceId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: Parameters<typeof recordsApi.saveBatchGpa>[1]) =>
      recordsApi.saveBatchGpa(workspaceId, input),
    retry: false,
    onSuccess: async (response) => {
      if (!response.ready || !("savedSummaries" in response)) return;
      await Promise.all(
        response.savedSummaries.map((summary) =>
          client.invalidateQueries({
            queryKey: workspaceKeys.academicRecord(
              workspaceId,
              summary.studentId,
            ),
            exact: true,
          }),
        ),
      );
    },
  });
}

export function useStudentAcademicRecord(
  workspaceId: string,
  studentId: string,
) {
  return useQuery({
    queryKey: workspaceKeys.academicRecord(workspaceId, studentId),
    queryFn: ({ signal }) =>
      recordsApi.studentAcademicRecord(workspaceId, studentId, signal),
    enabled: Boolean(workspaceId && studentId),
    meta: { requiresAuth: true },
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
    Promise.all([
      client.invalidateQueries({
        queryKey: workspaceKeys.results(workspaceId),
        exact: true,
      }),
      client.invalidateQueries({
        queryKey: workspaceKeys.academicRecords(workspaceId),
      }),
    ]);
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
        bumpAcademicRevision(client, workspaceId);
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
        bumpAcademicRevision(client, workspaceId);
        await refresh();
      },
    }),
    remove: useMutation({
      mutationFn: ({ id }: { id: string; studentId: string }) =>
        recordsApi.removeResult(workspaceId, id),
      retry: false,
      onSuccess: async (_, { id, studentId }) => {
        client.removeQueries({
          queryKey: workspaceKeys.result(workspaceId, id),
          exact: true,
        });
        bumpAcademicRevision(client, workspaceId);
        await Promise.all([
          client.invalidateQueries({
            queryKey: workspaceKeys.results(workspaceId),
            exact: true,
          }),
          client.invalidateQueries({
            queryKey: workspaceKeys.academicRecord(workspaceId, studentId),
            exact: true,
          }),
        ]);
      },
    }),
  };
}
