'use client';

import { FormEvent, useMemo, useState } from 'react';
import modelsData from '../../data/agentModels.json';
import { AgentModelConfig } from './types';
import { simulateWorkload } from '../../lib/ai/simulator';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '../ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

type SimulatorResult = ReturnType<typeof simulateWorkload>;

const models: AgentModelConfig[] = modelsData as AgentModelConfig[];

export function Simulator() {
  const [modelName, setModelName] = useState(models[0]?.model_name ?? '');
  const [promptTokens, setPromptTokens] = useState(600);
  const [result, setResult] = useState<SimulatorResult | null>(null);

  const model = useMemo(
    () => models.find((entry) => entry.model_name === modelName) ?? models[0],
    [modelName]
  );

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!model) return;
    const simResult = simulateWorkload({
      model: model.model_name,
      tokens: promptTokens
    });
    setResult(simResult);
  };

  return (
    <section className="rounded-3xl border border-white/10 bg-slate-950/70 p-8 shadow-inner">
      <div className="space-y-6">
        <div>
          <h3 className="font-display text-2xl text-white">Workload simulator</h3>
          <p className="text-sm text-slate-300">
            Estimate latency and token usage locally. Everything is simulated to stay deterministic for class demos.
          </p>
        </div>

        <form onSubmit={onSubmit} className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-slate-200">Model</Label>
                <Select value={modelName} onValueChange={setModelName}>
                  <SelectTrigger className="border-white/10 bg-black/50 text-slate-100">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 text-slate-100">
                    {models.map((item) => (
                      <SelectItem key={item.model_name} value={item.model_name}>
                        {item.model_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-200">Prompt tokens</Label>
                <Input
                  type="number"
                  min={0}
                  value={promptTokens}
                  onChange={(event) => setPromptTokens(Number(event.target.value))}
                  className="border-white/10 bg-black/50 text-slate-100"
                />
                <p className="text-xs text-slate-400">
                  Approx {Math.round(promptTokens / 4)} characters.
                </p>
              </div>
            </div>
            <Button type="submit" className="w-full md:w-auto">
              Simulate workload
            </Button>
          </div>

          <Card className="border-white/10 bg-black/60 text-slate-100">
            <CardHeader>
              <CardTitle className="text-xl text-white">Simulation result</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              {result ? (
                <div className="space-y-3">
                  <p>Latency {result.latency_ms} ms</p>
                  <p>Tokens used {result.tokens_used.toLocaleString()}</p>
                  <p>Cost ${result.cost_usd.toFixed(4)} USD</p>
                  {result.notes ? (
                    <p className="rounded-2xl border border-emerald-400/40 bg-emerald-500/10 p-3 text-emerald-100">
                      {result.notes}
                    </p>
                  ) : null}
                </div>
              ) : (
                <p className="text-slate-300">
                  Choose a model, set an approximate token count, then run the simulation to view the deterministic estimate.
                </p>
              )}
            </CardContent>
          </Card>
        </form>
      </div>
    </section>
  );
}
