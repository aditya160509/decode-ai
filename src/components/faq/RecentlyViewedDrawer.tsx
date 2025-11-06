"use client";

import { useEffect, useMemo, useState } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { storage, type RecentEntry } from "@/lib/decodeai-storage";
import { useResourcesData } from "@/features/resources/context/ResourcesDataContext";
import type { ResourceWithMeta } from "@/types/resources";
import type { ProjectSummary } from "@/types/workflows";
import { ArrowUpRight, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";

interface RecentlyViewedDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProjectSelect: (slug: string) => void;
  onResourceSelect: (resource: ResourceWithMeta) => void;
}

interface DecoratedRecent {
  entry: RecentEntry;
  project?: ProjectSummary;
  resource?: ResourceWithMeta;
}

const formatTimeAgo = (timestamp: number) => {
  const delta = Date.now() - timestamp;
  const minutes = Math.floor(delta / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

export const RecentlyViewedDrawer = ({ open, onOpenChange, onProjectSelect, onResourceSelect }: RecentlyViewedDrawerProps) => {
  const [recent, setRecent] = useState<RecentEntry[]>([]);
  const shouldReduceMotion = usePrefersReducedMotion();
  const { projects, resources } = useResourcesData();

  useEffect(() => {
    if (open) {
      setRecent(storage.getRecent());
    }
  }, [open]);

  const decorated = useMemo<DecoratedRecent[]>(() => {
    const projectMap = new Map<string, ProjectSummary>();
    projects.forEach((project) => projectMap.set(project.slug, project));

    const resourceMap = new Map<string, ResourceWithMeta>();
    resources.forEach((resource) => resourceMap.set(resource.slug, resource));

    return recent
      .map((entry) => ({
        entry,
        project: entry.type === "project" ? projectMap.get(entry.slugOrId) : undefined,
        resource: entry.type === "resource" ? resourceMap.get(entry.slugOrId) : undefined,
      }))
      .sort((a, b) => b.entry.ts - a.entry.ts);
  }, [recent, projects, resources]);

  const recentProjects = decorated.filter((item) => item.entry.type === "project" && item.project).slice(0, 5);
  const recentResources = decorated.filter((item) => item.entry.type === "resource" && item.resource).slice(0, 5);

  const empty = !recentProjects.length && !recentResources.length;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className={cn(
          "flex h-full w-full flex-col gap-4 border-l border-white/15 bg-zinc-950 text-white shadow-lg sm:max-w-md",
          shouldReduceMotion && "data-[state=open]:animate-none data-[state=closed]:animate-none",
        )}
        aria-modal="true"
      >
        <div className="border-b border-white/10 pb-3">
          <h2 className="text-lg font-semibold text-white">Recently Viewed</h2>
          <p className="text-sm text-zinc-400">We keep this list on your device only.</p>
        </div>

        {empty && <p className="text-sm text-zinc-400">No recent activity yet.</p>}

        {recentProjects.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">Projects</h3>
            <div className="space-y-2">
              {recentProjects.map(({ entry, project }) =>
                project ? (
                  <button
                    key={entry.slugOrId}
                    type="button"
                    onClick={() => {
                      onProjectSelect(project.slug);
                      onOpenChange(false);
                    }}
                    className="flex w-full flex-col gap-1 rounded-md border border-white/12 bg-black/40 px-4 py-3 text-left text-sm text-white transition hover:border-indigo-400/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                  >
                    <span className="font-medium">{project.title}</span>
                    <span className="text-xs text-indigo-300">{project.topic}</span>
                    <span className="text-xs text-zinc-400">
                      {project.difficulty} · {project.time_estimate}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-zinc-500">
                      <Clock className="h-3 w-3" aria-hidden="true" />
                      {formatTimeAgo(entry.ts)}
                    </span>
                  </button>
                ) : null,
              )}
            </div>
          </div>
        )}

        {recentResources.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">Resources</h3>
            <div className="space-y-2">
              {recentResources.map(({ entry, resource }) =>
                resource ? (
                  <button
                    key={entry.slugOrId}
                    type="button"
                    onClick={() => {
                      onResourceSelect(resource);
                      onOpenChange(false);
                    }}
                    className="flex w-full flex-col gap-1 rounded-md border border-white/12 bg-black/40 px-4 py-3 text-left text-sm text-white transition hover:border-indigo-400/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                  >
                    <span className="font-medium">{resource.title}</span>
                    <span className="text-xs text-zinc-400">
                      {resource.type} · {resource.level}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-zinc-500">
                      <Clock className="h-3 w-3" aria-hidden="true" />
                      {formatTimeAgo(entry.ts)}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-indigo-300">
                      Open Resource <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
                    </span>
                  </button>
                ) : null,
              )}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};
