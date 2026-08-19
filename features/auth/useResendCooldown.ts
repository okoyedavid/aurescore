"use client";

import { useCallback, useEffect, useState } from "react";
import { getCooldownSeconds, restartCooldown } from "./session";

export function useResendCooldown(kind: "email" | "login") {
  const [seconds, setSeconds] = useState(60);

  useEffect(() => {
    const update = () => setSeconds(getCooldownSeconds(kind));
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [kind]);

  const restart = useCallback(() => {
    restartCooldown(kind);
    setSeconds(60);
  }, [kind]);

  return { seconds, restart };
}
