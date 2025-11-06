import { useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Brain, CheckCircle2, Compass, Github, Sparkles, TerminalSquare, Zap } from "lucide-react";
import homeHighlights from "@/data/home_highlights.json";
import { useRipple } from "@/hooks/use-ripple";
import { TiltCard } from "@/components/TiltCard";

type Highlight = {
  title: string;
  desc: string;
};

const modules = [
  {
    id: "github",
    title: "GitHub Command Deck",
    description: "Ship real repositories, master pull requests, and collaborate with confidence.",
    accent: "var(--accent-github)",
    link: "/github",
    icon: Github,
    badge: "Version Control",
  },
  {
    id: "ai",
    title: "AI Concepts Reactor",
    description: "Understand embeddings, inference, and responsible AI patterns through fast labs.",
    accent: "var(--accent-ai)",
    link: "/ai",
    icon: Brain,
    badge: "LLM Core",
  },
  {
    id: "nocode",
    title: "No-Code Builder Bay",
    description: "Launch working products with Lovable, Bubble, and automation stacks. No code required.",
    accent: "var(--accent-nocode)",
    link: "/nocode",
    icon: Zap,
    badge: "Launch Pad",
  },
  {
    id: "eduprompt",
    title: "EduPrompt Studio",
    description: "Engineer prompt systems that stay factual, structured, and ready for classrooms.",
    accent: "var(--accent-eduprompt)",
    link: "/eduprompt",
    icon: Sparkles,
    badge: "Prompt Ops",
  },
];

const pathSteps = [
  {
    id: "scan",
    title: "Scan",
    copy: "Open a pack, skim the cheat-sheets, and mark the skills you want to level up.",
    icon: Compass,
  },
  {
    id: "build",
    title: "Build",
    copy: "Clone the starter, make commits, and use Engage AI to debug and get context on demand.",
    icon: TerminalSquare,
  },
  {
    id: "ship",
    title: "Ship",
    copy: "Deploy to Vercel or Lovable, write your README story, and confirm route health via the console.",
    icon: CheckCircle2,
  },
  {
    id: "broadcast",
    title: "Broadcast",
    copy: "Record a Loom or thread, share your repo, and document what you learned for the next builder.",
  },
];

const heroVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.08 },
  }),
};

const Home = () => {
  const highlights = useMemo(() => homeHighlights as Highlight[], []);
  const { createRipple } = useRipple();

  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--bg)] text-[var(--text)] noise-texture">
      {/* Animated gradient background */}
      <div className="absolute inset-0 gradient-bg-animated opacity-40" />

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 grid-background pointer-events-none" />

      {/* Dot pattern in hero */}
      <div className="absolute inset-0 dot-pattern pointer-events-none" style={{ height: '100vh' }} />

      {/* Hero spotlight effects */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[600px] w-[600px] rounded-full opacity-30 blur-3xl animate-pulse-slow"
          style={{ background: "radial-gradient(circle, rgba(139,92,246,0.6) 0%, transparent 70%)" }}
        />
        <div className="absolute top-1/3 right-1/4 h-[400px] w-[400px] rounded-full opacity-20 blur-3xl animate-pulse-slow"
          style={{ background: "radial-gradient(circle, rgba(45,212,191,0.5) 0%, transparent 70%)", animationDelay: '1s' }}
        />
        <div className="absolute bottom-1/4 left-1/4 h-[350px] w-[350px] rounded-full opacity-20 blur-3xl animate-pulse-slow"
          style={{ background: "radial-gradient(circle, rgba(96,165,250,0.5) 0%, transparent 70%)", animationDelay: '2s' }}
        />
      </div>

      <main className="relative z-10 max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 pb-32">
        <section className="py-24 sm:py-28" id="hero">
          <motion.div initial="hidden" animate="visible" variants={heroVariants} className="max-w-3xl">
            <p className="font-mono text-sm uppercase tracking-[0.4em] text-[var(--muted)]">
              DecodeAI Home OS
            </p>
            <h1 className="mt-6 text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight">
              <span className="gradient-text-animated">
                Build real skills in AI, GitHub, and prompts.
              </span>
              {" "}
              <span className="inline-block animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                Learn by doing.
              </span>
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-[var(--muted)] max-w-2xl">
              Launch focused modules, follow guided paths, and use a local command console to test ideas in seconds.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                to="/github"
                onClick={createRipple}
                className="group relative ripple-container px-6 py-3.5 rounded-lg font-semibold text-white shadow-premium hover:shadow-premium-hover transition-all duration-300 hover:scale-105 ease-bounce overflow-hidden magnetic"
                style={{ background: "linear-gradient(135deg, var(--accent-github) 0%, #7c3aed 100%)" }}
                aria-label="Open GitHub track"
              >
                <span className="relative z-10">Start with GitHub</span>
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </Link>
              <Link
                to="/eduprompt"
                onClick={createRipple}
                className="group ripple-container px-6 py-3.5 rounded-lg font-semibold border-2 border-purple-500/30 text-[var(--text)] hover:border-purple-500/60 hover:bg-purple-500/10 transition-all duration-300 hover:scale-105 ease-bounce shadow-lg hover:shadow-xl magnetic overflow-hidden"
                aria-label="Open EduPrompt track"
              >
                <span className="group-hover:text-purple-300 transition-colors duration-200">Try EduPrompt</span>
              </Link>
            </div>
            <div className="mt-6 font-mono text-sm text-[var(--muted)]">
              user@decodeai:~$ ready_to_build
            </div>
          </motion.div>
        </section>

        <section className="py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true, amount: 0.3 }}
            className="flex items-center justify-between flex-wrap gap-4"
          >
            <div>
              <h2 className="text-3xl font-bold">Module Grid</h2>
              <p className="text-[var(--muted)] mt-1">
                Four modules tuned for fast iteration. Open one to follow deep dives, labs, and cheatsheets.
              </p>
            </div>
            <span className="font-mono text-xs uppercase tracking-[0.3em] text-[var(--muted)]">
              mode: learning_sprint
            </span>
          </motion.div>

          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            {modules.map((module, index) => (
              <motion.div
                key={module.id}
                custom={index}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.4 }}
                variants={cardVariants}
              >
                <TiltCard className="group card ring-gradient-glow p-6 sm:p-7 flex flex-col justify-between transition-all duration-300 hover:shadow-[0_20px_70px_-15px_rgba(139,92,246,0.3)]">
                  <div>
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-full grid place-items-center transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12"
                        style={{ background: `${module.accent}30`, color: module.accent }}
                      >
                        <module.icon className="h-5 w-5" />
                      </div>
                      <span className="font-mono text-xs uppercase tracking-[0.3em] text-[var(--muted)]">
                        {module.badge}
                      </span>
                    </div>
                    <h3 className="mt-5 text-2xl font-semibold tracking-tight">{module.title}</h3>
                    <p className="mt-3 text-[var(--muted)] leading-relaxed">{module.description}</p>
                  </div>
                  <Link
                    to={module.link}
                    onClick={createRipple}
                    className="ripple-container mt-6 inline-flex items-center gap-2 font-semibold text-sm transition-all duration-200 group-hover:gap-3 overflow-hidden"
                    style={{ color: module.accent }}
                  >
                    Enter module
                    <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                  </Link>
                </TiltCard>
              </motion.div>
            ))}
          </div>
        </section>

        <section className="py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true, amount: 0.3 }}
            className="card ring-gradient-glow p-6 sm:p-8 hover:shadow-[0_20px_70px_-15px_rgba(139,92,246,0.3)] transition-all duration-300"
          >
            <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
              <div className="md:max-w-sm">
                <h2 className="text-3xl font-bold">Your build path in four moves</h2>
                <p className="text-[var(--muted)] mt-2">
                  Move from idea to shipped prototype using the same path our student teams run every week.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {pathSteps.map((step, index) => (
                  <motion.div
                    key={step.id}
                    custom={index}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.3 }}
                    variants={cardVariants}
                    className="group border border-[var(--border)] rounded-xl px-4 py-5 bg-[var(--panel)]/70 transition-all duration-300 hover:bg-[var(--panel)]/90 hover:border-purple-500/30 hover:shadow-lg"
                  >
                    <div className="flex items-center gap-3">
                      {step.icon ? (
                        <div className="h-9 w-9 grid place-items-center rounded-full bg-[var(--panel)] border border-[var(--border)] text-[var(--focus)]">
                          <step.icon className="h-4 w-4" />
                        </div>
                      ) : (
                        <div className="h-9 w-9 grid place-items-center rounded-full bg-[var(--panel)] border border-[var(--border)] text-[var(--focus)]">
                          <ArrowRight className="h-4 w-4" />
                        </div>
                      )}
                      <div>
                        <p className="font-mono text-xs uppercase tracking-[0.3em] text-[var(--muted)]">
                          Step {index + 1}
                        </p>
                        <h3 className="text-lg font-semibold">{step.title}</h3>
                      </div>
                    </div>
                    <p className="mt-3 text-sm text-[var(--muted)] leading-relaxed">
                      {step.copy}
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </section>

        <section className="py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true, amount: 0.3 }}
            className="flex items-center justify-between flex-wrap gap-4"
          >
            <div>
              <h2 className="text-3xl font-bold">Featured Projects</h2>
              <p className="text-[var(--muted)] mt-1">
                Real builds from DecodeAI teams. Use them as inspiration or remix the stack.
              </p>
            </div>
            <Link
              to="/resources"
              onClick={createRipple}
              className="ripple-container font-semibold text-sm border border-[var(--border)] rounded-md px-4 py-2 hover:bg-[var(--panel)] transition overflow-hidden magnetic"
            >
              Explore more projects
            </Link>
          </motion.div>

          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {highlights.map((project, index) => (
              <motion.div
                key={project.title}
                custom={index}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
                variants={cardVariants}
              >
                <TiltCard className="group card ring-gradient-glow p-6 transition-all duration-300 hover:shadow-[0_20px_70px_-15px_rgba(139,92,246,0.3)] h-full">
                  <span className="font-mono text-xs uppercase tracking-[0.3em] text-[var(--muted)] opacity-80">
                    Prototype
                  </span>
                  <h3 className="mt-4 text-xl font-semibold tracking-tight group-hover:text-purple-400 transition-colors duration-200">{project.title}</h3>
                  <p className="mt-3 text-[var(--muted)] leading-relaxed">{project.desc}</p>
                </TiltCard>
              </motion.div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Home;
