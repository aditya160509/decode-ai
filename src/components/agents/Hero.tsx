'use client';

import { Button } from '../ui/button';
import { usePrefersReducedMotion } from '../../hooks/use-prefers-reduced-motion';
import { motion } from 'framer-motion';
import { ChevronRight, Sparkles } from 'lucide-react';

type HeroProps = {
  onScrollToPlayground: () => void;
  onScrollToTools: () => void;
};

export function Hero({ onScrollToPlayground, onScrollToTools }: HeroProps) {
  const reduceMotion = usePrefersReducedMotion();

  return (
    <section
      className="relative isolate overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-6 py-16 shadow-xl ring-1 ring-white/10 lg:px-12"
      aria-labelledby="agent-hero-heading"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-12 lg:flex-row lg:items-center">
        <div className="flex-1 space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-500/10 px-3 py-1 text-sm text-emerald-200">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            System status ready
          </div>
          <div className="space-y-3">
            <p className="font-display text-sm uppercase tracking-[0.3em] text-emerald-200/70">
              DecodeAI Agent Studio
            </p>
            <h1 id="agent-hero-heading" className="font-display text-4xl font-semibold text-white sm:text-5xl lg:text-6xl">
              Understand how AI agents think plan and act
            </h1>
            <p className="max-w-xl text-base text-slate-200 sm:text-lg">
              This studio teaches the full agent loop through guided experiments that stay fast and offline so students can explore with confidence.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              size="lg"
              onClick={onScrollToPlayground}
              className="group"
            >
              Start in the playground
              <ChevronRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={onScrollToTools}
              className="group border-white/20 bg-transparent text-white hover:border-emerald-400/60 hover:text-emerald-200"
            >
              Explore integrations
              <Sparkles className="ml-2 h-4 w-4 text-emerald-300 transition-all group-hover:rotate-12" />
            </Button>
          </div>
        </div>

        <div className="flex-1">
          <div className="relative h-64 w-full overflow-hidden rounded-3xl border border-white/10 bg-slate-950/70 p-8 shadow-lg">
            {!reduceMotion ? (
              <motion.div
                className="absolute inset-0 flex items-center justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6 }}
              >
                <motion.div
                  layout
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 16, ease: 'linear' }}
                  className="h-48 w-48 rounded-full border border-cyan-400/40 bg-cyan-500/10 backdrop-blur"
                >
                  <motion.div
                    className="m-6 h-36 w-36 rounded-full border border-emerald-300/40 bg-emerald-500/10"
                    animate={{ rotate: -360 }}
                    transition={{ repeat: Infinity, duration: 20, ease: 'linear' }}
                  >
                    <motion.div
                      className="m-8 h-20 w-20 rounded-full border border-white/20 bg-white/10 shadow-inner"
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
                    />
                  </motion.div>
                </motion.div>
              </motion.div>
            ) : (
              <div className="flex h-full items-center justify-center">
                <div className="h-36 w-36 rounded-full border border-cyan-400/40 bg-cyan-400/15 shadow-inner" />
              </div>
            )}
            <div className="relative z-10 mt-40 space-y-2 rounded-2xl border border-white/10 bg-black/60 p-4 text-sm text-slate-200 shadow-md sm:absolute sm:bottom-6 sm:right-6 sm:mt-0">
              <p className="font-medium text-white/90">Agent loop preview</p>
              <ul className="space-y-1 text-xs text-slate-300">
                <li>Think: scope the task</li>
                <li>Act: run a focused step</li>
                <li>Observe: check results</li>
                <li>Reflect: capture the lesson</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
