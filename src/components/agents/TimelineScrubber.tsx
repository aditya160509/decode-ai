'use client';

import modelsData from '../../data/agentModels.json';
import toolsData from '../../data/agentTools.json';
import { usePrefersReducedMotion } from '../../hooks/use-prefers-reduced-motion';
import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

type Step = {
  id: string;
  title: string;
  summary: string;
  modelName: string;
  toolId?: string;
  io: {
    input: string;
    output: string;
    payload: Record<string, unknown>;
  };
};

export function TimelineScrubber() {
  const reduceMotion = usePrefersReducedMotion();
  const modelIndex = useMemo(() => {
    const map = new Map<string, (typeof modelsData)[number]>();
    for (const m of modelsData) map.set(m.model_name, m);
    return map;
  }, []);

  const toolIndex = useMemo(() => {
    const map = new Map<string, (typeof toolsData)[number]>();
    for (const t of toolsData) map.set(t.id, t);
    return map;
  }, []);

  const steps = useMemo<Step[]>(() => {
    return [
      {
        id: 'goal',
        title: 'Goal',
        summary: 'Student writes a clear learning target for the agent.',
        modelName: 'GPT 5 (medium)',
        io: {
          input: 'Research solar incentives for civic lens.',
          output: 'Goal captured with context tags.',
          payload: { goal: 'Research solar incentives for civic lens', priority: 'classroom' }
        }
      },
      {
        id: 'plan',
        title: 'Plan',
        summary: 'Planner model breaks the task into dependable steps.',
        modelName: 'Claude 4.5 Sonnet',
        io: {
          input: 'Goal plus retrieved context',
          output: 'Plan with tool call decisions',
          payload: {
            model: 'Claude 4.5 Sonnet',
            steps: ['Check latest incentives', 'Summarize for students']
          }
        }
      },
      {
        id: 'action',
        title: 'Action',
        summary: 'Agent calls a tool to fetch facts for the plan.',
        modelName: 'Claude 4.5 Sonnet',
        toolId: 'codexgpt',
        io: {
          input: 'Plan step request',
          output: 'Tool observation with code result',
          payload: {
            tool: 'CodexGPT',
            run: {
              language: 'python',
              code: "print('solar credit summary')"
            }
          }
        }
      },
      {
        id: 'observe',
        title: 'Observe',
        summary: 'Agent checks whether the tool result meets the goal.',
        modelName: 'Claude 4.5 Sonnet',
        io: {
          input: 'Tool response text',
          output: 'Observation with confidence rating',
          payload: {
            observation: 'Found three new credits and eligibility rules',
            confidence: 0.82
          }
        }
      },
      {
        id: 'reflect',
        title: 'Reflect',
        summary: 'Agent reflects and prepares the final student facing output.',
        modelName: 'GPT 5 (medium)',
        toolId: 'notion',
        io: {
          input: 'Plan plus observations and memory',
          output: 'Summarized answer with citations',
          payload: {
            reflection: 'Ensure details match class rubric and highlight student action',
            memory: 'Linked to Notion resource index'
          }
        }
      },
      {
        id: 'output',
        title: 'Output',
        summary: 'Agent returns a friendly summary to the student.',
        modelName: 'GPT 5 (fast)',
        io: {
          input: 'Refined narrative',
          output: 'Final lesson ready handout',
          payload: {
            format: 'bullet-summary',
            next_step: 'Suggest class activity'
          }
        }
      }
    ];
  }, []);

  const [activeIndex, setActiveIndex] = useState(0);
  const activeStep = steps[activeIndex];
  const activeModel = modelIndex.get(activeStep.modelName);
  const activeTool = activeStep.toolId ? toolIndex.get(activeStep.toolId) : undefined;

  return (
    <section className="rounded-3xl border border-white/10 bg-slate-950/70 p-8 shadow-inner">
      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="flex-1 space-y-4">
          <h3 className="font-display text-2xl text-white">How agents work</h3>
          <p className="text-sm text-slate-300">
            Scrub through the loop to see how models and tools work together on a single run.
          </p>
          <div
            className="flex flex-wrap gap-2"
            role="tablist"
            aria-label="Agent timeline steps"
          >
            {steps.map((step, index) => (
              <button
                key={step.id}
                type="button"
                role="tab"
                aria-selected={index === activeIndex}
                className={cn(
                  'rounded-full border px-3 py-1 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400',
                  index === activeIndex
                    ? 'border-emerald-400/70 bg-emerald-400/10 text-emerald-100'
                    : 'border-white/10 bg-white/5 text-slate-200 hover:border-emerald-400/40 hover:text-white'
                )}
                onClick={() => setActiveIndex(index)}
              >
                {index + 1}. {step.title}
              </button>
            ))}
          </div>
        </div>
        <div
          className="flex-1 rounded-3xl border border-white/10 bg-black/40 p-6 text-sm text-slate-200 shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === 'ArrowRight') {
              event.preventDefault();
              setActiveIndex((prev) => (prev + 1) % steps.length);
            }
            if (event.key === 'ArrowLeft') {
              event.preventDefault();
              setActiveIndex((prev) => (prev - 1 + steps.length) % steps.length);
            }
          }}
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-emerald-200/70">Step {activeIndex + 1}</p>
              <h4 className="mt-1 text-lg font-semibold text-white">{activeStep.title}</h4>
            </div>
            {activeModel ? (
              <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200">
                Model {activeModel.model_name}
              </div>
            ) : null}
          </div>
          <p className="mt-3 text-base text-slate-100">{activeStep.summary}</p>
          {activeTool ? (
            <div className="mt-4 rounded-2xl border border-emerald-400/40 bg-emerald-500/10 p-3 text-xs text-emerald-100">
              Tool {activeTool.name} helps here: {activeTool.purpose}
            </div>
          ) : null}
          <div className="mt-6 grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-wide text-emerald-200/70">Inputs</p>
              <p className="mt-2 text-sm text-slate-200">{activeStep.io.input}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-wide text-emerald-200/70">Outputs</p>
              <p className="mt-2 text-sm text-slate-200">{activeStep.io.output}</p>
            </div>
          </div>
          <div className="mt-4 rounded-2xl border border-white/10 bg-black/60 p-4 font-mono text-xs leading-relaxed text-emerald-100">
            <p className="mb-2 text-[0.65rem] uppercase tracking-wide text-emerald-200/70">Payload preview</p>
            {!reduceMotion ? (
              <motion.pre
                initial={{ opacity: 0.6, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
{JSON.stringify(activeStep.io.payload, null, 2)}
              </motion.pre>
            ) : (
              <pre>{JSON.stringify(activeStep.io.payload, null, 2)}</pre>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
