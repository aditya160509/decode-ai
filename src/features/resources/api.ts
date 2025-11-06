import { slugify } from "@/lib/slugify";
import type { Resource, ResourceDataset, ResourceWithMeta } from "@/types/resources";
import type { ProjectBatch, ProjectsDataset } from "@/types/projects";

const RESOURCES_PATH = "/data/resources.json";
const PROJECTS_PATH = "/data/projects.json";

const normalizeResource = (resource: Resource, index: number): ResourceWithMeta => {
  const slug = slugify(resource.title);

  const durationMatch = resource.duration.match(/(\d+)\s*h/i);
  const minutesMatch = resource.duration.match(/(\d+)\s*m/i);
  const durationHours = durationMatch ? Number.parseInt(durationMatch[1], 10) : 0;
  const durationMinutes = minutesMatch ? Number.parseInt(minutesMatch[1], 10) : null;
  const totalMinutes = durationHours * 60 + (durationMinutes ?? 0);

  return {
    ...resource,
    id: `${slug}-${index}`,
    slug,
    durationMinutes: Number.isFinite(totalMinutes) && totalMinutes > 0 ? totalMinutes : null,
  };
};

export const fetchResources = async (): Promise<ResourceWithMeta[]> => {
  const response = await fetch(RESOURCES_PATH, { cache: "force-cache" });
  if (!response.ok) {
    throw new Error("Unable to load resources.json");
  }
  const dataset = (await response.json()) as ResourceDataset;
  return dataset.resources.map(normalizeResource);
};

export const fetchProjectBatches = async (): Promise<ProjectBatch[]> => {
  const response = await fetch(PROJECTS_PATH, { cache: "force-cache" });
  if (!response.ok) {
    throw new Error("Unable to load projects dataset");
  }
  const dataset = (await response.json()) as ProjectsDataset;
  return dataset.batches;
};
