'use client';

import { useEffect, useMemo, useState } from 'react';
import { MemoryEntry, listMemory, clearMemory } from '../../lib/ai/memory';
import { cosine } from '../../lib/ai/textVector';
import rules from '../../data/rules.json';
import { approximateTokens } from '../../lib/ai/tokens';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { cn } from '../../lib/utils';

type MemoryExplorerProps = {
  refreshSignal: number;
  lastPrompt?: string;
  recallMatches?: MemoryEntry[];
  onMemoryChanged?: () => void;
};

const HALF_LIFE = rules.recall_age_half_life_days;
const MODERATE_THRESHOLD = rules.recall_threshold_moderate;

function formatTime(timestamp: number) {
  const date = new Date(timestamp);
  return date.toLocaleString();
}

export function MemoryExplorer({ refreshSignal, lastPrompt, recallMatches, onMemoryChanged }: MemoryExplorerProps) {
  const [search, setSearch] = useState('');
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [entries, setEntries] = useState<MemoryEntry[]>([]);

  useEffect(() => {
    setEntries(listMemory(200));
  }, [refreshSignal]);

  const tags = useMemo(() => {
    const set = new Set<string>();
    entries.forEach((entry) => (entry.tags ?? []).forEach((tag) => set.add(tag)));
    return Array.from(set);
  }, [entries]);

  const filtered = useMemo(() => {
    return entries.filter((entry) => {
      const matchesSearch = search ? entry.text.toLowerCase().includes(search.toLowerCase()) : true;
      const matchesTag = tagFilter ? entry.tags?.includes(tagFilter) : true;
      return matchesSearch && matchesTag;
    });
  }, [entries, search, tagFilter]);

  const recallPreview = useMemo(() => {
    if (!lastPrompt) return [];
    return filtered
      .map((entry) => {
        const similarity = cosine(lastPrompt, entry.text);
        const ageDays = (Date.now() - entry.timestamp) / (1000 * 60 * 60 * 24);
        const ageFactor = Math.max(0, 1 - Math.min(0.5, ageDays / HALF_LIFE));
        const weighted = similarity * ageFactor;
        return { entry, weighted, similarity, ageDays };
      })
      .filter((item) => item.weighted >= MODERATE_THRESHOLD)
      .sort((a, b) => b.weighted - a.weighted)
      .slice(0, 5);
  }, [filtered, lastPrompt]);

  const handleClear = () => {
    const confirmed = window.confirm('Clear all agent memory?');
    if (!confirmed) return;
    clearMemory();
    setEntries([]);
    onMemoryChanged?.();
  };

  return (
    <section className="rounded-3xl border border-white/10 bg-slate-950/70 p-8 shadow-inner">
      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="flex-1 space-y-4">
          <div>
            <h3 className="font-display text-2xl text-white">Memory explorer</h3>
            <p className="text-sm text-slate-300">
              Stored prompts live in localStorage.decodeai.agent.memory so students can see exactly what is being reused.
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search memory text"
              className="border-white/10 bg-black/50 text-slate-100"
            />
            <div className="flex flex-wrap items-center gap-2">
              {tags.length ? (
                tags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setTagFilter((prev) => (prev === tag ? null : tag))}
                    className={cn(
                      'rounded-full border px-3 py-1 text-xs transition-colors',
                      tagFilter === tag
                        ? 'border-emerald-400/60 bg-emerald-500/10 text-emerald-100'
                        : 'border-white/10 bg-white/5 text-slate-200 hover:border-emerald-400/40 hover:text-white'
                    )}
                  >
                    {tag}
                  </button>
                ))
              ) : (
                <span className="text-xs text-slate-400">No tags yet. Add tags when saving memories.</span>
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-slate-300">
            <span>{entries.length} item{entries.length === 1 ? '' : 's'} stored</span>
            <Button variant="outline" size="sm" className="border-red-400/50 text-red-200 hover:bg-red-500/10" onClick={handleClear}>
              Clear memory
            </Button>
          </div>
          {recallPreview.length ? (
            <div className="rounded-2xl border border-emerald-400/40 bg-emerald-500/10 p-4 text-xs text-emerald-100">
              Potential recall matches for the last prompt:
              <ul className="mt-2 space-y-2">
                {recallPreview.map(({ entry, weighted, similarity }) => (
                  <li key={entry.id}>
                    <p className="font-mono text-[0.7rem] text-emerald-200">
                      score {weighted.toFixed(2)} (sim {similarity.toFixed(2)})
                    </p>
                    <p>{entry.text.slice(0, 120)}{entry.text.length > 120 ? '…' : ''}</p>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {recallMatches && recallMatches.length ? (
            <div className="rounded-2xl border border-emerald-400/40 bg-emerald-500/10 p-4 text-xs text-emerald-100">
              Last run recalled {recallMatches.length} memory item{recallMatches.length > 1 ? 's' : ''}, adding approximately {Math.round(recallMatches.reduce((sum, entry) => sum + approximateTokens(entry.text.slice(0, 160)) * 0.6, 0))} tokens.
            </div>
          ) : null}
        </div>

        <div className="flex-1 rounded-3xl border border-white/10 bg-black/60 p-4">
          {filtered.length ? (
            <ScrollArea className="h-80 pr-3">
              <div className="space-y-4 text-sm text-slate-100">
                {filtered.map((entry) => (
                  <div key={entry.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-300">
                      <span>Source {entry.source}</span>
                      <span>{formatTime(entry.timestamp)}</span>
                    </div>
                    <p className="mt-2 text-sm text-slate-100">{entry.text}</p>
                    {entry.tags?.length ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {entry.tags.map((tag) => (
                          <Badge key={tag} variant="outline" className="border-emerald-400/40 text-emerald-200">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="h-80 rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-slate-200">
              No memory entries match the current filters. Run the playground with memory enabled to save entries.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
