import { useMemo, useState } from 'react';
import type { CommandBlock } from '@/types/github';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { toast } from 'sonner';
import { Copy, Check, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CommandCatalogProps {
  commands: CommandBlock[];
}

const badgeColor: Record<CommandBlock['badge'], string> = {
  Beginner: 'bg-emerald-500/20 text-emerald-300',
  Common: 'bg-sky-500/20 text-sky-300',
  Safety: 'bg-amber-500/20 text-amber-300',
  Advanced: 'bg-fuchsia-500/20 text-fuchsia-300',
};

export const CommandCatalog = ({ commands }: CommandCatalogProps) => {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string>('All');
  const [copying, setCopying] = useState<string | null>(null);

  const categories = useMemo(() => ['All', ...Array.from(new Set(commands.map((c) => c.category)))], [commands]);

  const filtered = commands.filter((cmd) => {
    const matchesCategory = category === 'All' || cmd.category === category;
    const matchesQuery = cmd.command.toLowerCase().includes(query.toLowerCase()) || cmd.description.toLowerCase().includes(query.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  const handleCopy = async (command: string) => {
    try {
      await navigator.clipboard.writeText(command);
      setCopying(command);
      toast.success(`Copied "${command}"`);
      setTimeout(() => setCopying((prev) => (prev === command ? null : prev)), 1500);
    } catch {
      toast.error('Unable to copy command');
    }
  };

  return (
    <section id="commands" className="scroll-mt-28 space-y-6">
      <header className="space-y-2">
        <h2 className="font-display text-3xl font-semibold">Commands</h2>
        <p className="text-muted-foreground">Copy, run, and understand the most used Git commands with sample outputs.</p>
      </header>
      <div className="glass-card p-4 space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative flex-1">
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search commands or descriptions..."
              aria-label="Search Git commands"
              className="bg-background/80"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" aria-hidden />
            {categories.map((cat) => (
              <Button
                key={cat}
                type="button"
                variant={cat === category ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setCategory(cat)}
              >
                {cat}
              </Button>
            ))}
          </div>
        </div>
        <div className="space-y-3">
          {filtered.map((command) => (
            <article key={command.command} className="glass-card glass-hover p-4 space-y-3">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <code className="font-mono text-primary text-base">{command.command}</code>
                  <p className="text-sm text-muted-foreground mt-1">{command.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={cn('text-xs font-medium', badgeColor[command.badge])}>{command.badge}</Badge>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => handleCopy(command.command)}
                    className="gap-2"
                  >
                    {copying === command.command ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    Copy
                  </Button>
                </div>
              </div>
              {command.example_output && command.example_output.trim().length > 0 && (
                <Collapsible>
                  <CollapsibleTrigger className="text-sm text-primary underline-offset-4 hover:underline">
                    Show example output
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-2">
                    <pre className="overflow-auto rounded-md bg-muted/30 p-3 text-xs text-muted-foreground whitespace-pre-wrap">
                      {command.example_output}
                    </pre>
                  </CollapsibleContent>
                </Collapsible>
              )}
            </article>
          ))}
          {filtered.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-10">No commands match your filters. Try a different keyword or category.</p>
          )}
        </div>
      </div>
    </section>
  );
};
