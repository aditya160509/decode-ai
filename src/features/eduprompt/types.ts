export type PromptTemplate = {
  id: string;
  name: string;
  description: string;
  basePrompt: string;
  taskType: string;
};

export type BuilderConfig = {
  builder: {
    goals: string[];
    levels: Record<string, string>;
    toneOptions: string[];
    outputFormats: string[];
    extraFlags: string[];
  };
};

export type ComparisonSample = {
  id: string;
  title: string;
  taskType: string;
  promptA: string;
  promptB: string;
  outputA: string;
  outputB: string;
  scoreA: number;
  scoreB: number;
  whyBetter: string;
};

export type MiniChallenge = {
  id: string;
  title: string;
  difficulty: string;
  taskType: string;
  inputText: string;
  idealAnswer: string;
};

export type MiniChallengeParameterScore = {
  name: string;
  points: number;
  max: number;
};

export type MiniChallengeBreakdown = {
  parameters: MiniChallengeParameterScore[];
  notes: string[];
};

export type MiniChallengeGrade = {
  id: string;
  taskType: "Summarize" | "Rewrite" | "Proofread" | "Explain Code";
  difficulty: string;
  score: number;
  grade: "Excellent" | "Strong" | "Fair" | "Weak" | "Poor" | "invalid_response";
  breakdown: MiniChallengeBreakdown;
  feedback: string;
};

export type ScoringConfig = {
  scoring: {
    global: {
      startScore: number;
      emptyAnswerScore: number;
      copyIdealCap: number;
      lengthTooShortRatio: number;
      lengthTooShortPenalty: number;
      lengthTooLongRatio: number;
      lengthTooLongPenalty: number;
      clampMin: number;
      clampMax: number;
    };
    summarize: {
      mustMentionMainSubjectPenalty: number;
      mustKeepKeyConstraintPenalty: number;
      noNewFactsPenalty: number;
      clarityPenalty: number;
    };
    rewrite: {
      keepTargetTonePenalty: number;
      keepSpellingPenalty: number;
      meaningChangedPenalty: number;
      rudeTonePenalty: number;
    };
    proofread: {
      perErrorPenalty: number;
      maxErrorPenalty: number;
      overRewriteMin: number;
      overRewriteMax: number;
      noCapitalizationPenalty: number;
    };
    explain_code: {
      purposeBonus: number;
      inputsOutputsBonus: number;
      lineByLineBonus: number;
      tooVaguePenalty: number;
      inventedBehaviorPenalty: number;
    };
    labels: { min: number; max: number; label: string }[];
    pseudo: string;
  };
};

export type EnhancerTone =
  | "professional"
  | "friendly"
  | "student"
  | "teacher"
  | "beginner"
  | "executive";

export type EnhancerOutputFormat =
  | "paragraph"
  | "bullets"
  | "steps"
  | "table"
  | "json"
  | "one sentence";

export type EnhancerFlag = "doNotInvent" | "keepTone" | "keepCodeBlocks";

export type EnhancerMode = "refine" | "expand" | "clarify" | "polish";

export type EnhancerTask =
  | "summarize"
  | "rewrite"
  | "proofread"
  | "explain_code"
  | "feedback"
  | "plan"
  | "reasoning";

export type EnhancerRun = {
  ts: number;
  input: string;
  enhanced: string;
  simulated: string;
  score: number;
  label: "Weak" | "Good" | "Strong";
  mode: EnhancerMode;
  task: EnhancerTask;
};

export type BuilderPrefs = {
  goalId: string;
  level: number;
  tone: string | null;
  outputFormat: string | null;
  flags: string[];
};

export type EnhancerPrefs = {
  tone: EnhancerTone;
  level: number;
  outputFormat: EnhancerOutputFormat;
  flags: EnhancerFlag[];
  mode: EnhancerMode;
};

export type EduPromptStorage = {
  recentEnhancerRuns: EnhancerRun[];
  builderPrefs: BuilderPrefs;
  enhancerPrefs?: EnhancerPrefs;
};

export type EnhancerResult = {
  enhancedPrompt: string;
  score: number;
  label: "Weak" | "Good" | "Strong";
  task: EnhancerTask;
  simulatedAnswer: string;
};
