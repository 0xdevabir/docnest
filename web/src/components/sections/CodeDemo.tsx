"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { RotateCcw } from "lucide-react";
import { Container } from "@/components/shared/Container";
import { SectionLabel } from "@/components/shared/SectionLabel";
import { AnimatedGroup, AnimatedItem } from "@/components/shared/AnimatedText";
import { viewport } from "@/styles/animations";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type TermColor = "green" | "brand" | "cyan" | "amber" | "muted";

type TLine =
  | { t: "blank" }
  | { t: "header"; version: string; path: string }
  | { t: "section"; label: string }
  | { t: "detect"; label: string; value: string; color?: TermColor }
  | { t: "progress"; file: string; size: string; duration: string; ms: number }
  | { t: "result"; text: string }
  | { t: "info"; text: string; color?: TermColor };

type DemoLine = { line: TLine; delay: number };

// ─── Color helpers ────────────────────────────────────────────────────────────

const tc: Record<TermColor, string> = {
  green: "text-[#4ade80]",
  brand: "text-brand-300",
  cyan: "text-cyan-300",
  amber: "text-amber-300",
  muted: "text-white/38",
};

// ─── Demo metadata ────────────────────────────────────────────────────────────

const DEMOS = [
  {
    id: "generate",
    command: "docsmith generate",
    label: "generate",
    badge: "Full pipeline",
  },
  {
    id: "readme",
    command: "docsmith readme",
    label: "readme",
    badge: "README only",
  },
  {
    id: "analyze",
    command: "docsmith analyze --deep",
    label: "analyze",
    badge: "Deep analysis",
  },
] as const;

// ─── Demo lines ───────────────────────────────────────────────────────────────

const DEMO_LINES: DemoLine[][] = [
  // 0 — docsmith generate
  [
    { line: { t: "blank" }, delay: 60 },
    {
      line: { t: "header", version: "v1.2.0", path: "./my-nextjs-app" },
      delay: 120,
    },
    { line: { t: "blank" }, delay: 80 },
    { line: { t: "section", label: "Scanning repository" }, delay: 220 },
    {
      line: { t: "detect", label: "Next.js 14", value: "App Router", color: "brand" },
      delay: 110,
    },
    {
      line: { t: "detect", label: "Prisma 5.x", value: "ORM", color: "cyan" },
      delay: 100,
    },
    {
      line: {
        t: "detect",
        label: "NextAuth.js",
        value: "Auth provider",
        color: "green",
      },
      delay: 100,
    },
    {
      line: {
        t: "detect",
        label: "Tailwind CSS 3",
        value: "Styling",
        color: "brand",
      },
      delay: 100,
    },
    {
      line: {
        t: "detect",
        label: "Jest + RTL",
        value: "Testing",
        color: "cyan",
      },
      delay: 100,
    },
    {
      line: {
        t: "info",
        text: "847 files  ·  203 modules  ·  0 circular deps",
        color: "muted",
      },
      delay: 130,
    },
    { line: { t: "blank" }, delay: 90 },
    { line: { t: "section", label: "Analyzing architecture" }, delay: 300 },
    {
      line: {
        t: "detect",
        label: "Feature-based",
        value: "Architecture pattern",
        color: "brand",
      },
      delay: 110,
    },
    {
      line: { t: "detect", label: "32 API routes", value: "mapped", color: "cyan" },
      delay: 100,
    },
    {
      line: {
        t: "detect",
        label: "12 data models",
        value: "Prisma schema",
        color: "green",
      },
      delay: 100,
    },
    {
      line: {
        t: "detect",
        label: "JWT auth flow",
        value: "identified",
        color: "brand",
      },
      delay: 100,
    },
    { line: { t: "blank" }, delay: 90 },
    { line: { t: "section", label: "Generating documentation" }, delay: 300 },
    {
      line: {
        t: "progress",
        file: "README.md",
        size: "2.1KB",
        duration: "2.1s",
        ms: 700,
      },
      delay: 110,
    },
    {
      line: {
        t: "progress",
        file: "CONTRIBUTING.md",
        size: "1.8KB",
        duration: "1.4s",
        ms: 560,
      },
      delay: 100,
    },
    {
      line: {
        t: "progress",
        file: "API.md",
        size: "4.1KB",
        duration: "2.8s",
        ms: 900,
      },
      delay: 100,
    },
    {
      line: {
        t: "progress",
        file: "ARCHITECTURE.md",
        size: "1.9KB",
        duration: "1.9s",
        ms: 680,
      },
      delay: 100,
    },
    {
      line: {
        t: "progress",
        file: "dependency-graph.mmd",
        size: "0.8KB",
        duration: "0.8s",
        ms: 380,
      },
      delay: 100,
    },
    {
      line: {
        t: "progress",
        file: "STRUCTURE.md",
        size: "1.5KB",
        duration: "1.2s",
        ms: 480,
      },
      delay: 100,
    },
    { line: { t: "blank" }, delay: 400 },
    {
      line: {
        t: "result",
        text: "✨  6 documents ready  ·  10.2s  →  ./docs/",
      },
      delay: 0,
    },
  ],

  // 1 — docsmith readme
  [
    { line: { t: "blank" }, delay: 60 },
    { line: { t: "section", label: "Analyzing project" }, delay: 200 },
    {
      line: { t: "detect", label: "Next.js 14", value: "App Router", color: "brand" },
      delay: 110,
    },
    {
      line: { t: "detect", label: "pnpm 8.x", value: "Package manager", color: "cyan" },
      delay: 100,
    },
    {
      line: {
        t: "detect",
        label: "47 packages",
        value: "dependencies",
        color: "green",
      },
      delay: 100,
    },
    {
      line: { t: "detect", label: "12 env vars", value: ".env.example", color: "brand" },
      delay: 100,
    },
    { line: { t: "blank" }, delay: 100 },
    { line: { t: "section", label: "Writing README.md" }, delay: 280 },
    {
      line: { t: "info", text: "  ✓  Project overview", color: "green" },
      delay: 120,
    },
    {
      line: { t: "info", text: "  ✓  Tech stack badges", color: "green" },
      delay: 100,
    },
    {
      line: { t: "info", text: "  ✓  Installation guide", color: "green" },
      delay: 100,
    },
    {
      line: {
        t: "info",
        text: "  ✓  Environment variables  (12 vars)",
        color: "green",
      },
      delay: 100,
    },
    {
      line: {
        t: "info",
        text: "  ✓  API reference  (32 endpoints)",
        color: "green",
      },
      delay: 100,
    },
    {
      line: {
        t: "info",
        text: "  ✓  Architecture diagram  (Mermaid)",
        color: "green",
      },
      delay: 100,
    },
    {
      line: { t: "info", text: "  ✓  Contributing guide", color: "green" },
      delay: 100,
    },
    { line: { t: "blank" }, delay: 300 },
    {
      line: { t: "result", text: "✓  README.md written  ·  3.2KB" },
      delay: 0,
    },
  ],

  // 2 — docsmith analyze --deep
  [
    { line: { t: "blank" }, delay: 60 },
    { line: { t: "section", label: "Architecture" }, delay: 200 },
    {
      line: {
        t: "info",
        text: "  Pattern:    Next.js App Router  (feature-based)",
        color: "brand",
      },
      delay: 110,
    },
    {
      line: {
        t: "info",
        text: "  Zones:      app/ · components/ · lib/ · hooks/",
        color: "cyan",
      },
      delay: 100,
    },
    {
      line: {
        t: "info",
        text: "  Layers:     presentation → domain → infrastructure",
        color: "muted",
      },
      delay: 100,
    },
    { line: { t: "blank" }, delay: 100 },
    { line: { t: "section", label: "Data layer" }, delay: 260 },
    {
      line: { t: "info", text: "  ORM:        Prisma 5.x", color: "brand" },
      delay: 110,
    },
    {
      line: {
        t: "info",
        text: "  Models:     User · Post · Comment · Tag · Media  (12)",
        color: "cyan",
      },
      delay: 100,
    },
    {
      line: {
        t: "info",
        text: "  Relations:  8 one-to-many  ·  2 many-to-many",
        color: "muted",
      },
      delay: 100,
    },
    { line: { t: "blank" }, delay: 100 },
    { line: { t: "section", label: "Security" }, delay: 260 },
    {
      line: {
        t: "detect",
        label: "NextAuth.js",
        value: "OAuth + credentials",
        color: "green",
      },
      delay: 110,
    },
    {
      line: {
        t: "detect",
        label: "JWT sessions",
        value: "httpOnly cookie",
        color: "brand",
      },
      delay: 100,
    },
    {
      line: {
        t: "detect",
        label: "24 guarded routes",
        value: "auth middleware",
        color: "cyan",
      },
      delay: 100,
    },
    { line: { t: "blank" }, delay: 100 },
    { line: { t: "section", label: "Code quality" }, delay: 260 },
    {
      line: {
        t: "detect",
        label: "2.3 avg",
        value: "cyclomatic complexity  ✓",
        color: "green",
      },
      delay: 110,
    },
    {
      line: {
        t: "detect",
        label: "0 cycles",
        value: "no circular dependencies  ✓",
        color: "green",
      },
      delay: 100,
    },
    {
      line: {
        t: "detect",
        label: "68%",
        value: "test coverage estimate",
        color: "brand",
      },
      delay: 100,
    },
    { line: { t: "blank" }, delay: 300 },
    {
      line: { t: "result", text: "✓  Analysis complete  →  ARCHITECTURE.md" },
      delay: 0,
    },
  ],
];

// ─── Preview content ──────────────────────────────────────────────────────────

const PREVIEWS = [
  // 0 & 1 — README
  {
    file: "README.md",
    content: (
      <div className="p-5 font-mono text-[12px] leading-[1.75] text-white/75 space-y-3">
        <div className="text-[18px] font-bold text-white leading-tight">
          # MyApp
        </div>
        <div className="text-white/38 italic text-[11.5px]">
          &gt; Auto-generated by DocSmith ✦
        </div>
        <div className="flex flex-wrap gap-1.5 py-0.5">
          {(
            [
              ["Next.js 14", "text-brand-300 border-brand-500/30 bg-brand-500/10"],
              ["TypeScript", "text-cyan-300 border-cyan-500/30 bg-cyan-500/10"],
              ["Prisma", "text-[#4ade80] border-[#4ade80]/30 bg-[#4ade80]/10"],
              ["MIT", "text-amber-300 border-amber-500/30 bg-amber-500/10"],
            ] as [string, string][]
          ).map(([l, c]) => (
            <span
              key={l}
              className={cn(
                "px-2 py-0.5 text-[10px] font-semibold rounded border",
                c
              )}
            >
              {l}
            </span>
          ))}
        </div>
        <div className="h-px bg-white/[0.06]" />
        <div>
          <div className="text-white/85 font-semibold">## Overview</div>
          <p className="text-white/45 mt-1 text-[11.5px]">
            Production-ready SaaS built with Next.js 14 App Router, following a
            feature-based architecture with DDD boundaries.
          </p>
        </div>
        <div>
          <div className="text-white/85 font-semibold">## Quick Start</div>
          <div className="mt-1.5 rounded-lg bg-black/50 border border-white/[0.06] p-3 space-y-1 text-[11.5px]">
            <div>
              <span className="text-white/25">$</span>{" "}
              <span className="text-brand-300">pnpm install</span>
            </div>
            <div>
              <span className="text-white/25">$</span>{" "}
              <span className="text-brand-300">cp .env.example .env</span>
            </div>
            <div>
              <span className="text-white/25">$</span>{" "}
              <span className="text-brand-300">pnpm dev</span>
            </div>
          </div>
        </div>
        <div>
          <div className="text-white/85 font-semibold">## API Endpoints</div>
          <div className="mt-1.5 space-y-1 text-[11.5px]">
            {(
              [
                ["GET", "/api/users", "List users"],
                ["POST", "/api/users", "Create user"],
                ["GET", "/api/users/:id", "Get by ID"],
                ["DELETE", "/api/users/:id", "Delete user"],
              ] as [string, string, string][]
            ).map(([method, path, desc]) => (
              <div key={method + path} className="flex gap-3">
                <span
                  className={cn(
                    "text-[10px] font-bold w-11 shrink-0 mt-px",
                    method === "GET"
                      ? "text-[#4ade80]"
                      : method === "POST"
                      ? "text-brand-300"
                      : method === "DELETE"
                      ? "text-red-400"
                      : "text-cyan-300"
                  )}
                >
                  {method}
                </span>
                <span className="text-cyan-200/60 min-w-[110px] shrink-0">
                  {path}
                </span>
                <span className="text-white/30">{desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
  },
  // 2 — ARCHITECTURE
  {
    file: "ARCHITECTURE.md",
    content: (
      <div className="p-5 font-mono text-[12px] leading-[1.75] text-white/75 space-y-3">
        <div className="text-[18px] font-bold text-white leading-tight">
          # Architecture
        </div>
        <div className="text-white/38 italic text-[11.5px]">
          &gt; Auto-generated by DocSmith ✦
        </div>
        <div className="h-px bg-white/[0.06]" />
        <div>
          <div className="text-white/85 font-semibold">## Pattern</div>
          <p className="text-white/45 mt-1 text-[11.5px]">
            Feature-based modules with Next.js App Router and domain-driven
            design boundaries.
          </p>
        </div>
        <div>
          <div className="text-white/85 font-semibold">## Directory Map</div>
          <div className="mt-1.5 space-y-0.5 text-[11.5px]">
            {(
              [
                ["src/app/", "pages, layouts, API routes"],
                ["src/components/", "shared UI library"],
                ["src/lib/", "utilities, helpers"],
                ["src/hooks/", "React custom hooks"],
                ["src/server/", "actions, data layer"],
              ] as [string, string][]
            ).map(([dir, desc]) => (
              <div key={dir} className="flex gap-2">
                <span className="text-brand-300 min-w-[130px] shrink-0">
                  {dir}
                </span>
                <span className="text-white/35">→ {desc}</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className="text-white/85 font-semibold">## Data Flow</div>
          <div className="mt-1.5 rounded-lg bg-black/50 border border-white/[0.06] p-3 text-[11px] space-y-1">
            <div className="text-brand-300">
              Request → Middleware → Route Handler
            </div>
            <div className="text-white/40 pl-4">→ Service → Repository</div>
            <div className="text-white/30 pl-8">→ Prisma → PostgreSQL</div>
          </div>
        </div>
        <div>
          <div className="text-white/85 font-semibold">## Security</div>
          <div className="mt-1 text-[11.5px] space-y-0.5 text-white/40">
            <div>• NextAuth.js — OAuth 2.0 + credentials</div>
            <div>• JWT sessions — httpOnly secure cookies</div>
            <div>• 24 protected routes — middleware guards</div>
          </div>
        </div>
      </div>
    ),
  },
];

const PREVIEW_IDX = [0, 0, 1]; // which preview each demo maps to

// ─── ProgressLine sub-component ───────────────────────────────────────────────

function ProgressLine({
  file,
  size,
  duration,
  ms,
}: Extract<TLine, { t: "progress" }>) {
  const [fill, setFill] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setFill(true), 80);
    return () => clearTimeout(id);
  }, []);

  return (
    <div className="flex items-center gap-2 pl-4 text-[12.5px] leading-[1.7]">
      <span className="text-[#4ade80] shrink-0">✓</span>
      <span className="text-white/82 font-mono min-w-[152px] shrink-0">
        {file}
      </span>
      <div className="h-[3px] w-[88px] rounded-full bg-white/[0.07] overflow-hidden shrink-0">
        <div
          className="h-full rounded-full bg-gradient-to-r from-brand-400 to-cyan-400"
          style={{
            width: fill ? "100%" : "0%",
            transition: `width ${ms}ms cubic-bezier(0.4,0,0.2,1)`,
          }}
        />
      </div>
      <span className="text-white/38 text-[11px] tabular-nums shrink-0">
        {duration}
      </span>
      <span className="text-white/22 text-[11px] shrink-0">{size}</span>
    </div>
  );
}

// ─── Line renderer ────────────────────────────────────────────────────────────

function Line({ data }: { data: TLine }) {
  switch (data.t) {
    case "blank":
      return <div className="h-2.5" />;

    case "header":
      return (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-brand-500/[0.08] border border-brand-500/[0.15] text-[12px] mb-1">
          <span className="text-brand-400 font-bold tracking-wide">
            DocSmith
          </span>
          <span className="text-white/20">·</span>
          <span className="text-white/45">{data.version}</span>
          <span className="text-white/15 mx-1">—</span>
          <span className="text-white/45">Scanning</span>
          <span className="text-cyan-300 font-medium">{data.path}</span>
        </div>
      );

    case "section":
      return (
        <div className="flex items-center gap-3 py-0.5">
          <span className="text-[12px] font-semibold text-white/88 tracking-wide whitespace-nowrap pl-1">
            {data.label}
          </span>
          <div className="flex-1 h-px bg-white/[0.07]" />
        </div>
      );

    case "detect": {
      const color = data.color ?? "muted";
      return (
        <div className="flex items-baseline gap-2 pl-4 text-[12.5px] leading-[1.7]">
          <span className="text-[#4ade80] shrink-0">✓</span>
          <span className="text-white/84 min-w-[148px] shrink-0">
            {data.label}
          </span>
          <span className={cn("text-[11px]", tc[color])}>{data.value}</span>
        </div>
      );
    }

    case "progress":
      return <ProgressLine {...data} />;

    case "result":
      return (
        <div className="mx-1 mt-1 px-3 py-2.5 rounded-xl bg-brand-500/[0.1] border border-brand-500/[0.22]">
          <span className="text-[13px] font-semibold text-brand-300">
            {data.text}
          </span>
        </div>
      );

    case "info": {
      const color = data.color ?? "muted";
      return (
        <div className={cn("pl-4 text-[12.5px] leading-[1.7]", tc[color])}>
          {data.text}
        </div>
      );
    }
  }
}

// ─── Main component ───────────────────────────────────────────────────────────

type Phase = "idle" | "typing" | "running" | "done";

export function CodeDemo() {
  const [activeDemo, setActiveDemo] = useState(0);
  const [phase, setPhase] = useState<Phase>("idle");
  const [typedCount, setTypedCount] = useState(0);
  const [displayedLines, setDisplayedLines] = useState<DemoLine[]>([]);

  const runIdRef = useRef(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const autoStartedRef = useRef(false);

  const isInView = useInView(sectionRef, { once: true, amount: 0.25 });

  // Auto-scroll terminal to bottom as new lines appear
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [displayedLines.length]);

  const startDemo = useCallback((demoIdx: number) => {
    const id = ++runIdRef.current;
    const command = DEMOS[demoIdx].command;
    const lines = DEMO_LINES[demoIdx];

    setActiveDemo(demoIdx);
    setPhase("typing");
    setTypedCount(0);
    setDisplayedLines([]);

    let charIdx = 0;
    function typeNext() {
      if (runIdRef.current !== id) return;
      charIdx++;
      setTypedCount(charIdx);
      if (charIdx < command.length) {
        setTimeout(typeNext, 38 + Math.random() * 28);
      } else {
        setTimeout(beginOutput, 420);
      }
    }

    function beginOutput() {
      if (runIdRef.current !== id) return;
      setPhase("running");
      let cumDelay = 0;
      lines.forEach((dl, i) => {
        cumDelay += dl.delay;
        setTimeout(() => {
          if (runIdRef.current !== id) return;
          setDisplayedLines((prev) => [...prev, dl]);
          if (i === lines.length - 1) {
            setTimeout(() => {
              if (runIdRef.current !== id) return;
              setPhase("done");
            }, 500);
          }
        }, cumDelay);
      });
    }

    setTimeout(typeNext, 550);
  }, []);

  // Auto-play on scroll-in-view
  useEffect(() => {
    if (isInView && !autoStartedRef.current) {
      autoStartedRef.current = true;
      startDemo(0);
    }
  }, [isInView, startDemo]);

  const demo = DEMOS[activeDemo];
  const displayedCommand = demo.command.slice(0, typedCount);
  const previewIdx = PREVIEW_IDX[activeDemo];
  const preview = PREVIEWS[previewIdx];

  const statusLabel =
    phase === "idle"
      ? "READY"
      : phase === "typing"
      ? "TYPING"
      : phase === "running"
      ? "RUNNING"
      : "DONE";

  const statusColor =
    phase === "idle"
      ? "bg-white/20"
      : phase === "typing"
      ? "bg-amber-400"
      : phase === "running"
      ? "bg-[#4ade80]"
      : "bg-brand-400";

  return (
    <section
      ref={sectionRef}
      id="demo"
      className="relative py-28 overflow-hidden"
    >
      {/* Background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-brand-500/5 blur-[140px] rounded-full" />
        <div className="absolute top-0 right-0 w-[400px] h-[300px] bg-cyan-500/4 blur-[100px] rounded-full" />
        <div className="absolute inset-0 grid-bg opacity-[0.15]" />
      </div>

      <Container>
        {/* Header */}
        <AnimatedGroup className="text-center mb-16 space-y-4">
          <AnimatedItem>
            <SectionLabel label="Live demo" />
          </AnimatedItem>
          <AnimatedItem>
            <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-balance">
              Watch it{" "}
              <span className="text-gradient-brand">run in real time</span>
            </h2>
          </AnimatedItem>
          <AnimatedItem>
            <p className="mx-auto max-w-lg text-lg text-muted-foreground text-balance">
              One command. DocSmith scans your repo, understands your stack, and
              ships complete documentation automatically.
            </p>
          </AnimatedItem>
        </AnimatedGroup>

        {/* Main demo grid */}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewport}
          transition={{ duration: 0.55 }}
          className="grid lg:grid-cols-[1.05fr_0.95fr] gap-4"
        >
          {/* ── Terminal ── */}
          <div className="flex flex-col rounded-2xl bg-[#060610] border border-white/[0.07] overflow-hidden shadow-2xl shadow-black/60">
            {/* Title bar */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.06] bg-white/[0.025] shrink-0">
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-[#ff5f57]" />
                  <div className="h-3 w-3 rounded-full bg-[#febc2e]" />
                  <div className="h-3 w-3 rounded-full bg-[#28c840]" />
                </div>
                <div className="h-3.5 w-px bg-white/[0.1]" />
                <span className="text-[11px] text-white/40 font-mono">
                  ~/my-nextjs-app
                </span>
              </div>

              <div className="flex items-center gap-3">
                {/* Status indicator */}
                <div className="flex items-center gap-1.5">
                  <motion.div
                    className={cn("h-1.5 w-1.5 rounded-full", statusColor)}
                    animate={
                      phase === "running"
                        ? { opacity: [0.5, 1, 0.5] }
                        : phase === "typing"
                        ? { opacity: [0.6, 1, 0.6] }
                        : { opacity: 1 }
                    }
                    transition={{ repeat: Infinity, duration: 1.4 }}
                  />
                  <span className="text-[10px] text-white/30 font-mono tracking-wider">
                    {statusLabel}
                  </span>
                </div>

                {/* Replay button */}
                {phase === "done" && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    onClick={() => startDemo(activeDemo)}
                    className={cn(
                      "flex items-center gap-1.5 px-2.5 py-1 rounded-lg",
                      "text-[11px] text-white/50 border border-white/[0.1]",
                      "hover:text-white/80 hover:border-white/20 hover:bg-white/[0.05]",
                      "transition-all duration-150"
                    )}
                  >
                    <RotateCcw className="h-3 w-3" />
                    Replay
                  </motion.button>
                )}
              </div>
            </div>

            {/* Terminal body */}
            <div
              className="flex-1 overflow-y-auto p-4 space-y-0 scroll-smooth"
              style={{ maxHeight: 440, minHeight: 340 }}
            >
              {/* Prompt + command */}
              <div className="flex items-center gap-2 font-mono text-[13px] pb-1">
                <span className="text-brand-400 font-bold select-none">❯</span>
                <span className="text-white/80">{displayedCommand}</span>
                {/* Blinking cursor */}
                {phase !== "done" && (
                  <motion.span
                    className="inline-block w-[7px] h-[15px] rounded-[2px] bg-brand-400"
                    animate={{ opacity: [1, 0, 1] }}
                    transition={{
                      repeat: Infinity,
                      duration: 1,
                      ease: "easeInOut",
                    }}
                  />
                )}
              </div>

              {/* Output lines */}
              <div className="space-y-0">
                {displayedLines.map((dl, i) => (
                  <motion.div
                    key={`${activeDemo}-${i}`}
                    initial={{ opacity: 0, x: -5 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                  >
                    <Line data={dl.line} />
                  </motion.div>
                ))}
              </div>

              {/* Auto-scroll sentinel */}
              <div ref={bottomRef} className="h-1" />
            </div>

            {/* Terminal footer / command tabs */}
            <div className="flex items-center gap-1.5 px-4 py-2.5 border-t border-white/[0.06] bg-white/[0.015] shrink-0">
              <span className="text-[10px] text-white/25 font-mono mr-2 shrink-0">
                TRY:
              </span>
              {DEMOS.map((d, i) => (
                <button
                  key={d.id}
                  onClick={() => startDemo(i)}
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-mono",
                    "border transition-all duration-200",
                    i === activeDemo
                      ? "border-brand-500/40 bg-brand-500/10 text-brand-300"
                      : "border-white/[0.08] text-white/35 hover:border-white/20 hover:text-white/60"
                  )}
                >
                  <span className="text-white/25">$</span>
                  <span>{d.command}</span>
                </button>
              ))}
            </div>
          </div>

          {/* ── Preview panel ── */}
          <div className="rounded-2xl border border-white/[0.07] overflow-hidden bg-[#06060e] shadow-2xl shadow-black/50 flex flex-col">
            {/* Preview title bar */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.06] bg-white/[0.025] shrink-0">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-sm bg-[#4ade80]/60" />
                <AnimatePresence mode="wait">
                  <motion.span
                    key={previewIdx}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-[12px] font-mono text-white/55"
                  >
                    {preview.file}
                  </motion.span>
                </AnimatePresence>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-1.5 w-1.5 rounded-full bg-[#4ade80]/50" />
                <span className="text-[10px] text-white/25 font-mono">
                  AUTO-GENERATED
                </span>
              </div>
            </div>

            {/* Preview content */}
            <div
              className="flex-1 overflow-y-auto relative"
              style={{ maxHeight: 440, minHeight: 340 }}
            >
              {/* Idle / running state: show skeleton */}
              <AnimatePresence mode="wait">
                {phase !== "done" ? (
                  <motion.div
                    key="skeleton"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="p-5 space-y-3"
                  >
                    <SkeletonLines phase={phase} />
                  </motion.div>
                ) : (
                  <motion.div
                    key={`preview-${activeDemo}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
                  >
                    {preview.content}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Bottom fade */}
              <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[#06060e] to-transparent" />
            </div>
          </div>
        </motion.div>

        {/* Demo badges row */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewport}
          transition={{ delay: 0.2 }}
          className="flex flex-wrap items-center justify-center gap-3 mt-8"
        >
          {DEMOS.map((d, i) => (
            <button
              key={d.id}
              onClick={() => startDemo(i)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium",
                "transition-all duration-200",
                i === activeDemo
                  ? "border-brand-500/50 bg-brand-500/10 text-brand-300 shadow-[0_0_20px_rgba(99,102,241,0.2)]"
                  : "border-border text-muted-foreground hover:border-brand-500/30 hover:text-foreground"
              )}
            >
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  i === activeDemo ? "bg-brand-400" : "bg-muted-foreground/40"
                )}
              />
              <span className="font-mono text-xs">{d.command}</span>
              <span
                className={cn(
                  "text-[10px] px-1.5 py-0.5 rounded border",
                  i === activeDemo
                    ? "border-brand-500/30 bg-brand-500/10 text-brand-400"
                    : "border-border/60 text-muted-foreground/60"
                )}
              >
                {d.badge}
              </span>
            </button>
          ))}
        </motion.div>
      </Container>
    </section>
  );
}

// ─── Skeleton placeholder ─────────────────────────────────────────────────────

function SkeletonLines({ phase }: { phase: Phase }) {
  const isRunning = phase === "running";
  return (
    <div className="space-y-3 p-5 font-mono text-[12px]">
      <div className="space-y-2">
        <motion.div
          className="h-4 w-24 rounded bg-white/[0.06]"
          animate={isRunning ? { opacity: [0.4, 0.7, 0.4] } : { opacity: 0.3 }}
          transition={{ repeat: Infinity, duration: 1.8 }}
        />
        <motion.div
          className="h-3 w-44 rounded bg-white/[0.04]"
          animate={isRunning ? { opacity: [0.3, 0.6, 0.3] } : { opacity: 0.2 }}
          transition={{ repeat: Infinity, duration: 1.8, delay: 0.2 }}
        />
      </div>
      <div className="h-px bg-white/[0.05]" />
      {[48, 36, 52, 32, 44, 38].map((w, i) => (
        <motion.div
          key={i}
          className="h-3 rounded bg-white/[0.04]"
          style={{ width: `${w}%` }}
          animate={isRunning ? { opacity: [0.25, 0.55, 0.25] } : { opacity: 0.15 }}
          transition={{
            repeat: Infinity,
            duration: 1.8,
            delay: i * 0.15,
          }}
        />
      ))}
      {isRunning && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-2 pt-2"
        >
          <motion.div
            className="h-1.5 w-1.5 rounded-full bg-brand-400"
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ repeat: Infinity, duration: 1 }}
          />
          <span className="text-[11px] text-white/30">
            Generating output...
          </span>
        </motion.div>
      )}
    </div>
  );
}
