import { Input } from "@/components/ui/FormField";

export default function OtpInput({
  value,
  onChange,
  error,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
}) {
  return (
    <label htmlFor="verification-code" className="block text-sm font-semibold">
      Six-digit verification code
      <Input
        id="verification-code"
        name="code"
        value={value}
        onChange={(event) =>
          onChange(event.target.value.replace(/\D/g, "").slice(0, 6))
        }
        type="text"
        inputMode="numeric"
        pattern="[0-9]{6}"
        maxLength={6}
        required
        autoFocus
        autoComplete="one-time-code"
        disabled={disabled}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? "verification-error" : "verification-help"}
        className="mt-2 text-center font-display text-2xl tracking-[0.45em]"
        placeholder="000000"
      />
      <span
        id="verification-help"
        className="mt-2 block text-xs font-normal text-muted"
      >
        Enter or paste the complete code from your email.
      </span>
    </label>
  );
}
