"use client";

import { Send } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/FormField";

export default function ContactForm() {
  return (
    <form
      onSubmit={(event) => event.preventDefault()}
      className="rounded-lg border border-line bg-white p-6 sm:p-8"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="text-sm font-semibold text-ink">
          Full name
          <Input
            required
            name="name"
            autoComplete="name"
            className="mt-2"
            placeholder="Your name"
          />
        </label>
        <label className="text-sm font-semibold text-ink">
          Work email
          <Input
            required
            name="email"
            type="email"
            autoComplete="email"
            className="mt-2"
            placeholder="you@institution.edu"
          />
        </label>
        <label className="text-sm font-semibold text-ink">
          Institution
          <Input
            required
            name="institution"
            autoComplete="organization"
            className="mt-2"
            placeholder="Institution name"
          />
        </label>
        <label className="text-sm font-semibold text-ink">
          Your role
          <Select required name="role" className="mt-2" defaultValue="">
            <option value="" disabled>
              Select role
            </option>
            <option>Academic administrator</option>
            <option>Exam officer</option>
            <option>HOD or dean</option>
            <option>ICT administrator</option>
            <option>Lecturer</option>
          </Select>
        </label>
      </div>
      <label className="mt-5 block text-sm font-semibold text-ink">
        What result process should AureScore improve?
        <Textarea
          required
          name="message"
          rows={5}
          className="mt-2 resize-y"
          placeholder="Tell us about your current workflow, institution size, and rollout goals."
        />
      </label>
      <Button type="submit" className="mt-6" disabled>
        Send request <Send size={16} aria-hidden="true" />
      </Button>
    </form>
  );
}
