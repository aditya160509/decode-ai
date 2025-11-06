'use client';

import tools from '../../data/agentTools.json';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { useState } from 'react';
import { usePrefersReducedMotion } from '../../hooks/use-prefers-reduced-motion';
import { motion } from 'framer-motion';

type OrbitProps = {
  onLoadTool: (toolId: string) => void;
};

export function Orbit({ onLoadTool }: OrbitProps) {
  const reduceMotion = usePrefersReducedMotion();
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <section id="tools" className="rounded-3xl border border-white/10 bg-slate-950/70 p-8 shadow-inner">
      <div className="space-y-6">
        <div>
          <h3 className="font-display text-2xl text-white">Integrations orbit</h3>
          <p className="text-sm text-slate-300">
            Each node is an offline simulation of a real integration. Click to learn how it helps and load it directly into the composer.
          </p>
        </div>
        <div className="relative mx-auto flex min-h-[360px] max-w-3xl items-center justify-center rounded-full border border-white/10 bg-black/40 p-10">
          {tools.map((tool, index) => {
            const angle = (index / tools.length) * 2 * Math.PI;
            const radius = 120;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            const content = (
              <Dialog open={openId === tool.id} onOpenChange={(open) => setOpenId(open ? tool.id : null)}>
                <DialogTrigger asChild>
                  <button
                    type="button"
                    className="flex h-24 w-24 flex-col items-center justify-center rounded-full border border-emerald-400/40 bg-emerald-500/10 text-center text-xs text-emerald-100 transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                  >
                    <span className="font-semibold">{tool.name}</span>
                    <span className="mt-1 text-[0.65rem] uppercase tracking-wide text-emerald-200">{tool.category}</span>
                  </button>
                </DialogTrigger>
                <DialogContent className="max-w-lg bg-slate-950 text-slate-100">
                  <DialogHeader>
                    <DialogTitle>{tool.name}</DialogTitle>
                    <DialogDescription className="text-slate-300">
                      Type {tool.type} · Ideal use {tool.ideal_use}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-3 text-sm text-slate-200">
                    <p>{tool.description}</p>
                    <p><span className="font-semibold text-emerald-200">Purpose:</span> {tool.purpose}</p>
                    <p><span className="font-semibold text-emerald-200">Strength:</span> {tool.strength}</p>
                    <p><span className="font-semibold text-emerald-200">Limitations:</span> {tool.limitations}</p>
                    <p><span className="font-semibold text-emerald-200">How to connect:</span> {tool.how_to_connect}</p>
                    <p className="rounded-2xl border border-white/10 bg-white/5 p-3 font-mono text-xs text-emerald-100">
                      Sample prompt: {tool.sample_prompt}
                    </p>
                    <Button
                      className="w-full"
                      onClick={() => {
                        onLoadTool(tool.id);
                        setOpenId(null);
                      }}
                    >
                      Load into composer
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            );

            if (reduceMotion) {
              return (
                <div
                  key={tool.id}
                  className="absolute"
                  style={{ transform: `translate(${x}px, ${y}px)` }}
                >
                  {content}
                </div>
              );
            }

            return (
              <motion.div
                key={tool.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1, x, y }}
                transition={{ duration: 0.6, delay: index * 0.05 }}
                className="absolute"
              >
                {content}
              </motion.div>
            );
          })}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex h-32 w-32 flex-col items-center justify-center rounded-full border border-white/10 bg-white/5 text-center">
              <p className="text-sm font-semibold text-white">Agent core</p>
              <p className="text-xs text-slate-300">Plan Observe Reflect Output</p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {tools.map((tool) => (
            <Badge key={tool.id} variant="secondary" className="bg-emerald-500/10 text-emerald-100">
              {tool.name} · {tool.category}
            </Badge>
          ))}
        </div>
      </div>
    </section>
  );
}
