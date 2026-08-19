"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

export default function CodeBlock({
  code,
  language,
}: {
  code: string;
  language: string;
}) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }
  return (
    <div className="overflow-hidden rounded-lg border border-white/10 bg-[#0b1220] text-slate-200">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-2">
        <span className="text-xs uppercase tracking-wider text-slate-400">
          {language}
        </span>
        <button
          onClick={copy}
          className="focus-ring inline-flex items-center gap-2 rounded px-2 py-1 text-xs font-semibold text-slate-300 hover:bg-white/10"
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}{" "}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 text-[13px] leading-6">
        <code className="text-sky-200">{code}</code>
      </pre>
    </div>
  );
}
