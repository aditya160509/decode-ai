"use client";

import type { ProjectEntry } from "@/types/projects";
import { ProjectCard } from "./ProjectCard";
import { slugify } from "@/lib/slugify";

interface TopicSectionProps {
  topicName: string;
  projects: ProjectEntry[];
  summary?: string[];
  onOpenProject: (slug: string) => void;
}

export const TopicSection = ({ topicName, projects, summary, onOpenProject }: TopicSectionProps) => {
  return (
    <section id={slugify(topicName)} className="space-y-6">
      <div>
        <h3 className="text-2xl font-semibold tracking-tight">{topicName}</h3>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {projects.map((project) => (
          <ProjectCard key={project.slug} project={project} onOpen={onOpenProject} />
        ))}
      </div>
      {summary && summary.length > 0 && (
        <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          {summary.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      )}
    </section>
  );
};
