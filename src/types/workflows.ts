export interface ProjectSummary {
  slug: string;
  title: string;
  topic: string;
  why_it_matters: string;
  goal: string;
  users: string;
  difficulty: string;
  time_estimate: string;
  skills?: string[];
}

export interface WorkflowProject extends ProjectSummary {
  outcome?: string;
  data?: string | string[];
  ai?: string | string[];
  workflow: string[];
  stack?: string | string[];
  ux_ui?: string | string[];
  metrics_validation?: string | string[];
  timeline_cost?: string | string[];
  collab?: string | string[];
  judging?: string | string[];
  notes?: string | string[];
}

export interface WorkflowDataset {
  projects: ProjectSummary[];
}

export interface TopicStats {
  averageDifficulty: number;
  averageDifficultyLabel: string;
  averageTimeEstimate: string;
  shortPitch: string;
}
