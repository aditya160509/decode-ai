'use client';

import sections from '../../data/sections.json';
import { usePrefersReducedMotion } from '../../hooks/use-prefers-reduced-motion';
import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';

const LOOP = ['Think', 'Act', 'Observe', 'Reflect'] as const;

export function WhatAreAgents() {
  const reduceMotion = usePrefersReducedMotion();
  const [active, setActive] = useState(0);

  const copy = useMemo(() => sections.sections.find((s) => s.slug === 'what_are_agents'), []);

  useEffect(() => {
    if (reduceMotion) return;
    const id = window.setInterval(() => {
      setActive((prev) => (prev + 1) % LOOP.length);
    }, 2000);
    return () => window.clearInterval(id);
  }, [reduceMotion]);

  return (
    <section className="grid gap-8 rounded-3xl border border-white/10 bg-slate-950/70 p-8 shadow-inner lg:grid-cols-[1.15fr_1fr]">
      <div className="space-y-4">
        <h2 className="font-display text-3xl text-white">{copy?.title ?? 'What are AI agents'}</h2>
        <p className="max-w-2xl text-base leading-relaxed text-slate-200">
          {copy?.body}
        </p>
      </div>
      <div className="grid gap-3">
        {LOOP.map((label, index) => {
          const isActive = active === index;
          const content = (
            <div className="flex w-full items-center justify-between">
              <span className="text-lg font-semibold">{label}</span>
              <span className="text-xs uppercase tracking-wide text-slate-300">
                Step {index + 1}
              </span>
            </div>
          );

          if (reduceMotion) {
            return (
              <button
                key={label}
                type="button"
                onClick={() => setActive(index)}
                aria-pressed={isActive}
                className={`rounded-2xl border p-4 text-left transition-colors ${
                  isActive
                    ? 'border-emerald-400/60 bg-emerald-500/10 text-white'
                    : 'border-white/10 bg-white/5 text-slate-200 hover:border-emerald-300/40 hover:text-white'
                }`}
              >
                {content}
              </button>
            );
          }

          return (
            <motion.button
              key={label}
              type="button"
              aria-pressed={isActive}
              onClick={() => setActive(index)}
              className="rounded-2xl border p-4 text-left"
              whileHover={{ scale: 1.01 }}
              animate={isActive ? { borderColor: 'rgba(16, 185, 129, 0.6)', backgroundColor: 'rgba(16, 185, 129, 0.15)' } : { borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.05)' }}
              transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            >
              {content}
            </motion.button>
          );
        })}
      </div>
    </section>
  );
}
