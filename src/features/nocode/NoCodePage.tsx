import { Dispatch, SetStateAction, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "react-router-dom";
import { AnimatedHero } from "@/components/AnimatedHero";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  Brain,
  Check,
  ChevronDown,
  ChevronRight,
  Clipboard,
  ClipboardCopy,
  Copy,
  Download,
  ExternalLink,
  Filter,
  Info,
  Layers,
  Loader2,
  Play,
  Plus,
  Save,
  Search,
  Share2,
  Sparkles,
  Workflow,
} from "lucide-react";
import type {
  BestPractice,
  CuratedOutput,
  FAQ,
  Intro,
  LaunchPlanConfig,
  LaunchTemplate,
  LimitRow,
  RecoQuestion,
  RecoResult,
  StarterKit,
  StressProfile,
  ToolCaps,
  TroubleshootRow,
  WeightsConfig,
  ComparisonRow,
  Showcase,
  Takeaways,
  DeployStep,
  IntegrationCard,
  WhyItem,
} from "@/types/nocode";

const STORAGE_KEY = "decodeai.nocode";

type PersistedState = {
  answers: Record<number, number[]>;
  lastResult?: RecoResult;
  savedStacks: SavedStack[];
  deployProgress: Record<string, boolean>;
  launchPlans: SavedLaunchPlan[];
  stress: {
    savedScenarios: StressScenario[];
  };
  bestPractices?: Record<string, boolean>;
};

type SavedStack = {
  id: string;
  stack: string[];
  summary: string;
  generatedAt: number;
  source: "recommender" | "starter-kit";
};

type PlanTask = {
  id: string;
  title: string;
  minutes: number;
  scaledMinutes: number;
  dueDate?: string;
  milestone?: boolean;
  roleSuggestion?: string;
  completed?: boolean;
  notes?: string;
};

type SavedLaunchPlan = {
  id: string;
  projectName: string;
  generatedAt: number;
  horizonDays: number;
  targetDate?: string;
  teamSize: number;
  priority: "prototype" | "production";
  stack: string[];
  tasks: PlanTask[];
};

type StressScenario = {
  id: string;
  label: string;
  createdAt: number;
  params: StressInputs;
  result: StressResult;
};

type StressInputs = {
  dau: number;
  requestsPerUser: number;
  avgModelMb: number;
  avgFileMb: number;
  inferencePerHour: number;
  retrainingFrequency: "none" | "daily" | "weekly" | "monthly";
  safetyMultiplier: "conservative" | "normal" | "optimistic";
};

type StressResult = {
  byTool: Record<
    string,
    {
      status: "green" | "amber" | "red";
      summary: string;
      metrics: Record<string, string | number>;
      suggestions: string[];
    }
  >;
};

type SectionDescriptor = {
  id: string;
  label: string;
  description?: string;
};

type LoadedData = {
  intro: Intro;
  questions: RecoQuestion[];
  tools: ToolCaps[];
  weights: WeightsConfig;
  curated: CuratedOutput[];
  deploy: { steps: DeployStep[] };
  integrations: IntegrationCard[];
  limits: LimitRow[];
  troubleshoot: TroubleshootRow[];
  faqs: FAQ[];
  bestPractices: BestPractice[];
  starterKits: StarterKit[];
  showcases: Showcase[];
  comparison: ComparisonRow[];
  takeaways: Takeaways;
  launchPlans: LaunchPlanConfig;
  stressProfiles: StressProfile[];
  sectionsMeta: {
    hero_subheader: string;
    section_descriptions: Record<string, string>;
  };
};

const sectionOrder: SectionDescriptor[] = [
  { id: "intro", label: "Intro" },
  { id: "recommender", label: "Recommender" },
  { id: "deploy", label: "Deploy" },
  { id: "integrations", label: "Integrations" },
  { id: "limits", label: "Limits" },
  { id: "troubleshoot", label: "Troubleshoot" },
  { id: "showcases", label: "Showcases" },
  { id: "starter-kits", label: "Starter Kits" },
  { id: "comparison", label: "Comparison" },
  { id: "launch-plan", label: "Launch Plan" },
  { id: "free-tier-stress", label: "Free Tier Stress" },
  { id: "best-practices", label: "Best Practices" },
  { id: "faqs", label: "FAQs" },
  { id: "takeaways", label: "Takeaways" },
];

const defaultStressInputs: StressInputs = {
  dau: 10,
  requestsPerUser: 3,
  avgModelMb: 20,
  avgFileMb: 5,
  inferencePerHour: 5,
  retrainingFrequency: "none",
  safetyMultiplier: "normal",
};

const defaultPersistedState: PersistedState = {
  answers: {},
  savedStacks: [],
  deployProgress: {},
  launchPlans: [],
  stress: { savedScenarios: [] },
  bestPractices: {},
};

const multiSelectQuestions = new Set<string>([
  "How will you share your project?",
  "What kind of data will you use?",
  "Privacy & access",
]);

const parseMarkdownUrl = (raw?: string) => {
  if (!raw) return "";
  const match = raw.match(/\((https?:\/\/[^)]+)\)/i);
  if (match) return match[1];
  const bracket = raw.match(/\[?(https?:\/\/[^\]]+)\]?/i);
  if (bracket) return bracket[1];
  return raw;
};

const humanizeCapability = (cap: string) =>
  cap
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

const normalizeToolKey = (value: string) => value.toLowerCase().replace(/[^a-z]/g, "");

const formatDuration = (minutes: number) => {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins ? `${hours}h ${mins}m` : `${hours}h`;
};

const formatDate = (iso?: string) => {
  if (!iso) return "TBD";
  const date = new Date(iso);
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
};

const capabilityIsEnabled = (tool: ToolCaps, capability: string) => {
  const value = tool.capabilities?.[capability];
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    return ["true", "yes", "enabled"].includes(value.toLowerCase());
  }
  return Boolean(value);
};

const toolHasCapability = (tool: ToolCaps, capability: string) => {
  const value = tool.capabilities?.[capability];
  if (value === undefined) return false;
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    if (value === "paid" || value === "limited") return false;
    return value.length > 0;
  }
  return Boolean(value);
};

const determineSeverity = (issue: TroubleshootRow["issue"], cause: TroubleshootRow["cause"]) => {
  const lowered = `${issue} ${cause}`.toLowerCase();
  if (lowered.includes("won’t") || lowered.includes("fails") || lowered.includes("missing") || lowered.includes("not syncing")) {
    return "blocking deploy";
  }
  if (lowered.includes("slow") || lowered.includes("sleep")) {
    return "performance";
  }
  if (lowered.includes("api key")) {
    return "credentials";
  }
  return "common";
};

const statusColor: Record<string, string> = {
  green: "bg-emerald-500",
  amber: "bg-amber-500",
  red: "bg-red-500",
};

const NoCodePage = () => {
  const [data, setData] = useState<LoadedData | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [persisted, setPersisted] = useState<PersistedState>(defaultPersistedState);
  const [hydrated, setHydrated] = useState(false);
  const [activeSection, setActiveSection] = useState("intro");
  const [currentStressInputs, setCurrentStressInputs] = useState<StressInputs>(defaultStressInputs);
  const [stressResult, setStressResult] = useState<StressResult | null>(null);
  const location = useLocation();
  const observerRef = useRef<IntersectionObserver | null>(null);
  const progressAnnouncerRef = useRef<HTMLDivElement | null>(null);

  const toolLinkMap = useMemo(() => (data ? buildToolLinkMap(data) : new Map<string, string>()), [data]);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const [
          intro,
          questions,
          tools,
          weights,
          curated,
          deploy,
          integrations,
          limits,
          troubleshoot,
          faqs,
          bestPractices,
          starterKits,
          showcases,
          comparison,
          takeaways,
          launchPlans,
          stressProfiles,
          sectionsMeta,
        ] = await Promise.all([
          import("@/data/nocode_intro.json"),
          import("@/data/nocode_recommender.json"),
          import("@/data/nocode_tools.json"),
          import("@/data/nocode_weights.json"),
          import("@/data/nocode_recommender_output.json"),
          import("@/data/nocode_deploy.json"),
          import("@/data/nocode_integrations.json"),
          import("@/data/nocode_limits.json"),
          import("@/data/nocode_troubleshoot.json"),
          import("@/data/nocode_faqs.json"),
          import("@/data/nocode_bestpractices.json"),
          import("@/data/nocode_starterkits.json"),
          import("@/data/nocode_showcases.json"),
          import("@/data/nocode_comparison.json"),
          import("@/data/nocode_takeaways.json"),
          import("@/data/nocode_launchplans.json"),
          import("@/data/nocode_stresstest_profiles.json"),
          import("@/data/nocode_sections.json"),
        ]);

        if (!mounted) return;
        setData({
          intro: intro.default as Intro,
          questions: questions.default as RecoQuestion[],
          tools: (tools.default ?? []) as ToolCaps[],
          weights: weights.default as WeightsConfig,
          curated: curated.default as CuratedOutput[],
          deploy: deploy.default as { steps: DeployStep[] },
          integrations: integrations.default as IntegrationCard[],
          limits: limits.default as LimitRow[],
          troubleshoot: troubleshoot.default as TroubleshootRow[],
          faqs: faqs.default as FAQ[],
          bestPractices: bestPractices.default as BestPractice[],
          starterKits: starterKits.default as StarterKit[],
          showcases: showcases.default as Showcase[],
          comparison: comparison.default as ComparisonRow[],
          takeaways: takeaways.default as Takeaways,
          launchPlans: launchPlans.default as LaunchPlanConfig,
          stressProfiles: stressProfiles.default as StressProfile[],
          sectionsMeta: sectionsMeta.default as { hero_subheader: string; section_descriptions: Record<string, string> },
        });
      } catch (error) {
        console.error("Failed to load DecodeAI No-Code data", error);
        toast.error("Unable to load toolkit data. Please refresh.");
      } finally {
        if (mounted) setLoadingData(false);
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const storedRaw = window.localStorage.getItem(STORAGE_KEY);
      if (storedRaw) {
        const parsed = JSON.parse(storedRaw) as PersistedState;
        setPersisted({
          ...defaultPersistedState,
          ...parsed,
          deployProgress: parsed.deployProgress ?? {},
          stress: {
            savedScenarios: parsed.stress?.savedScenarios ?? [],
          },
          bestPractices: parsed.bestPractices ?? {},
        });
      }
    } catch (error) {
      console.warn("Unable to parse stored DecodeAI no-code state", error);
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated || typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(persisted));
  }, [persisted, hydrated]);

  useEffect(() => {
    if (!hydrated || typeof window === "undefined") return;
    if (location.hash) {
      const targetId = location.hash.replace("#", "");
      const target = document.getElementById(targetId);
      if (target) {
        setTimeout(() => {
          target.scrollIntoView({ behavior: "smooth", block: "start" });
          const heading = target.querySelector("h2, h1");
          if (heading instanceof HTMLElement) {
            heading.focus({ preventScroll: true });
          }
        }, 200);
      }
    }
  }, [location, hydrated]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      {
        rootMargin: "-45% 0px -45% 0px",
        threshold: [0.1, 0.5, 1],
      }
    );
    observerRef.current = observer;

    sectionOrder.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => {
      observer.disconnect();
    };
  }, [loadingData]);

  const progress = useMemo(() => {
    if (!data) return 0;
    const answeredCount = data.questions.reduce((acc, _q, idx) => {
      const selections = persisted.answers[idx];
      if (selections && selections.length > 0) return acc + 1;
      return acc;
    }, 0);
    return Math.round((answeredCount / data.questions.length) * 100);
  }, [data, persisted.answers]);

  useEffect(() => {
    if (!progressAnnouncerRef.current) return;
    progressAnnouncerRef.current.textContent = `Form progress ${progress} percent`;
  }, [progress]);

  const recommended = useMemo(() => {
    if (!data) return null;
    return calculateRecommendation({
      data,
      answers: persisted.answers,
    });
  }, [data, persisted.answers]);

  useEffect(() => {
    if (!recommended) return;
    setPersisted((prev) => {
      const prevStack = prev.lastResult?.stack.join("|");
      const nextStack = recommended.stack.join("|");
      if (prevStack === nextStack && prev.lastResult?.summary === recommended.summary) {
        return prev;
      }
      return {
        ...prev,
        lastResult: recommended,
      };
    });
  }, [recommended]);

  useEffect(() => {
    if (!data || !recommended) return;
    const result = runStressTest(
      currentStressInputs,
      recommended.stack,
      data.tools,
      data.limits
    );
    setStressResult(result);
  }, [data, currentStressInputs, recommended]);

  if (loadingData || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" aria-hidden="true" />
          <p className="text-muted-foreground text-sm">
            Loading DecodeAI No-Code Toolkit…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen noise-texture">
      <AnimatedHero className="px-4 md:px-8 lg:px-12 pb-24 pt-28">
        <div className="relative flex gap-6 lg:gap-10 xl:gap-14">
        <aside className="hidden lg:block w-64 shrink-0 sticky top-28 h-[calc(100vh-7rem)]">
          <ScrollArea className="h-full pr-4">
            <nav aria-label="Section navigation" className="space-y-1">
              {sectionOrder.map(({ id, label }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    const el = document.getElementById(id);
                    if (el) {
                      el.scrollIntoView({ behavior: "smooth", block: "start" });
                      const heading = el.querySelector("h2, h1");
                      if (heading instanceof HTMLElement) {
                        heading.focus({ preventScroll: true });
                      }
                    }
                  }}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                    activeSection === id
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted text-foreground"
                  }`}
                  aria-current={activeSection === id ? "true" : "false"}
                >
                  {label}
                </button>
              ))}
            </nav>
          </ScrollArea>
        </aside>

        <div className="flex-1 space-y-16">
          <header id="intro" className="scroll-mt-24">
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
              <div className="uppercase tracking-[0.3em] text-xs text-primary/70 mb-4 flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                DecodeAI No-Code Toolkit
              </div>
              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
                <span className="gradient-text-animated">No-Code Toolkit</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-3xl">
                {data.sectionsMeta.hero_subheader}
              </p>
              <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {data.intro.quick_start.map((link) => {
                  const url = parseMarkdownUrl(link.url);
                  return (
                    <Card key={link.title} className="glass-card-softer border-dashed border-purple-500/20">
                      <CardHeader className="p-4 pb-2">
                        <CardTitle className="text-base">{link.title}</CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full justify-between"
                          asChild
                        >
                          <a href={url} rel="noopener noreferrer" target="_blank">
                            Launch
                            <ExternalLink className="h-4 w-4" aria-hidden="true" />
                          </a>
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </motion.div>
          </header>

          <div className="max-w-6xl mx-auto w-full pt-4 pb-6">
            <ProgressHud
              progress={progress}
              savedCount={persisted.savedStacks.length}
              onReset={() => {
                setPersisted((prev) => ({
                  ...prev,
                  answers: {},
                }));
                toast.info("Form answers cleared.");
              }}
              recommendation={recommended ?? persisted.lastResult ?? null}
            />
          </div>

          <section id="recommender" className="scroll-mt-28">
            <RecommenderSection
              data={data}
              persisted={persisted}
              setPersisted={setPersisted}
              progress={progress}
              recommended={recommended}
              toolLinks={toolLinkMap}
            />
          </section>

          <section id="deploy" className="scroll-mt-24">
            <DeployChecklist
              steps={data.deploy.steps}
              persisted={persisted}
              setPersisted={setPersisted}
              description={data.sectionsMeta.section_descriptions["deploy"]}
            />
          </section>

          <section id="integrations" className="scroll-mt-24">
            <IntegrationsDeck
              cards={data.integrations}
              description={data.sectionsMeta.section_descriptions["integrations"]}
              quickLinks={data.intro.quick_start}
            />
          </section>

          <section id="limits" className="scroll-mt-24">
            <LimitsTable
              limits={data.limits}
              description={data.sectionsMeta.section_descriptions["limits"]}
            />
          </section>

          <section id="troubleshoot" className="scroll-mt-24">
            <TroubleshootAccordion
              rows={data.troubleshoot}
              description={data.sectionsMeta.section_descriptions["troubleshoot"]}
            />
          </section>

          <section id="showcases" className="scroll-mt-24">
            <ShowcaseGrid
              showcases={data.showcases}
              description={data.sectionsMeta.section_descriptions["showcases"]}
            />
          </section>

          <section id="starter-kits" className="scroll-mt-24">
            <StarterKits
              kits={data.starterKits}
              description={data.sectionsMeta.section_descriptions["starter-kits"]}
              onSaveStack={(kit) => {
                setPersisted((prev) => ({
                  ...prev,
                  savedStacks: [
                    {
                      id: `kit-${Date.now()}`,
                      stack: kit.stack,
                      summary: kit.description,
                      generatedAt: Date.now(),
                      source: "starter-kit",
                    },
                    ...prev.savedStacks,
                  ],
                }));
                toast.success("Starter kit added to saved stacks.");
              }}
            />
          </section>

          <section id="comparison" className="scroll-mt-24">
            <ComparisonMatrix
              rows={data.comparison}
              description={data.sectionsMeta.section_descriptions["comparison"]}
            />
          </section>

          <section id="launch-plan" className="scroll-mt-24">
            <LaunchPlanGenerator
              description={data.sectionsMeta.section_descriptions["launch-plan"]}
              launchConfig={data.launchPlans}
              tools={data.tools}
              currentStack={recommended?.stack ?? []}
              persisted={persisted}
              setPersisted={setPersisted}
            />
          </section>

          <section id="free-tier-stress" className="scroll-mt-24">
            <StressTest
              description={data.sectionsMeta.section_descriptions["free-tier-stress"]}
              tools={data.tools}
              limits={data.limits}
              stressProfiles={data.stressProfiles}
              inputs={currentStressInputs}
              setInputs={setCurrentStressInputs}
              result={stressResult}
              setResult={setStressResult}
              stack={recommended?.stack ?? []}
              persisted={persisted}
              setPersisted={setPersisted}
            />
          </section>

          <section id="best-practices" className="scroll-mt-24">
            <BestPracticesSection
              items={data.bestPractices}
              description={data.sectionsMeta.section_descriptions["best-practices"]}
              persisted={persisted}
              setPersisted={setPersisted}
            />
          </section>

          <section id="faqs" className="scroll-mt-24">
            <FaqSection
              faqs={data.faqs}
              description={data.sectionsMeta.section_descriptions["faqs"]}
            />
          </section>

          <section id="takeaways" className="scroll-mt-24">
            <TakeawaysSection
              takeaways={data.takeaways}
              description={data.sectionsMeta.section_descriptions["takeaways"]}
            />
          </section>
        </div>
      </div>
      </AnimatedHero>
      <div ref={progressAnnouncerRef} className="sr-only" aria-live="polite" />
    </div>
  );
};

type RecommendationParams = {
  data: LoadedData;
  answers: Record<number, number[]>;
};

const calculateRecommendation = ({ data, answers }: RecommendationParams): RecoResult | null => {
  const scores: {
    tool: ToolCaps;
    score: number;
    excluded: boolean;
    boosts: Record<string, string[]>;
    requirements: Set<string>;
    penalties: string[];
  }[] = data.tools.map((tool) => ({
    tool,
    score: 0,
    excluded: false,
    boosts: {},
    requirements: new Set<string>(),
    penalties: [],
  }));

  const needs = {
    freeGpu: false,
    customDomain: false,
    privateProjects: false,
    mobile: false,
  };

  data.questions.forEach((question, qIdx) => {
    const selected = answers[qIdx] ?? [];
    if (!selected.length) return;
    selected.forEach((oIdx) => {
      const option = question.options[oIdx];
      if (!option) return;

      if (option.text.toLowerCase().includes("mobile")) {
        needs.mobile = true;
      }
      if (option.text.toLowerCase().includes("free gpu")) {
        needs.freeGpu = true;
      }
      if (option.text.toLowerCase().includes("custom domain")) {
        needs.customDomain = true;
      }
      if (option.text.toLowerCase().includes("private")) {
        needs.privateProjects = true;
      }

      scores.forEach((entry) => {
        if (entry.excluded) return;
        const { tool } = entry;

        if (option.require?.length) {
          const hasAll = option.require.every((cap) => toolHasCapability(tool, cap));
          if (!hasAll) {
            entry.excluded = true;
            return;
          }
          entry.score += data.weights.weights.require;
          option.require.forEach((cap) => entry.requirements.add(cap));
        }

        if (option.prefer?.length) {
          option.prefer.forEach((cap) => {
            if (toolHasCapability(tool, cap)) {
              entry.score += data.weights.weights.prefer;
              if (!entry.boosts[question.question]) entry.boosts[question.question] = [];
              entry.boosts[question.question].push(`Matches preference for ${humanizeCapability(cap)}`);
            }
          });
        }

        if (option.avoid?.length) {
          option.avoid.forEach((cap) => {
            if (toolHasCapability(tool, cap)) {
              entry.score += data.weights.weights.avoid;
              entry.penalties.push(`Includes ${humanizeCapability(cap)} which you wanted to avoid`);
            }
          });
        }

        if (option.adds?.length) {
          if (option.adds.includes("All")) {
            entry.score += data.weights.weights.adds;
          } else if (option.adds.includes(tool.tool)) {
            entry.score += data.weights.weights.adds;
            if (!entry.boosts[question.question]) entry.boosts[question.question] = [];
            entry.boosts[question.question].push(`Suggested directly for “${option.text}”`);
          }
        }
      });
    });
  });

  scores.forEach((entry) => {
    if (entry.excluded) return;
    const { tool } = entry;
    if (needs.freeGpu && !toolHasCapability(tool, "free_gpu")) {
      entry.score += data.weights.penalties.needs_free_gpu_but_tool_has_none ?? -25;
      entry.penalties.push("Requires free GPU but this tool does not provide it on the free tier");
    }
    if (needs.customDomain && !toolHasCapability(tool, "custom_domain")) {
      entry.score += data.weights.penalties.needs_custom_domain_but_tool_lacks ?? -20;
      entry.penalties.push("Custom domain requested but not available on free tier");
    }
    if (needs.privateProjects && !capabilityIsEnabled(tool, "private_projects")) {
      entry.score += data.weights.penalties.private_required_but_only_public ?? -30;
      entry.penalties.push("Private/internal access requested but tool prioritises public projects");
    }
    if (needs.mobile && tool.category !== "builder" && tool.category !== "automation") {
      if (!toolHasCapability(tool, "mobile")) {
        entry.score += data.weights.penalties.mobile_required_but_tool_is_web_only ?? -25;
        entry.penalties.push("Mobile experience requested but this tool focuses on web");
      }
    }
  });

  const filtered = scores.filter((entry) => !entry.excluded);
  if (!filtered.length) return null;

  filtered.sort((a, b) => b.score - a.score);

  const selected: ToolCaps[] = [];
  const usedCategories = new Set<string>();

  filtered.forEach((entry) => {
    if (selected.length >= 3) return;
    if (!usedCategories.has(entry.tool.category)) {
      selected.push(entry.tool);
      usedCategories.add(entry.tool.category);
    }
  });

  filtered.forEach((entry) => {
    data.weights.combo_rules.forEach((rule) => {
      const conditionMet = rule.if.every((token) => {
        const [category, name] = token.split(":");
        if (!category || !name) return false;
        return selected.some((tool) => tool.category === category && tool.tool === name);
      });
      if (conditionMet && rule.then_add) {
        rule.then_add.forEach((token) => {
          const [category, name] = token.split(":");
          const toolToAdd = data.tools.find((tool) => tool.category === category && tool.tool === name);
          if (toolToAdd && !selected.some((tool) => tool.tool === toolToAdd.tool)) {
            selected.push(toolToAdd);
          }
        });
      }
      if (conditionMet && rule.then_penalize) {
        rule.then_penalize.forEach((penaltyKey) => {
          const weight =
            data.weights.penalties[penaltyKey as keyof typeof data.weights.penalties] ?? -12;
          entry.score += weight;
          entry.penalties.push(penaltyKey.replace(/_/g, " "));
        });
      }
    });
  });

  const curatedMatch = data.curated.find((item) => {
    if (item.stack.length !== selected.length) return false;
    return item.stack.every((tool) => selected.some((sel) => sel.tool === tool));
  });

  const summary = curatedMatch
    ? curatedMatch.summary
    : buildAutoSummary(selected);

  const why: WhyItem[] = selected.map((tool) => {
    const matched = filtered.find((entry) => entry.tool.tool === tool.tool);
    return {
      tool: tool.tool,
      boosts: matched ? Object.values(matched.boosts).flat() : [],
      requirements_met: matched ? Array.from(matched.requirements).map(humanizeCapability) : [],
      penalties: matched ? matched.penalties : [],
    };
  });

  const tradeoffs = Array.from(
    new Set(why.flatMap((item) => item.penalties))
  );

  const alternatives = filtered
    .filter((entry) => !selected.some((tool) => tool.tool === entry.tool.tool))
    .slice(0, 2)
    .map((entry) => ({
      stack: [entry.tool.tool],
      when: "Consider if you prefer their specialty features.",
    }));

  return {
    stack: selected.map((tool) => tool.tool),
    summary,
    why,
    tradeoffs,
    alternatives,
  };
};

const buildAutoSummary = (tools: ToolCaps[]) => {
  if (!tools.length) return "Select answers to generate a stack recommendation.";
  const categories = new Map<string, string>();
  tools.forEach((tool) => {
    categories.set(tool.category, tool.tool);
  });
  const parts = Array.from(categories.entries()).map(
    ([category, tool]) => `${humanizeCapability(category)} with ${tool}`
  );
  return parts.join(" • ");
};

const buildToolLinkMap = (loaded: LoadedData) => {
  const map = new Map<string, string>();

  const assignIfMatch = (toolName: string, url?: string) => {
    if (!url) return;
    const key = normalizeToolKey(toolName);
    if (!map.has(key)) {
      map.set(key, url);
    }
  };

  const toolNames = loaded.tools.map((tool) => tool.tool);

  loaded.intro.quick_start.forEach((link) => {
    const url = parseMarkdownUrl(link.url);
    toolNames.forEach((toolName) => {
      if (link.title.toLowerCase().includes(toolName.toLowerCase())) {
        assignIfMatch(toolName, url);
      }
    });
  });

  loaded.curated.forEach((entry) => {
    entry.stack.forEach((toolName) => {
      const button = entry.buttons.find((btn) =>
        btn.label.toLowerCase().includes(toolName.toLowerCase())
      );
      assignIfMatch(toolName, parseMarkdownUrl(button?.url));
    });
  });

  loaded.integrations.forEach((integration) => {
    integration.tools_involved.forEach((toolName) => {
      const match = loaded.intro.quick_start.find((link) =>
        link.title.toLowerCase().includes(toolName.toLowerCase())
      );
      assignIfMatch(toolName, parseMarkdownUrl(match?.url));
    });
  });

  return map;
};

type RecommenderSectionProps = {
  data: LoadedData;
  persisted: PersistedState;
  setPersisted: Dispatch<SetStateAction<PersistedState>>;
  progress: number;
  recommended: RecoResult | null;
  toolLinks: Map<string, string>;
};

const RecommenderSection = ({
  data,
  persisted,
  setPersisted,
  progress,
  recommended,
  toolLinks,
}: RecommenderSectionProps) => {
  const handleSelect = (questionIndex: number, optionIndex: number, multi: boolean) => {
    setPersisted((prev) => {
      const existing = prev.answers[questionIndex] ?? [];
      let nextSelections: number[];
      if (multi) {
        if (existing.includes(optionIndex)) {
          nextSelections = existing.filter((idx) => idx !== optionIndex);
        } else {
          nextSelections = [...existing, optionIndex];
        }
      } else {
        nextSelections = [optionIndex];
      }
      return {
        ...prev,
        answers: {
          ...prev.answers,
          [questionIndex]: nextSelections,
        },
      };
    });
  };

  const sectionDescription = data.sectionsMeta.section_descriptions["recommender"];

  return (
    <div>
      <header className="mb-8">
        <div className="flex items-center gap-2 text-sm font-medium text-primary uppercase tracking-[0.3em]">
          <Workflow className="h-4 w-4" aria-hidden="true" />
          Interactive Recommender
        </div>
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h2 tabIndex={-1} className="font-display text-3xl md:text-4xl font-semibold mt-2">
              Build Your Stack
            </h2>
            <p className="text-muted-foreground max-w-3xl mt-2">
              {sectionDescription}
            </p>
          </div>
          <div className="w-full sm:w-64">
            <Progress value={progress} aria-describedby="reco-progress-label" />
            <div id="reco-progress-label" className="text-xs text-muted-foreground mt-1">
              {progress}% answered
            </div>
          </div>
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr),minmax(0,320px)] lg:items-start">
        <div className="space-y-4">
          {data.questions.map((question, qIdx) => {
            const multi = multiSelectQuestions.has(question.question);
            const selected = persisted.answers[qIdx] ?? [];
            return (
              <Card key={question.question} className="glass-card-soft ring-gradient-glow">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-semibold">
                    {question.question}
                  </CardTitle>
                  {multi && (
                    <CardDescription>Select all that apply.</CardDescription>
                  )}
                </CardHeader>
                <CardContent className="grid gap-2">
                  {question.options.map((option, oIdx) => {
                    const isActive = selected.includes(oIdx);
                    return (
                      <button
                        key={option.text}
                        type="button"
                        className={`rounded-md border px-4 py-3 text-left transition hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                          isActive
                            ? "border-primary bg-primary/10"
                            : "border-border bg-background"
                        }`}
                        onClick={() => handleSelect(qIdx, oIdx, multi)}
                        aria-pressed={isActive}
                      >
                        <div className="flex items-start gap-3">
                          <span
                            className={`mt-1 h-4 w-4 rounded border flex items-center justify-center ${
                              isActive ? "bg-primary border-primary" : "border-muted"
                            }`}
                            aria-hidden="true"
                          >
                            {isActive && <Check className="h-3 w-3 text-primary-foreground" />}
                          </span>
                          <span>{option.text}</span>
                        </div>
                      </button>
                    );
                  })}
                </CardContent>
              </Card>
            );
          })}
        </div>

        <aside className="sticky top-28 space-y-4">
          <RecommendationPanel
            recommended={recommended}
            persisted={persisted}
            setPersisted={setPersisted}
            curated={data.curated}
            toolLinks={toolLinks}
          />
        </aside>
      </div>
    </div>
  );
};

type RecommendationPanelProps = {
  recommended: RecoResult | null;
  persisted: PersistedState;
  setPersisted: Dispatch<SetStateAction<PersistedState>>;
  curated: CuratedOutput[];
  toolLinks: Map<string, string>;
};

const RecommendationPanel = ({
  recommended,
  persisted,
  setPersisted,
  curated,
  toolLinks,
}: RecommendationPanelProps) => {
  const savedStacks = persisted.savedStacks;
  const curatedButtons =
    recommended &&
    curated.find((item) => item.stack.length === recommended.stack.length && item.stack.every((tool) => recommended.stack.includes(tool)));

  const handleSaveStack = () => {
    if (!recommended) return;
    setPersisted((prev) => ({
      ...prev,
      savedStacks: [
        {
          id: `stack-${Date.now()}`,
          stack: recommended.stack,
          summary: recommended.summary,
          generatedAt: Date.now(),
          source: "recommender",
        },
        ...prev.savedStacks,
      ],
    }));
    toast.success("Stack saved for later.");
  };

  const handleCopyResult = async () => {
    if (!recommended) return;
    const text = [
      "DecodeAI No-Code stack recommendation:",
      `Stack: ${recommended.stack.join(" + ")}`,
      `Summary: ${recommended.summary}`,
      recommended.tradeoffs.length
        ? `Trade-offs: ${recommended.tradeoffs.join("; ")}`
        : undefined,
    ]
      .filter(Boolean)
      .join("\n");
    await navigator.clipboard.writeText(text);
    toast.success("Recommendation copied to clipboard.");
  };

  return (
    <Card className="glass-card-soft border-purple-500/30 ring-gradient-glow">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" aria-hidden="true" />
          Recommended Stack
        </CardTitle>
        <CardDescription>
          Save, copy, or explore the recommended combination.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {recommended ? (
          <>
            <div className="flex flex-wrap gap-2">
              {recommended.stack.map((tool) => (
                <Badge key={tool} variant="secondary" className="text-sm py-1 px-2 flex items-center gap-1">
                  <Layers className="h-3.5 w-3.5" aria-hidden="true" />
                  {tool}
                </Badge>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">{recommended.summary}</p>
            <div className="space-y-3">
              <div>
                <h4 className="font-semibold text-sm mb-2">Why this stack?</h4>
                <ul className="space-y-2 text-sm">
                  {recommended.why.map((item) => (
                    <li key={item.tool} className="rounded-md border border-muted p-3">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{item.tool}</span>
                        <Badge variant="outline">{item.requirements_met.length} requirements</Badge>
                      </div>
                      {!!item.boosts.length && (
                        <div className="mt-2 text-muted-foreground">
                          {item.boosts[0]}
                          {item.boosts.length > 1 ? "…" : ""}
                        </div>
                      )}
                      {!!item.penalties.length && (
                        <div className="mt-2 text-xs text-amber-600">
                          Trade-off: {item.penalties[0]}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
              {!!recommended.tradeoffs.length && (
                <div>
                  <h4 className="font-semibold text-sm mb-2">Trade-offs</h4>
                  <ul className="space-y-1 text-xs text-amber-600">
                    {recommended.tradeoffs.map((tradeoff) => (
                      <li key={tradeoff} className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4" aria-hidden="true" />
                        <span>{tradeoff}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <div className="grid gap-2">
              {curatedButtons ? (
                curatedButtons.buttons.map((button) => (
                  <Button
                    key={button.label}
                    asChild
                    variant="outline"
                    size="sm"
                    className="justify-between"
                  >
                    <a href={parseMarkdownUrl(button.url)} target="_blank" rel="noopener noreferrer">
                      {button.label}
                      <ExternalLink className="h-4 w-4" aria-hidden="true" />
                    </a>
                  </Button>
                ))
              ) : (
                recommended.stack.map((tool) => {
                  const url = toolLinks.get(normalizeToolKey(tool));
                  if (!url) return null;
                  return (
                    <Button key={tool} asChild variant="outline" size="sm" className="justify-between">
                      <a href={url} target="_blank" rel="noopener noreferrer">
                        {tool}
                        <ExternalLink className="h-4 w-4" aria-hidden="true" />
                      </a>
                    </Button>
                  );
                })
              )}
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" className="flex-1" onClick={handleCopyResult}>
                  <Copy className="h-4 w-4 mr-1.5" aria-hidden="true" />
                  Copy result
                </Button>
                <Button variant="default" size="sm" className="flex-1" onClick={handleSaveStack}>
                  <Save className="h-4 w-4 mr-1.5" aria-hidden="true" />
                  Save stack
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="rounded-md border border-dashed border-muted p-6 text-center text-muted-foreground text-sm">
            Answer the questions to generate a tailored stack recommendation.
          </div>
        )}
        {!!savedStacks.length && (
          <div className="rounded-md bg-muted/50 p-3">
            <h4 className="text-xs uppercase tracking-widest text-muted-foreground">
              Saved stacks
            </h4>
            <ul className="mt-2 space-y-1 text-sm">
              {savedStacks.slice(0, 3).map((stack) => (
                <li key={stack.id} className="flex items-center justify-between text-muted-foreground">
                  <span>{stack.stack.join(" + ")}</span>
                  <span className="text-[11px] uppercase">{stack.source}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

type DeployChecklistProps = {
  steps: DeployStep[];
  persisted: PersistedState;
  setPersisted: Dispatch<SetStateAction<PersistedState>>;
  description?: string;
};

const DeployChecklist = ({ steps, persisted, setPersisted, description }: DeployChecklistProps) => {
  const completedCount = steps.filter((step) => persisted.deployProgress[step.id]).length;
  const remainingMinutes = steps
    .filter((step) => !persisted.deployProgress[step.id])
    .reduce((sum, step) => sum + step.minutes, 0);

  return (
    <section>
      <header className="mb-6">
        <div className="flex items-center gap-2 text-sm uppercase tracking-[0.3em] text-primary font-medium">
          <RocketIcon />
          Deploy Checklist
        </div>
        <h2 tabIndex={-1} className="font-display text-3xl font-semibold mt-1">
          Launch Checklist
        </h2>
        {description && <p className="text-muted-foreground mt-2 max-w-3xl">{description}</p>}
        <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <span>{completedCount}/{steps.length} steps complete</span>
          <span>Remaining time: {formatDuration(remainingMinutes)}</span>
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        {steps.map((step, idx) => {
          const isDone = Boolean(persisted.deployProgress[step.id]);
          const url = parseMarkdownUrl(step.link);
          return (
            <Card key={step.id} className={`glass-card-soft transition border-l-4 ${isDone ? "border-l-emerald-500" : "border-l-primary/50"}`}>
              <CardHeader className="pb-2 flex flex-row items-start justify-between gap-3">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Checkbox
                      checked={isDone}
                      onCheckedChange={(checked) => {
                        setPersisted((prev) => ({
                          ...prev,
                          deployProgress: {
                            ...prev.deployProgress,
                            [step.id]: Boolean(checked),
                          },
                        }));
                      }}
                      aria-label={`Mark ${step.title} as ${isDone ? "incomplete" : "complete"}`}
                    />
                    Step {idx + 1}: {step.title}
                  </CardTitle>
                  <CardDescription>{formatDuration(step.minutes)}</CardDescription>
                </div>
                {url && (
                  <Button variant="ghost" size="icon" asChild aria-label="Open step link">
                    <a href={url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                )}
              </CardHeader>
            </Card>
          );
        })}
      </div>
    </section>
  );
};

const RocketIcon = () => <Brain className="h-4 w-4" aria-hidden="true" />;

type IntegrationsDeckProps = {
  cards: IntegrationCard[];
  description?: string;
  quickLinks: Intro["quick_start"];
};

const IntegrationsDeck = ({ cards, description, quickLinks }: IntegrationsDeckProps) => {
  const urls = new Map<string, string>();
  quickLinks.forEach((item) => {
    const cleaned = item.title.replace(/Explore|Try|Launch|Deploy|Build|Create Apps with|Automate with|AI with|Appgyver Platform|Microsoft /g, "").trim();
    urls.set(cleaned, parseMarkdownUrl(item.url));
  });

  return (
    <div>
      <header className="mb-6">
        <div className="flex items-center gap-2 text-sm uppercase tracking-[0.3em] text-primary font-medium">
          <Share2 className="h-4 w-4" aria-hidden="true" />
          Integrations
        </div>
        <h2 tabIndex={-1} className="font-display text-3xl font-semibold mt-1">
          Connect Your Tools
        </h2>
        {description && <p className="text-muted-foreground mt-2 max-w-3xl">{description}</p>}
      </header>
      <div className="grid gap-4 md:grid-cols-2">
        {cards.map((card) => {
          const firstLink = urls.get(card.tools_involved[0]) ?? urls.get(card.tools_involved[1] ?? "");
          return (
            <Card key={card.title} className="flex flex-col glass-card-soft ring-gradient-glow">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Workflow className="h-4 w-4 text-primary" aria-hidden="true" />
                  {card.title}
                </CardTitle>
                <CardDescription>
                  {card.tools_involved.join(" + ")}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 space-y-3">
                <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
                  {card.steps.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
                {card.pitfalls && (
                  <div className="rounded-md bg-amber-100/70 text-amber-800 text-sm p-3">
                    Pitfall: {card.pitfalls}
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      await navigator.clipboard.writeText(card.steps.join("\n"));
                      toast.success("Integration steps copied to clipboard.");
                    }}
                  >
                    <ClipboardCopy className="h-4 w-4 mr-1.5" aria-hidden="true" />
                    Copy steps
                  </Button>
                  {firstLink && (
                    <Button variant="secondary" size="sm" asChild>
                      <a href={firstLink} target="_blank" rel="noopener noreferrer">
                        Open docs
                        <ExternalLink className="h-4 w-4 ml-1" />
                      </a>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

type LimitsTableProps = {
  limits: LimitRow[];
  description?: string;
};

const LimitsTable = ({ limits, description }: LimitsTableProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const filtered = limits.filter((row) =>
    row.tool.toLowerCase().includes(searchTerm.toLowerCase())
  );
  return (
    <div>
      <header className="mb-6">
        <div className="flex items-center gap-2 text-sm uppercase tracking-[0.3em] text-primary font-medium">
          <Info className="h-4 w-4" aria-hidden="true" />
          Free Tier Limits
        </div>
        <h2 tabIndex={-1} className="font-display text-3xl font-semibold mt-1">
          Understand Free Tiers
        </h2>
        {description && <p className="text-muted-foreground mt-2 max-w-3xl">{description}</p>}
        <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1 rounded-md bg-muted px-3 py-1">
            <SleepIcon />
            “Sleep” shows when free apps pause or shut down when idle.
          </span>
        </div>
      </header>

      <div className="rounded-lg border">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Search className="h-4 w-4" aria-hidden="true" />
            <Input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search tools…"
              className="h-8 w-48"
              aria-label="Filter limits by tool"
            />
          </div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground hidden md:block">
            Tool | Free Tier | Limit | Build Time | Sleep | Notes
          </div>
        </div>
        <ScrollArea className="max-h-[480px]">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-background">
              <tr className="text-left">
                <th className="sticky left-0 bg-background px-4 py-2">Tool</th>
                <th className="px-4 py-2">Free Tier</th>
                <th className="px-4 py-2">Limit</th>
                <th className="px-4 py-2">Build Time</th>
                <th className="px-4 py-2">Sleep</th>
                <th className="px-4 py-2">Notes</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr key={row.tool} className="border-t">
                  <td className="sticky left-0 bg-background px-4 py-3 font-medium">
                    {row.tool}
                  </td>
                  <td className="px-4 py-3">{row.free_tier}</td>
                  <td className="px-4 py-3">{row.limit}</td>
                  <td className="px-4 py-3">{row.build_time}</td>
                  <td className="px-4 py-3">{row.sleep}</td>
                  <td className="px-4 py-3 text-muted-foreground">{row.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </ScrollArea>
      </div>
    </div>
  );
};

const SleepIcon = () => <Layers className="h-4 w-4" aria-hidden="true" />;

type TroubleshootAccordionProps = {
  rows: TroubleshootRow[];
  description?: string;
};

const TroubleshootAccordion = ({ rows, description }: TroubleshootAccordionProps) => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div>
      <header className="mb-6">
        <div className="flex items-center gap-2 text-sm uppercase tracking-[0.3em] text-primary font-medium">
          <AlertCircle className="h-4 w-4" aria-hidden="true" />
          Troubleshooting
        </div>
        <h2 tabIndex={-1} className="font-display text-3xl font-semibold mt-1">
          Fix Common Issues
        </h2>
        {description && <p className="text-muted-foreground mt-2 max-w-3xl">{description}</p>}
      </header>
      <div className="space-y-3">
        {rows.map((row, idx) => {
          const isOpen = openIndex === idx;
          const severity = determineSeverity(row.issue, row.cause);
          return (
            <div key={row.issue} className="rounded-lg glass-card-softer transition">
              <button
                type="button"
                className="flex w-full cursor-pointer items-center justify-between gap-4 px-4 py-3 text-left text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                onClick={() => setOpenIndex(isOpen ? null : idx)}
                aria-expanded={isOpen}
                aria-controls={`troubleshoot-${idx}`}
              >
                <span className="flex items-center gap-3">
                  <Badge variant={severity === "blocking deploy" ? "destructive" : "secondary"}>
                    {severity}
                  </Badge>
                  {row.issue}
                </span>
                {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    id={`troubleshoot-${idx}`}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t px-4 py-3 space-y-3"
                  >
                    <p className="text-sm">
                      <strong>Cause:</strong> {row.cause}
                    </p>
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="text-sm">
                        <strong>Fix:</strong> {row.fix}
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          await navigator.clipboard.writeText(row.fix);
                          toast.success("Fix copied.");
                        }}
                      >
                        <Clipboard className="h-4 w-4 mr-1.5" />
                        Copy fix
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
};

type ShowcaseGridProps = {
  showcases: Showcase[];
  description?: string;
};

const ShowcaseGrid = ({ showcases, description }: ShowcaseGridProps) => {
  const [revealed, setRevealed] = useState(false);
  const sectionRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!sectionRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setRevealed(true);
          }
        });
      },
      { threshold: 0.2 }
    );
    observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={sectionRef}>
      <header className="mb-6">
        <div className="flex items-center gap-2 text-sm uppercase tracking-[0.3em] text-primary font-medium">
          <Play className="h-4 w-4" aria-hidden="true" />
          Showcases
        </div>
        <h2 tabIndex={-1} className="font-display text-3xl font-semibold mt-1">
          See it in Action
        </h2>
        {description && <p className="text-muted-foreground mt-2 max-w-3xl">{description}</p>}
      </header>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {(revealed ? showcases : Array.from({ length: 6 })).map((item, idx) => (
          <Card key={item ? item.title : idx} className="flex flex-col overflow-hidden glass-card-soft ring-gradient-glow">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{item ? item.title : "Loading demo…"}</CardTitle>
              {item && (
                <CardDescription className="flex flex-wrap gap-2">
                  {item.tags.map((tag) => (
                    <Badge key={tag} variant="outline">{tag}</Badge>
                  ))}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent className="flex-1 space-y-3">
              <p className="text-sm text-muted-foreground">
                {item ? item.description : "Prefetching showcase details…"}
              </p>
            </CardContent>
            {item && (
              <div className="px-4 pb-4">
                <Button asChild variant="outline" size="sm" className="w-full justify-between">
                  <a href={parseMarkdownUrl(item.buttonHref)} target="_blank" rel="noopener noreferrer">
                    {item.buttonText}
                    <ExternalLink className="h-4 w-4" aria-hidden="true" />
                  </a>
                </Button>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
};


type StarterKitsProps = {
  kits: StarterKit[];
  description?: string;
  onSaveStack: (kit: StarterKit) => void;
};

const StarterKits = ({ kits, description, onSaveStack }: StarterKitsProps) => {
  const [activeKit, setActiveKit] = useState<StarterKit | null>(null);

  const handleCopyPrompt = async () => {
    if (!activeKit) return;
    await navigator.clipboard.writeText(activeKit.prompt);
    toast.success("Prompt copied to clipboard.");
  };

  return (
    <div>
      <header className="mb-6">
        <div className="flex items-center gap-2 text-sm uppercase tracking-[0.3em] text-primary font-medium">
          <Plus className="h-4 w-4" aria-hidden="true" />
          Starter Kits
        </div>
        <h2 tabIndex={-1} className="font-display text-3xl font-semibold mt-1">
          Jumpstart Templates
        </h2>
        {description && <p className="text-muted-foreground mt-2 max-w-3xl">{description}</p>}
      </header>
      <div className="grid gap-4 md:grid-cols-2">
        {kits.map((kit) => (
          <Card key={kit.name} className="flex flex-col glass-card-soft ring-gradient-glow">
            <CardHeader className="pb-2">
              <CardTitle>{kit.name}</CardTitle>
              <CardDescription>{kit.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 space-y-3">
              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                {kit.stack.map((tool) => (
                  <Badge key={tool} variant="outline">
                    {tool}
                  </Badge>
                ))}
              </div>
            </CardContent>
            <div className="px-4 pb-4 flex flex-col gap-2 sm:flex-row">
              <Button
                variant="secondary"
                size="sm"
                className="flex-1"
                onClick={() => setActiveKit(kit)}
              >
                Generate with Prompt
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onSaveStack(kit)}
                className="flex-1"
              >
                <Save className="h-4 w-4 mr-1.5" aria-hidden="true" />
                Add to saved stack
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={Boolean(activeKit)} onOpenChange={(open) => !open && setActiveKit(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{activeKit?.name}</DialogTitle>
            <DialogDescription>
              Copy this prompt into your favorite builder or AI assistant.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={activeKit?.prompt ?? ""}
            readOnly
            className="min-h-[220px] font-mono text-sm whitespace-pre-wrap"
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setActiveKit(null)}>
              Close
            </Button>
            <Button onClick={handleCopyPrompt}>
              <ClipboardCopy className="h-4 w-4 mr-1.5" aria-hidden="true" />
              Copy Prompt
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

type ComparisonMatrixProps = {
  rows: ComparisonRow[];
  description?: string;
};

const ComparisonMatrix = ({ rows, description }: ComparisonMatrixProps) => {
  const legend = [
    { symbol: "✅", meaning: "Available" },
    { symbol: "⚠️", meaning: "Limited / partial" },
    { symbol: "❌", meaning: "Not available" },
  ];

  const tools = Object.keys(rows[0]).filter((key) => key !== "feature");

  return (
    <div>
      <header className="mb-6">
        <div className="flex items-center gap-2 text-sm uppercase tracking-[0.3em] text-primary font-medium">
          <Layers className="h-4 w-4" aria-hidden="true" />
          Feature Comparison
        </div>
        <h2 tabIndex={-1} className="font-display text-3xl font-semibold mt-1">
          Compare Platforms
        </h2>
        {description && <p className="text-muted-foreground mt-2 max-w-3xl">{description}</p>}
        <div className="mt-3 flex gap-2 text-xs text-muted-foreground">
          {legend.map((item) => (
            <span key={item.symbol} className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1">
              {item.symbol} = {item.meaning}
            </span>
          ))}
        </div>
      </header>
      <ScrollArea className="max-h-[520px]">
        <table className="min-w-full text-sm border rounded-lg overflow-hidden">
          <thead className="bg-muted/50">
            <tr>
              <th className="sticky left-0 bg-muted/50 px-4 py-2 text-left">Feature</th>
              {tools.map((tool) => (
                <th key={tool} className="px-4 py-2 text-left whitespace-nowrap">
                  {tool}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.feature} className="border-t">
                <td className="sticky left-0 bg-background px-4 py-2 font-medium">
                  {row.feature}
                </td>
                {tools.map((tool) => (
                  <td key={tool} className="px-4 py-2">
                    {row[tool]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </ScrollArea>
    </div>
  );
};

type LaunchPlanGeneratorProps = {
  description?: string;
  launchConfig: LaunchPlanConfig;
  tools: ToolCaps[];
  currentStack: string[];
  persisted: PersistedState;
  setPersisted: Dispatch<SetStateAction<PersistedState>>;
};

type BaseTask = {
  id: string;
  title: string;
  baseMinutes: number;
  notes: {
    solo: string;
    small: string;
    bigger: string;
  };
};

const PROTOTYPE_TASKS: BaseTask[] = [
  {
    id: "prototype-sketch",
    title: "Sketch core idea and key screens",
    baseMinutes: 120,
    notes: {
      solo: "Map flows yourself and lock in the primary screens.",
      small: "Designer drafts screens; Owner confirms scope the same day.",
      bigger: "PM gathers inputs while Designer produces wireframes for sign-off.",
    },
  },
  {
    id: "prototype-clickable-ui",
    title: "Build basic clickable UI",
    baseMinutes: 150,
    notes: {
      solo: "Assemble a tappable UI so you can demo the flow end to end.",
      small: "Designer preps components while Dev hooks up navigation.",
      bigger: "Frontend builds layout components; PM reviews interactions for clarity.",
    },
  },
  {
    id: "prototype-mock-data",
    title: "Connect mock data (fake API / sample CSV)",
    baseMinutes: 90,
    notes: {
      solo: "Hook up example data so you can click through the flow.",
      small: "Dev wires sample data; Designer checks states and empty views.",
      bigger: "Backend seeds mock API while QA verifies sample responses.",
    },
  },
  {
    id: "prototype-main-actions",
    title: "Add main actions (forms, buttons, state)",
    baseMinutes: 150,
    notes: {
      solo: "Wire the must-have actions from input to success state.",
      small: "Dev implements key actions; Owner validates acceptance criteria.",
      bigger: "Frontend owns UI logic; Backend reviews state handling; QA signs off.",
    },
  },
  {
    id: "prototype-testing",
    title: "Test with 2–3 users and collect notes",
    baseMinutes: 180,
    notes: {
      solo: "Run informal sessions and capture every insight in one doc.",
      small: "Owner leads tests while Designer logs notes for quick iteration.",
      bigger: "PM schedules sessions; QA records findings for the backlog.",
    },
  },
  {
    id: "prototype-polish",
    title: "Polish visuals and fix small bugs",
    baseMinutes: 120,
    notes: {
      solo: "Tighten spacing, colors, and squash any obvious issues.",
      small: "Designer polishes UI while Dev tackles the bug list.",
      bigger: "Frontend sweeps UI polish; QA retests before sharing updates.",
    },
  },
  {
    id: "prototype-demo",
    title: "Record short demo and share link",
    baseMinutes: 90,
    notes: {
      solo: "Record a quick walkthrough and send it to stakeholders.",
      small: "Owner narrates the demo; Designer edits visuals before sharing.",
      bigger: "PM scripts the demo; QA ensures the flow stays stable during recording.",
    },
  },
];

const PILOT_TASKS: BaseTask[] = [
  {
    id: "pilot-feedback",
    title: "Review prototype feedback and define MVP scope",
    baseMinutes: 240,
    notes: {
      solo: "Consolidate feedback and list the exact MVP deliverables.",
      small: "Owner synthesizes notes while Designer and Dev agree on scope.",
      bigger: "PM runs planning; Frontend and Backend align on effort and risks.",
    },
  },
  {
    id: "pilot-auth",
    title: "Implement authentication / login",
    baseMinutes: 300,
    notes: {
      solo: "Add simple auth so early users can sign in safely.",
      small: "Dev builds login while Designer checks copy and flow.",
      bigger: "Backend owns auth; QA covers edge cases and PM documents access rules.",
    },
  },
  {
    id: "pilot-live-data",
    title: "Connect to live data / storage",
    baseMinutes: 300,
    notes: {
      solo: "Point the app to production-ready data sources.",
      small: "Dev hooks up live storage while Owner reviews mapping.",
      bigger: "Backend integrates data; QA validates schemas; PM tracks rollout.",
    },
  },
  {
    id: "pilot-analytics",
    title: "Add analytics and error logging",
    baseMinutes: 210,
    notes: {
      solo: "Install basic analytics and error reporting.",
      small: "Dev instruments events; Owner checks dashboards for clarity.",
      bigger: "Backend enables logging; PM documents metrics; QA verifies events.",
    },
  },
  {
    id: "pilot-early-tests",
    title: "Test with 5 early users and gather feedback",
    baseMinutes: 240,
    notes: {
      solo: "Schedule early testers and capture qualitative feedback.",
      small: "Owner runs sessions while Designer updates the insight deck.",
      bigger: "PM coordinates testers; QA tracks issues; Frontend triages fixes.",
    },
  },
  {
    id: "pilot-bug-fixes",
    title: "Patch bugs and refine UX",
    baseMinutes: 240,
    notes: {
      solo: "Fix major bugs and smooth rough edges before launch.",
      small: "Dev handles fixes while Designer iterates on confusing flows.",
      bigger: "Frontend and Backend patch issues; PM logs decisions; QA rechecks flows.",
    },
  },
  {
    id: "pilot-deploy",
    title: "Deploy first live version",
    baseMinutes: 180,
    notes: {
      solo: "Push the pilot build and monitor closely.",
      small: "Dev handles deploy while Owner announces to the pilot group.",
      bigger: "Backend runs deploy; PM communicates rollout; QA monitors health.",
    },
  },
];

const PRODUCTION_TASKS: BaseTask[] = [
  {
    id: "production-cleanup",
    title: "Code cleanup and performance tuning",
    baseMinutes: 360,
    notes: {
      solo: "Refactor hotspots and improve load times yourself.",
      small: "Dev tunes performance while Owner tracks before/after metrics.",
      bigger: "Backend leads cleanup; PM captures benchmarks; QA verifies gains.",
    },
  },
  {
    id: "production-core-features",
    title: "Add payments or other core features",
    baseMinutes: 420,
    notes: {
      solo: "Ship the critical revenue or feature work personally.",
      small: "Dev builds payments while Designer reviews UX and copy.",
      bigger: "Backend owns feature build; Frontend polishes UI; PM documents release notes.",
    },
  },
  {
    id: "production-hardening",
    title: "Strengthen error handling and auth",
    baseMinutes: 300,
    notes: {
      solo: "Harden auth flows and add guardrails for failures.",
      small: "Dev updates auth; QA stress-tests flows; Owner updates policies.",
      bigger: "Backend expands safeguards; QA runs failure drills; PM records procedures.",
    },
  },
  {
    id: "production-monitoring",
    title: "Integrate monitoring and logging",
    baseMinutes: 240,
    notes: {
      solo: "Set up full monitoring dashboards and alerts.",
      small: "Dev configures monitoring while Owner reviews alert routing.",
      bigger: "Backend establishes observability; PM sets playbooks; QA validates alerts.",
    },
  },
  {
    id: "production-qa",
    title: "Run QA / testing cycles",
    baseMinutes: 360,
    notes: {
      solo: "Execute comprehensive smoke tests before launch.",
      small: "QA leads test passes; Dev fixes blockers; Owner signs off.",
      bigger: "QA coordinates cycles; PM tracks status; Frontend and Backend handle fixes.",
    },
  },
  {
    id: "production-docs",
    title: "Create documentation and handoff notes",
    baseMinutes: 300,
    notes: {
      solo: "Write deployment notes and usage docs yourself.",
      small: "Owner drafts docs; Designer adds visuals; Dev reviews accuracy.",
      bigger: "PM compiles docs; QA adds edge cases; Frontend contributes usage tips.",
    },
  },
  {
    id: "production-launch",
    title: "Deploy stable version for public use",
    baseMinutes: 240,
    notes: {
      solo: "Ship the public release and monitor metrics personally.",
      small: "Dev deploys while Owner manages comms and follow-up.",
      bigger: "PM drives launch plan; Backend handles production deploy; QA monitors health.",
    },
  },
];

const getBaseTasksForTemplate = (template?: LaunchTemplate | null): BaseTask[] => {
  if (!template) return PROTOTYPE_TASKS;
  const title = template.title.toLowerCase();
  const id = template.id.toLowerCase();
  if (title.includes("90") || id.includes("90")) return PRODUCTION_TASKS;
  if (title.includes("pilot") || id.includes("pilot")) return PILOT_TASKS;
  if (title.includes("production") || id.includes("production")) return PRODUCTION_TASKS;
  return PROTOTYPE_TASKS;
};

const getTeamMode = (teamSize: number): "solo" | "small" | "bigger" => {
  if (teamSize <= 1) return "solo";
  if (teamSize <= 4) return "small";
  return "bigger";
};

const OWNER_SEQUENCES: Record<"solo" | "small" | "bigger", string[]> = {
  solo: ["Owner"],
  small: ["Owner", "Designer", "Dev", "QA"],
  bigger: ["PM", "Frontend", "Backend", "QA"],
};

const LaunchPlanGenerator = ({
  description,
  launchConfig,
  tools,
  currentStack,
  persisted,
  setPersisted,
}: LaunchPlanGeneratorProps) => {
  const [projectName, setProjectName] = useState("My DecodeAI Launch");
  const [targetDate, setTargetDate] = useState<string | undefined>(undefined);
  const [teamSize, setTeamSize] = useState(2);
  const [priority, setPriority] = useState<"prototype" | "production">("prototype");
  const [selectedTemplate, setSelectedTemplate] = useState<LaunchTemplate | null>(
    launchConfig.templates[0] ?? null
  );
  const [generatedPlan, setGeneratedPlan] = useState<SavedLaunchPlan | null>(null);

  const generatePlan = () => {
    if (!selectedTemplate) return;
    const baseTasks = getBaseTasksForTemplate(selectedTemplate);
    const mode = getTeamMode(teamSize);
    const owners = OWNER_SEQUENCES[mode];
    const baseScale = selectedTemplate.task_scale;
    const priorityScale = priority === "production" ? 1.15 : 1;
    const modeScale = mode === "bigger" ? 1.1 : mode === "solo" ? 0.9 : 1;

    const startDate = targetDate ? new Date(targetDate) : new Date();
    if (!targetDate) {
      startDate.setDate(startDate.getDate() + selectedTemplate.horizon_days);
    }

    const totalTasks = baseTasks.length || 1;

    const tasks: PlanTask[] = baseTasks.map((task, idx) => {
      const scaledMinutes = Math.max(
        30,
        Math.round(task.baseMinutes * baseScale * priorityScale * modeScale)
      );
      const milestone = (idx + 1) % 3 === 0;
      const due = new Date(startDate);
      due.setDate(
        due.getDate() -
          Math.max(
            0,
            selectedTemplate.horizon_days -
              Math.round(((idx + 1) / totalTasks) * selectedTemplate.horizon_days)
          )
      );
      const owner = owners[idx % owners.length];
      const note = task.notes[mode];
      return {
        id: task.id,
        title: task.title,
        minutes: task.baseMinutes,
        scaledMinutes,
        dueDate: due.toISOString(),
        milestone,
        roleSuggestion: `${owner}${note ? ` (${note})` : ""}`,
      };
    });

    const plan: SavedLaunchPlan = {
      id: `plan-${Date.now()}`,
      projectName,
      generatedAt: Date.now(),
      horizonDays: selectedTemplate.horizon_days,
      targetDate: startDate.toISOString(),
      teamSize,
      priority,
      stack: currentStack,
      tasks,
    };
    setGeneratedPlan(plan);
    setPersisted((prev) => ({
      ...prev,
      launchPlans: [plan, ...prev.launchPlans],
    }));
    toast.success("Launch plan generated and saved.");
  };

  const exportPlan = async () => {
    if (!generatedPlan) return;
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("DecodeAI Launch Plan", 14, 20);
    doc.setFontSize(12);
    doc.text(`Project: ${generatedPlan.projectName}`, 14, 30);
    doc.text(`Target: ${formatDate(generatedPlan.targetDate)}`, 14, 38);
    doc.text(`Team size: ${generatedPlan.teamSize}`, 14, 46);
    doc.text(`Priority: ${generatedPlan.priority}`, 14, 54);
    doc.text("Tasks:", 14, 64);
    let y = 72;
    generatedPlan.tasks.forEach((task) => {
      doc.text(
        `• ${task.title} (${formatDuration(task.scaledMinutes)}) due ${formatDate(
          task.dueDate
        )} [${task.roleSuggestion}]`,
        16,
        y
      );
      y += 8;
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
    });
    doc.save(`${generatedPlan.projectName.replace(/\s+/g, "-")}-plan.pdf`);
  };

  return (
    <div>
      <header className="mb-6">
        <div className="flex items-center gap-2 text-sm uppercase tracking-[0.3em] text-primary font-medium">
          <CalendarIcon />
          Launch Plan Generator
        </div>
        <h2 tabIndex={-1} className="font-display text-3xl font-semibold mt-1">
          Generate Your Plan
        </h2>
        {description && <p className="text-muted-foreground mt-2 max-w-3xl">{description}</p>}
      </header>
      <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <Card className="glass-card-soft ring-gradient-glow">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Project inputs</CardTitle>
            <CardDescription>Updates autosave in this browser.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="plan-project">Project name</Label>
              <Input
                id="plan-project"
                value={projectName}
                onChange={(event) => setProjectName(event.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="plan-date">Target launch date</Label>
              <Input
                id="plan-date"
                type="date"
                value={targetDate ?? ""}
                onChange={(event) => setTargetDate(event.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>Team size</Label>
              <Slider
                min={1}
                max={8}
                step={1}
                value={[teamSize]}
                onValueChange={(values) => setTeamSize(values[0] ?? 1)}
              />
              <div className="text-xs text-muted-foreground">
                {teamSize === 1 ? "1 teammate" : `${teamSize} teammates`}
              </div>
            </div>
            <div className="space-y-1">
              <Label>Priority</Label>
              <Select
                value={priority}
                onValueChange={(value: "prototype" | "production") => setPriority(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="prototype">Prototype</SelectItem>
                  <SelectItem value="production">Production</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Template</Label>
              <Select
                value={selectedTemplate?.id}
                onValueChange={(value) => {
                  const template = launchConfig.templates.find((tpl) => tpl.id === value) ?? null;
                  setSelectedTemplate(template);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select template" />
                </SelectTrigger>
                <SelectContent>
                  {launchConfig.templates.map((tpl) => (
                    <SelectItem key={tpl.id} value={tpl.id}>
                      {tpl.title} ({tpl.horizon_days} days)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full" onClick={generatePlan}>
              <Sparkles className="h-4 w-4 mr-1.5" />
              Generate plan
            </Button>
          </CardContent>
        </Card>

        <Card className="glass-card-softer border-dashed border-purple-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Launch plan</CardTitle>
            <CardDescription>
              Timeline updates automatically. Export and share when ready.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {generatedPlan ? (
              <>
                <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  <span>{generatedPlan.projectName}</span>
                  <span>Target {formatDate(generatedPlan.targetDate)}</span>
                  <span>{generatedPlan.teamSize} teammates</span>
                  <span>Priority: {generatedPlan.priority}</span>
                </div>
                <div className="space-y-2">
                  {generatedPlan.tasks.map((task) => (
                    <div
                      key={task.id}
                      className="rounded-md border p-3 flex justify-between items-center gap-4"
                    >
                      <div>
                        <div className="font-medium text-sm">{task.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatDuration(task.scaledMinutes)} • Due {formatDate(task.dueDate)} • {task.roleSuggestion}
                        </div>
                      </div>
                      <Checkbox
                        checked={task.completed}
                        onCheckedChange={(checked) => {
                          setGeneratedPlan((prev) => {
                            if (!prev) return prev;
                            return {
                              ...prev,
                              tasks: prev.tasks.map((t) =>
                                t.id === task.id ? { ...t, completed: Boolean(checked) } : t
                              ),
                            };
                          });
                        }}
                      />
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" className="flex-1" onClick={exportPlan}>
                    <Download className="h-4 w-4 mr-1.5" />
                    Export as PDF
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={async () => {
                      const text = [
                        `Launch plan for ${generatedPlan.projectName}`,
                        `Target: ${formatDate(generatedPlan.targetDate)}`,
                        ...generatedPlan.tasks.map(
                          (task) =>
                            `- ${task.title} (${formatDuration(task.scaledMinutes)}) due ${formatDate(
                              task.dueDate
                            )}`
                        ),
                      ].join("\n");
                      await navigator.clipboard.writeText(text);
                      toast.success("Launch plan copied.");
                    }}
                  >
                    <ClipboardCopy className="h-4 w-4 mr-1.5" />
                    Copy plan
                  </Button>
                </div>
              </>
            ) : (
              <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
                Configure inputs to generate a personalized launch plan.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const CalendarIcon = () => <BookOpen className="h-4 w-4" aria-hidden="true" />;

type StressTestProps = {
  description?: string;
  tools: ToolCaps[];
  limits: LimitRow[];
  stressProfiles: StressProfile[];
  inputs: StressInputs;
  setInputs: (inputs: StressInputs) => void;
  result: StressResult | null;
  setResult: (result: StressResult) => void;
  stack: string[];
  persisted: PersistedState;
  setPersisted: Dispatch<SetStateAction<PersistedState>>;
};

const StressTest = ({
  description,
  tools,
  limits,
  stressProfiles,
  inputs,
  setInputs,
  result,
  setResult,
  stack,
  persisted,
  setPersisted,
}: StressTestProps) => {
  const multiplierMap = {
    conservative: 1.5,
    normal: 1.0,
    optimistic: 0.75,
  };

  const runSimulation = () => {
    const res = runStressTest(inputs, stack, tools, limits);
    setResult(res);
  };

  return (
    <div>
      <header className="mb-6">
        <div className="flex items-center gap-2 text-sm uppercase tracking-[0.3em] text-primary font-medium">
          <Filter className="h-4 w-4" aria-hidden="true" />
          Free Tier Stress Test
        </div>
        <h2 tabIndex={-1} className="font-display text-3xl font-semibold mt-1">
          Simulate Limits
        </h2>
        {description && <p className="text-muted-foreground mt-2 max-w-3xl">{description}</p>}
      </header>
      <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Inputs</CardTitle>
            <CardDescription>Adjust usage assumptions to model load.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <Label>Scenario</Label>
              <Select
                onValueChange={(profileId) => {
                  const profile = stressProfiles.find((profile) => profile.profile === profileId);
                  if (!profile) return;
                  setInputs({
                    ...inputs,
                    dau: profile.DAU,
                    requestsPerUser: profile.requests_per_user,
                    avgModelMb: profile.avg_model_mb,
                    inferencePerHour: profile.inference_per_hour,
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose profile" />
                </SelectTrigger>
                <SelectContent>
                  {stressProfiles.map((profile) => (
                    <SelectItem key={profile.profile} value={profile.profile}>
                      {profile.profile}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <NumberInput
              label="Daily active users"
              value={inputs.dau}
              onChange={(value) => setInputs({ ...inputs, dau: value })}
            />
            <NumberInput
              label="Requests per user per session"
              value={inputs.requestsPerUser}
              onChange={(value) => setInputs({ ...inputs, requestsPerUser: value })}
            />
            <NumberInput
              label="Average model size (MB)"
              value={inputs.avgModelMb}
              onChange={(value) => setInputs({ ...inputs, avgModelMb: value })}
            />
            <NumberInput
              label="Average file upload (MB)"
              value={inputs.avgFileMb}
              onChange={(value) => setInputs({ ...inputs, avgFileMb: value })}
            />
            <NumberInput
              label="Inference per hour"
              value={inputs.inferencePerHour}
              onChange={(value) => setInputs({ ...inputs, inferencePerHour: value })}
            />
            <div className="space-y-1">
              <Label>Retraining frequency</Label>
              <Select
                value={inputs.retrainingFrequency}
                onValueChange={(value: StressInputs["retrainingFrequency"]) =>
                  setInputs({ ...inputs, retrainingFrequency: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No background retraining</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Safety multiplier</Label>
              <Select
                value={inputs.safetyMultiplier}
                onValueChange={(value: StressInputs["safetyMultiplier"]) =>
                  setInputs({ ...inputs, safetyMultiplier: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Safety factor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="conservative">Conservative (x1.5)</SelectItem>
                  <SelectItem value="normal">Normal (x1.0)</SelectItem>
                  <SelectItem value="optimistic">Optimistic (x0.75)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full" onClick={runSimulation}>
              <Sparkles className="h-4 w-4 mr-1.5" />
              Run simulation
            </Button>
          </CardContent>
        </Card>
        <Card className="border-dashed">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Results</CardTitle>
            <CardDescription>
              Adjust DAU slider to test “what if” scenarios instantly.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {result ? (
              <div className="space-y-3">
                {Object.entries(result.byTool).map(([tool, details]) => (
                  <div key={tool} className="rounded-md border p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="font-medium">{tool}</div>
                      <span
                        className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold text-white ${statusColor[details.status]}`}
                      >
                        {details.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{details.summary}</p>
                    <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                      {Object.entries(details.metrics).map(([label, value]) => (
                        <div key={label} className="rounded-md bg-muted/50 px-2 py-1">
                          <strong>{label}:</strong> {value}
                        </div>
                      ))}
                    </div>
                    {!!details.suggestions.length && (
                      <ul className="text-xs text-emerald-600 list-disc list-inside">
                        {details.suggestions.map((suggestion) => (
                          <li key={suggestion}>{suggestion}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    className="flex-1"
                    onClick={() => {
                      setPersisted((prev) => ({
                        ...prev,
                        stress: {
                          savedScenarios: [
                            {
                              id: `stress-${Date.now()}`,
                              label: `Scenario ${new Date().toLocaleTimeString()}`,
                              createdAt: Date.now(),
                              params: inputs,
                              result,
                            },
                            ...prev.stress.savedScenarios,
                          ],
                        },
                      }));
                      toast.success("Stress scenario saved.");
                    }}
                  >
                    <Save className="h-4 w-4 mr-1.5" />
                    Save scenario
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={async () => {
                      const text = JSON.stringify(result, null, 2);
                      await navigator.clipboard.writeText(text);
                      toast.success("Stress report copied.");
                    }}
                  >
                    <ClipboardCopy className="h-4 w-4 mr-1.5" />
                    Copy report
                  </Button>
                </div>
              </div>
            ) : (
              <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
                Configure inputs and run the simulation to project load against free-tier limits.
              </div>
            )}
            <div className="space-y-2">
              <Label>What-if: Daily active users</Label>
              <Slider
                min={1}
                max={1000}
                step={1}
                value={[inputs.dau]}
                onValueChange={(values) => {
                  const [value] = values;
                  const updated = { ...inputs, dau: value };
                  setInputs(updated);
                  const res = runStressTest(updated, stack, tools, limits);
                  setResult(res);
                }}
              />
              <div className="text-xs text-muted-foreground">{inputs.dau} DAU</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const NumberInput = ({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) => (
  <div className="space-y-1">
    <Label>{label}</Label>
    <Input
      type="number"
      value={value}
      onChange={(event) => onChange(Number(event.target.value) || 0)}
    />
  </div>
);

const runStressTest = (
  inputs: StressInputs,
  stack: string[],
  tools: ToolCaps[],
  limits: LimitRow[]
): StressResult => {
  const multiplier =
    inputs.safetyMultiplier === "conservative"
      ? 1.5
      : inputs.safetyMultiplier === "optimistic"
      ? 0.75
      : 1;

  const usageHoursPerMonth = inputs.inferencePerHour * 24 * 30 * multiplier;
  const totalRequests = inputs.dau * inputs.requestsPerUser * 30 * multiplier;
  const storageMb = inputs.avgFileMb * inputs.dau * multiplier;

  const byTool: StressResult["byTool"] = {};

  stack.forEach((toolName) => {
    const tool = tools.find((item) => item.tool === toolName);
    const limitRow = limits.find((row) => row.tool === toolName);
    if (!tool) return;

    const metrics: Record<string, string | number> = {
      "Monthly requests": Math.round(totalRequests),
      "Active storage (MB)": Math.round(storageMb),
      "Compute hours": Math.round(usageHoursPerMonth),
    };

    let status: "green" | "amber" | "red" = "green";
    const suggestions: string[] = [];
    let summary = "Within estimated free-tier limits.";

    if (limitRow) {
      if (limitRow.limit.toLowerCase().includes("deployment") && totalRequests > 80) {
        status = "amber";
        summary = "Deployments may approach the monthly limit.";
        suggestions.push("Consider batching deploys or upgrading one tier.");
      }
      if (limitRow.sleep.toLowerCase().includes("sleep") && usageHoursPerMonth > 200) {
        status = "amber";
        summary = "Apps may sleep under sustained usage.";
        suggestions.push("Add caching or schedule keep-alive pings.");
      }
    }

    if (tool.capabilities.free_gpu === true && inputs.avgModelMb > 500) {
      status = "red";
      summary = "Model likely exceeds free GPU memory.";
      suggestions.push("Compress model or move to paid GPU tier.");
    }

    byTool[toolName] = {
      status,
      summary,
      metrics,
      suggestions,
    };
  });

  return { byTool };
};

type BestPracticesSectionProps = {
  items: BestPractice[];
  description?: string;
  persisted: PersistedState;
  setPersisted: Dispatch<SetStateAction<PersistedState>>;
};

const BestPracticesSection = ({
  items,
  description,
  persisted,
  setPersisted,
}: BestPracticesSectionProps) => {
  const completions = persisted.bestPractices ?? {};
  const toggle = (title: string) => {
    setPersisted((prev) => ({
      ...prev,
      bestPractices: {
        ...(prev.bestPractices ?? {}),
        [title]: !completions?.[title],
      },
    }));
  };

  return (
    <div>
      <header className="mb-6">
        <div className="flex items-center gap-2 text-sm uppercase tracking-[0.3em] text-primary font-medium">
          <Check className="h-4 w-4" aria-hidden="true" />
          Best Practices
        </div>
        <h2 tabIndex={-1} className="font-display text-3xl font-semibold mt-1">
          Build Reliably
        </h2>
        {description && <p className="text-muted-foreground mt-2 max-w-3xl">{description}</p>}
      </header>
      <div className="grid gap-3 md:grid-cols-2">
        {items.map((item) => (
          <Card key={item.title}>
            <CardContent className="flex items-start gap-3 p-4">
              <Checkbox
                checked={Boolean(completions[item.title])}
                onCheckedChange={() => toggle(item.title)}
                aria-label={`Mark ${item.title} as done`}
              />
              <div>
                <div className="font-medium">{item.title}</div>
                <p className="text-sm text-muted-foreground">{item.tip}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

type FaqSectionProps = {
  faqs: FAQ[];
  description?: string;
};

const FaqSection = ({ faqs, description }: FaqSectionProps) => {
  const [query, setQuery] = useState("");
  const filtered = faqs.filter((faq) =>
    faq.q.toLowerCase().includes(query.toLowerCase()) ||
    faq.a.toLowerCase().includes(query.toLowerCase())
  );
  return (
    <div>
      <header className="mb-6">
        <div className="flex items-center gap-2 text-sm uppercase tracking-[0.3em] text-primary font-medium">
          <Info className="h-4 w-4" aria-hidden="true" />
          FAQs
        </div>
        <h2 tabIndex={-1} className="font-display text-3xl font-semibold mt-1">
          Common Questions
        </h2>
        {description && <p className="text-muted-foreground mt-2 max-w-3xl">{description}</p>}
        <div className="mt-4">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search FAQs…"
            className="w-full md:w-80"
            aria-label="Search FAQs"
          />
        </div>
      </header>
      <div className="space-y-3">
        {filtered.map((faq) => (
          <Card key={faq.q}>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{faq.q}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>{faq.a}</p>
              {faq.link && (
                <a
                  href={parseMarkdownUrl(faq.link)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary flex items-center gap-1 text-xs"
                >
                  Learn more →
                  <ExternalLink className="h-3 w-3" aria-hidden="true" />
                </a>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

type TakeawaysSectionProps = {
  takeaways: Takeaways;
  description?: string;
};

const TakeawaysSection = ({ takeaways, description }: TakeawaysSectionProps) => {
  return (
    <div>
      <header className="mb-4">
        <div className="flex items-center gap-2 text-sm uppercase tracking-[0.3em] text-primary font-medium">
          <Sparkles className="h-4 w-4" aria-hidden="true" />
          Takeaways
        </div>
        <h2 tabIndex={-1} className="font-display text-3xl font-semibold mt-1">
          Before You Ship
        </h2>
        {description && <p className="text-muted-foreground mt-2 max-w-3xl">{description}</p>}
      </header>
      <ul className="space-y-2 text-sm text-muted-foreground list-disc list-inside">
        {takeaways.takeaways.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
};

type ProgressHudProps = {
  progress: number;
  savedCount: number;
  onReset: () => void;
  recommendation: RecoResult | null;
};

const ProgressHud = ({
  progress,
  savedCount,
  onReset,
  recommendation,
}: ProgressHudProps) => {
  const handleCopySummary = async () => {
    if (!recommendation) return;
    const text = [
      `Form progress: ${progress}%`,
      `Stack: ${recommendation.stack.join(" + ")}`,
      `Summary: ${recommendation.summary}`,
    ].join("\n");
    await navigator.clipboard.writeText(text);
    toast.success("Stack summary copied.");
  };

  return (
    <Card className="p-6 mb-6">
      <h3 className="text-lg font-semibold">Progress HUD</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Quick controls for your current plan.
      </p>
      <Progress value={progress} aria-label="Form progress" />
      <div className="flex justify-between mt-2 text-sm text-muted-foreground">
        <span>Progress: {progress}%</span>
        <span>Saved stacks: {savedCount}</span>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:space-x-2 mt-4">
        <Button onClick={onReset} className="flex-1" variant="outline">
          Reset form
        </Button>
        <Button
          onClick={handleCopySummary}
          className="flex-1"
          disabled={!recommendation}
        >
          Copy result
        </Button>
      </div>
    </Card>
  );
};

export default NoCodePage;
