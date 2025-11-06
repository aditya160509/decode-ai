import { motion } from 'framer-motion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { getResourcesByTopic, getProjectsByField } from '@/lib/data-utils';
import { ExternalLink, Youtube, FileText, ListVideo } from 'lucide-react';
import { useState } from 'react';

const FAQ = () => {
  const [selectedTopic, setSelectedTopic] = useState('GitHub');
  const resources = getResourcesByTopic(selectedTopic);
  const projectsByField = getProjectsByField();

  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.5 }
  };

  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'video':
        return <Youtube className="w-4 h-4" />;
      case 'documentation':
        return <FileText className="w-4 h-4" />;
      case 'course':
      case 'interactive':
        return <ListVideo className="w-4 h-4" />;
      default:
        return <ExternalLink className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-20 px-4">
      <div className="container mx-auto max-w-5xl">
        <motion.div {...fadeIn} className="text-center mb-16">
          <h1 className="font-display text-5xl md:text-6xl font-bold mb-6 heading-gradient">
            FAQ & Resources
          </h1>
          <p className="text-xl text-muted-foreground">
            Curated learning paths and project inspiration.
          </p>
        </motion.div>

        {/* Topic Resources */}
        <motion.section {...fadeIn} className="mb-16">
          <div className="glass-card p-8">
            <h2 className="font-display text-3xl font-bold mb-6">Learning Resources by Topic</h2>
            
            <div className="mb-6">
              <Select value={selectedTopic} onValueChange={setSelectedTopic}>
                <SelectTrigger className="bg-secondary/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GitHub">GitHub</SelectItem>
                  <SelectItem value="AI">AI</SelectItem>
                  <SelectItem value="Prompting">Prompting</SelectItem>
                  <SelectItem value="No-Code">No-Code</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4">
              {resources.map((resource, i) => (
                <a
                  key={i}
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="glass-card glass-hover p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                      {getTypeIcon(resource.type)}
                    </div>
                    <div>
                      <h3 className="font-semibold">{resource.title}</h3>
                      <p className="text-sm text-muted-foreground">{resource.type} • {resource.duration}</p>
                    </div>
                  </div>
                  <ExternalLink className="w-5 h-5 text-muted-foreground" />
                </a>
              ))}
            </div>
          </div>
        </motion.section>

        {/* Projects by Field */}
        <motion.section {...fadeIn} className="mb-16">
          <h2 className="font-display text-3xl font-bold mb-8">Project Ideas by Field</h2>
          <div className="space-y-6">
            {Object.entries(projectsByField).map(([field, projects]) => (
              <div key={field} className="glass-card p-6">
                <h3 className="font-display text-2xl font-semibold mb-4 text-primary">{field}</h3>
                <div className="grid gap-4">
                  {projects.map((project, i) => (
                    <div key={i} className="bg-secondary/50 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold">{project.name}</h4>
                        <span className={`text-xs px-2 py-1 rounded ${
                          project.difficulty === 'Beginner' ? 'bg-success/20 text-success' :
                          project.difficulty === 'Intermediate' ? 'bg-accent/20 text-accent' :
                          'bg-warning/20 text-warning'
                        }`}>
                          {project.difficulty}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{project.desc}</p>
                      <div className="flex flex-wrap gap-2">
                        {project.tools.map((tool, j) => (
                          <span key={j} className="text-xs px-2 py-1 bg-primary/10 text-primary rounded">
                            {tool}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </motion.section>

        {/* FAQ Accordion */}
        <motion.section {...fadeIn} className="mb-16">
          <h2 className="font-display text-3xl font-bold mb-8">Frequently Asked Questions</h2>
          <Accordion type="single" collapsible className="space-y-4">
            <AccordionItem value="item-1" className="glass-card px-6">
              <AccordionTrigger className="font-display">
                How do I get started with no prior coding experience?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Start with our No-Code Toolkit page! Tools like Lovable, Hugging Face Spaces, and Google Colab let you build AI projects without writing code. Once comfortable, explore GitHub basics to manage your projects.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2" className="glass-card px-6">
              <AccordionTrigger className="font-display">
                Which AI model should I use for my project?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                It depends on your use case: GPT-4 for complex reasoning, Claude for long documents, Llama for open-source/local deployment, and specialized models like FinBERT for finance or BioBERT for healthcare.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3" className="glass-card px-6">
              <AccordionTrigger className="font-display">
                How can I avoid API rate limits?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Implement exponential backoff retry logic, cache responses when possible, batch requests, and monitor your usage. Consider using open-source models locally for development to save API credits.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4" className="glass-card px-6">
              <AccordionTrigger className="font-display">
                What's the difference between fine-tuning and RAG?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Fine-tuning retrains a model on your specific data (expensive, requires expertise). RAG retrieves relevant docs and feeds them to a pre-trained model (cheaper, easier, better for frequently updated info).
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-5" className="glass-card px-6">
              <AccordionTrigger className="font-display">
                How do I deploy my project for free?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Use Vercel for static sites, Hugging Face Spaces for ML demos, Google Colab for notebooks, or Lovable for full-stack apps. All offer generous free tiers perfect for student projects.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-6" className="glass-card px-6">
              <AccordionTrigger className="font-display">
                Where can I find datasets for my AI project?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Check Kaggle, Hugging Face Datasets, Google Dataset Search, UCI Machine Learning Repository, and Papers with Code. Always verify licensing before use.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-7" className="glass-card px-6">
              <AccordionTrigger className="font-display">
                How can I contribute to open-source AI projects?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Start with good first issues on GitHub, improve documentation, add examples, or create tutorials. Projects like Hugging Face Transformers, LangChain, and FastAPI actively welcome contributors.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </motion.section>

        {/* Community Links */}
        <motion.section {...fadeIn}>
          <div className="glass-card p-8 text-center">
            <h2 className="font-display text-3xl font-bold mb-6">Join the Community</h2>
            <p className="text-muted-foreground mb-6">
              Connect with other learners and get help from the community.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              {[
                { name: 'Hugging Face', url: 'https://huggingface.co/join/discord' },
                { name: 'Kaggle', url: 'https://www.kaggle.com/' },
                { name: 'Full Stack Open', url: 'https://fullstackopen.com/' },
                { name: 'YouTube', url: 'https://www.youtube.com/' },
              ].map((link) => (
                <a
                  key={link.name}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="glass-card glass-hover px-6 py-3 inline-flex items-center gap-2"
                >
                  {link.name}
                  <ExternalLink className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>
        </motion.section>
      </div>
    </div>
  );
};

export default FAQ;
