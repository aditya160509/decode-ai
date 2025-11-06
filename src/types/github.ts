export type Level = 'Beginner' | 'Intermediate' | 'Advanced';

export interface Concept {
  title: string;
  definition: string;
  example: string;
  tip: string;
  diagram?: string;
}

export interface CommandBlock {
  command: string;
  description: string;
  category: string;
  badge: 'Beginner' | 'Common' | 'Safety' | 'Advanced';
  example_output?: string;
}

export interface FAQ {
  q: string;
  cli: string[];
  gui: string;
  link: string;
  tags: string[];
}

export interface PlaygroundScenario {
  id: string;
  title: string;
  goal: string;
  initial_files: Record<string, string>;
  objectives: string[];
  hints?: string[];
  solution: string[];
}

export interface QuizItem {
  question: string;
  options: string[];
  correct: string;
  explanation: string;
}

export interface WorkflowCard {
  name: string;
  description: string;
}

export interface CheatCluster {
  title: string;
  commands: string[];
}

export interface Intro {
  intro_text: string;
  quick_start: { title: string; url: string }[];
}

export interface PRFlow {
  steps: string[];
  mistakes: string[];
}
