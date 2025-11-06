import { useEffect, useMemo, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { contextSlice } from "@/lib/ai/context";
import type { DemoCompletionProps } from "./types";

const MODEL_OPTIONS = [
  { label: "4K tokens", value: 4000 },
  { label: "8K tokens", value: 8000 },
  { label: "32K tokens", value: 32000 },
  { label: "128K tokens", value: 128000 },
  { label: "200K tokens", value: 200000 },
  { label: "1M tokens", value: 1000000 },
];

export const ContextWindowDemo = ({ onComplete, completed }: DemoCompletionProps) => {
  const [text, setText] = useState("");
  const [modelLimit, setModelLimit] = useState(8000);

  const slice = useMemo(() => contextSlice(text, modelLimit), [text, modelLimit]);

  useEffect(() => {
    if (!completed && text.trim().length > 0) {
      onComplete?.();
    }
  }, [completed, onComplete, text]);

  const fitsText = text.slice(0, slice.fitsChars);
  const overflowText = text.slice(slice.fitsChars);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="context-input">Paste the text you plan to send</Label>
        <Textarea
          id="context-input"
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Paste long context here to see what fits..."
          className="min-h-[140px]"
        />
      </div>
      <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
        <div className="space-y-2">
          <Label htmlFor="context-limit">Model context window</Label>
          <Select value={String(modelLimit)} onValueChange={(value) => setModelLimit(Number(value))}>
            <SelectTrigger id="context-limit" aria-label="Context window limit">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              {MODEL_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={String(option.value)}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Educational approximation: assumes ~4 characters per token to map context windows to text length.
          </p>
        </div>
        <div className="rounded-lg border bg-muted/40 p-4">
          <p className="text-sm font-medium" aria-live="polite">
            Fits {slice.fitsPct}% of your text for this model (
            {slice.fitsChars.toLocaleString()} of {slice.totalChars.toLocaleString()} characters)
          </p>
          <div className="mt-4 whitespace-pre-wrap rounded-md border bg-background p-4 text-sm">
            <span className="bg-primary/10 text-primary">
              {fitsText.length > 0 ? fitsText : "Enter text to visualize context fit."}
            </span>
            <span className="bg-destructive/10 text-muted-foreground">{overflowText}</span>
          </div>
          {slice.overflow ? (
            <p className="mt-3 text-sm text-destructive" role="status">
              Overflow! Everything in red would be truncated. Try a larger window or shorter prompt.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
};
