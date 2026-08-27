import { summaryCards } from "../data";

export default function SummaryCards() {
  return (
    <section
      aria-label="Summary"
      className="mt-8 grid grid-cols-4 border-l border-t border-[var(--app-border)] max-[1150px]:grid-cols-3 max-[900px]:grid-cols-2"
    >
      {summaryCards.map(
        ({ label, value, detail, icon: Icon, color }, index) => (
          <article
            key={label}
            className={`relative min-h-[148px] border-b border-r border-[var(--app-border)] bg-[var(--app-panel)] p-[21px] ${index === 1 ? "before:absolute before:inset-y-0 before:left-0 before:w-[3px] before:bg-orange before:content-['']" : ""}`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="m-0 text-[10px] font-semibold uppercase tracking-[0.05em]">
                  {label}
                </p>
                <p className="my-[13px] block font-display text-[35px] font-medium leading-none tracking-[-0.04em] max-[650px]:text-[29px]">
                  {value}
                </p>
              </div>
              <Icon size={17} className={color} aria-hidden="true" />
            </div>
            <p className="m-0 text-[10px] text-[var(--app-muted)]">{detail}</p>
          </article>
        ),
      )}
    </section>
  );
}
