"use client";

import { useEffect, useMemo } from "react";
import type { WorkflowProject } from "@/types/workflows";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export type WorkflowTabKey =
  | "overview"
  | "concept"
  | "data"
  | "ai"
  | "workflow"
  | "stack"
  | "ux"
  | "metrics"
  | "timeline"
  | "collaboration"
  | "judging"
  | "notes";

interface WorkflowTabsProps {
  data: WorkflowProject;
  activeTab: WorkflowTabKey;
  onTabChange: (next: WorkflowTabKey) => void;
}

interface TabConfig {
  key: WorkflowTabKey;
  label: string;
  hash: string;
  content: React.ReactNode;
}

const asArray = (value?: string | string[]) => {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
};

const renderList = (items: string[]) => (
  <ul className="space-y-2 pl-5 text-sm text-zinc-200">
    {items.map((item, index) => (
      <li key={`${index}-${item.slice(0, 16)}`} className="list-disc">
        {item}
      </li>
    ))}
  </ul>
);

const renderParagraphs = (items: string[]) => (
  <div className="space-y-3 text-sm text-zinc-200">
    {items.map((item, index) => (
      <p key={`${index}-${item.slice(0, 16)}`}>{item}</p>
    ))}
  </div>
);

const buildTabs = (data: WorkflowProject): TabConfig[] => {
  const tabs: TabConfig[] = [];

  tabs.push({
    key: "overview",
    label: "Overview",
    hash: "overview",
    content: (
      <div className="space-y-3 text-sm text-zinc-200">
        <p>
          <strong className="text-white">Goal:</strong> {data.goal}
        </p>
        <p>
          <strong className="text-white">Why it matters:</strong> {data.why_it_matters}
        </p>
        <p>
          <strong className="text-white">Primary users:</strong> {data.users}
        </p>
      </div>
    ),
  });

  const conceptContent = [
    data.why_it_matters,
    data.goal,
    data.outcome,
  ]
    .filter(Boolean)
    .map((value) => String(value));

  if (conceptContent.length) {
    tabs.push({
      key: "concept",
      label: "Concept & Impact",
      hash: "impact",
      content: renderParagraphs(conceptContent),
    });
  }

  const dataContent = asArray(data.data);
  if (dataContent.length) {
    tabs.push({
      key: "data",
      label: "Data & Sources",
      hash: "data",
      content: renderList(dataContent),
    });
  }

  const aiContent = asArray(data.ai);
  if (aiContent.length) {
    tabs.push({
      key: "ai",
      label: "AI / Models",
      hash: "ai",
      content: renderList(aiContent),
    });
  }

  const workflowContent = asArray(data.workflow);
  if (workflowContent.length) {
    tabs.push({
      key: "workflow",
      label: "Workflow (Step-by-Step)",
      hash: "workflow",
      content: (
        <ol className="space-y-2 pl-5 text-sm text-zinc-200">
          {workflowContent.map((item, index) => (
            <li key={`${index}-${item.slice(0, 16)}`} className="list-decimal">
              {item}
            </li>
          ))}
        </ol>
      ),
    });
  }

  const stackContent = asArray(data.stack);
  if (stackContent.length) {
    tabs.push({
      key: "stack",
      label: "Tech Stack & Architecture",
      hash: "stack",
      content: renderList(stackContent),
    });
  }

  const uxContent = asArray(data.ux_ui);
  if (uxContent.length) {
    tabs.push({
      key: "ux",
      label: "UX & Journey",
      hash: "ux",
      content: renderList(uxContent),
    });
  }

  const metricsContent = asArray(data.metrics_validation);
  if (metricsContent.length) {
    tabs.push({
      key: "metrics",
      label: "Metrics & Validation",
      hash: "metrics",
      content: renderList(metricsContent),
    });
  }

  const timelineContent = asArray(data.timeline_cost);
  if (timelineContent.length) {
    tabs.push({
      key: "timeline",
      label: "Timeline & Cost",
      hash: "timeline",
      content: renderList(timelineContent),
    });
  }

  const collaborationContent = asArray(data.collab);
  if (collaborationContent.length) {
    tabs.push({
      key: "collaboration",
      label: "Collaboration & Distribution",
      hash: "collaboration",
      content: renderList(collaborationContent),
    });
  }

  const judgingContent = asArray(data.judging);
  if (judgingContent.length) {
    tabs.push({
      key: "judging",
      label: "Judging Rubric & Score",
      hash: "judging",
      content: renderList(judgingContent),
    });
  }

  const notesContent = asArray(data.notes);
  if (notesContent.length) {
    tabs.push({
      key: "notes",
      label: "Notes / Changelog",
      hash: "notes",
      content: renderList(notesContent),
    });
  }

  return tabs;
};

export const WorkflowTabs = ({ data, activeTab, onTabChange }: WorkflowTabsProps) => {
  const tabs = useMemo(() => buildTabs(data), [data]);

  const activeExists = tabs.some((tab) => tab.key === activeTab);
  const currentTab = activeExists ? activeTab : tabs[0]?.key ?? "overview";

  useEffect(() => {
    onTabChange(currentTab);
  }, [currentTab, onTabChange]);

  useEffect(() => {
    const listener = () => {
      if (typeof window === "undefined") return;
      const hash = window.location.hash.slice(1);
      const next = tabs.find((tab) => tab.hash === hash);
      if (next && next.key !== currentTab) {
        onTabChange(next.key);
      }
    };
    window.addEventListener("hashchange", listener);
    return () => window.removeEventListener("hashchange", listener);
  }, [tabs, currentTab, onTabChange]);

  const handleTabChange = (value: string) => {
    const tab = tabs.find((item) => item.key === value);
    if (!tab) return;
    onTabChange(tab.key);
    if (typeof window !== "undefined") {
      const href = `${window.location.pathname}#${tab.hash}`;
      window.history.replaceState(null, "", href);
    }
  };

  if (!tabs.length) {
    return <p className="text-sm text-zinc-400">This workflow does not include any content.</p>;
  }

  return (
    <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full space-y-6">
      <TabsList className="flex flex-wrap gap-2 rounded-lg bg-muted p-2">
        {tabs.map((tab) => (
          <TabsTrigger
            key={tab.key}
            value={tab.key}
            className={cn(
              "whitespace-nowrap rounded-md px-3 py-1.5 text-sm",
              "data-[state=active]:bg-background data-[state=active]:shadow"
            )}
            aria-controls={`workflow-panel-${tab.hash}`}
          >
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>

      {tabs.map((tab) => (
        <TabsContent
          key={tab.key}
          value={tab.key}
          id={`workflow-panel-${tab.hash}`}
          role="tabpanel"
          className="focus-visible:outline-none"
        >
          <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
            <div className="space-y-4 text-sm text-muted-foreground">{tab.content}</div>
          </div>
        </TabsContent>
      ))}
    </Tabs>
  );
};
