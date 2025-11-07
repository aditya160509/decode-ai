"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AnimatedHero } from "@/components/AnimatedHero";
import { AnimatedSection } from "@/components/AnimatedSection";
import { Button } from "@/components/ui/button";
import { FilterBar } from "@/components/resources/FilterBar";
import { ResourceList } from "@/components/resources/ResourceList";
import { TopicSection } from "@/components/projects/TopicSection";
import { FAQSection } from "@/components/faq/FAQSection";
import { useResourcesData } from "@/features/resources/context/ResourcesDataContext";
import type { ResourceFilters } from "@/types/resources";
import { storage } from "@/lib/decodeai-storage";
import { useGlobalSearch } from "@/contexts/global-search";
import { slugify } from "@/lib/slugify";

const DEFAULT_FILTERS: ResourceFilters = {
  topic: null,
  type: [],
  level: [],
  lang: [],
  q: "",
};

const parseFiltersFromParams = (params: URLSearchParams): ResourceFilters => {
  const topic = params.get("topic");
  const type = params.get("type")?.split(",").filter(Boolean) ?? [];
  const level = params.get("level")?.split(",").filter(Boolean) ?? [];
  const langValue = params.get("lang");
  const lang = langValue ? langValue.split(",").filter(Boolean) : [];
  const q = params.get("q") ?? "";
  return {
    topic: topic && topic !== "all" ? topic : null,
    type,
    level,
    lang,
    q,
  };
};

const serializeFiltersToParams = (filters: ResourceFilters) => {
  const params = new URLSearchParams();
  if (filters.topic) params.set("topic", filters.topic);
  if (filters.type.length) params.set("type", filters.type.join(","));
  if (filters.level.length) params.set("level", filters.level.join(","));
  if (filters.lang.length) params.set("lang", filters.lang.join(","));
  if (filters.q) params.set("q", filters.q);
  return params;
};

const matchesQuery = (value: string, query: string) => value.toLowerCase().includes(query.toLowerCase());

export const ResourcesExperience = () => {
  const { loading, error, resources, projectBatches } = useResourcesData();
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState<ResourceFilters>(DEFAULT_FILTERS);
  const [hydrated, setHydrated] = useState(false);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const { openSearch } = useGlobalSearch();

  useEffect(() => {
    if (hydrated) return;
    const paramsFilters = parseFiltersFromParams(searchParams);
    const hasUrlFilters = Object.values(paramsFilters).some((value) =>
      Array.isArray(value) ? value.length > 0 : Boolean(value),
    );
    if (hasUrlFilters) {
      setFilters(paramsFilters);
      setHydrated(true);
      return;
    }
    const stored = storage.getFilters();
    setFilters(stored);
    setHydrated(true);
  }, [hydrated, searchParams]);

  useEffect(() => {
    if (!hydrated) return;
    storage.saveFilters(filters);
    const params = serializeFiltersToParams(filters);
    setSearchParams(params, { replace: true });
  }, [filters, hydrated, setSearchParams]);

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if (event.key !== "/" || event.defaultPrevented) return;
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) {
        return;
      }
      if (searchInputRef.current) {
        event.preventDefault();
        searchInputRef.current.focus();
      }
    };
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  const filteredResources = useMemo(() => {
    return resources.filter((resource) => {
      if (filters.topic && filters.topic !== "all") {
        // topic metadata is not provided for resources yet; allow all when topic filter is set
        // in future, map resources to topics before filtering
      }

      const matchesType = !filters.type.length || filters.type.includes(resource.type);
      const matchesLevel = !filters.level.length || filters.level.includes(resource.level);
      const matchesLanguage = !filters.lang.length || filters.lang.includes(resource.language);
      const matchesText = !filters.q
        || matchesQuery(resource.title, filters.q)
        || matchesQuery(resource.summary, filters.q)
        || matchesQuery(resource.takeaway, filters.q)
        || matchesQuery(resource.author, filters.q);

      return matchesType && matchesLevel && matchesLanguage && matchesText;
    });
  }, [resources, filters]);

  const handleResourceOpen = (slug: string, url: string) => {
    if (typeof window === "undefined") return;
    window.open(url, "_blank", "noopener,noreferrer");
    storage.upsertRecent({ type: "resource", slugOrId: slug, ts: Date.now() });
  };

  const handleProjectClick = (slug: string) => {
    storage.upsertRecent({ type: "project", slugOrId: slug, ts: Date.now() });
  };

  return (
    <div className="relative min-h-screen bg-background text-foreground noise-texture">
      <AnimatedHero className="pb-12 pt-16">
        <section className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center md:text-left">
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
            <span className="gradient-text-animated">Resources, Projects, and Answers</span>
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Search what to learn, pick a project, and open a clear workflow.
          </p>
          <Button className="mt-6" onClick={openSearch}>
            Open Global Search
          </Button>
        </div>
        </section>
      </AnimatedHero>

      <section className="container mx-auto px-4 py-12">
        <div className="mb-8 flex items-baseline justify-between gap-4">
          <h2 className="text-3xl font-semibold">Learning Resources</h2>
        </div>
        <FilterBar
          ref={searchInputRef}
          filters={filters}
          onChange={setFilters}
          onClear={() => setFilters(DEFAULT_FILTERS)}
          typeOptions={Array.from(new Set(resources.map((resource) => resource.type))).sort()}
          levelOptions={Array.from(new Set([...resources.map((resource) => resource.level), "All"]))
            .filter(Boolean)
            .sort()}
          languageOptions={Array.from(new Set(resources.map((resource) => resource.language))).sort()}
          topicOptions={projectBatches.map((batch) => ({ label: batch.name, value: slugify(batch.name) }))}
        />

        {loading && !resources.length && (
          <div className="mt-8 glass-card-subtle p-6 text-center text-sm text-muted-foreground">
            Loading resources…
          </div>
        )}

        {error && !loading && (
          <div className="mt-8 rounded-lg border border-destructive/40 bg-destructive/10 p-6 text-center text-sm text-destructive">
            {error}
          </div>
        )}

        {!loading && !error && (
          <ResourceList resources={filteredResources} onOpenResource={handleResourceOpen} />
        )}
      </section>

      <section className="container mx-auto px-4 pb-12">
        <div className="mb-8">
          <h2 className="text-3xl font-semibold">Project Workflows</h2>
          <p className="mt-2 max-w-3xl text-base text-muted-foreground">
            Browse ready-to-build AI projects grouped by topic. Each card opens a full workflow with data, models, and step-by-step guidance.
          </p>
        </div>
        <div className="space-y-12">
          {projectBatches.map((batch) => (
            <TopicSection
              key={batch.name}
              topicName={batch.name}
              projects={batch.projects}
              summary={batch.summary}
              onOpenProject={handleProjectClick}
            />
          ))}
        </div>
      </section>

      <section className="container mx-auto px-4 pb-16">
        <FAQSection />
      </section>
    </div>
  );
};
