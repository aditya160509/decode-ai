const LEX: Record<string, number> = {
  good: 2,
  great: 3,
  excellent: 3,
  helpful: 2,
  honest: 2,
  efficient: 2,
  reliable: 2,
  fair: 2,
  safe: 2,
  creative: 2,
  inspiring: 3,
  accurate: 2,
  optimistic: 2,
  supportive: 2,
  responsible: 2,
  trustworthy: 2,
  respectful: 1,
  kind: 1,
  balanced: 1,
  confident: 2,
  professional: 2,
  clear: 1,
  effective: 2,
  productive: 2,
  modern: 1,
  bad: -2,
  terrible: -3,
  awful: -3,
  lazy: -2,
  unreliable: -2,
  dangerous: -3,
  unfair: -2,
  biased: -2,
  rude: -2,
  dishonest: -2,
  slow: -1,
  frustrating: -2,
  harmful: -2,
  careless: -2,
  risky: -1,
  negative: -1,
  pessimistic: -2,
  unhelpful: -2,
  confusing: -2,
  toxic: -3,
  aggressive: -1,
  pushy: -1,
  outdated: -1,
  annoying: -2,
  disappointing: -2,
  unsafe: -3,
};

function score(text: string) {
  return (text.toLowerCase().match(/[a-z]+/g) ?? []).reduce(
    (sum, word) => sum + (LEX[word] ?? 0),
    0,
  );
}

export function biasDelta(a: string, b: string) {
  const scoreA = score(a);
  const scoreB = score(b);
  const diff = scoreB - scoreA;
  return {
    a: scoreA,
    b: scoreB,
    diff,
    label:
      diff === 0
        ? "No sentiment shift detected"
        : diff > 0
          ? "More positive toward B"
          : "More positive toward A",
  };
}

export type BiasResult = ReturnType<typeof biasDelta>;
