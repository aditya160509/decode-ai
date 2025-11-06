"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { readHome, writeHome } from "@/lib/decodeai-storage";

type ThemeMode = "default" | "matrix";

type ThemeContextValue = {
  theme: ThemeMode;
  setTheme: (next: ThemeMode) => void;
};

const ThemeCtx = createContext<ThemeContextValue>({
  theme: "default",
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>("default");

  useEffect(() => {
    const saved = readHome().theme;
    setThemeState(saved);
    document.documentElement.setAttribute("data-theme", saved);
  }, []);

  const api = useMemo<ThemeContextValue>(() => ({
    theme,
    setTheme: (next: ThemeMode) => {
      setThemeState(next);
      if (typeof document !== "undefined") {
        document.documentElement.setAttribute("data-theme", next);
      }
      writeHome({ theme: next });
    },
  }), [theme]);

  return <ThemeCtx.Provider value={api}>{children}</ThemeCtx.Provider>;
}

export const useThemeMode = () => useContext(ThemeCtx);
