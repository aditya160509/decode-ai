export type TokenResult = {
  chars: number;
  approxTokens: number;
  modelLimit: number;
  usedPct: number;
};

type TokenizerModule = {
  encode?: (value: string) => number[];
  default?: {
    encode?: (value: string) => number[];
  };
};

let encodeTokens: ((text: string) => number[]) | null = null;

if (typeof window !== "undefined") {
  try {
    const dynamicImport = new Function("specifier", "return import(specifier);") as (
      specifier: string,
    ) => Promise<TokenizerModule>;
    void dynamicImport("gpt-tokenizer")
      .then((mod: TokenizerModule) => {
        if (mod.encode) {
          encodeTokens = mod.encode;
        } else if (mod.default?.encode) {
          encodeTokens = mod.default.encode;
        }
      })
      .catch(() => {
        encodeTokens = null;
      });
  } catch (error) {
    console.warn("Dynamic import not supported, using heuristic tokens.", error);
  }
}

// One token is about four chars
export function approximateTokens(text: string) {
  const chars = Array.from(text).length;
  return Math.ceil(chars / 4);
}

export function countTokens(items: string[]) {
  return items.reduce((sum, item) => sum + approximateTokens(item), 0);
}

function exactTokenCount(text: string) {
  if (!encodeTokens) return null;
  try {
    return encodeTokens(text).length;
  } catch (error) {
    console.warn("gpt-tokenizer failed, falling back to heuristic", error);
    return null;
  }
}

export function countTokensDetailed(text: string, modelLimit = 8000): TokenResult {
  const exact = exactTokenCount(text);
  const tokens = typeof exact === "number" ? exact : approximateTokens(text);
  const usedPct = Math.min(100, Math.round((tokens / modelLimit) * 100));
  return {
    chars: text.length,
    approxTokens: tokens,
    modelLimit,
    usedPct,
  };
}
