"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { fetchProjectBatches, fetchResources } from "../api";
import type { ResourceWithMeta } from "@/types/resources";
import type { ProjectBatch, ProjectEntry } from "@/types/projects";

interface ResourcesDataContextValue {
  loading: boolean;
  error?: string;
  resources: ResourceWithMeta[];
  projectBatches: ProjectBatch[];
  projectsMap: Record<string, ProjectEntry>;
  refresh: () => void;
}

const ResourcesDataContext = createContext<ResourcesDataContextValue | undefined>(undefined);

export const ResourcesDataProvider = ({ children }: { children: React.ReactNode }) => {
  const [resources, setResources] = useState<ResourceWithMeta[]>([]);
  const [projectBatches, setProjectBatches] = useState<ProjectBatch[]>([]);
  const [projectsMap, setProjectsMap] = useState<Record<string, ProjectEntry>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>(undefined);
  const [refreshIndex, setRefreshIndex] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(undefined);
      try {
        const [resourceData, projectData] = await Promise.all([fetchResources(), fetchProjectBatches()]);
        if (cancelled) return;
        setResources(resourceData);
        setProjectBatches(projectData);
        const map: Record<string, ProjectEntry> = {};
        projectData.forEach((batch) => {
          batch.projects.forEach((project) => {
            map[project.slug] = project;
          });
        });
        setProjectsMap(map);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Unable to load data.");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [refreshIndex]);

  const value = useMemo<ResourcesDataContextValue>(
    () => ({
      loading,
      error,
      resources,
      projectBatches,
      projectsMap,
      refresh: () => setRefreshIndex((prev) => prev + 1),
    }),
    [loading, error, resources, projectBatches, projectsMap],
  );

  return <ResourcesDataContext.Provider value={value}>{children}</ResourcesDataContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useResourcesData = () => {
  const context = useContext(ResourcesDataContext);
  if (!context) {
    throw new Error("useResourcesData must be used within ResourcesDataProvider");
  }
  return context;
};
