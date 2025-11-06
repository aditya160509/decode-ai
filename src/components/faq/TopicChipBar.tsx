"use client";

import { useCallback } from "react";
import { cn } from "@/lib/utils";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";

export interface TopicChip {
  name: string;
  slug: string;
  count: number;
}

interface TopicChipBarProps {
  topics: TopicChip[];
}

export const TopicChipBar = ({ topics }: TopicChipBarProps) => {
  const shouldReduceMotion = usePrefersReducedMotion();

  const handleClick = useCallback(
    (slug: string) => {
      if (typeof window === "undefined") return;
      const element = document.getElementById(slug);
      if (!element) return;

      window.location.hash = slug;
      if (shouldReduceMotion) {
        element.scrollIntoView();
        return;
      }

      element.scrollIntoView({ behavior: "smooth", block: "start" });
    },
    [shouldReduceMotion],
  );

  return (
    <div className="sticky top-16 z-30 border-b border-white/10 bg-black/70 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl gap-2 overflow-x-auto px-4 py-3">
        {topics.map((topic) => (
          <button
            key={topic.slug}
            type="button"
            onClick={() => handleClick(topic.slug)}
            className={cn(
              "whitespace-nowrap rounded-full border border-white/20 px-3 py-1 text-sm text-zinc-200 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-black hover:border-indigo-400 hover:text-white",
            )}
          >
            {topic.name} <span className="ml-1 text-xs text-zinc-400">({topic.count})</span>
          </button>
        ))}
      </div>
    </div>
  );
};
