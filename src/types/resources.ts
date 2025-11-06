export interface Resource {
  title: string;
  type: string;
  url: string;
  duration: string;
  level: string;
  summary: string;
  author: string;
  language: string;
  takeaway: string;
}

export interface ResourceWithMeta extends Resource {
  id: string;
  slug: string;
  durationMinutes?: number | null;
}

export type ResourceTypeFilter = string[];
export type ResourceLevelFilter = string[];
export type ResourceLanguageFilter = string[];

export interface ResourceFilters {
  topic: string | null;
  type: ResourceTypeFilter;
  level: ResourceLevelFilter;
  lang: ResourceLanguageFilter;
  q: string;
}

export interface ResourceDataset {
  resources: Resource[];
}
