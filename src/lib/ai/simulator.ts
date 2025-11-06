import modelsData from "../../data/agentModels.json";
import promptDomainsData from "../../data/promptDomains.json";
import toolsData from "../../data/agentTools.json";
import runTemplatesData from "../../data/runTemplates.json";
import { ModelRef } from "../../types/agent";
import { getPersonality } from "./personalities";

type DomainDefinition = {
  id: string;
  label: string;
  default_tools: string[];
  output_factor: number;
  memory_policy: string;
  tone: string;
};

type ToolDefinition = {
  id: string;
  name: string;
  category: string;
};

type RunTemplates = Record<string, string[]>;

const DOMAINS: DomainDefinition[] = (promptDomainsData as { domains: DomainDefinition[] }).domains;
const DOMAIN_MAP = new Map<string, DomainDefinition>(DOMAINS.map((domain) => [domain.id, domain]));

const TOOL_MAP = new Map<string, ToolDefinition>(
  (toolsData as ToolDefinition[]).map((tool) => [tool.id.toLowerCase(), tool])
);

const MODELS: ModelRef[] = (modelsData as ModelRef[]).map(normalizeModelRecord);

const RUN_TEMPLATES: RunTemplates = runTemplatesData as RunTemplates;

function normalizeModelRecord(model: ModelRef): ModelRef {
  return {
    ...model,
    token_compression_efficiency: model.token_compression_efficiency ?? 1,
    max_context_window_tokens: model.max_context_window_tokens ?? 0,
    compute_hours_per_1m_tokens: model.compute_hours_per_1m_tokens ?? 0
  };
}

function getDomain(domainId: string): DomainDefinition {
  return DOMAIN_MAP.get(domainId) ?? DOMAINS[0];
}

function getToolDefinition(toolName: string): ToolDefinition | undefined {
  const key = toolName.toLowerCase();
  if (TOOL_MAP.has(key)) return TOOL_MAP.get(key);
  // also attempt reverse lookup by name
  for (const tool of TOOL_MAP.values()) {
    if (tool.name.toLowerCase() === key) return tool;
  }
  return undefined;
}

function pickGuidanceKey(domainId: string): keyof RunTemplates {
  switch (domainId) {
    case "classroom":
      return "teacher";
    case "coding":
      return "engineer";
    case "ops":
      return "ops";
    default:
      return "student";
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export type WorkloadInput = {
  model: ModelRef;
  promptTokens: number;
  domainId: string;
  reasoningDepth: "Shallow" | "Balanced" | "Reflective";
  activeUsers: number;
  memoryMode: "Off" | "Short" | "Long";
  toolAccess: string[];
  promptFrequencyPerMinute: number;
  contextReusePercent: number;
  compressionOverride?: number;
  region: "us" | "eu" | "asia";
  availabilityTier: "standard" | "high" | "burst";
  cacheHitRate: number;
  retrievalDepth: number;
  toolMixWeight: number;
  monthlyRunTarget: number;
  memoryRetention: "hot" | "warm" | "cold";
  personalityId?: string;
};

export type WorkloadResult = {
  effective_tokens_after_cache: number;
  effective_tool_overhead: number;
  regional_latency_seconds: number;
  final_latency_seconds: number;
  monthly_cost_usd: number;
  memory_footprint_mb: number;
  context_pressure_percent: number;
  concurrency_risk: "Low" | "Medium" | "High";
  suggested_model: string;
  suggested_tool_action: string;
  cost_per_session_usd: number;
  sessions_per_month: number;
  effective_input_tokens: number;
  effective_output_tokens: number;
  guidance: string[];
};

export function simulateWorkload(input: WorkloadInput): WorkloadResult {
  const {
    model,
    promptTokens,
    domainId,
    reasoningDepth,
    activeUsers,
    memoryMode,
    toolAccess,
    promptFrequencyPerMinute,
    contextReusePercent,
    compressionOverride,
    region,
    availabilityTier,
    cacheHitRate,
    retrievalDepth,
    toolMixWeight,
    monthlyRunTarget,
    memoryRetention,
    personalityId
  } = input;

  const domain = getDomain(domainId);
  const domainOutputFactor = domain.output_factor;
  const reasoningMultiplier =
    reasoningDepth === "Shallow" ? 1 : reasoningDepth === "Balanced" ? 1.2 : 1.4;

  const inputTokensAdj = Math.round(promptTokens * reasoningMultiplier);
  const outputTokensEstimate = Math.max(
    256,
    Math.round(inputTokensAdj * 0.75 * domainOutputFactor)
  );

  let memoryTokens = memoryMode === "Off" ? 0 : memoryMode === "Short" ? 200 : 1000;
  if (memoryRetention === "hot") {
    memoryTokens = Math.round(memoryTokens * 1.3);
  } else if (memoryRetention === "cold") {
    memoryTokens = Math.round(memoryTokens * 0.7);
  }

  let toolOverhead = 0;
  for (const toolName of toolAccess) {
    const toolDef = getToolDefinition(toolName);
    const base =
      toolDef && /dev|vision/i.test(toolDef.category) ? 120 : /code|vision/i.test(toolName)
        ? 120
        : 50;
    toolOverhead += base;
  }
  toolOverhead = Math.round(
    toolOverhead * (1 + (retrievalDepth - 1) * 0.15) * (1 + toolMixWeight * 0.1)
  );

  const reuseFactor = clamp(contextReusePercent / 100, 0, 1);
  const reusableTokens = Math.round((inputTokensAdj + toolOverhead) * reuseFactor);
  const nonReusableTokens = inputTokensAdj + toolOverhead - reusableTokens;

  const cacheFactor = clamp(cacheHitRate, 0, 1);
  const cachedTokens = Math.round(nonReusableTokens * cacheFactor);
  const effectiveTokensBeforeCompression =
    nonReusableTokens - cachedTokens + outputTokensEstimate + memoryTokens;

  const modelCompression = model.token_compression_efficiency || 1.0;
  const compression = typeof compressionOverride === "number"
    ? Math.max(0.5, compressionOverride)
    : modelCompression;

  const effectiveTokens = Math.round(effectiveTokensBeforeCompression / compression);
  const effectiveToolOverhead = toolOverhead;

  const regionLatency = region === "us" ? 0 : region === "eu" ? 0.12 : 0.18;
  const tierLatency = availabilityTier === "standard" ? 0 : availabilityTier === "high" ? 0.1 : 0.25;

  let concurrencyFactor = 1.0;
  if (activeUsers > 500) concurrencyFactor = 1.6;
  else if (activeUsers > 250) concurrencyFactor = 1.3;
  else if (activeUsers > 100) concurrencyFactor = 1.15;

  const baseLatency = model.average_latency_seconds;
  const personalityMultiplier = personalityId ? getPersonality(personalityId).reasoningMultiplier : 1.0;
  const finalLatencySeconds =
    baseLatency * reasoningMultiplier * personalityMultiplier * concurrencyFactor +
    regionLatency +
    tierLatency +
    (memoryMode === "Long" ? 0.2 : 0);

  const effectiveInputShare =
    inputTokensAdj + toolOverhead + memoryTokens === 0
      ? 0.5
      : (inputTokensAdj + toolOverhead + memoryTokens) /
        (inputTokensAdj + toolOverhead + memoryTokens + outputTokensEstimate);

  const effectiveInputTokens = Math.round(effectiveTokens * effectiveInputShare);
  const effectiveOutputTokens = Math.max(effectiveTokens - effectiveInputTokens, 0);

  const costPerSessionUSD =
    (effectiveInputTokens / 1000) * model.input_price_per_1k_tokens_usd +
    (effectiveOutputTokens / 1000) * model.output_price_per_1k_tokens_usd;

  const sessionsPerMinute = activeUsers * promptFrequencyPerMinute;
  const defaultSessionsPerMonth = sessionsPerMinute * 60 * 24 * 30;
  const sessionsPerMonth =
    monthlyRunTarget && monthlyRunTarget > 0 ? monthlyRunTarget : defaultSessionsPerMonth;

  const monthlyCostUSD = Number((sessionsPerMonth * costPerSessionUSD).toFixed(2));
  const memoryFootprintMB = Math.round(effectiveTokens / 2);
  const contextPressurePercent = Math.min(
    150,
    Math.round((effectiveTokens / model.max_context_window_tokens) * 100)
  );

  const concurrencyRisk =
    activeUsers < 100 ? "Low" : activeUsers < 300 ? "Medium" : "High";

  const suggestedSibling = MODELS
    .filter(
      (candidate) =>
        candidate.provider === model.provider &&
        candidate.model_name !== model.model_name &&
        candidate.input_price_per_1k_tokens_usd < model.input_price_per_1k_tokens_usd
    )
    .sort(
      (a, b) =>
        a.input_price_per_1k_tokens_usd - b.input_price_per_1k_tokens_usd
    )[0];

  const suggestedModel = suggestedSibling
    ? suggestedSibling.model_name
    : "No cheaper sibling in catalog";

  const suggestedToolAction =
    retrievalDepth > 3 || toolAccess.length > 3 || toolMixWeight > 2
      ? "Reduce tool count or lower retrieval depth to cut latency and cost"
      : "Tools look balanced for this setup";

  const guidanceKey = pickGuidanceKey(domainId);
  const guidance = RUN_TEMPLATES[guidanceKey] ?? [];

  return {
    effective_tokens_after_cache: effectiveTokens,
    effective_tool_overhead: effectiveToolOverhead,
    regional_latency_seconds: Number(regionLatency.toFixed(2)),
    final_latency_seconds: Number(finalLatencySeconds.toFixed(2)),
    monthly_cost_usd: monthlyCostUSD,
    memory_footprint_mb: memoryFootprintMB,
    context_pressure_percent: contextPressurePercent,
    concurrency_risk: concurrencyRisk,
    suggested_model: suggestedModel,
    suggested_tool_action: suggestedToolAction,
    cost_per_session_usd: Number(costPerSessionUSD.toFixed(4)),
    sessions_per_month: Number(sessionsPerMonth.toFixed(0)),
    effective_input_tokens: effectiveInputTokens,
    effective_output_tokens: effectiveOutputTokens,
    guidance
  };
}
