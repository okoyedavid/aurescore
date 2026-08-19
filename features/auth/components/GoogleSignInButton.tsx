"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { googleAuthUrl } from "../google";
import { preserveOAuthInteractionFromLocation } from "../oauth-interaction";

function GoogleMark() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      aria-hidden="true"
      focusable="false"
    >
      <path
        fill="#4285f4"
        d="M21.6 12.2c0-.7-.1-1.5-.2-2.2H12v4h5.4a4.6 4.6 0 0 1-2 3v2.6h3.3c1.9-1.8 2.9-4.4 2.9-7.4Z"
      />
      <path
        fill="#34a853"
        d="M12 22c2.7 0 5-.9 6.7-2.4L15.4 17c-.9.6-2.1 1-3.4 1a5.9 5.9 0 0 1-5.5-4.1H3.1v2.7A10 10 0 0 0 12 22Z"
      />
      <path
        fill="#fbbc05"
        d="M6.5 13.9A6 6 0 0 1 6.2 12c0-.7.1-1.3.3-1.9V7.4H3.1A10 10 0 0 0 2 12c0 1.7.4 3.2 1.1 4.6l3.4-2.7Z"
      />
      <path
        fill="#ea4335"
        d="M12 6c1.5 0 2.8.5 3.9 1.5l2.9-2.9A9.7 9.7 0 0 0 12 2a10 10 0 0 0-8.9 5.4l3.4 2.7A5.9 5.9 0 0 1 12 6Z"
      />
    </svg>
  );
}

export default function GoogleSignInButton({
  navigate,
}: {
  navigate?: (url: string) => void;
}) {
  const [redirecting, setRedirecting] = useState(false);
  const starting = useRef(false);

  function startGoogleSignIn() {
    if (starting.current) return;
    starting.current = true;
    setRedirecting(true);
    preserveOAuthInteractionFromLocation();
    (navigate ?? ((url: string) => window.location.assign(url)))(googleAuthUrl);
  }

  return (
    <Button
      type="button"
      variant="outline"
      className="w-full"
      onClick={startGoogleSignIn}
      disabled={redirecting}
      aria-label={
        redirecting ? "Redirecting to Google" : "Continue with Google"
      }
    >
      {!redirecting && <GoogleMark />}
      {redirecting ? "Redirecting to Google…" : "Continue with Google"}
    </Button>
  );
}
