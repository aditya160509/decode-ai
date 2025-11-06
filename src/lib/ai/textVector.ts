export function tokenize(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter(Boolean);
}

export function tf(tokens: string[]) {
  const m: Record<string, number> = {};
  for (const t of tokens) m[t] = (m[t] || 0) + 1;
  return m;
}

export function dot(a: Record<string, number>, b: Record<string, number>) {
  let s = 0;
  for (const k in a) if (Object.prototype.hasOwnProperty.call(a, k) && b[k]) s += a[k] * b[k];
  return s;
}

export function magnitude(v: Record<string, number>) {
  let s = 0;
  for (const k in v) s += v[k] * v[k];
  return Math.sqrt(s);
}

export function cosine(aText: string, bText: string) {
  const A = tf(tokenize(aText));
  const B = tf(tokenize(bText));
  const d = dot(A, B);
  const mag = magnitude(A) * magnitude(B);
  return mag === 0 ? 0 : d / mag;
}

export function cosineSimilarity(s1: string, s2: string) {
  return Number(cosine(s1, s2).toFixed(3));
}

export function similarityLabel(score: number) {
  if (score >= 0.75) return "High similarity";
  if (score >= 0.4) return "Medium similarity";
  return "Low similarity";
}
