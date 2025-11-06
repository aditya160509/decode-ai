import {
  type BuilderPrefs,
  type EnhancerFlag,
  type EnhancerMode,
  type EnhancerOutputFormat,
  type EnhancerPrefs,
  type EnhancerResult,
  type EnhancerRun,
  type EnhancerTask,
  type EnhancerTone,
  type EduPromptStorage,
  type MiniChallenge,
  type MiniChallengeGrade,
  type PromptTemplate,
} from "./types";
import { gradeMiniChallenge } from "./grading";

const STORAGE_KEY = "eduprompt";

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));

const DEFAULT_MODE: EnhancerMode = "refine";

const defaultStorage: EduPromptStorage = {
  recentEnhancerRuns: [],
  builderPrefs: {
    goalId: "",
    level: 3,
    tone: "student",
    outputFormat: "bullets",
    flags: ["doNotInvent"],
  },
  enhancerPrefs: {
    tone: "professional",
    level: 3,
    outputFormat: "paragraph",
    flags: [],
    mode: DEFAULT_MODE,
  },
};

export const getInitialStorage = (): EduPromptStorage => {
  if (typeof window === "undefined") {
    return clone(defaultStorage);
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return clone(defaultStorage);
    }
    const parsed = JSON.parse(raw) as Partial<EduPromptStorage>;
    return {
      ...clone(defaultStorage),
      ...parsed,
      builderPrefs: {
        ...defaultStorage.builderPrefs,
        ...(parsed?.builderPrefs ?? {}),
      },
      enhancerPrefs: {
        ...defaultStorage.enhancerPrefs!,
        ...(parsed?.enhancerPrefs ?? {}),
      },
      recentEnhancerRuns: parsed?.recentEnhancerRuns ?? [],
    };
  } catch {
    return clone(defaultStorage);
  }
};

const writeStorage = (next: EduPromptStorage) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore write errors to avoid disrupting UX
  }
};

const updateStorage = (producer: (current: EduPromptStorage) => EduPromptStorage) => {
  const current = getInitialStorage();
  const next = producer(current);
  writeStorage(next);
  return next;
};

// ---------- Prompt Enhancer ----------

type InputKind = "code" | "email" | "academic" | "short_note" | "general";

const ROLE_VARIANTS: Record<EnhancerTask, string[]> = {
  summarize: [
    "an education summarizer who keeps key ideas clear.",
    "a study notes coach who turns long text into quick takeaways.",
    "a course assistant who rewrites material for faster reading.",
  ],
  rewrite: [
    "a writing assistant who improves clarity and tone for any audience.",
    "a teammate who helps students turn rough drafts into confident prose.",
    "an editor who upgrades text so it matches the target reader.",
  ],
  proofread: [
    "an English proofreader who fixes grammar and punctuation while keeping style.",
    "a careful editor who polishes academic work without changing meaning.",
    "a reviewer who corrects errors while preserving the writer's voice.",
  ],
  explain_code: [
    "a programming tutor who explains code to beginners.",
    "a lab TA who walks through each line with calm clarity.",
    "an engineer who explains what the code does, why it matters, and shows an example.",
  ],
  feedback: [
    "a supportive teacher who gives balanced feedback.",
    "a mentor who celebrates wins and shows next steps.",
    "a reviewer who offers actionable suggestions without discouraging the learner.",
  ],
  plan: [
    "a project planner who breaks work into doable steps.",
    "a workflow coach who maps out clear progress.",
    "an execution assistant who turns intent into action steps.",
  ],
  reasoning: [
    "a data science TA who guides structured reasoning.",
    "an analytical partner who keeps thinking transparent.",
    "a coach who breaks down logic before providing answers.",
  ],
};

const TASK_VARIANTS: Record<EnhancerTask, string[]> = {
  summarize: [
    "Summarize the text for a learner who needs the essentials quickly.",
    "Reduce the text to the main idea plus two to three supporting details.",
    "Keep the original intent and domain terms while making the gist obvious.",
  ],
  rewrite: [
    "Rewrite the text so it sounds clear and confident for the target reader.",
    "Keep all facts and numbers but improve flow and readability.",
    "Upgrade the phrasing so it aligns with the expectations of the audience.",
  ],
  proofread: [
    "Correct grammar, punctuation, and spelling without altering meaning.",
    "Polish the sentences while keeping terminology and tone intact.",
    "Fix errors and awkward phrasing while preserving structure.",
  ],
  explain_code: [
    "State in one sentence what the code accomplishes.",
    "Explain each relevant line in simple language a beginner can follow.",
    "Provide one example input and the resulting output to illustrate behavior.",
  ],
  feedback: [
    "Highlight one clear strength, one improvement, and one actionable tip.",
    "Balance encouragement with specific adjustments the learner can make.",
    "Keep feedback under 120 words and tie it to the original task.",
  ],
  plan: [
    "Outline a three-step plan with verbs leading each step.",
    "Make the plan concrete, time-bound, and realistic for the described context.",
    "Ensure each step connects logically and leads toward the stated goal.",
  ],
  reasoning: [
    "Restate the problem, list assumptions, and present the conclusion with supporting logic.",
    "Expose intermediate thinking so the learner can follow the reasoning path.",
    "Keep explanations concise but transparent about each decision.",
  ],
};

const TONE_SENTENCES: Record<EnhancerTone, string> = {
  student: "Write like you are helping a college student after class.",
  friendly: "Sound warm and supportive.",
  professional: "Use business English and stay concise.",
  executive: "Focus on outcomes and skip background details.",
  teacher: "Explain choices and encourage the learner.",
  beginner: "Avoid jargon and explain terms right away.",
};

const FORMAT_SENTENCES: Record<EnhancerOutputFormat, string> = {
  paragraph: "Output a single clean paragraph.",
  bullets: "Output three to six bullet points sorted by importance.",
  steps: "Output numbered steps.",
  json: "Output valid JSON with keys task, content, and notes.",
  table: "Output a two column table with Label and Content.",
  "one sentence": "Reply with a single precise sentence.",
};

const FLAG_SENTENCES: Record<EnhancerFlag, string> = {
  doNotInvent: "Do not invent facts or examples that are not in the input.",
  keepTone: "Keep the original speaking style if it is present.",
  keepCodeBlocks: "Keep all code blocks in triple backticks without edits.",
};

type InputAnalysis = {
  inputKind: InputKind;
  wordCount: number;
  sentenceCount: number;
  containsCode: boolean;
  containsEmailGreeting: boolean;
  containsAcademicSignals: boolean;
};

const tokenize = (text: string) =>
  text
    .toLowerCase()
    .split(/[^a-z0-9]+/i)
    .filter(Boolean);

const analyseInput = (input: string): InputAnalysis => {
  const text = input.trim();
  const lower = text.toLowerCase();

  const containsCode =
    /```|function\s|\bdef\s|\bclass\s|\breturn\b|=>|console\.log|\bend\b/.test(lower) ||
    /[{};(<>)=]{3,}/.test(text);

  const containsEmailGreeting = /(dear\s+\w+|hi\s+\w+|hello\s+\w+)/i.test(text);
  const academicSignals =
    /(study|research|evidence|participants|literature|analysis|dataset|findings)/i.test(lower);

  let inputKind: InputKind = "general";
  if (containsCode) {
    inputKind = "code";
  } else if (containsEmailGreeting || /\bregards\b|\bthanks\b/i.test(lower)) {
    inputKind = "email";
  } else if (academicSignals && text.length > 200) {
    inputKind = "academic";
  } else if (text.length < 120) {
    inputKind = "short_note";
  }

  const wordCount = tokenize(text).length;
  const sentenceCount = text.split(/[.!?]+/).filter((part) => part.trim().length > 0).length;

  return {
    inputKind,
    wordCount,
    sentenceCount,
    containsCode,
    containsEmailGreeting,
    containsAcademicSignals: academicSignals,
  };
};

const detectIntent = (input: string, analysis: InputAnalysis): EnhancerTask => {
  const lower = input.toLowerCase();

  const has = (phrases: string[]) => phrases.some((phrase) => lower.includes(phrase));

  if (analysis.containsCode) return "explain_code";
  if (has(["proofread", "fix grammar", "correct", "typo"])) return "proofread";
  if (has(["rewrite", "rephrase", "polish", "improve tone"])) return "rewrite";
  if (has(["summarize", "summary", "make it short"])) return "summarize";
  if (has(["steps", "plan", "roadmap", "workflow"])) return "plan";
  if (analysis.containsAcademicSignals && analysis.wordCount > 160) return "summarize";
  return "rewrite";
};

const applyModeOverride = (
  detectedTask: EnhancerTask,
  mode: EnhancerMode,
  analysis: InputAnalysis,
  input: string
): { task: EnhancerTask; extraConstraints: string[] } => {
  const extras: string[] = [];
  if (mode === "refine") {
    return { task: "rewrite", extraConstraints: ["Focus on tightening wording and removing filler language."] };
  }
  if (mode === "expand") {
    const longContent = analysis.wordCount > 120 || analysis.sentenceCount > 6;
    const forcedTask = longContent ? "feedback" : "plan";
    extras.push("Add thoughtful depth instead of repeating the original text.");
    return { task: forcedTask, extraConstraints: extras };
  }
  if (mode === "clarify") {
    if (analysis.inputKind === "code") {
      extras.push("Explain each part in simple language a beginner can follow.");
      return { task: "explain_code", extraConstraints: extras };
    }
    extras.push("Use plain language so a busy learner can understand instantly.");
    return { task: "summarize", extraConstraints: extras };
  }
  if (mode === "polish") {
    if (analysis.inputKind === "code") {
      extras.push("Clarify the intent without modifying the code itself.");
      return { task: "rewrite", extraConstraints: extras };
    }
    if (analysis.inputKind === "email" || analysis.inputKind === "academic") {
      extras.push("Fix grammar and punctuation issues while keeping the original voice.");
      return { task: "proofread", extraConstraints: extras };
    }
    extras.push("Upgrade the tone to sound trustworthy and confident.");
    return { task: "rewrite", extraConstraints: extras };
  }
  return { task: detectedTask, extraConstraints: extras };
};

const computeSeed = (input: string, level: number, task: EnhancerTask) => {
  const base = Array.from(input).reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return (base + level * 17 + task.length * 13) >>> 0;
};

const pickVariant = (variants: string[], seed: number) => {
  if (!variants.length) return "";
  const index = seed % variants.length;
  return variants[index];
};

const capitalise = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

const buildConstraints = (
  task: EnhancerTask,
  level: number,
  tone: EnhancerTone,
  format: EnhancerOutputFormat,
  flags: EnhancerFlag[],
  extra: string[]
) => {
  const constraints: string[] = [];

  const levelConstraints: Record<number, string[]> = {
    1: ["Keep the response brief and actionable."],
    2: ["Match the intended audience and mirror their expected tone."],
    3: ["Follow the structure implied by the task so the result is easy to scan."],
    4: [
      "Do not invent facts. Preserve key terminology exactly.",
      "Keep any code blocks untouched and clearly separated.",
    ],
    5: [
      "Lay out the response with clear sections for Task, Context, Constraints, Output, and Validation.",
      "Respect every selection noted in this prompt without deviation.",
    ],
  };

  levelConstraints[level]?.forEach((line) => constraints.push(line));

  if (TONE_SENTENCES[tone]) {
    constraints.push(TONE_SENTENCES[tone]);
  }

  if (FORMAT_SENTENCES[format]) {
    constraints.push(FORMAT_SENTENCES[format]);
  }

  flags.forEach((flag) => {
    const line = FLAG_SENTENCES[flag];
    if (line) constraints.push(line);
  });

  if (task === "explain_code") {
    constraints.push("State the purpose before diving into syntax and conclude with one runnable example.");
  }
  if (task === "plan") {
    constraints.push("Make the plan realistic and time-aware.");
  }
  if (task === "feedback") {
    constraints.push("Balance encouragement with specific improvement guidance.");
  }
  extra.forEach((line) => constraints.push(line));

  const unique = constraints.filter(Boolean);
  return unique;
};

const VALIDATION_LINE =
  "Before you finalize, check that the task is complete, no extra facts were added, and tone matches the audience. If anything is missing fix it and return only the fixed version.";

const composePrompt = (
  input: string,
  task: EnhancerTask,
  analysis: InputAnalysis,
  mode: EnhancerMode,
  level: number,
  tone: EnhancerTone,
  format: EnhancerOutputFormat,
  flags: EnhancerFlag[],
  extraConstraints: string[]
): { prompt: string; taskUsed: EnhancerTask } => {
  const seed = computeSeed(input, level, task);
  let roleLine = pickVariant(ROLE_VARIANTS[task], seed);
  let taskLine = pickVariant(TASK_VARIANTS[task], seed + 7);
  if (!roleLine) roleLine = `an assistant focused on ${task.replace("_", " ")} tasks.`;
  if (!taskLine) taskLine = "Perform the requested task with clarity.";

  if (level >= 4 && !roleLine.toLowerCase().startsWith("you are")) {
    roleLine = `You are ${roleLine}`;
  }
  if (level <= 3 && roleLine.toLowerCase().startsWith("you are")) {
    roleLine = roleLine.replace(/^you are\s+/i, "");
    roleLine = capitalise(roleLine);
  }
  if (level >= 4 && !taskLine.endsWith(".")) {
    taskLine = `${taskLine}.`;
  }

  if (mode === "clarify" && analysis.inputKind === "code") {
    extraConstraints.push("Explain every portion in simpler language than the original.");
  }

  const constraints = buildConstraints(task, level, tone, format, flags, extraConstraints);
  const constraintsText = constraints
    .map((line) => (line.trim().endsWith(".") ? line.trim() : `${line.trim()}.`))
    .join(" ");

  const blocks: string[] = [
    capitalise(roleLine.trim()),
    capitalise(taskLine.trim()),
    `Content:\n${input.trim()}`,
    `Constraints:\n${constraintsText}`,
  ];

  if (level >= 4 || (level >= 2 && mode === "polish")) {
    blocks.push(`Validation:\n${VALIDATION_LINE}`);
  }

  return {
    prompt: blocks.join("\n\n"),
    taskUsed: task,
  };
};

const extractNouns = (text: string) => {
  const tokens = tokenize(text).filter((token) => token.length > 3);
  return Array.from(new Set(tokens)).slice(0, 5);
};

const shortenText = (text: string, maxWords: number) => {
  const words = tokenize(text);
  return words.slice(0, maxWords).join(" ");
};

const capitaliseSentence = (sentence: string) => {
  const trimmed = sentence.trim();
  if (!trimmed) return "";
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
};

const simulateRewrite = (input: string) => {
  const sentences = input.split(/[.!?]+/).map((part) => part.trim()).filter(Boolean);
  const base = sentences.slice(0, 2).join(" ");
  let result = base
    .replace(/\bkind of\b/gi, "")
    .replace(/\bmaybe\b/gi, "")
    .replace(/\bsort of\b/gi, "")
    .replace(/\bI think\b/gi, "")
    .replace(/\bwe might\b/gi, "we can")
    .replace(/\bcan't\b/gi, "cannot");
  result = capitaliseSentence(result);
  if (!/[.!?]$/.test(result)) {
    result = `${result}.`;
  }
  return `Cleaned up version: ${result}`;
};

const simulateProofread = (input: string) => {
  const trimmed = input.trim();
  if (!trimmed) return "";
  let result = trimmed
    .replace(/\bi\b/g, "I")
    .replace(/\bim\b/g, "I'm")
    .replace(/\bpls\b/gi, "please")
    .replace(/\bthx\b/gi, "thanks")
    .replace(/\bu\b/gi, "you");
  result = result.replace(/\s+/g, " ");
  result = capitaliseSentence(result);
  if (!/[.!?]$/.test(result)) {
    result = `${result}.`;
  }
  return result;
};

const simulateExplainCode = (input: string) => {
  const nouns = extractNouns(input);
  const mainTerm = nouns[0] ?? "the code";
  const exampleTerm = nouns.find((token) => /\d/.test(token)) ?? "example";
  return [
    "What it does:",
    `• Explains how ${mainTerm} behaves and what it returns.`,
    "Steps:",
    "• Walk through the main operations in order so a beginner can track the flow.",
    "Example:",
    `• Provide a simple input and show the resulting output (for instance ${exampleTerm}).`,
  ].join("\n");
};

const simulatePlan = (input: string) => {
  const topics = extractNouns(input);
  const [first, second, third] = [topics[0], topics[1], topics[2]];
  return [
    `Step 1: Audit ${first ?? "the current state"} and capture the goals.`,
    `Step 2: Build a focused action on ${second ?? "the key tasks"} with owners and timing.`,
    `Step 3: Review ${third ?? "progress"} and adjust based on feedback.`,
  ].join("\n");
};

const simulateFeedback = (input: string) => {
  const subject = extractNouns(input)[0] ?? "the work";
  return [
    `Good: ${capitaliseSentence(`you highlighted ${subject} well.`)}`,
    "Improve: Add one detail that shows how the idea works in practice.",
    "Next time: Follow the original order and check tone before submitting.",
  ].join("\n");
};

const simulateSummarize = (input: string) => {
  const subject = extractNouns(input)[0] ?? "the topic";
  const effect = extractNouns(input)[1] ?? "its impact";
  const audience = extractNouns(input)[2] ?? "the reader";
  return [
    "Key points",
    `• Focus: ${capitaliseSentence(`${subject} and what it covers.`)}`,
    `• Impact: ${capitaliseSentence(`${effect} changes for the main stakeholders.`)}`,
    `• Audience: ${capitaliseSentence(`${audience} should understand the takeaway quickly.`)}`,
  ].join("\n");
};

const generateSimulatedAnswer = (task: EnhancerTask, input: string) => {
  if (!input.trim()) {
    return "Provide input to preview a simulated model answer.";
  }
  switch (task) {
    case "summarize":
      return simulateSummarize(input);
    case "rewrite":
      return simulateRewrite(input);
    case "proofread":
      return simulateProofread(input);
    case "explain_code":
      return simulateExplainCode(input);
    case "plan":
      return simulatePlan(input);
    case "feedback":
      return simulateFeedback(input);
    default:
      return simulateSummarize(input);
  }
};

const computeEnhancerScore = (prompt: string, input: string, task: EnhancerTask) => {
  let score = 50;
  if (prompt.length > 80) score += 10;
  if (/(summarize|rewrite|proofread|explain|plan|feedback)/i.test(prompt)) score += 10;
  if (/(do not invent|keep)/i.test(prompt)) score += 5;
  if (task === "explain_code" && /(example|input|output)/i.test(prompt)) score += 5;
  if (/[A-Z]{6,}/.test(prompt)) score -= 5;
  if (input.trim().length < 12 && score > 65) score = 65;
  score = Math.max(0, Math.min(100, Math.round(score)));
  let label: "Weak" | "Good" | "Strong" = "Weak";
  if (score >= 80) label = "Strong";
  else if (score >= 60) label = "Good";
  return { score, label };
};

export const resolveEnhancerResult = ({
  input,
  tone,
  format,
  level,
  flags,
  mode,
}: {
  input: string;
  tone: EnhancerTone;
  format: EnhancerOutputFormat;
  level: number;
  flags: EnhancerFlag[];
  mode: EnhancerMode;
}): EnhancerResult => {
  const trimmed = input.trim();
  const analysis = analyseInput(trimmed);
  const detected = detectIntent(trimmed, analysis);
  const { task, extraConstraints } = applyModeOverride(detected, mode, analysis, trimmed);

  const { prompt } = composePrompt(trimmed, task, analysis, mode, level, tone, format, flags, extraConstraints);
  const simulatedAnswer = generateSimulatedAnswer(task, trimmed);
  const { score, label } = computeEnhancerScore(prompt, trimmed, task);

  return {
    enhancedPrompt: prompt,
    simulatedAnswer,
    score,
    label,
    task,
  };
};

export const persistEnhancerPrefs = (prefs: EnhancerPrefs) => {
  updateStorage((prev) => ({
    ...prev,
    enhancerPrefs: { ...prefs },
  }));
};

export const persistBuilderPrefs = (prefs: BuilderPrefs) => {
  updateStorage((prev) => ({
    ...prev,
    builderPrefs: { ...prefs },
  }));
};

export const pushEnhancerRun = (run: EnhancerRun) => {
  const next = updateStorage((prev) => {
    const recent = [run, ...prev.recentEnhancerRuns].slice(0, 3);
    return {
      ...prev,
      recentEnhancerRuns: recent,
    };
  });
  return next.recentEnhancerRuns;
};

// ---------- Wizard Builder ----------

type WizardTask = "summarize" | "rewrite" | "proofread" | "explain_code" | "structure" | "error";

const mapGoalToTask = (goal: string): WizardTask => {
  const lower = goal.toLowerCase();
  if (lower.startsWith("summarize") || lower.includes("classroom summary") || lower.includes("without adding facts")) {
    return "summarize";
  }
  if (
    lower.startsWith("rewrite") ||
    lower.includes("convert notes to email") ||
    lower.includes("non native") ||
    lower.includes("long sentence")
  ) {
    return "rewrite";
  }
  if (lower.startsWith("proofread")) return "proofread";
  if (lower.startsWith("explain code")) return "explain_code";
  if (lower.includes("turn text into steps") || lower.includes("presentation") || lower.includes("report")) {
    return "structure";
  }
  if (lower.includes("explain an error")) return "error";
  return "summarize";
};

const BASE_INSTRUCTIONS: Record<WizardTask, string> = {
  summarize: "Summarize the given text for the target audience. Keep the main idea clear.",
  rewrite: "Rewrite the given text for the target audience so it is clearer and easier to read.",
  proofread: "Proofread the text for grammar, punctuation, and clarity while keeping the meaning.",
  explain_code: "Explain the following code to a learner who is new to this topic.",
  structure: "Turn the following content into a clean structured output.",
  error: "Explain the error and show how to fix it.",
};

const LEVEL_LINES: Record<number, string> = {
  1: "Do the task above on the text I will give you. Keep it simple and do not add extra parts.",
  2: "Do the task above on the text I will give you. Write it for this audience and match the tone.",
  3: "Do the task above on the text I will give you. First restate the main point. Then present the result in the format that fits this task. Also tell me if any part was unclear.",
  4: "You are an education assistant. Do the task above. Do not invent facts. Keep domain terms exactly. Keep code blocks. Output in the selected format or the default format from level 3.",
  5: "You are an expert prompt writing assistant for education content. Task. Context. Constraints. Output. Validation. Use all user selections. Respect doNotInvent, keepTone, keepCodeBlocks.",
};

const TONE_INJECTIONS: Record<string, string> = {
  student: "Write like you are helping a college student after class.",
  friendly: "Be warm and supportive throughout the response.",
  professional: "Use business English and stay concise.",
  executive: "Be short, outcome focused, and skip background.",
  teacher: "Explain choices and encourage the learner.",
  beginner: "Avoid jargon and explain terms right away.",
};

const FORMAT_INJECTIONS: Record<string, string> = {
  paragraph: "Output exactly one clear paragraph.",
  bullets: "Output 3 to 6 bullet points.",
  steps: "Output numbered steps.",
  json: "Output valid JSON with keys task, content, notes.",
  table: "Output a table with columns Label and Content.",
};

const FLAG_INJECTIONS: Record<EnhancerFlag, string> = {
  doNotInvent: "Do not invent facts or examples.",
  keepTone: "Keep the original tone where possible.",
  keepCodeBlocks: "Keep code blocks exactly as they appear.",
};

export const buildWizardPrompt = ({
  goal,
  level,
  tone,
  outputFormat,
  flags,
}: {
  goal: string;
  level: number;
  tone: string | null;
  outputFormat: string | null;
  flags: string[];
}) => {
  const task = mapGoalToTask(goal);
  const base = BASE_INSTRUCTIONS[task];
  const lines: string[] = [base, LEVEL_LINES[level]];

  if (tone && TONE_INJECTIONS[tone]) {
    lines.push(TONE_INJECTIONS[tone]);
  }
  if (outputFormat && FORMAT_INJECTIONS[outputFormat]) {
    lines.push(FORMAT_INJECTIONS[outputFormat]);
  }
  flags.forEach((flag) => {
    if (FLAG_INJECTIONS[flag as EnhancerFlag]) {
      lines.push(FLAG_INJECTIONS[flag as EnhancerFlag]);
    }
  });

  const prompt = lines.map((line) => (line.endsWith(".") ? line : `${line}.`)).join(" ");

  return {
    prompt,
    taskType: task === "error" ? "explain_code" : task,
    goal,
    level,
    tone,
    outputFormat,
    flags,
  };
};

// ---------- Mini Quiz ----------

export const scoreMiniQuizAnswer = (challenge: MiniChallenge, answer: string): MiniChallengeGrade =>
  gradeMiniChallenge(challenge, answer);

// ---------- Shared helpers ----------

export const slugifyGoal = (goal: string) =>
  goal
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const sortTemplates = (templates: PromptTemplate[]) =>
  [...templates].sort((a, b) => a.name.localeCompare(b.name));

export const applyProgramSearch = <T extends { name?: string; title?: string; description?: string; taskType?: string }>(
  items: T[],
  search: string
) => {
  if (!search.trim()) return items;
  const query = search.toLowerCase();
  return items.filter((item) => {
    const haystack = [item.name, item.title, item.description, item.taskType]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return haystack.includes(query);
  });
};

const dimensionScore = (present: boolean) => (present ? 2 : 0);

export const heuristicComparisonScore = (prompt: string) => {
  const text = prompt.toLowerCase();
  const clarity = dimensionScore(/(summarize|rewrite|explain|proofread|plan|feedback|reason)/.test(text));
  const audience = dimensionScore(/(student|manager|beginner|grade|teacher|executive|audience|customer|developer)/.test(text));
  const structure = dimensionScore(/(bullet|step|number|list|outline|1\.|2\.|3\.|•|-)/.test(prompt));
  const constraints = dimensionScore(/(do not|avoid|keep|must|limit|exactly|include)/.test(text));
  const examples = dimensionScore(/(example|for instance|such as)/.test(text));
  return clarity + audience + structure + constraints + examples;
};

export const comparisonScoreLabel = (score: number): "Weak" | "Good" | "Strong" => {
  if (score >= 8) return "Strong";
  if (score >= 5) return "Good";
  return "Weak";
};
