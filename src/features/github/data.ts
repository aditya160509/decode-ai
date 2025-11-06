import type {
  Intro,
  Concept,
  CommandBlock,
  PRFlow,
  FAQ,
  PlaygroundScenario,
  QuizItem,
  WorkflowCard,
  CheatCluster,
} from '@/types/github';

let introCache: Intro | null = null;
let conceptsCache: Concept[] | null = null;
let commandsCache: CommandBlock[] | null = null;
let prFlowCache: PRFlow | null = null;
let faqsCache: FAQ[] | null = null;
let playgroundCache: PlaygroundScenario[] | null = null;
let quizCache: QuizItem[] | null = null;
let workflowsCache: WorkflowCard[] | null = null;
let cheatSheetCache: { header: string; clusters: CheatCluster[] } | null = null;
let takeawaysCache: string[] | null = null;

const loadJson = async <T>(importer: () => Promise<{ default: T }>): Promise<T> => {
  const mod = await importer();
  return mod.default;
};

export const loadIntro = async () => {
  if (!introCache) {
    introCache = await loadJson<Intro>(() => import('@/data/github_intro.json'));
  }
  return introCache;
};

export const loadConcepts = async () => {
  if (!conceptsCache) {
    conceptsCache = await loadJson<Concept[]>(() => import('@/data/github_concepts.json'));
  }
  return conceptsCache;
};

export const loadCommands = async () => {
  if (!commandsCache) {
    commandsCache = await loadJson<CommandBlock[]>(() => import('@/data/github_commands.json'));
  }
  return commandsCache;
};

export const loadPRFlow = async () => {
  if (!prFlowCache) {
    prFlowCache = await loadJson<PRFlow>(() => import('@/data/github_pr_workflow.json'));
  }
  return prFlowCache;
};

export const loadFaqs = async () => {
  if (!faqsCache) {
    faqsCache = await loadJson<FAQ[]>(() => import('@/data/github_faqs.json'));
  }
  return faqsCache;
};

export const loadPlaygroundScenarios = async () => {
  if (!playgroundCache) {
    playgroundCache = await loadJson<PlaygroundScenario[]>(() => import('@/data/github_playground.json'));
  }
  return playgroundCache;
};

export const loadQuiz = async () => {
  if (!quizCache) {
    quizCache = await loadJson<QuizItem[]>(() => import('@/data/github_quiz.json'));
  }
  return quizCache;
};

export const loadWorkflows = async () => {
  if (!workflowsCache) {
    const data = await loadJson<{ workflows: WorkflowCard[] }>(() => import('@/data/github_workflows.json'));
    workflowsCache = data.workflows;
  }
  return workflowsCache;
};

export const loadCheatSheet = async () => {
  if (!cheatSheetCache) {
    cheatSheetCache = await loadJson<{ header: string; clusters: CheatCluster[] }>(() => import('@/data/github_cheatsheet.json'));
  }
  return cheatSheetCache;
};

export const loadTakeaways = async () => {
  if (!takeawaysCache) {
    const data = await loadJson<{ takeaways: string[] }>(() => import('@/data/github_takeaways.json'));
    takeawaysCache = data.takeaways;
  }
  return takeawaysCache;
};
