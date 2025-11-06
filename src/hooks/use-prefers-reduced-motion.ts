import { useEffect, useState } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

export const usePrefersReducedMotion = () => {
  const [shouldReduceMotion, setShouldReduceMotion] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia === "undefined") {
      return;
    }

    const mediaQueryList = window.matchMedia(QUERY);
    const update = () => setShouldReduceMotion(mediaQueryList.matches);

    update();

    if (typeof mediaQueryList.addEventListener === "function") {
      mediaQueryList.addEventListener("change", update);
      return () => mediaQueryList.removeEventListener("change", update);
    }

    mediaQueryList.addListener(update);
    return () => mediaQueryList.removeListener(update);
  }, []);

  return shouldReduceMotion;
};
