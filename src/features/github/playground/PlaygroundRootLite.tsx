import { useCallback, useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import { ScenarioPanelLite } from './ScenarioPanelLite';
import { TerminalLite } from './TerminalLite';
import { RepoInspectorLite } from './RepoInspectorLite';
import SummaryModal from './SummaryModal';
import { runCommand } from './runCommand';
import { OBJECTIVE_MATCHERS, normaliseCommand } from './objectiveMatchers';
import type { RepoState, Scenario } from './types';
import scenariosFile from './data/scenarios.json';
import walkthroughFile from './data/git_walkthrough.json';

type WalkthroughMap = typeof walkthroughFile;

const SCENARIOS: Scenario[] = (scenariosFile as { scenarios: Scenario[] }).scenarios;
const WALKTHROUGH: WalkthroughMap = walkthroughFile as WalkthroughMap;

interface PlaygroundProgressMeta {
  scenarioId: string;
}

interface PlaygroundRootLiteProps {
  onProgress?: (completed: number, total: number, meta: PlaygroundProgressMeta) => void;
  onReset?: (meta: PlaygroundProgressMeta) => void;
}

interface HistoryEntry {
  command: string;
  repo: RepoState;
  logs: string[];
  objectives: boolean[];
  walkIndex: number;
}

interface SummaryState {
  scenarioId: string;
  title: string;
  startedAt: number;
  endedAt: number;
  commandsRun: number;
  hintsUsed: number;
  objectives: string[];
}

const cloneRepo = (repo: RepoState): RepoState => ({
  branches: [...repo.branches],
  currentBranch: repo.currentBranch,
  files: { ...repo.files },
  staged: [...repo.staged],
  commits: repo.commits.map((commit) => ({ ...commit })),
  tags: repo.tags.map((tag) => ({ ...tag })),
  stash: repo.stash.map((entry) => ({ ...entry, files: { ...entry.files } })),
  pendingConflict: repo.pendingConflict,
  rebaseState: repo.rebaseState ?? null,
});

const normaliseRepo = (initial: Scenario['initialRepo']): RepoState => {
  const commits = (initial.commits ?? []).map((commit) => ({
    ...commit,
    timestamp: commit.timestamp ?? Date.now(),
  }));
  const tagsArray =
    Array.isArray((initial as unknown as { tags?: { name: string; message: string; createdAt?: number }[] }).tags) ?
      ((initial as unknown as { tags?: { name: string; message: string; createdAt?: number }[] }).tags ?? []).map((tag, index) => ({
        name: tag.name ?? `v${index + 1}.0`,
        message: tag.message ?? '',
        createdAt: tag.createdAt ?? Date.now(),
      })) :
      [];
  const stashArray =
    Array.isArray((initial as unknown as { stash?: Array<{ id?: string; files?: Record<string, string>; branch?: string }> }).stash) ?
      ((initial as unknown as { stash?: Array<{ id?: string; files?: Record<string, string>; branch?: string }> }).stash ?? []).map((entry, index) => ({
        id: entry.id ?? `stash@{${index}}`,
        files: { ...(entry.files ?? {}) },
        branch: entry.branch ?? initial.currentBranch ?? initial.branches[0] ?? 'main',
      })) :
      [];

  return {
    branches: [...(initial.branches ?? ['main'])],
    currentBranch: initial.currentBranch ?? initial.branches?.[0] ?? 'main',
    files: { ...(initial.files ?? {}) },
    staged: [...(initial.staged ?? [])],
    commits,
    tags: tagsArray,
    stash: stashArray,
    pendingConflict: false,
    rebaseState: null,
  };
};

const buildInitialLogs = (scenario: Scenario) => [
  `Scenario loaded: ${scenario.title}`,
  scenario.goal,
  scenario.sandbox ? 'Sandbox mode: experiment freely.' : 'Use the objectives list to track your progress.',
];

const ensureScenarioArrays = (scenario: Scenario) => ({
  objectives: scenario.objectives.map(() => false),
  hints: scenario.hints ?? [],
});

export const PlaygroundRootLite = ({ onProgress, onReset }: PlaygroundRootLiteProps) => {
  if (SCENARIOS.length === 0) {
    return (
      <div className="glass-card p-6 text-sm text-muted-foreground">
        No playground scenarios found.
      </div>
    );
  }

  const defaultScenario = SCENARIOS[0];
  const [activeScenarioId, setActiveScenarioId] = useState<string>(defaultScenario.id);
  const [repoStateInternal, setRepoStateInternal] = useState<RepoState>(() => normaliseRepo(defaultScenario.initialRepo));
  const repoRef = useRef<RepoState>(repoStateInternal);
  const setRepoState = useCallback(
    (updater: SetStateAction<RepoState>) => {
      setRepoStateInternal((prev) => {
        const next = typeof updater === 'function' ? (updater as (value: RepoState) => RepoState)(prev) : updater;
        repoRef.current = next;
        return next;
      });
    },
    [setRepoStateInternal]
  );

  const [logsInternal, setLogsInternal] = useState<string[]>(() => buildInitialLogs(defaultScenario));
  const logsRef = useRef<string[]>(logsInternal);
  const setLogs = useCallback(
    (updater: SetStateAction<string[]>) => {
      setLogsInternal((prev) => {
        const next = typeof updater === 'function' ? (updater as (value: string[]) => string[])(prev) : updater;
        logsRef.current = next;
        return next;
      });
    },
    [setLogsInternal]
  );

  const [guidedMode, setGuidedMode] = useState(false);
  const [historyMap, setHistoryMap] = useState<Record<string, HistoryEntry[]>>({ [defaultScenario.id]: [] });
  const [completedObjectivesMap, setCompletedObjectivesMap] = useState<Record<string, boolean[]>>({
    [defaultScenario.id]: ensureScenarioArrays(defaultScenario).objectives,
  });
  const [hintIndexMap, setHintIndexMap] = useState<Record<string, number>>({ [defaultScenario.id]: 0 });
  const [walkIndexMap, setWalkIndexMap] = useState<Record<string, number>>({ [defaultScenario.id]: 0 });
  const [runningSolution, setRunningSolution] = useState(false);
  const [summaryState, setSummaryState] = useState<SummaryState | null>(null);
  const [scenarioStartTimes, setScenarioStartTimes] = useState<Record<string, number>>({
    [defaultScenario.id]: Date.now(),
  });
  const [commandsRunMap, setCommandsRunMap] = useState<Record<string, number>>({ [defaultScenario.id]: 0 });
  const [hintsUsedMap, setHintsUsedMap] = useState<Record<string, number>>({ [defaultScenario.id]: 0 });

  const recentCommandsRef = useRef<Record<string, { list: string[]; cursor: number | null }>>({
    [defaultScenario.id]: { list: [], cursor: null },
  });
  const runSolutionTokenRef = useRef(0);

  const scenario = useMemo<Scenario>(() => SCENARIOS.find((item) => item.id === activeScenarioId) ?? defaultScenario, [activeScenarioId, defaultScenario]);
  const objectiveState = completedObjectivesMap[scenario.id] ?? ensureScenarioArrays(scenario).objectives;
  const hintIndex = hintIndexMap[scenario.id] ?? 0;
  const scenarioHistory = historyMap[scenario.id] ?? [];
  const walkIndex = walkIndexMap[scenario.id] ?? 0;
  const walkthroughSteps = (WALKTHROUGH as Record<string, { title: string; expected: string[] }[]>)[scenario.id] ?? [];
  const currentStep = walkthroughSteps[walkIndex];

  const appendLog = useCallback(
    (line: string | string[]) => {
      const lines = Array.isArray(line) ? line : [line];
      setLogs((prev) => {
        const combined = [...prev, ...lines];
        const overflow = Math.max(combined.length - 200, 0);
        return overflow > 0 ? combined.slice(overflow) : combined;
      });
    },
    [setLogs]
  );

  const resetScenarioState = useCallback(
    (target: Scenario) => {
      const { objectives } = ensureScenarioArrays(target);
      const nextRepo = normaliseRepo(target.initialRepo);
      const nextLogs = buildInitialLogs(target);
      setRepoState(nextRepo);
      setLogs(nextLogs);
      setHistoryMap((prev) => ({ ...prev, [target.id]: [] }));
      setCompletedObjectivesMap((prev) => ({ ...prev, [target.id]: objectives }));
      setHintIndexMap((prev) => ({ ...prev, [target.id]: 0 }));
      setWalkIndexMap((prev) => ({ ...prev, [target.id]: 0 }));
      setScenarioStartTimes((prev) => ({ ...prev, [target.id]: Date.now() }));
      setCommandsRunMap((prev) => ({ ...prev, [target.id]: 0 }));
      setHintsUsedMap((prev) => ({ ...prev, [target.id]: 0 }));
      recentCommandsRef.current[target.id] = { list: [], cursor: null };
      repoRef.current = nextRepo;
      logsRef.current = nextLogs;
      onProgress?.(0, target.objectives.length, { scenarioId: target.id });
      onReset?.({ scenarioId: target.id });
    },
    [onProgress, onReset, setLogs, setRepoState]
  );

  const selectScenario = useCallback(
    (scenarioId: string) => {
      if (scenarioId === activeScenarioId) return;
      const nextScenario = SCENARIOS.find((item) => item.id === scenarioId);
      if (!nextScenario) return;
      runSolutionTokenRef.current += 1;
      setRunningSolution(false);
      setActiveScenarioId(scenarioId);
      resetScenarioState(nextScenario);
      setSummaryState(null);
    },
    [activeScenarioId, resetScenarioState]
  );

  const handleScenarioReset = useCallback(() => {
    runSolutionTokenRef.current += 1;
    setRunningSolution(false);
    resetScenarioState(scenario);
    setSummaryState(null);
  }, [resetScenarioState, scenario]);

  const recordScenarioProgress = useCallback(
    (scenarioId: string, values: boolean[]) => {
      const total = SCENARIOS.find((item) => item.id === scenarioId)?.objectives.length ?? 0;
      const completed = values.filter(Boolean).length;
      onProgress?.(completed, total, { scenarioId });
      const scenarioMeta = SCENARIOS.find((item) => item.id === scenarioId);
      if (scenarioMeta && total > 0 && completed === total && !scenarioMeta.sandbox) {
        setSummaryState({
          scenarioId,
          title: scenarioMeta.title,
          startedAt: scenarioStartTimes[scenarioId] ?? Date.now(),
          endedAt: Date.now(),
          commandsRun: commandsRunMap[scenarioId] ?? 0,
          hintsUsed: hintsUsedMap[scenarioId] ?? 0,
          objectives: scenarioMeta.objectives,
        });
      }
    },
    [commandsRunMap, hintsUsedMap, onProgress, scenarioStartTimes]
  );

  const fallbackObjectiveMatch = useCallback((objective: string, command: string) => {
    const normalizedObjective = objective.toLowerCase();
    const normalizedCommand = command.toLowerCase();
    const commandWithoutGit = normalizedCommand.replace(/^git\s+/, '');

    if (
      normalizedCommand === normalizedObjective ||
      normalizedCommand.startsWith(normalizedObjective) ||
      normalizedObjective.startsWith(normalizedCommand) ||
      normalizedObjective.includes(normalizedCommand) ||
      commandWithoutGit.includes(normalizedObjective) ||
      normalizedObjective.includes(commandWithoutGit)
    ) {
      return true;
    }

    if (normalizedObjective.includes('change') && /(nano|touch|echo)/.test(normalizedCommand)) return true;
    if (normalizedObjective.includes('conflict') && normalizedCommand.startsWith('git status')) return true;
    if (normalizedObjective.includes('stage') && normalizedCommand.startsWith('git add')) return true;
    if (normalizedObjective.includes('commit') && normalizedCommand.startsWith('git commit')) return true;
    if (normalizedObjective.includes('merge') && normalizedCommand.startsWith('git merge')) return true;
    if (normalizedObjective.includes('reset') && normalizedCommand.startsWith('git reset')) return true;
    if (normalizedObjective.includes('stash') && normalizedCommand.startsWith('git stash')) return true;
    if (normalizedObjective.includes('switch') && normalizedCommand.startsWith('git checkout')) return true;
    if (normalizedObjective.includes('tag') && normalizedCommand.startsWith('git tag')) return true;
    if (normalizedObjective.includes('show') && normalizedCommand.startsWith('git show')) return true;
    if (normalizedObjective.includes('rebase') && normalizedCommand.startsWith('git rebase')) return true;
    if (normalizedObjective.includes('log') && normalizedCommand.startsWith('git log')) return true;
    if (normalizedObjective.includes('history') && normalizedCommand.startsWith('git log')) return true;

    return false;
  }, []);

  const objectiveMatches = useCallback(
    (objective: string, command: string, index: number) => {
      const normalizedCommand = normaliseCommand(command);
      const matchersForScenario = OBJECTIVE_MATCHERS[scenario.id];
      if (matchersForScenario?.[index]?.some((pattern) => pattern.test(normalizedCommand))) {
        return true;
      }
      return fallbackObjectiveMatch(objective, normalizedCommand);
    },
    [fallbackObjectiveMatch, scenario.id]
  );

  const completeObjective = useCallback(
    (command: string) => {
      if (scenario.sandbox || scenario.objectives.length === 0) return;
      setCompletedObjectivesMap((prev) => {
        const current = prev[scenario.id] ?? ensureScenarioArrays(scenario).objectives;
        let changed = false;
        const next = current.map((done, index) => {
          if (done) return true;
          if (objectiveMatches(scenario.objectives[index], command, index)) {
            changed = true;
            return true;
          }
          return false;
        });
        if (!changed) return prev;
        recordScenarioProgress(scenario.id, next);
        return { ...prev, [scenario.id]: next };
      });
    },
    [objectiveMatches, recordScenarioProgress, scenario]
  );

  const advanceGuidedStep = useCallback(() => {
    setWalkIndexMap((prev) => {
      const current = prev[scenario.id] ?? 0;
      const steps = walkthroughSteps.length;
      if (steps === 0) return prev;
      const nextIndex = Math.min(current + 1, steps);
      if (nextIndex === current) return prev;
      return { ...prev, [scenario.id]: nextIndex };
    });
  }, [scenario.id, walkthroughSteps.length]);

  const recordHintUsage = useCallback(() => {
    setHintsUsedMap((prev) => ({
      ...prev,
      [scenario.id]: (prev[scenario.id] ?? 0) + 1,
    }));
  }, [scenario.id]);

  const pushHistorySnapshot = useCallback(
    (snapshot: HistoryEntry) => {
      setHistoryMap((prev) => {
        const stack = prev[scenario.id] ? [...prev[scenario.id]] : [];
        stack.push(snapshot);
        return { ...prev, [scenario.id]: stack.slice(-20) };
      });
    },
    [scenario.id]
  );

  const handleRewind = useCallback(() => {
    setHistoryMap((prev) => {
      const stack = prev[scenario.id] ?? [];
      if (stack.length === 0) return prev;
      const nextStack = stack.slice(0, -1);
      const last = stack[stack.length - 1];
      const restoredRepo = cloneRepo(last.repo);
      const restoredLogs = [...last.logs];
      setRepoState(restoredRepo);
      setLogs(restoredLogs);
      setCompletedObjectivesMap((objectiveMap) => ({
        ...objectiveMap,
        [scenario.id]: [...last.objectives],
      }));
      setWalkIndexMap((map) => ({ ...map, [scenario.id]: last.walkIndex }));
      recordScenarioProgress(scenario.id, last.objectives);
      return { ...prev, [scenario.id]: nextStack };
    });
  }, [recordScenarioProgress, scenario.id, setLogs, setRepoState]);

  const appendPromptLine = useCallback(
    (command: string) => {
      appendLog(`student@decodeai:~$ ${command}`);
    },
    [appendLog]
  );

  const handleCommand = useCallback(
    (command: string, options?: { fromScript?: boolean }) => {
      if (runningSolution && !options?.fromScript) return;
      const trimmed = command.trim();
      if (!trimmed) return;
      appendPromptLine(trimmed);

      const beforeSnapshot: HistoryEntry = {
        command: trimmed,
        repo: cloneRepo(repoRef.current),
        logs: [...logsRef.current],
        objectives: [...(completedObjectivesMap[scenario.id] ?? ensureScenarioArrays(scenario).objectives)],
        walkIndex: walkIndexMap[scenario.id] ?? 0,
      };

      const stateChanged = { current: false };
      const markStateChanged = () => {
        stateChanged.current = true;
      };

      const handledNonGit = (() => {
        const lower = trimmed.toLowerCase();
        if (lower.startsWith('nano ')) {
          const path = trimmed.slice(5).trim();
          if (!path) {
            appendLog('nano: provide a file path.');
            return true;
          }
          setRepoState((prev) => {
            const next = cloneRepo(prev);
            const existing = next.files[path] ?? '';
            const marker = existing.includes('// edited') ? existing : `${existing}// edited (simulated)\n`;
            next.files[path] = marker;
            if (!next.staged.includes(path)) {
              next.staged.push(path);
            }
            return next;
          });
          appendLog(`[nano] Edited ${path} (simulated).`);
          completeObjective(trimmed);
          stateChanged.current = true;
          return true;
        }
        if (lower.startsWith('touch ')) {
          const path = trimmed.slice(6).trim();
          if (!path) {
            appendLog('touch: provide a file name.');
            return true;
          }
          setRepoState((prev) => {
            const next = cloneRepo(prev);
            if (!next.files[path]) {
              next.files[path] = '';
            }
            if (!next.staged.includes(path)) {
              next.staged.push(path);
            }
            return next;
          });
          appendLog(`[touch] Created ${path} (simulated).`);
          completeObjective(trimmed);
          stateChanged.current = true;
          return true;
        }
        if (lower.startsWith('echo ')) {
          appendLog('[echo] Output captured (simulation only).');
          completeObjective(trimmed);
          return true;
        }
        return false;
      })();

      if (!handledNonGit) {
        runCommand(trimmed, repoRef.current, setRepoState, appendLog, {
          completeObjective,
          advanceGuidedStep,
          guidedMode,
          activeScenarioId: scenario.id,
          currentStepExpectations: currentStep?.expected,
          markStateChanged,
        });
      }

      setCommandsRunMap((prev) => ({
        ...prev,
        [scenario.id]: (prev[scenario.id] ?? 0) + 1,
      }));

      if (stateChanged.current) {
        pushHistorySnapshot(beforeSnapshot);
      }

      const recent = recentCommandsRef.current[scenario.id] ?? { list: [], cursor: null };
      const updatedList = [...recent.list, trimmed].slice(-15);
      recentCommandsRef.current[scenario.id] = { list: updatedList, cursor: null };
    },
    [
      advanceGuidedStep,
      appendLog,
      appendPromptLine,
      completeObjective,
      completedObjectivesMap,
      currentStep?.expected,
      guidedMode,
      pushHistorySnapshot,
      runningSolution,
      scenario,
      setRepoState,
    ]
  );

  const handleHistoryNavigate = useCallback(
    (direction: 'prev' | 'next') => {
      const memory = recentCommandsRef.current[scenario.id] ?? { list: [], cursor: null };
      if (memory.list.length === 0) return '';
      if (direction === 'prev') {
        const nextCursor = memory.cursor === null ? memory.list.length - 1 : Math.max(memory.cursor - 1, 0);
        memory.cursor = nextCursor;
        return memory.list[nextCursor] ?? '';
      }
      if (memory.cursor === null) return '';
      const nextCursor = memory.cursor + 1;
      if (nextCursor >= memory.list.length) {
        memory.cursor = null;
        return '';
      }
      memory.cursor = nextCursor;
      return memory.list[nextCursor] ?? '';
    },
    [scenario.id]
  );

  const handleRunSolution = useCallback(() => {
    if (scenario.sandbox || scenario.solution.length === 0 || runningSolution) return;
    const token = runSolutionTokenRef.current + 1;
    runSolutionTokenRef.current = token;
    setRunningSolution(true);
    const execute = async () => {
      try {
        for (const cmd of scenario.solution) {
          if (runSolutionTokenRef.current !== token) break;
          handleCommand(cmd, { fromScript: true });
          await new Promise((resolve) => window.setTimeout(resolve, 180));
        }
      } finally {
        if (runSolutionTokenRef.current === token) {
          setRunningSolution(false);
        }
      }
    };
    void execute();
  }, [handleCommand, runningSolution, scenario]);

  const handleToggleGuidedMode = useCallback(
    (value: boolean) => {
      setGuidedMode(value && !scenario.sandbox);
      if (value) {
        setWalkIndexMap((prev) => ({ ...prev, [scenario.id]: 0 }));
      }
    },
    [scenario]
  );

  const handleCycleHint = useCallback(() => {
    if (scenario.hints.length === 0) return;
    setHintIndexMap((prev) => ({
      ...prev,
      [scenario.id]: (prev[scenario.id] ?? 0) + 1,
    }));
    recordHintUsage();
  }, [recordHintUsage, scenario.hints, scenario.id]);

  const closeSummary = useCallback(() => setSummaryState(null), []);

  useEffect(() => {
    const currentObjectives = completedObjectivesMap[scenario.id] ?? ensureScenarioArrays(scenario).objectives;
    recordScenarioProgress(scenario.id, currentObjectives);
  }, [completedObjectivesMap, recordScenarioProgress, scenario]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-[360px_minmax(0,1fr)_260px]">
        <ScenarioPanelLite
          className="max-h-[680px] overflow-auto pr-2"
          scenarios={SCENARIOS}
          activeScenarioId={scenario.id}
          onSelectScenario={selectScenario}
          onRunSolution={handleRunSolution}
          onReset={handleScenarioReset}
          onRewind={handleRewind}
          runningSolution={runningSolution}
          guidedMode={guidedMode && !scenario.sandbox}
          onToggleGuidedMode={handleToggleGuidedMode}
          currentStepTitle={currentStep?.title}
          objectives={scenario.objectives}
          completedObjectives={objectiveState}
          hints={scenario.hints}
          hintIndex={hintIndex}
          onCycleHint={handleCycleHint}
          hasHistory={scenarioHistory.length > 0}
          isSandbox={scenario.sandbox}
          goal={scenario.goal}
        />
        <TerminalLite
          className="min-h-[640px]"
          logs={logsInternal}
          disabled={runningSolution}
          onCommand={handleCommand}
          onHistoryNavigate={handleHistoryNavigate}
          guidedMode={guidedMode && !scenario.sandbox}
          currentStepTitle={currentStep?.title}
          activeScenarioId={scenario.id}
          onHint={recordHintUsage}
        />
        <RepoInspectorLite repo={repoStateInternal} className="text-xs leading-5" />
      </div>
      {summaryState && (
        <SummaryModal
          open
          scenarioTitle={summaryState.title}
          objectives={summaryState.objectives}
          startedAt={summaryState.startedAt}
          endedAt={summaryState.endedAt}
          commandsRun={summaryState.commandsRun}
          hintsUsed={summaryState.hintsUsed}
          onClose={closeSummary}
          onReset={() => {
            closeSummary();
            handleScenarioReset();
          }}
        />
      )}
    </div>
  );
};

export default PlaygroundRootLite;
