"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { storage } from "@/lib/decodeai-storage";
import type { ProjectSummary, WorkflowProject } from "@/types/workflows";
import { loadWorkflow } from "@/features/resources/workflow-cache";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { WorkflowTabs, type WorkflowTabKey } from "./WorkflowTabs";
import { cn } from "@/lib/utils";
import { ArrowLeft, ArrowRight, Copy, ExternalLinkIcon, Star, X } from "lucide-react";

interface WorkflowDrawerProps {
  slug: string | null;
  open: boolean;
  onClose: () => void;
  projects: ProjectSummary[];
  onNavigate: (slug: string) => void;
  onOpenFullPage: (slug: string) => void;
}

const getHashTab = (): WorkflowTabKey | null => {
  if (typeof window === "undefined") return null;
  const hash = window.location.hash.slice(1);
  const mapping: Record<string, WorkflowTabKey> = {
    overview: "overview",
    impact: "concept",
    data: "data",
    ai: "ai",
    workflow: "workflow",
    stack: "stack",
    ux: "ux",
    metrics: "metrics",
    timeline: "timeline",
    collaboration: "collaboration",
    judging: "judging",
    notes: "notes",
  };
  return mapping[hash] ?? null;
};

const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
};

export const WorkflowDrawer = ({
  slug,
  open,
  onClose,
  projects,
  onNavigate,
  onOpenFullPage,
}: WorkflowDrawerProps) => {
  const [workflow, setWorkflow] = useState<WorkflowProject | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<WorkflowTabKey>("overview");
  const shouldReduceMotion = usePrefersReducedMotion();

  const currentProject = useMemo(() => projects.find((project) => project.slug === slug), [projects, slug]);

  const topicProjects = useMemo(() => {
    if (!currentProject) return [];
    return projects.filter((project) => project.topic === currentProject.topic);
  }, [projects, currentProject]);

  const handleLoadWorkflow = useCallback(async (targetSlug: string) => {
    try {
      setLoading(true);
      const data = await loadWorkflow(targetSlug);
      setWorkflow(data);
      setError(null);
    } catch {
      setError("This workflow could not be loaded. Try again.");
      setWorkflow(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open || !slug) return;
    const hashTab = getHashTab();
    if (hashTab) {
      setActiveTab(hashTab);
    } else {
      setActiveTab("overview");
    }
    handleLoadWorkflow(slug);
  }, [open, slug, handleLoadWorkflow]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!open || !slug || !currentProject) return;
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        event.preventDefault();
        const currentIndex = topicProjects.findIndex((project) => project.slug === slug);
        if (currentIndex === -1) return;
        const delta = event.key === "ArrowLeft" ? -1 : 1;
        const nextIndex = currentIndex + delta;
        const nextProject = topicProjects[nextIndex];
        if (nextProject) {
          onNavigate(nextProject.slug);
        }
      }
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, slug, topicProjects, onNavigate, onClose, currentProject]);

  const handleCopyLink = async () => {
    if (!slug) return;
    const hashMap: Record<WorkflowTabKey, string> = {
      overview: "overview",
      concept: "impact",
      data: "data",
      ai: "ai",
      workflow: "workflow",
      stack: "stack",
      ux: "ux",
      metrics: "metrics",
      timeline: "timeline",
      collaboration: "collaboration",
      judging: "judging",
      notes: "notes",
    };
    const hash = hashMap[activeTab] ?? "overview";
    const url = `${window.location.origin}/project/${slug}#${hash}`;
    await copyToClipboard(url);
  };

  const handleShortlist = () => {
    if (!slug) return;
    storage.upsertRecent({ type: "project", slugOrId: slug, ts: Date.now() });
  };

  const currentIndex = currentProject ? topicProjects.findIndex((proj) => proj.slug === currentProject.slug) : -1;
  const prevProject = currentIndex > 0 ? topicProjects[currentIndex - 1] : undefined;
  const nextProject =
    currentIndex >= 0 && currentIndex < topicProjects.length - 1 ? topicProjects[currentIndex + 1] : undefined;

  return (
    <Sheet open={open} onOpenChange={(value) => (!value ? onClose() : undefined)}>
      <SheetContent
        side="right"
        className={cn(
          "flex h-full w-full flex-col gap-4 border-l border-white/15 bg-zinc-950 text-white shadow-lg sm:max-w-xl md:max-w-2xl",
          shouldReduceMotion && "data-[state=open]:animate-none data-[state=closed]:animate-none",
        )}
        aria-modal="true"
      >
        <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-3">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold text-white">{currentProject?.title ?? "Workflow"}</h2>
              {currentProject && (
                <Badge variant="outline" className="border-indigo-400/40 text-indigo-200">
                  {currentProject.topic}
                </Badge>
              )}
            </div>
            <div className="flex flex-wrap gap-3 text-xs text-zinc-400">
              {currentProject?.difficulty && (
                <span className="flex items-center gap-1">
                  <Star className="h-3 w-3 text-indigo-300" aria-hidden="true" /> {currentProject.difficulty}
                </span>
              )}
              {currentProject?.time_estimate && <span>{currentProject.time_estimate}</span>}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyLink}
              className="border-white/20 text-xs text-white hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
            >
              <Copy className="mr-2 h-3.5 w-3.5" aria-hidden="true" />
              Copy Link
            </Button>
            {slug && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onOpenFullPage(slug)}
                className="border-white/20 text-xs text-white hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
              >
                <ExternalLinkIcon className="mr-2 h-3.5 w-3.5" aria-hidden="true" />
                Open Full Page
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleShortlist}
              className="border-white/20 text-xs text-white hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
            >
              Shortlist
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              aria-label="Close workflow drawer"
              className="h-8 w-8 rounded-full border border-white/15 text-white hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2">
          <Button
            variant="ghost"
            size="sm"
            disabled={!prevProject}
            onClick={() => prevProject && onNavigate(prevProject.slug)}
            className="flex items-center gap-2 text-xs text-white disabled:opacity-40"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            Previous
          </Button>
          <span className="text-xs text-zinc-400">
            {currentProject?.topic ?? "All topics"} • {currentIndex + 1}/{topicProjects.length}
          </span>
          <Button
            variant="ghost"
            size="sm"
            disabled={!nextProject}
            onClick={() => nextProject && onNavigate(nextProject.slug)}
            className="flex items-center gap-2 text-xs text-white disabled:opacity-40"
          >
            Next
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Button>
        </div>

        <div className="flex-1">
          {loading && (
            <ScrollArea className="h-full rounded-md border border-white/10 bg-black/30 p-4">
              <div className="space-y-3">
                <Skeleton className="h-6 w-48 bg-white/10" />
                <Skeleton className="h-4 w-full bg-white/10" />
                <Skeleton className="h-4 w-full bg-white/10" />
                <Skeleton className="h-4 w-2/3 bg-white/10" />
              </div>
            </ScrollArea>
          )}
          {!loading && error && (
            <div className="rounded-md border border-rose-400/60 bg-rose-500/10 p-4 text-sm text-rose-200">{error}</div>
          )}
          {!loading && !error && workflow && (
            <WorkflowTabs data={workflow} activeTab={activeTab} onTabChange={setActiveTab} />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
