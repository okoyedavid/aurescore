import { invitations } from "../data";

export default function InvitationPanel() {
  return (
    <section className="self-start border border-[var(--app-border)] bg-[var(--app-panel)]">
      <header className="flex min-h-[103px] items-end justify-between gap-5 border-b border-[var(--app-border)] px-5 py-[18px]">
        <div>
          <p className="mb-2 text-[10px] font-bold uppercase leading-normal tracking-[0.13em] text-blue-600">
            Attention required
          </p>
          <div className="flex items-center gap-3">
            <span className="font-display text-[23px] font-medium leading-none">
              {invitations.length}
            </span>
            <div>
              <h2 className="m-0 font-display text-2xl font-semibold tracking-[-0.03em]">
                Invitations
              </h2>
              <p className="mt-1 text-[10px] text-[var(--app-muted)]">
                Requests awaiting a response
              </p>
            </div>
          </div>
        </div>
      </header>
      <div>
        {invitations.map((invite) => (
          <article
            key={invite.institution}
            className="border-b border-[var(--app-border)] px-5 py-4 last:border-b-0"
          >
            <h3 className="m-0 text-[11px] font-semibold">
              {invite.institution}
            </h3>
            <p className="mt-0.5 text-[10px] text-[var(--app-muted)]">
              {invite.role} · Invited by {invite.invitedBy}
            </p>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                className="focus-ring inline-flex min-h-8 items-center justify-center rounded-sm bg-blue-600 px-3 text-xs font-semibold text-white transition-colors duration-150 hover:bg-blue-500"
              >
                Accept
              </button>
              <button
                type="button"
                className="focus-ring inline-flex min-h-8 items-center justify-center rounded-sm border border-[var(--app-border)] bg-[var(--app-panel)] px-3 text-xs font-semibold transition-colors duration-150 hover:bg-[var(--app-hover)]"
              >
                Decline
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
