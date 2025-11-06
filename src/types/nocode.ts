export interface Intro {
  intro_text: string;
  quick_start: { title: string; url: string }[];
}

export interface RecoOption {
  text: string;
  adds?: string[];
  require?: string[];
  prefer?: string[];
  avoid?: string[];
}

export interface RecoQuestion {
  question: string;
  options: RecoOption[];
}

export type ToolCategory =
  | "builder"
  | "hosting"
  | "python_app"
  | "automation"
  | "database"
  | "site_builder";

export interface ToolCaps {
  tool: string;
  category: ToolCategory;
  capabilities: Record<string, boolean | string>;
  limits?: Record<string, boolean | string | number>;
}

export interface WeightsConfig {
  weights: {
    require: number;
    prefer: number;
    adds: number;
    avoid: number;
  };
  penalties: Record<string, number>;
  combo_rules: {
    if: string[];
    then_add?: string[];
    then_penalize?: string[];
  }[];
}

export interface CuratedOutput {
  stack: string[];
  summary: string;
  buttons: { label: string; url: string }[];
}

export interface DeployStep {
  id: string;
  title: string;
  minutes: number;
  link?: string;
}

export interface IntegrationCard {
  title: string;
  tools_involved: string[];
  steps: string[];
  pitfalls?: string;
  diagram_placeholder?: string;
}

export interface LimitRow {
  tool: string;
  free_tier: string;
  limit: string;
  build_time: string;
  sleep: string;
  notes: string;
}

export interface TroubleshootRow {
  issue: string;
  cause: string;
  fix: string;
}

export interface FAQ {
  q: string;
  a: string;
  link?: string;
}

export interface BestPractice {
  title: string;
  tip: string;
}

export interface StarterKit {
  name: string;
  description: string;
  stack: string[];
  prompt: string;
}

export interface Showcase {
  title: string;
  description: string;
  buttonText: string;
  buttonHref: string;
  tags: string[];
}

export interface ComparisonRow {
  feature: string;
  [tool: string]: string;
}

export interface Takeaways {
  takeaways: string[];
}

export interface WhyItem {
  tool: string;
  boosts: string[];
  requirements_met: string[];
  penalties: string[];
}

export interface RecoResult {
  stack: string[];
  summary: string;
  why: WhyItem[];
  tradeoffs: string[];
  alternatives: { stack: string[]; when: string }[];
}

export interface DemoInputField {
  name: string;
  type: string;
  placeholder?: string;
  example?: string | number;
}

export interface DemoConfig {
  id: string;
  title: string;
  description: string;
  demo_type: "static_preview" | "interactive_client" | "hosted_embed";
  inputs: DemoInputField[];
  runtime: string;
  stack_mapping: string[];
  demo_url?: string;
  preview_image?: string;
  instructions?: string;
  estimated_time?: string;
}

export interface LaunchTemplate {
  id: string;
  title: string;
  horizon_days: number;
  task_scale: number;
}

export interface LaunchPlanConfig {
  templates: LaunchTemplate[];
  role_presets: { size: number; roles: string[] }[];
}

export interface StressProfile {
  profile: string;
  DAU: number;
  requests_per_user: number;
  avg_model_mb: number;
  inference_per_hour: number;
}
