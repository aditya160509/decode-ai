import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { AnimatedHero } from '@/components/AnimatedHero';
import { AnimatedSection } from '@/components/AnimatedSection';
import {
  loadIntro,
  loadConcepts,
  loadCommands,
  loadPlaygroundScenarios,
  loadPRFlow,
  loadFaqs,
  loadQuiz,
  loadWorkflows,
  loadCheatSheet,
  loadTakeaways,
} from '@/features/github/data';
import { usePersistentState } from '@/hooks/use-persistent-state';
import { SidebarNav } from '@/features/github/components/SidebarNav';
import { ProgressHud } from '@/features/github/components/ProgressHud';
import { ConceptSection } from '@/features/github/components/ConceptSection';
import { CommandCatalog } from '@/features/github/components/CommandCatalog';
import { PRWorkflowSection } from '@/features/github/components/PRWorkflowSection';
import { FaqSection } from '@/features/github/components/FaqSection';
import { QuizSection } from '@/features/github/components/QuizSection';
import { WorkflowsSection } from '@/features/github/components/WorkflowsSection';
import { CheatSheetSection } from '@/features/github/components/CheatSheetSection';
import { TakeawaysSection } from '@/features/github/components/TakeawaysSection';
import { IntroSection } from '@/features/github/components/IntroSection';
import { PlaygroundRootLite } from '@/features/github/playground/PlaygroundRootLite';
import { TerminalLite } from '@/features/github/playground/TerminalLite';
import { RepoInspectorLite } from '@/features/github/playground/RepoInspectorLite';
import { ScenarioPanelLite } from '@/features/github/playground/ScenarioPanelLite';
import SummaryModal from '@/features/github/playground/SummaryModal';
import type {
  Concept,
  CommandBlock,
  PlaygroundScenario,
  PRFlow,
  FAQ,
  QuizItem,
  WorkflowCard,
  CheatCluster,
  Intro,
} from '@/types/github';

type QuizStorage = Record<string, { answer: string; correct: boolean }>;

const sections = [
  { id: 'intro', label: 'Intro' },
  { id: 'concepts', label: 'Concepts' },
  { id: 'commands', label: 'Commands' },
  { id: 'playground', label: 'Playground' },
  { id: 'pr-workflow', label: 'PR Workflow' },
  { id: 'faqs', label: 'FAQs' },
  { id: 'quiz', label: 'Quiz' },
  { id: 'workflows', label: 'Workflows' },
  { id: 'cheatsheet', label: 'Cheat Sheet' },
  { id: 'takeaways', label: 'Takeaways' },
];

const GitHub = () => {
  const location = useLocation();
  const [intro, setIntro] = useState<Intro | null>(null);
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [commands, setCommands] = useState<CommandBlock[]>([]);
  const [prFlow, setPRFlow] = useState<PRFlow | null>(null);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [quizItems, setQuizItems] = useState<QuizItem[]>([]);
  const [workflows, setWorkflows] = useState<WorkflowCard[]>([]);
  const [cheatHeader, setCheatHeader] = useState<string>('');
  const [cheatClusters, setCheatClusters] = useState<CheatCluster[]>([]);
  const [takeaways, setTakeaways] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<string | null>('intro');

  const [learnedConcepts, setLearnedConcepts] = usePersistentState<string[]>('decodeai_github_concepts', []);
  const [quizState, setQuizState] = usePersistentState<QuizStorage>('decodeai_github_quiz', {});
  const [playgroundScenarios, setPlaygroundScenarios] = useState<PlaygroundScenario[]>([]);
  const [playgroundProgress, setPlaygroundProgress] = usePersistentState<Record<string, boolean>>(
    'decodeai_github_playground',
    {}
  );
  const [playgroundSession, setPlaygroundSession] = useState(0);

  const conceptMap = useMemo(() => {
    const map: Record<string, boolean> = {};
    learnedConcepts.forEach((title) => {
      map[title] = true;
    });
    return map;
  }, [learnedConcepts]);

  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      setLoading(true);
      try {
        const [
          introData,
          conceptData,
          commandData,
          playgroundData,
          prFlowData,
          faqData,
          quizData,
          workflowData,
          cheatSheetData,
          takeawayData,
        ] = await Promise.all([
          loadIntro(),
          loadConcepts(),
          loadCommands(),
          loadPlaygroundScenarios(),
          loadPRFlow(),
          loadFaqs(),
          loadQuiz(),
          loadWorkflows(),
          loadCheatSheet(),
          loadTakeaways(),
        ]);
        if (!cancelled) {
          setIntro(introData);
          setConcepts(conceptData);
          setCommands(commandData);
          setPlaygroundScenarios(playgroundData);
          setPRFlow(prFlowData);
          setFaqs(faqData);
          setQuizItems(quizData);
          setWorkflows(workflowData);
          setCheatHeader(cheatSheetData.header);
          setCheatClusters(cheatSheetData.clusters);
          setTakeaways(takeawayData);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchData();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (loading) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible.length > 0) {
          const id = visible[0].target.getAttribute('id');
          if (id) setActiveSection(id);
        }
      },
      { rootMargin: '-40% 0px -45% 0px', threshold: [0.1, 0.25, 0.5] }
    );

    sections.forEach((section) => {
      const el = document.getElementById(section.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [loading]);

  useEffect(() => {
    if (!loading && location.hash) {
      const targetId = location.hash.replace('#', '');
      const el = document.getElementById(targetId);
      if (el) {
        setTimeout(() => {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          setActiveSection(targetId);
        }, 100);
      }
    }
  }, [location.hash, loading]);

  const toggleConcept = useCallback(
    (title: string) => {
      setLearnedConcepts((prev) =>
        prev.includes(title) ? prev.filter((item) => item !== title) : [...prev, title]
      );
    },
    [setLearnedConcepts]
  );

  const conceptPercent = useMemo(
    () => (concepts.length ? (learnedConcepts.length / concepts.length) * 100 : 0),
    [concepts.length, learnedConcepts.length]
  );

  const answersByIndex = useMemo(() => {
    const map: Record<number, string> = {};
    quizItems.forEach((item, index) => {
      const entry = quizState[item.question];
      if (entry) map[index] = entry.answer;
    });
    return map;
  }, [quizItems, quizState]);

  const resultsByIndex = useMemo(() => {
    const map: Record<number, boolean> = {};
    quizItems.forEach((item, index) => {
      const entry = quizState[item.question];
      if (entry) map[index] = entry.correct;
    });
    return map;
  }, [quizItems, quizState]);

  const quizScore = useMemo(
    () => quizItems.reduce((acc, item) => acc + (quizState[item.question]?.correct ? 1 : 0), 0),
    [quizItems, quizState]
  );

  const quizBadges = useMemo(() => {
    const list: string[] = [];
    if (quizScore >= 5) list.push('Commit Novice');
    if (quizScore >= 10) list.push('Branch Expert');
    if (quizScore >= quizItems.length && quizItems.length > 0) list.push('Merge Master');
    return list;
  }, [quizScore, quizItems.length]);

  const { scenariosCompleted, scenariosTotal } = useMemo(() => {
    const total = playgroundScenarios.length;
    if (total === 0) {
      return { scenariosCompleted: 0, scenariosTotal: 0 };
    }
    const completed = playgroundScenarios.reduce(
      (count, scenario) => count + (playgroundProgress[scenario.id] ? 1 : 0),
      0
    );
    return { scenariosCompleted: completed, scenariosTotal: total };
  }, [playgroundProgress, playgroundScenarios]);

  const handleAnswer = useCallback(
    (index: number, answer: string) => {
      const item = quizItems[index];
      if (!item) return;
      setQuizState((prev) => ({
        ...prev,
        [item.question]: { answer, correct: item.correct === answer },
      }));
    },
    [quizItems, setQuizState]
  );

  const handleResetQuiz = useCallback(() => {
    setQuizState({});
  }, [setQuizState]);

  const handleNavigate = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveSection(id);
      if (window.history && window.history.replaceState) {
        window.history.replaceState(null, '', `#${id}`);
      }
    }
  }, []);

  const resetAll = useCallback(() => {
    setLearnedConcepts([]);
    setQuizState({});
    setPlaygroundProgress({});
    setPlaygroundSession((prev) => prev + 1);
  }, [setLearnedConcepts, setPlaygroundProgress, setQuizState]);

  const handlePlaygroundProgress = useCallback(
    (completed: number, total: number, meta?: { scenarioId: string }) => {
      const scenarioId = meta?.scenarioId;
      if (!scenarioId) return;
      setPlaygroundProgress((prev) => {
        if (total === 0) {
          if (!(scenarioId in prev)) return prev;
          const next = { ...prev };
          delete next[scenarioId];
          return next;
        }
        const isComplete = completed >= total;
        if (prev[scenarioId] === isComplete) return prev;
        return { ...prev, [scenarioId]: isComplete };
      });
    },
    [setPlaygroundProgress]
  );

  const handlePlaygroundReset = useCallback(
    (meta?: { scenarioId: string }) => {
      const scenarioId = meta?.scenarioId;
      if (!scenarioId) return;
      setPlaygroundProgress((prev) => {
        if (!(scenarioId in prev) || prev[scenarioId] === false) return prev;
        return { ...prev, [scenarioId]: false };
      });
    },
    [setPlaygroundProgress]
  );

  return (
    <div className="relative min-h-screen noise-texture">
      <AnimatedHero>
        <div className="container mx-auto flex gap-8 px-4 pt-28 pb-20">
        <SidebarNav
          sections={sections}
          activeSection={activeSection}
          onNavigate={handleNavigate}
        />
        <div className="flex-1 space-y-16">
          <AnimatedSection>
            <IntroSection
            intro={intro}
            id="intro"
            progressHud={
              <ProgressHud
                conceptPercent={conceptPercent}
                quizScore={quizScore}
                quizTotal={quizItems.length}
                scenariosCompleted={scenariosTotal > 0 ? scenariosCompleted : undefined}
                scenariosTotal={scenariosTotal > 0 ? scenariosTotal : undefined}
                onResetAll={resetAll}
                className="lg:max-w-sm"
              />
            }
          />
          </AnimatedSection>
          {loading ? (
            <div className="flex h-60 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <ConceptSection concepts={concepts} learned={conceptMap} onToggle={toggleConcept} />
              <CommandCatalog commands={commands} />
              <section id="playground" className="scroll-mt-28 space-y-6">
                <header className="space-y-2">
                  <h2 className="font-display text-3xl font-semibold text-foreground">Playground</h2>
                  <p className="text-muted-foreground">
                    Practice Git commands in a safe terminal. Complete each scenario&apos;s objectives to level up.
                  </p>
                </header>
                <PlaygroundRootLite
                  key={playgroundSession}
                  onProgress={handlePlaygroundProgress}
                  onReset={handlePlaygroundReset}
                />
              </section>
              {prFlow && <PRWorkflowSection data={prFlow} />}
              <FaqSection faqs={faqs} />
              <QuizSection
                items={quizItems}
                answers={answersByIndex}
                results={resultsByIndex}
                onSelect={handleAnswer}
                onReset={handleResetQuiz}
                badges={quizBadges}
                score={quizScore}
              />
              <WorkflowsSection workflows={workflows} />
              <CheatSheetSection header={cheatHeader} clusters={cheatClusters} />
              <TakeawaysSection takeaways={takeaways} />
            </>
          )}
        </div>
      </div>
      </AnimatedHero>
    </div>
  );
};

export default GitHub;
