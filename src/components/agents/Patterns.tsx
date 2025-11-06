'use client';

import patterns from '../../data/agentPatterns.json';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Block } from '../../lib/ai/composerSim';

type PatternsProps = {
  onSelectPattern: (blocks: Block[]) => void;
};

export function Patterns({ onSelectPattern }: PatternsProps) {
  return (
    <section className="rounded-3xl border border-white/10 bg-slate-950/70 p-8 shadow-inner">
      <div className="space-y-6">
        <div>
          <h3 className="font-display text-2xl text-white">Starter patterns</h3>
          <p className="text-sm text-slate-300">
            Load a recipe to see how blocks connect for common classroom workflows.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {patterns.map((pattern) => (
            <Card key={pattern.id} className="border-white/10 bg-black/60 text-slate-100">
              <CardHeader>
                <CardTitle className="text-lg text-white">{pattern.title}</CardTitle>
                <CardDescription className="text-sm text-slate-300">{pattern.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-xs text-slate-300">
                <ul className="space-y-1">
                  {pattern.blocks.map((block) => (
                    <li key={block.type + JSON.stringify(block.config)} className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 uppercase tracking-wide text-slate-200">
                      {block.type}
                    </li>
                  ))}
                </ul>
                <Button className="w-full" onClick={() => onSelectPattern(pattern.blocks as Block[])}>
                  Load pattern
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
