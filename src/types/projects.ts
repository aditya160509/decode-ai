export interface ProjectContentSection {
  label: string;
  items: string[];
}

export interface ProjectEntry {
  slug: string;
  title: string;
  batch: string;
  why_it_matters: string;
  goal: string;
  users: string;
  difficulty: string;
  time: string;
  data: ProjectContentSection;
  ai_use: string[];
  workflow: string[];
  portfolio_value: string;
  summary?: string;
}

export interface ProjectBatch {
  name: string;
  summary: string[];
  projects: ProjectEntry[];
}

export interface ProjectsDataset {
  batches: ProjectBatch[];
}
