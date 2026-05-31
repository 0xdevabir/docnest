"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import {
  Github,
  Star,
  GitFork,
  GitPullRequest,
  Heart,
  Package,
  Puzzle,
  BookOpen,
} from "lucide-react";
import { Container } from "@/components/shared/Container";
import { SectionLabel } from "@/components/shared/SectionLabel";
import { AnimatedGroup, AnimatedItem } from "@/components/shared/AnimatedText";
import { GlowCard } from "@/components/shared/GlowCard";
import { GradientBorder } from "@/components/shared/GradientBorder";
import { Button } from "@/components/ui/button";
import { viewport } from "@/styles/animations";
import { cn } from "@/lib/utils";

const STATS = [
  { icon: Star,           label: "GitHub Stars",  value: "New",    sub: "star us first",  color: "text-amber-400",   bg: "bg-amber-500/8   border-amber-500/20"  },
  { icon: GitFork,        label: "Open Issues",   value: "0",      sub: "clean slate",    color: "text-brand-400",   bg: "bg-brand-500/8   border-brand-500/20"  },
  { icon: GitPullRequest, label: "Contributors",  value: "2",      sub: "join us",        color: "text-cyan-400",    bg: "bg-cyan-500/8    border-cyan-500/20"   },
  { icon: Package,        label: "License",       value: "MIT",    sub: "forever free",   color: "text-emerald-400", bg: "bg-emerald-500/8 border-emerald-500/20"},
] as const;

const HOW_TO_CONTRIBUTE = [
  {
    icon: BookOpen,
    title: "Improve Docs",
    desc: "Spot a gap in the documentation? Fix it. Every improvement helps the community.",
    color: "text-brand-400",
    border: "border-brand-500/15",
    bg: "bg-brand-500/5",
  },
  {
    icon: GitPullRequest,
    title: "Submit PRs",
    desc: "Add detectors for new frameworks, improve AI prompts, or fix edge cases.",
    color: "text-cyan-400",
    border: "border-cyan-500/15",
    bg: "bg-cyan-500/5",
  },
  {
    icon: Puzzle,
    title: "Build Plugins",
    desc: "DocSmith's architecture is built for extensibility. Ship your own detectors and generators.",
    color: "text-violet-400",
    border: "border-violet-500/15",
    bg: "bg-violet-500/5",
  },
  {
    icon: Heart,
    title: "Spread the Word",
    desc: "Star the repo, share with your team, write about it. Community growth starts here.",
    color: "text-rose-400",
    border: "border-rose-500/15",
    bg: "bg-rose-500/5",
  },
] as const;

const ACTIVITY = [
  { action: "merged",  item: "feat: Hono.js route detector",        by: "chen-l",    time: "2h ago",  color: "text-emerald-400" },
  { action: "opened",  item: "fix: circular dep false positive",     by: "sarah-k",   time: "4h ago",  color: "text-brand-400"   },
  { action: "merged",  item: "feat: Bun runtime detection",         by: "marcus-w",  time: "1d ago",  color: "text-emerald-400" },
  { action: "comment", item: "improve monorepo workspace support",   by: "priya-n",   time: "1d ago",  color: "text-amber-400"   },
  { action: "merged",  item: "docs: add plugin authoring guide",     by: "james-o",   time: "2d ago",  color: "text-emerald-400" },
] as const;

function ActivityFeed() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });

  return (
    <div ref={ref} className="rounded-2xl border border-white/[0.07] bg-[#06060e] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.05]">
        <div className="flex items-center gap-2">
          <Github className="h-3.5 w-3.5 text-white/40" />
          <span className="text-[11px] font-mono text-white/40">Recent Activity</span>
        </div>
        <motion.div
          className="h-1.5 w-1.5 rounded-full bg-emerald-400"
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ repeat: Infinity, duration: 1.8 }}
        />
      </div>
      <div className="divide-y divide-white/[0.04]">
        {ACTIVITY.map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.3, delay: i * 0.1 }}
            className="flex items-start gap-3 px-4 py-3"
          >
            <div className={cn("mt-0.5 text-[10px] font-mono font-semibold w-14 shrink-0", item.color)}>
              {item.action}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] text-white/60 truncate">{item.item}</p>
              <p className="text-[10px] font-mono text-white/25 mt-0.5">@{item.by} · {item.time}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export function OpenSourceSection() {
  return (
    <section id="open-source" className="relative py-28 overflow-hidden">
      {/* Ambient */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-0 -translate-x-1/2 w-[700px] h-[400px] bg-brand-500/4 blur-[140px] rounded-full" />
        <div className="absolute right-0 bottom-1/4 w-[350px] h-[350px] bg-emerald-500/4 blur-[100px] rounded-full" />
        <div className="absolute inset-0 grid-bg opacity-[0.12]" />
      </div>

      <Container>
        {/* Header */}
        <AnimatedGroup className="text-center mb-16 space-y-4">
          <AnimatedItem>
            <SectionLabel label="Open Source" />
          </AnimatedItem>
          <AnimatedItem>
            <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-balance">
              Built in the{" "}
              <span className="text-gradient-brand">open</span>
            </h2>
          </AnimatedItem>
          <AnimatedItem>
            <p className="mx-auto max-w-xl text-lg text-muted-foreground text-balance">
              DocSmith is MIT-licensed and community-driven.
              Inspect the code, contribute detectors, or build your own plugins.
            </p>
          </AnimatedItem>
        </AnimatedGroup>

        {/* Stats row */}
        <AnimatedGroup
          className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-12"
          staggerDelay={0.06}
        >
          {STATS.map((stat) => {
            const Icon = stat.icon;
            return (
              <AnimatedItem key={stat.label}>
                <div className={cn("rounded-2xl border p-4 text-center space-y-2", stat.bg)}>
                  <Icon className={cn("h-5 w-5 mx-auto", stat.color)} />
                  <div className={cn("text-2xl font-bold font-mono", stat.color)}>{stat.value}</div>
                  <div className="text-[11px] text-muted-foreground font-mono">{stat.sub}</div>
                </div>
              </AnimatedItem>
            );
          })}
        </AnimatedGroup>

        {/* Two-column layout */}
        <div className="grid lg:grid-cols-[1fr_360px] gap-8 items-start">
          {/* Left: contribution cards */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground/80 mb-5">How to contribute</h3>
            <div className="grid sm:grid-cols-2 gap-3">
              {HOW_TO_CONTRIBUTE.map((item, i) => {
                const Icon = item.icon;
                return (
                  <motion.div
                    key={item.title}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={viewport}
                    transition={{ duration: 0.4, delay: i * 0.1 }}
                  >
                    <GlowCard className={cn("p-5 h-full flex flex-col gap-3", item.border)}>
                      <div className={cn("flex h-9 w-9 items-center justify-center rounded-xl border", item.bg, item.border)}>
                        <Icon className={cn("h-4 w-4", item.color)} />
                      </div>
                      <div>
                        <h4 className={cn("text-[14px] font-semibold mb-1", item.color)}>{item.title}</h4>
                        <p className="text-[12px] text-muted-foreground leading-relaxed">{item.desc}</p>
                      </div>
                    </GlowCard>
                  </motion.div>
                );
              })}
            </div>

            {/* GitHub CTA */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={viewport}
              transition={{ duration: 0.4, delay: 0.5 }}
              className="pt-2"
            >
              <GradientBorder
                gradient="linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(99,102,241,0.2) 50%, rgba(255,255,255,0.05) 100%)"
                rounded="rounded-2xl"
              >
                <div className="flex flex-col sm:flex-row items-center gap-4 px-6 py-4 rounded-2xl bg-white/[0.02]">
                  <Github className="h-7 w-7 text-white/60 shrink-0" />
                  <div className="flex-1 text-center sm:text-left">
                    <p className="text-[14px] font-medium text-foreground">
                      Star DocSmith on GitHub
                    </p>
                    <p className="text-[12px] text-muted-foreground">
                      Help others discover it. Every star matters.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="shrink-0 gap-2 border border-white/10 bg-white/5 hover:bg-white/10"
                  >
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    Star on GitHub
                  </Button>
                </div>
              </GradientBorder>
            </motion.div>
          </div>

          {/* Right: activity feed */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={viewport}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h3 className="text-lg font-semibold text-foreground/80 mb-5">Community pulse</h3>
            <ActivityFeed />

            {/* Plugin hint */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={viewport}
              transition={{ duration: 0.4, delay: 0.6 }}
              className="mt-4 rounded-xl border border-violet-500/15 bg-violet-500/5 p-4"
            >
              <div className="flex items-center gap-2 mb-1.5">
                <Puzzle className="h-4 w-4 text-violet-400" />
                <span className="text-[12px] font-mono text-violet-400 font-semibold">Plugin API · Coming Soon</span>
              </div>
              <p className="text-[12px] text-muted-foreground leading-relaxed">
                A first-class plugin system for custom detectors, generators,
                and AI providers. Build once, share everywhere.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </Container>
    </section>
  );
}
