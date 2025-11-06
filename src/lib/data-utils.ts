import homeHighlights from '@/data/home_highlights.json';
import gitConcepts from '@/data/git_concepts.json';
import tools from '@/data/tools.json';
import aiGlossary from '@/data/ai_glossary.json';
import edupromptExamples from '@/data/eduprompt_examples.json';
import demoTexts from '@/data/demo_texts.json';
import learningLinks from '@/data/learning_links.json';
import projectsByField from '@/data/projects_by_field.json';
import about from '@/data/about.json';

export const getHomeHighlights = () => homeHighlights;

export const getGitConcepts = () => gitConcepts;

export const getTools = () => tools;

export const getAIGlossary = () => aiGlossary;

export const getPromptPatterns = () => edupromptExamples;

export type DemoCategory = 'summarize' | 'classify' | 'extract';

export interface DemoEntry {
  id: string;
  title: string;
  text: string;
  output: string;
}

const demoTextsData = demoTexts as Record<DemoCategory, DemoEntry[]>;

export const getDemoTexts = (kind?: DemoCategory) => {
  if (kind) return demoTextsData[kind];
  return demoTextsData;
};

export const getResourcesByTopic = (topic: string) => {
  const key = topic as keyof typeof learningLinks;
  return learningLinks[key] || [];
};

export const getProjectsByField = () => projectsByField;

export const getAboutInfo = () => about;

export const getAllSearchableItems = () => {
  const pages = [
    { title: 'Home', url: '/', category: 'Page' },
    { title: 'GitHub Basics', url: '/github', category: 'Page' },
    { title: 'No-Code Toolkit', url: '/nocode', category: 'Page' },
    { title: 'AI Concepts', url: '/ai', category: 'Page' },
    { title: 'EduPrompt', url: '/eduprompt', category: 'Page' },
    { title: 'Mini Demos', url: '/demos', category: 'Page' },
    { title: 'FAQ & Resources', url: '/faq', category: 'Page' },
    { title: 'About', url: '/about', category: 'Page' },
  ];

  const glossaryItems = aiGlossary.map(item => ({
    title: item.term,
    url: '/ai',
    category: 'Glossary',
    desc: item.desc,
  }));

  const projectItems = Object.entries(projectsByField).flatMap(([field, projects]) =>
    projects.map(project => ({
      title: project.name,
      url: '/faq',
      category: 'Project',
      desc: project.desc,
    }))
  );

  return [...pages, ...glossaryItems, ...projectItems];
};

export const copy = async (text: string) => {
  await navigator.clipboard.writeText(text);
};
