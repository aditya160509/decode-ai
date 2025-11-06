import { approximateTokens } from "./tokens";
import { getPersonality, PersonalityDefinition } from "./personalities";

export type SimulateRunOptions = {
  prompt: string;
  modelName: string;
  personalityId: string;
  stepCount?: number;
};

export type SimulatedStep = {
  stage: string;
  text: string;
};

export type SimulatedRun = {
  model: string;
  tokens: number;
  runtime: number;
  steps: SimulatedStep[];
  final: string;
};

const SUMMARY_BY_TONE: Record<string, string> = {
  neutral: "In summary this answer balances reasoning and clarity.",
  warm: "In summary this keeps empathy and care at the center.",
  precise: "In summary this follows documented steps with clean logic.",
  playful: "In summary this keeps ideas flexible and creative.",
  friendly: "In summary this guides the learner with clear next steps."
};

const STEP_TEMPLATES = [
  (verb: string) => `${capitalize(verb)} the prompt to capture the core need.`,
  (verb: string) => `${capitalize(verb)} supporting details so the response stays grounded.`,
  (verb: string) => `${capitalize(verb)} tradeoffs and edge cases before deciding.`,
  (verb: string) => `${capitalize(verb)} the outcome so it is easy to use.`
];

function capitalize(word: string) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

function buildSteps(personality: PersonalityDefinition, count: number): SimulatedStep[] {
  const verbs = personality.verbs.length ? personality.verbs : ["plan", "act", "observe", "report"];
  const steps: SimulatedStep[] = [];
  for (let i = 0; i < count; i++) {
    const verb = verbs[i % verbs.length];
    const stage = capitalize(verb);
    const template = STEP_TEMPLATES[i % STEP_TEMPLATES.length];
    steps.push({ stage, text: template(verb) });
  }
  return steps;
}

export function simulateModelRun(options: SimulateRunOptions): SimulatedRun {
  const { prompt, modelName, personalityId, stepCount = 4 } = options;
  const personality = getPersonality(personalityId);
  const tokens = approximateTokens(prompt);
  const runtime = Number(Math.max(0.5, (tokens / 45) * personality.reasoningMultiplier).toFixed(1));
  const steps = buildSteps(personality, stepCount);
  const final = SUMMARY_BY_TONE[personality.tone] ?? SUMMARY_BY_TONE.neutral;

  return {
    model: modelName,
    tokens,
    runtime,
    steps,
    final
  };
}
