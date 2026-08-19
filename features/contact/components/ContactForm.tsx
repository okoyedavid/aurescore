"use client";

import { CheckCircle2, Send } from "lucide-react";
import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/FormField";

export default function ContactForm() {
  const [sent, setSent] = useState(false);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSent(true);
  }

  if (sent) {
    return (
      <div className="flex min-h-96 flex-col justify-center rounded-lg border border-line bg-white p-8">
        <CheckCircle2 className="text-blue-600" size={34} aria-hidden="true" />
        <h2 className="mt-6 font-display text-3xl font-semibold">Request received.</h2>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-muted">This prototype has captured the form state. Connect the form to your email or CRM before launch to deliver enquiries.</p>
        <Button type="button" variant="ghost" onClick={() => setSent(false)} className="mt-7 w-fit">Send another request</Button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-lg border border-line bg-white p-6 sm:p-8">
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="text-sm font-semibold text-ink">Full name<Input required name="name" autoComplete="name" className="mt-2" placeholder="Your name" /></label>
        <label className="text-sm font-semibold text-ink">Work email<Input required name="email" type="email" autoComplete="email" className="mt-2" placeholder="you@institution.edu" /></label>
        <label className="text-sm font-semibold text-ink">Institution<Input required name="institution" autoComplete="organization" className="mt-2" placeholder="Institution name" /></label>
        <label className="text-sm font-semibold text-ink">Your role<Select required name="role" className="mt-2" defaultValue=""><option value="" disabled>Select role</option><option>Academic administrator</option><option>Exam officer</option><option>HOD or dean</option><option>ICT administrator</option><option>Lecturer</option></Select></label>
      </div>
      <label className="mt-5 block text-sm font-semibold text-ink">What result process should AureScore improve?<Textarea required name="message" rows={5} className="mt-2 resize-y" placeholder="Tell us about your current workflow, institution size, and rollout goals." /></label>
      <Button type="submit" className="mt-6">Send request <Send size={16} aria-hidden="true" /></Button>
    </form>
  );
}
