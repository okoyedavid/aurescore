import AuthForm from "./components/AuthForm";
import AuthNotice from "./components/AuthNotice";

export default function SignInPage() {
  return (
    <>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-700">
        Welcome back
      </p>
      <h1 className="mt-4 font-display text-4xl font-semibold">
        Sign in to AureScore.
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        Open your academic workspace and continue pending result work.
      </p>
      <AuthNotice />
      <AuthForm mode="sign-in" />
    </>
  );
}
