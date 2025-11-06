import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { CheckCircle2, Circle, HelpCircle, Lightbulb, Play, RotateCcw, Undo2 } from 'lucide-react';
import type { Scenario } from './types';
import HelpSheet from './HelpSheet';
import { cn } from '@/lib/utils';

interface ScenarioPanelLiteProps {
  scenarios: Scenario[];
  activeScenarioId: string;
  onSelectScenario: (id: string) => void;
  onRunSolution: () => void;
  onReset: () => void;
  onRewind: () => void;
  runningSolution: boolean;
  guidedMode: boolean;
  onToggleGuidedMode: (value: boolean) => void;
  currentStepTitle?: string;
  objectives: string[];
  completedObjectives: boolean[];
  hints: string[];
  hintIndex: number;
  onCycleHint: () => void;
  hasHistory: boolean;
  isSandbox: boolean;
  goal: string;
  className?: string;
}

export const ScenarioPanelLite = ({
  scenarios,
  activeScenarioId,
  onSelectScenario,
  onRunSolution,
  onReset,
  onRewind,
  runningSolution,
  guidedMode,
  onToggleGuidedMode,
  currentStepTitle,
  objectives,
  completedObjectives,
  hints,
  hintIndex,
  onCycleHint,
  hasHistory,
  isSandbox,
  goal,
  className,
}: ScenarioPanelLiteProps) => {
  const [helpOpen, setHelpOpen] = useState(false);

  const activeScenario = useMemo(
    () => scenarios.find((scenario) => scenario.id === activeScenarioId),
    [activeScenarioId, scenarios]
  );

  const hintText =
    hints.length > 0 ? hints[Math.abs(hintIndex) % hints.length] : 'No hints available right now.';

  if (!activeScenario) {
    return (
      <Card className="glass-card glass-hover h-full p-4 text-sm text-muted-foreground">
        No scenario selected.
      </Card>
    );
  }

  return (
    <Card className={cn('glass-card glass-hover flex h-full flex-col gap-4 p-4', className)}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display text-xl text-primary">Practice Scenarios</h3>
          <p className="text-xs text-muted-foreground">Switch simulations without losing context.</p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => setHelpOpen(true)}
          aria-label="Open Git help sheet"
        >
          <HelpCircle className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {scenarios.map((scenario) => (
          <Badge
            key={scenario.id}
            variant={scenario.id === activeScenarioId ? 'default' : 'outline'}
            className="cursor-pointer px-3 py-1 text-sm"
            onClick={() => {
              if (runningSolution || scenario.id === activeScenarioId) return;
              onSelectScenario(scenario.id);
            }}
          >
            {scenario.title}
          </Badge>
        ))}
      </div>

      <section className="space-y-2">
        <h4 className="font-semibold text-lg text-foreground">{activeScenario.title}</h4>
        <p className="text-sm text-muted-foreground leading-relaxed">{goal}</p>
      </section>

      {!isSandbox && (
        <>
          <div className="flex items-center justify-between rounded-md border border-border/30 bg-background/60 p-3 text-sm">
            <div>
              <p className="font-medium text-foreground">Guided Mode</p>
              <p className="text-xs text-muted-foreground">
                Follow the scenario step-by-step. Only the next expected command counts.
              </p>
            </div>
            <Switch checked={guidedMode} onCheckedChange={onToggleGuidedMode} />
          </div>
          {guidedMode && currentStepTitle && (
            <div className="rounded-md border border-primary/40 bg-primary/10 p-3 text-sm text-primary">
              Current step: <span className="font-medium">{currentStepTitle}</span>
            </div>
          )}
        </>
      )}

      {!isSandbox && objectives.length > 0 && (
        <section className="space-y-3">
          <h5 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Objectives
          </h5>
          <ol className="space-y-2 text-sm">
            {objectives.map((objective, index) => {
              const complete = completedObjectives[index];
              return (
                <li key={objective} className="flex items-start gap-2">
                  {complete ? (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-success" />
                  ) : (
                    <Circle className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  )}
                  <span className={complete ? 'text-success' : 'text-muted-foreground'}>{objective}</span>
                </li>
              );
            })}
          </ol>
        </section>
      )}

      {hints.length > 0 && (
        <section className="space-y-2 rounded-md border border-border/40 bg-background/60 p-3">
          <div className="flex items-center gap-2 text-sm font-medium text-primary">
            <Lightbulb className="h-4 w-4" />
            Hint
          </div>
          <p className="min-h-[3rem] text-sm text-muted-foreground">{hintText}</p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onCycleHint}
            disabled={runningSolution || hints.length <= 1}
          >
            Next hint
          </Button>
        </section>
      )}

      <div className="mt-auto flex flex-wrap gap-2">
        {!isSandbox && (
          <Button
            type="button"
            size="sm"
            className="gap-2"
            onClick={onRunSolution}
            disabled={runningSolution || activeScenario.solution.length === 0}
          >
            <Play className="h-4 w-4" />
            {runningSolution ? 'Running…' : 'Run solution'}
          </Button>
        )}
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="gap-2"
          onClick={onReset}
          disabled={runningSolution}
        >
          <RotateCcw className="h-4 w-4" />
          Reset
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="gap-2"
          onClick={onRewind}
          disabled={runningSolution || !hasHistory}
        >
          <Undo2 className="h-4 w-4" />
          Rewind
        </Button>
      </div>

      <HelpSheet open={helpOpen} onClose={() => setHelpOpen(false)} />
    </Card>
  );
};

export default ScenarioPanelLite;
