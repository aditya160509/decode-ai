import { useMemo } from 'react';
import type { Concept } from '@/types/github';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Circle } from 'lucide-react';

interface ConceptSectionProps {
  concepts: Concept[];
  learned: Record<string, boolean>;
  onToggle: (slug: string) => void;
}

export const ConceptSection = ({ concepts, learned, onToggle }: ConceptSectionProps) => {
  const learnedCount = useMemo(() => Object.values(learned).filter(Boolean).length, [learned]);
  const total = concepts.length;
  const percent = total ? (learnedCount / total) * 100 : 0;

  return (
    <section id="concepts" className="scroll-mt-28 space-y-6">
      <header className="space-y-2">
        <h2 className="font-display text-3xl font-semibold text-foreground">Concepts</h2>
        <p className="text-muted-foreground">Short, practical explanations with examples and tips. Mark as learned as you go.</p>
        <div className="glass-card p-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className="text-sm text-muted-foreground">{learnedCount}/{total} learned</div>
          <Progress value={percent} aria-label="Concept progress" />
        </div>
      </header>
      <Accordion type="multiple" className="grid gap-4 md:grid-cols-2">
        {concepts.map((concept) => {
          const slug = concept.title;
          const isLearned = learned[slug];
          return (
            <AccordionItem key={slug} value={slug} className="glass-card border border-border/40">
              <div className="flex items-center justify-between px-6 pt-4">
                <div>
                  <AccordionTrigger className="font-display text-xl text-left hover:text-primary">
                    {concept.title}
                  </AccordionTrigger>
                </div>
                <Button
                  variant={isLearned ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => onToggle(concept.title)}
                  aria-pressed={isLearned}
                  className="gap-2"
                >
                  {isLearned ? <CheckCircle2 className="h-4 w-4 text-success" /> : <Circle className="h-4 w-4" />}
                  {isLearned ? 'Learned' : 'Mark as Learned'}
                </Button>
              </div>
              <AccordionContent className="px-6 pb-4 space-y-3 text-sm leading-relaxed text-muted-foreground">
                <p><strong>Definition:</strong> {concept.definition}</p>
                <p><strong>Example:</strong> {concept.example}</p>
                <p><strong>Tip:</strong> {concept.tip}</p>
                {concept.diagram && (
                  <Badge variant="outline" className="self-start">{concept.diagram}</Badge>
                )}
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </section>
  );
};
