"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FolderSearch,
  Cpu,
  Route,
  FileText,
  GitGraph,
  Map,
  Terminal,
  CheckCircle2,
} from "lucide-react";
import { Container } from "@/components/shared/Container";
import { SectionLabel } from "@/components/shared/SectionLabel";
import { AnimatedGroup, AnimatedItem } from "@/components/shared/AnimatedText";
import { viewport } from "@/styles/animations";
import { cn } from "@/lib/utils";

const STEP_DURATION = 4500;

const steps = [
  {
    id: "scan",
    number: "01",
    icon: FolderSearch,
    title: "Scan repository",
    subtitle: "File system traversal",
    color: "brand" as const,
    description:
      "DocSmith recursively walks your entire repo, identifying TypeScript, JavaScript, and config files while building a complete in-memory dependency graph.",
    terminal: {
      prompt: "docsmith scan ./",
      lines: [
        { text: "Scanning project root...", delay: 0.05 },
        { text: "Found 847 source files", delay: 0.3, highlight: true },
        { text: "TypeScript: 612 files", delay: 0.55 },
        { text: "JavaScript: 235 files", delay: 0.75 },
        { text: "Config files: 14 detected", delay: 0.95 },
        { text: "Building module graph...", delay: 1.15 },
        { text: "✓ Scan complete in 0.8s", delay: 1.45, success: true },
      ],
    },
    stats: [
      { label: "Files", value: "847" },
      { label: "Modules", value: "203" },
      { label: "Time", value: "0.8s" },
    ],
  },
  {
    id: "analyze",
    number: "02",
    icon: Cpu,
    title: "Analyze architecture",
    subtitle: "Pattern & zone detection",
    color: "cyan" as const,
    description:
      "The TypeScript Compiler API extracts AST-level insights — detecting patterns like MVC, DDD, microservices — and maps zones, layers, and component boundaries.",
    terminal: {
      prompt: "Analyzing architecture...",
      lines: [
        { text: "Running TS Compiler API...", delay: 0.05 },
        { text: "Architecture: Next.js App Router", delay: 0.3, highlight: true },
        { text: "Pattern detected: Feature-based", delay: 0.55 },
        { text: "Zones: api, components, lib, hooks", delay: 0.75 },
        { text: "Layers: presentation → domain → data", delay: 0.95 },
        { text: "Auth flow: JWT + middleware detected", delay: 1.15 },
        { text: "✓ 24 architectural signals found", delay: 1.45, success: true },
      ],
    },
    stats: [
      { label: "Patterns", value: "7" },
      { label: "Zones", value: "12" },
      { label: "Signals", value: "24" },
    ],
  },
  {
    id: "apis",
    number: "03",
    icon: Route,
    title: "Understand APIs",
    subtitle: "Route & endpoint extraction",
    color: "brand" as const,
    description:
      "DocSmith parses every route handler — Next.js, Express, Hono, Fastify — extracting methods, paths, middleware chains, validation schemas, and auth guards.",
    terminal: {
      prompt: "Extracting API routes...",
      lines: [
        { text: "Framework: Next.js App Router", delay: 0.05 },
        { text: "GET  /api/users        [auth]", delay: 0.3, highlight: true },
        { text: "POST /api/users        [auth, validate]", delay: 0.55 },
        { text: "GET  /api/posts/:id    [public]", delay: 0.75 },
        { text: "PUT  /api/posts/:id    [auth, owner]", delay: 0.95 },
        { text: "DELETE /api/posts/:id  [auth, admin]", delay: 1.15 },
        { text: "✓ 32 endpoints documented", delay: 1.45, success: true },
      ],
    },
    stats: [
      { label: "Routes", value: "32" },
      { label: "Middleware", value: "8" },
      { label: "Guards", value: "5" },
    ],
  },
  {
    id: "generate",
    number: "04",
    icon: FileText,
    title: "Generate documentation",
    subtitle: "AI-powered writing",
    color: "cyan" as const,
    description:
      "A multi-stage AI pipeline transforms raw analysis into polished docs — README, CONTRIBUTING, API references — with human-readable prose and structured sections.",
    terminal: {
      prompt: "Generating documentation...",
      lines: [
        { text: "Preparing AI context window...", delay: 0.05 },
        { text: "Generating README.md...", delay: 0.3 },
        { text: "  ✓ Overview + installation", delay: 0.55, success: true },
        { text: "  ✓ API reference (32 endpoints)", delay: 0.75, success: true },
        { text: "  ✓ Architecture summary", delay: 0.95, success: true },
        { text: "Generating CONTRIBUTING.md...", delay: 1.15 },
        { text: "✓ 4 files generated in 3.2s", delay: 1.45, success: true, highlight: true },
      ],
    },
    stats: [
      { label: "Docs", value: "4" },
      { label: "Sections", value: "18" },
      { label: "Time", value: "3.2s" },
    ],
  },
  {
    id: "diagrams",
    number: "05",
    icon: GitGraph,
    title: "Create diagrams",
    subtitle: "Visual architecture maps",
    color: "brand" as const,
    description:
      "DocSmith outputs Mermaid, D3, and DOT dependency graphs — component trees, module relationships, data flow, and architecture layer visualizations.",
    terminal: {
      prompt: "Generating diagrams...",
      lines: [
        { text: "Building dependency graph...", delay: 0.05 },
        { text: "Calculating PageRank scores...", delay: 0.3 },
        { text: "Critical: auth, db, api/router", delay: 0.55, highlight: true },
        { text: "Cycle detection: 0 circular deps", delay: 0.75, success: true },
        { text: "Exporting Mermaid diagram...", delay: 0.95 },
        { text: "Exporting D3 JSON graph...", delay: 1.15 },
        { text: "✓ 3 diagram formats exported", delay: 1.45, success: true },
      ],
    },
    stats: [
      { label: "Formats", value: "3" },
      { label: "Nodes", value: "203" },
      { label: "Cycles", value: "0" },
    ],
  },
  {
    id: "structure",
    number: "06",
    icon: Map,
    title: "Explain project structure",
    subtitle: "Human-readable project map",
    color: "cyan" as const,
    description:
      "The final output includes a navigable project map — folder purposes, component responsibilities, data models, and onboarding context for new contributors.",
    terminal: {
      prompt: "Building project map...",
      lines: [
        { text: "Mapping directory structure...", delay: 0.05 },
        { text: "src/app/        → pages & layouts", delay: 0.3, highlight: true },
        { text: "src/components/ → UI library", delay: 0.55 },
        { text: "src/lib/        → utilities", delay: 0.75 },
        { text: "src/hooks/      → React hooks", delay: 0.95 },
        { text: "Writing STRUCTURE.md...", delay: 1.15 },
        { text: "✓ Project map ready — 6 docs total", delay: 1.45, success: true, highlight: true },
      ],
    },
    stats: [
      { label: "Sections", value: "9" },
      { label: "Folders", value: "24" },
      { label: "Total docs", value: "6" },
    ],
  },
];

const colorMap = {
  brand: {
    icon: "text-brand-400 bg-brand-500/15 border-brand-500/30",
    nodeActive:
      "border-brand-500 bg-brand-500/20 shadow-[0_0_24px_rgba(99,102,241,0.45)]",
    nodeComplete: "border-brand-500/50 bg-brand-500/10",
    pulse: "bg-brand-500",
    glow: "rgba(99,102,241,0.22)",
    progress: "from-brand-500 to-indigo-400",
    text: "text-brand-400",
    dot: "bg-brand-400",
    badge: "bg-brand-500/10 border-brand-500/20 text-brand-400",
    cardBorder: "border-brand-500/25",
    highlight: "text-brand-300",
  },
  cyan: {
    icon: "text-cyan-400 bg-cyan-500/15 border-cyan-500/30",
    nodeActive:
      "border-cyan-400 bg-cyan-500/20 shadow-[0_0_24px_rgba(34,211,238,0.4)]",
    nodeComplete: "border-cyan-500/50 bg-cyan-500/10",
    pulse: "bg-cyan-400",
    glow: "rgba(34,211,238,0.18)",
    progress: "from-cyan-500 to-cyan-300",
    text: "text-cyan-400",
    dot: "bg-cyan-400",
    badge: "bg-cyan-500/10 border-cyan-500/20 text-cyan-400",
    cardBorder: "border-cyan-500/25",
    highlight: "text-cyan-300",
  },
};

const outputFiles = [
  { file: "README.md", color: "brand" as const },
  { file: "CONTRIBUTING.md", color: "cyan" as const },
  { file: "API.md", color: "brand" as const },
  { file: "ARCHITECTURE.md", color: "cyan" as const },
  { file: "dependency-graph.mmd", color: "brand" as const },
  { file: "STRUCTURE.md", color: "cyan" as const },
];

export function HowItWorks() {
  const [activeStep, setActiveStep] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (isHovered) return;
    const increment = 100 / (STEP_DURATION / 50);
    const id = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          setActiveStep((s) => (s + 1) % steps.length);
          return 0;
        }
        return p + increment;
      });
    }, 50);
    return () => clearInterval(id);
  }, [isHovered]);

  const step = steps[activeStep];
  const colors = colorMap[step.color];
  const connectorPct =
    ((activeStep + progress / 100) / (steps.length - 1)) * 100;

  function goToStep(i: number) {
    setActiveStep(i);
    setProgress(0);
  }

  return (
    <section id="how-it-works" className="relative py-28 overflow-hidden">
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-0 -translate-x-1/2 w-[900px] h-[600px] bg-brand-500/4 blur-[160px] rounded-full" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[400px] bg-cyan-500/4 blur-[120px] rounded-full" />
        <div className="absolute inset-0 grid-bg opacity-[0.18]" />
      </div>

      <Container>
        {/* Header */}
        <AnimatedGroup className="text-center mb-20 space-y-4">
          <AnimatedItem>
            <SectionLabel label="How it works" />
          </AnimatedItem>
          <AnimatedItem>
            <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-balance">
              From repo to docs,{" "}
              <span className="text-gradient-brand">
                in six intelligent steps
              </span>
            </h2>
          </AnimatedItem>
          <AnimatedItem>
            <p className="mx-auto max-w-xl text-lg text-muted-foreground text-balance">
              DocSmith doesn&apos;t just scan files — it understands your
              codebase the way a senior engineer would, then writes better docs
              than most engineers do.
            </p>
          </AnimatedItem>
        </AnimatedGroup>

        {/* Step connector */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewport}
          transition={{ duration: 0.5 }}
          className="mb-10 px-2 sm:px-4"
        >
          <div className="relative flex items-start justify-between">
            {/* Base track line */}
            <div className="absolute left-6 right-6 top-6 h-px bg-border z-0" />

            {/* Animated progress fill */}
            <motion.div
              className="absolute left-6 top-6 h-px z-0 bg-gradient-to-r from-brand-500 via-indigo-400 to-cyan-400"
              animate={{
                width: `calc((100% - 3rem) * ${connectorPct / 100})`,
              }}
              transition={{ duration: 0.05 }}
            />

            {steps.map((s, i) => {
              const Icon = s.icon;
              const c = colorMap[s.color];
              const isActive = i === activeStep;
              const isComplete = i < activeStep;

              return (
                <button
                  key={s.id}
                  onClick={() => goToStep(i)}
                  className="relative z-10 flex flex-col items-center gap-2.5 group focus:outline-none"
                >
                  <div
                    className={cn(
                      "relative flex h-12 w-12 items-center justify-center rounded-full border-2 transition-all duration-500",
                      isActive
                        ? c.nodeActive
                        : isComplete
                        ? c.nodeComplete
                        : "border-border bg-surface hover:border-muted-foreground/40"
                    )}
                  >
                    {isActive && (
                      <>
                        <motion.div
                          className={cn(
                            "absolute inset-0 rounded-full opacity-40",
                            c.pulse
                          )}
                          animate={{ scale: [1, 2], opacity: [0.4, 0] }}
                          transition={{
                            repeat: Infinity,
                            duration: 1.6,
                            ease: "easeOut",
                          }}
                        />
                        <motion.div
                          className={cn(
                            "absolute inset-0 rounded-full opacity-40",
                            c.pulse
                          )}
                          animate={{ scale: [1, 2], opacity: [0.4, 0] }}
                          transition={{
                            repeat: Infinity,
                            duration: 1.6,
                            delay: 0.6,
                            ease: "easeOut",
                          }}
                        />
                      </>
                    )}
                    {isComplete ? (
                      <CheckCircle2 className="h-5 w-5 text-brand-400" />
                    ) : (
                      <Icon
                        className={cn(
                          "h-5 w-5 transition-colors",
                          isActive
                            ? c.text
                            : "text-muted-foreground/50 group-hover:text-muted-foreground"
                        )}
                      />
                    )}
                  </div>

                  <div className="flex flex-col items-center gap-0.5">
                    <span
                      className={cn(
                        "hidden sm:block text-[10px] font-mono font-bold tracking-[0.2em] uppercase transition-colors",
                        isActive ? c.text : "text-muted-foreground/35"
                      )}
                    >
                      {s.number}
                    </span>
                    <span
                      className={cn(
                        "hidden lg:block text-xs font-medium text-center max-w-[76px] leading-tight transition-colors",
                        isActive
                          ? "text-foreground"
                          : isComplete
                          ? "text-muted-foreground/55"
                          : "text-muted-foreground/35 group-hover:text-muted-foreground/55"
                      )}
                    >
                      {s.title}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Active step detail card */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewport}
          transition={{ duration: 0.5, delay: 0.15 }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={activeStep}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="grid lg:grid-cols-[1fr_1.3fr] gap-5"
            >
              {/* Info panel */}
              <div
                className={cn(
                  "relative rounded-2xl border p-7 flex flex-col gap-6 overflow-hidden bg-surface",
                  colors.cardBorder
                )}
              >
                <div
                  className="pointer-events-none absolute -top-12 -right-12 w-56 h-56 rounded-full blur-[80px]"
                  style={{ background: colors.glow }}
                />

                <div className="relative space-y-5">
                  <div className="flex items-center justify-between">
                    <span
                      className={cn(
                        "text-[11px] font-mono font-bold tracking-[0.2em] uppercase",
                        colors.text
                      )}
                    >
                      Step {step.number}
                    </span>
                    <span
                      className={cn(
                        "text-[11px] font-medium px-2.5 py-0.5 rounded-full border",
                        colors.badge
                      )}
                    >
                      {step.subtitle}
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div
                      className={cn(
                        "flex h-11 w-11 items-center justify-center rounded-xl border",
                        colors.icon
                      )}
                    >
                      {(() => {
                        const Icon = step.icon;
                        return <Icon className="h-5 w-5" />;
                      })()}
                    </div>
                    <h3 className="text-2xl font-bold tracking-tight">
                      {step.title}
                    </h3>
                    <p className="text-[15px] text-muted-foreground leading-relaxed">
                      {step.description}
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-2.5">
                    {step.stats.map((stat) => (
                      <div
                        key={stat.label}
                        className="rounded-xl bg-background border border-border p-3 text-center"
                      >
                        <div
                          className={cn(
                            "text-xl font-bold tabular-nums",
                            colors.text
                          )}
                        >
                          {stat.value}
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-0.5 leading-tight">
                          {stat.label}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-auto space-y-2">
                  <div className="flex justify-between text-[11px] text-muted-foreground font-mono">
                    <span>Running...</span>
                    <span>{Math.min(Math.round(progress), 100)}%</span>
                  </div>
                  <div className="h-1 bg-border rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full bg-gradient-to-r",
                        colors.progress
                      )}
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Terminal panel */}
              <div className="rounded-2xl bg-[#07070d] border border-border overflow-hidden flex flex-col shadow-2xl">
                {/* Title bar */}
                <div className="flex items-center gap-3 px-4 py-2.5 border-b border-white/5 bg-white/[0.02]">
                  <div className="flex gap-1.5">
                    <div className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
                    <div className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
                    <div className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
                  </div>
                  <div className="flex-1 flex items-center justify-center gap-2">
                    <Terminal className="h-3 w-3 text-muted-foreground/40" />
                    <span className="text-[11px] text-muted-foreground/50 font-mono">
                      docsmith — bash
                    </span>
                  </div>
                  <div className="w-12" />
                </div>

                {/* Body */}
                <div className="flex-1 p-5 font-mono text-[13px] space-y-1 overflow-hidden leading-relaxed">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={cn("font-bold select-none", colors.text)}>
                      ❯
                    </span>
                    <span className="text-foreground/75">
                      {step.terminal.prompt}
                    </span>
                    <motion.span
                      className={cn(
                        "inline-block w-1.5 h-[14px] rounded-sm ml-0.5",
                        colors.dot
                      )}
                      animate={{ opacity: [1, 0, 1] }}
                      transition={{
                        repeat: Infinity,
                        duration: 1,
                        ease: "easeInOut",
                      }}
                    />
                  </div>

                  {step.terminal.lines.map((line, i) => (
                    <motion.div
                      key={`${activeStep}-line-${i}`}
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{
                        delay: line.delay,
                        duration: 0.25,
                        ease: "easeOut",
                      }}
                      className={cn(
                        "pl-5",
                        line.success
                          ? "text-[#4ade80]"
                          : line.highlight
                          ? colors.highlight
                          : "text-muted-foreground/70"
                      )}
                    >
                      {line.text}
                    </motion.div>
                  ))}

                  <motion.div
                    className="pl-5"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.7 }}
                  >
                    <motion.span
                      className={cn(
                        "inline-block w-1.5 h-[13px] rounded-sm",
                        colors.dot
                      )}
                      animate={{ opacity: [1, 0, 1] }}
                      transition={{
                        repeat: Infinity,
                        duration: 1.1,
                        ease: "easeInOut",
                        delay: 1.7,
                      }}
                    />
                  </motion.div>
                </div>

                {/* Status bar */}
                <div className="flex items-center justify-between px-4 py-2 border-t border-white/5 bg-white/[0.015]">
                  <div className="flex items-center gap-2">
                    <motion.div
                      className={cn("h-1.5 w-1.5 rounded-full", colors.dot)}
                      animate={{ opacity: [0.4, 1, 0.4] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                    />
                    <span className="text-[10px] text-muted-foreground/40 font-mono">
                      RUNNING
                    </span>
                  </div>
                  <span className={cn("text-[10px] font-mono", colors.text)}>
                    step {step.number}/{steps.length}
                  </span>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* Pagination dots */}
        <div className="flex items-center justify-center gap-2 mt-7">
          {steps.map((s, i) => (
            <button
              key={s.id}
              onClick={() => goToStep(i)}
              className={cn(
                "rounded-full transition-all duration-300 focus:outline-none",
                i === activeStep
                  ? cn("h-1.5 w-7", colorMap[s.color].dot)
                  : "h-1.5 w-1.5 bg-border hover:bg-muted-foreground/40"
              )}
            />
          ))}
        </div>

        {/* Output artifacts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewport}
          transition={{ delay: 0.25 }}
          className="mt-16"
        >
          <p className="text-center text-[11px] text-muted-foreground/45 mb-5 font-mono tracking-wider uppercase">
            Output artifacts
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2.5">
            {outputFiles.map(({ file, color }) => {
              const c = colorMap[color];
              return (
                <motion.div
                  key={file}
                  whileHover={{ y: -2, scale: 1.03 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  className={cn(
                    "flex items-center gap-2 rounded-xl px-3.5 py-2",
                    "bg-surface border cursor-default transition-colors duration-300",
                    color === "brand"
                      ? "border-brand-500/20 hover:border-brand-500/40"
                      : "border-cyan-500/20 hover:border-cyan-500/40"
                  )}
                >
                  <div
                    className={cn("h-1.5 w-1.5 rounded-full shrink-0", c.dot)}
                  />
                  <span
                    className={cn("text-[13px] font-mono font-medium", c.text)}
                  >
                    {file}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </Container>
    </section>
  );
}
