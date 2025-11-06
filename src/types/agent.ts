export type ModelRef = {
  model_name: string;
  provider: string;
  average_latency_seconds: number;
  input_price_per_1k_tokens_usd: number;
  output_price_per_1k_tokens_usd: number;
  compute_hours_per_1m_tokens: number;
  token_compression_efficiency: number;
  scaling_penalty_for_parallel_sessions?: "low" | "medium" | "high" | string;
  typical_reasoning_depth_supported?: string;
  max_context_window_tokens: number;
  availability_or_plan?: string;
  notes_on_provider_limits?: string;
};
