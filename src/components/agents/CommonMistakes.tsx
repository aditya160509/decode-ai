'use client';

import issues from '../../data/agentCommonIssues.json';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { cn } from '../../lib/utils';

type CommonMistakesProps = {
  toolCount: number;
  hasMemory: boolean;
};

export function CommonMistakes({ toolCount, hasMemory }: CommonMistakesProps) {
  return (
    <section className="rounded-3xl border border-white/10 bg-slate-950/70 p-8 shadow-inner">
      <div className="space-y-6">
        <div>
          <h3 className="font-display text-2xl text-white">Common mistakes</h3>
          <p className="text-sm text-slate-300">
            Guardrails help students keep agents lean and reliable.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {issues.map((issue) => {
            const highlight =
              (issue.slug === 'too_many_tools' && toolCount > 3) ||
              (issue.slug === 'no_memory' && !hasMemory);
            return (
              <Card
                key={issue.slug}
                className={cn(
                  'border-white/10 bg-black/60 text-slate-100 transition-colors',
                  highlight && 'border-emerald-400/60 bg-emerald-500/10'
                )}
              >
                <CardHeader>
                  <CardTitle className="text-lg text-white">{issue.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-slate-200">
                  <p className="text-emerald-200">Why: {issue.why}</p>
                  <p className="text-slate-200">Fix: {issue.fix}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
