"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { Sparkles, BookOpen, Layers3, ShieldCheck, Network } from "lucide-react";
import { Container } from "@/components/shared/Container";
import { SectionLabel } from "@/components/shared/SectionLabel";
import { AnimatedGroup, AnimatedItem } from "@/components/shared/AnimatedText";
import { viewport } from "@/styles/animations";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────────

type TopicColor = "brand" | "cyan" | "green" | "amber";
type Phase = "idle" | "typing" | "scanning" | "thinking" | "responding";

interface ScanLine {
  text: string;
  delay: number;
}
interface RBlock {
  delay: number;
  node: React.ReactNode;
}
interface Topic {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  color: TopicColor;
  label: string;
  question: string;
  command: string;
  scanLines: ScanLine[];
  blocks: RBlock[];
}

// ─── Color tokens ────────────────────────────────────────────────────────────

const C: Record<
  TopicColor,
  {
    text: string;
    border: string;
    bg: string;
    activeBorder: string;
    activeBg: string;
    dot: string;
  }
> = {
  brand: {
    text: "text-brand-300",
    border: "border-brand-500/25",
    bg: "bg-brand-500/[0.07]",
    activeBorder: "border-brand-500/50",
    activeBg: "bg-brand-500/[0.1]",
    dot: "bg-brand-400",
  },
  cyan: {
    text: "text-cyan-300",
    border: "border-cyan-500/25",
    bg: "bg-cyan-500/[0.07]",
    activeBorder: "border-cyan-500/50",
    activeBg: "bg-cyan-500/[0.1]",
    dot: "bg-cyan-400",
  },
  green: {
    text: "text-[#4ade80]",
    border: "border-[#4ade80]/25",
    bg: "bg-[#4ade80]/[0.07]",
    activeBorder: "border-[#4ade80]/50",
    activeBg: "bg-[#4ade80]/[0.1]",
    dot: "bg-[#4ade80]",
  },
  amber: {
    text: "text-amber-300",
    border: "border-amber-500/25",
    bg: "bg-amber-500/[0.07]",
    activeBorder: "border-amber-500/50",
    activeBg: "bg-amber-500/[0.1]",
    dot: "bg-amber-400",
  },
};

// ─── Topic data ───────────────────────────────────────────────────────────────

const TOPICS: Topic[] = [
  {
    id: "overview",
    icon: BookOpen,
    color: "brand",
    label: "Repo overview",
    question: "What does this repository do?",
    command: "docsmith explain",
    scanLines: [
      { text: "Scanning 847 files across 203 modules", delay: 0 },
      { text: "Detected: Next.js 14  ·  TypeScript  ·  Prisma  ·  NextAuth.js", delay: 420 },
      { text: "Architecture: feature-based, DDD boundaries", delay: 780 },
      { text: "Building explanation...", delay: 1080 },
    ],
    blocks: [
      {
        delay: 0,
        node: (
          <p className="text-[13px] leading-relaxed text-white/72">
            This is a{" "}
            <span className="text-white/92 font-semibold">
              production-grade SaaS platform
            </span>{" "}
            built with Next.js 14 App Router — a content management and
            collaboration tool for teams needing real-time document sharing with
            role-based access control.
          </p>
        ),
      },
      {
        delay: 160,
        node: (
          <ul className="space-y-2">
            {(
              [
                ["Full-stack TypeScript", "end-to-end type safety via Prisma"],
                ["Multi-tenant", "workspace isolation per organization"],
                ["Real-time", "WebSocket-driven collaboration events"],
                ["Auth", "OAuth + credentials via NextAuth.js v5"],
              ] as [string, string][]
            ).map(([label, desc]) => (
              <li key={label} className="flex items-start gap-2.5 text-[12.5px]">
                <span className="text-[#4ade80] mt-0.5 shrink-0">•</span>
                <span>
                  <span className="text-white/85 font-medium">{label}</span>
                  <span className="text-white/40"> — {desc}</span>
                </span>
              </li>
            ))}
          </ul>
        ),
      },
      {
        delay: 320,
        node: (
          <div className="rounded-xl bg-black/30 border border-white/[0.06] p-3.5 font-mono text-[12px] space-y-1.5">
            <p className="text-[10px] font-semibold text-white/28 uppercase tracking-widest mb-2.5">
              Entry Points
            </p>
            {(
              [
                ["src/app/layout.tsx", "root shell, providers, fonts"],
                ["src/app/page.tsx", "marketing home"],
                ["src/server/", "service + repository layer"],
              ] as [string, string][]
            ).map(([path, desc]) => (
              <div key={path} className="flex items-baseline gap-3">
                <span className="text-brand-300 shrink-0 min-w-[184px]">
                  {path}
                </span>
                <span className="text-white/35">→ {desc}</span>
              </div>
            ))}
          </div>
        ),
      },
    ],
  },
  {
    id: "architecture",
    icon: Layers3,
    color: "cyan",
    label: "Architecture",
    question: "How is the codebase structured?",
    command: "docsmith explain --architecture",
    scanLines: [
      { text: "Analyzing 203 module boundaries...", delay: 0 },
      { text: "Pattern: feature-based + DDD", delay: 360 },
      { text: "Zones: app/ · features/ · server/ · components/", delay: 720 },
      { text: "Mapping data flow...", delay: 1080 },
    ],
    blocks: [
      {
        delay: 0,
        node: (
          <p className="text-[13px] leading-relaxed text-white/72">
            Follows a{" "}
            <span className="text-white/92 font-semibold">
              feature-based architecture
            </span>{" "}
            with Domain-Driven Design boundaries. Each feature owns its UI,
            server actions, and data access — preventing cross-feature coupling.
          </p>
        ),
      },
      {
        delay: 160,
        node: (
          <div className="rounded-xl bg-black/30 border border-white/[0.06] p-3.5 font-mono text-[12px] space-y-1">
            {(
              [
                { path: "src/app/", desc: "Next.js routes & page layouts", indent: 0 },
                { path: "src/features/", desc: "Self-contained feature modules", indent: 0 },
                { path: "└─ auth/", desc: "Authentication + session", indent: 1 },
                { path: "└─ workspace/", desc: "Multi-tenant workspaces", indent: 1 },
                { path: "└─ documents/", desc: "Document management", indent: 1 },
                { path: "src/server/", desc: "Shared server utilities", indent: 0 },
                { path: "src/components/", desc: "Shared UI library", indent: 0 },
              ]
            ).map(({ path, desc, indent }) => (
              <div
                key={path}
                className="flex items-baseline gap-3"
                style={{ paddingLeft: indent * 14 }}
              >
                <span className="text-cyan-300 shrink-0 min-w-[148px]">
                  {path}
                </span>
                <span className="text-white/35">→ {desc}</span>
              </div>
            ))}
          </div>
        ),
      },
      {
        delay: 320,
        node: (
          <div className="space-y-2">
            <p className="text-[10.5px] font-semibold text-white/35 uppercase tracking-widest">
              Data Flow
            </p>
            <div className="flex items-center gap-1.5 flex-wrap font-mono text-[12px] leading-loose">
              {(
                [
                  { t: "Component", c: "text-white/55" },
                  { t: "→", c: "text-white/20" },
                  { t: "Server Action", c: "text-brand-300" },
                  { t: "→", c: "text-white/20" },
                  { t: "Service", c: "text-cyan-300" },
                  { t: "→", c: "text-white/20" },
                  { t: "Repository", c: "text-[#4ade80]" },
                  { t: "→", c: "text-white/20" },
                  { t: "Prisma", c: "text-amber-300" },
                  { t: "→", c: "text-white/20" },
                  { t: "PostgreSQL", c: "text-white/45" },
                ]
              ).map(({ t, c }, i) => (
                <span key={i} className={c}>
                  {t}
                </span>
              ))}
            </div>
          </div>
        ),
      },
    ],
  },
  {
    id: "auth",
    icon: ShieldCheck,
    color: "green",
    label: "Auth flow",
    question: "How does authentication work?",
    command: "docsmith explain --auth-flow",
    scanLines: [
      { text: "Scanning auth-related modules...", delay: 0 },
      { text: "Provider: NextAuth.js v5  ·  3 OAuth providers", delay: 360 },
      { text: "24 protected routes · httpOnly JWT cookies", delay: 720 },
      { text: "Tracing auth flow...", delay: 1080 },
    ],
    blocks: [
      {
        delay: 0,
        node: (
          <p className="text-[13px] leading-relaxed text-white/72">
            Uses{" "}
            <span className="text-white/92 font-semibold">NextAuth.js v5</span>{" "}
            with a hybrid strategy — OAuth for social login, credentials for
            email/password. Sessions are JWT-based, stored in httpOnly cookies
            with zero client-side access.
          </p>
        ),
      },
      {
        delay: 160,
        node: (
          <div className="space-y-3">
            <p className="text-[10.5px] font-semibold text-white/35 uppercase tracking-widest">
              Request Flow
            </p>
            {(
              [
                {
                  n: 1,
                  label: "middleware.ts",
                  text: "Validates session cookie on every request",
                },
                {
                  n: 2,
                  label: "Unauthenticated",
                  text: "Redirect → /auth/login",
                },
                {
                  n: 3,
                  label: "POST /api/auth/[...nextauth]",
                  text: "Strategy selected (OAuth / credentials)",
                },
                {
                  n: 4,
                  label: "JWT issued",
                  text: "Stored in httpOnly cookie, no JS access",
                },
                {
                  n: 5,
                  label: "auth() helper",
                  text: "Server-side session read in route handlers",
                },
              ]
            ).map(({ n, label, text }) => (
              <div key={n} className="flex items-start gap-3 text-[12.5px]">
                <span className="shrink-0 h-5 w-5 rounded-full bg-[#4ade80]/[0.12] border border-[#4ade80]/30 flex items-center justify-center text-[10px] font-bold text-[#4ade80] mt-0.5">
                  {n}
                </span>
                <div>
                  <span className="font-mono text-white/80 text-[12px]">
                    {label}
                  </span>
                  <span className="text-white/38 block text-[11.5px] mt-0.5">
                    {text}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ),
      },
      {
        delay: 320,
        node: (
          <div className="flex flex-wrap gap-2">
            {(
              [
                {
                  label: "24 guarded routes",
                  c: "text-[#4ade80] border-[#4ade80]/30 bg-[#4ade80]/[0.08]",
                },
                {
                  label: "3 OAuth providers",
                  c: "text-brand-300 border-brand-500/30 bg-brand-500/[0.08]",
                },
                {
                  label: "admin · member · viewer",
                  c: "text-amber-300 border-amber-500/30 bg-amber-500/[0.08]",
                },
                {
                  label: "httpOnly JWT",
                  c: "text-cyan-300 border-cyan-500/30 bg-cyan-500/[0.08]",
                },
              ]
            ).map(({ label, c }) => (
              <span
                key={label}
                className={cn(
                  "px-2.5 py-1 rounded-lg border text-[11px] font-medium font-mono",
                  c
                )}
              >
                {label}
              </span>
            ))}
          </div>
        ),
      },
    ],
  },
  {
    id: "api",
    icon: Network,
    color: "amber",
    label: "API structure",
    question: "What APIs does this expose?",
    command: "docsmith explain --api",
    scanLines: [
      { text: "Scanning route handlers...", delay: 0 },
      { text: "Found 32 API routes across 8 route groups", delay: 360 },
      { text: "Auth: all mutating routes require session", delay: 720 },
      { text: "Mapping endpoints...", delay: 1080 },
    ],
    blocks: [
      {
        delay: 0,
        node: (
          <p className="text-[13px] leading-relaxed text-white/72">
            <span className="text-white/92 font-semibold">32 API routes</span>{" "}
            in RESTful resource groups. All mutating endpoints (POST, PUT,
            DELETE) require a valid session — enforced at the middleware level
            before route handlers run.
          </p>
        ),
      },
      {
        delay: 160,
        node: (
          <div className="space-y-1.5">
            {(
              [
                {
                  prefix: "/api/users",
                  count: 6,
                  desc: "CRUD + role management",
                  text: "text-brand-300",
                  border: "border-brand-500/20",
                  bg: "bg-brand-500/[0.06]",
                },
                {
                  prefix: "/api/workspaces",
                  count: 8,
                  desc: "Workspace lifecycle",
                  text: "text-cyan-300",
                  border: "border-cyan-500/20",
                  bg: "bg-cyan-500/[0.06]",
                },
                {
                  prefix: "/api/documents",
                  count: 12,
                  desc: "Document operations",
                  text: "text-[#4ade80]",
                  border: "border-[#4ade80]/20",
                  bg: "bg-[#4ade80]/[0.06]",
                },
                {
                  prefix: "/api/webhooks",
                  count: 4,
                  desc: "External event receivers",
                  text: "text-amber-300",
                  border: "border-amber-500/20",
                  bg: "bg-amber-500/[0.06]",
                },
                {
                  prefix: "/api/auth",
                  count: 2,
                  desc: "NextAuth handler (auto-generated)",
                  text: "text-white/40",
                  border: "border-white/[0.08]",
                  bg: "bg-white/[0.02]",
                },
              ]
            ).map(({ prefix, count, desc, text, border, bg }) => (
              <div
                key={prefix}
                className={cn(
                  "flex items-center justify-between px-3 py-2 rounded-lg border",
                  border,
                  bg
                )}
              >
                <div className="flex items-center gap-3 font-mono text-[12px] min-w-0">
                  <span className={cn("shrink-0", text)}>{prefix}</span>
                  <span className="text-white/32 font-sans text-[11.5px] truncate">
                    {desc}
                  </span>
                </div>
                <span
                  className={cn(
                    "shrink-0 font-mono text-[10.5px] px-2 py-0.5 rounded border ml-2",
                    text,
                    border,
                    bg
                  )}
                >
                  {count}
                </span>
              </div>
            ))}
          </div>
        ),
      },
      {
        delay: 320,
        node: (
          <div className="rounded-xl bg-black/30 border border-white/[0.06] p-3.5">
            <p className="text-[10.5px] font-semibold text-white/35 uppercase tracking-widest mb-2">
              Validation Pattern
            </p>
            <p className="text-[12.5px] text-white/55 leading-relaxed">
              Route files export named HTTP methods. Input validated via{" "}
              <code className="font-mono text-amber-300 text-[11.5px] px-1 py-0.5 rounded bg-amber-500/[0.1] border border-amber-500/20">
                Zod
              </code>{" "}
              schemas at{" "}
              <code className="font-mono text-brand-300 text-[11.5px]">
                src/lib/validators/
              </code>
              . Type-safe end-to-end via{" "}
              <code className="font-mono text-cyan-300 text-[11.5px]">
                infer&lt;typeof schema&gt;
              </code>
              .
            </p>
          </div>
        ),
      },
    ],
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export function ExplainSection() {
  const [activeTopic, setActiveTopic] = useState(0);
  const [phase, setPhase] = useState<Phase>("idle");
  const [typedChars, setTypedChars] = useState(0);
  const [scanReveal, setScanReveal] = useState(0);
  const [blockReveal, setBlockReveal] = useState(0);

  const runIdRef = useRef(0);
  const sectionRef = useRef<HTMLElement>(null);
  const autoStartedRef = useRef(false);
  const responseRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.2 });

  const startTopic = useCallback((idx: number) => {
    const id = ++runIdRef.current;
    const topic = TOPICS[idx];

    setActiveTopic(idx);
    setPhase("typing");
    setTypedChars(0);
    setScanReveal(0);
    setBlockReveal(0);

    const cmd = topic.command;
    let charIdx = 0;

    function typeNext() {
      if (runIdRef.current !== id) return;
      charIdx++;
      setTypedChars(charIdx);
      if (charIdx < cmd.length) {
        setTimeout(typeNext, 36 + Math.random() * 22);
      } else {
        setTimeout(startScanning, 310);
      }
    }

    function startScanning() {
      if (runIdRef.current !== id) return;
      setPhase("scanning");
      topic.scanLines.forEach((line, i) => {
        setTimeout(() => {
          if (runIdRef.current !== id) return;
          setScanReveal(i + 1);
          if (i === topic.scanLines.length - 1) {
            setTimeout(startThinking, 360);
          }
        }, line.delay);
      });
    }

    function startThinking() {
      if (runIdRef.current !== id) return;
      setPhase("thinking");
      setTimeout(startResponding, 680);
    }

    function startResponding() {
      if (runIdRef.current !== id) return;
      setPhase("responding");
      topic.blocks.forEach((block, i) => {
        setTimeout(() => {
          if (runIdRef.current !== id) return;
          setBlockReveal(i + 1);
        }, block.delay);
      });
    }

    setTimeout(typeNext, 420);
  }, []);

  useEffect(() => {
    if (isInView && !autoStartedRef.current) {
      autoStartedRef.current = true;
      startTopic(0);
    }
  }, [isInView, startTopic]);

  useEffect(() => {
    responseRef.current?.scrollTo({ top: responseRef.current.scrollHeight, behavior: "smooth" });
  }, [blockReveal]);

  const topic = TOPICS[activeTopic];
  const c = C[topic.color];
  const displayedCommand = topic.command.slice(0, typedChars);

  const statusLabel =
    phase === "idle" ? "READY" :
    phase === "typing" ? "TYPING" :
    phase === "scanning" ? "SCANNING" :
    phase === "thinking" ? "THINKING" :
    "DONE";

  const statusColor =
    phase === "idle" ? "bg-white/20" :
    phase === "typing" ? "bg-amber-400" :
    phase === "scanning" ? "bg-[#4ade80]" :
    "bg-brand-400";

  return (
    <section
      ref={sectionRef}
      id="explain"
      className="relative py-28 overflow-hidden"
    >
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute right-0 top-1/3 w-[560px] h-[480px] bg-cyan-500/[0.04] blur-[140px] rounded-full" />
        <div className="absolute left-0 bottom-0 w-[480px] h-[360px] bg-brand-500/[0.05] blur-[120px] rounded-full" />
        <div className="absolute inset-0 grid-bg opacity-[0.12]" />
      </div>

      <Container>
        {/* Section header */}
        <AnimatedGroup className="text-center mb-16 space-y-4">
          <AnimatedItem>
            <SectionLabel label="AI explanations" />
          </AnimatedItem>
          <AnimatedItem>
            <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-balance">
              Ask anything about your{" "}
              <span className="text-gradient-brand">codebase</span>
            </h2>
          </AnimatedItem>
          <AnimatedItem>
            <p className="mx-auto max-w-lg text-lg text-muted-foreground text-balance">
              DocSmith reads your entire repository and explains it like a senior
              engineer who&apos;s been working on it for years.
            </p>
          </AnimatedItem>
        </AnimatedGroup>

        {/* Main layout */}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewport}
          transition={{ duration: 0.55 }}
          className="grid lg:grid-cols-[292px_1fr] xl:grid-cols-[316px_1fr] gap-4 items-start"
        >
          {/* ── Topic sidebar ── */}
          <div className="flex flex-col gap-2">
            <p className="text-[10.5px] font-semibold text-white/28 uppercase tracking-widest px-1 mb-1">
              Explain
            </p>

            {TOPICS.map((t, i) => {
              const isActive = i === activeTopic;
              const tc = C[t.color];
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  onClick={() => startTopic(i)}
                  className={cn(
                    "group relative flex items-start gap-3 px-4 py-3.5 rounded-xl border text-left",
                    "transition-all duration-200",
                    isActive
                      ? cn(tc.activeBorder, tc.activeBg)
                      : "border-white/[0.07] bg-white/[0.02] hover:border-white/[0.14] hover:bg-white/[0.04]"
                  )}
                >
                  {/* Icon */}
                  <div
                    className={cn(
                      "shrink-0 h-8 w-8 rounded-lg flex items-center justify-center border mt-0.5 transition-all duration-200",
                      isActive
                        ? cn(tc.bg, tc.border)
                        : "bg-white/[0.04] border-white/[0.07] group-hover:bg-white/[0.07]"
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-4 w-4 transition-colors duration-200",
                        isActive ? tc.text : "text-white/38 group-hover:text-white/55"
                      )}
                    />
                  </div>

                  {/* Labels */}
                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        "text-[12.5px] font-semibold mb-0.5 transition-colors duration-200",
                        isActive ? tc.text : "text-white/50 group-hover:text-white/68"
                      )}
                    >
                      {t.label}
                    </p>
                    <p className="text-[12px] text-white/35 leading-snug">
                      {t.question}
                    </p>
                  </div>

                  {/* Active dot */}
                  {isActive && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className={cn(
                        "shrink-0 h-1.5 w-1.5 rounded-full mt-2",
                        tc.dot
                      )}
                    />
                  )}
                </button>
              );
            })}

            {/* Hint */}
            <p className="text-[11px] text-white/20 px-1 pt-1 leading-relaxed">
              Click any question — DocSmith scans your repo and explains it in
              plain language.
            </p>
          </div>

          {/* ── Explain panel ── */}
          <div className="rounded-2xl border border-white/[0.07] bg-[#060610] overflow-hidden shadow-2xl shadow-black/60 flex flex-col">
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
              <div className="flex items-center gap-1.5">
                <motion.div
                  className={cn("h-1.5 w-1.5 rounded-full", statusColor)}
                  animate={
                    phase !== "idle" && phase !== "responding"
                      ? { opacity: [0.5, 1, 0.5] }
                      : { opacity: 1 }
                  }
                  transition={{ repeat: Infinity, duration: 1.4 }}
                />
                <span className="text-[10px] text-white/28 font-mono tracking-wider">
                  {statusLabel}
                </span>
              </div>
            </div>

            {/* Split body: terminal | AI response */}
            <div className="flex flex-col md:flex-row flex-1">
              {/* Terminal pane */}
              <div
                className="md:w-[44%] border-b md:border-b-0 md:border-r border-white/[0.05] p-4 flex flex-col"
                style={{ minHeight: 320 }}
              >
                {/* Prompt + typed command */}
                <div className="flex items-center gap-2 font-mono text-[13px] mb-4">
                  <span className={cn("font-bold select-none", c.text)}>❯</span>
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={`cmd-${activeTopic}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-white/80"
                    >
                      {displayedCommand}
                    </motion.span>
                  </AnimatePresence>
                  {phase === "typing" && (
                    <motion.span
                      className="inline-block w-[7px] h-[14px] rounded-[2px] bg-brand-400"
                      animate={{ opacity: [1, 0, 1] }}
                      transition={{ repeat: Infinity, duration: 0.95 }}
                    />
                  )}
                </div>

                {/* Scan output lines */}
                <div className="flex-1 space-y-2.5 font-mono text-[12px]">
                  <AnimatePresence>
                    {topic.scanLines.slice(0, scanReveal).map((line, i) => {
                      const isLast = i === scanReveal - 1;
                      const isActive = isLast && phase === "scanning";
                      return (
                        <motion.div
                          key={`${activeTopic}-scan-${i}`}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.22 }}
                          className="flex items-start gap-2.5"
                        >
                          {isActive ? (
                            <motion.span
                              className={cn("shrink-0 mt-0.5", c.text)}
                              animate={{ opacity: [0.4, 1, 0.4] }}
                              transition={{ repeat: Infinity, duration: 0.75 }}
                            >
                              ›
                            </motion.span>
                          ) : (
                            <span className="text-[#4ade80] shrink-0 mt-0.5">
                              ✓
                            </span>
                          )}
                          <span
                            className={
                              isActive ? "text-white/50" : "text-white/62"
                            }
                          >
                            {line.text}
                          </span>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>

                {/* Analysis done footer */}
                <AnimatePresence>
                  {(phase === "thinking" || phase === "responding") && (
                    <motion.div
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-4 pt-3 border-t border-white/[0.05] flex items-center gap-2"
                    >
                      <span className="text-[#4ade80] text-[12px]">✓</span>
                      <span className="font-mono text-[11.5px] text-white/32">
                        Analysis complete
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* AI response pane */}
              <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* AI header bar */}
                <div className="flex items-center gap-2.5 px-4 py-3 border-b border-white/[0.05] shrink-0">
                  <div className="h-7 w-7 rounded-lg bg-brand-500/[0.18] border border-brand-500/30 flex items-center justify-center shrink-0">
                    <Sparkles className="h-3.5 w-3.5 text-brand-300" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-semibold text-white/80">
                      DocSmith AI
                    </p>
                    <p className="text-[10.5px] text-white/32">
                      Deep AST analysis
                    </p>
                  </div>

                  {/* Thinking dots */}
                  <AnimatePresence>
                    {phase === "thinking" && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.85 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.85 }}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-brand-500/[0.08] border border-brand-500/20"
                      >
                        {[0, 1, 2].map((i) => (
                          <motion.div
                            key={i}
                            className="h-1.5 w-1.5 rounded-full bg-brand-400"
                            animate={{
                              opacity: [0.3, 1, 0.3],
                              y: [0, -3, 0],
                            }}
                            transition={{
                              repeat: Infinity,
                              duration: 0.85,
                              delay: i * 0.17,
                            }}
                          />
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Topic badge */}
                  <AnimatePresence mode="wait">
                    {phase !== "thinking" && phase !== "idle" && (
                      <motion.span
                        key={activeTopic}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className={cn(
                          "text-[10.5px] font-medium px-2.5 py-1 rounded-lg border font-mono",
                          c.text,
                          c.border,
                          c.bg
                        )}
                      >
                        {topic.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>

                {/* Question echo */}
                <AnimatePresence mode="wait">
                  {(phase === "thinking" || phase === "responding") && (
                    <motion.div
                      key={`question-${activeTopic}`}
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="px-4 pt-4 pb-0 shrink-0"
                    >
                      <div className="flex justify-end">
                        <div className="max-w-[80%] px-3.5 py-2.5 rounded-2xl rounded-tr-sm bg-white/[0.06] border border-white/[0.08]">
                          <p className="text-[12.5px] text-white/70">
                            {topic.question}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Response blocks */}
                <div
                  ref={responseRef}
                  className="flex-1 overflow-y-auto p-4 scroll-smooth"
                  style={{ minHeight: 220, maxHeight: 440 }}
                >
                  {/* Idle/scanning placeholder */}
                  {(phase === "idle" ||
                    phase === "typing" ||
                    phase === "scanning") && (
                    <div className="h-full flex items-center justify-center min-h-[200px]">
                      <p className="text-[12px] text-white/20 font-mono">
                        {phase === "idle"
                          ? "Select a question →"
                          : "Analyzing repository..."}
                      </p>
                    </div>
                  )}

                  {/* AI message bubble */}
                  <AnimatePresence>
                    {(phase === "thinking" || phase === "responding") && (
                      <motion.div
                        key={`response-${activeTopic}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.35 }}
                        className="space-y-4"
                      >
                        {/* AI avatar row */}
                        <div className="flex items-center gap-2 mb-1">
                          <div className="h-5 w-5 rounded bg-brand-500/20 border border-brand-500/25 flex items-center justify-center">
                            <Sparkles className="h-3 w-3 text-brand-300" />
                          </div>
                          <span className="text-[11px] text-white/35 font-medium">
                            DocSmith
                          </span>
                          {phase === "responding" && (
                            <span className="text-[10.5px] text-white/20">
                              · just now
                            </span>
                          )}
                        </div>

                        {/* Blocks */}
                        <div className="space-y-4 pl-1">
                          {topic.blocks.slice(0, blockReveal).map(
                            (block, i) => (
                              <motion.div
                                key={`${activeTopic}-block-${i}`}
                                initial={{ opacity: 0, y: 8, filter: "blur(2px)" }}
                                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                                transition={{
                                  duration: 0.38,
                                  ease: [0.25, 0.46, 0.45, 0.94],
                                }}
                              >
                                {block.node}
                              </motion.div>
                            )
                          )}

                          {/* Streaming cursor when blocks still loading */}
                          {phase === "responding" &&
                            blockReveal < topic.blocks.length && (
                              <motion.div
                                animate={{ opacity: [1, 0, 1] }}
                                transition={{ repeat: Infinity, duration: 0.9 }}
                                className="inline-block w-2 h-4 rounded-sm bg-brand-400/70 ml-0.5"
                              />
                            )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </Container>
    </section>
  );
}
