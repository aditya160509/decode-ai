import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import helpData from './data/git_help.json';

const HELP_SECTIONS = helpData as Record<string, { cmd: string; desc: string }[]>;

interface HelpSheetProps {
  open: boolean;
  onClose: () => void;
}

const HelpSheet = ({ open, onClose }: HelpSheetProps) => (
  <Dialog open={open} onOpenChange={(value) => (!value ? onClose() : undefined)}>
    <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-xl">
      <DialogHeader>
        <DialogTitle className="text-lg font-semibold text-foreground">Git Playground Help</DialogTitle>
      </DialogHeader>
      <div className="space-y-4 text-sm text-muted-foreground">
        {Object.entries(HELP_SECTIONS).map(([section, items]) => (
          <section key={section} className="space-y-2">
            <h3 className="font-semibold text-primary">{section}</h3>
            <ul className="space-y-1">
              {items.map((item) => (
                <li key={`${section}-${item.cmd}`} className="flex items-start justify-between gap-3 rounded-md border border-border/30 bg-background/60 p-2">
                  <span className="font-mono text-xs text-foreground">{item.cmd}</span>
                  <span className="text-xs">{item.desc}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </DialogContent>
  </Dialog>
);

export default HelpSheet;
