"use client";

import { X } from "lucide-react";
import { useEffect, useEffectEvent, useRef } from "react";

export function Dialog({
  open,
  title,
  description,
  children,
  onClose,
  dismissible = true,
  className = "",
}: {
  open: boolean;
  title: string;
  description?: string;
  children: React.ReactNode;
  onClose: () => void;
  dismissible?: boolean;
  className?: string;
}) {
  const panel = useRef<HTMLDivElement>(null);
  const handleClose = useEffectEvent(onClose);

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const focusable = () =>
      Array.from(
        panel.current?.querySelectorAll<HTMLElement>(
          "button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [href]",
        ) ?? [],
      );
    const requestedFocus =
      panel.current?.querySelector<HTMLElement>("[autofocus]");
    const firstContentControl = focusable().find(
      (item) => item.getAttribute("aria-label") !== "Close",
    );
    (requestedFocus ?? firstContentControl ?? panel.current)?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && dismissible) handleClose();
      if (event.key !== "Tab") return;
      const items = focusable();
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      previous?.focus();
    };
  }, [dismissible, open]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center px-4 py-8">
      {dismissible && (
        <button
          type="button"
          aria-label="Close dialog"
          onClick={onClose}
          className="absolute inset-0 bg-black/65"
        />
      )}
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        aria-labelledby="dialog-title"
        aria-describedby={description ? "dialog-description" : undefined}
        className={`app-dialog app-panel relative z-10 max-h-[calc(100dvh-4rem)] w-full max-w-md overflow-y-auto rounded-xl border border-[var(--app-border,#e4e1d9)] p-6 shadow-2xl ${className}`}
      >
        {dismissible && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="app-icon-button absolute right-4 top-4"
          >
            <X size={18} />
          </button>
        )}
        <h2
          id="dialog-title"
          className="app-dialog-title pr-10 font-display text-2xl font-semibold"
        >
          {title}
        </h2>
        {description && (
          <p
            id="dialog-description"
            className="app-dialog-description mt-2 text-sm leading-relaxed text-[var(--app-muted)]"
          >
            {description}
          </p>
        )}
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}
