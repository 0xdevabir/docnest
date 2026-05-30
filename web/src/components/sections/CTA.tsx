"use client";

import { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { ArrowRight, Github, Star, Copy, Check, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/shared/Container";
import { GradientBorder } from "@/components/shared/GradientBorder";
import { fadeInUp, scaleIn } from "@/styles/animations";
import { cn } from "@/lib/utils";

const INSTALL_CMD = "pnpm add -g docsmith";

function CopyButton({ cmd }: { cmd: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(cmd);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  return (
    <button
      onClick={handleCopy}
      className={cn(
        "flex items-center gap-3 rounded-xl border px-5 py-3 font-mono text-sm",
        "bg-background/80 border-border/60 hover:border-brand-500/40",
        "transition-all duration-200 group cursor-pointer"
      )}
    >
      <Terminal className="h-4 w-4 text-brand-400 shrink-0" />
      <span className="text-foreground/80">{cmd}</span>
      <span className="ml-2 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors duration-150">
        {copied ? (
          <Check className="h-3.5 w-3.5 text-emerald-400" />
        ) : (
          <Copy className="h-3.5 w-3.5" />
        )}
      </span>
    </button>
  );
}

const PARTICLES = [
  { id: 0,  x: 8,  y: 15, size: 1.5, dur: 5,   delay: 0,   color: "#818cf8" },
  { id: 1,  x: 22, y: 72, size: 1,   dur: 7,   delay: 1.2, color: "#22d3ee" },
  { id: 2,  x: 35, y: 35, size: 2,   dur: 6,   delay: 0.5, color: "#a78bfa" },
  { id: 3,  x: 48, y: 85, size: 1.5, dur: 8,   delay: 2.1, color: "#818cf8" },
  { id: 4,  x: 60, y: 20, size: 1,   dur: 5.5, delay: 0.8, color: "#22d3ee" },
  { id: 5,  x: 75, y: 60, size: 2,   dur: 6.5, delay: 1.5, color: "#a78bfa" },
  { id: 6,  x: 88, y: 42, size: 1.5, dur: 7.5, delay: 0.3, color: "#818cf8" },
  { id: 7,  x: 92, y: 78, size: 1,   dur: 5,   delay: 2.8, color: "#22d3ee" },
  { id: 8,  x: 15, y: 50, size: 2,   dur: 9,   delay: 1.8, color: "#818cf8" },
  { id: 9,  x: 55, y: 10, size: 1.5, dur: 6,   delay: 3.2, color: "#a78bfa" },
  { id: 10, x: 70, y: 90, size: 1,   dur: 7,   delay: 0.9, color: "#22d3ee" },
  { id: 11, x: 42, y: 55, size: 2,   dur: 8,   delay: 2.5, color: "#818cf8" },
];

function FloatingParticles() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {PARTICLES.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            background: p.color,
          }}
          animate={{ y: [-8, 8, -8], opacity: [0.1, 0.5, 0.1] }}
          transition={{ duration: p.dur, delay: p.delay, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}

function GridScan() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl">
      <motion.div
        className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-brand-400/25 to-transparent"
        animate={{ top: ["0%", "100%"] }}
        transition={{ duration: 9, repeat: Infinity, ease: "linear", repeatDelay: 2 }}
      />
      <motion.div
        className="absolute inset-y-0 w-px bg-gradient-to-b from-transparent via-cyan-400/15 to-transparent"
        animate={{ left: ["0%", "100%"] }}
        transition={{ duration: 14, repeat: Infinity, ease: "linear", delay: 4, repeatDelay: 2 }}
      />
    </div>
  );
}

export function CTA() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.3 });

  return (
    <section ref={ref} id="cta" className="relative py-28 overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 bottom-0 -translate-x-1/2 w-[900px] h-[500px] bg-brand-500/6 blur-[160px] rounded-full" />
        <div className="absolute left-1/4 top-0 w-[400px] h-[300px] bg-cyan-500/4 blur-[120px] rounded-full" />
      </div>

      <Container size="lg">
        <motion.div
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          variants={scaleIn}
        >
          <GradientBorder
            rounded="rounded-3xl"
            gradient="linear-gradient(135deg, rgba(99,102,241,0.55) 0%, rgba(34,211,238,0.25) 50%, rgba(139,92,246,0.2) 100%)"
          >
            <div className="relative rounded-3xl bg-[#060610] overflow-hidden px-6 py-16 sm:px-12 sm:py-24 text-center">
              <div className="pointer-events-none absolute inset-0">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-brand-500/12 blur-[100px] rounded-full" />
                <div className="absolute bottom-0 right-1/4 w-[350px] h-[250px] bg-violet-500/10 blur-[80px] rounded-full" />
                <div className="absolute inset-0 grid-bg opacity-[0.3]" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(6,6,16,0.65)_100%)]" />
              </div>

              <FloatingParticles />
              <GridScan />

              <div className="relative z-10 space-y-10">
                {/* Icon */}
                <motion.div variants={scaleIn} className="flex justify-center">
                  <div className="relative">
                    <div className="absolute -inset-4 rounded-3xl bg-brand-500/15 blur-xl animate-glow-pulse" />
                    <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-brand-500/35 bg-brand-500/15 shadow-glow-md">
                      <Terminal className="h-8 w-8 text-brand-300" />
                    </div>
                  </div>
                </motion.div>

                {/* Headline */}
                <motion.div variants={fadeInUp} className="space-y-5">
                  <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-balance leading-[1.1]">
                    Your docs are{" "}
                    <span className="text-gradient-brand">one command away</span>
                  </h2>
                  <p className="mx-auto max-w-lg text-lg text-muted-foreground text-balance">
                    Drop DocSmith into any codebase and get beautiful,
                    accurate documentation in seconds.
                  </p>
                </motion.div>

                {/* Install command */}
                <motion.div variants={fadeInUp} className="flex justify-center">
                  <CopyButton cmd={INSTALL_CMD} />
                </motion.div>

                {/* CTA buttons */}
                <motion.div
                  variants={fadeInUp}
                  className="flex flex-col sm:flex-row items-center justify-center gap-3"
                >
                  <Button
                    size="xl"
                    className="group gap-2 shadow-glow-md hover:shadow-glow-lg transition-shadow duration-300 min-w-[200px]"
                  >
                    Get started free
                    <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                  </Button>
                  <Button
                    size="xl"
                    variant="secondary"
                    className="gap-2 border border-white/10 bg-white/5 hover:bg-white/10 min-w-[200px]"
                  >
                    <Github className="h-4 w-4" />
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    Star on GitHub
                  </Button>
                </motion.div>

                {/* Trust */}
                <motion.div variants={fadeInUp} className="space-y-2">
                  <p className="text-xs text-muted-foreground/50">
                    Free forever for open-source · No account required · MIT license
                  </p>
                  <div className="flex items-center justify-center gap-4">
                    {["npm", "pnpm", "yarn", "bun"].map((pm) => (
                      <span key={pm} className="text-[11px] font-mono text-muted-foreground/25">
                        {pm}
                      </span>
                    ))}
                  </div>
                </motion.div>

                {/* Wordmark */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={inView ? { opacity: 1 } : {}}
                  transition={{ delay: 1.2, duration: 0.8 }}
                  className="flex items-center justify-center gap-3 pt-2"
                >
                  <div className="h-px w-16 bg-gradient-to-r from-transparent to-brand-500/30" />
                  <span className="text-[10px] font-mono text-muted-foreground/25 tracking-widest uppercase">DocSmith</span>
                  <div className="h-px w-16 bg-gradient-to-l from-transparent to-brand-500/30" />
                </motion.div>
              </div>
            </div>
          </GradientBorder>
        </motion.div>
      </Container>
    </section>
  );
}
