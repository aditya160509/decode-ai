import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buildPitchBundle } from "@/lib/ai/creativity";
import type { DemoCompletionProps } from "./types";

export const CreativityDemo = ({ onComplete, completed }: DemoCompletionProps) => {
  const [topic, setTopic] = useState("AI tutor");
  const [temp, setTemp] = useState(0.3);
  const [variants, setVariants] = useState({ low: "", medium: "", high: "" });

  const handleGenerate = () => {
    const bundle = buildPitchBundle(topic, temp);
    setVariants(bundle);
    if (!completed) {
      onComplete?.();
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[minmax(260px,320px)_1fr]">
        <div className="space-y-4 rounded-lg border bg-muted/40 p-4">
          <div className="space-y-2">
            <Label htmlFor="creativity-topic">Topic</Label>
            <Input
              id="creativity-topic"
              value={topic}
              onChange={(event) => setTopic(event.target.value)}
              placeholder="e.g. AI writing coach"
            />
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="creativity-temp">Creativity (temperature)</Label>
              <span className="text-sm font-semibold">{temp.toFixed(2)}</span>
            </div>
            <Slider
              id="creativity-temp"
              value={[temp]}
              min={0}
              max={1}
              step={0.05}
              onValueChange={([value]) => setTemp(value)}
              aria-label="Creativity temperature"
            />
            <p className="text-xs text-muted-foreground">
              Educational approximation: swaps synonyms from curated lists and widens the pool as temperature increases.
            </p>
          </div>
          <Button onClick={handleGenerate} className="w-full" aria-label="Generate creative variants">
            Generate 3 variants
          </Button>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {[
            { label: "Low", value: variants.low },
            { label: "Medium", value: variants.medium },
            { label: "High", value: variants.high },
          ].map((variant) => (
            <Card key={variant.label} className="h-full">
              <CardHeader>
                <CardTitle className="text-base">{variant.label} temp</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground" aria-live="polite">
                {variant.value ? variant.value : "Generate to compare phrasing."}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};
