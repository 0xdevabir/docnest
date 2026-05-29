"use client";

import { motion } from "framer-motion";
import { Terminal, Cpu, FileOutput } from "lucide-react";
import { Container } from "@/components/shared/Container";
import { SectionLabel } from "@/components/shared/SectionLabel";
import { GradientBorder } from "@/components/shared/GradientBorder";
import { AnimatedGroup, AnimatedItem } from "@/components/shared/AnimatedText";
import { fadeInLeft, fadeInRight, viewport } from "@/styles/animations";
import { cn } from "@/lib/utils";

const steps = [
  {
    step: "01",
    icon: Terminal,
    title: "Install & run",
    description:
      "One command to install. One command to generate. DocSmith handles the rest from config detection to provider setup.",
    code: "npx docsmith init",
    side: "left",
  },
  {
    step: "02",
    icon: Cpu,
    title: "AI analyzes your codebase",
    description:
      "The TypeScript Compiler API scans every file, builds a module graph, identifies architecture patterns, and extracts semantic meaning.",
    code: "Scanning 847 files via TS Compiler API...",
    side: "right",
  },
  {
    step: "03",
    icon: FileOutput,
    title: "Docs generated, instantly",
    description:
      "Beautiful markdown files — README, CONTRIBUTING, API docs, architecture diagrams — ready to commit and ship.",
    code: "✓ 6 files generated in 3.2s",
    side: "left",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="relative py-28 overflow-hidden">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-cyan-500/4 blur-[120px] rounded-full" />
      </div>

      <Container>
        {/* Heading */}
        <AnimatedGroup className="text-center mb-20 space-y-4">
          <AnimatedItem>
            <SectionLabel label="How it works" />
          </AnimatedItem>
          <AnimatedItem>
            <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-balance">
              Three steps to{" "}
              <span className="text-gradient-brand">perfect docs</span>
            </h2>
          </AnimatedItem>
          <AnimatedItem>
            <p className="mx-auto max-w-lg text-lg text-muted-foreground text-balance">
              No config files. No manual mapping. No outdated docs.
            </p>
          </AnimatedItem>
        </AnimatedGroup>

        {/* Steps */}
        <div className="space-y-16 relative">
          {/* Vertical connector line */}
          <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-brand-500/30 to-transparent -translate-x-1/2 pointer-events-none" />

          {steps.map((step, i) => {
            const Icon = step.icon;
            const isLeft = step.side === "left";

            return (
              <motion.div
                key={step.step}
                initial="hidden"
                whileInView="visible"
                viewport={viewport}
                variants={isLeft ? fadeInLeft : fadeInRight}
                transition={{ delay: i * 0.1 }}
                className={cn(
                  "grid lg:grid-cols-2 gap-8 lg:gap-16 items-center",
                  !isLeft && "lg:[&>*:first-child]:order-2"
                )}
              >
                {/* Text side */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono font-bold text-brand-400 tracking-widest uppercase">
                      Step {step.step}
                    </span>
                    <div className="h-px flex-1 bg-border" />
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-bold tracking-tight">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed text-balance">
                    {step.description}
                  </p>
                </div>

                {/* Visual side */}
                <div className="relative">
                  {/* Center dot on connector */}
                  <div className="hidden lg:flex absolute -left-[calc(50%+2rem)] lg:left-auto lg:right-auto lg:-translate-x-1/2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full border border-brand-500/30 bg-surface items-center justify-center z-10"
                    style={{
                      position: "absolute",
                      left: isLeft ? "calc(100% + 3rem)" : "auto",
                      right: isLeft ? "auto" : "calc(100% + 3rem)",
                    }}
                  >
                    <Icon className="h-4 w-4 text-brand-400" />
                  </div>

                  <GradientBorder rounded="rounded-2xl">
                    <div className="bg-surface rounded-2xl p-6 space-y-3">
                      {/* Step badge */}
                      <div className="flex items-center gap-2 mb-4">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500/20 border border-brand-500/30">
                          <Icon className="h-4 w-4 text-brand-400" />
                        </div>
                        <span className="text-sm font-semibold text-foreground">
                          {step.title}
                        </span>
                      </div>

                      {/* Code snippet */}
                      <div className="rounded-xl bg-background border border-border p-4 font-mono text-sm">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex gap-1">
                            {Array.from({ length: 3 }, (_, j) => (
                              <div
                                key={j}
                                className="h-2 w-2 rounded-full bg-muted-foreground/30"
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-brand-300">{step.code}</p>
                      </div>

                      {/* Progress bar */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Processing</span>
                          <span>100%</span>
                        </div>
                        <div className="h-1.5 bg-border rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: "0%" }}
                            whileInView={{ width: "100%" }}
                            viewport={viewport}
                            transition={{ duration: 1.5, delay: 0.3, ease: "easeOut" }}
                            className="h-full rounded-full bg-gradient-to-r from-brand-500 to-cyan-400"
                          />
                        </div>
                      </div>
                    </div>
                  </GradientBorder>
                </div>
              </motion.div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
