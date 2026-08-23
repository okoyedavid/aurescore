export function FieldError({
  id,
  children,
}: {
  id?: string;
  children?: string;
}) {
  return children ? (
    <span id={id} role="alert" className="mt-1 block text-xs text-red-600">
      {children}
    </span>
  ) : null;
}
export function RequestError({ children }: { children?: string }) {
  return children ? (
    <p
      role="alert"
      aria-live="assertive"
      className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700"
    >
      {children}
    </p>
  ) : null;
}
