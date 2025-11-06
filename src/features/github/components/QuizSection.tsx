import { useEffect, useRef } from 'react';
import type { QuizItem } from '@/types/github';
import { Card } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import confetti from 'canvas-confetti';
import { CheckCircle2, XCircle } from 'lucide-react';

interface QuizSectionProps {
  items: QuizItem[];
  answers: Record<number, string>;
  results: Record<number, boolean>;
  onSelect: (index: number, answer: string) => void;
  onReset: () => void;
  badges: string[];
  score: number;
}

export const QuizSection = ({ items, answers, results, onSelect, onReset, badges, score }: QuizSectionProps) => {
  const confettiFired = useRef(false);

  useEffect(() => {
    if (score === items.length && items.length > 0 && !confettiFired.current) {
      confettiFired.current = true;
      confetti({
        particleCount: 200,
        spread: 70,
        origin: { y: 0.4 },
      });
    }
    if (score !== items.length) {
      confettiFired.current = false;
    }
  }, [score, items.length]);

  return (
    <section id="quiz" className="scroll-mt-28 space-y-6">
      <header className="space-y-2">
        <h2 className="font-display text-3xl font-semibold">Quiz</h2>
        <p className="text-muted-foreground">Answer, get instant feedback, earn badges, and track your score locally.</p>
      </header>
      <div className="glass-card p-4 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="secondary" className="bg-primary/15 text-primary text-sm">Score: {score}/{items.length}</Badge>
          {badges.map((badge) => (
            <Badge key={badge} className="bg-emerald-500/20 text-emerald-300 text-sm font-semibold">{badge}</Badge>
          ))}
          <Button type="button" size="sm" variant="ghost" onClick={onReset}>Reset Quiz</Button>
        </div>
        <div className="space-y-4">
          {items.map((item, index) => {
            const selected = answers[index] ?? '';
            const isCorrect = results[index];
            return (
              <Card key={item.question} className="glass-card glass-hover p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-medium text-foreground">{index + 1}. {item.question}</p>
                  {isCorrect !== undefined && (
                    <span aria-live="polite">
                      {isCorrect ? <CheckCircle2 className="h-5 w-5 text-success" /> : <XCircle className="h-5 w-5 text-warning" />}
                    </span>
                  )}
                </div>
                <RadioGroup
                  value={selected}
                  onValueChange={(value) => onSelect(index, value)}
                  className="space-y-2"
                  aria-label={`Question ${index + 1}`}
                >
                  {item.options.map((option) => (
                    <div key={option} className="flex items-center space-x-2 rounded-md border border-border/40 bg-background/40 p-2">
                      <RadioGroupItem id={`${index}-${option}`} value={option} />
                      <Label htmlFor={`${index}-${option}`} className="text-sm">{option}</Label>
                    </div>
                  ))}
                </RadioGroup>
                {selected && (
                  <p className="text-sm text-muted-foreground" aria-live="polite">
                    {isCorrect ? '✅ Correct! ' : '❌ Not quite. '}
                    {item.explanation}
                  </p>
                )}
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};
