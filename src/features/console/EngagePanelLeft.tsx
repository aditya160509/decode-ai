"use client";

import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { pushEngage, readHome } from "@/lib/decodeai-storage";

type TopicKey = "github" | "nocode" | "ai" | "resources";
type TaskKey = "summarize" | "explain" | "steps" | "compare" | "links" | "examples" | "quiz";

type Row = {
  id: string;
  title?: string;
  text: string;
  source: string;
  links?: string[];
  examples?: string[];
  steps?: string[];
};

import githubIntro from "@/data/github_intro.json";
import githubConcepts from "@/data/github_concepts.json";
import githubCommands from "@/data/github_commands.json";
import githubWorkflow from "@/data/github_pr_workflow.json";

import aiIntro from "@/data/ai/intro.json";
import aiEmbeddings from "@/data/ai/embeddings.json";

import nocodeIntro from "@/data/nocode_intro.json";
import nocodeTools from "@/data/nocode_tools.json";
import nocodeShowcases from "@/data/nocode_showcases.json";

import projectsByField from "@/data/projects_by_field.json";
import homeHighlights from "@/data/home_highlights.json";

const toArray = (value: unknown) => (Array.isArray(value) ? value : []);

function safeText(value: unknown): string {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.map((entry) => safeText(entry)).filter(Boolean).join(" ");
  if (value && typeof value === "object") {
    return Object.values(value as Record<string, unknown>)
      .map((entry) => safeText(entry))
      .filter(Boolean)
      .join(" ");
  }
  return "";
}

function rowsGithub(): Row[] {
  const rows: Row[] = [];
  const intro = githubIntro as { intro_text?: string; quick_start?: Array<{ title?: string; url?: string }> };
  if (intro?.intro_text) {
    rows.push({
      id: "github-intro",
      title: "GitHub overview",
      text: intro.intro_text,
      source: "github_intro",
    });
  }
  intro?.quick_start?.forEach((item, index) => {
    if (!item?.url) return;
    rows.push({
      id: `github-quick-${index}`,
      title: item.title ?? "Quick start",
      text: `${item.title ?? "Quick start"}: ${item.url}`,
      source: "github_intro",
      links: [item.url],
    });
  });

  toArray(githubConcepts).forEach((concept: any, index: number) => {
    const definition = safeText(concept?.definition);
    const example = safeText(concept?.example);
    const tip = safeText(concept?.tip);
    const text = [definition, example, tip].filter(Boolean).join(" ");
    if (!text) return;
    rows.push({
      id: `github-concept-${index}`,
      title: concept?.title ?? `Concept ${index + 1}`,
      text,
      source: "github_concepts",
      examples: example ? [example] : undefined,
    });
  });

  toArray(githubCommands).forEach((command: any, index: number) => {
    const title = safeText(command?.command);
    const text = safeText(command?.description);
    const example = safeText(command?.example_output);
    if (!title && !text) return;
    rows.push({
      id: `github-command-${index}`,
      title: title || `Command ${index + 1}`,
      text: text || title,
      source: "github_commands",
      examples: example ? [example] : undefined,
    });
  });

  const workflow = githubWorkflow as { steps?: string[]; mistakes?: string[] };
  toArray(workflow?.steps).forEach((step, index) => {
    if (typeof step !== "string") return;
    rows.push({
      id: `github-workflow-${index}`,
      title: "Pull request workflow",
      text: step,
      source: "github_pr_workflow",
      steps: workflow?.steps,
    });
  });

  toArray(workflow?.mistakes).forEach((item, index) => {
    if (typeof item !== "string") return;
    rows.push({
      id: `github-mistake-${index}`,
      title: "Common pitfall",
      text: item,
      source: "github_pr_workflow",
    });
  });

  return rows;
}

function rowsAI(): Row[] {
  const rows: Row[] = [];
  const intro = aiIntro as Record<string, unknown>;
  toArray(intro?.definitions).forEach((def, index) => {
    const text = safeText(def);
    if (text) {
      rows.push({
        id: `ai-def-${index}`,
        title: "AI definition",
        text,
        source: "ai_intro",
      });
    }
  });
  toArray(intro?.examples).forEach((ex, index) => {
    const text = safeText(ex);
    if (text) {
      rows.push({
        id: `ai-example-${index}`,
        title: "AI example",
        text,
        source: "ai_intro",
        examples: [text],
      });
    }
  });
  if (typeof intro?.quote === "string") {
    rows.push({
      id: "ai-quote",
      title: "Key quote",
      text: intro.quote,
      source: "ai_intro",
    });
  }

  const embed = aiEmbeddings as Record<string, unknown>;
  toArray(embed?.definitions).forEach((value, index) => {
    const text = safeText(value);
    if (text) {
      rows.push({
        id: `ai-embedding-${index}`,
        title: "Embeddings definition",
        text,
        source: "ai_embeddings",
      });
    }
  });

  if (embed?.word_pairs && typeof embed.word_pairs === "object") {
    Object.entries(embed.word_pairs as Record<string, string[]>).forEach(([key, list], idx) => {
      const text = toArray(list).join(", ");
      if (text) {
        rows.push({
          id: `ai-wordpairs-${idx}`,
          title: `${key.replace(/_/g, " ")} pairs`,
          text,
          source: "ai_embeddings",
          examples: toArray(list),
        });
      }
    });
  }

  const useCases = toArray(embed?.use_cases);
  if (useCases.length) {
    rows.push({
      id: "ai-usecases",
      title: "Embedding use cases",
      text: useCases.join(", "),
      source: "ai_embeddings",
      examples: useCases,
    });
  }

  return rows;
}

function rowsNoCode(): Row[] {
  const rows: Row[] = [];
  const intro = nocodeIntro as { intro_text?: string; quick_start?: Array<{ title?: string; url?: string }> };
  if (intro?.intro_text) {
    rows.push({
      id: "nocode-intro",
      title: "No-code overview",
      text: intro.intro_text,
      source: "nocode_intro",
    });
  }
  intro?.quick_start?.forEach((item, index) => {
    if (!item?.url) return;
    rows.push({
      id: `nocode-quick-${index}`,
      title: item.title ?? "Quick start",
      text: `${item.title ?? "Resource"}: ${item.url}`,
      source: "nocode_intro",
      links: [item.url],
    });
  });

  toArray(nocodeTools).forEach((tool: any, index: number) => {
    const title = safeText(tool?.tool);
    const capabilities = tool?.capabilities && typeof tool.capabilities === "object"
      ? Object.entries(tool.capabilities)
          .filter(([_, value]) => Boolean(value))
          .map(([key, value]) => `${key}: ${value}`)
          .join("; ")
      : "";
    const limits = tool?.limits && typeof tool.limits === "object"
      ? Object.entries(tool.limits)
          .map(([key, value]) => `${key}: ${value}`)
          .join("; ")
      : "";
    const text = [capabilities, limits].filter(Boolean).join(" | ");
    rows.push({
      id: `nocode-tool-${index}`,
      title: title || `Tool ${index + 1}`,
      text: text || title || "No-code tool details",
      source: "nocode_tools",
      examples: text ? [text] : undefined,
    });
  });

  toArray(nocodeShowcases).forEach((item: any, index: number) => {
    const text = safeText(item?.description);
    if (!text) return;
    const link = typeof item?.buttonHref === "string" ? item.buttonHref : undefined;
    rows.push({
      id: `nocode-showcase-${index}`,
      title: safeText(item?.title) || `Showcase ${index + 1}`,
      text,
      source: "nocode_showcases",
      links: link ? [link] : undefined,
      examples: toArray(item?.tags).map((tag: any) => safeText(tag)),
    });
  });

  return rows;
}

function rowsResources(): Row[] {
  const rows: Row[] = [];
  if (projectsByField && typeof projectsByField === "object") {
    Object.entries(projectsByField as Record<string, Array<Record<string, unknown>>>).forEach(([topic, list], topicIdx) => {
      list.forEach((entry, index) => {
        const title = safeText(entry?.name);
        const desc = safeText(entry?.desc);
        const difficulty = safeText(entry?.difficulty);
        const tools = Array.isArray(entry?.tools) ? (entry?.tools as string[]).join(", ") : "";
        const textParts = [desc, difficulty ? `Difficulty: ${difficulty}` : "", tools ? `Tools: ${tools}` : ""].filter(Boolean);
        rows.push({
          id: `resources-project-${topicIdx}-${index}`,
          title: `${topic} • ${title}`,
          text: textParts.join(" | "),
          source: "projects_by_field",
          examples: tools ? [tools] : undefined,
        });
      });
    });
  }

  toArray(homeHighlights).forEach((item: any, index: number) => {
    const title = safeText(item?.title);
    const text = safeText(item?.desc);
    if (!title && !text) return;
    rows.push({
      id: `resources-highlight-${index}`,
      title: title || `Highlight ${index + 1}`,
      text: text || title,
      source: "home_highlights",
    });
  });

  return rows;
}

const TOPIC_BUILDERS: Record<TopicKey, () => Row[]> = {
  github: rowsGithub,
  nocode: rowsNoCode,
  ai: rowsAI,
  resources: rowsResources,
};

const sanitize = (input: string) => input.toLowerCase().replace(/[^\w\s]/g, " ").trim();

function lexicalScore(query: string, row: Row) {
  const blob = `${row.title ?? ""} ${row.text}`.toLowerCase();
  if (!query) return 0;
  const words = query.split(/\s+/).filter(Boolean);
  let score = blob.includes(query) ? 2 : 0;
  for (const word of words) {
    if (blob.includes(word)) score += 1;
  }
  return score;
}

function summarizeText(text: string, max = 320) {
  return text.length <= max ? text : `${text.slice(0, max).trimEnd()}...`;
}

function formatSummarize(row: Row) {
  return `${summarizeText(row.text)} [source: ${row.source}]`;
}

function formatExplain(row: Row) {
  const title = row.title ? `${row.title}. ` : "";
  return `${title}${row.text} [source: ${row.source}]`;
}

function formatSteps(row: Row) {
  const steps = row.steps && row.steps.length
    ? row.steps
    : row.text.split(/[\.\n]/).map((part) => part.trim()).filter(Boolean).slice(0, 6);
  if (!steps.length) return `No procedural steps available. [source: ${row.source}]`;
  return `${steps.map((step, index) => `${index + 1}. ${step}`).join("\n")}\n[source: ${row.source}]`;
}

function formatCompare(primary: Row, secondary: Row) {
  const aTitle = primary.title || "Option A";
  const bTitle = secondary.title || "Option B";
  const aIntro = summarizeText(primary.text, 120);
  const bIntro = summarizeText(secondary.text, 120);
  return `Purpose. ${aTitle} focuses on ${aIntro}… vs ${bTitle} which focuses on ${bIntro}…
How to use. Start with ${aTitle} to ground fundamentals, then use ${bTitle} when you need added depth or alternate perspective.
[source: ${primary.source}, ${secondary.source}]`;
}

function formatLinks(row: Row) {
  const links = row.links?.filter(Boolean) ?? [];
  if (!links.length) return `No direct links found for this topic. [source: ${row.source}]`;
  return `${links.slice(0, 3).map((link, index) => `${index + 1}. ${link}`).join("\n")}\n[source: ${row.source}]`;
}

function formatExamples(row: Row) {
  const examples = row.examples?.filter(Boolean) ?? [];
  if (!examples.length) return `No examples available in this entry. [source: ${row.source}]`;
  return `${examples.slice(0, 3).map((example, index) => `Example ${index + 1}\n${example}`).join("\n\n")}\n[source: ${row.source}]`;
}

function formatQuiz(row: Row) {
  const sentences = row.text.split(/[\.\n]/).map((part) => part.trim()).filter(Boolean);
  const stem = row.title || "Quick check";
  const [a, b, c] = [
    sentences[0] || "This topic covers foundational ideas you should review.",
    sentences[1] || "It requires advanced infrastructure before you begin.",
    sentences[2] || "It only works offline for small teams.",
  ];
  return `Q. ${stem}
A. ${a}
B. ${b}
C. ${c}
Answer. A
[source: ${row.source}]`;
}

type EngagePanelProps = {
  onClose: () => void;
  onPackChange?: (value: string) => void;
};

export function EngagePanel({ onClose, onPackChange }: EngagePanelProps) {
  const [topic, setTopic] = useState<TopicKey>("github");
  const [task, setTask] = useState<TaskKey>("summarize");
  const [query, setQuery] = useState("");
  const [answers, setAnswers] = useState<string[]>([]);

  const index = useMemo(() => TOPIC_BUILDERS[topic](), [topic]);

  useEffect(() => {
    onPackChange?.(topic);
    const stored = readHome().engageHistory?.[topic] ?? [];
    setAnswers(stored);
  }, [topic, onPackChange]);

  function addAnswer(output: string) {
    setAnswers((prev) => {
      const next = [...prev, output];
      pushEngage(topic, output);
      return next;
    });
  }

  function handleAsk() {
    const trimmed = query.trim();
    if (!trimmed) return;

    const clean = sanitize(trimmed);
    if (!clean) {
      addAnswer("enter a question to search this topic");
      setQuery("");
      return;
    }

    const scored = index
      .map((row) => ({ row, score: lexicalScore(clean, row) }))
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score);

    if (!scored.length) {
      addAnswer("no relevant data found in this topic");
      setQuery("");
      return;
    }

    const best = scored[0].row;
    const runner = scored.find(({ row }) => row.id !== best.id)?.row ?? best;

    let output: string;
    switch (task) {
      case "summarize":
        output = formatSummarize(best);
        break;
      case "explain":
        output = formatExplain(best);
        break;
      case "steps":
        output = formatSteps(best);
        break;
      case "compare":
        output = formatCompare(best, runner);
        break;
      case "links":
        output = formatLinks(best);
        break;
      case "examples":
        output = formatExamples(best);
        break;
      case "quiz":
        output = formatQuiz(best);
        break;
      default:
        output = formatSummarize(best);
    }

    addAnswer(output);
    setQuery("");
  }

  return (
    <aside className="fixed top-0 left-0 h-full w-full sm:w-[460px] bg-[var(--panel)] border-r border-[var(--border)] shadow-xl z-[60]">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
        <div className="text-sm text-[var(--muted)]">Engage AI</div>
        <button type="button" aria-label="Close Engage AI" onClick={onClose} className="p-2 rounded-md focus-ring">
          <X />
        </button>
      </div>

      <div className="px-4 py-3 space-y-3">
        <div>
          <label className="text-xs text-[var(--muted)]" htmlFor="engage-topic">
            Topic
          </label>
          <select
            id="engage-topic"
            value={topic}
            onChange={(event) => setTopic(event.target.value as TopicKey)}
            className="mt-1 w-full bg-transparent border border-[var(--border)] rounded-md px-2 py-2 focus-ring"
          >
            <option value="github">GitHub</option>
            <option value="nocode">No-Code</option>
            <option value="ai">AI</option>
            <option value="resources">Resources</option>
          </select>
        </div>

        <div>
          <label className="text-xs text-[var(--muted)]" htmlFor="engage-task">
            Task
          </label>
          <select
            id="engage-task"
            value={task}
            onChange={(event) => setTask(event.target.value as TaskKey)}
            className="mt-1 w-full bg-transparent border border-[var(--border)] rounded-md px-2 py-2 focus-ring"
          >
            <option value="summarize">summarize</option>
            <option value="explain">explain</option>
            <option value="steps">steps</option>
            <option value="compare">compare</option>
            <option value="links">links</option>
            <option value="examples">examples</option>
            <option value="quiz">quiz</option>
          </select>
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            handleAsk();
          }}
          className="flex gap-2"
        >
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="flex-1 bg-transparent border border-[var(--border)] rounded px-2 py-2 focus-ring"
            placeholder="type your question here…"
          />
          <button type="submit" className="px-3 py-2 rounded bg-[var(--accent-ai)] text-black font-medium">
            Ask
          </button>
        </form>

        <div className="space-y-2 max-h-[55vh] overflow-auto">
          {answers.length === 0 && (
            <div className="card px-3 py-3 text-sm text-[var(--muted)]">
              No responses yet. Choose a topic, pick a task, and ask your first question.
            </div>
          )}
          {answers.map((answer, index) => (
            <div key={`engage-answer-${index}`} className="card px-3 py-2 text-sm font-mono whitespace-pre-wrap">
              {answer}
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
