"use client";

import { storage } from "@/lib/decodeai-storage";
import type { WorkflowProject } from "@/types/workflows";
import { fetchWorkflowDetail } from "./api";

const memoryCache = new Map<string, WorkflowProject>();

export const getCachedWorkflow = (slug: string) => memoryCache.get(slug) ?? storage.getWorkflow(slug);

export const primeWorkflowCache = (slug: string, workflow: WorkflowProject) => {
  memoryCache.set(slug, workflow);
  storage.cacheWorkflow(slug, workflow);
};

export const loadWorkflow = async (slug: string): Promise<WorkflowProject> => {
  const fromMemory = memoryCache.get(slug);
  if (fromMemory) return fromMemory;

  const fromStorage = storage.getWorkflow(slug);
  if (fromStorage) {
    memoryCache.set(slug, fromStorage);
    return fromStorage;
  }

  const data = await fetchWorkflowDetail(slug);
  primeWorkflowCache(slug, data);
  return data;
};
