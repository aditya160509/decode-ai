'use client';

import { useCallback, useMemo, useState } from 'react';
import promptDomainsData from '../../data/promptDomains.json';
import toolsData from '../../data/agentTools.json';
import { useAgentSession } from './AgentSessionContext';
import { AgentModelConfig, AgentRunView } from './types';
import { approximateTokens, countTokens } from '../../lib/ai/tokens';
import { simulateModelRun } from '../../lib/ai/reasoning';
import { getPersonality } from '../../lib/ai/personalities';
import { addMemory, MemoryEntry } from '../../lib/ai/memory';
import { usePersistentState } from '../../hooks/use-persistent-state';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '../ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { usePrefersReducedMotion } from '../../hooks/use-prefers-reduced-motion';
import { motion } from 'framer-motion';

type PlaygroundRunPayload = {
  id: string;
  prompt: string;
  model: AgentModelConfig;
  sim: ReturnType<typeof simulateModelRun>;
  inputTokens: number;
  outputTokensEstimate: number;
  memoryTokens: number;
  toolOverhead: number;
  totalTokens: number;
  costPerRunUSD: number;
  latencySeconds: number;
  stepTokens: number;
  timestamp: number;
};

type PlaygroundProps = {
  models: AgentModelConfig[];
  onRun: (payload: PlaygroundRunPayload) => AgentRunView;
  onMemoryWrite?: () => void;
};

type PromptDomain = {
  id: string;
  label: string;
  default_tools: string[];
  output_factor: number;
  memory_policy: string;
};

type ToolDefinition = {
  id: string;
  name: string;
  category: string;
};

const DOMAINS: PromptDomain[] = (promptDomainsData as { domains: PromptDomain[] }).domains;
const TOOLS: ToolDefinition[] = toolsData as ToolDefinition[];

export function Playground({ models, onRun, onMemoryWrite }: PlaygroundProps) {
  const reduceMotion = usePrefersReducedMotion();
  const { state, setState } = useAgentSession();
  const {
    modelName,
    personalityId,
    promptDomainId,
    memoryMode,
    toolMix,
    complexityLevel,
    compressionOverride
  } = state;

  const [prompt, setPrompt] = usePersistentState<string>(
    'decodeai.playground.prompt',
    'Explain the agent loop in one paragraph for new civic tech students.'
  );
  const [lastRun, setLastRun] = useState<AgentRunView | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const selectedModel = useMemo(
    () => models.find((m) => m.model_name === modelName) ?? models[0],
    [models, modelName]
  );

  const domain = useMemo(() => {
    return DOMAINS.find((entry) => entry.id === promptDomainId) ?? DOMAINS[0];
  }, [promptDomainId]);

  const personality = useMemo(() => getPersonality(personalityId), [personalityId]);

  const activeTools = useMemo(() => {
    if (toolMix.length > 0) return toolMix;
    return (domain.default_tools || []).filter((id) => id !== 'none');
  }, [toolMix, domain.default_tools]);

  const toolOverhead = useMemo(() => {
    return activeTools.reduce((sum, toolId) => {
      const normalized = toolId.toLowerCase();
      const tool =
        TOOLS.find((entry) => entry.id.toLowerCase() === normalized) ??
        TOOLS.find((entry) => entry.name.toLowerCase() === normalized);
      const isHeavy =
        tool && /dev|vision/i.test(tool.category) ? true : /code|vision/i.test(normalized);
      return sum + (isHeavy ? 120 : 50);
    }, 0);
  }, [activeTools]);

  const memoryTokens = useMemo(() => {
    if (memoryMode === 'Short') return 200;
    if (memoryMode === 'Long') return 1000;
    return 0;
  }, [memoryMode]);

  const inputTokens = useMemo(() => approximateTokens(prompt), [prompt]);
  const outputTokens = useMemo(
    () => Math.max(256, Math.round(inputTokens * domain.output_factor)),
    [inputTokens, domain.output_factor]
  );
  const totalTokens = inputTokens + outputTokens + memoryTokens + toolOverhead;

  const costPerRunUSD = useMemo(() => {
    return (
      (inputTokens / 1000) * selectedModel.input_price_per_1k_tokens_usd +
      (outputTokens / 1000) * selectedModel.output_price_per_1k_tokens_usd
    );
  }, [inputTokens, outputTokens, selectedModel]);

  const contextUtilizationPct = useMemo(() => {
    return Math.min(
      150,
      Math.round((totalTokens / selectedModel.max_context_window_tokens) * 100)
    );
  }, [totalTokens, selectedModel.max_context_window_tokens]);

  const latencySeconds = useMemo(() => {
    const base =
      selectedModel.average_latency_seconds +
      complexityLevel * 0.15 +
      (memoryMode === 'Long' ? 0.2 : 0);
    return Number((base * personality.reasoningMultiplier).toFixed(2));
  }, [selectedModel, complexityLevel, memoryMode, personality.reasoningMultiplier]);

  const handleModelChange = useCallback(
    (value: string) => {
      setState((prev) => ({ ...prev, modelName: value }));
    },
    [setState]
  );

  const handleDomainChange = useCallback(
    (value: string) => {
      setState((prev) => ({ ...prev, promptDomainId: value }));
    },
    [setState]
  );

  const persistPlaygroundRun = useCallback(
    (summary: { id: string; model: string; tokens: number; cost: number; latency: number; prompt: string }) => {
      if (typeof window === 'undefined') return;
      try {
        const key = 'decodeai.agent.playground';
        const existing = window.localStorage.getItem(key);
        const parsed: any[] = existing ? JSON.parse(existing) : [];
        parsed.push(summary);
        window.localStorage.setItem(key, JSON.stringify(parsed).slice(0, 6000));
      } catch {
        // ignore storage failures
      }
    },
    []
  );

  const handleRun = useCallback(() => {
    if (!prompt.trim()) return;
    const runId = crypto.randomUUID();
    setIsRunning(true);

    const sim = simulateModelRun({
      prompt,
      modelName: selectedModel.model_name,
      personalityId,
      stepCount: Math.max(4, personality.verbs.length)
    });
    const stepTokens = countTokens(sim.steps.map((step) => step.text));

    const payload: PlaygroundRunPayload = {
      id: runId,
      prompt,
      model: selectedModel,
      sim,
      inputTokens,
      outputTokensEstimate: outputTokens,
      memoryTokens,
      toolOverhead,
      totalTokens,
      costPerRunUSD,
      latencySeconds,
      stepTokens,
      timestamp: Date.now()
    };

    const runResult = onRun(payload);
    setLastRun(runResult);

    if (memoryMode !== 'Off') {
      const entry: MemoryEntry = {
        id: runId,
        source: 'playground',
        text: prompt.trim(),
        meta: {
          model: selectedModel.model_name,
          costPerRunUSD,
          latencySeconds
        },
        timestamp: Date.now()
      };
      addMemory(entry);
      onMemoryWrite?.();
    }

    persistPlaygroundRun({
      id: runId,
      model: selectedModel.model_name,
      tokens: totalTokens,
      cost: costPerRunUSD,
      latency: latencySeconds,
      prompt: prompt.trim()
    });

    setIsRunning(false);
  }, [
    prompt,
    selectedModel,
    personality,
    personalityId,
    inputTokens,
    outputTokens,
    memoryTokens,
    toolOverhead,
    totalTokens,
    costPerRunUSD,
    latencySeconds,
    onRun,
    memoryMode,
    onMemoryWrite,
    persistPlaygroundRun
  ]);

  return (
    <section id="playground" className="rounded-3xl border border-white/10 bg-slate-950/70 p-8 shadow-inner">
      <div className="flex flex-col gap-8 lg:flex-row">
        <div className="flex-1 space-y-6">
          <div>
            <h3 className="font-display text-2xl text-white">Agent playground</h3>
            <p className="text-sm text-slate-300">
              Prompt a model and inspect running costs with the same formulas used by the simulator.
            </p>
          </div>

          <div className="space-y-4">
            <Label htmlFor="playground-prompt" className="text-slate-200">
              Prompt
            </Label>
            <Textarea
              id="playground-prompt"
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              rows={6}
              className="min-h-[140px] resize-y border-white/10 bg-black/50 text-slate-100 placeholder:text-slate-500"
            />
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-slate-200">Model</Label>
                <Select value={modelName} onValueChange={handleModelChange}>
                  <SelectTrigger className="border-white/10 bg-black/50 text-slate-100">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-72 bg-slate-900 text-slate-100">
                    {models.map((model) => (
                      <SelectItem key={model.model_name} value={model.model_name}>
                        {model.model_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-slate-400">
                  Context window {selectedModel.max_context_window_tokens.toLocaleString()} tokens
                </p>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-200">Prompt domain</Label>
                <Select value={promptDomainId} onValueChange={handleDomainChange}>
                  <SelectTrigger className="border-white/10 bg-black/50 text-slate-100">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 text-slate-100">
                    {DOMAINS.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-slate-400">
                  Output factor {domain.output_factor.toFixed(2)} · Default memory {domain.memory_policy}
                </p>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-200">Memory mode</Label>
                <Select
                  value={memoryMode}
                  onValueChange={(value) =>
                    setState((prev) => ({ ...prev, memoryMode: value as typeof memoryMode }))
                  }
                >
                  <SelectTrigger className="border-white/10 bg-black/50 text-slate-100">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 text-slate-100">
                    <SelectItem value="Off">Off</SelectItem>
                    <SelectItem value="Short">Short</SelectItem>
                    <SelectItem value="Long">Long</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-slate-400">
                  Personality {personalityId}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <Button onClick={handleRun} disabled={isRunning}>
              {isRunning ? 'Running...' : 'Run agent simulation'}
            </Button>
            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-300">
              <span>Total tokens {totalTokens}</span>
              <span aria-live="polite">Context usage {contextUtilizationPct}%</span>
              <span aria-live="polite">Estimated latency {latencySeconds.toFixed(2)}s</span>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-slate-200">
            <p className="font-semibold text-white">Current configuration</p>
            <ul className="mt-2 space-y-1">
              <li>Input tokens {inputTokens}</li>
              <li>Output tokens {outputTokens}</li>
              <li>Memory tokens {memoryTokens}</li>
              <li>Tool overhead {toolOverhead}</li>
              <li>Cost per run ${costPerRunUSD.toFixed(4)}</li>
              <li>Compression override {compressionOverride.toFixed(2)}</li>
            </ul>
          </div>
        </div>

        <div className="flex-1 space-y-4">
          <Card className="border-white/10 bg-black/60 text-slate-100">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-white">Run summary</CardTitle>
              {lastRun ? (
                <p className="text-xs text-slate-300">
                  {selectedModel.model_name} · Tokens {lastRun.tokens} · Cost ${lastRun.costUSD?.toFixed(4)}
                </p>
              ) : (
                <p className="text-xs text-slate-300">Run the simulation to inspect the agent loop.</p>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {lastRun ? (
                <>
                  <div className="grid gap-3 md:grid-cols-2">
                    {lastRun.steps.map((step) =>
                      reduceMotion ? (
                        <div
                          key={step.stage + step.text.slice(0, 12)}
                          className="rounded-2xl border border-white/10 bg-white/5 p-4"
                        >
                          <p className="text-xs uppercase tracking-wide text-emerald-300">{step.stage}</p>
                          <p className="mt-1 text-sm text-slate-100">{step.text}</p>
                        </div>
                      ) : (
                        <motion.div
                          key={step.stage + step.text.slice(0, 12)}
                          className="rounded-2xl border border-white/10 bg-white/5 p-4"
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.25 }}
                        >
                          <p className="text-xs uppercase tracking-wide text-emerald-300">{step.stage}</p>
                          <p className="mt-1 text-sm text-slate-100">{step.text}</p>
                        </motion.div>
                      )
                    )}
                  </div>
                  <p className="text-sm italic text-slate-200">{lastRun.final}</p>
                </>
              ) : (
                <p className="text-sm text-slate-200">
                  Steps from the simulated run will appear here after you execute the playground.
                </p>
              )}
            </CardContent>
          </Card>

          {lastRun ? (
            <Card className="border-white/10 bg-black/60 text-slate-100">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-white">Agent mirror</CardTitle>
                <p className="text-xs text-slate-300">
                  Copy friendly log for comparing with other models.
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2 rounded-2xl border border-white/10 bg-white/5 p-4">
                  {lastRun.steps.map((step) => (
                    <div
                      key={`${step.stage}-${step.text.slice(0, 16)}`}
                      className="border-b border-white/10 pb-2 last:border-none last:pb-0"
                    >
                      <p className="text-xs uppercase tracking-wide text-emerald-300">{step.stage}</p>
                      <p className="mt-1 text-sm text-slate-100">{step.text}</p>
                    </div>
                  ))}
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-wide text-emerald-300">Final</p>
                  <p className="mt-1 text-sm text-slate-100">{lastRun.final}</p>
                </div>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </section>
  );
}
