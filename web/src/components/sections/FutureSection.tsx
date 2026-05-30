"use client";

import { motion } from "framer-motion";
import {
  Brain,
  MessageSquare,
  Layers,
  FileSearch,
  Network,
  Sparkles,
} from "lucide-react";
import { Container } from "@/components/shared/Container";
import { SectionLabel } from "@/components/shared/SectionLabel";
import { AnimatedGroup, AnimatedItem } from "@/components/shared/AnimatedText";
import { viewport } from "@/styles/animations";
import { cn } from "@/lib/utils";

const FUTURE_ITEMS = [
  {
    icon: Brain,
    title: "Repository Intelligence",
    desc: "An AI that understands your entire codebase as context — answering architecture questions, surfacing risk areas, explaining complex chains of logic.",
    status: "Exploring",
    statusColor: "text-brand-400 bg-brand-500/8 border-brand-500/20",
    color: "#818cf8",
    border: "border-brand-500/15",
    glow: "rgba(99,102,241,0.12)",
    delay: 0,
  },
  {
    icon: MessageSquare,
    title: "Repository Chat",
    desc: "Ask questions about any codebase in plain English. \"Where is auth handled?\" \"What breaks if I remove this service?\" Real answers, not grep results.",
    status: "Planned",
    statusColor: "text-cyan-400 bg-cyan-500/8 border-cyan-500/20",
    color: "#22d3ee",
    border: "border-cyan-500/15",
    glow: "rgba(34,211,238,0.10)",
    delay: 0.1,
  },
  {
    icon: Layers,
    title: "Architecture Understanding",
    desc: "Not just reading files — understanding intent. DocSmith will detect design patterns, identify anti-patterns, and suggest architectural improvements.",
    status: "Exploring",
    statusColor: "text-violet-400 bg-violet-500/8 border-violet-500/20",
    color: "#a78bfa",
    border: "border-violet-500/15",
    glow: "rgba(139,92,246,0.10)",
    delay: 0.2,
  },
  {
    icon: FileSearch,
    title: "Automatic Documentation",
    desc: "Docs that update themselves. Every merge updates the relevant sections — zero manual maintenance, always accurate.",
    status: "In Progress",
    statusColor: "text-emerald-400 bg-emerald-500/8 border-emerald-500/20",
    color: "#34d399",
    border: "border-emerald-500/15",
    glow: "rgba(52,211,153,0.10)",
    delay: 0.3,
  },
  {
    icon: Network,
    title: "Onboarding Assistants",
    desc: "A personalized guide for every new engineer. Answers questions, walks through architecture, explains patterns — available 24/7, never bored.",
    status: "Planned",
    statusColor: "text-amber-400 bg-amber-500/8 border-amber-500/20",
    color: "#fbbf24",
    border: "border-amber-500/15",
    glow: "rgba(251,191,36,0.08)",
    delay: 0.4,
  },
  {
    icon: Sparkles,
    title: "AI Provider Agnostic",
    desc: "Bring your own model. OpenAI, Anthropic, Gemini, local Ollama — or enterprise deployments. DocSmith adapts to your infrastructure.",
    status: "Today",
    statusColor: "text-white/60 bg-white/5 border-white/10",
    color: "rgba(255,255,255,0.7)",
    border: "border-white/10",
    glow: "rgba(255,255,255,0.05)",
    delay: 0.5,
  },
] as const;

export function FutureSection() {
  return (
    <section id="future" className="relative py-28 overflow-hidden">
      {/* Ambient */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute right-1/4 top-1/4 w-[600px] h-[600px] bg-brand-500/4 blur-[180px] rounded-full" />
        <div className="absolute left-0 bottom-0 w-[400px] h-[400px] bg-violet-500/4 blur-[140px] rounded-full" />
        <div className="absolute inset-0 grid-bg opacity-[0.10]" />
      </div>

      <Container>
        {/* Header */}
        <AnimatedGroup className="text-center mb-16 space-y-4">
          <AnimatedItem>
            <SectionLabel label="Future Vision" />
          </AnimatedItem>
          <AnimatedItem>
            <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-balance">
              The future of{" "}
              <span className="text-gradient-brand">developer tooling</span>
            </h2>
          </AnimatedItem>
          <AnimatedItem>
            <p className="mx-auto max-w-xl text-lg text-muted-foreground text-balance">
              DocSmith today is just the start. Here is where we are headed —
              thoughtfully, without hype.
            </p>
          </AnimatedItem>
        </AnimatedGroup>

        {/* Cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {FUTURE_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={viewport}
                transition={{ duration: 0.45, delay: item.delay }}
                className="group"
              >
                <div
                  className={cn(
                    "relative h-full rounded-2xl border p-6 flex flex-col gap-4 overflow-hidden",
                    "transition-all duration-300 hover:border-opacity-40",
                    item.border
                  )}
                  style={{ background: `${item.glow}` }}
                >
                  {/* Subtle hover glow */}
                  <div
                    className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{
                      background: `radial-gradient(ellipse at 50% 0%, ${item.glow} 0%, transparent 70%)`,
                    }}
                  />

                  {/* Status badge */}
                  <div className="flex items-start justify-between gap-3">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-xl"
                      style={{ background: `${item.glow}`, border: `1px solid ${item.color}25` }}
                    >
                      <Icon className="h-5 w-5" style={{ color: item.color }} />
                    </div>
                    <span
                      className={cn(
                        "shrink-0 text-[10px] font-mono font-semibold px-2.5 py-1 rounded-full border",
                        item.statusColor
                      )}
                    >
                      {item.status}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="space-y-2 flex-1">
                    <h3 className="text-[15px] font-semibold" style={{ color: item.color }}>
                      {item.title}
                    </h3>
                    <p className="text-[13px] text-muted-foreground leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Bottom note */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={viewport}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-14 text-center space-y-2"
        >
          <p className="text-[13px] font-mono text-muted-foreground/50">
            Built incrementally · Shipped when ready · No roadmap theater
          </p>
          <p className="text-[12px] text-muted-foreground/30 font-mono">
            Follow along on GitHub
          </p>
        </motion.div>
      </Container>
    </section>
  );
}
