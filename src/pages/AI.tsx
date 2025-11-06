import { useCallback, useEffect, useMemo, useRef, useState, lazy, Suspense } from "react";
import { AnimatedHero } from "@/components/AnimatedHero";
import { TiltCard } from "@/components/TiltCard";
import { AnimatedSection } from "@/components/AnimatedSection";
import { useLocation } from "react-router-dom";
import { toast } from "sonner";
import {
  Intro,
  LlmVsMl,
  Tokens as TokensData,
  Embeddings as EmbeddingsData,
  Prompting,
  Customization,
  Inference,
  Strengths,
  Applications as ApplicationsData,
  Ethics as EthicsData,
  GlossaryItem,
  DemoList,
  QuotesStats,
  QuizQuestion,
} from "@/types/ai";
import { LearnCard } from "@/components/ai/LearnCard";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  Circle,
  Copy,
  RefreshCcw,
  Sparkles,
  ArrowRight,
  BarChart3,
  BookOpen,
} from "lucide-react";

const STORAGE_PREFIX = "decodeai.ai";
const STORAGE_KEYS = {
  learned: `${STORAGE_PREFIX}.learned`,
  demos: `${STORAGE_PREFIX}.demos`,
  quiz: `${STORAGE_PREFIX}.quiz`,
};

type SectionId =
  | "intro"
  | "llm-vs-ml"
  | "tokens"
  | "embeddings"
  | "prompts"
  | "customization"
  | "inference"
  | "strengths"
  | "applications"
  | "ethics"
  | "glossary"
  | "demos"
  | "quotes-stats";

type SectionTotals = {
  total: number;
  learned: number;
};

type LearnedState = Record<SectionId, Record<string, boolean>>;
type DemoCompletionState = Record<string, boolean>;

type QuizState = {
  responses: Record<number, string>;
  score: number;
  badge: string | null;
};

type DemosData = DemoList & { quiz: QuizQuestion[] };

type SectionDefinition =
  | {
      id: Exclude<SectionId, "demos" | "quotes-stats">;
      title: string;
      subtitle: string;
      type: "cards";
      importer: () => Promise<unknown>;
      render: (props: SectionRendererProps<unknown>) => JSX.Element;
    }
  | {
      id: "demos";
      title: string;
      subtitle: string;
      type: "demos";
      importer: () => Promise<DemosData>;
    }
  | {
      id: "quotes-stats";
      title: string;
      subtitle: string;
      type: "quotes";
      importer: () => Promise<QuotesStats>;
    };

interface SectionRendererProps<T> {
  sectionId: SectionId;
  data: T | null;
  loading: boolean;
  learned: Record<string, boolean>;
  onToggle: (sectionId: SectionId, slug: string, value: boolean) => void;
  onStats: (sectionId: SectionId, totals: SectionTotals) => void;
}

const SECTION_DEFINITIONS: SectionDefinition[] = [
  {
    id: "intro",
    title: "Intro",
    subtitle: "What AI is, why it matters, and 10 everyday examples.",
    type: "cards",
    importer: () => import("@/data/ai/intro.json").then((mod) => mod.default as Intro),
    render: (props) => <IntroSection {...(props as SectionRendererProps<Intro>)} />,
  },
  {
    id: "llm-vs-ml",
    title: "LLM vs ML",
    subtitle: "How large language models differ from traditional ML.",
    type: "cards",
    importer: () => import("@/data/ai/llm_vs_ml.json").then((mod) => mod.default as LlmVsMl),
    render: (props) => <LlmVsMlSection {...(props as SectionRendererProps<LlmVsMl>)} />,
  },
  {
    id: "tokens",
    title: "Tokens",
    subtitle: "What tokens/context windows mean and why they limit input size.",
    type: "cards",
    importer: () => import("@/data/ai/tokens.json").then((mod) => mod.default as TokensData),
    render: (props) => <TokensSection {...(props as SectionRendererProps<TokensData>)} />,
  },
  {
    id: "embeddings",
    title: "Embeddings",
    subtitle: "Meaning as numbers: measure similarity beyond keywords.",
    type: "cards",
    importer: () => import("@/data/ai/embeddings.json").then((mod) => mod.default as EmbeddingsData),
    render: (props) => <EmbeddingsSection {...(props as SectionRendererProps<EmbeddingsData>)} />,
  },
  {
    id: "prompts",
    title: "Prompting",
    subtitle: "Design inputs that steer models to better answers.",
    type: "cards",
    importer: () => import("@/data/ai/prompting.json").then((mod) => mod.default as Prompting),
    render: (props) => <PromptingSection {...(props as SectionRendererProps<Prompting>)} />,
  },
  {
    id: "customization",
    title: "Customization",
    subtitle: "Prompting, retrieval, or fine-tuning: when to use which.",
    type: "cards",
    importer: () => import("@/data/ai/customization.json").then((mod) => mod.default as Customization),
    render: (props) => <CustomizationSection {...(props as SectionRendererProps<Customization>)} />,
  },
  {
    id: "inference",
    title: "Inference",
    subtitle: "What happens inside the model when it answers you.",
    type: "cards",
    importer: () => import("@/data/ai/inference.json").then((mod) => mod.default as Inference),
    render: (props) => <InferenceSection {...(props as SectionRendererProps<Inference>)} />,
  },
  {
    id: "strengths",
    title: "Strengths",
    subtitle: "Where AI shines and where to be careful.",
    type: "cards",
    importer: () => import("@/data/ai/strengths.json").then((mod) => mod.default as Strengths),
    render: (props) => <StrengthsSection {...(props as SectionRendererProps<Strengths>)} />,
  },
  {
    id: "applications",
    title: "Applications",
    subtitle: "Sectors and practical use cases to copy.",
    type: "cards",
    importer: () => import("@/data/ai/applications.json").then((mod) => mod.default as ApplicationsData),
    render: (props) => <ApplicationsSection {...(props as SectionRendererProps<ApplicationsData>)} />,
  },
  {
    id: "ethics",
    title: "Ethics",
    subtitle: "Bias, privacy, and safety: simple rules that keep projects safe.",
    type: "cards",
    importer: () => import("@/data/ai/ethics.json").then((mod) => mod.default as EthicsData),
    render: (props) => <EthicsSection {...(props as SectionRendererProps<EthicsData>)} />,
  },
  {
    id: "glossary",
    title: "Glossary",
    subtitle: "Short, exam-style definitions with ‘why it matters’.",
    type: "cards",
    importer: () => import("@/data/ai/glossary.json").then((mod) => mod.default as GlossaryItem[]),
    render: (props) => <GlossarySection {...(props as SectionRendererProps<GlossaryItem[]>)} />,
  },
  {
    id: "demos",
    title: "Demos",
    subtitle: "Try tokens, embeddings, context, creativity, bias, and a mini quiz.",
    type: "demos",
    importer: async () => {
      const [listModule, quizModule] = await Promise.all([
        import("@/data/ai/demos.json"),
        import("@/data/ai/quiz.json"),
      ]);
      return { ...(listModule.default as DemoList), quiz: quizModule.default as QuizQuestion[] };
    },
  },
  {
    id: "quotes-stats",
    title: "Quotes & Stats",
    subtitle: "Shareable lines and headline figures for slides.",
    type: "quotes",
    importer: () => import("@/data/ai/quotes_stats.json").then((mod) => mod.default as QuotesStats),
  },
];

const HUD_SECTIONS: Array<{ id: SectionId; label: string }> = [
  { id: "intro", label: "Intro" },
  { id: "prompts", label: "Prompting" },
  { id: "glossary", label: "Glossary" },
];

const dataCache = new Map<SectionId, unknown>();

const TokenCounterLazy = lazy(async () => ({
  default: (await import("@/components/ai/demos/TokenCounterDemo")).TokenCounterDemo,
}));
const EmbeddingLazy = lazy(async () => ({
  default: (await import("@/components/ai/demos/EmbeddingSimilarityDemo")).EmbeddingSimilarityDemo,
}));
const ContextLazy = lazy(async () => ({
  default: (await import("@/components/ai/demos/ContextWindowDemo")).ContextWindowDemo,
}));
const CreativityLazy = lazy(async () => ({
  default: (await import("@/components/ai/demos/CreativityDemo")).CreativityDemo,
}));
const BiasLazy = lazy(async () => ({
  default: (await import("@/components/ai/demos/BiasDemo")).BiasDemo,
}));
const QuizLazy = lazy(async () => ({
  default: (await import("@/components/ai/demos/MiniQuizDemo")).MiniQuizDemo,
}));

const DEFAULT_QUIZ_STATE: QuizState = {
  responses: {},
  score: 0,
  badge: null,
};

const HERO_COPY = "Understand today's AI in one page: simple concepts, real examples, and hands-on demos. No math, no APIs.";

const MODEL_PROGRESS_LABELS: Record<SectionId, string> = {
  intro: "Intro foundations",
  prompts: "Prompting tactics",
  glossary: "Glossary mastery",
  "llm-vs-ml": "LLM vs ML",
  tokens: "Token basics",
  embeddings: "Embeddings",
  customization: "Customization",
  inference: "Inference",
  strengths: "Strengths",
  applications: "Applications",
  ethics: "Ethics",
  demos: "Demos",
  "quotes-stats": "Quotes & stats",
};

const scrollMarginClass = "scroll-mt-24";

const SectionWrapper = ({
  id,
  title,
  subtitle,
  children,
  sectionRef,
}: {
  id: SectionId;
  title: string;
  subtitle: string;
  sectionRef: (el: HTMLElement | null) => void;
  children: React.ReactNode;
}) => (
  <section
    id={id}
    ref={sectionRef}
    data-section-id={id}
    className={cn("space-y-6 border-b border-border pb-16 last:border-b-0", scrollMarginClass)}
  >
    <header className="space-y-2">
      <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
        <BarChart3 className="h-3.5 w-3.5" />
        <span>{title}</span>
      </div>
      <h2 className="text-3xl font-semibold tracking-tight text-foreground">{title}</h2>
      <p className="text-sm text-muted-foreground">{subtitle}</p>
    </header>
    {children}
  </section>
);

const LoadingGrid = ({ count = 3 }: { count?: number }) => (
  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
    {Array.from({ length: count }).map((_, index) => (
      <Skeleton key={index} className="h-40 w-full rounded-lg" />
    ))}
  </div>
);

const List = ({ items }: { items: string[] }) => (
  <ul className="space-y-2 text-sm leading-relaxed text-muted-foreground">
    {items.map((item, index) => (
      <li key={`${index}-${item.slice(0, 16)}`} className="rounded-md border border-border/60 bg-muted/40 p-3">
        {item}
      </li>
    ))}
  </ul>
);

const TwoColumnList = ({
  left,
  right,
  leftLabel,
  rightLabel,
}: {
  left: string[];
  right: string[];
  leftLabel: string;
  rightLabel: string;
}) => (
  <div className="grid gap-4 md:grid-cols-2">
    <div className="space-y-2">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{leftLabel}</p>
      <List items={left} />
    </div>
    <div className="space-y-2">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{rightLabel}</p>
      <List items={right} />
    </div>
  </div>
);

const SectionNotLoaded = () => (
  <div className="rounded-lg border border-dashed border-border/70 bg-muted/30 p-6 text-sm text-muted-foreground">
    Content loads when the section scrolls into view.
  </div>
);

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const AI = () => {
  const location = useLocation();
  const [activeSection, setActiveSection] = useState<SectionId>("intro");
  const [sectionData, setSectionData] = useState<Record<SectionId, unknown>>({});
  const [loadingSections, setLoadingSections] = useState<Record<SectionId, boolean>>({});
  const [learnedState, setLearnedState] = useState<LearnedState>({});
  const [demoCompletion, setDemoCompletion] = useState<DemoCompletionState>({});
  const [quizState, setQuizState] = useState<QuizState>(DEFAULT_QUIZ_STATE);
  const [sectionStats, setSectionStats] = useState<Record<SectionId, SectionTotals>>({});
  const [hydrated, setHydrated] = useState(false);

  const sectionRefs = useRef<Record<SectionId, HTMLElement | null>>({
    intro: null,
    "llm-vs-ml": null,
    tokens: null,
    embeddings: null,
    prompts: null,
    customization: null,
    inference: null,
    strengths: null,
    applications: null,
    ethics: null,
    glossary: null,
    demos: null,
    "quotes-stats": null,
  });
  const visibleSectionsRef = useRef(new Map<SectionId, number>());

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    try {
      const storedLearned = window.localStorage.getItem(STORAGE_KEYS.learned);
      const storedDemos = window.localStorage.getItem(STORAGE_KEYS.demos);
      const storedQuiz = window.localStorage.getItem(STORAGE_KEYS.quiz);
      if (storedLearned) {
        setLearnedState(JSON.parse(storedLearned));
      }
      if (storedDemos) {
        setDemoCompletion(JSON.parse(storedDemos));
      }
      if (storedQuiz) {
        const parsed = JSON.parse(storedQuiz) as QuizState;
        setQuizState({ ...DEFAULT_QUIZ_STATE, ...parsed });
      }
    } catch (error) {
      console.warn("Failed to parse stored state", error);
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated || typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEYS.learned, JSON.stringify(learnedState));
  }, [hydrated, learnedState]);

  useEffect(() => {
    if (!hydrated || typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEYS.demos, JSON.stringify(demoCompletion));
  }, [hydrated, demoCompletion]);

  useEffect(() => {
    if (!hydrated || typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEYS.quiz, JSON.stringify(quizState));
  }, [hydrated, quizState]);

  const loadSection = useCallback(
    async (id: SectionId) => {
      if (dataCache.has(id)) {
        setSectionData((prev) => ({ ...prev, [id]: dataCache.get(id) }));
        return;
      }
      const definition = SECTION_DEFINITIONS.find((section) => section.id === id);
      if (!definition) return;
      setLoadingSections((prev) => ({ ...prev, [id]: true }));
      try {
        const data = await definition.importer();
        dataCache.set(id, data);
        setSectionData((prev) => ({ ...prev, [id]: data }));
      } finally {
        setLoadingSections((prev) => ({ ...prev, [id]: false }));
      }
    },
    [],
  );

  useEffect(() => {
    loadSection("intro");
    loadSection("llm-vs-ml");
    loadSection("tokens");
  }, [loadSection]);

  useEffect(() => {
    const hash = location.hash.replace("#", "") as SectionId;
    if (!hash) return;
    const isValidSection = SECTION_DEFINITIONS.some((definition) => definition.id === hash);
    if (!isValidSection) return;
    loadSection(hash);
    setActiveSection(hash);
    const target = sectionRefs.current[hash];
    if (target) {
      setTimeout(() => {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 150);
    }
  }, [location.hash, loadSection]);

  useEffect(() => {
    const visibleSections = visibleSectionsRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const sectionId = entry.target.getAttribute("data-section-id") as SectionId;
          if (!sectionId) return;
          if (entry.isIntersecting) {
            visibleSections.set(sectionId, entry.intersectionRatio);
            loadSection(sectionId);
          } else {
            visibleSections.delete(sectionId);
          }
        });

        if (visibleSections.size === 0) {
          return;
        }

        const visibilityEntries = [...visibleSections.entries()];
        const [mostVisibleSection] = visibilityEntries.reduce(
          (best, current) => (current[1] > best[1] ? current : best),
          visibilityEntries[0],
        );

        setActiveSection((prev) => (prev === mostVisibleSection ? prev : mostVisibleSection));
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: [0.1, 0.25, 0.5, 0.75, 1] },
    );

    SECTION_DEFINITIONS.forEach((definition) => {
      const el = sectionRefs.current[definition.id];
      if (el) observer.observe(el);
    });

    return () => {
      visibleSections.clear();
      observer.disconnect();
    };
  }, [loadSection]);

  const handleToggleLearned = useCallback((sectionId: SectionId, slug: string, value: boolean) => {
    setLearnedState((prev) => {
      const current = prev[sectionId] ?? {};
      let updatedSection: Record<string, boolean>;
      if (value) {
        updatedSection = { ...current, [slug]: true };
      } else {
        const { [slug]: _removed, ...rest } = current;
        updatedSection = rest;
      }
      const nextState = { ...prev, [sectionId]: updatedSection };
      if (Object.keys(updatedSection).length === 0) {
        delete nextState[sectionId];
      }
      return { ...nextState };
    });
  }, []);

  const handleStatsUpdate = useCallback((sectionId: SectionId, totals: SectionTotals) => {
    setSectionStats((prev) => {
      const previous = prev[sectionId];
      if (previous && previous.total === totals.total && previous.learned === totals.learned) {
        return prev;
      }
      return { ...prev, [sectionId]: totals };
    });
  }, []);

  const handleDemoComplete = useCallback((key: string) => {
    setDemoCompletion((prev) => {
      if (prev[key]) return prev;
      return { ...prev, [key]: true };
    });
  }, []);

  const updateQuizSelection = useCallback(
    (index: number, option: string, questions: QuizQuestion[]) => {
      setQuizState((prev) => {
        const responses = { ...prev.responses, [index]: option };
        const score = questions.reduce((total, question, idx) => (responses[idx] === question.answer ? total + 1 : total), 0);
        let badge: string | null = null;
        if (score >= 9) {
          badge = "AI Pro";
        } else if (score >= 6) {
          badge = "AI Explorer";
        }
        return { responses, score, badge };
      });
    },
    [],
  );

  const resetAll = () => {
    setLearnedState({});
    setDemoCompletion({});
    setQuizState(DEFAULT_QUIZ_STATE);
    setSectionStats({});
    if (typeof window !== "undefined") {
      Object.values(STORAGE_KEYS).forEach((key) => window.localStorage.removeItem(key));
    }
    toast.success("Progress reset. You can start fresh!");
  };

  const handleCopy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success("Copied to clipboard");
    } catch (error) {
      toast.error("Copy failed. Try again.");
      console.warn(error);
    }
  };

  const demosData = sectionData["demos"] as DemosData | undefined;
  const quotesData = sectionData["quotes-stats"] as QuotesStats | undefined;

  const quizQuestions = demosData?.quiz ?? [];

  const demoItems = [
    {
      id: "token-counter",
      title: "Token Counter",
      description: "Estimate how many tokens your prompt needs.",
      component: TokenCounterLazy,
    },
    {
      id: "embedding-similarity",
      title: "Embedding Similarity",
      description: "Bag-of-words cosine similarity gauge.",
      component: EmbeddingLazy,
    },
    {
      id: "context-window",
      title: "Context Window Visualizer",
      description: "See which parts of your text fit in the window.",
      component: ContextLazy,
    },
    {
      id: "creativity-slider",
      title: "Creativity Slider",
      description: "Dial up temperature to remix phrasing.",
      component: CreativityLazy,
    },
    {
      id: "bias-check",
      title: "Bias Check",
      description: "Compare sentiment between two outputs.",
      component: BiasLazy,
    },
    {
      id: "mini-quiz",
      title: "Mini Quiz (10 Qs)",
      description: "Test yourself on the fundamentals.",
      component: QuizLazy,
    },
  ];

  const completedDemos = demoItems.filter((demo) => demoCompletion[demo.id]).length;

  const renderSectionContent = (definition: SectionDefinition) => {
    if (definition.type === "cards") {
      const data = (sectionData[definition.id] ?? null) as unknown;
      return definition.render({
        sectionId: definition.id,
        data,
        loading: Boolean(loadingSections[definition.id]),
        learned: learnedState[definition.id] ?? {},
        onToggle: handleToggleLearned,
        onStats: handleStatsUpdate,
      });
    }

    if (definition.type === "demos") {
      if (!demosData && !loadingSections[definition.id]) {
        return <SectionNotLoaded />;
      }
      return (
        <div className="space-y-6">
          <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
            You’re trying simplified, offline simulations designed for learning. Token counts use heuristics, similarity uses term
            frequencies, creativity swaps synonyms, and bias detection checks a tiny sentiment lexicon.
          </div>
          <Accordion type="multiple" className="space-y-4">
            {demoItems.map((demo) => {
              const DemoComponent = demo.component;
              const isQuiz = demo.id === "mini-quiz";
              return (
                <AccordionItem key={demo.id} value={demo.id} className="glass-card-soft">
                  <AccordionTrigger className="px-4 py-3 text-left">
                    <div className="flex flex-col items-start gap-1">
                      <div className="flex items-center gap-2 text-sm font-semibold">
                        {demoCompletion[demo.id] ? <CheckCircle2 className="h-4 w-4 text-primary" /> : <Circle className="h-4 w-4" />}
                        <span>{demo.title}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{demo.description}</p>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <Suspense fallback={<Skeleton className="h-40 w-full" />}>
                      {isQuiz ? (
                        <DemoComponent
                          completed={demoCompletion[demo.id]}
                          onComplete={() => handleDemoComplete(demo.id)}
                          questions={quizQuestions}
                          responses={quizState.responses}
                          score={quizState.score}
                          badge={quizState.badge}
                          onSelect={(index: number, option: string) => updateQuizSelection(index, option, quizQuestions)}
                          onReset={() => setQuizState(DEFAULT_QUIZ_STATE)}
                        />
                      ) : (
                        <DemoComponent
                          completed={demoCompletion[demo.id]}
                          onComplete={() => handleDemoComplete(demo.id)}
                        />
                      )}
                    </Suspense>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </div>
      );
    }

    if (definition.type === "quotes") {
      if (!quotesData && !loadingSections[definition.id]) {
        return <SectionNotLoaded />;
      }
      if (!quotesData) {
        return <Skeleton className="h-32 w-full" />;
      }
      return (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="h-full glass-card-soft ring-gradient-glow">
            <CardHeader>
              <CardTitle className="text-lg">Quotes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {quotesData.quotes.map((quote) => (
                <div key={quote} className="flex items-center justify-between gap-2 rounded-md border-white/5 bg-slate-900/40 p-3 backdrop-blur-sm">
                  <span className="text-sm text-muted-foreground">{quote}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label={`Copy quote: ${quote}`}
                    onClick={() => handleCopy(quote)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card className="h-full glass-card-soft ring-gradient-glow">
            <CardHeader>
              <CardTitle className="text-lg">Headline stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {quotesData.stats.map((stat) => (
                <div key={stat} className="flex items-center justify-between gap-2 rounded-md border-white/5 bg-slate-900/40 p-3 backdrop-blur-sm">
                  <span className="text-sm text-muted-foreground">{stat}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label={`Copy stat: ${stat}`}
                    onClick={() => handleCopy(stat)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      );
    }

    return null;
  };

  const handleNavClick = (id: SectionId) => {
    setActiveSection(id);
    const el = sectionRefs.current[id];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", `#${id}`);
    }
  };

  return (
    <div className="relative min-h-screen bg-background noise-texture">
      <AnimatedHero className="pb-16 pt-24">
        <div className="mx-auto flex max-w-7xl flex-col gap-10 px-4 lg:flex-row">
        <aside className="hidden w-64 shrink-0 lg:block">
          <nav className="sticky top-28 space-y-4 glass-card-softer p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">DecodeAI / Sections</p>
            <ul className="space-y-2 text-sm">
              {SECTION_DEFINITIONS.map((section) => (
                <li key={section.id}>
                  <Button
                    variant={activeSection === section.id ? "default" : "ghost"}
                    className={cn(
                      "w-full justify-start gap-2 text-left",
                      activeSection === section.id ? "bg-primary text-primary-foreground" : "text-foreground",
                    )}
                    onClick={() => handleNavClick(section.id)}
                  >
                    {activeSection === section.id ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <Circle className="h-4 w-4" />
                    )}
                    <span>{section.title}</span>
                  </Button>
                </li>
              ))}
            </ul>
          </nav>
        </aside>
        <div className="flex-1 space-y-12">
          <AnimatedSection>
            <header className="space-y-6 glass-card-soft p-6 ring-gradient-glow hover:shadow-[0_20px_70px_-15px_rgba(139,92,246,0.3)] transition-all duration-300">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
                <Sparkles className="h-4 w-4" />
              <span>DecodeAI Learning Path</span>
            </div>
            <div className="space-y-3">
              <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
                <span className="gradient-text-animated">AI Concepts 101</span>
              </h1>
              <p className="max-w-3xl text-lg text-muted-foreground">{HERO_COPY}</p>
            </div>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="hidden flex-1 gap-3 overflow-x-auto rounded-lg border bg-muted/30 p-3 text-sm text-muted-foreground md:flex">
                <BookOpen className="h-4 w-4" />
                <span>Quick jump:</span>
                <div className="flex flex-wrap gap-2">
                  {SECTION_DEFINITIONS.map((section) => (
                    <button
                      key={`jump-${section.id}`}
                      type="button"
                      onClick={() => handleNavClick(section.id)}
                      className="inline-flex items-center gap-1 rounded-full border border-border/60 px-3 py-1 text-xs font-medium text-foreground transition-colors hover:bg-accent"
                    >
                      {section.title}
                      <ArrowRight className="h-3 w-3" />
                    </button>
                  ))}
                </div>
              </div>
              <ProgressHud
                sectionStats={sectionStats}
                demosCompleted={completedDemos}
                totalDemos={demoItems.length}
                quizState={quizState}
                onReset={resetAll}
              />
            </div>
          </header>
          </AnimatedSection>

          <nav className="sticky top-16 z-20 border-b border-border/70 bg-background/90 py-3 backdrop-blur lg:hidden">
            <div className="flex gap-3 overflow-x-auto px-2">
              {SECTION_DEFINITIONS.map((section) => (
                <button
                  key={`mobile-nav-${section.id}`}
                  type="button"
                  onClick={() => handleNavClick(section.id)}
                  className={cn(
                    "whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium",
                    activeSection === section.id ? "bg-primary text-primary-foreground" : "bg-muted/50",
                  )}
                  aria-current={activeSection === section.id}
                >
                  {section.title}
                </button>
              ))}
            </div>
          </nav>

          <main className="space-y-16">
            {SECTION_DEFINITIONS.map((definition) => (
              <SectionWrapper
                key={definition.id}
                id={definition.id}
                title={definition.title}
                subtitle={definition.subtitle}
                sectionRef={(el) => {
                  sectionRefs.current[definition.id] = el;
                }}
              >
                {renderSectionContent(definition)}
              </SectionWrapper>
            ))}
          </main>
        </div>
      </div>
      </AnimatedHero>
    </div>
  );
};

const ProgressHud = ({
  sectionStats,
  demosCompleted,
  totalDemos,
  quizState,
  onReset,
}: {
  sectionStats: Record<SectionId, SectionTotals>;
  demosCompleted: number;
  totalDemos: number;
  quizState: QuizState;
  onReset: () => void;
}) => (
  <Card className="w-full max-w-sm glass-card-soft border-purple-500/20 ring-gradient-glow">
    <CardHeader className="space-y-1 pb-3">
      <div className="flex items-center justify-between">
        <CardTitle className="text-base font-semibold">Progress HUD</CardTitle>
        <Button variant="ghost" size="icon" onClick={onReset} aria-label="Reset all progress">
          <RefreshCcw className="h-4 w-4" />
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">Updates live as you mark cards, complete demos, and ace the quiz.</p>
    </CardHeader>
    <CardContent className="space-y-4">
      {HUD_SECTIONS.map((item) => {
        const stats = sectionStats[item.id] ?? { total: 0, learned: 0 };
        const percent = stats.total === 0 ? 0 : Math.round((stats.learned / stats.total) * 100);
        return (
          <div key={`hud-${item.id}`} className="space-y-2" aria-live="polite">
            <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
              <span>{MODEL_PROGRESS_LABELS[item.id]}</span>
              <span>{percent}%</span>
            </div>
            <Progress value={percent} />
          </div>
        );
      })}
      <div className="space-y-2" aria-live="polite">
        <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
          <span>Demos completed</span>
          <span>
            {demosCompleted}/{totalDemos}
          </span>
        </div>
        <Progress value={(demosCompleted / totalDemos) * 100} />
      </div>
      <div className="space-y-1" aria-live="polite">
        <p className="text-sm font-semibold">Mini Quiz</p>
        <p className="text-xs text-muted-foreground">
          Score: {quizState.score}/10 {quizState.badge ? `• ${quizState.badge}` : ""}
        </p>
      </div>
    </CardContent>
  </Card>
);

const IntroSection = ({ sectionId, data, loading, learned, onToggle, onStats }: SectionRendererProps<Intro>) => {
  const cards = useMemo(() => {
    if (!data) return [];
    return [
      {
        slug: "intro-definitions",
        title: "AI in plain language",
        tag: "Definitions",
        content: <List items={data.definitions} />,
      },
      {
        slug: "intro-examples",
        title: "10 everyday examples",
        tag: "Examples",
        content: <List items={data.examples} />,
      },
      {
        slug: "intro-visuals",
        title: "Visual ideas",
        tag: "Visual",
        content: (
          <div className="rounded-lg border bg-muted/30 p-4">
            <div className="flex flex-col items-stretch gap-3 md:flex-row md:items-center md:justify-between">
              {[
                {
                  icon: "📥",
                  title: "Input (Data)",
                  caption: "You give text, images, or other data.",
                },
                {
                  icon: "⚙️",
                  title: "Learning (Model)",
                  caption: "The AI finds patterns and figures out what matters.",
                },
                {
                  icon: "💡",
                  title: "Output (Prediction)",
                  caption: "It answers, predicts, or generates content.",
                },
              ].map((step, index, array) => (
                <div key={step.title} className="flex items-center gap-3">
                  <div className="flex flex-col gap-2 rounded-md border border-border/60 bg-background p-4">
                    <span className="text-xl">{step.icon}</span>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{step.title}</p>
                      <p className="text-xs text-muted-foreground">{step.caption}</p>
                    </div>
                  </div>
                  {index < array.length - 1 ? (
                    <span className="hidden text-lg text-muted-foreground md:block">→</span>
                  ) : null}
                </div>
              ))}
            </div>
            <div className="mt-3 flex justify-center text-lg text-muted-foreground md:hidden">→</div>
          </div>
        ),
      },
      {
        slug: "intro-quote",
        title: "Quote to remember",
        tag: "Quote",
        content: (
          <blockquote className="rounded-lg border bg-muted/30 p-4 text-sm italic text-muted-foreground">
            {data.quote}
          </blockquote>
        ),
      },
    ];
  }, [data]);

  useEffect(() => {
    if (!cards.length) return;
    const learnedCount = cards.filter((card) => learned[card.slug]).length;
    onStats(sectionId, { total: cards.length, learned: learnedCount });
  }, [cards, learned, onStats, sectionId]);

  if (loading && cards.length === 0) {
    return <LoadingGrid />;
  }
  if (!data) {
    return <SectionNotLoaded />;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {cards.map((card) => (
        <LearnCard
          key={card.slug}
          sectionId={sectionId}
          slug={card.slug}
          title={card.title}
          tag={card.tag}
          learned={Boolean(learned[card.slug])}
          onToggle={onToggle}
        >
          {card.content}
        </LearnCard>
      ))}
    </div>
  );
};

const LlmVsMlSection = ({ sectionId, data, loading, learned, onToggle, onStats }: SectionRendererProps<LlmVsMl>) => {
  const cards = useMemo(() => {
    if (!data) return [];
    const comparisonRows = [
      {
        label: "Data size",
        ml: "Smaller, labeled datasets",
        llm: "Huge, internet-scale text corpora",
      },
      {
        label: "Adaptability",
        ml: "Best for single, well-defined tasks",
        llm: "Adapts to many tasks via prompting",
      },
      {
        label: "Input type",
        ml: "Structured numeric/categorical data",
        llm: "Natural language, code, mixed media",
      },
      {
        label: "Example",
        ml: "Spam filter for email inboxes",
        llm: "Chatbot like ChatGPT",
      },
    ];
    return [
      {
        slug: "llm-definitions",
        title: "Key definitions",
        tag: "Definition",
        content: (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-md border bg-muted/40 p-3 text-sm text-muted-foreground">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">LLM</p>
              <p>{data.definitions.llm}</p>
            </div>
            <div className="rounded-md border bg-muted/40 p-3 text-sm text-muted-foreground">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Traditional ML</p>
              <p>{data.definitions.ml}</p>
            </div>
          </div>
        ),
      },
      {
        slug: "llm-differences",
        title: "How they differ",
        tag: "Comparison",
        content: <List items={data.differences} />,
      },
      {
        slug: "llm-comparisons",
        title: "Real-world contrasts",
        tag: "Examples",
        content: <List items={data.comparisons} />,
      },
      {
        slug: "llm-strengths",
        title: "Where LLMs shine",
        tag: "LLM advantages",
        content: <List items={data.llm_outperform} />,
      },
      {
        slug: "llm-visuals",
        title: "Visual cues",
        tag: "Visual",
        content: (
          <div className="overflow-hidden rounded-lg border border-border/70 bg-muted/20 text-sm text-muted-foreground">
            <div className="grid grid-cols-2 bg-muted/40 px-4 py-2 text-xs font-semibold uppercase tracking-wide">
              <span>Traditional ML</span>
              <span>LLMs</span>
            </div>
            <div className="divide-y divide-border/60">
              {comparisonRows.map((row) => (
                <div key={row.label} className="grid grid-cols-2 gap-4 px-4 py-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/80">{row.label}</p>
                    <p>{row.ml}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-primary/80">{row.label}</p>
                    <p className="text-primary">{row.llm}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ),
      },
    ];
  }, [data]);

  useEffect(() => {
    if (!cards.length) return;
    const learnedCount = cards.filter((card) => learned[card.slug]).length;
    onStats(sectionId, { total: cards.length, learned: learnedCount });
  }, [cards, learned, onStats, sectionId]);

  if (loading && cards.length === 0) {
    return <LoadingGrid count={4} />;
  }
  if (!data) {
    return <SectionNotLoaded />;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {cards.map((card) => (
        <LearnCard
          key={card.slug}
          sectionId={sectionId}
          slug={card.slug}
          title={card.title}
          tag={card.tag}
          learned={Boolean(learned[card.slug])}
          onToggle={onToggle}
        >
          {card.content}
        </LearnCard>
      ))}
    </div>
  );
};

const TokensSection = ({ sectionId, data, loading, learned, onToggle, onStats }: SectionRendererProps<TokensData>) => {
  const cards = useMemo(() => {
    if (!data) return [];
    const tokenUsage = {
      used: 1200,
      limit: 8000,
    };
    const tokenPercent = Math.round((tokenUsage.used / tokenUsage.limit) * 100);
    return [
      {
        slug: "tokens-basics",
        title: "Token basics",
        tag: "Definition",
        content: <List items={data.definitions} />,
      },
      {
        slug: "tokens-examples",
        title: "How counts stack up",
        tag: "Examples",
        content: <List items={data.examples} />,
      },
      {
        slug: "tokens-visual",
        title: "Visual idea",
        tag: "Visual",
        content: (
          <div className="space-y-4 rounded-md border bg-muted/30 p-4">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Tokens used</p>
              <div className="h-3 w-full rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${Math.min(tokenPercent, 100)}%` }}
                  aria-hidden="true"
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              {tokenUsage.used.toLocaleString()} / {tokenUsage.limit.toLocaleString()} tokens ({tokenPercent}% of this 8K context
              window)
            </p>
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">When text overruns the window</p>
              <div className="relative h-3 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="absolute left-0 top-0 h-full bg-primary/80"
                  style={{ width: "66%" }}
                  aria-hidden="true"
                />
                <div
                  className="absolute left-[66%] top-0 h-full w-1 bg-background/40"
                  aria-hidden="true"
                />
                <div
                  className="absolute right-0 top-0 h-full bg-primary/20"
                  style={{ width: "34%" }}
                  aria-hidden="true"
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>In context (last 8K tokens)</span>
                <span>Overflow (truncated)</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Inputs beyond the model's limit are dropped. Only the most recent tokens remain in context.
            </p>
          </div>
        ),
      },
    ];
  }, [data]);

  useEffect(() => {
    if (!cards.length) return;
    const learnedCount = cards.filter((card) => learned[card.slug]).length;
    onStats(sectionId, { total: cards.length, learned: learnedCount });
  }, [cards, learned, onStats, sectionId]);

  if (loading && cards.length === 0) return <LoadingGrid count={3} />;
  if (!data) return <SectionNotLoaded />;

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {cards.map((card) => (
        <LearnCard
          key={card.slug}
          sectionId={sectionId}
          slug={card.slug}
          title={card.title}
          tag={card.tag}
          learned={Boolean(learned[card.slug])}
          onToggle={onToggle}
        >
          {card.content}
        </LearnCard>
      ))}
    </div>
  );
};

const EmbeddingsSection = ({ sectionId, data, loading, learned, onToggle, onStats }: SectionRendererProps<EmbeddingsData>) => {
  const cards = useMemo(() => {
    if (!data) return [];
    const clusters = [
      {
        label: "Happy cluster",
        words: ["happy", "joyful", "positive"],
        position: { top: "20%", left: "20%" },
        color: "bg-emerald-500/80",
      },
      {
        label: "Vehicle cluster",
        words: ["car", "automobile", "vehicle"],
        position: { top: "55%", left: "60%" },
        color: "bg-sky-500/80",
      },
      {
        label: "Creative cluster",
        words: ["write", "story", "imagine"],
        position: { top: "70%", left: "30%" },
        color: "bg-purple-500/80",
      },
      {
        label: "Outlier",
        words: ["banana"],
        position: { top: "10%", left: "70%" },
        color: "bg-amber-500/80",
      },
    ];
    return [
      {
        slug: "embeddings-definitions",
        title: "Embeddings explained",
        tag: "Definition",
        content: <List items={data.definitions} />,
      },
      {
        slug: "embeddings-pairs",
        title: "Word similarity",
        tag: "Examples",
        content: (
          <TwoColumnList
            left={data.word_pairs.high_similarity}
            right={data.word_pairs.low_similarity}
            leftLabel="Close in meaning"
            rightLabel="Far apart"
          />
        ),
      },
      {
        slug: "embeddings-use-cases",
        title: "Use cases",
        tag: "Applications",
        content: <List items={data.use_cases} />,
      },
      {
        slug: "embeddings-visual",
        title: "Visual idea",
        tag: "Visual",
        content: (
          <div className="space-y-3">
            <div className="relative h-48 w-full overflow-hidden rounded-md border border-dashed border-border/80 bg-background">
              <span className="absolute inset-0 border border-border/40" aria-hidden="true" />
              {clusters.map((cluster) => (
                <div
                  key={cluster.label}
                  className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1 text-xs text-foreground"
                  style={{ top: cluster.position.top, left: cluster.position.left }}
                  aria-hidden="true"
                >
                  <div className={`rounded-full px-2 py-1 text-white shadow-sm ${cluster.color}`}>
                    {cluster.words.join(" · ")}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Words that mean similar things cluster together. Distant words (like “banana”) stay far apart in embedding space.
            </p>
          </div>
        ),
      },
    ];
  }, [data]);

  useEffect(() => {
    if (!cards.length) return;
    const learnedCount = cards.filter((card) => learned[card.slug]).length;
    onStats(sectionId, { total: cards.length, learned: learnedCount });
  }, [cards, learned, onStats, sectionId]);

  if (loading && cards.length === 0) return <LoadingGrid count={3} />;
  if (!data) return <SectionNotLoaded />;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {cards.map((card) => (
        <LearnCard
          key={card.slug}
          sectionId={sectionId}
          slug={card.slug}
          title={card.title}
          tag={card.tag}
          learned={Boolean(learned[card.slug])}
          onToggle={onToggle}
        >
          {card.content}
        </LearnCard>
      ))}
    </div>
  );
};

const PromptingSection = ({ sectionId, data, loading, learned, onToggle, onStats }: SectionRendererProps<Prompting>) => {
  const cards = useMemo(() => {
    if (!data) return [];
    return [
      {
        slug: "prompting-definition",
        title: "What is prompt engineering?",
        tag: "Definition",
        content: (
          <p className="rounded-md border bg-muted/30 p-4 text-sm text-muted-foreground">{data.definition}</p>
        ),
      },
      {
        slug: "prompting-styles",
        title: "Prompt styles",
        tag: "Styles",
        content: (
          <div className="flex flex-wrap gap-2">
            {data.styles.map((style) => (
              <Badge key={style} variant="secondary">
                {style}
              </Badge>
            ))}
          </div>
        ),
      },
      {
        slug: "prompting-examples",
        title: "Bad vs better",
        tag: "Example",
        content: (
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-lg border border-destructive/60 bg-destructive/10 p-4 text-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-destructive">Basic prompt</p>
              <p className="text-muted-foreground">{data.bad_better.bad}</p>
            </div>
            <div className="rounded-lg border border-success/60 bg-success/10 p-4 text-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-success">Improved prompt</p>
              <p className="text-muted-foreground">{data.bad_better.better}</p>
            </div>
          </div>
        ),
      },
      {
        slug: "prompting-principles",
        title: "Principles",
        tag: "Checklist",
        content: <List items={data.principles} />,
      },
    ];
  }, [data]);

  useEffect(() => {
    if (!cards.length) return;
    const learnedCount = cards.filter((card) => learned[card.slug]).length;
    onStats(sectionId, { total: cards.length, learned: learnedCount });
  }, [cards, learned, onStats, sectionId]);

  if (loading && cards.length === 0) return <LoadingGrid />;
  if (!data) return <SectionNotLoaded />;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {cards.map((card) => (
        <LearnCard
          key={card.slug}
          sectionId={sectionId}
          slug={card.slug}
          title={card.title}
          tag={card.tag}
          learned={Boolean(learned[card.slug])}
          onToggle={onToggle}
        >
          {card.content}
        </LearnCard>
      ))}
    </div>
  );
};

const CustomizationSection = ({ sectionId, data, loading, learned, onToggle, onStats }: SectionRendererProps<Customization>) => {
  const cards = useMemo(() => {
    if (!data) return [];
    return [
      {
        slug: "customization-definitions",
        title: "Customization levers",
        tag: "Definition",
        content: <List items={data.definitions} />,
      },
      {
        slug: "customization-applications",
        title: "Where it shows up",
        tag: "Applications",
        content: <List items={data.applications} />,
      },
      {
        slug: "customization-methods",
        title: "Compare methods",
        tag: "Table",
        content: (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Method</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Cost</TableHead>
                <TableHead>Flexibility</TableHead>
                <TableHead>Example</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.method_table.map((row) => (
                <TableRow key={row.method}>
                  <TableCell>{row.method}</TableCell>
                  <TableCell>{row.data}</TableCell>
                  <TableCell>{row.cost}</TableCell>
                  <TableCell>{row.flexibility}</TableCell>
                  <TableCell>{row.example}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ),
      },
    ];
  }, [data]);

  useEffect(() => {
    if (!cards.length) return;
    const learnedCount = cards.filter((card) => learned[card.slug]).length;
    onStats(sectionId, { total: cards.length, learned: learnedCount });
  }, [cards, learned, onStats, sectionId]);

  if (loading && cards.length === 0) return <LoadingGrid count={3} />;
  if (!data) return <SectionNotLoaded />;

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {cards.map((card) => (
        <LearnCard
          key={card.slug}
          sectionId={sectionId}
          slug={card.slug}
          title={card.title}
          tag={card.tag}
          learned={Boolean(learned[card.slug])}
          onToggle={onToggle}
        >
          {card.content}
        </LearnCard>
      ))}
    </div>
  );
};

const InferenceSection = ({ sectionId, data, loading, learned, onToggle, onStats }: SectionRendererProps<Inference>) => {
  const cards = useMemo(() => {
    if (!data) return [];
    return [
      {
        slug: "inference-steps",
        title: "What happens inside",
        tag: "Process",
        content: (
          <ol className="space-y-2 text-sm text-muted-foreground">
            {data.steps.map((step, index) => (
              <li key={step} className="rounded-md border bg-muted/30 p-3">
                <span className="mr-2 font-semibold text-primary">{index + 1}.</span>
                {step}
              </li>
            ))}
          </ol>
        ),
      },
      {
        slug: "inference-tasks",
        title: "Common tasks",
        tag: "Tasks",
        content: <List items={data.tasks} />,
      },
      {
        slug: "inference-visual",
        title: "Visual idea",
        tag: "Visual",
        content: (
          <div className="max-w-full overflow-hidden rounded-md border bg-muted/30 p-4">
            <div className="flex flex-col gap-4 md:flex-row md:flex-wrap md:items-stretch">
              {[
                {
                  label: "You ask",
                  description: "You send a prompt or question to the model.",
                },
                {
                  label: "Model thinks",
                  description: "The neural network scores the next possible tokens, one step at a time.",
                },
                {
                  label: "It replies",
                  description: "Those tokens are combined into the final answer you read.",
                },
              ].map((step, index, array) => (
                <div
                  key={step.label}
                  className="flex min-w-[180px] flex-1 flex-col items-center gap-2 text-center md:flex-auto md:basis-0"
                >
                  <div className="w-full rounded-md border border-border/60 bg-background px-3 py-3">
                    <p className="text-sm font-medium text-foreground">{step.label}</p>
                    <p className="text-xs text-muted-foreground">{step.description}</p>
                  </div>
                  {index < array.length - 1 ? (
                    <span className="text-muted-foreground md:block md:text-lg">→</span>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        ),
      },
    ];
  }, [data]);

  useEffect(() => {
    if (!cards.length) return;
    const learnedCount = cards.filter((card) => learned[card.slug]).length;
    onStats(sectionId, { total: cards.length, learned: learnedCount });
  }, [cards, learned, onStats, sectionId]);

  if (loading && cards.length === 0) return <LoadingGrid count={3} />;
  if (!data) return <SectionNotLoaded />;

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {cards.map((card) => (
        <LearnCard
          key={card.slug}
          sectionId={sectionId}
          slug={card.slug}
          title={card.title}
          tag={card.tag}
          learned={Boolean(learned[card.slug])}
          onToggle={onToggle}
        >
          {card.content}
        </LearnCard>
      ))}
    </div>
  );
};

const StrengthsSection = ({ sectionId, data, loading, learned, onToggle, onStats }: SectionRendererProps<Strengths>) => {
  const cards = useMemo(() => {
    if (!data) return [];
    return [
      {
        slug: "strengths-core",
        title: "Strengths",
        tag: "Strengths",
        content: <List items={data.strengths} />,
      },
      {
        slug: "strengths-limitations",
        title: "Limitations",
        tag: "Limitations",
        content: <List items={data.limitations} />,
      },
      {
        slug: "strengths-scenarios",
        title: "Where it excels",
        tag: "Scenarios",
        content: <List items={data.scenarios_strong} />,
      },
      {
        slug: "strengths-caution",
        title: "Be cautious when…",
        tag: "Caution",
        content: <List items={data.scenarios_limit} />,
      },
      {
        slug: "strengths-quote",
        title: "Reminder",
        tag: "Quote",
        content: (
          <blockquote className="rounded-lg border bg-muted/30 p-4 text-sm italic text-muted-foreground">
            {data.quote}
          </blockquote>
        ),
      },
    ];
  }, [data]);

  useEffect(() => {
    if (!cards.length) return;
    const learnedCount = cards.filter((card) => learned[card.slug]).length;
    onStats(sectionId, { total: cards.length, learned: learnedCount });
  }, [cards, learned, onStats, sectionId]);

  if (loading && cards.length === 0) return <LoadingGrid count={4} />;
  if (!data) return <SectionNotLoaded />;

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {cards.map((card) => (
        <LearnCard
          key={card.slug}
          sectionId={sectionId}
          slug={card.slug}
          title={card.title}
          tag={card.tag}
          learned={Boolean(learned[card.slug])}
          onToggle={onToggle}
        >
          {card.content}
        </LearnCard>
      ))}
    </div>
  );
};

const ApplicationsSection = ({ sectionId, data, loading, learned, onToggle, onStats }: SectionRendererProps<ApplicationsData>) => {
  const cards = useMemo(() => {
    if (!data) return [];
    const sectors = data.sectors.map((sector) => ({
      slug: `applications-${slugify(sector.name)}`,
      title: sector.name,
      tag: "Use cases",
      items: sector.examples,
    }));
    return sectors;
  }, [data]);

  useEffect(() => {
    if (!cards.length) return;
    const learnedCount = cards.filter((card) => learned[card.slug]).length;
    onStats(sectionId, { total: cards.length, learned: learnedCount });
  }, [cards, learned, onStats, sectionId]);

  if (loading && cards.length === 0) return <LoadingGrid count={4} />;
  if (!data) return <SectionNotLoaded />;

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {cards.map((card) => (
        <LearnCard
          key={card.slug}
          sectionId={sectionId}
          slug={card.slug}
          title={card.title}
          tag={card.tag}
          learned={Boolean(learned[card.slug])}
          onToggle={onToggle}
        >
          <List items={card.items} />
        </LearnCard>
      ))}
    </div>
  );
};

const EthicsSection = ({ sectionId, data, loading, learned, onToggle, onStats }: SectionRendererProps<EthicsData>) => {
  const cards = useMemo(() => {
    if (!data) return [];
    return [
      {
        slug: "ethics-bias",
        title: "Bias, defined",
        tag: "Definition",
        content: (
          <div className="space-y-3">
            <p className="rounded-md border bg-muted/30 p-4 text-sm text-muted-foreground">{data.bias_definition}</p>
            <List items={data.principles} />
          </div>
        ),
      },
      {
        slug: "ethics-examples",
        title: "Examples of harm",
        tag: "Examples",
        content: <List items={data.examples} />,
      },
      {
        slug: "ethics-safety",
        title: "Safety rules",
        tag: "Checklist",
        content: <List items={data.safety_rules} />,
      },
    ];
  }, [data]);

  useEffect(() => {
    if (!cards.length) return;
    const learnedCount = cards.filter((card) => learned[card.slug]).length;
    onStats(sectionId, { total: cards.length, learned: learnedCount });
  }, [cards, learned, onStats, sectionId]);

  if (loading && cards.length === 0) return <LoadingGrid count={3} />;
  if (!data) return <SectionNotLoaded />;

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {cards.map((card) => (
        <LearnCard
          key={card.slug}
          sectionId={sectionId}
          slug={card.slug}
          title={card.title}
          tag={card.tag}
          learned={Boolean(learned[card.slug])}
          onToggle={onToggle}
        >
          {card.content}
        </LearnCard>
      ))}
    </div>
  );
};

const GlossarySection = ({ sectionId, data, loading, learned, onToggle, onStats }: SectionRendererProps<GlossaryItem[]>) => {
  const cards = useMemo(() => {
    if (!data) return [];
    return data.map((item) => ({
      slug: `glossary-${slugify(item.term)}`,
      title: item.term,
      tag: "Glossary",
      definition: item.definition,
      why: item.why,
    }));
  }, [data]);

  useEffect(() => {
    if (!cards.length) return;
    const learnedCount = cards.filter((card) => learned[card.slug]).length;
    onStats(sectionId, { total: cards.length, learned: learnedCount });
  }, [cards, learned, onStats, sectionId]);

  if (loading && cards.length === 0) return <LoadingGrid count={6} />;
  if (!data) return <SectionNotLoaded />;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {cards.map((card) => (
        <LearnCard
          key={card.slug}
          sectionId={sectionId}
          slug={card.slug}
          title={card.title}
          tag={card.tag}
          learned={Boolean(learned[card.slug])}
          onToggle={onToggle}
        >
          <p className="text-sm text-muted-foreground">{card.definition}</p>
          <div className="rounded-md border border-purple-500/20 bg-purple-500/10 backdrop-blur-sm p-3 text-xs text-purple-300">
            Why it matters: {card.why}
          </div>
        </LearnCard>
      ))}
    </div>
  );
};

export default AI;
