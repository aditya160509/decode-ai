export type MemoryEntry = {
  id: string;
  source: "playground" | "composer";
  text: string;
  meta?: unknown;
  timestamp: number;
  tags?: string[];
};

let inMemory: MemoryEntry[] = [];

const STORAGE_KEY = "decodeai.agent.memory";

function readLS(): MemoryEntry[] {
  if (typeof window === "undefined") return inMemory;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as MemoryEntry[]) : [];
  } catch {
    return [];
  }
}

function writeLS(arr: MemoryEntry[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
  } catch {
    // ignore write errors
  }
}

export function addMemory(entry: MemoryEntry) {
  inMemory.push(entry);
  const arr = readLS();
  arr.push(entry);
  writeLS(arr);
}

export function listMemory(limit = 100): MemoryEntry[] {
  const arr = readLS();
  return (arr.length ? arr : inMemory).slice(-limit);
}

export function clearMemory() {
  inMemory = [];
  writeLS([]);
}
