import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { biasDelta } from "@/lib/ai/bias";
import type { DemoCompletionProps } from "./types";

const clamp = (value: number) => Math.max(-10, Math.min(10, value));

export const BiasDemo = ({ onComplete, completed }: DemoCompletionProps) => {
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const [result, setResult] = useState(() => biasDelta("", ""));
  const [hasRun, setHasRun] = useState(false);

  const handleCompare = () => {
    const delta = biasDelta(a, b);
    setResult(delta);
    setHasRun(true);
    if (!completed) {
      onComplete?.();
    }
  };

  const normalized = ((clamp(result.b) - clamp(result.a)) / 20 + 0.5) * 100;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="bias-a">Output A</Label>
          <Textarea
            id="bias-a"
            value={a}
            onChange={(event) => setA(event.target.value)}
            placeholder="Paste the first model response..."
            className="min-h-[120px]"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bias-b">Output B</Label>
          <Textarea
            id="bias-b"
            value={b}
            onChange={(event) => setB(event.target.value)}
            placeholder="Paste the second model response..."
            className="min-h-[120px]"
          />
        </div>
      </div>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
        <Button onClick={handleCompare} className="w-full lg:w-auto" aria-label="Check sentiment delta">
          Check sentiment delta
        </Button>
        <p className="text-xs text-muted-foreground" aria-live="polite">
          Educational approximation: compares simple positive/negative word counts (mini sentiment lexicon).
        </p>
      </div>
      <Card>
        <CardContent className="space-y-4 py-6">
          <div className="grid gap-2 text-sm md:grid-cols-3">
            <div className="rounded-md border bg-muted/40 p-3" aria-live="polite">
              <p className="text-xs text-muted-foreground">Output A score</p>
              <p className="text-xl font-semibold">{result.a}</p>
            </div>
            <div className="rounded-md border bg-muted/40 p-3" aria-live="polite">
              <p className="text-xs text-muted-foreground">Output B score</p>
              <p className="text-xl font-semibold">{result.b}</p>
            </div>
            <div className="rounded-md border bg-muted/40 p-3" aria-live="polite">
              <p className="text-xs text-muted-foreground">Sentiment delta</p>
              <p className="text-xl font-semibold">{result.diff > 0 ? "+" : ""}{result.diff}</p>
            </div>
          </div>
          <div className="space-y-2">
            <Progress value={hasRun ? normalized : 50} aria-label="Relative sentiment" />
            <p className="text-sm font-medium" role="status">
              {result.label}
            </p>
          </div>
        </CardContent>
      </Card>
      <p className="text-xs text-muted-foreground">
        This demo compares tone. It shows how two answers can sound more positive or more negative toward different people or groups.
        Real systems audit this to catch unfair bias.
      </p>
    </div>
  );
};
