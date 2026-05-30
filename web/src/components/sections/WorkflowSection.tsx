"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import {
  Github,
  GitBranch,
  Zap,
  Code2,
  Terminal,
  Users,
  FolderGit2,
  ArrowRight,
} from "lucide-react";
import { Container } from "@/components/shared/Container";
import { SectionLabel } from "@/components/shared/SectionLabel";
import { AnimatedGroup, AnimatedItem } from "@/components/shared/AnimatedText";
import { GlowCard } from "@/components/shared/GlowCard";
import { viewport, fadeInUp } from "@/styles/animations";
import { cn } from "@/lib/utils";

const INTEGRATIONS = [
  {
    icon: Github,
    label: "GitHub",
    description: "Auto-generate docs on every push. PR checks ensure docs stay in sync with code.",
    color: "rgba(255,255,255,0.1)",
    stroke: "rgba(255,255,255,0.25)",
    text: "text-white/80",
    accent: "border-white/10",
    tag: "CI/CD",
    tagColor: "text-white/40 bg-white/5 border-white/10",
    delay: 0,
  },
  {
    icon: Zap,
    label: "CI/CD Pipelines",
    description: "Drop docsmith generate into any workflow. GitHub Actions, CircleCI, GitLab — all supported.",
    color: "rgba(251,191,36,0.08)",
    stroke: "rgba(251,191,36,0.3)",
    text: "text-amber-300",
    accent: "border-amber-500/15",
    tag: "Automation",
    tagColor: "text-amber-400/70 bg-amber-500/8 border-amber-500/20",
    delay: 0.07,
  },
  {
    icon: Code2,
    label: "VS Code",
    description: "Extension coming soon. Inline doc previews, hover explanations, and instant README access.",
    color: "rgba(34,211,238,0.08)",
    stroke: "rgba(34,211,238,0.3)",
    text: "text-cyan-300",
    accent: "border-cyan-500/15",
    tag: "IDE",
    tagColor: "text-cyan-400/70 bg-cyan-500/8 border-cyan-500/20",
    delay: 0.14,
  },
  {
    icon: Terminal,
    label: "Terminal Workflows",
    description: "Single commands. Zero config. Works from any shell — bash, zsh, fish, PowerShell.",
    color: "rgba(99,102,241,0.08)",
    stroke: "rgba(99,102,241,0.35)",
    text: "text-brand-300",
    accent: "border-brand-500/15",
    tag: "CLI",
    tagColor: "text-brand-400/70 bg-brand-500/8 border-brand-500/20",
    delay: 0.21,
  },
  {
    icon: FolderGit2,
    label: "Open Source",
    description: "Free forever for public repos. README, CONTRIBUTING, architecture — all generated automatically.",
    color: "rgba(52,211,153,0.07)",
    stroke: "rgba(52,211,153,0.28)",
    text: "text-emerald-300",
    accent: "border-emerald-500/15",
    tag: "Free",
    tagColor: "text-emerald-400/70 bg-emerald-500/8 border-emerald-500/20",
    delay: 0.28,
  },
  {
    icon: Users,
    label: "Team Onboarding",
    description: "New engineers ramp up in minutes, not days. Architecture maps and codebase explanations on demand.",
    color: "rgba(139,92,246,0.08)",
    stroke: "rgba(139,92,246,0.3)",
    text: "text-violet-300",
    accent: "border-violet-500/15",
    tag: "Teams",
    tagColor: "text-violet-400/70 bg-violet-500/8 border-violet-500/20",
    delay: 0.35,
  },
] as const;

const PIPELINE_STEPS = [
  { label: "git push",       sub: "trigger",    color: "#818cf8" },
  { label: "analyze",        sub: "AST scan",   color: "#22d3ee" },
  { label: "generate",       sub: "AI docs",    color: "#a78bfa" },
  { label: "commit docs",    sub: "auto-PR",    color: "#34d399" },
] as const;

function PipelineDiagram() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });

  return (
    <div ref={ref} className="relative overflow-hidden rounded-2xl border border-white/[0.07] bg-[#06060e] p-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <GitBranch className="h-3.5 w-3.5 text-brand-400" />
        <span className="text-[11px] font-mono text-white/40 tracking-wider uppercase">CI/CD Pipeline</span>
        <div className="ml-auto flex items-center gap-1.5">
          <motion.div
            className="h-1.5 w-1.5 rounded-full bg-emerald-400"
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ repeat: Infinity, duration: 1.6 }}
          />
          <span className="text-[10px] font-mono text-white/25">running</span>
        </div>
      </div>

      {/* Steps */}
      <div className="flex items-center gap-2">
        {PIPELINE_STEPS.map((step, i) => (
          <div key={step.label} className="flex items-center gap-2 flex-1">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={inView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.35, delay: i * 0.15 }}
              className="flex-1 rounded-xl border p-3 text-center"
              style={{
                borderColor: `${step.color}30`,
                background: `${step.color}08`,
              }}
            >
              <div className="text-[12px] font-mono font-semibold mb-0.5" style={{ color: step.color }}>
                {step.label}
              </div>
              <div className="text-[9px] font-mono text-white/30 uppercase tracking-wider">{step.sub}</div>
            </motion.div>

            {i < PIPELINE_STEPS.length - 1 && (
              <motion.div
                initial={{ opacity: 0, scaleX: 0 }}
                animate={inView ? { opacity: 1, scaleX: 1 } : {}}
                transition={{ duration: 0.3, delay: i * 0.15 + 0.2 }}
                className="shrink-0"
              >
                <ArrowRight className="h-3.5 w-3.5 text-white/20" />
              </motion.div>
            )}
          </div>
        ))}
      </div>

      {/* Log lines */}
      <div className="mt-5 space-y-1.5">
        {[
          { txt: "$ docsmith generate --watch", color: "text-brand-400" },
          { txt: "✓  Scanning 847 files…", color: "text-white/40" },
          { txt: "✓  Architecture detected: Next.js App Router", color: "text-emerald-400/70" },
          { txt: "✓  Generating README.md, CONTRIBUTING.md", color: "text-white/40" },
          { txt: "✓  Committing docs to branch docs/auto-2024-01", color: "text-cyan-400/70" },
        ].map((line, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -8 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.3, delay: 0.7 + i * 0.12 }}
            className={cn("font-mono text-[11px]", line.color)}
          >
            {line.txt}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export function WorkflowSection() {
  return (
    <section id="workflow" className="relative py-28 overflow-hidden">
      {/* Ambient */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-brand-500/4 blur-[140px] rounded-full" />
        <div className="absolute right-0 bottom-0 w-[400px] h-[400px] bg-cyan-500/4 blur-[120px] rounded-full" />
        <div className="absolute inset-0 grid-bg opacity-[0.12]" />
      </div>

      <Container>
        {/* Header */}
        <AnimatedGroup className="text-center mb-16 space-y-4">
          <AnimatedItem>
            <SectionLabel label="Developer Workflow" />
          </AnimatedItem>
          <AnimatedItem>
            <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-balance">
              Fits into{" "}
              <span className="text-gradient-brand">your stack</span>
            </h2>
          </AnimatedItem>
          <AnimatedItem>
            <p className="mx-auto max-w-xl text-lg text-muted-foreground text-balance">
              DocSmith integrates with the tools your team already uses —
              no new dashboards, no vendor lock-in, no friction.
            </p>
          </AnimatedItem>
        </AnimatedGroup>

        {/* Pipeline diagram */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewport}
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
          <PipelineDiagram />
        </motion.div>

        {/* Integration cards grid */}
        <AnimatedGroup
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          staggerDelay={0.07}
        >
          {INTEGRATIONS.map((item) => {
            const Icon = item.icon;
            return (
              <AnimatedItem key={item.label}>
                <GlowCard
                  className={cn(
                    "p-5 h-full flex flex-col gap-4 group transition-all duration-300",
                    item.accent
                  )}
                >
                  {/* Icon + tag row */}
                  <div className="flex items-start justify-between">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-xl border"
                      style={{ background: item.color, borderColor: item.stroke }}
                    >
                      <Icon className={cn("h-5 w-5", item.text)} />
                    </div>
                    <span
                      className={cn(
                        "text-[10px] font-mono font-medium px-2 py-0.5 rounded-md border",
                        item.tagColor
                      )}
                    >
                      {item.tag}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="space-y-1.5">
                    <h3 className={cn("text-[15px] font-semibold", item.text)}>
                      {item.label}
                    </h3>
                    <p className="text-[13px] text-muted-foreground leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </GlowCard>
              </AnimatedItem>
            );
          })}
        </AnimatedGroup>

        {/* Bottom note */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={viewport}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-12 text-center"
        >
          <p className="text-[13px] font-mono text-muted-foreground/50">
            Works with any language · Any framework · Any repo size
          </p>
        </motion.div>
      </Container>
    </section>
  );
}
