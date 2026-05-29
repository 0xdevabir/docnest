"use client";

import { motion } from "framer-motion";
import {
  Zap,
  GitBranch,
  FileCode2,
  Brain,
  Layers,
  Shield,
} from "lucide-react";
import { Container } from "@/components/shared/Container";
import { GlowCard } from "@/components/shared/GlowCard";
import { SectionLabel } from "@/components/shared/SectionLabel";
import { AnimatedGroup, AnimatedItem } from "@/components/shared/AnimatedText";
import { fadeInUp, viewport } from "@/styles/animations";
import { cn } from "@/lib/utils";

const features = [
  {
    icon: Brain,
    title: "AI architecture understanding",
    description:
      "Detects zones, layers, patterns (MVC, DDD, microservices) and translates them into human-readable explanations.",
    accent: "brand",
    badge: "Core",
  },
  {
    icon: Zap,
    title: "Instant generation",
    description:
      "Run one command and watch DocSmith analyze thousands of files in seconds, not hours.",
    accent: "cyan",
    badge: "Fast",
  },
  {
    icon: FileCode2,
    title: "Multi-format output",
    description:
      "README, CONTRIBUTING, API docs, architecture diagrams, dependency graphs — all in markdown or MDX.",
    accent: "brand",
    badge: "Flexible",
  },
  {
    icon: GitBranch,
    title: "Dependency graph analysis",
    description:
      "PageRank-powered importance scoring, cycle detection, and visual Mermaid / D3 dependency maps.",
    accent: "brand",
    badge: "Smart",
  },
  {
    icon: Layers,
    title: "Framework-aware",
    description:
      "Native support for Next.js, Express, Hono, Fastify — route detection, middleware analysis, auth flows.",
    accent: "cyan",
    badge: "Universal",
  },
  {
    icon: Shield,
    title: "CI/CD ready",
    description:
      "Drop into any pipeline. Keep docs in sync with your code on every push, without manual effort.",
    accent: "brand",
    badge: "DevOps",
  },
];

const accentMap = {
  brand: {
    icon: "text-brand-400 bg-brand-500/15 border-brand-500/20",
    badge: "bg-brand-500/10 text-brand-400 border-brand-500/20",
  },
  cyan: {
    icon: "text-cyan-400 bg-cyan-500/15 border-cyan-500/20",
    badge: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  },
};

export function Features() {
  return (
    <section id="features" className="relative py-28 overflow-hidden">
      {/* Background ambient */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-1/2 right-0 w-[500px] h-[500px] -translate-y-1/2 bg-brand-500/5 blur-[120px] rounded-full" />
      </div>

      <Container>
        {/* Heading */}
        <AnimatedGroup className="text-center mb-16 space-y-4">
          <AnimatedItem>
            <SectionLabel label="Features" />
          </AnimatedItem>
          <AnimatedItem>
            <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-balance">
              Everything your docs need,{" "}
              <span className="text-gradient-brand">nothing they don't</span>
            </h2>
          </AnimatedItem>
          <AnimatedItem>
            <p className="mx-auto max-w-xl text-lg text-muted-foreground text-balance">
              DocSmith understands your codebase the way a senior engineer
              would — then writes better docs than most engineers do.
            </p>
          </AnimatedItem>
        </AnimatedGroup>

        {/* Grid */}
        <AnimatedGroup
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          staggerDelay={0.08}
        >
          {features.map((feature) => {
            const Icon = feature.icon;
            const colors = accentMap[feature.accent as keyof typeof accentMap];
            return (
              <AnimatedItem key={feature.title}>
                <GlowCard className="p-6 h-full flex flex-col gap-4">
                  <div className="flex items-start justify-between">
                    <div
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-xl border",
                        colors.icon
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <span
                      className={cn(
                        "text-xs font-medium px-2 py-0.5 rounded-full border",
                        colors.badge
                      )}
                    >
                      {feature.badge}
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="font-semibold text-foreground leading-snug">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </GlowCard>
              </AnimatedItem>
            );
          })}
        </AnimatedGroup>

        {/* Stats strip */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewport}
          variants={fadeInUp}
          transition={{ delay: 0.2 }}
          className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-px border border-border rounded-2xl overflow-hidden bg-border"
        >
          {[
            { value: "847+", label: "Files analyzed / run" },
            { value: "3.2s", label: "Average generation time" },
            { value: "18", label: "Languages supported" },
            { value: "6", label: "Output doc formats" },
          ].map((stat) => (
            <div key={stat.label} className="bg-surface p-6 text-center">
              <div className="text-3xl font-bold text-gradient-brand tabular-nums">
                {stat.value}
              </div>
              <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </Container>
    </section>
  );
}
