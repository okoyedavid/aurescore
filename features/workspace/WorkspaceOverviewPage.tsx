"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, CalendarDays, Layers3, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/FormField";
import { normalizeApiError } from "@/lib/api/errors";
import WorkspaceChrome from "./components/WorkspaceChrome";
import { RequestError } from "./components/FieldError";
import { useDeleteWorkspace } from "./hooks";
import type { WorkspaceDetails } from "./types";

function DangerZone({ workspace }: { workspace: WorkspaceDetails }) {
  const router = useRouter();
  const remove = useDeleteWorkspace(workspace.id);
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  async function confirm() {
    if (confirmation !== workspace.name || remove.isPending) return;
    try {
      await remove.mutateAsync();
      router.replace("/workspace");
    } catch {}
  }
  return (
    <section className="mt-6 rounded-xl border border-red-300/70 p-6">
      <h2 className="font-display text-xl font-semibold">Delete workspace</h2>
      <p className="mt-2 text-sm text-[var(--app-muted)]">
        Permanently removes this workspace and all of its private sessions,
        levels, courses, and related data.
      </p>
      <Button
        className="mt-5 bg-red-700 hover:bg-red-600"
        onClick={() => {
          remove.reset();
          setConfirmation("");
          setOpen(true);
        }}
      >
        <Trash2 size={16} />
        Delete {workspace.name}
      </Button>
      <Dialog
        open={open}
        onClose={() => !remove.isPending && setOpen(false)}
        title={`Delete “${workspace.name}”?`}
        description="This permanently cascades through all private data in this workspace. This action cannot be undone."
      >
        <label className="block text-sm font-semibold">
          Type the workspace name to confirm
          <Input
            autoFocus
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
            className="mt-2"
          />
        </label>
        <RequestError>
          {remove.isError ? normalizeApiError(remove.error).message : undefined}
        </RequestError>
        <div className="mt-5 flex justify-end gap-3">
          <Button
            variant="outline"
            disabled={remove.isPending}
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
          <Button
            className="bg-red-700 hover:bg-red-600"
            disabled={remove.isPending || confirmation !== workspace.name}
            onClick={() => void confirm()}
          >
            {remove.isPending
              ? "Deleting workspace…"
              : "Delete workspace and private data"}
          </Button>
        </div>
      </Dialog>
    </section>
  );
}

export default function WorkspaceOverviewPage({
  workspaceId,
}: {
  workspaceId: string;
}) {
  return (
    <WorkspaceChrome workspaceId={workspaceId}>
      {(workspace) => (
        <>
          <section className="grid gap-4 sm:grid-cols-3">
            {[
              {
                label: "Sessions",
                value: workspace.sessions.length,
                icon: CalendarDays,
              },
              {
                label: "Levels",
                value: workspace.levels.length,
                icon: Layers3,
              },
              {
                label: "Courses",
                value: workspace.courses.length,
                icon: BookOpen,
              },
            ].map(({ label, value, icon: Icon }) => (
              <article
                key={label}
                className="app-panel rounded-xl border border-[var(--app-border)] p-5"
              >
                <Icon size={20} className="text-blue-500" />
                <p className="mt-5 text-xs text-[var(--app-muted)]">{label}</p>
                <p className="mt-1 font-display text-3xl font-semibold">
                  {value}
                </p>
              </article>
            ))}
          </section>
          <section className="app-panel mt-6 rounded-xl border border-[var(--app-border)] p-6">
            <h2 className="font-display text-xl font-semibold">
              Workspace privacy
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--app-muted)]">
              All resources shown here are scoped to this workspace. Access is
              checked by the server on every request.
            </p>
          </section>
          <DangerZone workspace={workspace} />
        </>
      )}
    </WorkspaceChrome>
  );
}
