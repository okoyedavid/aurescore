import AuthForm from "./components/AuthForm";

export default function RegisterPage() {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-700">
        Create account
      </p>
      <h1 className="mt-4 font-display text-4xl font-semibold">
        Start with AureScore.
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        Create your account first. We will tailor your academic workspace in the
        next step.
      </p>
      <AuthForm mode="register" />
      <p className="mt-6 text-center text-xs leading-relaxed text-muted">
        By continuing, you agree to the Terms of Use and Privacy Notice.
      </p>
    </div>
  );
}
