"use client";

import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useResourcesData } from "../context/ResourcesDataContext";
import { storage } from "@/lib/decodeai-storage";
import type { ProjectEntry } from "@/types/projects";

interface ProjectWorkflowPageProps {
  slug: string;
}

export const ProjectWorkflowPage = ({ slug }: ProjectWorkflowPageProps) => {
  const { projectBatches, projectsMap, loading } = useResourcesData();
  const navigate = useNavigate();

  const project = useMemo<ProjectEntry | undefined>(() => projectsMap[slug], [projectsMap, slug]);

  const batchSummary = useMemo(() => {
    if (!project) return undefined;
    return projectBatches.find((batch) => batch.projects.some((item) => item.slug === project.slug));
  }, [projectBatches, project]);

  useEffect(() => {
    storage.upsertRecent({ type: "project", slugOrId: slug, ts: Date.now() });
  }, [slug]);

  const handleBack = () => {
    navigate("/resources");
  };

  return (
    <div className="bg-background text-foreground">
      <section className="container mx-auto px-4 pb-16 pt-12">
        <Button variant="ghost" onClick={handleBack} className="mb-6 px-0 text-sm text-muted-foreground hover:text-foreground">
          ← Back to Resources
        </Button>

        {!project && !loading && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-6 text-sm text-destructive">
            This workflow could not be found.
          </div>
        )}

        {project && (
          <header className="mb-10 space-y-4 glass-card-soft ring-gradient-glow p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">{project.title}</h1>
                <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  <Badge variant="secondary">{project.batch}</Badge>
                  <span>{project.difficulty}</span>
                  <span>{project.time}</span>
                </div>
              </div>
            </div>
          </header>
        )}

        <section>
          {loading && (
            <div className="space-y-3">
              <Skeleton className="h-6 w-64" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </div>
          )}

          {!loading && project && (
            <div className="space-y-6">
              <DetailSection title="Why it matters" paragraphs={[project.why_it_matters]} />
              <DetailSection title="Goal" paragraphs={[project.goal]} />
              <DetailSection title="Users" paragraphs={[project.users]} />
              <DetailList title={project.data.label} items={project.data.items} />
              <DetailList title="AI Use" items={project.ai_use} />
              <DetailList title="Workflow" items={project.workflow} />
              <DetailSection title="Portfolio Value" paragraphs={[project.portfolio_value]} />
              {project.summary && <DetailSection title="Summary" paragraphs={[project.summary]} />}
              {batchSummary?.summary && batchSummary.summary.length > 0 && (
                <DetailList title={`Batch Insight – ${batchSummary.name}`} items={batchSummary.summary} />
              )}
            </div>
          )}
        </section>
      </section>
    </div>
  );
};

interface DetailSectionProps {
  title: string;
  paragraphs: string[];
}

const DetailSection = ({ title, paragraphs }: DetailSectionProps) => (
  <div className="glass-card-softer p-6">
    <h2 className="text-xl font-semibold text-foreground">{title}</h2>
    <div className="mt-3 space-y-3 text-sm text-muted-foreground">
      {paragraphs.map((text) => (
        <p key={text}>{text}</p>
      ))}
    </div>
  </div>
);

interface DetailListProps {
  title: string;
  items: string[];
  ordered?: boolean;
}

const DetailList = ({ title, items, ordered }: DetailListProps) => (
  <div className="glass-card-softer p-6">
    <h2 className="text-xl font-semibold text-foreground">{title}</h2>
    {ordered ? (
      <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ol>
    ) : (
      <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    )}
  </div>
);
