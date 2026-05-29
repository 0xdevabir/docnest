"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import {
  Clock,
  Users,
  HelpCircle,
  GitFork,
  AlertTriangle,
  RefreshCw,
  UserCheck,
  Brain,
  Eye,
  FileCode2,
  ArrowDown,
  CheckCircle2,
  XCircle,
  Terminal,
} from "lucide-react";
import { Container } from "@/components/shared/Container";
import { SectionLabel } from "@/components/shared/SectionLabel";
import { AnimatedGroup, AnimatedItem } from "@/components/shared/AnimatedText";
import { GlowCard } from "@/components/shared/GlowCard";
import { cn } from "@/lib/utils";

// ─── Data ────────────────────────────────────────────────────────────────────

const problems = [
  {
    id: "01",
    icon: Clock,
    title: "READMEs go stale overnight",
    body: "You write accurate docs on day one. Three sprints later, half of it describes code that was refactored away. Nobody owns it, so nobody fixes it.",
  },
  {
    id: "02",
    icon: Users,
    title: "Onboarding takes days, not hours",
    body: "Every new engineer asks the same questions: \"How do I run this?\" \"What goes in .env?\" The answers live in Slack DMs, not in the repo.",
  },
  {
    id: "03",
    icon: HelpCircle,
    title: "Architecture lives in one person's head",
    body: "The engineer who designed the system left six months ago. Everyone else is reverse-engineering by reading 3000-line files and guessing intent.",
  },
  {
    id: "04",
    icon: GitFork,
    title: "Mystery files multiply silently",
    body: "`src/utils/helpers/misc.ts` — what does it do? You read 300 lines to find out, then forget next month. Repeated across hundreds of files.",
  },
  {
    id: "05",
    icon: AlertTriangle,
    title: "Docs written under deadline pressure",
    body: "Documentation is always the last task before ship. Written in 20 minutes, incomplete by birth, immediately wrong as the next PR lands.",
  },
];

type Accent = "brand" | "cyan";

const solutions: {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
  command: string;
  accent: Accent;
}[] = [
  {
    id: "01",
    icon: RefreshCw,
    title: "Docs that stay current automatically",
    body: "`docsmith watch` regenerates documentation on every file change. Your code can't drift ahead of the docs when docs are generated, not written.",
    command: "docsmith watch",
    accent: "brand",
  },
  {
    id: "02",
    icon: UserCheck,
    title: "Setup guide from your actual config",
    body: "DocSmith reads package.json, CI config, and env templates to generate a setup guide that reflects the project as it exists right now — not last quarter.",
    command: "docsmith generate",
    accent: "cyan",
  },
  {
    id: "03",
    icon: Brain,
    title: "Architecture map generated from code",
    body: "Detects MVC, DDD, and microservice patterns automatically. Generates ARCHITECTURE.md from what's actually in your repo — not from memory.",
    command: "docsmith generate",
    accent: "brand",
  },
  {
    id: "04",
    icon: Eye,
    title: "Explain any file in under a second",
    body: "Point DocSmith at any file and get a plain-English explanation with full dependency context — imports, callers, purpose, and side effects.",
    command: "docsmith explain",
    accent: "cyan",
  },
  {
    id: "05",
    icon: FileCode2,
    title: "API docs extracted from your routes",
    body: "DocSmith reads your routes, schemas, middleware, and auth flows to generate accurate API documentation. No templates. No manual effort.",
    command: "docsmith api-docs",
    accent: "brand",
  },
];

const accentTokens: Record<
  Accent,
  { icon: string; border: string; badge: string; glow: string; check: string }
> = {
  brand: {
    icon: "text-brand-400 bg-brand-500/15 border-brand-500/25",
    border: "border-brand-500/30 hover:border-brand-500/50",
    badge: "bg-brand-500/10 text-brand-300 border-brand-500/20",
    glow: "rgba(99,102,241,0.28)",
    check: "text-brand-400",
  },
  cyan: {
    icon: "text-cyan-400 bg-cyan-500/15 border-cyan-500/25",
    border: "border-cyan-500/25 hover:border-cyan-500/50",
    badge: "bg-cyan-500/10 text-cyan-300 border-cyan-500/20",
    glow: "rgba(34,211,238,0.2)",
    check: "text-cyan-400",
  },
};

// ─── Problem card ─────────────────────────────────────────────────────────────

function ProblemCard({
  problem,
}: {
  problem: (typeof problems)[0];
}) {
  const Icon = problem.icon;
  return (
    <AnimatedItem>
      <motion.div
        whileHover={{ y: -3 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        className={cn(
          "group relative h-full overflow-hidden rounded-2xl",
          "bg-surface border border-red-500/10",
          "hover:border-red-500/25 transition-colors duration-300",
          "p-6 flex flex-col gap-4"
        )}
      >
        {/* Noise grain overlay for "broken" feel */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.015] noise rounded-2xl" />

        {/* Icon + number */}
        <div className="flex items-start justify-between">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-red-500/20 bg-red-500/10 shrink-0">
            <Icon className="h-4 w-4 text-red-400/80" />
          </div>
          <span className="font-mono text-[11px] text-slate-600 select-none pt-1 tabular-nums">
            {problem.id}
          </span>
        </div>

        {/* Text */}
        <div className="space-y-2 flex-1">
          <div className="flex items-start gap-2">
            <XCircle className="h-3.5 w-3.5 text-red-500/50 shrink-0 mt-[3px]" />
            <h3 className="text-[15px] font-semibold text-foreground/70 leading-snug">
              {problem.title}
            </h3>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed pl-[22px]">
            {problem.body}
          </p>
        </div>

        {/* Bottom shimmer line */}
        <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-red-500/15 to-transparent" />

        {/* Hover glow */}
        <div
          className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{
            background:
              "radial-gradient(320px at 50% 140%, rgba(239,68,68,0.07), transparent)",
          }}
        />
      </motion.div>
    </AnimatedItem>
  );
}

// ─── Solution card ────────────────────────────────────────────────────────────

function SolutionCard({
  solution,
}: {
  solution: (typeof solutions)[0];
}) {
  const Icon = solution.icon;
  const colors = accentTokens[solution.accent];
  return (
    <AnimatedItem>
      {/* Outer wrapper lets us paint the top edge line outside GlowCard's overflow-hidden */}
      <div className="relative h-full">
        {/* Accent top line */}
        <div
          className={cn(
            "absolute top-0 inset-x-0 h-px z-10 rounded-t-2xl",
            solution.accent === "brand"
              ? "bg-gradient-to-r from-transparent via-brand-500/60 to-transparent"
              : "bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent"
          )}
        />

        <GlowCard
          glowColor={colors.glow}
          className={cn(
            "p-6 h-full flex flex-col gap-4",
            colors.border
          )}
        >
          {/* Icon + command badge */}
          <div className="flex items-start justify-between gap-3">
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-xl border shrink-0",
                colors.icon
              )}
            >
              <Icon className="h-4 w-4" />
            </div>
            <span
              className={cn(
                "text-[10px] font-mono px-2 py-1 rounded-lg border",
                "leading-none self-start mt-0.5 whitespace-nowrap",
                colors.badge
              )}
            >
              {solution.command}
            </span>
          </div>

          {/* Text */}
          <div className="space-y-2 flex-1">
            <div className="flex items-start gap-2">
              <CheckCircle2
                className={cn("h-3.5 w-3.5 shrink-0 mt-[3px]", colors.check)}
              />
              <h3 className="text-[15px] font-semibold text-foreground leading-snug">
                {solution.title}
              </h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed pl-[22px]">
              {solution.body}
            </p>
          </div>
        </GlowCard>
      </div>
    </AnimatedItem>
  );
}

// ─── Transition band ──────────────────────────────────────────────────────────

function TransitionBand() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <div ref={ref} className="relative py-20 flex flex-col items-center">
      {/* Expanding horizontal lines */}
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex items-center px-4 pointer-events-none">
        <motion.div
          initial={{ scaleX: 0, opacity: 0 }}
          animate={inView ? { scaleX: 1, opacity: 1 } : {}}
          transition={{ duration: 0.9, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.15 }}
          className="flex-1 h-px origin-left"
          style={{
            background:
              "linear-gradient(to right, transparent, rgba(99,102,241,0.15) 30%, rgba(99,102,241,0.45))",
          }}
        />
        {/* Center dot */}
        <div className="relative mx-4 shrink-0">
          <div className="h-2.5 w-2.5 rounded-full bg-brand-500/50 border border-brand-400/60" />
          <div className="absolute inset-0 rounded-full bg-brand-400/30 blur-[6px] scale-[2.5]" />
        </div>
        <motion.div
          initial={{ scaleX: 0, opacity: 0 }}
          animate={inView ? { scaleX: 1, opacity: 1 } : {}}
          transition={{ duration: 0.9, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.15 }}
          className="flex-1 h-px origin-right"
          style={{
            background:
              "linear-gradient(to left, transparent, rgba(99,102,241,0.15) 30%, rgba(99,102,241,0.45))",
          }}
        />
      </div>

      {/* Center glass card */}
      <motion.div
        initial={{ opacity: 0, y: 22, scale: 0.94 }}
        animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
        transition={{ duration: 0.55, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="relative z-10 glass rounded-2xl px-8 py-6 flex flex-col items-center gap-3 text-center shadow-[0_8px_60px_rgba(0,0,0,0.45)]"
      >
        {/* Card glow aura */}
        <div className="absolute inset-0 rounded-2xl bg-brand-500/5 blur-2xl -z-10 scale-110" />

        {/* Terminal icon */}
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={inView ? { scale: 1, opacity: 1 } : {}}
          transition={{ duration: 0.4, delay: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
          className="h-11 w-11 rounded-xl bg-brand-500/15 border border-brand-500/35 flex items-center justify-center shadow-[0_0_24px_rgba(99,102,241,0.35)]"
        >
          <Terminal className="h-5 w-5 text-brand-400" />
        </motion.div>

        <div className="space-y-1">
          <p className="text-base font-semibold text-foreground">
            DocSmith reads your code.{" "}
            <span className="text-gradient-brand">It writes the docs.</span>
          </p>
          <p className="text-sm text-muted-foreground">
            One command. Zero manual effort. Always accurate.
          </p>
        </div>

        {/* Bouncing arrow */}
        <motion.div
          animate={{ y: [0, 5, 0] }}
          transition={{ duration: 1.7, repeat: Infinity, ease: "easeInOut" }}
        >
          <ArrowDown className="h-4 w-4 text-brand-400/50" />
        </motion.div>
      </motion.div>
    </div>
  );
}

// ─── Main section ─────────────────────────────────────────────────────────────

export function ProblemSolution() {
  return (
    <section id="why" className="relative py-28 overflow-hidden">
      {/* Background ambience */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[900px] h-[500px] rounded-full bg-brand-500/[0.04] blur-[160px]" />
        <div className="absolute top-0 right-0 w-[500px] h-[600px] rounded-full bg-red-500/[0.025] blur-[130px]" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[500px] rounded-full bg-cyan-500/[0.025] blur-[110px]" />
      </div>

      <Container>
        {/* Section header */}
        <AnimatedGroup className="text-center mb-16 space-y-4">
          <AnimatedItem>
            <SectionLabel label="Why DocSmith" />
          </AnimatedItem>
          <AnimatedItem>
            <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-balance">
              Every team fights the{" "}
              <span className="text-red-400/80">same doc battles.</span>
              <br className="hidden sm:block" />
              <span className="text-gradient-brand"> DocSmith ends them.</span>
            </h2>
          </AnimatedItem>
          <AnimatedItem>
            <p className="mx-auto max-w-xl text-lg text-muted-foreground text-balance">
              Not because developers are careless — because manually
              maintaining docs is a problem that compounds in the wrong
              direction as codebases grow.
            </p>
          </AnimatedItem>
        </AnimatedGroup>

        {/* Problems grid */}
        <AnimatedGroup
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          staggerDelay={0.07}
          delayChildren={0.05}
        >
          {problems.map((p) => (
            <ProblemCard key={p.id} problem={p} />
          ))}
        </AnimatedGroup>

        {/* Animated transition */}
        <TransitionBand />

        {/* Solutions grid */}
        <AnimatedGroup
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          staggerDelay={0.07}
          delayChildren={0.05}
        >
          {solutions.map((s) => (
            <SolutionCard key={s.id} solution={s} />
          ))}
        </AnimatedGroup>
      </Container>
    </section>
  );
}
