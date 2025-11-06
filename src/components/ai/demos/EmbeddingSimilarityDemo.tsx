import { useEffect, useMemo, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cosineSimilarity, similarityLabel } from "@/lib/ai/textVector";
import type { DemoCompletionProps } from "./types";
import { ResponsiveContainer, RadialBar, RadialBarChart, PolarAngleAxis } from "recharts";

const clampScore = (score: number) => Math.max(0, Math.min(1, score));

export const EmbeddingSimilarityDemo = ({ onComplete, completed }: DemoCompletionProps) => {
  const [textA, setTextA] = useState("");
  const [textB, setTextB] = useState("");
  const [score, setScore] = useState(0);
  const [label, setLabel] = useState("Waiting for inputs");

  const chartData = useMemo(
    () => [
      {
        name: "Similarity",
        value: clampScore(score) * 100,
        fill: "hsl(var(--primary))",
      },
    ],
    [score],
  );

  const handleCompare = () => {
    const similarity = cosineSimilarity(textA, textB);
    setScore(similarity);
    setLabel(similarityLabel(similarity));
    if (!completed) {
      onComplete?.();
    }
  };

  useEffect(() => {
    if (!textA && !textB) {
      setScore(0);
      setLabel("Waiting for inputs");
    }
  }, [textA, textB]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="embed-a">Text A</Label>
          <Textarea
            id="embed-a"
            value={textA}
            onChange={(event) => setTextA(event.target.value)}
            placeholder="Paste the first passage..."
            className="min-h-[120px]"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="embed-b">Text B</Label>
          <Textarea
            id="embed-b"
            value={textB}
            onChange={(event) => setTextB(event.target.value)}
            placeholder="Paste the second passage..."
            className="min-h-[120px]"
          />
        </div>
      </div>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
        <Button onClick={handleCompare} className="w-full lg:w-auto" aria-label="Compare similarity">
          Compare
        </Button>
        <p className="text-xs text-muted-foreground" aria-live="polite">
          Educational approximation: bag-of-words term frequency vectors + cosine similarity (no neural embeddings).
        </p>
      </div>
      <Card>
        <CardContent className="flex flex-col items-center justify-between gap-4 py-6 lg:flex-row">
          <div className="h-40 w-40" role="img" aria-label={`Similarity score ${Math.round(score * 100)} percent`}>
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart innerRadius="60%" outerRadius="100%" barSize={18} data={chartData} startAngle={180} endAngle={0}>
                <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                <RadialBar background cornerRadius={16} dataKey="value" />
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 text-center lg:text-left">
            <p className="text-4xl font-semibold text-primary" aria-live="polite">
              {score.toFixed(3)}
            </p>
            <p className="text-sm font-medium">{label}</p>
            <p className="text-xs text-muted-foreground max-w-xs">
              1.000 means texts are almost identical; 0.000 means no shared vocabulary.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
