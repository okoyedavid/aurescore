import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import MockAdapter from "axios-mock-adapter";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it } from "vitest";
import { apiClient } from "@/lib/api/client";
import { workspaceApi } from "./api";
import { useTermMutations } from "./hooks";
import { workspaceKeys } from "./query-keys";
import { useGradingSchemeMutations } from "./records-hooks";
import type { GradingScheme, Term } from "./types";

const apiMock = new MockAdapter(apiClient);
const term: Term = {
  id: "cm-term",
  workspaceId: "cm-one",
  name: "First Semester",
  code: "SEM1",
  order: 1,
  metadata: null,
  createdAt: "",
  updatedAt: "",
};
const grading: GradingScheme = {
  id: "cm-grading",
  workspaceId: "cm-one",
  name: "Scale",
  maxGradePoint: "5.00",
  bands: [{ label: "F", minScore: 0, gradePoint: 0 }],
  createdAt: "",
  updatedAt: "",
};

function renderClient(ui: ReactNode, setup?: (client: QueryClient) => void) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  setup?.(client);
  render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
  return client;
}

describe("academic configuration API and cache scope", () => {
  beforeEach(() => apiMock.reset());

  it("uses singular workspace term routes without relation IDs in bodies", async () => {
    apiMock.onGet().reply(200, [term]);
    apiMock.onPost().reply(201, term);
    apiMock.onPatch().reply(200, { ...term, name: "Semester One" });
    apiMock.onDelete().reply(204);
    await workspaceApi.terms("cm/work");
    await workspaceApi.createTerm("cm/work", {
      name: "First Semester",
    });
    await workspaceApi.updateTerm("cm/work", "cm/term", {
      name: "Semester One",
    });
    await workspaceApi.removeTerm("cm/work", "cm/term");
    expect(
      apiMock.history.map((request) => `${request.method} ${request.url}`),
    ).toEqual([
      "get /workspace/cm%2Fwork/terms",
      "post /workspace/cm%2Fwork/terms",
      "patch /workspace/cm%2Fwork/terms/cm%2Fterm",
      "delete /workspace/cm%2Fwork/terms/cm%2Fterm",
    ]);
    expect(JSON.parse(apiMock.history.post[0].data)).toEqual({
      name: "First Semester",
    });
    expect(JSON.parse(apiMock.history.patch[0].data)).toEqual({
      name: "Semester One",
    });
  });

  it("invalidates only the workspace term collection and seeds its detail", async () => {
    apiMock.onPost("/workspace/cm-one/terms").reply(201, term);
    function Probe() {
      const create = useTermMutations("cm-one").create;
      return (
        <button onClick={() => create.mutate({ name: "First Semester" })}>
          Create term
        </button>
      );
    }
    const client = renderClient(<Probe />, (cache) => {
      cache.setQueryData(workspaceKeys.terms("cm-one"), []);
      cache.setQueryData(workspaceKeys.terms("cm-two"), []);
    });
    fireEvent.click(screen.getByRole("button", { name: "Create term" }));
    await waitFor(() =>
      expect(
        client.getQueryState(workspaceKeys.terms("cm-one"))?.isInvalidated,
      ).toBe(true),
    );
    expect(client.getQueryData(workspaceKeys.term("cm-one", term.id))).toEqual(
      term,
    );
    expect(
      client.getQueryState(workspaceKeys.terms("cm-two"))?.isInvalidated,
    ).toBe(false);
  });

  it("keeps grading scheme invalidation isolated to its workspace", async () => {
    apiMock.onPost("/workspace/cm-one/grading-schemes").reply(201, grading);
    function Probe() {
      const create = useGradingSchemeMutations("cm-one").create;
      return (
        <button
          onClick={() =>
            create.mutate({
              name: "Scale",
              maxGradePoint: 5,
              bands: [{ label: "F", minScore: 0, gradePoint: 0 }],
            })
          }
        >
          Create grading
        </button>
      );
    }
    const client = renderClient(<Probe />, (cache) => {
      cache.setQueryData(workspaceKeys.gradingSchemes("cm-one"), []);
      cache.setQueryData(workspaceKeys.gradingSchemes("cm-two"), []);
    });
    fireEvent.click(screen.getByRole("button", { name: "Create grading" }));
    await waitFor(() =>
      expect(
        client.getQueryState(workspaceKeys.gradingSchemes("cm-one"))
          ?.isInvalidated,
      ).toBe(true),
    );
    expect(
      client.getQueryData(workspaceKeys.gradingScheme("cm-one", grading.id)),
    ).toEqual(grading);
    expect(
      client.getQueryState(workspaceKeys.gradingSchemes("cm-two"))
        ?.isInvalidated,
    ).toBe(false);
  });

  it.each([
    [404, "Resource not found."],
    [409, "A course offering still uses this resource."],
    [429, "Too many requests. Try again shortly."],
  ] as const)(
    "preserves safe server messages for %s",
    async (status, message) => {
      apiMock.onGet("/workspace/cm-one/terms").reply(status, { message });
      await expect(workspaceApi.terms("cm-one")).rejects.toMatchObject({
        status,
        message,
      });
    },
  );
});
