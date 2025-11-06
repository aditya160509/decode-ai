"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

interface GlobalSearchContextValue {
  open: boolean;
  setOpen: (next: boolean) => void;
  openSearch: () => void;
  closeSearch: () => void;
}

const GlobalSearchContext = createContext<GlobalSearchContextValue | undefined>(undefined);

export const GlobalSearchProvider = ({ children }: { children: React.ReactNode }) => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  const value = useMemo(
    () => ({
      open,
      setOpen,
      openSearch: () => setOpen(true),
      closeSearch: () => setOpen(false),
    }),
    [open],
  );

  return <GlobalSearchContext.Provider value={value}>{children}</GlobalSearchContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useGlobalSearch = () => {
  const context = useContext(GlobalSearchContext);
  if (!context) {
    throw new Error("useGlobalSearch must be used within GlobalSearchProvider");
  }
  return context;
};
