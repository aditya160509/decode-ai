import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Trophy, Brain, Terminal } from 'lucide-react';

interface ProgressHudProps {
  conceptPercent: number;
  quizScore: number;
  quizTotal: number;
  scenariosCompleted?: number;
  scenariosTotal?: number;
  onResetAll: () => void;
  className?: string;
}

export const ProgressHud = ({
  conceptPercent,
  quizScore,
  quizTotal,
  scenariosCompleted,
  scenariosTotal,
  onResetAll,
  className,
}: ProgressHudProps) => (
  <div
    className={cn(
      'glass-card glass-hover w-full max-w-xl space-y-4 p-4',
      className
    )}
    aria-live="polite"
  >
    <header className="flex items-center justify-between">
      <h2 className="font-display text-lg font-semibold text-primary">Progress HUD</h2>
      <Button variant="ghost" size="sm" onClick={onResetAll} aria-label="Reset all GitHub Basics progress">
        Reset All
      </Button>
    </header>
    <div className="space-y-3 text-sm">
      <div>
        <div className="mb-1 flex items-center justify-between text-muted-foreground">
          <span className="flex items-center gap-2">
            <Brain className="h-4 w-4" /> Concepts Learned
          </span>
          <span>{Math.round(conceptPercent)}%</span>
        </div>
        <Progress value={conceptPercent} aria-label="Concepts learned progress" />
      </div>
      <div>
        <div className="mb-1 flex items-center justify-between text-muted-foreground">
          <span className="flex items-center gap-2">
            <Trophy className="h-4 w-4" /> Quiz Score
          </span>
          <span>
            {quizScore}/{quizTotal}
          </span>
        </div>
        <Progress value={quizTotal ? (quizScore / quizTotal) * 100 : 0} aria-label="Quiz score progress" />
      </div>
      {typeof scenariosCompleted === 'number' && typeof scenariosTotal === 'number' && (
        <div>
          <div className="mb-1 flex items-center justify-between text-muted-foreground">
            <span className="flex items-center gap-2">
              <Terminal className="h-4 w-4" /> Playground
            </span>
            <span>
              {scenariosCompleted}/{scenariosTotal}
            </span>
          </div>
          <Progress
            value={scenariosTotal ? (scenariosCompleted / scenariosTotal) * 100 : 0}
            aria-label="Playground scenarios completed"
          />
        </div>
      )}
    </div>
  </div>
);
