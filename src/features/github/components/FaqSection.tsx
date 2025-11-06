import { useMemo, useState } from 'react';
import type { FAQ } from '@/types/github';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search } from 'lucide-react';

interface FaqSectionProps {
  faqs: FAQ[];
}

export const FaqSection = ({ faqs }: FaqSectionProps) => {
  const [search, setSearch] = useState('');
  const [tag, setTag] = useState<string>('All');

  const tags = useMemo(
    () => ['All', ...Array.from(new Set(faqs.flatMap((faq) => faq.tags)))],
    [faqs]
  );

  const filtered = faqs.filter((faq) => {
    const matchesTag = tag === 'All' || faq.tags.includes(tag);
    const matchesSearch = faq.q.toLowerCase().includes(search.toLowerCase()) ||
      faq.cli.some((cmd) => cmd.toLowerCase().includes(search.toLowerCase()));
    return matchesTag && matchesSearch;
  });

  return (
    <section id="faqs" className="scroll-mt-28 space-y-6">
      <header className="space-y-2">
        <h2 className="font-display text-3xl font-semibold">FAQs</h2>
        <p className="text-muted-foreground">Quick fixes with CLI steps, GUI steps, and tagged references for each common issue.</p>
      </header>
      <div className="glass-card p-4 space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search questions or commands..."
              aria-label="Search FAQs"
              className="pl-10"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {tags.map((value) => (
              <Button
                key={value}
                type="button"
                size="sm"
                variant={tag === value ? 'default' : 'ghost'}
                onClick={() => setTag(value)}
              >
                {value}
              </Button>
            ))}
          </div>
        </div>
        <Accordion type="single" collapsible className="space-y-3">
          {filtered.map((faq) => (
            <AccordionItem key={faq.q} value={faq.q} className="glass-card glass-hover border border-border/40 px-4">
              <AccordionTrigger className="font-display text-left text-lg">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="space-y-3 text-sm text-muted-foreground">
                <div>
                  <p className="font-semibold text-foreground mb-1">CLI Steps</p>
                  <ol className="list-decimal list-inside space-y-1 font-mono text-xs bg-muted/20 p-3 rounded-md">
                    {faq.cli.map((cmd) => (
                      <li key={cmd}>{cmd}</li>
                    ))}
                  </ol>
                </div>
                <div>
                  <p className="font-semibold text-foreground mb-1">GUI Steps</p>
                  <p>{faq.gui}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {faq.tags.map((tagValue) => (
                    <Badge key={tagValue} variant="outline" className="bg-primary/10 text-primary">{tagValue}</Badge>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
          {filtered.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-10">No FAQs match your filters.</p>
          )}
        </Accordion>
      </div>
    </section>
  );
};
