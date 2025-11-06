"use client";

import type { ResourceFilters } from "@/types/resources";
import type { WorkflowProject } from "@/types/workflows";

export type HomeState = {
  theme: "default" | "matrix";
  consoleHistory: string[];
  engageHistory: Record<string, string[]>;
};

export type RecentEntryType = "resource" | "project";

export type RecentEntry = {
  type: RecentEntryType;
  slugOrId: string;
  ts: number;
};

type AnalyticsBucket = Record<string, number>;

type MetaState = {
  filters: ResourceFilters;
  recent: RecentEntry[];
  analytics: Record<RecentEntryType, AnalyticsBucket>;
  workflows: Record<string, WorkflowProject>;
};

const HOME_KEY = "decodeai.home";
const META_KEY = "decodeai.meta";

const defaultFilters: ResourceFilters = {
  topic: null,
  type: [],
  level: [],
  lang: [],
  q: "",
};

const defaultMeta: MetaState = {
  filters: defaultFilters,
  recent: [],
  analytics: {
    project: {},
    resource: {},
  },
  workflows: {},
};

let metaCache: MetaState | null = null;

const cloneMeta = (state: MetaState): MetaState => JSON.parse(JSON.stringify(state));

function readMeta(): MetaState {
  if (metaCache) return metaCache;
  if (typeof window === "undefined") {
    return cloneMeta(defaultMeta);
  }

  try {
    const raw = window.localStorage.getItem(META_KEY);
    if (!raw) {
      metaCache = cloneMeta(defaultMeta);
      return metaCache;
    }
    const parsed = JSON.parse(raw) as Partial<MetaState>;
    const meta: MetaState = {
      filters: {
        ...defaultFilters,
        ...(parsed.filters ?? defaultFilters),
        type: Array.isArray(parsed.filters?.type) ? [...parsed.filters.type] : [],
        level: Array.isArray(parsed.filters?.level) ? [...parsed.filters.level] : [],
        lang: Array.isArray(parsed.filters?.lang) ? [...parsed.filters.lang] : [],
        q: typeof parsed.filters?.q === "string" ? parsed.filters.q : "",
      },
      recent: Array.isArray(parsed.recent)
        ? parsed.recent
            .map((entry) => ({
              type: entry.type === "project" ? "project" : "resource",
              slugOrId: typeof entry.slugOrId === "string" ? entry.slugOrId : "",
              ts: typeof entry.ts === "number" ? entry.ts : 0,
            }))
            .filter((entry) => entry.slugOrId)
        : [],
      analytics: {
        project: { ...(parsed.analytics?.project ?? {}) },
        resource: { ...(parsed.analytics?.resource ?? {}) },
      },
      workflows: parsed.workflows ?? {},
    };
    metaCache = meta;
    return meta;
  } catch {
    metaCache = cloneMeta(defaultMeta);
    return metaCache;
  }
}

function writeMeta(next: MetaState) {
  metaCache = cloneMeta(next);
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(META_KEY, JSON.stringify(next));
  } catch {
    // ignore storage errors to keep UX smooth
  }
}

const updateMeta = (updater: (state: MetaState) => void) => {
  const current = cloneMeta(readMeta());
  updater(current);
  writeMeta(current);
  return current;
};

const cloneFilters = (filters: ResourceFilters): ResourceFilters => ({
  topic: filters.topic ?? null,
  type: Array.isArray(filters.type) ? [...filters.type] : [],
  level: Array.isArray(filters.level) ? [...filters.level] : [],
  lang: Array.isArray(filters.lang) ? [...filters.lang] : [],
  q: filters.q ?? "",
});

// ----- Home OS storage helpers -----

export function readHome(): HomeState {
  if (typeof window === "undefined") {
    return { theme: "default", consoleHistory: [], engageHistory: {} };
  }

  try {
    const raw = window.localStorage.getItem(HOME_KEY);
    if (!raw) {
      return { theme: "default", consoleHistory: [], engageHistory: {} };
    }
    const parsed = JSON.parse(raw);
    return {
      theme: parsed.theme === "matrix" ? "matrix" : "default",
      consoleHistory: Array.isArray(parsed.consoleHistory)
        ? parsed.consoleHistory.slice(0, 200)
        : [],
      engageHistory: typeof parsed.engageHistory === "object" && parsed.engageHistory
        ? parsed.engageHistory
        : {},
    };
  } catch {
    return { theme: "default", consoleHistory: [], engageHistory: {} };
  }
}

export function writeHome(next: Partial<HomeState>) {
  if (typeof window === "undefined") return;

  try {
    const current = readHome();
    const merged: HomeState = {
      ...current,
      ...next,
      consoleHistory: next.consoleHistory ?? current.consoleHistory,
      engageHistory: next.engageHistory ?? current.engageHistory,
    };
    window.localStorage.setItem(HOME_KEY, JSON.stringify(merged));
  } catch {
    // ignore storage errors
  }
}

export function pushConsole(line: string) {
  const current = readHome();
  const history = [...current.consoleHistory, line].slice(-200);
  writeHome({ consoleHistory: history });
}

export function pushEngage(pack: string, line: string) {
  const current = readHome();
  const bucket = current.engageHistory[pack] || [];
  const next = { ...current.engageHistory, [pack]: [...bucket, line].slice(-100) };
  writeHome({ engageHistory: next });
}

// ----- Shared storage for filters, recents, analytics -----

export const storage = {
  getFilters(): ResourceFilters {
    return cloneFilters(readMeta().filters);
  },

  saveFilters(filters: ResourceFilters) {
    updateMeta((state) => {
      state.filters = cloneFilters(filters);
    });
  },

  getRecent(): RecentEntry[] {
    return [...readMeta().recent].sort((a, b) => b.ts - a.ts).slice(0, 40);
  },

  upsertRecent(entry: RecentEntry) {
    updateMeta((state) => {
      const filtered = state.recent.filter(
        (item) => !(item.type === entry.type && item.slugOrId === entry.slugOrId),
      );
      filtered.unshift({ ...entry });
      state.recent = filtered.slice(0, 40);
    });
  },

  incrementAnalytics(type: RecentEntryType, id: string) {
    updateMeta((state) => {
      const bucket = state.analytics[type] ?? {};
      bucket[id] = (bucket[id] || 0) + 1;
      state.analytics[type] = bucket;
    });
  },

  getAnalytics(type: RecentEntryType): AnalyticsBucket {
    const state = readMeta();
    const bucket = state.analytics[type] ?? {};
    return { ...bucket };
  },

  cacheWorkflow(slug: string, workflow: WorkflowProject) {
    updateMeta((state) => {
      state.workflows[slug] = workflow;
    });
  },

  getWorkflow(slug: string): WorkflowProject | null {
    const stored = readMeta().workflows[slug];
    return stored ? JSON.parse(JSON.stringify(stored)) : null;
  },
};
