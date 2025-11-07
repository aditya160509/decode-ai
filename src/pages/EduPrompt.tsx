import { useEffect, useMemo, useRef, useState } from "react";
import { useGlobalSearch } from "@/contexts/global-search";
import { AnimatedHero } from "@/components/AnimatedHero";
import { TiltCard } from "@/components/TiltCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Award,
  BookOpen,
  ExternalLink,
  LayoutGrid,
  List,
  RefreshCcw,
  Search,
  Stars,
} from "lucide-react";
import { toast } from "sonner";
import {
  applyProgramSearch,
  buildWizardPrompt,
  comparisonScoreLabel,
  getInitialStorage,
  heuristicComparisonScore,
  persistBuilderPrefs,
  persistEnhancerPrefs,
  pushEnhancerRun,
  resolveEnhancerResult,
  scoreMiniQuizAnswer,
  slugifyGoal,
  sortTemplates,
} from "@/features/eduprompt/utils";
import type {
  BuilderConfig,
  ComparisonSample,
  EnhancerFlag,
  EnhancerMode,
  EnhancerOutputFormat,
  EnhancerRun,
  EnhancerTone,
  MiniChallenge,
  MiniChallengeGrade,
  PromptTemplate,
} from "@/features/eduprompt/types";
import { cn } from "@/lib/utils";

type TemplateLayout = "small" | "medium";

const SECTION_IDS = {
  enhancer: "enhancer",
  builder: "builder",
  templates: "templates",
  comparison: "comparison",
  quiz: "mini-quiz",
} as const;

const PROGRAM_LINKS = [
  { id: SECTION_IDS.enhancer, label: "Enhancer" },
  { id: SECTION_IDS.builder, label: "Builder" },
  { id: SECTION_IDS.templates, label: "Templates" },
  { id: SECTION_IDS.comparison, label: "Comparison" },
  { id: SECTION_IDS.quiz, label: "Mini Quiz" },
] as const;

const ENHANCER_TONES: EnhancerTone[] = ["professional", "friendly", "student", "teacher", "beginner", "executive"];
const ENHANCER_FORMATS: EnhancerOutputFormat[] = ["paragraph", "bullets", "steps", "table", "json", "one sentence"];
const ENHANCER_FLAGS: EnhancerFlag[] = ["doNotInvent", "keepTone", "keepCodeBlocks"];
const ENHANCER_MODES: { value: EnhancerMode; label: string; hint: string }[] = [
  { value: "refine", label: "Refine", hint: "Tighten language and clarity." },
  { value: "expand", label: "Expand", hint: "Add depth with plans or feedback." },
  { value: "clarify", label: "Clarify", hint: "Make the content easier to grasp." },
  { value: "polish", label: "Polish", hint: "Clean up tone and correctness." },
];

const TEMPLATE_TASK_CHIPS = ["summarize", "rewrite", "proofread", "explain_code"] as const;
const MINI_DIFFICULTY_CHIPS = ["All", "Easy", "Medium", "Expert"] as const;
const MINI_TASK_CHIPS = ["All", "Summarize", "Rewrite", "Proofread", "Explain code"] as const;

const NONE_VALUE = "__none";

const useSectionsInView = (ids: string[]) => {
  const [map, setMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        setMap((prev) => {
          const next = { ...prev };
          entries.forEach((entry) => {
            next[entry.target.id] = entry.isIntersecting;
          });
          return next;
        });
      },
      { threshold: 0.4 }
    );

    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [ids]);

  return map;
};

const normalizeDifficulty = (difficulty: string) => difficulty.trim().toLowerCase();
const normalizeTask = (task: string) => task.trim().toLowerCase();

const describeChallenge = (challenge: MiniChallenge) => {
  const task = challenge.taskType.toLowerCase();
  if (task.includes("summarize")) return "A quick summary question that tests how fast you can capture the core idea.";
  if (task.includes("rewrite")) return "Practice rewriting tone and voice while keeping meaning intact.";
  if (task.includes("proofread")) return "Spot and fix grammar issues in a hurry.";
  if (task.includes("explain code")) return "Explain a small code snippet so a beginner understands it.";
  return "A focused practice challenge.";
};

const EduPrompt = () => {
  const { openSearch } = useGlobalSearch();
  const storage = useMemo(() => getInitialStorage(), []);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [templates, setTemplates] = useState<PromptTemplate[]>([]);
  const [builderConfig, setBuilderConfig] = useState<BuilderConfig["builder"] | null>(null);
  const [comparisonSamples, setComparisonSamples] = useState<ComparisonSample[]>([]);
  const [miniChallenges, setMiniChallenges] = useState<MiniChallenge[]>([]);

  const [programSearch, setProgramSearch] = useState("");
  const [templatesLayout, setTemplatesLayout] = useState<TemplateLayout>("medium");

  const [enhancerInput, setEnhancerInput] = useState(storage.recentEnhancerRuns.at(0)?.input ?? "");
  const [enhancerTone, setEnhancerTone] = useState<EnhancerTone>(storage.enhancerPrefs?.tone ?? "professional");
  const [enhancerFormat, setEnhancerFormat] = useState<EnhancerOutputFormat>(storage.enhancerPrefs?.outputFormat ?? "paragraph");
  const [enhancerLevel, setEnhancerLevel] = useState<number>(storage.enhancerPrefs?.level ?? 3);
  const [enhancerFlags, setEnhancerFlags] = useState<EnhancerFlag[]>(storage.enhancerPrefs?.flags ?? []);
  const [enhancerMode, setEnhancerMode] = useState<EnhancerMode>(storage.enhancerPrefs?.mode ?? "refine");
  const [enhancerResult, setEnhancerResult] = useState<ReturnType<typeof resolveEnhancerResult> | null>(null);
  const [enhancerError, setEnhancerError] = useState<string | null>(null);
  const [recentRuns, setRecentRuns] = useState<EnhancerRun[]>(storage.recentEnhancerRuns);

  const enhancerTextareaRef = useRef<HTMLTextAreaElement | null>(null);

  const [builderGoal, setBuilderGoal] = useState(storage.builderPrefs.goalId ?? "");
  const [builderLevel, setBuilderLevel] = useState(storage.builderPrefs.level ?? 3);
  const [builderTone, setBuilderTone] = useState<string | null>(storage.builderPrefs.tone ?? null);
  const [builderOutputFormat, setBuilderOutputFormat] = useState<string | null>(storage.builderPrefs.outputFormat ?? null);
  const [builderFlags, setBuilderFlags] = useState<string[]>(storage.builderPrefs.flags ?? []);
  const [builderOutcome, setBuilderOutcome] = useState<ReturnType<typeof buildWizardPrompt> | null>(null);
  const [builderError, setBuilderError] = useState<string | null>(null);

  const [templatesSearch, setTemplatesSearch] = useState("");
  const [templateFilters, setTemplateFilters] = useState<Set<string>>(new Set());

  const [selectedSampleId, setSelectedSampleId] = useState("");
  const [promptA, setPromptA] = useState("");
  const [promptB, setPromptB] = useState("");
  const [comparisonVisible, setComparisonVisible] = useState(false);
  const [comparisonScores, setComparisonScores] = useState<{ scoreA: number; scoreB: number; labelA: string; labelB: string } | null>(null);
  const [comparisonOutputs, setComparisonOutputs] = useState<{ outputA: string; outputB: string } | null>(null);
  const [comparisonMessage, setComparisonMessage] = useState<string | null>(null);

  const [miniDifficulty, setMiniDifficulty] = useState<string>("All");
  const [miniTask, setMiniTask] = useState<string>("All");
  const [miniSearch, setMiniSearch] = useState("");
  const [activeChallenge, setActiveChallenge] = useState<string | null>(null);
  const [miniAnswers, setMiniAnswers] = useState<Record<string, string>>({});
  const [miniResults, setMiniResults] = useState<Record<string, MiniChallengeGrade>>({});
  const [revealedAnswers, setRevealedAnswers] = useState<Record<string, boolean>>({});

  const sectionsInView = useSectionsInView(Object.values(SECTION_IDS));

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [templatesData, builderData, comparisonData, challengesData] = await Promise.all([
          fetch("/data/eduprompt/prompt_templates.json").then((res) => res.json() as Promise<{ promptTemplates: PromptTemplate[] }>),
          fetch("/data/eduprompt/builder_config.json").then((res) => res.json() as Promise<BuilderConfig>),
          fetch("/data/eduprompt/comparison_samples.json").then((res) => res.json() as Promise<{ comparisonSamples: ComparisonSample[] }>),
          fetch("/data/eduprompt/mini_challenges.json").then((res) => res.json() as Promise<{ miniChallenges: MiniChallenge[] }>),
        ]);

        if (cancelled) return;

        setTemplates(sortTemplates(templatesData.promptTemplates));
        setBuilderConfig(builderData.builder);
        setComparisonSamples(comparisonData.comparisonSamples);
        setMiniChallenges(challengesData.miniChallenges);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load page data.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    persistEnhancerPrefs({
      tone: enhancerTone,
      level: enhancerLevel,
      outputFormat: enhancerFormat,
      flags: enhancerFlags,
      mode: enhancerMode,
    });
  }, [enhancerTone, enhancerLevel, enhancerFormat, enhancerFlags, enhancerMode]);

  useEffect(() => {
    persistBuilderPrefs({
      goalId: builderGoal,
      level: builderLevel,
      tone: builderTone,
      outputFormat: builderOutputFormat,
      flags: builderFlags,
    });
  }, [builderGoal, builderLevel, builderTone, builderOutputFormat, builderFlags]);

  const scrollToSection = (id: string) => {
    const section = document.getElementById(id);
    if (!section) return;
    section.scrollIntoView({ behavior: "smooth", block: "start" });
    window.setTimeout(() => {
      const heading = section.querySelector("h2");
      if (heading instanceof HTMLElement) heading.focus();
    }, 450);
  };

  const handleEnhance = () => {
    if (!enhancerInput.trim()) {
      setEnhancerError("Please enter text first");
      return;
    }
    const result = resolveEnhancerResult({
      input: enhancerInput,
      tone: enhancerTone,
      format: enhancerFormat,
      level: enhancerLevel,
      flags: enhancerFlags,
      mode: enhancerMode,
    });
    setEnhancerResult(result);
    setEnhancerError(null);

    const run: EnhancerRun = {
      ts: Date.now(),
      input: enhancerInput,
      enhanced: result.enhancedPrompt,
      simulated: result.simulatedAnswer,
      score: result.score,
      label: result.label,
      mode: enhancerMode,
      task: result.task,
    };
    const updated = pushEnhancerRun(run);
    setRecentRuns(updated);
  };

  const handleClearEnhancer = () => {
    setEnhancerInput("");
    setEnhancerResult(null);
    setEnhancerError(null);
    enhancerTextareaRef.current?.focus();
  };

  const toggleEnhancerFlag = (flag: EnhancerFlag) => {
    setEnhancerFlags((prev) => {
      const next = new Set(prev);
      if (next.has(flag)) next.delete(flag);
      else next.add(flag);
      return Array.from(next) as EnhancerFlag[];
    });
  };

  const builderGoalText = useMemo(() => {
    if (!builderConfig) return "";
    return builderConfig.goals.find((goal) => slugifyGoal(goal) === builderGoal) ?? "";
  }, [builderConfig, builderGoal]);

  const handleGenerateBuilder = () => {
    if (!builderConfig) return;
    if (!builderGoalText) {
      setBuilderError("Select a goal first");
      return;
    }
    const outcome = buildWizardPrompt({
      goal: builderGoalText,
      level: builderLevel,
      tone: builderTone,
      outputFormat: builderOutputFormat,
      flags: builderFlags,
    });
    setBuilderOutcome(outcome);
    setBuilderError(null);
  };

  const handleBuilderCopy = async () => {
    if (!builderOutcome) return;
    await navigator.clipboard.writeText(builderOutcome.prompt);
    toast.success("Built prompt copied.");
  };

  const handleBuilderSend = () => {
    if (!builderOutcome) return;
    setEnhancerInput(builderOutcome.prompt);
    enhancerTextareaRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    window.setTimeout(() => enhancerTextareaRef.current?.focus(), 300);
  };

  const templatesFiltered = useMemo(() => {
    let next = templates;
    if (templatesSearch.trim()) {
      const query = templatesSearch.toLowerCase();
      next = next.filter((template) =>
        [template.name, template.description, template.basePrompt, template.taskType].join(" ").toLowerCase().includes(query)
      );
    }
    if (templateFilters.size > 0) {
      next = next.filter((template) => templateFilters.has(template.taskType));
    }
    if (programSearch.trim()) {
      next = applyProgramSearch(next, programSearch);
    }
    return next;
  }, [templates, templatesSearch, templateFilters, programSearch]);

  const currentSample = useMemo(
    () => comparisonSamples.find((sample) => sample.id === selectedSampleId),
    [comparisonSamples, selectedSampleId]
  );

  useEffect(() => {
    if (!currentSample) {
      setPromptA("");
      setPromptB("");
      setComparisonVisible(false);
      setComparisonScores(null);
      setComparisonOutputs(null);
      setComparisonMessage(null);
      return;
    }
    setPromptA(currentSample.promptA);
    setPromptB(currentSample.promptB);
    setComparisonVisible(false);
    setComparisonScores(null);
    setComparisonOutputs(null);
    setComparisonMessage(null);
  }, [currentSample]);

  const handleShowComparison = () => {
    if (!currentSample) {
      setComparisonMessage("Choose a scenario");
      setComparisonVisible(false);
      return;
    }
    const trimmedA = promptA.trim();
    const trimmedB = promptB.trim();
    const sampleMatch =
      trimmedA === currentSample.promptA.trim() && trimmedB === currentSample.promptB.trim();

    let outputs: { outputA: string; outputB: string } | null = null;
    let scoreA: number;
    let scoreB: number;

    if (sampleMatch) {
      scoreA = currentSample.scoreA;
      scoreB = currentSample.scoreB;
      outputs = { outputA: currentSample.outputA, outputB: currentSample.outputB };
      setComparisonMessage(currentSample.whyBetter);
    } else {
      scoreA = heuristicComparisonScore(trimmedA);
      scoreB = heuristicComparisonScore(trimmedB);
      outputs = { outputA: "", outputB: "" };
      setComparisonMessage("Custom prompts detected. Outputs are hidden so you can focus on your own scoring.");
    }

    setComparisonScores({
      scoreA,
      scoreB,
      labelA: comparisonScoreLabel(scoreA),
      labelB: comparisonScoreLabel(scoreB),
    });
    setComparisonOutputs(outputs);
    setComparisonVisible(true);
  };

  const handleImportFromEnhancer = () => {
    if (!recentRuns.length) {
      setComparisonMessage("Run the Prompt Enhancer first to import its latest prompt.");
      setComparisonVisible(false);
      return;
    }
    const [latest] = recentRuns;
    setPromptA(latest.input);
    setPromptB(latest.enhanced);
    setComparisonVisible(false);
    setComparisonMessage("Imported the latest Enhancer input and teaching prompt.");
  };

  const handleResetComparison = () => {
    if (currentSample) {
      setPromptA(currentSample.promptA);
      setPromptB(currentSample.promptB);
    } else {
      setPromptA("");
      setPromptB("");
    }
    setComparisonVisible(false);
    setComparisonScores(null);
    setComparisonOutputs(null);
    setComparisonMessage(null);
  };

  const filteredMiniChallenges = useMemo(() => {
    let next = miniChallenges;
    if (miniDifficulty !== "All") {
      next = next.filter((challenge) => normalizeDifficulty(challenge.difficulty) === miniDifficulty.toLowerCase());
    }
    if (miniTask !== "All") {
      next = next.filter((challenge) => normalizeTask(challenge.taskType) === miniTask.toLowerCase());
    }
    if (miniSearch.trim()) {
      const query = miniSearch.toLowerCase();
      next = next.filter((challenge) => challenge.title.toLowerCase().includes(query));
    }
    if (programSearch.trim()) {
      next = applyProgramSearch(next, programSearch);
    }
    return next;
  }, [miniChallenges, miniDifficulty, miniTask, miniSearch, programSearch]);

  const handleMiniTry = (id: string) => {
    setActiveChallenge((prev) => (prev === id ? null : id));
    setMiniResults((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setRevealedAnswers((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const setMiniAnswer = (id: string, value: string) => {
    setMiniAnswers((prev) => ({ ...prev, [id]: value }));
  };

  const handleMiniCheck = (challenge: MiniChallenge) => {
    const answer = miniAnswers[challenge.id] ?? "";
    const result = scoreMiniQuizAnswer(challenge, answer);
    setMiniResults((prev) => ({ ...prev, [challenge.id]: result }));
  };

  const handleMiniReveal = (challengeId: string) => {
    setRevealedAnswers((prev) => ({ ...prev, [challengeId]: true }));
  };

  const handleMiniReset = (challengeId: string) => {
    setActiveChallenge(null);
    setMiniAnswers((prev) => {
      const next = { ...prev };
      delete next[challengeId];
      return next;
    });
    setMiniResults((prev) => {
      const next = { ...prev };
      delete next[challengeId];
      return next;
    });
    setRevealedAnswers((prev) => {
      const next = { ...prev };
      delete next[challengeId];
      return next;
    });
  };

  return (
    <TooltipProvider delayDuration={150}>
      <div className="relative min-h-screen bg-background noise-texture">
        <AnimatedHero className="pt-24 pb-20">
          <div className="container mx-auto max-w-6xl px-4 space-y-10">
          <header className="pt-6 text-center space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm text-muted-foreground">
              <Stars className="h-4 w-4 text-primary" />
              EduPrompt
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-semibold tracking-tight">
              <span className="gradient-text-animated">
                Engineer better prompts. Compare patterns. Practice with mini tasks.
              </span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything runs locally with static JSON data so you can study, remix, and test prompt patterns without leaving the page.
            </p>
            <Button size="lg" onClick={openSearch}>
              Open Global Search
            </Button>
          </header>

          <nav className="rounded-xl border bg-muted/20 px-4 py-4 shadow-sm">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex flex-wrap items-center gap-1" aria-label="Section navigation">
                {PROGRAM_LINKS.map((link) => (
                  <Button
                    key={link.id}
                    variant={sectionsInView[link.id] ? "default" : "ghost"}
                    size="sm"
                    className="text-sm"
                    onClick={() => scrollToSection(link.id)}
                  >
                    {link.label}
                  </Button>
                ))}
              </div>
              <div className="flex-1 min-w-[200px] md:min-w-[280px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search in this page…"
                    className="pl-9"
                    value={programSearch}
                    onChange={(event) => setProgramSearch(event.target.value)}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2" aria-label="Templates layout">
                <Button
                  variant={templatesLayout === "small" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTemplatesLayout("small")}
                  aria-pressed={templatesLayout === "small"}
                  className="gap-1"
                >
                  <List className="h-4 w-4" />
                  Compact
                </Button>
                <Button
                  variant={templatesLayout === "medium" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTemplatesLayout("medium")}
                  aria-pressed={templatesLayout === "medium"}
                  className="gap-1"
                >
                  <LayoutGrid className="h-4 w-4" />
                  Comfort
                </Button>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => scrollToSection(SECTION_IDS.quiz)}
                className="gap-2"
              >
                <BookOpen className="h-4 w-4" />
                Mini Quiz
              </Button>
            </div>
          </nav>

          {loading ? (
            <div className="flex items-center justify-center py-20 text-muted-foreground">
              Loading EduPrompt…
            </div>
          ) : error ? (
            <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-6 text-center space-y-3">
              <h2 className="text-lg font-semibold text-destructive">Unable to load page data</h2>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
          ) : (
            <>
              <PromptEnhancerSection
                id={SECTION_IDS.enhancer}
                textareaRef={enhancerTextareaRef}
                input={enhancerInput}
                setInput={setEnhancerInput}
                tone={enhancerTone}
                setTone={setEnhancerTone}
                format={enhancerFormat}
                setFormat={setEnhancerFormat}
                level={enhancerLevel}
                setLevel={setEnhancerLevel}
                flags={enhancerFlags}
                toggleFlag={toggleEnhancerFlag}
                mode={enhancerMode}
                setMode={setEnhancerMode}
                result={enhancerResult}
                error={enhancerError}
                onEnhance={handleEnhance}
                onClear={handleClearEnhancer}
                recentRuns={recentRuns}
              />

              {builderConfig && (
                  <WizardBuilderSection
                  id={SECTION_IDS.builder}
                  builderConfig={builderConfig}
                  goalValue={builderGoal}
                  setGoalValue={setBuilderGoal}
                  level={builderLevel}
                  setLevel={setBuilderLevel}
                  tone={builderTone}
                  setTone={setBuilderTone}
                  outputFormat={builderOutputFormat}
                  setOutputFormat={setBuilderOutputFormat}
                  flags={builderFlags}
                  setFlags={setBuilderFlags}
                  onGenerate={handleGenerateBuilder}
                  onCopy={handleBuilderCopy}
                  onSend={handleBuilderSend}
                  outcome={builderOutcome}
                  error={builderError}
                />
              )}

              <TemplatesGallerySection
                id={SECTION_IDS.templates}
                templates={templatesFiltered}
                layout={templatesLayout}
                searchValue={templatesSearch}
                onSearchChange={setTemplatesSearch}
                filters={templateFilters}
                onToggleFilter={(taskType) =>
                  setTemplateFilters((prev) => {
                    const next = new Set(prev);
                    if (next.has(taskType)) next.delete(taskType);
                    else next.add(taskType);
                    return next;
                  })
                }
                onClearFilters={() => setTemplateFilters(new Set())}
                onUseTemplate={(template) => {
                  setEnhancerInput(template.basePrompt);
                  enhancerTextareaRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
                  window.setTimeout(() => enhancerTextareaRef.current?.focus(), 200);
                }}
              />

              <ComparisonSection
                id={SECTION_IDS.comparison}
                samples={comparisonSamples}
                selectedSampleId={selectedSampleId}
                onSampleChange={setSelectedSampleId}
                promptA={promptA}
                setPromptA={setPromptA}
                promptB={promptB}
                setPromptB={setPromptB}
                onShow={handleShowComparison}
                onImport={handleImportFromEnhancer}
                onReset={handleResetComparison}
                visible={comparisonVisible}
                scores={comparisonScores}
                outputs={comparisonOutputs}
                message={comparisonMessage}
              />

              <MiniQuizSection
                id={SECTION_IDS.quiz}
                challenges={filteredMiniChallenges}
                difficultyFilter={miniDifficulty}
                setDifficultyFilter={setMiniDifficulty}
                taskFilter={miniTask}
                setTaskFilter={setMiniTask}
                searchValue={miniSearch}
                setSearchValue={setMiniSearch}
                activeChallenge={activeChallenge}
                onTry={handleMiniTry}
                answers={miniAnswers}
                setAnswer={setMiniAnswer}
                onCheck={handleMiniCheck}
                results={miniResults}
                onReveal={handleMiniReveal}
                revealedAnswers={revealedAnswers}
                onReset={handleMiniReset}
              />
            </>
          )}
        </div>
        </AnimatedHero>
      </div>
    </TooltipProvider>
  );
};

type EnhancerSectionProps = {
  id: string;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  input: string;
  setInput: (value: string) => void;
  tone: EnhancerTone;
  setTone: (tone: EnhancerTone) => void;
  format: EnhancerOutputFormat;
  setFormat: (format: EnhancerOutputFormat) => void;
  level: number;
  setLevel: (level: number) => void;
  flags: EnhancerFlag[];
  toggleFlag: (flag: EnhancerFlag) => void;
  mode: EnhancerMode;
  setMode: (mode: EnhancerMode) => void;
  result: ReturnType<typeof resolveEnhancerResult> | null;
  error: string | null;
  onEnhance: () => void;
  onClear: () => void;
  recentRuns: EnhancerRun[];
};

const PromptEnhancerSection = ({
  id,
  textareaRef,
  input,
  setInput,
  tone,
  setTone,
  format,
  setFormat,
  level,
  setLevel,
  flags,
  toggleFlag,
  mode,
  setMode,
  result,
  error,
  onEnhance,
  onClear,
  recentRuns,
}: EnhancerSectionProps) => (
  <section id={id} className="scroll-mt-24 space-y-6">
    <div className="space-y-2">
      <h2 tabIndex={-1} className="font-display text-3xl font-semibold">
        Prompt Enhancer
      </h2>
      <p className="text-muted-foreground max-w-2xl">
        Upgrade raw text into a structured teaching prompt. Modes decide how the enhancer responds: Refine, Expand, Clarify, or Polish.
      </p>
    </div>

    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="h-full glass-card-soft ring-gradient-glow hover:shadow-[0_20px_70px_-15px_rgba(139,92,246,0.3)] transition-all duration-300">
        <CardHeader className="space-y-1">
          <CardTitle>Your raw prompt</CardTitle>
          <CardDescription>Craft your idea, choose a mode, then enhance. ⌘⏎ or Ctrl⏎ runs the enhancer.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex flex-wrap gap-2">
            <ToggleGroup type="single" value={mode} onValueChange={(value) => value && setMode(value as EnhancerMode)}>
              {ENHANCER_MODES.map((item) => (
                <ToggleGroupItem
                  key={item.value}
                  value={item.value}
                  className="px-3 py-1.5 text-sm data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                  aria-label={item.hint}
                >
                  {item.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>

          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Paste the prompt, notes, or code you want to teach…"
            className="min-h-[200px]"
            aria-label="Your raw prompt"
          />
          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tone</label>
              <ToggleGroup
                type="single"
                value={tone}
                onValueChange={(value) => value && setTone(value as EnhancerTone)}
                className="flex flex-wrap gap-2"
              >
                {ENHANCER_TONES.map((option) => (
                  <ToggleGroupItem key={option} value={option} className="capitalize px-3 py-1.5">
                    {option}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Output format</label>
              <Select value={format} onValueChange={(value) => setFormat(value as EnhancerOutputFormat)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ENHANCER_FORMATS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Level</label>
              <Select value={String(level)} onValueChange={(value) => setLevel(Number(value))}>
                <SelectTrigger>
                  <SelectValue placeholder="Level" />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5].map((option) => (
                    <SelectItem key={option} value={String(option)}>
                      Level {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Flags</label>
              <div className="grid gap-2">
                {ENHANCER_FLAGS.map((flag) => (
                  <label key={flag} className="flex items-center gap-3 rounded-md border px-3 py-2 text-sm capitalize">
                    <Checkbox
                      checked={flags.includes(flag)}
                      onCheckedChange={() => toggleFlag(flag)}
                    />
                    {flag}
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={onEnhance}>Enhance Prompt</Button>
            <Button variant="outline" onClick={onClear}>
              Clear
            </Button>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="secondary" disabled>
                  Run Live Model
                </Button>
              </TooltipTrigger>
              <TooltipContent>Connect later</TooltipContent>
            </Tooltip>
          </div>

          {recentRuns.length > 0 && (
            <div className="rounded-md border bg-muted/40 p-3 space-y-2">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Recent runs</p>
              {recentRuns.map((run) => (
                <div key={run.ts} className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                  <span className="truncate max-w-[70%]">{run.input}</span>
                  <span className={cn("font-semibold", run.label === "Strong" && "text-green-600", run.label === "Weak" && "text-destructive")}>
                    {run.label} · {run.score}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="h-full glass-card-soft ring-gradient-glow hover:shadow-[0_20px_70px_-15px_rgba(139,92,246,0.3)] transition-all duration-300">
        <CardHeader>
          <CardTitle>Final Teaching Prompt</CardTitle>
          <CardDescription>Fully structured prompt ready to teach or demo.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <OutputBlock title="Final Teaching Prompt" value={result?.enhancedPrompt} />
          <OutputBlock title="Simulated Model Answer" value={result?.simulatedAnswer} />
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <Badge variant="outline">Score {result?.score ?? "—"}</Badge>
            {result && (
              <Badge
                className={cn(
                  result.label === "Strong" && "bg-green-500 text-white",
                  result.label === "Weak" && "bg-destructive text-white"
                )}
              >
                {result.label}
              </Badge>
            )}
            {result && <Badge variant="secondary" className="capitalize">{result.task.replace("_", " ")}</Badge>}
          </div>
        </CardContent>
      </Card>
    </div>
  </section>
);

const OutputBlock = ({ title, value }: { title: string; value?: string }) => (
  <div className="space-y-2">
    <div className="flex items-center justify-between gap-2">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{title}</h3>
      {value && (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs"
          onClick={() => navigator.clipboard.writeText(value)}
        >
          <ExternalLink className="mr-1 h-3.5 w-3.5" />
          Copy
        </Button>
      )}
    </div>
    <pre className="rounded-md border bg-muted/50 p-3 min-h-[140px] whitespace-pre-wrap text-sm">
      {value ?? "Run the enhancer to generate a teaching prompt."}
    </pre>
  </div>
);

type WizardSectionProps = {
  id: string;
  builderConfig: BuilderConfig["builder"];
  goalValue: string;
  setGoalValue: (value: string) => void;
  level: number;
  setLevel: (value: number) => void;
  tone: string | null;
  setTone: (value: string | null) => void;
  outputFormat: string | null;
  setOutputFormat: (value: string | null) => void;
  flags: string[];
  setFlags: (value: string[]) => void;
  onGenerate: () => void;
  onCopy: () => void;
  onSend: () => void;
  outcome: ReturnType<typeof buildWizardPrompt> | null;
  error: string | null;
};

const WizardBuilderSection = ({
  id,
  builderConfig,
  goalValue,
  setGoalValue,
  level,
  setLevel,
  tone,
  setTone,
  outputFormat,
  setOutputFormat,
  flags,
  setFlags,
  onGenerate,
  onCopy,
  onSend,
  outcome,
  error,
}: WizardSectionProps) => (
  <section id={id} className="scroll-mt-24 space-y-6">
    <div className="space-y-2">
      <h2 tabIndex={-1} className="font-display text-3xl font-semibold">
        Wizard Builder
      </h2>
      <p className="text-muted-foreground max-w-2xl">
        Generate prompts with obvious differences from level 1 through 5. Pick a goal, tweak tone, and send it into the enhancer when you're ready.
      </p>
    </div>

    <Card className="glass-card-soft ring-gradient-glow hover:shadow-[0_20px_70px_-15px_rgba(139,92,246,0.3)] transition-all duration-300">
      <CardHeader>
        <CardTitle>Build instruction</CardTitle>
        <CardDescription>Deterministic prompt construction that respects level, tone, format, and guardrail flags.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Goal</label>
            <Select value={goalValue} onValueChange={setGoalValue}>
              <SelectTrigger>
                <SelectValue placeholder="Select a goal" />
              </SelectTrigger>
              <SelectContent>
                {builderConfig.goals.map((goal) => {
                  const value = slugifyGoal(goal);
                  return (
                    <SelectItem key={value} value={value}>
                      {goal}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Level</label>
            <Select value={String(level)} onValueChange={(value) => setLevel(Number(value))}>
              <SelectTrigger>
                <SelectValue placeholder="Select level" />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5].map((option) => (
                  <SelectItem key={option} value={String(option)}>
                    Level {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <label className="text-sm font-medium">Tone (optional)</label>
            <Select value={tone ?? NONE_VALUE} onValueChange={(value) => setTone(value === NONE_VALUE ? null : value)}>
              <SelectTrigger>
                <SelectValue placeholder="Tone" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE_VALUE}>None</SelectItem>
                {builderConfig.toneOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Output format (optional)</label>
            <Select
              value={outputFormat ?? NONE_VALUE}
              onValueChange={(value) => setOutputFormat(value === NONE_VALUE ? null : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE_VALUE}>None</SelectItem>
                {builderConfig.outputFormats.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Flags</label>
            <div className="flex flex-wrap gap-2">
              {builderConfig.extraFlags.map((flag) => {
                const active = flags.includes(flag);
                return (
                  <Button
                    key={flag}
                    type="button"
                    variant={active ? "default" : "outline"}
                    size="sm"
                    className="capitalize"
                    onClick={() =>
                      setFlags((prev) => {
                        const next = new Set(prev);
                        if (next.has(flag)) next.delete(flag);
                        else next.add(flag);
                        return Array.from(next);
                      })
                    }
                  >
                    {flag}
                  </Button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button onClick={onGenerate}>Generate</Button>
          <Button variant="outline" onClick={onSend} disabled={!outcome}>
            Send to Enhancer
          </Button>
          <Button variant="ghost" onClick={onCopy} disabled={!outcome}>
            Copy
          </Button>
        </div>

        <div className="space-y-3">
          <label className="text-sm font-medium">Built Prompt</label>
          <pre className="rounded-md border bg-muted/40 p-3 min-h-[120px] whitespace-pre-wrap text-sm">
            {outcome?.prompt ?? "Generate a prompt to preview the output."}
          </pre>
          {outcome && (
            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
              <span>Task type: {outcome.taskType}</span>
              {outcome.tone && <span>Tone: {outcome.tone}</span>}
              {outcome.outputFormat && <span>Format: {outcome.outputFormat}</span>}
              {outcome.flags.length > 0 && <span>Flags: {outcome.flags.join(", ")}</span>}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  </section>
);

type TemplatesSectionProps = {
  id: string;
  templates: PromptTemplate[];
  layout: TemplateLayout;
  searchValue: string;
  onSearchChange: (value: string) => void;
  filters: Set<string>;
  onToggleFilter: (taskType: string) => void;
  onClearFilters: () => void;
  onUseTemplate: (template: PromptTemplate) => void;
};

const TemplatesGallerySection = ({
  id,
  templates,
  layout,
  searchValue,
  onSearchChange,
  filters,
  onToggleFilter,
  onClearFilters,
  onUseTemplate,
}: TemplatesSectionProps) => (
  <section id={id} className="scroll-mt-24 space-y-6">
    <div className="space-y-2">
      <h2 tabIndex={-1} className="font-display text-3xl font-semibold">
        Templates Gallery
      </h2>
      <p className="text-muted-foreground max-w-2xl">
        Ready-to-use patterns organised by task type. Drop them into the enhancer to customise even more.
      </p>
    </div>

    <div className="rounded-xl border bg-muted/20 p-4 space-y-4">
      <div className="grid gap-4 md:grid-cols-[2fr,1fr]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search templates…"
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2 md:justify-end">
          {TEMPLATE_TASK_CHIPS.map((task) => {
            const active = filters.has(task);
            return (
              <Button
                key={task}
                variant={active ? "default" : "outline"}
                size="sm"
                className="capitalize"
                onClick={() => onToggleFilter(task)}
              >
                {task.replace("_", " ")}
              </Button>
            );
          })}
          <Button variant="ghost" size="sm" onClick={onClearFilters}>
            Clear filters
          </Button>
        </div>
      </div>
    </div>

    {templates.length === 0 ? (
      <EmptyState
        title="No templates match"
        description="Adjust filters or search terms to see more options."
        actionLabel="Reset filters"
        onAction={onClearFilters}
      />
    ) : (
      <div
        className={cn(
          "grid gap-4",
          layout === "small" ? "md:grid-cols-3" : "md:grid-cols-2"
        )}
      >
        {templates.map((template) => (
          <Card key={template.id} className={cn("glass-card-softer ring-gradient-glow hover:shadow-[0_20px_70px_-15px_rgba(139,92,246,0.2)] transition-all duration-300", layout === "small" ? "p-4" : "p-6")}>
            <CardHeader className="space-y-2 p-0">
              <CardTitle className="flex items-center justify-between gap-2 text-lg">
                <span>{template.name}</span>
                <Badge variant="secondary" className="capitalize">
                  {template.taskType}
                </Badge>
              </CardTitle>
              <CardDescription>{template.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 p-0 pt-4">
              <pre className="rounded-md border bg-muted/40 p-3 text-sm whitespace-pre-wrap">
                {template.basePrompt}
              </pre>
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={() => onUseTemplate(template)}>
                  Use in Enhancer
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigator.clipboard.writeText(template.basePrompt)}
                >
                  Copy
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )}
  </section>
);

type ComparisonProps = {
  id: string;
  samples: ComparisonSample[];
  selectedSampleId: string;
  onSampleChange: (value: string) => void;
  promptA: string;
  setPromptA: (value: string) => void;
  promptB: string;
  setPromptB: (value: string) => void;
  onShow: () => void;
  onImport: () => void;
  onReset: () => void;
  visible: boolean;
  scores: { scoreA: number; scoreB: number; labelA: string; labelB: string } | null;
  outputs: { outputA: string; outputB: string } | null;
  message: string | null;
};

const ComparisonSection = ({
  id,
  samples,
  selectedSampleId,
  onSampleChange,
  promptA,
  setPromptA,
  promptB,
  setPromptB,
  onShow,
  onImport,
  onReset,
  visible,
  scores,
  outputs,
  message,
}: ComparisonProps) => (
  <section id={id} className="scroll-mt-24 space-y-6">
    <div className="space-y-2">
      <h2 tabIndex={-1} className="font-display text-3xl font-semibold">
        Comparison Mode
      </h2>
      <p className="text-muted-foreground max-w-2xl">
        Compare prompt A versus B, reveal sample outputs, or import the latest enhancer run to score your own teaching prompt.
      </p>
    </div>

    <Card className="glass-card-soft ring-gradient-glow hover:shadow-[0_20px_70px_-15px_rgba(139,92,246,0.3)] transition-all duration-300">
      <CardHeader>
        <CardTitle>Prompt comparison</CardTitle>
        <CardDescription>Select a sample or use your own prompts, then reveal scores.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium">Sample scenario</label>
          <Select value={selectedSampleId} onValueChange={onSampleChange}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a scenario" />
            </SelectTrigger>
            <SelectContent>
              {samples.map((sample) => (
                <SelectItem key={sample.id} value={sample.id}>
                  {sample.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Prompt A</label>
            <Textarea
              value={promptA}
              onChange={(event) => setPromptA(event.target.value)}
              className="min-h-[140px]"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Prompt B</label>
            <Textarea
              value={promptB}
              onChange={(event) => setPromptB(event.target.value)}
              className="min-h-[140px]"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button onClick={onShow}>Show outputs and scores</Button>
          <Button variant="outline" onClick={onImport}>
            Import from Enhancer
          </Button>
          <Button variant="ghost" onClick={onReset}>
            <RefreshCcw className="mr-2 h-4 w-4" />
            Reset
          </Button>
        </div>

        {message && <p className="text-sm text-muted-foreground">{message}</p>}

        {visible && (
          <div className="grid gap-4 md:grid-cols-2">
            <ComparisonResult title="Prompt A result" output={outputs?.outputA} score={scores?.scoreA} label={scores?.labelA} />
            <ComparisonResult title="Prompt B result" output={outputs?.outputB} score={scores?.scoreB} label={scores?.labelB} />
          </div>
        )}
      </CardContent>
    </Card>
  </section>
);

const ComparisonResult = ({
  title,
  score,
  label,
  output,
}: {
  title: string;
  score?: number;
  label?: string;
  output?: string;
}) => (
  <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
    <div className="flex items-center justify-between">
      <h3 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">{title}</h3>
      {typeof score === "number" && label && (
        <Badge variant="secondary">
          {score}/10 · {label}
        </Badge>
      )}
    </div>
    <pre className="min-h-[120px] whitespace-pre-wrap text-sm">
      {output ? output : "Outputs hidden for custom prompts."}
    </pre>
  </div>
);

type MiniQuizProps = {
  id: string;
  challenges: MiniChallenge[];
  difficultyFilter: string;
  setDifficultyFilter: (value: string) => void;
  taskFilter: string;
  setTaskFilter: (value: string) => void;
  searchValue: string;
  setSearchValue: (value: string) => void;
  activeChallenge: string | null;
  onTry: (id: string) => void;
  answers: Record<string, string>;
  setAnswer: (id: string, value: string) => void;
  onCheck: (challenge: MiniChallenge) => void;
  results: Record<string, MiniChallengeGrade>;
  onReveal: (id: string) => void;
  revealedAnswers: Record<string, boolean>;
  onReset: (id: string) => void;
};

const MiniQuizSection = ({
  id,
  challenges,
  difficultyFilter,
  setDifficultyFilter,
  taskFilter,
  setTaskFilter,
  searchValue,
  setSearchValue,
  activeChallenge,
  onTry,
  answers,
  setAnswer,
  onCheck,
  results,
  onReveal,
  revealedAnswers,
  onReset,
}: MiniQuizProps) => (
  <section id={id} className="scroll-mt-24 space-y-6">
    <div className="space-y-2">
      <h2 tabIndex={-1} className="font-display text-3xl font-semibold">
        Mini Quiz
      </h2>
      <p className="text-muted-foreground max-w-2xl">
        Practice 20 focused challenges. Filter by difficulty or task, try one, and get feedback instantly without any floating HUDs.
      </p>
    </div>

    <div className="rounded-xl border bg-muted/20 px-4 py-4 space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="flex flex-wrap items-center gap-2">
          {MINI_DIFFICULTY_CHIPS.map((chip) => {
            const active = difficultyFilter === chip;
            return (
              <Button
                key={chip}
                variant={active ? "default" : "outline"}
                size="sm"
                onClick={() => setDifficultyFilter(chip)}
              >
                {chip}
              </Button>
            );
          })}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {MINI_TASK_CHIPS.map((chip) => {
            const active = taskFilter === chip;
            return (
              <Button
                key={chip}
                variant={active ? "default" : "outline"}
                size="sm"
                onClick={() => setTaskFilter(chip)}
              >
                {chip}
              </Button>
            );
          })}
        </div>
        <div className="relative ml-auto w-full lg:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            placeholder="Search challenges"
            className="pl-9"
          />
        </div>
      </div>
    </div>

    {challenges.length === 0 ? (
      <EmptyState
        title="No challenges found"
        description="Try switching filters or clearing the search."
        actionLabel="Reset filters"
        onAction={() => {
          setDifficultyFilter("All");
          setTaskFilter("All");
          setSearchValue("");
        }}
      />
    ) : (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {challenges.map((challenge) => {
          const isActive = activeChallenge === challenge.id;
          const result = results[challenge.id];
          const revealed = revealedAnswers[challenge.id];
          const answer = answers[challenge.id] ?? "";
          return (
            <Card key={challenge.id} className="flex flex-col glass-card-soft ring-gradient-glow hover:shadow-[0_20px_70px_-15px_rgba(139,92,246,0.2)] transition-all duration-300">
              <CardHeader className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{challenge.difficulty}</Badge>
                  <Badge variant="outline" className="capitalize">{challenge.taskType}</Badge>
                </div>
                <CardTitle className="text-lg">{challenge.title}</CardTitle>
                <CardDescription>{describeChallenge(challenge)}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 flex-1">
                <Button size="sm" onClick={() => onTry(challenge.id)}>
                  {isActive ? "Close" : "Try"}
                </Button>

                {isActive && (
                  <div className="space-y-3 border-t pt-4">
                    <div className="rounded-md border bg-muted/40 p-3 text-sm whitespace-pre-wrap">
                      {challenge.inputText}
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium" htmlFor={`${challenge.id}-answer`}>
                        Your answer
                      </label>
                      <Textarea
                        id={`${challenge.id}-answer`}
                        value={answer}
                        onChange={(event) => setAnswer(challenge.id, event.target.value)}
                        className="min-h-[120px]"
                      />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" onClick={() => onCheck(challenge)}>
                        Check
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => onReveal(challenge.id)}>
                        Reveal ideal answer
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => onReset(challenge.id)}>
                        Reset
                      </Button>
                    </div>

                    {result && (
                      <div className="rounded-md border bg-muted/30 p-3 space-y-2">
                        <div className="flex items-center gap-2">
                          <Award className="h-4 w-4 text-primary" />
                          <span className="font-semibold">{result.score}</span>
                          <span className="text-sm text-muted-foreground">
                            {result.grade === "invalid_response" ? "Invalid response" : result.grade}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{result.feedback}</p>
                        {result.breakdown.notes.length > 0 && (
                          <ul className="list-disc space-y-1 pl-5 text-xs text-muted-foreground">
                            {result.breakdown.notes.slice(0, 2).map((note, index) => (
                              <li key={`${challenge.id}-note-${index}`}>{note}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}

                    {revealed && (
                      <div className="rounded-md border bg-background p-3 space-y-2">
                        <p className="text-sm font-semibold">Ideal answer</p>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {challenge.idealAnswer}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    )}
  </section>
);

const EmptyState = ({
  title,
  description,
  actionLabel,
  onAction,
}: {
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
}) => (
  <div className="rounded-xl border border-dashed p-10 text-center space-y-3">
    <h3 className="text-lg font-semibold">{title}</h3>
    <p className="text-sm text-muted-foreground">{description}</p>
    <Button variant="outline" size="sm" onClick={onAction}>
      {actionLabel}
    </Button>
  </div>
);

export default EduPrompt;
