'use client';

import { AgentRunView } from './types';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { usePrefersReducedMotion } from '../../hooks/use-prefers-reduced-motion';
import { motion } from 'framer-motion';

type ChainViewerProps = {
  run: AgentRunView | null;
};

const STAGE_TITLES = ['Goal', 'Plan', 'Action', 'Observation', 'Reflection', 'Output'];

export function ChainViewer({ run }: ChainViewerProps) {
  const reduceMotion = usePrefersReducedMotion();

  return (
    <section className="rounded-3xl border border-white/10 bg-slate-950/70 p-8 shadow-inner">
      <Card className="border-white/10 bg-black/60 text-slate-100">
        <CardHeader>
          <CardTitle className="text-2xl text-white">Chain viewer</CardTitle>
          {run ? (
            <p className="text-sm text-slate-300">
              Last run from {run.source === 'playground' ? 'Playground' : 'Composer'} · Tokens {run.tokens} · Runtime {run.runtimeSeconds.toFixed(1)}s
            </p>
          ) : (
            <p className="text-sm text-slate-300">
              Run the playground or composer to populate this view.
            </p>
          )}
        </CardHeader>
        <CardContent>
          {run ? (
            <div className="grid gap-3 md:grid-cols-3">
              {run.steps.map((step, index) => {
                const label = STAGE_TITLES[index] ?? step.stage;
                const delay = Math.min(0.1 * index, 1);
                const content = (
                  <div className="h-full rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-wide text-emerald-300">{label}</p>
                    <p className="mt-2 text-sm text-slate-100">{step.text}</p>
                  </div>
                );
                if (reduceMotion) {
                  return (
                    <div key={step.stage + index} className="h-full">
                      {content}
                    </div>
                  );
                }
                return (
                  <motion.div
                    key={step.stage + index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay }}
                    className="h-full"
                  >
                    {content}
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-slate-200">
              No runs captured yet. Run the playground or composer to see staged cards.
            </div>
          )}
          {run ? (
            <div className="mt-6 rounded-2xl border border-emerald-400/40 bg-emerald-500/10 p-4 text-sm text-emerald-100">
              {run.final}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </section>
  );
}
