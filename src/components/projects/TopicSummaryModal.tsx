"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { ProjectSummary, TopicStats } from "@/types/workflows";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { cn } from "@/lib/utils";

interface TopicSummaryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  topicName: string;
  topicSlug: string;
  stats: TopicStats;
  projects: ProjectSummary[];
}

export const TopicSummaryModal = ({
  open,
  onOpenChange,
  topicName,
  topicSlug,
  stats,
  projects,
}: TopicSummaryModalProps) => {
  const shouldReduceMotion = usePrefersReducedMotion();

  const handleExplore = () => {
    const element = document.getElementById(topicSlug);
    if (!element) {
      onOpenChange(false);
      return;
    }
    if (shouldReduceMotion) {
      element.scrollIntoView();
    } else {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "max-w-2xl border border-white/15 bg-zinc-950 text-white",
          shouldReduceMotion && "data-[state=open]:animate-none data-[state=closed]:animate-none",
        )}
        aria-modal="true"
        role="dialog"
      >
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-white">{topicName}</DialogTitle>
          <DialogDescription className="text-sm text-zinc-400">
            This topic includes {projects.length} projects. Average difficulty {stats.averageDifficultyLabel}; average
            build time {stats.averageTimeEstimate}.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          <div className="rounded-md border border-white/10 bg-black/40 p-4 text-sm text-zinc-300">
            {stats.shortPitch}
          </div>

          <ul className="flex max-h-64 flex-col gap-3 overflow-y-auto pr-2" aria-label={`${topicName} projects`}>
            {projects.map((project) => (
              <li
                key={project.slug}
                className="rounded-md border border-white/10 bg-black/30 p-3"
              >
                <p className="font-medium text-white">{project.title}</p>
                <p className="text-sm text-zinc-400">{project.why_it_matters}</p>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-6 flex justify-end">
          <Button
            variant="outline"
            onClick={handleExplore}
            className="border border-indigo-400/50 bg-black/60 text-white hover:bg-indigo-500/20 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
          >
            Explore in Grid →
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
