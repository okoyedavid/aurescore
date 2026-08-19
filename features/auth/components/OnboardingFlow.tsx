"use client";

import {
  ArrowLeft,
  ArrowRight,
  Building2,
  GraduationCap,
  School,
  UserCog,
  UserRoundCheck,
  UsersRound,
} from "lucide-react";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/FormField";

type Role =
  | "student"
  | "lecturer"
  | "exam-officer"
  | "hod"
  | "dean"
  | "administrator";
type Setup = "institution" | "private";

const roles = [
  {
    id: "student" as Role,
    label: "Student",
    detail: "Join your institution to access approved results.",
    icon: GraduationCap,
  },
  {
    id: "lecturer" as Role,
    label: "Lecturer",
    detail: "Record and submit scores for your courses.",
    icon: School,
  },
  {
    id: "exam-officer" as Role,
    label: "Exam officer",
    detail: "Review submissions and coordinate results.",
    icon: UserRoundCheck,
  },
  {
    id: "hod" as Role,
    label: "Head of department",
    detail: "Oversee and approve departmental results.",
    icon: UsersRound,
  },
  {
    id: "dean" as Role,
    label: "Dean",
    detail: "Review academic results at faculty level.",
    icon: Building2,
  },
  {
    id: "administrator" as Role,
    label: "Administrator",
    detail: "Configure the institution and user access.",
    icon: UserCog,
  },
];

export default function OnboardingFlow() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [role, setRole] = useState<Role | null>(null);
  const [setup, setSetup] = useState<Setup>("institution");
  const student = role === "student";

  function finish(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    router.push("/dashboard");
  }

  return (
    <div className="onboarding-flow">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-700">
          Set up your workspace
        </p>
        <span className="text-xs font-semibold text-muted">{step} of 2</span>
      </div>
      <div className="mt-4 flex gap-2" aria-hidden="true">
        <span className="h-1 flex-1 rounded-full bg-blue-600" />
        <span
          className={`h-1 flex-1 rounded-full ${step === 2 ? "bg-blue-600" : "bg-line"}`}
        />
      </div>

      {step === 1 ? (
        <div className="mt-8">
          <h1 className="font-display text-4xl font-semibold">
            How will you use AureScore?
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Choose the role that best describes what you need to do.
          </p>
          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            {roles.map(({ id, label, detail, icon: Icon }) => (
              <button
                key={id}
                type="button"
                aria-pressed={role === id}
                onClick={() => setRole(id)}
                className={`focus-ring min-h-32 rounded-lg border p-4 text-left transition-colors ${role === id ? "border-blue-600 bg-blue-50" : "border-line bg-white hover:border-ink/25"}`}
              >
                <Icon
                  size={20}
                  className={role === id ? "text-blue-700" : "text-muted"}
                  aria-hidden="true"
                />
                <span className="mt-4 block text-sm font-semibold text-ink">
                  {label}
                </span>
                <span className="mt-1 block text-xs leading-relaxed text-muted">
                  {detail}
                </span>
              </button>
            ))}
          </div>
          <Button
            type="button"
            disabled={!role}
            onClick={() => setStep(2)}
            className="mt-7 w-full"
          >
            Continue <ArrowRight size={16} aria-hidden="true" />
          </Button>
        </div>
      ) : (
        <form onSubmit={finish} className="mt-8">
          <button
            type="button"
            onClick={() => setStep(1)}
            className="focus-ring inline-flex items-center gap-2 rounded text-sm font-semibold text-muted hover:text-ink"
          >
            <ArrowLeft size={16} aria-hidden="true" />
            Change role
          </button>
          {student ? (
            <div className="mt-7">
              <h1 className="font-display text-4xl font-semibold">
                Join your institution.
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                Enter the code provided by your institution. This connects your
                account to the right student workspace.
              </p>
              <label className="mt-7 block text-sm font-semibold">
                Institution code
                <Input
                  required
                  name="institutionCode"
                  autoCapitalize="characters"
                  className="mt-2 uppercase"
                  placeholder="e.g. AUR-2048"
                />
              </label>
              <p className="mt-3 text-xs leading-relaxed text-muted">
                Ask your institution&apos;s AureScore administrator if you do
                not have a code.
              </p>
            </div>
          ) : (
            <div className="mt-7">
              <h1 className="font-display text-4xl font-semibold">
                Where will you work?
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                Connect to an institution or create a private workspace for
                recording scores independently.
              </p>
              <div className="mt-7 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  aria-pressed={setup === "institution"}
                  onClick={() => setSetup("institution")}
                  className={`focus-ring rounded-lg border p-5 text-left ${setup === "institution" ? "border-blue-600 bg-blue-50" : "border-line"}`}
                >
                  <Building2
                    size={21}
                    className="text-blue-700"
                    aria-hidden="true"
                  />
                  <span className="mt-4 block text-sm font-semibold">
                    Institution
                  </span>
                  <span className="mt-1 block text-xs leading-relaxed text-muted">
                    Join or set up an academic institution.
                  </span>
                </button>
                <button
                  type="button"
                  aria-pressed={setup === "private"}
                  onClick={() => setSetup("private")}
                  className={`focus-ring rounded-lg border p-5 text-left ${setup === "private" ? "border-blue-600 bg-blue-50" : "border-line"}`}
                >
                  <UserCog
                    size={21}
                    className="text-orange"
                    aria-hidden="true"
                  />
                  <span className="mt-4 block text-sm font-semibold">
                    Private workspace
                  </span>
                  <span className="mt-1 block text-xs leading-relaxed text-muted">
                    Record and compute scores for personal use.
                  </span>
                </button>
              </div>
              {setup === "institution" && (
                <label className="mt-6 block text-sm font-semibold">
                  Institution name
                  <Input
                    required
                    name="institutionName"
                    autoComplete="organization"
                    className="mt-2"
                    placeholder="Enter your institution name"
                  />
                </label>
              )}
              {setup === "private" && (
                <label className="mt-6 block text-sm font-semibold">
                  Workspace name
                  <Input
                    required
                    name="workspaceName"
                    className="mt-2"
                    placeholder="e.g. My score records"
                  />
                </label>
              )}
            </div>
          )}
          <Button type="submit" className="mt-7 w-full">
            Finish setup <ArrowRight size={16} aria-hidden="true" />
          </Button>
        </form>
      )}
    </div>
  );
}
