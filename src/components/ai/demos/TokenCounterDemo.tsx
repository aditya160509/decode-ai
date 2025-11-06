import { useEffect, useMemo, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { countTokensDetailed } from "@/lib/ai/tokens";
import type { DemoCompletionProps } from "./types";

const MODEL_OPTIONS = [
  { label: "4K tokens", value: 4000 },
  { label: "8K tokens", value: 8000 },
  { label: "32K tokens", value: 32000 },
  { label: "128K tokens", value: 128000 },
  { label: "200K tokens", value: 200000 },
  { label: "1M tokens", value: 1000000 },
];

export const TokenCounterDemo = ({ onComplete, completed }: DemoCompletionProps) => {
  const [text, setText] = useState("");
  const [modelLimit, setModelLimit] = useState(8000);

  const result = useMemo(() => countTokensDetailed(text, modelLimit), [text, modelLimit]);

  useEffect(() => {
    if (!completed && text.trim().length > 0) {
      onComplete?.();
    }
  }, [completed, onComplete, text]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-[1fr_minmax(220px,280px)]">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="token-text">Paste or type text</Label>
            <Textarea
              id="token-text"
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder="Try a prompt, paragraph, or conversation snippet..."
              className="min-h-[140px]"
            />
          </div>
          <p className="text-xs text-muted-foreground" aria-live="polite">
            Educational approximation: uses ~4 characters ≈ 1 token when precise tokenizers are unavailable.
          </p>
        </div>
        <div className="space-y-4 rounded-lg border bg-muted/40 p-4">
          <div className="space-y-2">
            <Label htmlFor="model-limit">Choose a model limit</Label>
            <Select value={String(modelLimit)} onValueChange={(value) => setModelLimit(Number(value))}>
              <SelectTrigger id="model-limit" aria-label="Model context window limit">
                <SelectValue placeholder="Select a limit" />
              </SelectTrigger>
              <SelectContent>
                {MODEL_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={String(option.value)}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Approx tokens</span>
              <span className="font-semibold text-primary">{result.approxTokens}</span>
            </div>
            <Progress value={result.usedPct} aria-label="Token usage" />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{result.chars} characters</span>
              <span>{result.modelLimit.toLocaleString()} token limit</span>
            </div>
            <div aria-live="polite" className="text-sm font-medium text-primary">
              {result.usedPct}% of context window used
            </div>
            {result.approxTokens > result.modelLimit ? (
              <p className="text-sm text-destructive" role="status">
                Input exceeds this context window. Earlier tokens would be truncated.
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};
