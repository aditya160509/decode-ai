export type ContextSlice = {
  fitsChars: number;
  totalChars: number;
  fitsPct: number;
  overflow: boolean;
};

export function contextSlice(text: string, modelLimitTokens: number): ContextSlice {
  const totalChars = Array.from(text).length;
  const limitChars = modelLimitTokens * 4;
  const fitsChars = Math.min(totalChars, limitChars);
  const denominator = totalChars || 1;
  return {
    fitsChars,
    totalChars,
    fitsPct: Math.round((fitsChars / denominator) * 100),
    overflow: totalChars > limitChars,
  };
}
