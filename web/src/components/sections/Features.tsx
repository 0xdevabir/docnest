"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  FileText,
  FolderOpen,
  Layers,
  Globe,
  GitGraph,
  ScanSearch,
  RefreshCw,
  type LucideIcon,
} from "lucide-react";
import { Container } from "@/components/shared/Container";
import { SectionLabel } from "@/components/shared/SectionLabel";
import { AnimatedGroup, AnimatedItem } from "@/components/shared/AnimatedText";
import { fadeInUp, viewport } from "@/styles/animations";
import { cn } from "@/lib/utils";

// ─── Color palette ────────────────────────────────────────────────────────────

type Accent =
  | "brand"
  | "violet"
  | "cyan"
  | "emerald"
  | "amber";

const palette: Record<
  Accent,
  {
    text: string;
    iconBg: string;
    badge: string;
    cardBorder: string;
    glow: string;
    cornerGlow: string;
    dot: string;
    tag: string;
  }
> = {
  brand: {
    text: "text-brand-400",
    iconBg:
      "bg-brand-500/10 border-brand-500/25 group-hover:bg-brand-500/18 group-hover:border-brand-500/40",
    badge: "text-brand-400 bg-brand-500/8 border-brand-500/20",
    cardBorder:
      "border-border hover:border-brand-500/40",
    glow: "rgba(99,102,241,0.22)",
    cornerGlow: "bg-brand-500/20",
    dot: "bg-brand-400",
    tag: "bg-brand-500/10 text-brand-300 border-brand-500/20",
  },
  violet: {
    text: "text-violet-400",
    iconBg:
      "bg-violet-500/10 border-violet-500/25 group-hover:bg-violet-500/18 group-hover:border-violet-500/40",
    badge: "text-violet-400 bg-violet-500/8 border-violet-500/20",
    cardBorder:
      "border-border hover:border-violet-500/40",
    glow: "rgba(139,92,246,0.22)",
    cornerGlow: "bg-violet-500/20",
    dot: "bg-violet-400",
    tag: "bg-violet-500/10 text-violet-300 border-violet-500/20",
  },
  cyan: {
    text: "text-cyan-400",
    iconBg:
      "bg-cyan-500/10 border-cyan-500/25 group-hover:bg-cyan-500/18 group-hover:border-cyan-500/40",
    badge: "text-cyan-400 bg-cyan-500/8 border-cyan-500/20",
    cardBorder:
      "border-border hover:border-cyan-500/40",
    glow: "rgba(34,211,238,0.2)",
    cornerGlow: "bg-cyan-500/20",
    dot: "bg-cyan-400",
    tag: "bg-cyan-500/10 text-cyan-300 border-cyan-500/20",
  },
  emerald: {
    text: "text-emerald-400",
    iconBg:
      "bg-emerald-500/10 border-emerald-500/25 group-hover:bg-emerald-500/18 group-hover:border-emerald-500/40",
    badge: "text-emerald-400 bg-emerald-500/8 border-emerald-500/20",
    cardBorder:
      "border-border hover:border-emerald-500/40",
    glow: "rgba(52,211,153,0.2)",
    cornerGlow: "bg-emerald-500/20",
    dot: "bg-emerald-400",
    tag: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
  },
  amber: {
    text: "text-amber-400",
    iconBg:
      "bg-amber-500/10 border-amber-500/25 group-hover:bg-amber-500/18 group-hover:border-amber-500/40",
    badge: "text-amber-400 bg-amber-500/8 border-amber-500/20",
    cardBorder:
      "border-border hover:border-amber-500/40",
    glow: "rgba(245,158,11,0.2)",
    cornerGlow: "bg-amber-500/20",
    dot: "bg-amber-400",
    tag: "bg-amber-500/10 text-amber-300 border-amber-500/20",
  },
};

// ─── Feature data ─────────────────────────────────────────────────────────────

interface Feature {
  id: string;
  icon: LucideIcon;
  title: string;
  description: string;
  badge: string;
  accent: Accent;
  iconAnimate: Record<string, number>;
  gridClass: string;
}

const features: Feature[] = [
  {
    id: "readme",
    icon: FileText,
    title: "Intelligent README generation",
    description:
      "Analyzes codebase structure, dependencies, and patterns to produce accurate, comprehensive READMEs — not templates filled with placeholders.",
    badge: "Core",
    accent: "brand",
    iconAnimate: { rotate: -8, scale: 1.12 },
    gridClass: "col-span-12 lg:col-span-7",
  },
  {
    id: "explain",
    icon: FolderOpen,
    title: "Repository explanation",
    description:
      "Maps every folder, module, and component to human-readable purpose descriptions. Turn any repo into a navigable knowledge base.",
    badge: "DX",
    accent: "violet",
    iconAnimate: { rotate: 8, scale: 1.12 },
    gridClass: "col-span-12 sm:col-span-6 lg:col-span-5",
  },
  {
    id: "arch",
    icon: Layers,
    title: "Architecture analysis",
    description:
      "Detects MVC, DDD, feature-based patterns and zone/layer boundaries. Explains your architecture in clear prose.",
    badge: "Smart",
    accent: "cyan",
    iconAnimate: { y: -5, scale: 1.12 },
    gridClass: "col-span-12 sm:col-span-6 lg:col-span-4",
  },
  {
    id: "api",
    icon: Globe,
    title: "API documentation",
    description:
      "Extracts routes, auth guards, and validation schemas from Next.js, Express, Hono, and Fastify automatically.",
    badge: "API",
    accent: "emerald",
    iconAnimate: { rotate: 360, scale: 1.1 },
    gridClass: "col-span-12 sm:col-span-6 lg:col-span-4",
  },
  {
    id: "diagram",
    icon: GitGraph,
    title: "Diagram generation",
    description:
      "PageRank-scored dependency graphs in Mermaid, D3, and DOT. Cycle detection and critical path highlighting included.",
    badge: "Visual",
    accent: "brand",
    iconAnimate: { scale: 1.18, rotate: 5 },
    gridClass: "col-span-12 sm:col-span-6 lg:col-span-4",
  },
  {
    id: "framework",
    icon: ScanSearch,
    title: "Framework detection",
    description:
      "Auto-identifies Next.js, Express, Prisma, auth providers, and test frameworks from your package.json and source patterns.",
    badge: "Auto",
    accent: "amber",
    iconAnimate: { x: 4, scale: 1.12 },
    gridClass: "col-span-12 sm:col-span-6 lg:col-span-5",
  },
  {
    id: "autoupdate",
    icon: RefreshCw,
    title: "Auto-updating docs",
    description:
      "Drop into any CI/CD pipeline. Your documentation stays in sync with your codebase on every push — zero manual effort.",
    badge: "CI/CD",
    accent: "cyan",
    iconAnimate: { rotate: 180, scale: 1.1 },
    gridClass: "col-span-12 lg:col-span-7",
  },
];

// ─── Detail components ────────────────────────────────────────────────────────

type PaletteEntry = (typeof palette)[Accent];

function ReadmeDetail({ c }: { c: PaletteEntry }) {
  return (
    <div className="mt-3 rounded-xl bg-black/35 border border-white/[0.07] overflow-hidden">
      {/* File tab */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/[0.06] bg-white/[0.02]">
        <div className={cn("h-1.5 w-1.5 rounded-full", c.dot)} />
        <span className="text-[11px] font-mono text-white/40">README.md</span>
        <span className="ml-auto text-[10px] text-white/20 font-mono">2.1KB</span>
      </div>
      <div className="p-3 font-mono text-[11.5px] space-y-1.5">
        <div className="text-white/70 font-bold">
          # MyApp
        </div>
        <div className="text-white/28 italic text-[11px]">
          &gt; Auto-generated by DocSmith ✦
        </div>
        <div className="flex flex-wrap gap-1.5 py-0.5">
          {(
            [
              ["Next.js", "brand"],
              ["TypeScript", "cyan"],
              ["Prisma", "emerald"],
              ["MIT", "amber"],
            ] as [string, Accent][]
          ).map(([label, accent]) => (
            <span
              key={label}
              className={cn(
                "px-1.5 py-px text-[10px] rounded border font-medium",
                palette[accent].tag
              )}
            >
              {label}
            </span>
          ))}
        </div>
        <div className="text-white/25 text-[11px] leading-relaxed">
          ## Overview · ## Quick Start · ## API Reference · ## Contributing
        </div>
      </div>
    </div>
  );
}

function AutoUpdateDetail() {
  const steps = [
    { label: "git push", color: "text-white/45 border-white/10 bg-white/[0.04]", pulse: false },
    { label: "→", color: "text-white/20", plain: true },
    { label: "● CI", color: "text-amber-400 border-amber-500/25 bg-amber-500/8", pulse: true },
    { label: "→", color: "text-white/20", plain: true },
    { label: "✓ Docs synced", color: "text-emerald-400 border-emerald-500/25 bg-emerald-500/8", pulse: false },
    { label: "→", color: "text-white/20", plain: true },
    { label: "PR opened", color: "text-brand-400 border-brand-500/25 bg-brand-500/8", pulse: false },
  ];
  return (
    <div className="mt-3 flex items-center flex-wrap gap-1.5">
      {steps.map((s, i) =>
        "plain" in s ? (
          <span key={i} className={cn("text-[11px] font-mono", s.color)}>
            {s.label}
          </span>
        ) : (
          <div
            key={i}
            className={cn(
              "flex items-center gap-1 px-2 py-1 rounded-lg border text-[11px] font-mono",
              s.color
            )}
          >
            {s.pulse && (
              <motion.span
                className="h-1 w-1 rounded-full bg-amber-400 inline-block"
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ repeat: Infinity, duration: 1.2 }}
              />
            )}
            {s.label}
          </div>
        )
      )}
    </div>
  );
}

function TagsDetail({
  tags,
  accent,
}: {
  tags: string[];
  accent: Accent;
}) {
  const c = palette[accent];
  return (
    <div className="mt-3 flex flex-wrap gap-1.5">
      {tags.map((tag) => (
        <span
          key={tag}
          className={cn(
            "px-2 py-0.5 rounded-lg border text-[11px] font-mono font-medium",
            c.tag
          )}
        >
          {tag}
        </span>
      ))}
    </div>
  );
}

function ApiDetail() {
  const methods = [
    { method: "GET", count: "12", color: "text-emerald-400" },
    { method: "POST", count: "8", color: "text-brand-400" },
    { method: "PUT", count: "6", color: "text-amber-400" },
    { method: "DELETE", count: "4", color: "text-red-400" },
  ];
  return (
    <div className="mt-3 flex gap-2">
      {methods.map(({ method, count, color }) => (
        <div
          key={method}
          className="flex-1 rounded-lg bg-white/[0.04] border border-white/[0.07] py-2 text-center"
        >
          <div className={cn("text-[11px] font-bold font-mono", color)}>
            {method}
          </div>
          <div className="text-[13px] font-bold text-white/70 tabular-nums">
            {count}
          </div>
        </div>
      ))}
    </div>
  );
}

function ArchDetail() {
  const layers = [
    { label: "Presentation", color: "brand" as Accent },
    { label: "Domain", color: "violet" as Accent },
    { label: "Infrastructure", color: "cyan" as Accent },
  ];
  return (
    <div className="mt-3 space-y-1.5">
      {layers.map(({ label, color }, i) => (
        <motion.div
          key={label}
          initial={{ opacity: 0, x: -8 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 + i * 0.08, duration: 0.3 }}
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[11.5px] font-mono",
            palette[color].tag
          )}
          style={{ marginLeft: i * 10 }}
        >
          <span className={cn("h-1 w-1 rounded-full", palette[color].dot)} />
          {label} Layer
        </motion.div>
      ))}
    </div>
  );
}

// ─── Animated icon ────────────────────────────────────────────────────────────

function FeatureIcon({
  icon: Icon,
  accent,
  animate,
  hovered,
}: {
  icon: LucideIcon;
  accent: Accent;
  animate: Record<string, number>;
  hovered: boolean;
}) {
  const c = palette[accent];
  return (
    <div
      className={cn(
        "relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition-all duration-300",
        c.iconBg
      )}
    >
      {/* Pulse ring on hover */}
      <motion.div
        className={cn("absolute inset-0 rounded-xl")}
        animate={
          hovered
            ? {
                boxShadow: `0 0 0 4px ${c.glow}`,
                opacity: 1,
              }
            : { boxShadow: "0 0 0 0px transparent", opacity: 0 }
        }
        transition={{ duration: 0.25 }}
      />
      <motion.div
        animate={hovered ? animate : { rotate: 0, scale: 1, x: 0, y: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 18 }}
        className={cn("flex items-center justify-center", c.text)}
      >
        <Icon className="h-5 w-5" />
      </motion.div>
    </div>
  );
}

// ─── Feature card ─────────────────────────────────────────────────────────────

function FeatureCard({
  feature,
  index,
  children,
}: {
  feature: Feature;
  index: number;
  children?: React.ReactNode;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [glowStyle, setGlowStyle] = useState<React.CSSProperties>({});
  const [hovered, setHovered] = useState(false);
  const c = palette[feature.accent];

  function onMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setGlowStyle({
      background: `radial-gradient(340px at ${x}px ${y}px, ${c.glow}, transparent 70%)`,
    });
  }

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.45, delay: index * 0.06, ease: [0.25, 0.46, 0.45, 0.94] }}
      onMouseMove={onMouseMove}
      onMouseLeave={() => {
        setGlowStyle({});
        setHovered(false);
      }}
      onMouseEnter={() => setHovered(true)}
      className={cn(
        "group relative overflow-hidden rounded-2xl bg-surface border transition-all duration-300",
        c.cardBorder,
        feature.gridClass
      )}
      whileHover={{ y: -3 }}
    >
      {/* Mouse-follow glow */}
      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-0 group-hover:opacity-100 transition-opacity duration-400 rounded-2xl"
        style={glowStyle}
      />

      {/* Corner accent glow */}
      <div
        className={cn(
          "pointer-events-none absolute -top-10 -right-10 w-32 h-32 rounded-full blur-[60px] opacity-0 group-hover:opacity-60 transition-opacity duration-500",
          c.cornerGlow
        )}
      />

      {/* Subtle top edge line */}
      <div
        className={cn(
          "absolute top-0 left-6 right-6 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-500",
          `bg-gradient-to-r from-transparent via-${feature.accent}-500/40 to-transparent`
        )}
      />

      <div className="relative z-10 p-6 flex flex-col h-full">
        {/* Header row */}
        <div className="flex items-start justify-between mb-4">
          <FeatureIcon
            icon={feature.icon}
            accent={feature.accent}
            animate={feature.iconAnimate}
            hovered={hovered}
          />
          <span
            className={cn(
              "text-[11px] font-semibold tracking-wide px-2.5 py-1 rounded-full border",
              c.badge
            )}
          >
            {feature.badge}
          </span>
        </div>

        {/* Text */}
        <div className="flex-1 space-y-2">
          <h3 className="font-semibold text-[15px] text-foreground leading-snug">
            {feature.title}
          </h3>
          <p className="text-[13.5px] text-muted-foreground leading-relaxed">
            {feature.description}
          </p>
        </div>

        {/* Bottom detail */}
        {children}
      </div>
    </motion.div>
  );
}

// ─── Main section ─────────────────────────────────────────────────────────────

export function Features() {
  const [readme, explain, arch, api, diagram, framework, autoupdate] = features;

  return (
    <section id="features" className="relative py-28 overflow-hidden">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-brand-500/4 blur-[150px] rounded-full" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[400px] bg-violet-500/4 blur-[120px] rounded-full" />
        <div className="absolute inset-0 grid-bg opacity-[0.14]" />
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
              DocSmith understands your codebase the way a senior engineer would
              — then writes better docs than most engineers ever will.
            </p>
          </AnimatedItem>
        </AnimatedGroup>

        {/* Bento grid */}
        <div className="grid grid-cols-12 gap-4">
          {/* Row 1: README (featured) + Repo Explain */}
          <FeatureCard feature={readme} index={0}>
            <ReadmeDetail c={palette[readme.accent]} />
          </FeatureCard>

          <FeatureCard feature={explain} index={1}>
            <TagsDetail
              tags={["folder map", "module purposes", "onboarding guide"]}
              accent={explain.accent}
            />
          </FeatureCard>

          {/* Row 2: Architecture + API Docs + Diagrams */}
          <FeatureCard feature={arch} index={2}>
            <ArchDetail />
          </FeatureCard>

          <FeatureCard feature={api} index={3}>
            <ApiDetail />
          </FeatureCard>

          <FeatureCard feature={diagram} index={4}>
            <TagsDetail
              tags={["Mermaid", "D3 JSON", "DOT", "SVG"]}
              accent={diagram.accent}
            />
          </FeatureCard>

          {/* Row 3: Framework + Auto-update (featured) */}
          <FeatureCard feature={framework} index={5}>
            <TagsDetail
              tags={["Next.js", "Express", "Prisma", "Hono", "Fastify"]}
              accent={framework.accent}
            />
          </FeatureCard>

          <FeatureCard feature={autoupdate} index={6}>
            <AutoUpdateDetail />
          </FeatureCard>
        </div>

        {/* Stats strip */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewport}
          variants={fadeInUp}
          transition={{ delay: 0.15 }}
          className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-px border border-border rounded-2xl overflow-hidden bg-border"
        >
          {[
            { value: "847+", label: "Files analyzed per run" },
            { value: "3.2s", label: "Avg. generation time" },
            { value: "18", label: "Languages supported" },
            { value: "6", label: "Output doc formats" },
          ].map((stat) => (
            <div key={stat.label} className="bg-surface px-6 py-5 text-center">
              <div className="text-3xl font-bold text-gradient-brand tabular-nums">
                {stat.value}
              </div>
              <div className="text-[13px] text-muted-foreground mt-1">
                {stat.label}
              </div>
            </div>
          ))}
        </motion.div>
      </Container>
    </section>
  );
}
