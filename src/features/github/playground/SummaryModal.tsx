import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface SummaryModalProps {
  open: boolean;
  scenarioTitle: string;
  objectives: string[];
  startedAt: number;
  endedAt: number;
  commandsRun: number;
  hintsUsed: number;
  onClose: () => void;
  onReset: () => void;
}

const formatDuration = (start: number, end: number) => {
  const seconds = Math.max(Math.round((end - start) / 1000), 1);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remSeconds = seconds % 60;
  return remSeconds ? `${minutes}m ${remSeconds}s` : `${minutes}m`;
};

const SummaryModal = ({
  open,
  scenarioTitle,
  objectives,
  startedAt,
  endedAt,
  commandsRun,
  hintsUsed,
  onClose,
  onReset,
}: SummaryModalProps) => {
  const duration = formatDuration(startedAt, endedAt);
  return (
    <Dialog open={open} onOpenChange={(value) => (!value ? onClose() : undefined)}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold text-foreground">
            Scenario complete!
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {scenarioTitle}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3 rounded-md border border-border/30 bg-background/80 p-4 text-sm text-muted-foreground">
            <div>
              <span className="block text-xs uppercase tracking-wide text-primary/80">Elapsed time</span>
              <span className="text-base font-medium text-foreground">{duration}</span>
            </div>
            <div>
              <span className="block text-xs uppercase tracking-wide text-primary/80">Commands run</span>
              <span className="text-base font-medium text-foreground">{commandsRun}</span>
            </div>
            <div>
              <span className="block text-xs uppercase tracking-wide text-primary/80">Hints surfaced</span>
              <span className="text-base font-medium text-foreground">{hintsUsed}</span>
            </div>
            <div>
              <span className="block text-xs uppercase tracking-wide text-primary/80">Completed</span>
              <span className="text-base font-medium text-foreground">{objectives.length} objectives</span>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Objectives reached
            </h4>
            <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
              {objectives.map((objective) => (
                <li key={objective} className="list-disc list-inside">
                  {objective}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Close
          </Button>
          <Button type="button" onClick={onReset}>
            Reset scenario
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SummaryModal;
