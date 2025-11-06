import { useEffect } from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, HelpCircle, XCircle } from "lucide-react";
import type { QuizQuestion } from "@/types/ai";
import type { DemoCompletionProps } from "./types";

interface MiniQuizDemoProps extends DemoCompletionProps {
  questions: QuizQuestion[];
  responses: Record<number, string>;
  score: number;
  badge: string | null;
  onSelect: (index: number, option: string) => void;
  onReset: () => void;
}

export const MiniQuizDemo = ({
  questions,
  responses,
  score,
  badge,
  onSelect,
  onReset,
  onComplete,
  completed,
}: MiniQuizDemoProps) => {
  useEffect(() => {
    if (!completed && Object.keys(responses).length === questions.length) {
      onComplete?.();
    }
  }, [completed, onComplete, questions.length, responses]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-medium" aria-live="polite">
            Score: {score}/{questions.length}
          </p>
          <p className="text-xs text-muted-foreground">
            Badges: 6+/10 → AI Explorer, 9+/10 → AI Pro
          </p>
        </div>
        <div className="flex items-center gap-2">
          {badge ? <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">{badge}</span> : null}
          <Button variant="outline" size="sm" onClick={onReset} aria-label="Reset quiz">
            Reset quiz
          </Button>
        </div>
      </div>
      <div className="grid gap-4">
        {questions.map((question, index) => {
          const userAnswer = responses[index];
          const isCorrect = userAnswer ? userAnswer === question.answer : null;
          return (
            <Card key={question.q} className="transition-colors">
              <CardHeader className="space-y-3">
                <CardTitle className="text-base font-semibold">
                  {index + 1}. {question.q}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <RadioGroup
                  value={userAnswer ?? ""}
                  onValueChange={(value) => onSelect(index, value)}
                  aria-label={`Question ${index + 1}`}
                >
                  {question.options.map((option) => (
                    <div key={option} className="relative">
                      <RadioGroupItem id={`quiz-${index}-${option}`} value={option} className="sr-only" />
                      <Label
                        htmlFor={`quiz-${index}-${option}`}
                        className="flex cursor-pointer items-center justify-between gap-4 rounded-lg border p-3 transition-colors hover:bg-accent"
                      >
                        <span className="text-sm font-medium">{option}</span>
                        <span className="text-muted-foreground">
                          {userAnswer ? (
                            option === question.answer ? <CheckCircle2 className="h-5 w-5 text-success" /> : null
                          ) : (
                            <HelpCircle className="h-5 w-5" />
                          )}
                        </span>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
                {isCorrect !== null ? (
                  <div className="flex items-center gap-2 text-sm" role="status" aria-live="polite">
                    {isCorrect ? (
                      <CheckCircle2 className="h-4 w-4 text-success" />
                    ) : (
                      <XCircle className="h-4 w-4 text-destructive" />
                    )}
                    <span>{isCorrect ? "Correct!" : "Not quite."}</span>
                    <span className="text-muted-foreground">{question.why}</span>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
