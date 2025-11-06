import { MemoryEntry } from '../../lib/ai/memory';
import { ModelRef } from '../../types/agent';

export type AgentModelConfig = ModelRef & {
  release_or_current_version?: string;
  typical_reasoning_depth_supported?: string;
  memory_or_session_support?: string;
  tool_or_function_calling_support?: string;
  multimodal_support?: string;
  rated_tasks?: string;
  max_output_tokens: number;
  notes_on_provider_limits?: string;
};

export type RunStep = { stage: string; text: string };

export type AgentRunView = {
  id: string;
  source: 'playground' | 'composer';
  prompt: string;
  modelName?: string;
  tokens: number;
  runtimeSeconds: number;
  costUSD?: number;
  steps: RunStep[];
  final: string;
  recallTokens?: number;
  recallMatches?: MemoryEntry[];
  metadata?: Record<string, unknown>;
  timestamp: number;
};

export type RecallAssessment = {
  matches: MemoryEntry[];
  addedTokens: number;
};
