"use client";

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { publicCalculatorsApi } from "./api";
import { publicCalculatorKeys } from "./query-keys";
import type {
  CalculatorCourseFilters,
  CalculatorSessionInput,
  CalculatorTermOrLevelInput,
  CreatorCalculatorDetail,
} from "./types";

export function useCreatorCalculators() {
  return useQuery({
    queryKey: publicCalculatorKeys.creatorList(),
    queryFn: ({ signal }) => publicCalculatorsApi.creatorList(signal),
    meta: { requiresAuth: true },
  });
}

export function useCreatorCalculator(calculatorId: string) {
  return useQuery({
    queryKey: publicCalculatorKeys.creatorDetail(calculatorId),
    queryFn: ({ signal }) =>
      publicCalculatorsApi.creatorDetail(calculatorId, signal),
    enabled: Boolean(calculatorId),
    meta: { requiresAuth: true },
  });
}

export function useCreateCalculator() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: publicCalculatorsApi.create,
    retry: false,
    onSuccess: async (calculator) => {
      client.setQueryData(
        publicCalculatorKeys.creatorDetail(calculator.id),
        calculator,
      );
      await client.invalidateQueries({
        queryKey: publicCalculatorKeys.creatorList(),
      });
    },
  });
}

async function invalidateCreator(
  client: ReturnType<typeof useQueryClient>,
  calculatorId: string,
  includePublic = true,
) {
  await Promise.all([
    client.invalidateQueries({
      queryKey: publicCalculatorKeys.creatorList(),
    }),
    client.invalidateQueries({
      queryKey: publicCalculatorKeys.creatorDetail(calculatorId),
      exact: true,
    }),
    ...(includePublic
      ? [
          client.invalidateQueries({
            queryKey: publicCalculatorKeys.catalogues,
          }),
          client.invalidateQueries({
            queryKey: publicCalculatorKeys.publicDetail(calculatorId),
            exact: true,
          }),
        ]
      : []),
  ]);
}

export function useCalculatorMutations(calculatorId: string) {
  const client = useQueryClient();
  const refresh = (calculator?: CreatorCalculatorDetail) => {
    if (calculator)
      client.setQueryData(
        publicCalculatorKeys.creatorDetail(calculatorId),
        calculator,
      );
    return invalidateCreator(client, calculatorId);
  };
  return {
    update: useMutation({
      mutationFn: (input: Parameters<typeof publicCalculatorsApi.update>[1]) =>
        publicCalculatorsApi.update(calculatorId, input),
      retry: false,
      onSuccess: refresh,
    }),
    publish: useMutation({
      mutationFn: () => publicCalculatorsApi.publish(calculatorId),
      retry: false,
      onSuccess: refresh,
    }),
    unpublish: useMutation({
      mutationFn: () => publicCalculatorsApi.unpublish(calculatorId),
      retry: false,
      onSuccess: refresh,
    }),
    remove: useMutation({
      mutationFn: () => publicCalculatorsApi.remove(calculatorId),
      retry: false,
      onSuccess: async () => {
        client.removeQueries({
          queryKey: publicCalculatorKeys.creatorDetail(calculatorId),
          exact: true,
        });
        await Promise.all([
          client.invalidateQueries({
            queryKey: publicCalculatorKeys.creatorList(),
          }),
          client.invalidateQueries({
            queryKey: publicCalculatorKeys.catalogues,
          }),
          client.invalidateQueries({
            queryKey: publicCalculatorKeys.publicDetail(calculatorId),
            exact: true,
          }),
        ]);
      },
    }),
  };
}

type Resource = "sessions" | "terms" | "levels";

export function useCalculatorResource(
  calculatorId: string,
  resource: Resource,
) {
  return useQuery({
    queryKey: publicCalculatorKeys.resource(calculatorId, resource),
    queryFn: ({ signal }) =>
      resource === "sessions"
        ? publicCalculatorsApi.sessions(calculatorId, signal)
        : resource === "terms"
          ? publicCalculatorsApi.terms(calculatorId, signal)
          : publicCalculatorsApi.levels(calculatorId, signal),
    enabled: Boolean(calculatorId),
    meta: { requiresAuth: true },
  });
}

export function useCalculatorResourceMutations(
  calculatorId: string,
  resource: Resource,
) {
  const client = useQueryClient();
  const refresh = async () => {
    await Promise.all([
      client.invalidateQueries({
        queryKey: publicCalculatorKeys.resource(calculatorId, resource),
      }),
      invalidateCreator(client, calculatorId),
    ]);
  };
  return {
    create: useMutation({
      mutationFn: (
        input: CalculatorSessionInput | CalculatorTermOrLevelInput,
      ) =>
        resource === "sessions"
          ? publicCalculatorsApi.createSession(
              calculatorId,
              input as CalculatorSessionInput,
            )
          : resource === "terms"
            ? publicCalculatorsApi.createTerm(
                calculatorId,
                input as CalculatorTermOrLevelInput,
              )
            : publicCalculatorsApi.createLevel(
                calculatorId,
                input as CalculatorTermOrLevelInput,
              ),
      retry: false,
      onSuccess: refresh,
    }),
    update: useMutation({
      mutationFn: ({
        resourceId,
        input,
      }: {
        resourceId: string;
        input: Partial<CalculatorSessionInput | CalculatorTermOrLevelInput>;
      }) =>
        resource === "sessions"
          ? publicCalculatorsApi.updateSession(calculatorId, resourceId, input)
          : resource === "terms"
            ? publicCalculatorsApi.updateTerm(calculatorId, resourceId, input)
            : publicCalculatorsApi.updateLevel(calculatorId, resourceId, input),
      retry: false,
      onSuccess: refresh,
    }),
    remove: useMutation({
      mutationFn: (resourceId: string) =>
        resource === "sessions"
          ? publicCalculatorsApi.removeSession(calculatorId, resourceId)
          : resource === "terms"
            ? publicCalculatorsApi.removeTerm(calculatorId, resourceId)
            : publicCalculatorsApi.removeLevel(calculatorId, resourceId),
      retry: false,
      onSuccess: refresh,
    }),
  };
}

export function useCalculatorCourses(
  calculatorId: string,
  filters: CalculatorCourseFilters = {},
) {
  return useQuery({
    queryKey: publicCalculatorKeys.courses(calculatorId, filters),
    queryFn: ({ signal }) =>
      publicCalculatorsApi.courses(calculatorId, filters, signal),
    enabled: Boolean(calculatorId),
    meta: { requiresAuth: true },
  });
}

export function useCalculatorCourseMutations(calculatorId: string) {
  const client = useQueryClient();
  const refresh = async () => {
    await Promise.all([
      client.invalidateQueries({
        queryKey: publicCalculatorKeys.coursePrefix(calculatorId),
      }),
      invalidateCreator(client, calculatorId),
    ]);
  };
  return {
    create: useMutation({
      mutationFn: (
        input: Parameters<typeof publicCalculatorsApi.createCourse>[1],
      ) => publicCalculatorsApi.createCourse(calculatorId, input),
      retry: false,
      onSuccess: refresh,
    }),
    update: useMutation({
      mutationFn: ({
        courseId,
        input,
      }: {
        courseId: string;
        input: Parameters<typeof publicCalculatorsApi.updateCourse>[2];
      }) => publicCalculatorsApi.updateCourse(calculatorId, courseId, input),
      retry: false,
      onSuccess: refresh,
    }),
    remove: useMutation({
      mutationFn: (courseId: string) =>
        publicCalculatorsApi.removeCourse(calculatorId, courseId),
      retry: false,
      onSuccess: refresh,
    }),
  };
}

export function usePublicCalculatorCatalogue(limit = 20) {
  return useInfiniteQuery({
    queryKey: publicCalculatorKeys.catalogue(limit),
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam, signal }) =>
      publicCalculatorsApi.publicCatalogue({
        limit,
        cursor: pageParam,
        signal,
      }),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    meta: { requiresAuth: false },
  });
}

export function usePublicCalculator(calculatorId: string) {
  return useQuery({
    queryKey: publicCalculatorKeys.publicDetail(calculatorId),
    queryFn: ({ signal }) =>
      publicCalculatorsApi.publicDetail(calculatorId, signal),
    enabled: Boolean(calculatorId),
    meta: { requiresAuth: false },
  });
}

export function usePublicCalculation(calculatorId: string) {
  return useMutation({
    mutationFn: (input: Parameters<typeof publicCalculatorsApi.calculate>[1]) =>
      publicCalculatorsApi.calculate(calculatorId, input),
    retry: false,
  });
}
