import type {
  MiniChallenge,
  MiniChallengeGrade,
  MiniChallengeParameterScore,
} from "./types";

const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "but",
  "by",
  "for",
  "from",
  "has",
  "have",
  "if",
  "in",
  "into",
  "is",
  "it",
  "of",
  "on",
  "or",
  "that",
  "the",
  "their",
  "there",
  "they",
  "to",
  "was",
  "were",
  "with",
  "your",
  "this",
  "those",
  "these",
]);

const CONNECTORS = [
  "because",
  "so",
  "therefore",
  "thus",
  "however",
  "but",
  "while",
  "although",
  "since",
  "as",
  "meanwhile",
  "additionally",
  "also",
  "furthermore",
  "consequently",
  "hence",
  "overall",
  "finally",
  "moreover",
  "instead",
  "then",
  "next",
  "after",
  "before",
  "ultimately",
  "thereby",
];

const STEP_WORDS = ["first", "second", "third", "then", "next", "after", "finally", "lastly"];
const EDGE_WORDS = ["edge", "case", "empty", "otherwise", "if", "when", "unless"];

const POSITIVE_WORDS = new Set([
  "good",
  "great",
  "clear",
  "effective",
  "excellent",
  "strong",
  "helpful",
  "supportive",
  "improve",
  "improves",
  "improved",
  "better",
  "faster",
  "smarter",
  "purposeful",
  "insight",
]);

const NEGATIVE_WORDS = new Set([
  "bad",
  "poor",
  "wrong",
  "failed",
  "delay",
  "slow",
  "boring",
  "problem",
  "issue",
  "mistake",
  "worse",
]);

const FILLER_WORDS = new Set(["very", "really", "just", "kind", "kinda", "sort", "maybe", "like", "actually", "basically"]);
const UNCERTAIN_WORDS = new Set(["maybe", "perhaps", "probably", "possibly", "might", "guess", "seems", "appears"]);
const CONCLUSION_WORDS = ["therefore", "overall", "thus", "hence", "ultimately", "in summary", "in short", "as a result", "consequently", "overall"];

type TextStats = {
  original: string;
  lower: string;
  tokens: string[];
  uniqueTokens: Set<string>;
  wordCount: number;
  sentenceCount: number;
  sentences: string[];
  avgSentenceLength: number;
  connectors: number;
  connectorDensity: number;
  numbers: string[];
  numbersSet: Set<string>;
  endsWithPunctuation: boolean;
  capitalizedSentences: number;
  sentenceLengths: number[];
  sentenceLengthStd: number;
  longestSentenceLength: number;
  repetitionRatio: number;
  repeatedWordCount: number;
  lexicalDiversity: number;
  longWordRatio: number;
  averageWordLength: number;
  charVariety: number;
  letterRatio: number;
  hasExamplePhrase: boolean;
  fillerWords: number;
  uncertainWords: number;
  pronounCount: number;
  hasAllLowercase: boolean;
  lastSentence: string;
  hasClosureSignal: boolean;
  toneScore: number;
  hasQuestionMark: boolean;
  hasExclamation: boolean;
  hyphenatedWords: number;
  colonCount: number;
  freq: Map<string, number>;
  containsBullets: boolean;
  hasRunOnSentence: boolean;
};

type ParameterDefinition = { name: string; max: number };

const SUMMARY_PARAM_DEFS: ParameterDefinition[] = [
  { name: "Main idea capture", max: 10 },
  { name: "Key detail inclusion", max: 8 },
  { name: "Relevance to topic", max: 6 },
  { name: "Conciseness", max: 6 },
  { name: "Word count adequacy", max: 4 },
  { name: "Sentence clarity", max: 5 },
  { name: "Logical flow", max: 5 },
  { name: "Coherence connectors", max: 5 },
  { name: "Language precision", max: 4 },
  { name: "Factual accuracy", max: 6 },
  { name: "Avoids copy from prompt", max: 6 },
  { name: "Grammar and syntax", max: 5 },
  { name: "Punctuation accuracy", max: 3 },
  { name: "Readability", max: 3 },
  { name: "Proportional compression", max: 5 },
  { name: "Tone neutrality", max: 3 },
  { name: "No repetition", max: 2 },
  { name: "Complete sentences", max: 3 },
  { name: "No extraneous examples", max: 3 },
  { name: "Summative closure", max: 3 },
];

const REWRITE_PARAM_DEFS: ParameterDefinition[] = [
  { name: "Meaning preservation", max: 10 },
  { name: "Lexical variety", max: 6 },
  { name: "Structural reordering", max: 5 },
  { name: "Tone retention", max: 5 },
  { name: "Voice accuracy", max: 4 },
  { name: "Grammar accuracy", max: 7 },
  { name: "Fluency", max: 5 },
  { name: "Punctuation correctness", max: 3 },
  { name: "Readability", max: 4 },
  { name: "Clarity", max: 6 },
  { name: "Synonym appropriateness", max: 5 },
  { name: "Sentence variety", max: 3 },
  { name: "Avoids redundancy", max: 4 },
  { name: "Faithfulness to original points", max: 6 },
  { name: "Idiomatic use", max: 5 },
  { name: "Paraphrasing depth", max: 8 },
  { name: "Logical word order", max: 3 },
  { name: "Spelling correctness", max: 3 },
  { name: "Smooth transitions", max: 4 },
  { name: "Semantic distance metric", max: 9 },
];

const PROOFREAD_PARAM_DEFS: ParameterDefinition[] = [
  { name: "Error detection rate", max: 10 },
  { name: "Fix accuracy", max: 10 },
  { name: "Grammar fix completeness", max: 8 },
  { name: "No new errors", max: 5 },
  { name: "Verb agreement", max: 5 },
  { name: "Article usage", max: 4 },
  { name: "Preposition accuracy", max: 5 },
  { name: "Punctuation correction", max: 4 },
  { name: "Spelling corrections", max: 5 },
  { name: "Sentence boundary integrity", max: 3 },
  { name: "Capitalization fixes", max: 3 },
  { name: "Tense consistency", max: 4 },
  { name: "Improved clarity", max: 5 },
  { name: "Conciseness after edit", max: 3 },
  { name: "Style polishing", max: 5 },
  { name: "Preserve meaning", max: 5 },
  { name: "Tone consistency", max: 3 },
  { name: "Error to fix ratio", max: 6 },
  { name: "Filler elimination", max: 2 },
  { name: "Final sentence smoothness", max: 5 },
];

const EXPLAIN_PARAM_DEFS: ParameterDefinition[] = [
  { name: "Functional accuracy", max: 10 },
  { name: "Step by step logic", max: 8 },
  { name: "Variable explanation", max: 5 },
  { name: "Control flow understanding", max: 6 },
  { name: "Output prediction", max: 8 },
  { name: "Error or edge identification", max: 4 },
  { name: "Correct terminology", max: 6 },
  { name: "Beginner friendly simplification", max: 7 },
  { name: "Example or analogy", max: 5 },
  { name: "Readable explanation", max: 5 },
  { name: "Syntax reference accuracy", max: 5 },
  { name: "Depth beyond what", max: 10 },
  { name: "Edge case awareness", max: 3 },
  { name: "Avoid misinterpretation", max: 5 },
  { name: "Structure mapping", max: 5 },
  { name: "Terminology simplicity", max: 4 },
  { name: "Grammar and clarity", max: 4 },
  { name: "No redundancy", max: 3 },
  { name: "Compositional flow", max: 3 },
  { name: "Insight or improvement", max: 6 },
];

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const safeDivide = (numerator: number, denominator: number, fallback = 0) =>
  denominator === 0 ? fallback : numerator / denominator;

const fractionToPoints = (fraction: number, max: number) => Math.round(clamp(fraction, 0, 1) * max);

const directPoints = (points: number, max: number) => Math.round(clamp(points, 0, max));

const softRangeScore = (value: number, min: number, max: number) => {
  if (value <= 0) return 0;
  if (value < min) return clamp((value / min) * 0.8, 0, 1);
  if (value > max) return clamp((max / value) * 0.8, 0, 1);
  return 1;
};

const targetLessThanScore = (value: number, target: number, tolerance: number) => {
  if (value <= target) return 1;
  const diff = value - target;
  return clamp(1 - diff / Math.max(tolerance, 1), 0, 1);
};

const computeToneScore = (tokens: string[]) => {
  if (tokens.length === 0) return 0;
  let score = 0;
  for (const token of tokens) {
    if (POSITIVE_WORDS.has(token)) score += 1;
    if (NEGATIVE_WORDS.has(token)) score -= 1;
  }
  return score / tokens.length;
};

const computeSentenceStats = (sentences: string[]) => {
  const lengths = sentences.map((sentence) => {
    const tokens = sentence.toLowerCase().match(/\b[\w']+\b/g);
    return tokens ? tokens.length : 0;
  });
  const mean = lengths.length ? lengths.reduce((acc, len) => acc + len, 0) / lengths.length : 0;
  const variance = lengths.length
    ? lengths.reduce((acc, len) => acc + (len - mean) ** 2, 0) / lengths.length
    : 0;
  return {
    lengths,
    std: Math.sqrt(variance),
    longest: lengths.reduce((acc, len) => Math.max(acc, len), 0),
  };
};

const analyzeText = (input: string): TextStats => {
  const original = input.trim();
  const lower = original.toLowerCase();
  const tokenMatches = lower.match(/\b[\w']+\b/g) ?? [];
  const tokens = tokenMatches.map((token) => token.replace(/^'+|'+$/g, "")).filter(Boolean);
  const uniqueTokens = new Set(tokens);
  const wordCount = tokens.length;
  const rawSentences = original
    ? original.split(/(?<=[.!?])\s+/).map((sentence) => sentence.trim()).filter(Boolean)
    : [];
  const sentenceCount = rawSentences.length;
  const avgSentenceLength = sentenceCount ? wordCount / sentenceCount : wordCount;
  const connectors = tokens.filter((token) => CONNECTORS.includes(token)).length;
  const connectorDensity = sentenceCount ? connectors / sentenceCount : connectors;
  const numbers = original.match(/\b\d+(?:\.\d+)?\b/g) ?? [];
  const numbersSet = new Set(numbers);
  const endsWithPunctuation = /[.!?]$/.test(original);
  const capitalizedSentences = rawSentences.filter((sentence) => /^[A-Z]/.test(sentence)).length;
  const freq = new Map<string, number>();
  for (const token of tokens) {
    freq.set(token, (freq.get(token) ?? 0) + 1);
  }
  const repeatedWordCount = Array.from(freq.values()).filter((count) => count > 1).length;
  const repetitionRatio = wordCount ? repeatedWordCount / wordCount : 0;
  const lexicalDiversity = wordCount ? uniqueTokens.size / wordCount : 0;
  const longWordCount = tokens.filter((token) => token.length >= 6).length;
  const longWordRatio = wordCount ? longWordCount / wordCount : 0;
  const totalLetters = original.replace(/[^a-zA-Z]/g, "").length;
  const letterRatio = original.length ? totalLetters / original.length : 0;
  const chars = original.replace(/\s+/g, "").split("");
  const charVariety = chars.length ? new Set(chars).size / chars.length : 0;
  const averageWordLength = wordCount
    ? tokens.reduce((acc, token) => acc + token.length, 0) / wordCount
    : 0;
  const hasExamplePhrase = /for example|for instance|such as/i.test(original);
  const fillerWords = tokens.filter((token) => FILLER_WORDS.has(token)).length;
  const uncertainWords = tokens.filter((token) => UNCERTAIN_WORDS.has(token)).length;
  const pronounCount = tokens.filter((token) =>
    ["i", "we", "you", "they", "he", "she", "it", "us", "me"].includes(token)
  ).length;
  const hasAllLowercase = original === lower;
  const lastSentence = rawSentences.at(-1) ?? "";
  const hasClosureSignal = CONCLUSION_WORDS.some((word) => lastSentence.toLowerCase().includes(word));
  const toneScore = computeToneScore(tokens);
  const hasQuestionMark = original.includes("?");
  const hasExclamation = original.includes("!");
  const hyphenatedWords = (original.match(/\b\w+-\w+\b/g) ?? []).length;
  const colonCount = (original.match(/:/g) ?? []).length;
  const containsBullets = /^[-*]\s/m.test(original);
  const { lengths: sentenceLengths, std: sentenceLengthStd, longest: longestSentenceLength } =
    computeSentenceStats(rawSentences);
  const hasRunOnSentence = sentenceLengths.some((length) => length > 35);

  return {
    original,
    lower,
    tokens,
    uniqueTokens,
    wordCount,
    sentenceCount,
    sentences: rawSentences,
    avgSentenceLength,
    connectors,
    connectorDensity,
    numbers,
    numbersSet,
    endsWithPunctuation,
    capitalizedSentences,
    sentenceLengths,
    sentenceLengthStd,
    longestSentenceLength,
    repetitionRatio,
    repeatedWordCount,
    lexicalDiversity,
    longWordRatio,
    averageWordLength,
    charVariety,
    letterRatio,
    hasExamplePhrase,
    fillerWords,
    uncertainWords,
    pronounCount,
    hasAllLowercase,
    lastSentence,
    hasClosureSignal,
    toneScore,
    hasQuestionMark,
    hasExclamation,
    hyphenatedWords,
    colonCount,
    freq,
    containsBullets,
    hasRunOnSentence,
  };
};

const extractKeywords = (tokens: string[], limit = 6) => {
  const scores = new Map<string, number>();
  for (const token of tokens) {
    if (token.length <= 3) continue;
    if (STOP_WORDS.has(token)) continue;
    if (/^\d+$/.test(token)) continue;
    scores.set(token, (scores.get(token) ?? 0) + 1);
  }
  return Array.from(scores.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([token]) => token);
};

const jaccardSimilarity = (a: Set<string>, b: Set<string>) => {
  if (a.size === 0 || b.size === 0) return 0;
  let intersection = 0;
  for (const token of a) {
    if (b.has(token)) intersection += 1;
  }
  return intersection / Math.max(a.size, b.size);
};

const overlapShare = (a: Set<string>, b: Set<string>) => {
  if (a.size === 0) return 0;
  let overlap = 0;
  for (const token of a) {
    if (b.has(token)) overlap += 1;
  }
  return overlap / a.size;
};

const detectGibberish = (stats: TextStats) => {
  if (stats.wordCount < 3) return true;
  if (stats.letterRatio < 0.4) return true;
  if (stats.charVariety < 0.2) return true;
  if (stats.uniqueTokens.size <= 1 && stats.wordCount > 3) return true;
  if (/(.)\1{4,}/.test(stats.lower.replace(/\s/g, ""))) return true;
  return false;
};

const zeroParameters = (defs: ParameterDefinition[]): MiniChallengeParameterScore[] =>
  defs.map((def) => ({ name: def.name, points: 0, max: def.max }));

const selectParameter = (params: MiniChallengeParameterScore[], name: string) =>
  params.find((param) => param.name === name);

const mentionsCode = (text: string) =>
  /code|function|loop|list|array|numbers|variable|return|print/.test(text);

type BaseContext = {
  challenge: MiniChallenge;
  answerStats: TextStats;
  inputStats: TextStats;
  idealStats: TextStats;
  trimmedAnswer: string;
  normalizedAnswer: string;
  similarityToIdeal: number;
  similarityToInput: number;
  expectedOverlap: number;
  keywords: string[];
  keywordMatches: number;
  compressionRatio: number;
  inventedNumbers: string[];
  extraneousExamples: boolean;
  copyFromPrompt: boolean;
  offTopic: boolean;
  answerUnionOverlap: number;
  inputNumbers: Set<string>;
  idealNumbers: Set<string>;
  unionTokens: Set<string>;
  identifiers: Set<string>;
};

type GradeComputation = {
  parameters: MiniChallengeParameterScore[];
  offTopic?: boolean;
};

const gradeSummarize = (ctx: BaseContext): GradeComputation => {
  const {
    answerStats,
    similarityToIdeal,
    similarityToInput,
    keywords,
    keywordMatches,
    compressionRatio,
    inventedNumbers,
    extraneousExamples,
    copyFromPrompt,
    offTopic,
    expectedOverlap,
    answerUnionOverlap,
  } = ctx;

  const params: MiniChallengeParameterScore[] = [];
  const defs = SUMMARY_PARAM_DEFS;

  const mainIdea = fractionToPoints(similarityToIdeal, defs[0].max);
  params.push({ name: defs[0].name, max: defs[0].max, points: mainIdea });

  const keyDetailFraction = keywords.length
    ? Math.min(keywordMatches, 3) / Math.min(3, keywords.length)
    : 0;
  params.push({
    name: defs[1].name,
    max: defs[1].max,
    points: fractionToPoints(keyDetailFraction, defs[1].max),
  });

  params.push({
    name: defs[2].name,
    max: defs[2].max,
    points: fractionToPoints(answerUnionOverlap, defs[2].max),
  });

  params.push({
    name: defs[3].name,
    max: defs[3].max,
    points: fractionToPoints(softRangeScore(answerStats.wordCount, 12, 55), defs[3].max),
  });

  params.push({
    name: defs[4].name,
    max: defs[4].max,
    points: fractionToPoints(softRangeScore(answerStats.wordCount, 18, 70), defs[4].max),
  });

  params.push({
    name: defs[5].name,
    max: defs[5].max,
    points: fractionToPoints(targetLessThanScore(answerStats.avgSentenceLength, 24, 15), defs[5].max),
  });

  const logicalFlowFraction = answerStats.sentenceCount >= 2
    ? clamp((answerStats.sentenceCount - 1) / 3 + Math.min(answerStats.connectors, 2) / 5, 0, 1)
    : 0;
  params.push({
    name: defs[6].name,
    max: defs[6].max,
    points: fractionToPoints(logicalFlowFraction, defs[6].max),
  });

  params.push({
    name: defs[7].name,
    max: defs[7].max,
    points: fractionToPoints(Math.min(answerStats.connectors, 3) / 3, defs[7].max),
  });

  const precisionFraction = clamp(answerStats.longWordRatio * 1.2 + expectedOverlap * 0.4, 0, 1);
  params.push({
    name: defs[8].name,
    max: defs[8].max,
    points: fractionToPoints(precisionFraction, defs[8].max),
  });

  const factualAccFraction =
    inventedNumbers.length > 0 ? 0 : clamp(similarityToIdeal * 0.8 + answerUnionOverlap * 0.2, 0, 1);
  params.push({
    name: defs[9].name,
    max: defs[9].max,
    points: fractionToPoints(factualAccFraction, defs[9].max),
  });

  params.push({
    name: defs[10].name,
    max: defs[10].max,
    points: fractionToPoints(1 - similarityToInput, defs[10].max),
  });

  const grammarFraction =
    answerStats.sentenceCount > 0
      ? clamp(answerStats.capitalizedSentences / answerStats.sentenceCount, 0, 1)
      : 0;
  params.push({
    name: defs[11].name,
    max: defs[11].max,
    points: fractionToPoints(grammarFraction, defs[11].max),
  });

  const punctuationFraction =
    answerStats.sentenceCount > 0 && answerStats.endsWithPunctuation ? 1 : 0.6;
  params.push({
    name: defs[12].name,
    max: defs[12].max,
    points: fractionToPoints(punctuationFraction, defs[12].max),
  });

  const readabilityFraction = clamp(
    (1 - clamp((answerStats.avgSentenceLength - 22) / 20, 0, 1)) * 0.7 +
      clamp(answerStats.lexicalDiversity, 0, 1) * 0.3,
    0,
    1
  );
  params.push({
    name: defs[13].name,
    max: defs[13].max,
    points: fractionToPoints(readabilityFraction, defs[13].max),
  });

  params.push({
    name: defs[14].name,
    max: defs[14].max,
    points: fractionToPoints(softRangeScore(compressionRatio, 0.15, 0.35), defs[14].max),
  });

  params.push({
    name: defs[15].name,
    max: defs[15].max,
    points: fractionToPoints(1 - Math.min(Math.abs(answerStats.toneScore) * 8, 1), defs[15].max),
  });

  params.push({
    name: defs[16].name,
    max: defs[16].max,
    points: fractionToPoints(1 - Math.min(answerStats.repetitionRatio * 4, 1), defs[16].max),
  });

  const completeSentencesFraction =
    answerStats.sentenceCount >= 2 && answerStats.endsWithPunctuation ? 1 : 0.5;
  params.push({
    name: defs[17].name,
    max: defs[17].max,
    points: fractionToPoints(completeSentencesFraction, defs[17].max),
  });

  params.push({
    name: defs[18].name,
    max: defs[18].max,
    points: fractionToPoints(extraneousExamples ? 0 : 1, defs[18].max),
  });

  const closureFraction = answerStats.hasClosureSignal
    ? 1
    : clamp((answerStats.sentenceCount >= 2 ? 0.6 : 0) + (answerStats.endsWithPunctuation ? 0.2 : 0), 0, 1);
  params.push({
    name: defs[19].name,
    max: defs[19].max,
    points: fractionToPoints(closureFraction, defs[19].max),
  });

  if (copyFromPrompt) {
    const avoids = selectParameter(params, "Avoids copy from prompt");
    if (avoids) avoids.points = 0;
    const langPrecision = selectParameter(params, "Language precision");
    if (langPrecision) langPrecision.points = directPoints(langPrecision.points * 0.6, langPrecision.max);
  }

  if (inventedNumbers.length > 0) {
    const factual = selectParameter(params, "Factual accuracy");
    if (factual) factual.points = 0;
    const noExamples = selectParameter(params, "No extraneous examples");
    if (noExamples) noExamples.points = directPoints(noExamples.points * 0.5, noExamples.max);
  }

  if (offTopic) {
    for (const name of [
      "Main idea capture",
      "Key detail inclusion",
      "Relevance to topic",
      "Factual accuracy",
      "Summative closure",
    ]) {
      const param = selectParameter(params, name);
      if (param) param.points = 0;
    }
  }

  return { parameters: params, offTopic };
};

const gradeRewrite = (ctx: BaseContext): GradeComputation => {
  const {
    answerStats,
    inputStats,
    idealStats,
    similarityToIdeal,
    similarityToInput,
    inventedNumbers,
    extraneousExamples,
    copyFromPrompt,
    answerUnionOverlap,
  } = ctx;

  const params: MiniChallengeParameterScore[] = [];
  const defs = REWRITE_PARAM_DEFS;

  const paraphraseDepth = clamp(1 - similarityToInput, 0, 1);
  const meaning = similarityToIdeal;
  const toneGap = 1 - Math.min(Math.abs(answerStats.toneScore - idealStats.toneScore) * 8, 1);
  const sentenceChange = inputStats.sentenceCount
    ? clamp(Math.abs(answerStats.sentenceCount - inputStats.sentenceCount) / (inputStats.sentenceCount + 1), 0, 1)
    : answerStats.sentenceCount > 1
    ? 0.6
    : 0.4;

  params.push({
    name: defs[0].name,
    max: defs[0].max,
    points: fractionToPoints(meaning, defs[0].max),
  });

  params.push({
    name: defs[1].name,
    max: defs[1].max,
    points: fractionToPoints(paraphraseDepth, defs[1].max),
  });

  params.push({
    name: defs[2].name,
    max: defs[2].max,
    points: fractionToPoints(clamp(sentenceChange + answerStats.sentenceLengthStd / 10, 0, 1), defs[2].max),
  });

  params.push({
    name: defs[3].name,
    max: defs[3].max,
    points: fractionToPoints(toneGap, defs[3].max),
  });

  const voiceFraction =
    idealStats.pronounCount > 0
      ? clamp(
          1 - Math.abs(answerStats.pronounCount - idealStats.pronounCount) / Math.max(idealStats.pronounCount, 1),
          0,
          1
        )
      : clamp(1 - answerStats.pronounCount / Math.max(answerStats.wordCount, 1), 0, 1);
  params.push({
    name: defs[4].name,
    max: defs[4].max,
    points: fractionToPoints(voiceFraction, defs[4].max),
  });

  const grammarFraction = clamp(
    (answerStats.capitalizedSentences / Math.max(answerStats.sentenceCount, 1)) * 0.6 +
      (answerStats.endsWithPunctuation ? 0.3 : 0) -
      (answerStats.hasRunOnSentence ? 0.3 : 0),
    0,
    1
  );
  params.push({
    name: defs[5].name,
    max: defs[5].max,
    points: fractionToPoints(grammarFraction, defs[5].max),
  });

  const fluencyFraction = clamp(
    Math.min(answerStats.connectors, 3) / 3 * 0.6 + Math.min(answerStats.sentenceCount, 4) / 4 * 0.4,
    0,
    1
  );
  params.push({
    name: defs[6].name,
    max: defs[6].max,
    points: fractionToPoints(fluencyFraction, defs[6].max),
  });

  const punctuationFraction =
    answerStats.endsWithPunctuation && answerStats.sentenceCount > 0 ? 1 : 0.6;
  params.push({
    name: defs[7].name,
    max: defs[7].max,
    points: fractionToPoints(punctuationFraction, defs[7].max),
  });

  const readabilityFraction = clamp(
    (1 - clamp((answerStats.avgSentenceLength - idealStats.avgSentenceLength) / 20, 0, 1)) * 0.5 +
      clamp(answerStats.lexicalDiversity, 0, 1) * 0.5,
    0,
    1
  );
  params.push({
    name: defs[8].name,
    max: defs[8].max,
    points: fractionToPoints(readabilityFraction, defs[8].max),
  });

  const clarityFraction = clamp(
    1 - Math.min(answerStats.fillerWords / Math.max(answerStats.wordCount, 1) * 4, 1),
    0,
    1
  );
  params.push({
    name: defs[9].name,
    max: defs[9].max,
    points: fractionToPoints(clarityFraction, defs[9].max),
  });

  const synonymFraction = clamp((meaning * 0.6 + paraphraseDepth * 0.6) / 1.2, 0, 1);
  params.push({
    name: defs[10].name,
    max: defs[10].max,
    points: fractionToPoints(synonymFraction, defs[10].max),
  });

  params.push({
    name: defs[11].name,
    max: defs[11].max,
    points: fractionToPoints(clamp(answerStats.sentenceLengthStd / 6, 0, 1), defs[11].max),
  });

  params.push({
    name: defs[12].name,
    max: defs[12].max,
    points: fractionToPoints(1 - Math.min(answerStats.repetitionRatio * 4, 1), defs[12].max),
  });

  params.push({
    name: defs[13].name,
    max: defs[13].max,
    points: fractionToPoints(answerUnionOverlap, defs[13].max),
  });

  params.push({
    name: defs[14].name,
    max: defs[14].max,
    points: fractionToPoints(clamp(answerStats.connectorDensity * 0.8 + toneGap * 0.2, 0, 1), defs[14].max),
  });

  params.push({
    name: defs[15].name,
    max: defs[15].max,
    points: fractionToPoints(paraphraseDepth, defs[15].max),
  });

  params.push({
    name: defs[16].name,
    max: defs[16].max,
    points: fractionToPoints(targetLessThanScore(answerStats.longestSentenceLength, 28, 15), defs[16].max),
  });

  const spellingFraction = clamp(
    1 - answerStats.tokens.filter((token) => /[^a-z'-]/.test(token)).length / Math.max(answerStats.wordCount, 1),
    0,
    1
  );
  params.push({
    name: defs[17].name,
    max: defs[17].max,
    points: fractionToPoints(spellingFraction, defs[17].max),
  });

  params.push({
    name: defs[18].name,
    max: defs[18].max,
    points: fractionToPoints(clamp(answerStats.connectors / 3, 0, 1), defs[18].max),
  });

  const semanticDistance = clamp((meaning * 0.6 + paraphraseDepth * 0.8) / 1.4, 0, 1);
  params.push({
    name: defs[19].name,
    max: defs[19].max,
    points: fractionToPoints(semanticDistance, defs[19].max),
  });

  if (copyFromPrompt) {
    const lexical = selectParameter(params, "Lexical variety");
    if (lexical) lexical.points = directPoints(lexical.max * 0.3, lexical.max);
    const paraphrase = selectParameter(params, "Paraphrasing depth");
    if (paraphrase) paraphrase.points = directPoints(paraphrase.max * 0.3, paraphrase.max);
    const redundancy = selectParameter(params, "Avoids redundancy");
    if (redundancy) redundancy.points = directPoints(redundancy.points * 0.5, redundancy.max);
  }

  if (inventedNumbers.length > 0 || extraneousExamples) {
    const faithfulness = selectParameter(params, "Faithfulness to original points");
    if (faithfulness) faithfulness.points = directPoints(faithfulness.points * 0.5, faithfulness.max);
  }

  return { parameters: params };
};

const gradeProofread = (ctx: BaseContext): GradeComputation => {
  const {
    answerStats,
    inputStats,
    idealStats,
    similarityToIdeal,
    similarityToInput,
    extraneousExamples,
  } = ctx;

  const params: MiniChallengeParameterScore[] = [];
  const defs = PROOFREAD_PARAM_DEFS;

  const potentialErrors = new Set<string>();
  for (const token of inputStats.tokens) {
    if (!idealStats.uniqueTokens.has(token)) {
      potentialErrors.add(token);
    }
  }
  const leftoverErrors = Array.from(potentialErrors).filter((token) =>
    answerStats.uniqueTokens.has(token)
  ).length;
  const changeRatio = clamp(1 - similarityToInput, 0, 1);
  const errorFixRatio =
    potentialErrors.size === 0
      ? 1
      : clamp(1 - leftoverErrors / Math.max(potentialErrors.size, 1), 0, 1);

  params.push({
    name: defs[0].name,
    max: defs[0].max,
    points: fractionToPoints(changeRatio, defs[0].max),
  });

  params.push({
    name: defs[1].name,
    max: defs[1].max,
    points: fractionToPoints(similarityToIdeal, defs[1].max),
  });

  params.push({
    name: defs[2].name,
    max: defs[2].max,
    points: fractionToPoints(errorFixRatio, defs[2].max),
  });

  params.push({
    name: defs[3].name,
    max: defs[3].max,
    points: fractionToPoints(leftoverErrors === 0 ? 1 : 0.4, defs[3].max),
  });

  const verbTokens = ["is", "are", "was", "were", "has", "have"];
  const verbPenalty = verbTokens.some(
    (token) => answerStats.uniqueTokens.has(token) && !idealStats.uniqueTokens.has(token)
  )
    ? 0.3
    : 1;
  params.push({
    name: defs[4].name,
    max: defs[4].max,
    points: fractionToPoints(verbPenalty, defs[4].max),
  });

  const articleTokens = ["a", "an", "the"];
  const articleScore = clamp(
    1 -
      Math.abs(
        articleTokens.reduce((acc, token) => acc + (answerStats.freq.get(token) ?? 0), 0) -
          articleTokens.reduce((acc, token) => acc + (idealStats.freq.get(token) ?? 0), 0)
      ) / 4,
    0,
    1
  );
  params.push({
    name: defs[5].name,
    max: defs[5].max,
    points: fractionToPoints(articleScore, defs[5].max),
  });

  const prepositionTokens = ["in", "on", "at", "for", "to", "with", "by"];
  const prepositionScore = clamp(
    1 -
      Math.abs(
        prepositionTokens.reduce((acc, token) => acc + (answerStats.freq.get(token) ?? 0), 0) -
          prepositionTokens.reduce((acc, token) => acc + (idealStats.freq.get(token) ?? 0), 0)
      ) / 4,
    0,
    1
  );
  params.push({
    name: defs[6].name,
    max: defs[6].max,
    points: fractionToPoints(prepositionScore, defs[6].max),
  });

  params.push({
    name: defs[7].name,
    max: defs[7].max,
    points: fractionToPoints(
      answerStats.endsWithPunctuation && !answerStats.original.includes("..") ? 1 : 0.5,
      defs[7].max
    ),
  });

  params.push({
    name: defs[8].name,
    max: defs[8].max,
    points: fractionToPoints(errorFixRatio, defs[8].max),
  });

  params.push({
    name: defs[9].name,
    max: defs[9].max,
    points: fractionToPoints(answerStats.sentenceCount === inputStats.sentenceCount ? 1 : 0.5, defs[9].max),
  });

  params.push({
    name: defs[10].name,
    max: defs[10].max,
    points: fractionToPoints(
      answerStats.capitalizedSentences === answerStats.sentenceCount ? 1 : 0.5,
      defs[10].max
    ),
  });

  params.push({
    name: defs[11].name,
    max: defs[11].max,
    points: fractionToPoints(
      1 -
        Math.min(
          Math.abs(answerStats.tokens.filter((token) => token.endsWith("ed")).length -
            idealStats.tokens.filter((token) => token.endsWith("ed")).length) / 4,
          1
        ),
      defs[11].max
    ),
  });

  const clarityFraction = clamp(
    (similarityToIdeal * 0.7 + (1 - answerStats.fillerWords / Math.max(answerStats.wordCount, 1)) * 0.3),
    0,
    1
  );
  params.push({
    name: defs[12].name,
    max: defs[12].max,
    points: fractionToPoints(clarityFraction, defs[12].max),
  });

  params.push({
    name: defs[13].name,
    max: defs[13].max,
    points: fractionToPoints(
      clamp(inputStats.wordCount === 0 ? 1 : inputStats.wordCount / Math.max(answerStats.wordCount, 1), 0, 1),
      defs[13].max
    ),
  });

  params.push({
    name: defs[14].name,
    max: defs[14].max,
    points: fractionToPoints(clamp(similarityToIdeal * 0.8 + changeRatio * 0.2, 0, 1), defs[14].max),
  });

  params.push({
    name: defs[15].name,
    max: defs[15].max,
    points: fractionToPoints(clamp(1 - Math.abs(similarityToIdeal - 0.9), 0, 1), defs[15].max),
  });

  const toneConsistency = clamp(
    1 - Math.min(Math.abs(answerStats.toneScore - inputStats.toneScore) * 8, 1),
    0,
    1
  );
  params.push({
    name: defs[16].name,
    max: defs[16].max,
    points: fractionToPoints(toneConsistency, defs[16].max),
  });

  params.push({
    name: defs[17].name,
    max: defs[17].max,
    points: fractionToPoints(errorFixRatio, defs[17].max),
  });

  params.push({
    name: defs[18].name,
    max: defs[18].max,
    points: fractionToPoints(
      1 - Math.min(answerStats.fillerWords / Math.max(answerStats.wordCount, 1) * 4, 1),
      defs[18].max
    ),
  });

  params.push({
    name: defs[19].name,
    max: defs[19].max,
    points: fractionToPoints(
      answerStats.endsWithPunctuation && !answerStats.hasRunOnSentence ? 1 : 0.6,
      defs[19].max
    ),
  });

  if (extraneousExamples) {
    const concision = selectParameter(params, "Conciseness after edit");
    if (concision) concision.points = directPoints(concision.points * 0.5, concision.max);
  }

  return { parameters: params };
};

const gradeExplainCode = (ctx: BaseContext): GradeComputation => {
  const { answerStats, similarityToIdeal, identifiers } = ctx;

  const params: MiniChallengeParameterScore[] = [];
  const defs = EXPLAIN_PARAM_DEFS;

  const mentionsFunctionality =
    /return|prints?|outputs?|sum|average|reverse|sort|calculate|adds|loops?|iterates?/.test(
      answerStats.lower
    );
  params.push({
    name: defs[0].name,
    max: defs[0].max,
    points: fractionToPoints(
      mentionsFunctionality ? clamp(similarityToIdeal + 0.3, 0, 1) : similarityToIdeal * 0.5,
      defs[0].max
    ),
  });

  const stepCount = STEP_WORDS.filter((word) => answerStats.lower.includes(word)).length;
  params.push({
    name: defs[1].name,
    max: defs[1].max,
    points: fractionToPoints(clamp(stepCount / 3 + (answerStats.sentenceCount >= 2 ? 0.3 : 0), 0, 1), defs[1].max),
  });

  const identifierMatches = Array.from(identifiers).filter((identifier) =>
    answerStats.lower.includes(identifier.toLowerCase())
  ).length;
  const identifierRatio =
    identifiers.size === 0
      ? identifierMatches > 0
        ? 1
        : 0.6
      : clamp(identifierMatches / identifiers.size, 0, 1);
  params.push({
    name: defs[2].name,
    max: defs[2].max,
    points: fractionToPoints(identifierRatio, defs[2].max),
  });

  const controlFlowScore = /loop|for|while|if|each/.test(answerStats.lower) ? 1 : 0.4;
  params.push({
    name: defs[3].name,
    max: defs[3].max,
    points: fractionToPoints(controlFlowScore, defs[3].max),
  });

  const outputScore = /prints?|returns?|output|result/.test(answerStats.lower) ? 1 : 0.3;
  params.push({
    name: defs[4].name,
    max: defs[4].max,
    points: fractionToPoints(outputScore, defs[4].max),
  });

  const edgeScore = EDGE_WORDS.some((word) => answerStats.lower.includes(word)) ? 0.75 : 0.3;
  params.push({
    name: defs[5].name,
    max: defs[5].max,
    points: fractionToPoints(edgeScore, defs[5].max),
  });

  const terminologyScore =
    /list|array|function|parameter|return value|loop|slice|sorted/.test(answerStats.lower) ? 1 : 0.5;
  params.push({
    name: defs[6].name,
    max: defs[6].max,
    points: fractionToPoints(terminologyScore, defs[6].max),
  });

  const uncertainRatio = answerStats.uncertainWords / Math.max(answerStats.wordCount, 1);
  const beginnerScore = clamp(
    1 - Math.min(answerStats.longWordRatio * 1.2 + uncertainRatio * 3, 1),
    0,
    1
  );
  params.push({
    name: defs[7].name,
    max: defs[7].max,
    points: fractionToPoints(beginnerScore, defs[7].max),
  });

  params.push({
    name: defs[8].name,
    max: defs[8].max,
    points: fractionToPoints(/example|for instance|eg|e\.g/.test(answerStats.lower) ? 1 : 0.2, defs[8].max),
  });

  const readabilityFraction = clamp(
    (1 - clamp((answerStats.avgSentenceLength - 24) / 18, 0, 1)) * 0.6 +
      clamp(answerStats.lexicalDiversity, 0, 1) * 0.4,
    0,
    1
  );
  params.push({
    name: defs[9].name,
    max: defs[9].max,
    points: fractionToPoints(readabilityFraction, defs[9].max),
  });

  const syntaxScore = /brackets|parentheses|colon|slice|sorted/.test(answerStats.lower) ? 1 : 0.5;
  params.push({
    name: defs[10].name,
    max: defs[10].max,
    points: fractionToPoints(syntaxScore, defs[10].max),
  });

  params.push({
    name: defs[11].name,
    max: defs[11].max,
    points: fractionToPoints(clamp(similarityToIdeal + 0.2, 0, 1), defs[11].max),
  });

  params.push({
    name: defs[12].name,
    max: defs[12].max,
    points: fractionToPoints(edgeScore, defs[12].max),
  });

  params.push({
    name: defs[13].name,
    max: defs[13].max,
    points: fractionToPoints(answerStats.uncertainWords > 0 ? 0.4 : 1, defs[13].max),
  });

  params.push({
    name: defs[14].name,
    max: defs[14].max,
    points: fractionToPoints(identifierMatches ? 1 : 0.5, defs[14].max),
  });

  params.push({
    name: defs[15].name,
    max: defs[15].max,
    points: fractionToPoints(
      clamp(1 - Math.min(answerStats.longWordRatio * 1.5 + answerStats.averageWordLength / 10, 1), 0, 1),
      defs[15].max
    ),
  });

  params.push({
    name: defs[16].name,
    max: defs[16].max,
    points: fractionToPoints(
      answerStats.capitalizedSentences === answerStats.sentenceCount ? 1 : 0.5,
      defs[16].max
    ),
  });

  params.push({
    name: defs[17].name,
    max: defs[17].max,
    points: fractionToPoints(1 - Math.min(answerStats.repetitionRatio * 4, 1), defs[17].max),
  });

  params.push({
    name: defs[18].name,
    max: defs[18].max,
    points: fractionToPoints(clamp(answerStats.connectors / 3, 0, 1), defs[18].max),
  });

  params.push({
    name: defs[19].name,
    max: defs[19].max,
    points: fractionToPoints(/could|consider|option|alternative/.test(answerStats.lower) ? 1 : 0.2, defs[19].max),
  });

  return { parameters: params };
};

const getLongestNote = (parameters: MiniChallengeParameterScore[], high = true) => {
  return parameters.reduce<MiniChallengeParameterScore | null>((acc, param) => {
    if (param.max === 0) return acc;
    if (!acc) return param;
    const currentRatio = param.points / param.max;
    const accRatio = acc.points / acc.max;
    if (high ? currentRatio > accRatio : currentRatio < accRatio) {
      return param;
    }
    return acc;
  }, null);
};

const buildNotes = (parameters: MiniChallengeParameterScore[]) => {
  const notes: string[] = [];
  const strongest = getLongestNote(parameters, true);
  const weakest = getLongestNote(parameters, false);
  if (strongest && strongest.points > 0) {
    notes.push(`${strongest.name} stood out as a strength.`);
  }
  if (weakest && weakest.points < weakest.max) {
    notes.push(`Focus on ${weakest.name.toLowerCase()} to close the gap.`);
  }
  return notes.slice(0, 2);
};

const buildFeedback = (parameters: MiniChallengeParameterScore[], defaultFeedback: string) => {
  const strongest = getLongestNote(parameters, true);
  const weakest = getLongestNote(parameters, false);
  if (!strongest || !weakest) return defaultFeedback;
  const strengthSentence =
    strongest.points > strongest.max * 0.7
      ? `${strongest.name} keeps the response aligned with the task.`
      : "Core expectations are covered.";
  const improvementSentence =
    weakest.points < weakest.max * 0.7
      ? `Improve ${weakest.name.toLowerCase()} to match the rubric.`
      : "Minor refinements will lift the score further.";
  return `${strengthSentence} ${improvementSentence}`;
};

const applyOffTopicCap = (parameters: MiniChallengeParameterScore[], enabled: boolean) => {
  if (!enabled) return;
  const total = parameters.reduce((acc, param) => acc + param.points, 0);
  if (total <= 20) return;
  const factor = 20 / total;
  for (const param of parameters) {
    param.points = directPoints(param.points * factor, param.max);
  }
};

const assignGrade = (score: number, invalid: boolean): MiniChallengeGrade["grade"] => {
  if (invalid) return "invalid_response";
  if (score >= 90) return "Excellent";
  if (score >= 75) return "Strong";
  if (score >= 60) return "Fair";
  if (score >= 40) return "Weak";
  return "Poor";
};

const TASK_NAME_MAP: Record<string, MiniChallengeGrade["taskType"]> = {
  summarize: "Summarize",
  rewrite: "Rewrite",
  proofread: "Proofread",
  "explain code": "Explain Code",
  explain_code: "Explain Code",
};

const extractIdentifiers = (input: string) => {
  const matches = input.match(/[A-Za-z_][A-Za-z0-9_]*/g) ?? [];
  return new Set(
    matches.filter((word) => !["def", "return", "for", "in", "print", "sorted", "sum", "len"].includes(word))
  );
};

export const gradeMiniChallenge = (challenge: MiniChallenge, rawAnswer: string): MiniChallengeGrade => {
  const trimmedAnswer = rawAnswer.trim();
  const taskNormalized = challenge.taskType.trim().toLowerCase();
  const taskType = TASK_NAME_MAP[taskNormalized] ?? "Summarize";
  const defs =
    taskType === "Summarize"
      ? SUMMARY_PARAM_DEFS
      : taskType === "Rewrite"
      ? REWRITE_PARAM_DEFS
      : taskType === "Proofread"
      ? PROOFREAD_PARAM_DEFS
      : EXPLAIN_PARAM_DEFS;

  if (!trimmedAnswer) {
    const parameters = zeroParameters(defs);
    return {
      id: challenge.id,
      taskType,
      difficulty: challenge.difficulty,
      score: 0,
      grade: "invalid_response",
      breakdown: {
        parameters,
        notes: ["No answer received.", "Provide a full response to enable grading."],
      },
      feedback: "Submit a complete response that matches the task before grading.",
    };
  }

  const inputStats = analyzeText(challenge.inputText);
  const idealStats = analyzeText(challenge.idealAnswer);
  const answerStats = analyzeText(trimmedAnswer);

  if (detectGibberish(answerStats)) {
    const parameters = zeroParameters(defs);
    return {
      id: challenge.id,
      taskType,
      difficulty: challenge.difficulty,
      score: 5,
      grade: "invalid_response",
      breakdown: {
        parameters,
        notes: ["The response resembled gibberish.", "Rewrite the answer using meaningful language."],
      },
      feedback: "Use clear words and sentences so the rubric can evaluate the task.",
    };
  }

  const unionTokens = new Set<string>(inputStats.tokens);
  for (const token of idealStats.tokens) unionTokens.add(token);

  const similarityToIdeal = jaccardSimilarity(answerStats.uniqueTokens, idealStats.uniqueTokens);
  const similarityToInput = jaccardSimilarity(answerStats.uniqueTokens, inputStats.uniqueTokens);
  const keywords = extractKeywords(inputStats.tokens);
  const keywordMatches = keywords.filter((keyword) => answerStats.uniqueTokens.has(keyword)).length;
  const compressionRatio = safeDivide(answerStats.wordCount, Math.max(inputStats.wordCount, 1));
  const inventedNumbers = answerStats.numbers.filter(
    (number) => !inputStats.numbersSet.has(number) && !idealStats.numbersSet.has(number)
  );
  const extraneousExamples = answerStats.hasExamplePhrase && !inputStats.hasExamplePhrase;
  const copyFromPrompt = similarityToInput > 0.4;
  const answerUnionOverlap = overlapShare(answerStats.uniqueTokens, unionTokens);
  const expectedOverlap = answerUnionOverlap;
  const offTopic =
    answerUnionOverlap < 0.2 && keywordMatches === 0 && similarityToIdeal < 0.25
      ? true
      : taskType === "Explain Code" && !mentionsCode(answerStats.lower)
      ? true
      : false;

  const baseContext: BaseContext = {
    challenge,
    answerStats,
    inputStats,
    idealStats,
    trimmedAnswer,
    normalizedAnswer: trimmedAnswer.toLowerCase(),
    similarityToIdeal,
    similarityToInput,
    expectedOverlap,
    keywords,
    keywordMatches,
    compressionRatio,
    inventedNumbers,
    extraneousExamples,
    copyFromPrompt,
    offTopic,
    answerUnionOverlap,
    inputNumbers: inputStats.numbersSet,
    idealNumbers: idealStats.numbersSet,
    unionTokens,
    identifiers: extractIdentifiers(challenge.inputText),
  };

  let computation: GradeComputation;
  switch (taskType) {
    case "Summarize":
      computation = gradeSummarize(baseContext);
      break;
    case "Rewrite":
      computation = gradeRewrite(baseContext);
      break;
    case "Proofread":
      computation = gradeProofread(baseContext);
      break;
    case "Explain Code":
    default:
      computation = gradeExplainCode(baseContext);
      break;
  }

  applyOffTopicCap(computation.parameters, computation.offTopic === true);
  const score = computation.parameters.reduce((acc, param) => acc + param.points, 0);
  const grade = assignGrade(score, false);
  const notes = buildNotes(computation.parameters);
  const feedback = buildFeedback(
    computation.parameters,
    "Keep aligning your response with the rubric expectations and refine weak spots."
  );

  return {
    id: challenge.id,
    taskType,
    difficulty: challenge.difficulty,
    score,
    grade,
    breakdown: {
      parameters: computation.parameters,
      notes,
    },
    feedback,
  };
};
