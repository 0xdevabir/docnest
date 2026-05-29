"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  ArrowRight,
  Star,
  FileText,
  Eye,
  Activity,
  GitBranch,
  Clock,
  Zap,
} from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/shared/Container";
import { cn } from "@/lib/utils";
import {
  fadeInUp,
  fadeIn,
  staggerContainer,
  scaleIn,
} from "@/styles/animations";

// ─── Types ────────────────────────────────────────────────────────────────────

type LineType = "muted" | "success" | "accent" | "glow" | "normal";

interface TerminalLine {
  text: string;
  type: LineType;
  delay: number;
}

interface CommandDef {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  command: string;
  lines: TerminalLine[];
}

// ─── Command Data ─────────────────────────────────────────────────────────────

const COMMANDS: CommandDef[] = [
  {
    id: "generate",
    label: "generate",
    icon: FileText,
    command: "docsmith generate",
    lines: [
      { text: "Scanning project structure...", type: "muted", delay: 450 },
      { text: "✓ 847 files indexed in 1.1s", type: "success", delay: 950 },
      { text: "✓ 23 route patterns detected", type: "success", delay: 1250 },
      { text: "✓ Stack: Next.js · Prisma · tRPC", type: "success", delay: 1550 },
      { text: "Generating documentation...", type: "muted", delay: 1950 },
      { text: "  README.md          2.4 KB  ✓", type: "accent", delay: 2250 },
      { text: "  CONTRIBUTING.md    1.8 KB  ✓", type: "accent", delay: 2500 },
      { text: "  API_DOCS.md        4.1 KB  ✓", type: "accent", delay: 2750 },
      { text: "  ARCHITECTURE.md    3.2 KB  ✓", type: "accent", delay: 3000 },
      { text: "Done in 3.2s — 4 files generated", type: "glow", delay: 3400 },
    ],
  },
  {
    id: "explain",
    label: "explain",
    icon: Eye,
    command: "docsmith explain src/auth/middleware.ts",
    lines: [
      { text: "Reading: src/auth/middleware.ts", type: "muted", delay: 350 },
      { text: "Resolving dependency graph...", type: "muted", delay: 750 },
      { text: "✓ JWT validation · RS256 algorithm", type: "success", delay: 1150 },
      { text: "✓ RBAC roles: admin · user · viewer", type: "success", delay: 1450 },
      { text: "✓ Rate limiting: 100 req/min per IP", type: "success", delay: 1750 },
      { text: "", type: "normal", delay: 2050 },
      { text: "# AI Summary", type: "accent", delay: 2250 },
      { text: "Validates JWT (RS256) and enforces", type: "accent", delay: 2550 },
      { text: "RBAC policies before each request.", type: "accent", delay: 2850 },
    ],
  },
  {
    id: "watch",
    label: "watch",
    icon: Activity,
    command: "docsmith watch",
    lines: [
      { text: "Watching for file changes...", type: "muted", delay: 350 },
      { text: "✓ Monitoring 847 files", type: "success", delay: 750 },
      { text: "", type: "normal", delay: 1050 },
      { text: "[14:41:05] auth/middleware.ts changed", type: "muted", delay: 1350 },
      { text: "→ Regenerating API_DOCS.md...", type: "accent", delay: 1750 },
      { text: "✓ Synced in 0.8s", type: "success", delay: 2150 },
      { text: "", type: "normal", delay: 2450 },
      { text: "[14:41:38] Watching...", type: "glow", delay: 2750 },
    ],
  },
];

const LINE_STYLES: Record<LineType, string> = {
  muted: "text-slate-500",
  success: "text-emerald-400",
  accent: "text-indigo-300",
  glow: "text-brand-400 font-semibold",
  normal: "text-slate-400",
};

// ─── TerminalBody ─────────────────────────────────────────────────────────────

function TerminalBody({ cmd }: { cmd: CommandDef }) {
  const [typedCount, setTypedCount] = useState(0);
  const [visibleLines, setVisibleLines] = useState<Set<number>>(new Set());

  useEffect(() => {
    setTypedCount(0);
    setVisibleLines(new Set());

    const charCount = cmd.command.length;
    const speed = Math.max(38, Math.min(72, 1400 / charCount));
    let i = 0;
    const typeTimer = setInterval(() => {
      i++;
      setTypedCount(i);
      if (i >= charCount) clearInterval(typeTimer);
    }, speed);

    const lineTimers = cmd.lines.map((line, idx) =>
      setTimeout(
        () => setVisibleLines((s) => new Set(s).add(idx)),
        line.delay
      )
    );

    return () => {
      clearInterval(typeTimer);
      lineTimers.forEach(clearTimeout);
    };
  }, [cmd]);

  const allRevealed = visibleLines.size === cmd.lines.length;

  return (
    <div className="relative p-5 font-mono text-sm text-left min-h-[252px] space-y-1.5 overflow-hidden">
      {/* Scan line */}
      <motion.div
        className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-brand-400/20 to-transparent pointer-events-none"
        animate={{ top: ["0%", "100%"] }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear", repeatDelay: 3 }}
      />

      {/* Command prompt */}
      <div className="flex items-center gap-2">
        <span className="text-brand-400 select-none shrink-0">$</span>
        <span className="text-foreground tracking-wide">
          {cmd.command.slice(0, typedCount)}
        </span>
        {typedCount < cmd.command.length && (
          <motion.span
            animate={{ opacity: [1, 0] }}
            transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse" }}
            className="inline-block w-[7px] h-[15px] bg-brand-400 rounded-[2px]"
          />
        )}
      </div>

      {/* Output lines */}
      {cmd.lines.map((line, idx) =>
        visibleLines.has(idx) ? (
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className={cn("leading-relaxed", LINE_STYLES[line.type])}
          >
            {line.text || " "}
          </motion.div>
        ) : null
      )}

      {/* Idle cursor */}
      {allRevealed && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-2 pt-0.5"
        >
          <span className="text-brand-400 select-none shrink-0">$</span>
          <motion.span
            animate={{ opacity: [1, 0] }}
            transition={{ duration: 0.8, repeat: Infinity, repeatType: "reverse" }}
            className="inline-block w-[7px] h-[15px] bg-brand-400/60 rounded-[2px]"
          />
        </motion.div>
      )}
    </div>
  );
}

// ─── TerminalWindow ───────────────────────────────────────────────────────────

function TerminalWindow({
  commands,
  activeId,
  onTabChange,
}: {
  commands: CommandDef[];
  activeId: string;
  onTabChange: (id: string) => void;
}) {
  const activeCmd = commands.find((c) => c.id === activeId)!;

  return (
    <div className="rounded-2xl overflow-hidden border border-white/[0.07] bg-[#06060f] shadow-[0_40px_100px_rgba(0,0,0,0.75)] ring-1 ring-inset ring-white/[0.04]">
      {/* Title bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] bg-[#0b0b18]/90">
        <div className="flex gap-1.5">
          <div className="h-3 w-3 rounded-full bg-[#ff5f57]/80" />
          <div className="h-3 w-3 rounded-full bg-[#febc2e]/80" />
          <div className="h-3 w-3 rounded-full bg-[#28c840]/80" />
        </div>
        <span className="text-[11px] text-slate-600 font-mono">~/my-project</span>
        <span className="w-16 text-right text-[10px] text-slate-700 font-mono">zsh</span>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b border-white/[0.06] bg-[#09091a]/90 px-3 pt-1.5">
        {commands.map((cmd) => {
          const Icon = cmd.icon;
          const isActive = cmd.id === activeId;
          return (
            <button
              key={cmd.id}
              onClick={() => onTabChange(cmd.id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-mono",
                "rounded-t-lg transition-all duration-200 border-b-2 cursor-pointer",
                isActive
                  ? "text-brand-300 border-brand-500 bg-brand-500/10"
                  : "text-slate-600 border-transparent hover:text-slate-400 hover:bg-white/[0.03]"
              )}
            >
              <Icon className="h-[11px] w-[11px]" />
              {cmd.label}
            </button>
          );
        })}
      </div>

      {/* Body — key remounts on tab change to replay animation */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeId}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.1 }}
        >
          <TerminalBody cmd={activeCmd} />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ─── FloatCard ────────────────────────────────────────────────────────────────

function FloatCard({
  icon: Icon,
  label,
  value,
  sub,
  delay,
  className,
  floatDelay = "0s",
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sub: string;
  delay: number;
  className?: string;
  floatDelay?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={cn(
        "glass rounded-xl p-3.5 w-40 select-none animate-float",
        className
      )}
      style={{ animationDelay: floatDelay }}
    >
      <div className="flex items-center gap-2 mb-2">
        <div className="h-6 w-6 rounded-md bg-brand-500/20 flex items-center justify-center shrink-0">
          <Icon className="h-3.5 w-3.5 text-brand-400" />
        </div>
        <span className="text-[10px] text-slate-500 uppercase tracking-wider font-medium leading-none">
          {label}
        </span>
      </div>
      <div className="text-2xl font-bold text-foreground tabular-nums">{value}</div>
      <div className="text-[10px] text-slate-600 mt-0.5">{sub}</div>
    </motion.div>
  );
}

// ─── HeroBackground ───────────────────────────────────────────────────────────

function HeroBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -top-[20%] left-[5%] w-[700px] h-[700px] rounded-full bg-brand-500/10 blur-[130px] animate-orb-1" />
      <div className="absolute top-[5%] right-[0%] w-[500px] h-[500px] rounded-full bg-cyan-400/6 blur-[110px] animate-orb-2" />
      <div className="absolute bottom-[-5%] left-[28%] w-[600px] h-[450px] rounded-full bg-violet-500/7 blur-[120px] animate-orb-3" />
      <div className="absolute inset-0 grid-bg opacity-40" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_90%_55%_at_50%_0%,transparent_20%,hsl(var(--background))_100%)]" />
    </div>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

export function Hero() {
  const [activeId, setActiveId] = useState("generate");

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden pt-20">
      <HeroBackground />

      <Container size="xl">
        <div className="relative z-10 flex flex-col items-center text-center gap-8 py-20">

          {/* Badge */}
          <motion.div initial="hidden" animate="visible" variants={fadeInUp}>
            <div className="inline-flex items-center gap-2.5 rounded-full border border-brand-500/30 bg-brand-500/8 px-4 py-1.5 text-sm text-brand-300 backdrop-blur-sm">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-400" />
              </span>
              AI-powered repository intelligence
              <span className="hidden sm:inline text-brand-500/60">·</span>
              <span className="hidden sm:inline text-brand-400/70 text-xs">Now in public beta</span>
            </div>
          </motion.div>

          {/* Headline */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer(0.08, 0.08)}
            className="space-y-3 max-w-5xl"
          >
            <motion.h1
              variants={fadeInUp}
              className="text-5xl sm:text-6xl md:text-7xl lg:text-[5.5rem] font-bold tracking-tight leading-[1.04] text-balance"
            >
              <span className="text-foreground">Your codebase,</span>
              <br />
              <span className="text-gradient-brand">instantly understood.</span>
            </motion.h1>

            <motion.p
              variants={fadeInUp}
              className="mx-auto max-w-2xl text-lg sm:text-xl text-muted-foreground leading-relaxed pt-1"
            >
              DocSmith reads your repository with AI — detects architecture
              patterns, maps dependencies, and generates accurate documentation
              in seconds. Not hours.
            </motion.p>
          </motion.div>

          {/* CTAs */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            transition={{ delay: 0.38 }}
            className="flex flex-col sm:flex-row items-center gap-3"
          >
            <Button size="xl" className="group gap-2 shadow-glow-md min-w-[190px]">
              Get started free
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
            </Button>
            <Button size="xl" variant="secondary" asChild>
              <Link
                href="https://github.com/docsmith-dev/docsmith"
                target="_blank"
                rel="noreferrer"
                className="gap-2"
              >
                <GithubIcon className="h-4 w-4" />
                View on GitHub
              </Link>
            </Button>
          </motion.div>

          {/* Social proof */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            transition={{ delay: 0.52 }}
            className="flex flex-wrap justify-center items-center gap-5 text-sm text-muted-foreground"
          >
            <div className="flex items-center gap-2">
              <div className="flex -space-x-1.5">
                {Array.from({ length: 5 }, (_, i) => (
                  <div
                    key={i}
                    className="h-6 w-6 rounded-full border-2 border-background"
                    style={{ background: `hsl(${234 + i * 19}deg 62% ${46 + i * 6}%)` }}
                  />
                ))}
              </div>
              <span>2,400+ developers</span>
            </div>
            <div className="h-4 w-px bg-border hidden sm:block" />
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }, (_, i) => (
                <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              ))}
              <span className="ml-1">4.9 on ProductHunt</span>
            </div>
            <div className="h-4 w-px bg-border hidden sm:block" />
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              <span>Open source</span>
            </div>
          </motion.div>

          {/* Terminal area */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={scaleIn}
            transition={{ delay: 0.68, duration: 0.55 }}
            className="w-full max-w-3xl relative mt-4"
          >
            {/* Ambient glow */}
            <div className="absolute -inset-4 -z-10 rounded-3xl bg-brand-500/5 blur-3xl" />
            <div className="absolute -inset-px -z-10 rounded-2xl bg-gradient-to-b from-brand-500/10 to-transparent" />

            {/* Floating stat cards — xl screens only */}
            <FloatCard
              icon={GitBranch}
              label="Files indexed"
              value="847"
              sub="across 23 modules"
              delay={1.3}
              floatDelay="0s"
              className="absolute -left-48 top-[30%] hidden xl:block"
            />
            <FloatCard
              icon={Clock}
              label="Generation"
              value="3.2s"
              sub="avg. per project"
              delay={1.6}
              floatDelay="1.5s"
              className="absolute -right-48 top-[18%] hidden xl:block"
            />
            <FloatCard
              icon={Zap}
              label="Docs created"
              value="4 files"
              sub="README · API · Arch"
              delay={1.9}
              floatDelay="3s"
              className="absolute -right-48 top-[62%] hidden xl:block"
            />

            <TerminalWindow
              commands={COMMANDS}
              activeId={activeId}
              onTabChange={setActiveId}
            />
          </motion.div>

          {/* Try also row */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.4 }}
            className="flex flex-wrap justify-center items-center gap-2 text-sm text-slate-600"
          >
            <span>Try also:</span>
            {COMMANDS.filter((c) => c.id !== activeId).map((cmd) => (
              <button
                key={cmd.id}
                onClick={() => setActiveId(cmd.id)}
                className="font-mono text-slate-500 hover:text-brand-400 transition-colors duration-150 cursor-pointer underline-offset-4 hover:underline"
              >
                docsmith {cmd.label}
              </button>
            ))}
          </motion.div>

        </div>
      </Container>
    </section>
  );
}

// ─── GitHub SVG ───────────────────────────────────────────────────────────────

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  );
}
