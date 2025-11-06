"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { storage } from "@/lib/decodeai-storage";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { useResourcesData } from "@/features/resources/context/ResourcesDataContext";
import type { ResourceWithMeta } from "@/types/resources";
import type { ProjectEntry } from "@/types/projects";
import { useGlobalSearch } from "@/contexts/global-search";
import { useNavigate } from "react-router-dom";

type TabKey = "projects" | "resources";

const matchProject = (project: ProjectEntry, query: string) => {
  if (!query) return true;
  const lower = query.toLowerCase();
  return (
    project.title.toLowerCase().includes(lower) ||
    project.batch.toLowerCase().includes(lower) ||
    project.goal.toLowerCase().includes(lower) ||
    project.why_it_matters.toLowerCase().includes(lower)
  );
};

const matchResource = (resource: ResourceWithMeta, query: string) => {
  if (!query) return true;
  const lower = query.toLowerCase();
  return (
    resource.title.toLowerCase().includes(lower) ||
    resource.summary.toLowerCase().includes(lower) ||
    resource.takeaway.toLowerCase().includes(lower) ||
    resource.author.toLowerCase().includes(lower)
  );
};

export const GlobalSearchModal = () => {
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<TabKey>("projects");
  const inputRef = useRef<HTMLInputElement | null>(null);
  const shouldReduceMotion = usePrefersReducedMotion();
  const { resources, projectBatches } = useResourcesData();
  const { open, setOpen } = useGlobalSearch();
  const navigate = useNavigate();

  useEffect(() => {
    if (open) {
      const id = window.setTimeout(() => {
        inputRef.current?.focus();
      }, 80);
      return () => window.clearTimeout(id);
    }
    return undefined;
  }, [open]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setTab("projects");
    }
  }, [open]);

  const projects = useMemo<ProjectEntry[]>(() => projectBatches.flatMap((batch) => batch.projects), [projectBatches]);

  const filteredProjects = useMemo(() => projects.filter((project) => matchProject(project, query)), [projects, query]);
  const filteredResources = useMemo(
    () => resources.filter((resource) => matchResource(resource, query)),
    [resources, query],
  );

  const handleResourceSelect = (resource: ResourceWithMeta) => {
    if (typeof window === "undefined") return;
    window.open(resource.url, "_blank", "noopener,noreferrer");
    storage.upsertRecent({ type: "resource", slugOrId: resource.slug, ts: Date.now() });
    storage.incrementAnalytics("resource", resource.slug);
    setOpen(false);
  };

  const handleProjectSelect = (slug: string) => {
    storage.upsertRecent({ type: "project", slugOrId: slug, ts: Date.now() });
    storage.incrementAnalytics("project", slug);
    navigate(`/project/${slug}`);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className={`w-full max-w-3xl rounded-lg border border-border bg-card text-foreground ${
          shouldReduceMotion ? "data-[state=open]:animate-none data-[state=closed]:animate-none" : ""
        }`}
        aria-modal="true"
        role="dialog"
      >
        <DialogHeader className="space-y-2">
          <DialogTitle className="text-lg font-semibold">Search DecodeAI</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <Input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search projects and resources…"
            aria-label="Search DecodeAI"
          />

          <Tabs value={tab} onValueChange={(value) => setTab(value as TabKey)} className="space-y-4">
            <TabsList className="grid w-full grid-cols-2 bg-muted">
              <TabsTrigger value="projects">Projects</TabsTrigger>
              <TabsTrigger value="resources">Resources</TabsTrigger>
            </TabsList>

            <TabsContent value="projects">
              <div className="max-h-72 overflow-y-auto rounded-lg border border-border">
                <ul className="divide-y divide-border">
                  {filteredProjects.map((project) => (
                    <li key={project.slug}>
                      <button
                        type="button"
                        onClick={() => handleProjectSelect(project.slug)}
                        className="flex w-full flex-col gap-1 px-4 py-3 text-left text-sm hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      >
                        <span className="font-medium text-foreground">{project.title}</span>
                        <span className="text-xs text-muted-foreground">{project.batch}</span>
                        <span className="text-xs text-muted-foreground">
                          {project.difficulty} • {project.time}
                        </span>
                        <span className="text-xs text-muted-foreground line-clamp-2">{project.why_it_matters}</span>
                      </button>
                    </li>
                  ))}
                  {!filteredProjects.length && (
                    <li className="px-4 py-6 text-center text-sm text-muted-foreground">No matching projects.</li>
                  )}
                </ul>
              </div>
            </TabsContent>

            <TabsContent value="resources">
              <div className="max-h-72 overflow-y-auto rounded-lg border border-border">
                <ul className="divide-y divide-border">
                  {filteredResources.map((resource) => (
                    <li key={resource.id}>
                      <button
                        type="button"
                        onClick={() => handleResourceSelect(resource)}
                        className="flex w-full flex-col gap-1 px-4 py-3 text-left text-sm hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      >
                        <span className="font-medium text-foreground">{resource.title}</span>
                        <span className="text-xs text-muted-foreground">{resource.type}</span>
                        <span className="text-xs text-muted-foreground">
                          {resource.level} • {resource.duration} • {resource.author}
                        </span>
                        <span className="text-xs text-muted-foreground line-clamp-2">
                          {resource.takeaway || resource.summary}
                        </span>
                      </button>
                    </li>
                  ))}
                  {!filteredResources.length && (
                    <li className="px-4 py-6 text-center text-sm text-muted-foreground">No matching resources.</li>
                  )}
                </ul>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};
