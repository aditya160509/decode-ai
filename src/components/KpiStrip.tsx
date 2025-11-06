"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useThemeMode } from "@/contexts/ThemeContext";
import { readHome } from "@/lib/decodeai-storage";

type KpiStripProps = {
  activePack: string;
};

export function KpiStrip({ activePack }: KpiStripProps) {
  const start = useRef(typeof performance !== "undefined" ? performance.now() : Date.now());
  const { theme } = useThemeMode();

  const [now, setNow] = useState(Date.now());
  const [routeHealth, setRouteHealth] = useState<string>("ok");

  useEffect(() => {
    (window as any).__decodeai_setRouteStatus = (status: string) => setRouteHealth(status);

    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const tick = () => setNow(Date.now());
    const interval = window.setInterval(tick, reduceMotion ? 5000 : 1000);
    return () => window.clearInterval(interval);
  }, []);

  const uptime = useMemo(() => {
    const elapsed = now - start.current;
    const hours = Math.floor(elapsed / 3_600_000);
    const minutes = Math.floor((elapsed % 3_600_000) / 60_000);
    const seconds = Math.floor((elapsed % 60_000) / 1000);
    const pad = (value: number) => value.toString().padStart(2, "0");
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }, [now]);

  const home = readHome();
  const savedCount =
    (home.consoleHistory?.length ?? 0) + (home.engageHistory?.[activePack]?.length ?? 0);

  const mode = theme === "matrix" ? "matrix" : "cyan";
  const build = "vX.∞";
  const cluster = "finance_ai_core";

  const Cell = ({ label, value }: { label: string; value: string }) => (
    <div className="card px-3 py-3">
      <div className="text-xs text-[var(--muted)]">{label}</div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  );

  return (
    <section className="max-w-screen-xl mx-auto px-4 py-6">
      <div className="grid gap-3 sm:grid-cols-4 lg:grid-cols-8">
        <Cell label="Uptime" value={uptime} />
        <Cell label="Local time" value={new Date(now).toLocaleTimeString()} />
        <Cell label="Theme" value={theme} />
        <Cell label="Active pack" value={activePack || "none"} />
        <Cell label="Saved items" value={String(savedCount)} />
        <Cell label="Route health" value={routeHealth} />
        <Cell label="Mode" value={mode} />
        <Cell label="Cluster" value={cluster} />
      </div>
      <div className="mt-2 text-center text-xs text-[var(--muted)]">build {build}</div>
    </section>
  );
}
