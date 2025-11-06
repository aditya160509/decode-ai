import type { PRFlow } from '@/types/github';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, AlertTriangle } from 'lucide-react';

interface PRWorkflowSectionProps {
  data: PRFlow;
}

const FlowDiagram = () => (
  <svg viewBox="0 0 360 120" className="w-full text-primary/70">
    <defs>
      <marker id="arrowhead" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
        <polygon points="0 0, 6 3, 0 6" className="fill-primary/70" />
      </marker>
    </defs>
    <g className="stroke-primary/60 fill-none" strokeWidth="2">
      <rect x="10" y="20" width="60" height="30" rx="6" className="fill-primary/10" />
      <text x="40" y="40" textAnchor="middle" className="fill-primary text-xs">Fork</text>
      <path d="M70 35 L120 35" markerEnd="url(#arrowhead)" />

      <rect x="120" y="20" width="70" height="30" rx="6" className="fill-primary/10" />
      <text x="155" y="40" textAnchor="middle" className="fill-primary text-xs">Clone</text>
      <path d="M190 35 L240 35" markerEnd="url(#arrowhead)" />

      <rect x="240" y="20" width="90" height="30" rx="6" className="fill-primary/10" />
      <text x="285" y="40" textAnchor="middle" className="fill-primary text-xs">Branch & Commit</text>
      <path d="M285 50 L285 80" markerEnd="url(#arrowhead)" />

      <rect x="240" y="80" width="90" height="30" rx="6" className="fill-primary/10" />
      <text x="285" y="100" textAnchor="middle" className="fill-primary text-xs">Push & PR</text>
      <path d="M190 95 L240 95" markerEnd="url(#arrowhead)" />

      <rect x="120" y="80" width="70" height="30" rx="6" className="fill-primary/10" />
      <text x="155" y="100" textAnchor="middle" className="fill-primary text-xs">Review</text>
      <path d="M70 95 L120 95" markerEnd="url(#arrowhead)" />

      <rect x="10" y="80" width="60" height="30" rx="6" className="fill-primary/10" />
      <text x="40" y="100" textAnchor="middle" className="fill-primary text-xs">Merge</text>
    </g>
  </svg>
);

export const PRWorkflowSection = ({ data }: PRWorkflowSectionProps) => (
  <section id="pr-workflow" className="scroll-mt-28 space-y-6">
    <header className="space-y-2">
      <h2 className="font-display text-3xl font-semibold">PR Workflow</h2>
      <p className="text-muted-foreground">See the pull-request path from branch to merge, plus common mistakes to avoid.</p>
    </header>
    <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
      <Card className="glass-card glass-hover p-6 space-y-5">
        <FlowDiagram />
        <ol className="grid gap-4 md:grid-cols-2">
          {data.steps.map((step, index) => (
            <li key={step} className="rounded-md border border-border/40 p-4 bg-background/40">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Badge variant="secondary" className="bg-primary/15 text-primary">{index + 1}</Badge>
                <span className="font-medium text-foreground">{step}</span>
              </div>
              {index < data.steps.length - 1 && (
                <div className="mt-3 flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                  Next
                  <ArrowRight className="h-3 w-3" />
                </div>
              )}
            </li>
          ))}
        </ol>
      </Card>
      <Card className="glass-card glass-hover p-6 space-y-4">
        <div className="flex items-center gap-2 font-semibold text-warning">
          <AlertTriangle className="h-5 w-5" />
          Common mistakes
        </div>
        <ul className="space-y-3 text-sm text-muted-foreground">
          {data.mistakes.map((mistake) => (
            <li key={mistake} className="flex gap-2">
              <span className="text-warning">•</span>
              <span>{mistake}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  </section>
);
