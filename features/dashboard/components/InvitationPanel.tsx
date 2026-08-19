import { MailPlus } from "lucide-react";
import { invitations } from "../data";

export default function InvitationPanel() {
  return <section className="app-panel rounded-lg border border-[var(--app-border)]"><div className="border-b border-[var(--app-border)] px-5 py-4"><div className="flex items-center gap-2"><MailPlus size={18} className="text-orange"/><h2 className="font-display text-lg font-semibold">Invitations</h2></div><p className="mt-1 text-xs text-[var(--app-muted)]">Requests to join institution workspaces.</p></div><div className="divide-y divide-[var(--app-border)]">{invitations.map((invite)=><article key={invite.institution} className="p-5"><h3 className="text-sm font-semibold">{invite.institution}</h3><p className="mt-1 text-xs text-[var(--app-muted)]">{invite.role} · Invited by {invite.invitedBy}</p><div className="mt-4 flex gap-2"><button type="button" className="focus-ring rounded-md bg-blue-600 px-3 py-2 text-xs font-semibold text-white">Accept</button><button type="button" className="focus-ring rounded-md border border-[var(--app-border)] px-3 py-2 text-xs font-semibold">Decline</button></div></article>)}</div></section>;
}
