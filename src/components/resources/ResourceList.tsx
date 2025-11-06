"use client";

import type { ResourceWithMeta } from "@/types/resources";
import { ResourceCard } from "./ResourceCard";

interface ResourceListProps {
  resources: ResourceWithMeta[];
  onOpenResource: (slug: string, url: string) => void;
}
export const ResourceList = ({ resources, onOpenResource }: ResourceListProps) => {
  if (!resources.length) {
    return (
      <div className="mt-8">
        <div className="rounded-lg border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">
          No matches. Try clearing Level or Type.
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {resources.map((resource) => (
        <ResourceCard key={resource.id} resource={resource} onOpen={() => onOpenResource(resource.slug, resource.url)} />
      ))}
    </div>
  );
};
