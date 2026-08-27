import AppShell from "./AppShell";
import type { AppArea } from "../navigation";

export default function PlaceholderPage({
  area,
  eyebrow,
  title,
  copy,
}: {
  area: AppArea;
  eyebrow: string;
  title: string;
  copy: string;
}) {
  return (
    <AppShell area={area}>
      <div className="mx-auto w-full max-w-[1500px] px-[clamp(20px,4.5vw,72px)] pb-[72px] pt-[clamp(28px,4vw,58px)] max-[900px]:px-5 max-[900px]:pb-14 max-[900px]:pt-7">
        <header className="border-b border-[var(--app-border)] pb-6">
          <p className="mb-2 text-[10px] font-bold uppercase leading-normal tracking-[0.13em] text-blue-600">
            {eyebrow}
          </p>
          <h1 className="m-0 font-display text-[clamp(38px,4vw,50px)] font-medium leading-none tracking-[-0.045em] max-[650px]:text-[39px]">
            {title}
          </h1>
          <p className="mt-2.5 max-w-[660px] text-xs leading-normal text-[var(--app-muted)]">
            {copy}
          </p>
        </header>
        <section className="app-panel mt-8 border border-[var(--app-border)] p-8">
          <p className="text-xs text-[var(--app-muted)]">
            This view establishes the product area and navigation boundary. Its
            data operations will connect to the application backend.
          </p>
        </section>
      </div>
    </AppShell>
  );
}
