"use client";

import { Link } from "react-router-dom";
import type { ProjectEntry } from "@/types/projects";

interface ProjectCardProps {
  project: ProjectEntry;
  onOpen: (slug: string) => void;
}

export const ProjectCard = ({ project, onOpen }: ProjectCardProps) => {
  return (
    <Link
      to={`/project/${project.slug}`}
      onClick={() => onOpen(project.slug)}
      className="flex h-full flex-col gap-4 glass-card-soft ring-gradient-glow p-6 text-left transition-all duration-300 hover:shadow-[0_20px_70px_-15px_rgba(139,92,246,0.3)] hover:border-purple-500/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      <div className="flex flex-col gap-2">
        <h4 className="text-lg font-semibold leading-tight">{project.title}</h4>
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Why it matters:</span> {project.why_it_matters}
        </p>
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Goal:</span> {project.goal}
        </p>
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Difficulty:</span> {project.difficulty}
        </p>
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Time:</span> {project.time}
        </p>
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Portfolio Value:</span> {project.portfolio_value}
        </p>
      </div>
      <span className="text-sm font-medium text-primary underline-offset-2 hover:underline">View workflow →</span>
    </Link>
  );
};
