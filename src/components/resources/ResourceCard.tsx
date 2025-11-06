"use client";

import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { ResourceWithMeta } from "@/types/resources";

interface ResourceCardProps {
  resource: ResourceWithMeta;
  onOpen: () => void;
}

export const ResourceCard = ({ resource, onOpen }: ResourceCardProps) => {
  return (
    <article className="flex flex-col gap-4 glass-card-soft ring-gradient-glow hover:shadow-[0_20px_70px_-15px_rgba(139,92,246,0.3)] transition-all duration-300 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold leading-tight">{resource.title}</h3>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onOpen}
          aria-label={`Open ${resource.title} in a new tab`}
        >
          <ExternalLink className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <Badge variant="secondary">{resource.type}</Badge>
        <Badge variant="outline">{resource.level}</Badge>
        <Badge variant="outline">{resource.duration}</Badge>
        <Badge variant="outline">{resource.language}</Badge>
        <span>By {resource.author}</span>
      </div>

      <p className="text-sm text-muted-foreground">{resource.takeaway || resource.summary}</p>
    </article>
  );
};
