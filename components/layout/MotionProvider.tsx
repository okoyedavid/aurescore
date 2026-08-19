"use client";

import { useEffect } from "react";

export default function MotionProvider() {
  useEffect(() => {
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const elements = Array.from(
      document.querySelectorAll<HTMLElement>("[data-reveal]"),
    );

    document.body.classList.add("motion-ready");

    if (reduceMotion) {
      elements.forEach((element) => element.classList.add("is-visible"));
      return () => document.body.classList.remove("motion-ready");
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -10%", threshold: 0.12 },
    );

    elements.forEach((element) => observer.observe(element));

    return () => {
      observer.disconnect();
      document.body.classList.remove("motion-ready");
    };
  }, []);

  return null;
}
