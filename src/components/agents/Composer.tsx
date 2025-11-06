'use client';

import { useCallback, useMemo, useState } from 'react';
import { Reorder } from 'framer-motion';
import { AgentModelConfig, AgentRunView } from './types';
import { Block, simulateComposerRun } from '../../lib/ai/composerSim';
import toolsData from '../../data/agentTools.json';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '../ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Trash2, GripVertical, Play } from 'lucide-react';
import { cn } from '../../lib/utils';
import { usePrefersReducedMotion } from '../../hooks/use-prefers-reduced-motion';
import { motion } from 'framer-motion';

type ComposerRunPayload = {
  id: string;
  prompt: string;
  blocks: Block[];
  result: ReturnType<typeof simulateComposerRun>;
  hasMemory: boolean;
  hasTool: boolean;
  timestamp: number;
};

type ComposerProps = {
  models: AgentModelConfig[];
  blocks: Block[];
  onBlocksChange: (blocks: Block[]) => void;
  prompt: string;
  onPromptChange: (prompt: string) => void;
  onRun: (payload: ComposerRunPayload) => AgentRunView;
};

const toolMap = new Map(toolsData.map((tool) => [tool.id, tool]));

const BLOCK_LIBRARY: { type: Block['type']; label: string; helper: string }[] = [
  { type: 'goal', label: 'Goal', helper: 'Define what the agent should achieve.' },
  { type: 'planner', label: 'Planner', helper: 'Select a model to plan steps.' },
  { type: 'tool', label: 'Tool', helper: 'Call an integration or function.' },
  { type: 'memory', label: 'Memory', helper: 'Reuse context across steps.' },
  { type: 'retrieve', label: 'Retrieve', helper: 'Pull context from knowledge.' },
  { type: 'reflect', label: 'Reflect', helper: 'Add a reflection loop.' },
  { type: 'output', label: 'Output', helper: 'Format the final response.' },
  { type: 'stop', label: 'Stop', helper: 'End the chain with a guard.' }
];

function createBlock(type: Block['type'], models: AgentModelConfig[]): Block {
  switch (type) {
    case 'goal':
      return { id: crypto.randomUUID(), type, config: { text: 'State the learner outcome.' } };
    case 'planner':
      return { id: crypto.randomUUID(), type, config: { model: models[0]?.model_name ?? 'GPT 5 (fast)' } };
    case 'tool':
      return {
        id: crypto.randomUUID(),
        type,
        config: { id: toolsData[0]?.id ?? 'cursor', tool_type: toolsData[0]?.type ?? 'planner', sample_prompt: toolsData[0]?.sample_prompt }
      };
    case 'memory':
      return { id: crypto.randomUUID(), type, config: { length: 'short' } };
    case 'retrieve':
      return { id: crypto.randomUUID(), type, config: { source: 'class-notes', limit: 3 } };
    case 'reflect':
      return { id: crypto.randomUUID(), type, config: { passes: 1 } };
    case 'output':
      return { id: crypto.randomUUID(), type, config: { format: 'summary' } };
    case 'stop':
      return { id: crypto.randomUUID(), type, config: { when: 'goal-met' } };
    default:
      return { id: crypto.randomUUID(), type, config: {} };
  }
}

export function Composer({
  models,
  blocks,
  onBlocksChange,
  prompt,
  onPromptChange,
  onRun
}: ComposerProps) {
  const reduceMotion = usePrefersReducedMotion();
  const [lastRun, setLastRun] = useState<AgentRunView | null>(null);

  const ensureIds = useMemo(() => {
    return blocks.map((block) =>
      block.id ? block : { ...block, id: crypto.randomUUID() }
    );
  }, [blocks]);

  const updateBlock = useCallback(
    (index: number, updater: (block: Block) => Block) => {
      const next = [...ensureIds];
      next[index] = updater(next[index]);
      onBlocksChange(next);
    },
    [ensureIds, onBlocksChange]
  );

  const removeBlock = useCallback(
    (id: string) => {
      onBlocksChange(ensureIds.filter((block) => block.id !== id));
    },
    [ensureIds, onBlocksChange]
  );

  const addBlock = useCallback(
    (type: Block['type']) => {
      onBlocksChange([...ensureIds, createBlock(type, models)]);
    },
    [ensureIds, models, onBlocksChange]
  );

  const runComposer = useCallback(() => {
    if (!prompt.trim() || !ensureIds.length) return;

    const id = crypto.randomUUID();
    const result = simulateComposerRun(ensureIds, prompt);
    const hasMemory = ensureIds.some((block) => block.type === 'memory');
    const hasTool = ensureIds.some((block) => block.type === 'tool');

    const payload: ComposerRunPayload = {
      id,
      prompt,
      blocks: ensureIds,
      result,
      hasMemory,
      hasTool,
      timestamp: Date.now()
    };

    const finalRun = onRun(payload);
    setLastRun(finalRun);
  }, [ensureIds, onRun, prompt]);

  return (
    <section className="rounded-3xl border border-white/10 bg-slate-950/70 p-8 shadow-inner">
      <div className="flex flex-col gap-8 xl:flex-row">
        <div className="w-full xl:w-1/2">
          <Card className="border-white/10 bg-black/60 text-slate-100">
            <CardHeader>
              <CardTitle className="text-2xl text-white">Composer</CardTitle>
              <CardDescription className="text-sm text-slate-300">
                Arrange blocks to build an agentic chain. Drag to reorder or use the move buttons for keyboard control.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="composer-prompt" className="text-slate-200">
                  Agent goal
                </Label>
                <Textarea
                  id="composer-prompt"
                  value={prompt}
                  onChange={(event) => onPromptChange(event.target.value)}
                  rows={4}
                  className="border-white/10 bg-black/40 text-slate-100"
                  placeholder="Describe the outcome you want the chain to produce."
                />
              </div>

              <div className="space-y-3">
                <p className="text-sm font-medium text-slate-200">Blocks</p>
                <Reorder.Group
                  axis="y"
                  values={ensureIds}
                  onReorder={onBlocksChange}
                  className="space-y-3"
                >
                  {ensureIds.map((block, index) => (
                    <Reorder.Item
                      key={block.id}
                      value={block}
                      className="rounded-3xl border border-white/10 bg-white/5 p-4"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-sm uppercase tracking-wide text-emerald-200">
                          <GripVertical className="h-4 w-4 text-slate-400" aria-hidden="true" />
                          {block.type}
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-red-200 hover:text-red-100"
                            onClick={() => removeBlock(block.id!)}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Remove block</span>
                          </Button>
                        </div>
                      </div>
                      <div className="mt-3 space-y-3 text-sm text-slate-200">
                        {block.type === 'goal' ? (
                          <Textarea
                            value={String(block.config?.text ?? '')}
                            onChange={(event) =>
                              updateBlock(index, (prev) => ({
                                ...prev,
                                config: { ...prev.config, text: event.target.value }
                              }))
                            }
                            rows={2}
                            className="border-white/10 bg-black/40 text-slate-100"
                          />
                        ) : null}

                        {block.type === 'planner' ? (
                          <div className="space-y-2">
                            <Label className="text-xs uppercase text-slate-300">Model</Label>
                            <Select
                              value={String(block.config?.model ?? models[0]?.model_name)}
                              onValueChange={(value) =>
                                updateBlock(index, (prev) => ({
                                  ...prev,
                                  config: { ...prev.config, model: value }
                                }))
                              }
                            >
                              <SelectTrigger className="border-white/10 bg-black/40 text-slate-100">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-slate-900 text-slate-100">
                                {models.map((model) => (
                                  <SelectItem key={model.model_name} value={model.model_name}>
                                    {model.model_name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        ) : null}

                        {block.type === 'tool' ? (
                          <div className="space-y-2">
                            <Label className="text-xs uppercase text-slate-300">Tool</Label>
                            <Select
                              value={String(block.config?.id ?? toolsData[0]?.id)}
                              onValueChange={(value) =>
                                updateBlock(index, (prev) => {
                                  const tool = toolMap.get(value);
                                  return {
                                    ...prev,
                                    config: {
                                      ...prev.config,
                                      id: value,
                                      tool_type: tool?.type ?? prev.config?.tool_type ?? 'tool',
                                      sample_prompt: tool?.sample_prompt ?? prev.config?.sample_prompt
                                    }
                                  };
                                })
                              }
                            >
                              <SelectTrigger className="border-white/10 bg-black/40 text-slate-100">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-slate-900 text-slate-100">
                                {toolsData.map((tool) => (
                                  <SelectItem key={tool.id} value={tool.id}>
                                    {tool.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Label className="text-xs uppercase text-slate-300">Tool type</Label>
                            <Input
                              value={String(block.config?.tool_type ?? '')}
                              onChange={(event) =>
                                updateBlock(index, (prev) => ({
                                  ...prev,
                                  config: { ...prev.config, tool_type: event.target.value }
                                }))
                              }
                              className="border-white/10 bg-black/40 text-slate-100"
                            />
                            <Label className="text-xs uppercase text-slate-300">Sample prompt</Label>
                            <Textarea
                              value={String(block.config?.sample_prompt ?? '')}
                              onChange={(event) =>
                                updateBlock(index, (prev) => ({
                                  ...prev,
                                  config: { ...prev.config, sample_prompt: event.target.value }
                                }))
                              }
                              rows={2}
                              className="border-white/10 bg-black/40 text-slate-100"
                            />
                          </div>
                        ) : null}

                        {block.type === 'memory' ? (
                          <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/40 p-3">
                            <div>
                              <p className="text-xs uppercase text-slate-300">Memory length</p>
                              <p className="text-xs text-slate-400">Short costs 200 tokens, long costs 1000 tokens.</p>
                            </div>
                            <Select
                              value={String(block.config?.length ?? 'short')}
                              onValueChange={(value) =>
                                updateBlock(index, (prev) => ({
                                  ...prev,
                                  config: { ...prev.config, length: value }
                                }))
                              }
                            >
                              <SelectTrigger className="h-9 w-28 border-white/10 bg-black/60 text-slate-100">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-slate-900 text-slate-100">
                                <SelectItem value="short">Short</SelectItem>
                                <SelectItem value="long">Long</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        ) : null}

                        {block.type === 'retrieve' ? (
                          <div className="grid gap-2">
                            <Label className="text-xs uppercase text-slate-300">Source</Label>
                            <Input
                              value={String(block.config?.source ?? '')}
                              onChange={(event) =>
                                updateBlock(index, (prev) => ({
                                  ...prev,
                                  config: { ...prev.config, source: event.target.value }
                                }))
                              }
                              className="border-white/10 bg-black/40 text-slate-100"
                            />
                            <Label className="text-xs uppercase text-slate-300">Limit</Label>
                            <Input
                              type="number"
                              min={1}
                              value={Number(block.config?.limit ?? 3)}
                              onChange={(event) =>
                                updateBlock(index, (prev) => ({
                                  ...prev,
                                  config: { ...prev.config, limit: Number(event.target.value) }
                                }))
                              }
                              className="border-white/10 bg-black/40 text-slate-100"
                            />
                          </div>
                        ) : null}

                        {block.type === 'reflect' ? (
                          <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/40 p-3">
                            <p className="text-xs uppercase text-slate-300">Reflection passes</p>
                            <Input
                              type="number"
                              min={1}
                              value={Number(block.config?.passes ?? 1)}
                              onChange={(event) =>
                                updateBlock(index, (prev) => ({
                                  ...prev,
                                  config: { ...prev.config, passes: Number(event.target.value) }
                                }))
                              }
                              className="h-9 w-16 border-white/10 bg-black/60 text-center text-slate-100"
                            />
                          </div>
                        ) : null}

                        {block.type === 'output' ? (
                          <div className="space-y-2">
                            <Label className="text-xs uppercase text-slate-300">Format</Label>
                            <Select
                              value={String(block.config?.format ?? 'summary')}
                              onValueChange={(value) =>
                                updateBlock(index, (prev) => ({
                                  ...prev,
                                  config: { ...prev.config, format: value }
                                }))
                              }
                            >
                              <SelectTrigger className="border-white/10 bg-black/40 text-slate-100">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-slate-900 text-slate-100">
                                <SelectItem value="summary">Summary</SelectItem>
                                <SelectItem value="bullets">Bullets</SelectItem>
                                <SelectItem value="qa">QA</SelectItem>
                                <SelectItem value="diff">Diff</SelectItem>
                                <SelectItem value="json">JSON</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        ) : null}

                        {block.type === 'stop' ? (
                          <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/40 p-3">
                            <Label className="text-xs uppercase text-slate-300">Stop when</Label>
                            <Input
                              value={String(block.config?.when ?? 'goal-met')}
                              onChange={(event) =>
                                updateBlock(index, (prev) => ({
                                  ...prev,
                                  config: { ...prev.config, when: event.target.value }
                                }))
                              }
                              className="h-9 border-white/10 bg-black/60 text-slate-100"
                            />
                          </div>
                        ) : null}
                      </div>
                    </Reorder.Item>
                  ))}
                </Reorder.Group>

                <div className="grid gap-2 md:grid-cols-2">
                  {BLOCK_LIBRARY.map((block) => (
                    <Button
                      key={block.type}
                      variant="outline"
                      className="justify-start border-white/10 hover:border-emerald-400/50 hover:text-emerald-200"
                      onClick={() => addBlock(block.type)}
                    >
                      <div className="text-left">
                        <p className="font-semibold capitalize">{block.label}</p>
                        <p className="text-xs text-slate-300">{block.helper}</p>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-white/10 bg-white/5 p-4">
                <div className="space-y-1 text-sm text-slate-200">
                  <p>{ensureIds.length} block{ensureIds.length === 1 ? '' : 's'} configured</p>
                  <p className="text-xs text-slate-400">
                    Tools add overhead of 50 tokens (120 for code or vision). Memory adds 200 for short and 1000 for long.
                  </p>
                </div>
                <Button onClick={runComposer} disabled={!ensureIds.length} className="gap-2">
                  <Play className="h-4 w-4" />
                  Run chain
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="w-full xl:w-1/2">
          <Card className="h-full border-white/10 bg-black/60 text-slate-100">
            <CardHeader>
              <CardTitle className="text-2xl text-white">Chain output</CardTitle>
              <CardDescription className="text-sm text-slate-300">
                Results from the last run appear here with token budget and runtime estimates.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {lastRun ? (
                <>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300">
                    <span>Tokens {lastRun.tokens}</span>
                    <span>Runtime {lastRun.runtimeSeconds.toFixed(1)}s</span>
                    {typeof lastRun.costUSD === 'number' ? (
                      <span>Cost ${lastRun.costUSD.toFixed(4)}</span>
                    ) : null}
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    {lastRun.steps.map((step) =>
                      reduceMotion ? (
                        <div key={step.stage + step.text} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                          <p className="text-xs uppercase tracking-wide text-emerald-300">{step.stage}</p>
                          <p className="mt-1 text-xs text-slate-200">{step.text}</p>
                        </div>
                      ) : (
                        <motion.div
                          key={step.stage + step.text}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.25 }}
                          className="rounded-2xl border border-white/10 bg-white/5 p-3"
                        >
                          <p className="text-xs uppercase tracking-wide text-emerald-300">{step.stage}</p>
                          <p className="mt-1 text-xs text-slate-200">{step.text}</p>
                        </motion.div>
                      )
                    )}
                  </div>
                  {lastRun.recallMatches?.length ? (
                    <div className="rounded-2xl border border-emerald-400/40 bg-emerald-500/10 p-4 text-xs text-emerald-100">
                      Recall blended {lastRun.recallMatches.length} memory item{lastRun.recallMatches.length > 1 ? 's' : ''} adding {lastRun.recallTokens} tokens.
                    </div>
                  ) : null}
                  <p className="text-sm italic text-slate-200">{lastRun.final}</p>
                </>
              ) : (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-slate-200">
                  Configure at least one block and run the chain to preview the simulated output.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
