export interface Intro {
  definitions: string[];
  examples: string[];
  visual_ideas: string[];
  quote: string;
}

export interface LlmVsMl {
  definitions: {
    llm: string;
    ml: string;
  };
  differences: string[];
  comparisons: string[];
  llm_outperform: string[];
  visual_ideas: string[];
}

export interface Tokens {
  definitions: string[];
  examples: string[];
  visual: string;
}

export interface Embeddings {
  definitions: string[];
  word_pairs: {
    high_similarity: string[];
    low_similarity: string[];
  };
  use_cases: string[];
  visual: string;
}

export interface Prompting {
  definition: string;
  styles: string[];
  bad_better: {
    bad: string;
    better: string;
  };
  principles: string[];
}

export interface Customization {
  definitions: string[];
  applications: string[];
  method_table: Array<{
    method: string;
    data: string;
    cost: string;
    flexibility: string;
    example: string;
  }>;
}

export interface Inference {
  steps: string[];
  tasks: string[];
  visual: string;
}

export interface Strengths {
  strengths: string[];
  limitations: string[];
  scenarios_strong: string[];
  scenarios_limit: string[];
  quote: string;
}

export interface Applications {
  sectors: Array<{
    name: string;
    examples: string[];
  }>;
}

export interface Ethics {
  bias_definition: string;
  principles: string[];
  examples: string[];
  safety_rules: string[];
}

export interface GlossaryItem {
  term: string;
  definition: string;
  why: string;
}

export interface DemoList {
  list: string[];
}

export interface QuotesStats {
  quotes: string[];
  stats: string[];
}

export interface QuizQuestion {
  q: string;
  options: string[];
  answer: string;
  why: string;
}
