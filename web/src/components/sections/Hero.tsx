"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Star, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/shared/Container";
import { GradientBadge } from "@/components/shared/GradientBorder";
import {
  fadeInUp,
  fadeIn,
  staggerContainer,
  scaleIn,
  viewport,
} from "@/styles/animations";

const terminalLines = [
  { prompt: "$", command: "npx docsmith init", delay: 0.2 },
  { prompt: "", command: "✓ Analyzing 847 files...", delay: 0.8, muted: true },
  { prompt: "", command: "✓ Detecting architecture patterns...", delay: 1.2, muted: true },
  { prompt: "", command: "✓ Generating README.md", delay: 1.6, accent: true },
  { prompt: "", command: "✓ Generating CONTRIBUTING.md", delay: 2.0, accent: true },
  { prompt: "", command: "✓ Generating API_DOCS.md", delay: 2.4, accent: true },
  { prompt: "", command: "✓ Done in 3.2s — 6 files generated", delay: 2.8, success: true },
];

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* Background effects */}
      <div className="pointer-events-none absolute inset-0">
        {/* Radial glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] rounded-full bg-brand-500/8 blur-[120px]" />
        <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] rounded-full bg-cyan-500/5 blur-[100px]" />
        {/* Grid overlay */}
        <div className="absolute inset-0 grid-bg opacity-60" />
        {/* Radial mask to fade grid at edges */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,hsl(var(--background))_100%)]" />
      </div>

      <Container size="xl">
        <div className="relative z-10 flex flex-col items-center text-center gap-8 py-24">
          {/* Badge */}
          <motion.div
            initial="hidden"
            animate="visible"
            viewport={viewport}
            variants={fadeInUp}
          >
            <GradientBadge>
              <Zap className="h-3 w-3 text-brand-400" />
              AI-powered documentation — drop it in, ship it out
            </GradientBadge>
          </motion.div>

          {/* Headline */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer(0.06, 0.1)}
            className="space-y-4"
          >
            <motion.h1
              variants={fadeInUp}
              className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[1.05] text-balance"
            >
              <span className="text-foreground">Documentation</span>
              <br />
              <span className="text-gradient-brand">that writes itself</span>
            </motion.h1>

            <motion.p
              variants={fadeInUp}
              className="mx-auto max-w-2xl text-lg sm:text-xl text-muted-foreground leading-relaxed text-balance"
            >
              DocSmith analyzes your codebase with AI to generate beautiful,
              accurate documentation — READMEs, API docs, architecture guides —
              in seconds, not hours.
            </motion.p>
          </motion.div>

          {/* CTAs */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            transition={{ delay: 0.35 }}
            className="flex flex-col sm:flex-row items-center gap-3"
          >
            <Button size="xl" className="group gap-2 shadow-glow-md">
              Get started free
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
            </Button>
            <Button size="xl" variant="secondary" asChild>
              <Link
                href="https://github.com"
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
            transition={{ delay: 0.5 }}
            className="flex items-center gap-6 text-sm text-muted-foreground"
          >
            <div className="flex items-center gap-1.5">
              <div className="flex -space-x-1.5">
                {Array.from({ length: 5 }, (_, i) => (
                  <div
                    key={i}
                    className="h-6 w-6 rounded-full border-2 border-background"
                    style={{
                      background: `hsl(${238 + i * 15}deg 60% ${50 + i * 5}%)`,
                    }}
                  />
                ))}
              </div>
              <span>2,400+ developers</span>
            </div>
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }, (_, i) => (
                <Star
                  key={i}
                  className="h-3.5 w-3.5 fill-amber-400 text-amber-400"
                />
              ))}
              <span className="ml-1">4.9/5</span>
            </div>
          </motion.div>

          {/* Terminal demo */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={scaleIn}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="w-full max-w-2xl mt-4"
          >
            <Terminal lines={terminalLines} />
          </motion.div>
        </div>
      </Container>
    </section>
  );
}

function Terminal({
  lines,
}: {
  lines: typeof terminalLines;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface overflow-hidden shadow-2xl shadow-black/50">
      {/* Title bar */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-surface-raised">
        <div className="flex gap-1.5">
          <div className="h-3 w-3 rounded-full bg-red-500/70" />
          <div className="h-3 w-3 rounded-full bg-amber-500/70" />
          <div className="h-3 w-3 rounded-full bg-emerald-500/70" />
        </div>
        <span className="text-xs text-muted-foreground font-mono mx-auto">
          docsmith
        </span>
      </div>

      {/* Lines */}
      <div className="p-5 font-mono text-sm space-y-1.5 text-left min-h-[220px]">
        {lines.map((line, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: line.delay, duration: 0.3 }}
            className="flex items-start gap-2"
          >
            {line.prompt && (
              <span className="text-brand-400 shrink-0">{line.prompt}</span>
            )}
            <span
              className={
                line.success
                  ? "text-emerald-400"
                  : line.accent
                  ? "text-brand-300"
                  : line.muted
                  ? "text-muted-foreground"
                  : "text-foreground"
              }
            >
              {line.command}
            </span>
          </motion.div>
        ))}
        {/* Cursor */}
        <motion.span
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.8, repeat: Infinity, repeatType: "reverse" }}
          className="inline-block h-4 w-2 bg-brand-400 rounded-sm"
        />
      </div>
    </div>
  );
}

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  );
}
