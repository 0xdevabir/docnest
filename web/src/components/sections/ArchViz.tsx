"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { GitGraph, Layers, Route, FolderOpen } from "lucide-react";
import { Container } from "@/components/shared/Container";
import { SectionLabel } from "@/components/shared/SectionLabel";
import { AnimatedGroup, AnimatedItem } from "@/components/shared/AnimatedText";
import { viewport } from "@/styles/animations";
import { cn } from "@/lib/utils";

// ─── Graph data ───────────────────────────────────────────────────────────────

interface GNode {
  id: string;
  label: string;
  x: number;
  y: number;
  r: number;
  tier: 0 | 1 | 2 | 3;
}

const GNODES: GNode[] = [
  { id: "auth",       label: "auth",       x: 255, y: 55,  r: 22, tier: 0 },
  { id: "db",         label: "db",         x: 458, y: 215, r: 22, tier: 0 },
  { id: "router",     label: "router",     x: 183, y: 162, r: 19, tier: 1 },
  { id: "middleware", label: "middleware", x: 68,  y: 105, r: 17, tier: 1 },
  { id: "api",        label: "api",        x: 248, y: 278, r: 15, tier: 2 },
  { id: "user",       label: "user",       x: 392, y: 105, r: 15, tier: 2 },
  { id: "config",     label: "config",     x: 44,  y: 240, r: 12, tier: 3 },
  { id: "post",       label: "post",       x: 136, y: 315, r: 12, tier: 3 },
  { id: "logger",     label: "logger",     x: 528, y: 298, r: 12, tier: 3 },
];

const NMAP = Object.fromEntries(GNODES.map((n) => [n.id, n]));

function bezierPts(
  n1: GNode,
  n2: GNode,
  off: number
): { d: string; pts: { x: number; y: number }[] } {
  const dx = n2.x - n1.x, dy = n2.y - n1.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const ux = dx / dist, uy = dy / dist;
  const x1 = n1.x + ux * (n1.r + 3), y1 = n1.y + uy * (n1.r + 3);
  const x2 = n2.x - ux * (n2.r + 3), y2 = n2.y - uy * (n2.r + 3);
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
  const qx = mx - uy * off, qy = my + ux * off;
  const pts = [0, 0.18, 0.36, 0.54, 0.72, 0.9, 1].map((t) => {
    const mt = 1 - t;
    return {
      x: +(mt * mt * x1 + 2 * mt * t * qx + t * t * x2).toFixed(1),
      y: +(mt * mt * y1 + 2 * mt * t * qy + t * t * y2).toFixed(1),
    };
  });
  return {
    d: `M${x1.toFixed(1)},${y1.toFixed(1)} Q${qx.toFixed(1)},${qy.toFixed(1)} ${x2.toFixed(1)},${y2.toFixed(1)}`,
    pts,
  };
}

const EDGES = [
  { from: "middleware", to: "router",     w: 2, off: 20  },
  { from: "middleware", to: "auth",       w: 2, off: 16  },
  { from: "router",     to: "auth",       w: 2, off: -18 },
  { from: "router",     to: "api",        w: 1, off: 16  },
  { from: "router",     to: "user",       w: 1, off: -14 },
  { from: "auth",       to: "db",         w: 2, off: 18  },
  { from: "api",        to: "db",         w: 2, off: 16  },
  { from: "user",       to: "db",         w: 1, off: 16  },
  { from: "user",       to: "auth",       w: 1, off: 38  },
  { from: "config",     to: "middleware", w: 1, off: 14  },
  { from: "post",       to: "api",        w: 1, off: 14  },
  { from: "logger",     to: "router",     w: 1, off: -26 },
].map((e, i) => ({
  ...e,
  id: `e${i}`,
  ...bezierPts(NMAP[e.from], NMAP[e.to], e.off),
}));

const TIER_STYLE = {
  0: { fill: "rgba(99,102,241,0.16)",  stroke: "#818cf8", pulse: "rgba(99,102,241,0.45)", lbl: "#a5b4fc" },
  1: { fill: "rgba(34,211,238,0.11)",  stroke: "#22d3ee", pulse: "rgba(34,211,238,0.35)", lbl: "#67e8f9" },
  2: { fill: "rgba(139,92,246,0.10)",  stroke: "#a78bfa", pulse: "none",                  lbl: "#c4b5fd" },
  3: { fill: "rgba(255,255,255,0.04)", stroke: "rgba(255,255,255,0.18)", pulse: "none",   lbl: "rgba(255,255,255,0.3)" },
} as const;

// ─── Dep graph ────────────────────────────────────────────────────────────────

function DepGraph() {
  return (
    <svg viewBox="0 0 580 340" className="w-full h-full" style={{ overflow: "visible" }}>
      <defs>
        <filter id="glow0" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="glow1" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <radialGradient id="bg-grad" cx="45%" cy="45%" r="55%">
          <stop offset="0%" stopColor="rgba(99,102,241,0.07)" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
      </defs>

      {/* Ambient bg */}
      <rect x="0" y="0" width="580" height="340" fill="url(#bg-grad)" />

      {/* Edge lines */}
      {EDGES.map((e) => (
        <motion.path
          key={e.id}
          d={e.d}
          fill="none"
          stroke={e.w === 2 ? "rgba(99,102,241,0.22)" : "rgba(255,255,255,0.07)"}
          strokeWidth={e.w === 2 ? 1.5 : 1}
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.9, delay: 0.3 + EDGES.indexOf(e) * 0.06, ease: "easeOut" }}
        />
      ))}

      {/* Particles flowing along edges */}
      {EDGES.map((e, i) => {
        const xs = e.pts.map((p) => p.x);
        const ys = e.pts.map((p) => p.y);
        const color = e.w === 2 ? "#818cf8" : "rgba(255,255,255,0.35)";
        const dur = e.w === 2 ? 2.2 : 3.2;
        return (
          <g key={`p-${i}`}>
            <motion.circle
              r={e.w === 2 ? 2.8 : 1.8}
              fill={color}
              animate={{ cx: xs, cy: ys, opacity: [0, 0.9, 0.9, 0] }}
              transition={{ duration: dur, delay: i * 0.22, repeat: Infinity, ease: "linear", repeatDelay: 0.5 }}
            />
            {e.w === 2 && (
              <motion.circle
                r={2}
                fill={color}
                animate={{ cx: xs, cy: ys, opacity: [0, 0.6, 0.6, 0] }}
                transition={{ duration: dur, delay: i * 0.22 + dur / 2, repeat: Infinity, ease: "linear", repeatDelay: 0.5 }}
              />
            )}
          </g>
        );
      })}

      {/* Nodes */}
      {GNODES.map((n, i) => {
        const s = TIER_STYLE[n.tier];
        const hasGlow = n.tier <= 1;
        return (
          <motion.g
            key={n.id}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.15 + i * 0.07, type: "spring", stiffness: 260, damping: 20 }}
            style={{ transformOrigin: `${n.x}px ${n.y}px` }}
          >
            {/* Pulse ring */}
            {hasGlow && (
              <motion.circle
                cx={n.x} cy={n.y} r={n.r + 5}
                fill="none"
                stroke={s.stroke}
                strokeWidth={0.8}
                animate={{ r: [n.r + 4, n.r + 13], opacity: [0.5, 0] }}
                transition={{ duration: 2, delay: i * 0.35, repeat: Infinity, ease: "easeOut" }}
              />
            )}
            {/* Node fill */}
            <circle
              cx={n.x} cy={n.y} r={n.r}
              fill={s.fill}
              stroke={s.stroke}
              strokeWidth={1.2}
              filter={hasGlow ? `url(#glow${n.tier})` : undefined}
            />
            {/* Label */}
            <text
              x={n.x} y={n.y + n.r + 13}
              textAnchor="middle"
              fontSize={n.tier <= 1 ? 11 : 10}
              fill={s.lbl}
              fontFamily="ui-monospace, monospace"
              fontWeight={n.tier <= 1 ? "600" : "400"}
            >
              {n.label}
            </text>
          </motion.g>
        );
      })}

      {/* Scanning line */}
      <motion.line
        x1={0} x2={580} y1={0} y2={0}
        stroke="rgba(99,102,241,0.18)"
        strokeWidth={1}
        animate={{ y1: [-10, 350], y2: [-10, 350] }}
        transition={{ duration: 4, repeat: Infinity, repeatDelay: 5, ease: "linear" }}
      />

      {/* HUD labels */}
      <text x={10} y={18} fontSize={9} fill="rgba(99,102,241,0.5)" fontFamily="monospace">● ANALYZING</text>
      <text x={490} y={18} fontSize={9} fill="rgba(34,211,238,0.45)" fontFamily="monospace">LIVE ●</text>
    </svg>
  );
}

// ─── Architecture layers ──────────────────────────────────────────────────────

const LAYERS = [
  {
    label: "PRESENTATION",
    y: 14, h: 88,
    fill: "rgba(99,102,241,0.06)",
    stroke: "rgba(99,102,241,0.22)",
    lbl: "#818cf8",
    boxes: [
      { label: "Pages",      x: 38 },
      { label: "Layout",     x: 160 },
      { label: "Components", x: 282 },
      { label: "API Routes", x: 404 },
    ],
    boxColor: { fill: "rgba(99,102,241,0.10)", stroke: "rgba(99,102,241,0.28)", text: "#a5b4fc" },
  },
  {
    label: "DOMAIN",
    y: 128, h: 88,
    fill: "rgba(139,92,246,0.06)",
    stroke: "rgba(139,92,246,0.22)",
    lbl: "#a78bfa",
    boxes: [
      { label: "Services",   x: 75  },
      { label: "Models",     x: 235 },
      { label: "Validators", x: 395 },
    ],
    boxColor: { fill: "rgba(139,92,246,0.10)", stroke: "rgba(139,92,246,0.28)", text: "#c4b5fd" },
  },
  {
    label: "INFRASTRUCTURE",
    y: 242, h: 88,
    fill: "rgba(34,211,238,0.05)",
    stroke: "rgba(34,211,238,0.20)",
    lbl: "#22d3ee",
    boxes: [
      { label: "Database",   x: 75  },
      { label: "Auth",       x: 235 },
      { label: "External",   x: 395 },
    ],
    boxColor: { fill: "rgba(34,211,238,0.08)", stroke: "rgba(34,211,238,0.25)", text: "#67e8f9" },
  },
];

function ArchLayers() {
  const arrowY1 = [102, 216];
  const arrowY2 = [128, 242];

  return (
    <svg viewBox="0 0 580 340" className="w-full h-full">
      <defs>
        <marker id="arr" viewBox="0 0 8 8" refX="4" refY="4" markerWidth="5" markerHeight="5" orient="auto">
          <path d="M0,0 L8,4 L0,8 z" fill="rgba(255,255,255,0.25)" />
        </marker>
      </defs>

      {LAYERS.map((layer, li) => (
        <motion.g
          key={layer.label}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: li * 0.18, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          {/* Layer band */}
          <rect
            x={12} y={layer.y} width={556} height={layer.h} rx={8}
            fill={layer.fill}
            stroke={layer.stroke}
            strokeWidth={1}
          />
          {/* Layer label */}
          <text
            x={22} y={layer.y + 20}
            fontSize={9} fill={layer.lbl}
            fontFamily="ui-monospace, monospace"
            fontWeight="700"
            letterSpacing="2"
          >
            {layer.label}
          </text>

          {/* Component boxes */}
          {layer.boxes.map((box, bi) => (
            <motion.g
              key={box.label}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.35, delay: li * 0.18 + 0.2 + bi * 0.08 }}
              style={{ transformOrigin: `${box.x + 55}px ${layer.y + 53}px` }}
            >
              <rect
                x={box.x} y={layer.y + 33}
                width={110} height={40} rx={6}
                fill={layer.boxColor.fill}
                stroke={layer.boxColor.stroke}
                strokeWidth={1}
              />
              <text
                x={box.x + 55} y={layer.y + 59}
                textAnchor="middle"
                fontSize={11} fill={layer.boxColor.text}
                fontFamily="ui-monospace, monospace"
                fontWeight="500"
              >
                {box.label}
              </text>
            </motion.g>
          ))}
        </motion.g>
      ))}

      {/* Inter-layer arrows */}
      {arrowY1.map((y1, i) => (
        <motion.g key={`arr-${i}`}>
          <motion.line
            x1={290} y1={y1} x2={290} y2={arrowY2[i] ?? y1}
            stroke="rgba(255,255,255,0.22)"
            strokeWidth={1.5}
            strokeDasharray="3 2"
            markerEnd="url(#arr)"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.4, delay: 0.45 + i * 0.18 }}
          />
          {/* Flowing particle on arrow */}
          <motion.circle
            r={3} fill="rgba(255,255,255,0.5)"
            animate={{ cy: [y1, arrowY2[i] ?? y1] }}
            transition={{ duration: 0.8, delay: 0.7 + i * 0.18, repeat: Infinity, repeatDelay: 2.5, ease: "easeInOut" }}
            cx={290}
          />
        </motion.g>
      ))}

      {/* Scan line */}
      <motion.line
        x1={12} x2={568} y1={0} y2={0}
        stroke="rgba(139,92,246,0.15)"
        strokeWidth={1}
        animate={{ y1: [0, 340], y2: [0, 340] }}
        transition={{ duration: 5, repeat: Infinity, repeatDelay: 4, ease: "linear" }}
      />

      <text x={10} y={340} fontSize={9} fill="rgba(99,102,241,0.4)" fontFamily="monospace">
        ● 3 layers  ·  10 components  ·  feature-based
      </text>
    </svg>
  );
}

// ─── API flow ─────────────────────────────────────────────────────────────────

const FLOW_NODES = [
  { label: "Client",     x: 45,  color: "rgba(255,255,255,0.15)", stroke: "rgba(255,255,255,0.3)",  text: "rgba(255,255,255,0.65)" },
  { label: "Rate Limit", x: 148, color: "rgba(245,158,11,0.12)",  stroke: "rgba(245,158,11,0.4)",   text: "#fbbf24" },
  { label: "Auth Guard", x: 258, color: "rgba(99,102,241,0.12)",  stroke: "rgba(99,102,241,0.45)",  text: "#818cf8" },
  { label: "Handler",    x: 368, color: "rgba(139,92,246,0.12)",  stroke: "rgba(139,92,246,0.45)",  text: "#a78bfa" },
  { label: "Database",   x: 468, color: "rgba(34,211,238,0.10)",  stroke: "rgba(34,211,238,0.40)",  text: "#22d3ee" },
  { label: "Response",   x: 548, color: "rgba(52,211,153,0.12)",  stroke: "rgba(52,211,153,0.45)",  text: "#34d399" },
];

const PACKET_CX = [45, 45, 148, 148, 258, 258, 368, 368, 468, 468, 548, 548];
const PACKET_T  = [0, 0.04, 0.18, 0.22, 0.38, 0.42, 0.58, 0.62, 0.76, 0.80, 0.93, 1];
const PACKET_FILL = [
  "#f8fafc","#f8fafc",
  "#fbbf24","#fbbf24",
  "#818cf8","#818cf8",
  "#a78bfa","#a78bfa",
  "#22d3ee","#22d3ee",
  "#34d399","#34d399",
];

function ApiFlow() {
  return (
    <svg viewBox="0 0 600 200" className="w-full h-full">
      <defs>
        <filter id="nf" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="3" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Backbone line */}
      <motion.line
        x1={9} y1={90} x2={591} y2={90}
        stroke="rgba(255,255,255,0.08)"
        strokeWidth={1}
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
      />

      {/* Segment lines (between nodes) */}
      {FLOW_NODES.slice(0, -1).map((n, i) => {
        const next = FLOW_NODES[i + 1];
        if (!next) return null;
        const x1 = n.x + 44;
        const x2 = next.x - 44;
        return (
          <motion.line
            key={i}
            x1={x1} y1={90} x2={x2} y2={90}
            stroke="rgba(255,255,255,0.12)"
            strokeWidth={1.5}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.4, delay: 0.2 + i * 0.12, ease: "easeOut" }}
          />
        );
      })}

      {/* Nodes */}
      {FLOW_NODES.map((n, i) => (
        <motion.g
          key={n.label}
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35, delay: 0.15 + i * 0.1, type: "spring", stiffness: 300, damping: 22 }}
          style={{ transformOrigin: `${n.x}px 90px` }}
        >
          <rect x={n.x - 44} y={72} width={88} height={36} rx={8}
            fill={n.color} stroke={n.stroke} strokeWidth={1}
          />
          <text x={n.x} y={95} textAnchor="middle"
            fontSize={10.5} fill={n.text}
            fontFamily="ui-monospace, monospace" fontWeight="600"
          >
            {n.label}
          </text>
          {/* Step number */}
          <text x={n.x - 38} y={80} fontSize={8} fill={n.text} fontFamily="monospace" opacity={0.5}>
            {String(i + 1).padStart(2, "0")}
          </text>
        </motion.g>
      ))}

      {/* Animated packet */}
      <motion.circle
        r={6}
        cy={90}
        filter="url(#nf)"
        animate={{ cx: PACKET_CX, fill: PACKET_FILL }}
        transition={{ duration: 3.5, times: PACKET_T, repeat: Infinity, repeatDelay: 1, ease: "easeInOut" }}
      />

      {/* Labels */}
      <text x={10} y={148} fontSize={9.5} fill="rgba(255,255,255,0.3)" fontFamily="monospace">
        Request lifecycle  ·  Next.js App Router
      </text>
      <text x={10} y={162} fontSize={9} fill="rgba(34,211,238,0.4)" fontFamily="monospace">
        ✓ Auth guard  ·  ✓ Rate limiting  ·  ✓ Prisma ORM
      </text>

      {/* Scan */}
      <motion.line
        x1={0} x2={600} y1={0} y2={0}
        stroke="rgba(52,211,153,0.12)" strokeWidth={1}
        animate={{ y1: [0, 200], y2: [0, 200] }}
        transition={{ duration: 3, repeat: Infinity, repeatDelay: 5, ease: "linear" }}
      />
    </svg>
  );
}

// ─── Repo map (horizontal tree) ───────────────────────────────────────────────

interface TreeNode {
  label: string;
  x: number;
  y: number;
  type: "root" | "folder" | "tsx" | "ts" | "config";
  parentX?: number;
  parentY?: number;
  delay: number;
}

const TREE: TreeNode[] = [
  { label: "src/",        x: 40,  y: 155, type: "root",   delay: 0    },
  // L1
  { label: "app/",        x: 130, y: 55,  type: "folder", parentX: 40,  parentY: 155, delay: 0.12 },
  { label: "components/", x: 130, y: 135, type: "folder", parentX: 40,  parentY: 155, delay: 0.18 },
  { label: "lib/",        x: 130, y: 215, type: "folder", parentX: 40,  parentY: 155, delay: 0.24 },
  { label: "server/",     x: 130, y: 290, type: "folder", parentX: 40,  parentY: 155, delay: 0.30 },
  // L2 — app
  { label: "page.tsx",    x: 240, y: 30,  type: "tsx",    parentX: 130, parentY: 55,  delay: 0.42 },
  { label: "layout.tsx",  x: 240, y: 58,  type: "tsx",    parentX: 130, parentY: 55,  delay: 0.48 },
  { label: "api/",        x: 240, y: 86,  type: "folder", parentX: 130, parentY: 55,  delay: 0.54 },
  // L2 — components
  { label: "ui/",         x: 240, y: 120, type: "folder", parentX: 130, parentY: 135, delay: 0.60 },
  { label: "shared/",     x: 240, y: 148, type: "folder", parentX: 130, parentY: 135, delay: 0.66 },
  // L2 — lib
  { label: "auth.ts",     x: 240, y: 200, type: "ts",     parentX: 130, parentY: 215, delay: 0.72 },
  { label: "db.ts",       x: 240, y: 228, type: "ts",     parentX: 130, parentY: 215, delay: 0.78 },
  // L2 — server
  { label: "actions/",    x: 240, y: 275, type: "folder", parentX: 130, parentY: 290, delay: 0.84 },
  { label: "queries/",    x: 240, y: 303, type: "ts",     parentX: 130, parentY: 290, delay: 0.90 },
  // L3 — api children
  { label: "users/",      x: 350, y: 72,  type: "folder", parentX: 240, parentY: 86,  delay: 1.0  },
  { label: "posts/",      x: 350, y: 100, type: "folder", parentX: 240, parentY: 86,  delay: 1.06 },
];

const TYPE_COLOR = {
  root:   { dot: "#818cf8", label: "#a5b4fc", r: 7  },
  folder: { dot: "#fbbf24", label: "#fde68a", r: 5  },
  tsx:    { dot: "#818cf8", label: "#c4b5fd", r: 4  },
  ts:     { dot: "#22d3ee", label: "#67e8f9", r: 4  },
  config: { dot: "#34d399", label: "#6ee7b7", r: 4  },
};

function RepoMap() {
  return (
    <svg viewBox="0 0 500 330" className="w-full h-full">
      {/* Connection curves */}
      {TREE.filter((n) => n.parentX !== undefined).map((n, i) => {
        const d = `M${n.parentX},${n.parentY} C${n.parentX! + 50},${n.parentY} ${n.x - 50},${n.y} ${n.x},${n.y}`;
        return (
          <motion.path
            key={`line-${i}`}
            d={d}
            fill="none"
            stroke={n.type === "tsx" ? "rgba(99,102,241,0.25)" : n.type === "ts" ? "rgba(34,211,238,0.22)" : "rgba(255,255,255,0.1)"}
            strokeWidth={1}
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 0.45, delay: n.delay, ease: "easeOut" }}
          />
        );
      })}

      {/* Nodes */}
      {TREE.map((n, i) => {
        const c = TYPE_COLOR[n.type];
        return (
          <motion.g
            key={`node-${i}`}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.28, delay: n.delay + 0.3, type: "spring", stiffness: 400, damping: 24 }}
            style={{ transformOrigin: `${n.x}px ${n.y}px` }}
          >
            {/* Glow for root */}
            {n.type === "root" && (
              <motion.circle
                cx={n.x} cy={n.y} r={14}
                fill="none" stroke="rgba(99,102,241,0.3)" strokeWidth={1}
                animate={{ r: [12, 20], opacity: [0.5, 0] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: "easeOut" }}
              />
            )}
            <circle cx={n.x} cy={n.y} r={c.r} fill={c.dot} opacity={0.9} />
            <text
              x={n.x + c.r + 5} y={n.y + 4}
              fontSize={n.type === "root" ? 12 : 10}
              fill={c.label}
              fontFamily="ui-monospace, monospace"
              fontWeight={n.type === "root" || n.type === "folder" ? "600" : "400"}
            >
              {n.label}
            </text>
          </motion.g>
        );
      })}

      {/* HUD */}
      <text x={10} y={325} fontSize={9} fill="rgba(255,255,255,0.25)" fontFamily="monospace">
        ● 14 nodes  ·  4 layers  ·  Next.js App Router
      </text>

      <motion.line
        x1={0} x2={500} y1={0} y2={0}
        stroke="rgba(34,211,238,0.12)" strokeWidth={1}
        animate={{ y1: [0, 330], y2: [0, 330] }}
        transition={{ duration: 4, repeat: Infinity, repeatDelay: 4, ease: "linear" }}
      />
    </svg>
  );
}

// ─── Insights ─────────────────────────────────────────────────────────────────

const INSIGHTS = [
  { label: "Feature-based architecture",  color: "brand",   delay: 0.4 },
  { label: "Next.js App Router",          color: "cyan",    delay: 0.65 },
  { label: "JWT + NextAuth.js",           color: "violet",  delay: 0.9 },
  { label: "Prisma ORM  ·  12 models",   color: "emerald", delay: 1.15 },
  { label: "32 API endpoints",            color: "brand",   delay: 1.4 },
  { label: "0 circular dependencies",     color: "green",   delay: 1.65 },
] as const;

const INSIGHT_COLORS: Record<string, string> = {
  brand:   "text-brand-400 border-brand-500/25 bg-brand-500/8",
  cyan:    "text-cyan-400 border-cyan-500/25 bg-cyan-500/8",
  violet:  "text-violet-400 border-violet-500/25 bg-violet-500/8",
  emerald: "text-emerald-400 border-emerald-500/25 bg-emerald-500/8",
  green:   "text-[#4ade80] border-[#4ade80]/25 bg-[#4ade80]/8",
};

// ─── Tabs ─────────────────────────────────────────────────────────────────────

const TABS = [
  { id: "graph", label: "Dependency Graph",    icon: GitGraph, component: DepGraph    },
  { id: "arch",  label: "Architecture Layers", icon: Layers,   component: ArchLayers  },
  { id: "flow",  label: "API Flow",            icon: Route,    component: ApiFlow     },
  { id: "repo",  label: "Repo Map",            icon: FolderOpen, component: RepoMap  },
] as const;

// ─── Main ─────────────────────────────────────────────────────────────────────

export function ArchViz() {
  const [active, setActive] = useState<string>("graph");
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.2 });

  const ActiveViz = TABS.find((t) => t.id === active)?.component ?? DepGraph;

  return (
    <section ref={sectionRef} id="visualization" className="relative py-28 overflow-hidden">
      {/* Ambient */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-brand-500/4 blur-[160px] rounded-full" />
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-cyan-500/4 blur-[120px] rounded-full" />
        <div className="absolute inset-0 grid-bg opacity-[0.15]" />
      </div>

      <Container>
        {/* Header */}
        <AnimatedGroup className="text-center mb-16 space-y-4">
          <AnimatedItem>
            <SectionLabel label="Visualization" />
          </AnimatedItem>
          <AnimatedItem>
            <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-balance">
              Your codebase,{" "}
              <span className="text-gradient-brand">fully mapped</span>
            </h2>
          </AnimatedItem>
          <AnimatedItem>
            <p className="mx-auto max-w-xl text-lg text-muted-foreground text-balance">
              DocSmith generates live dependency graphs, architecture diagrams,
              and API flow maps — a complete visual model of any repository.
            </p>
          </AnimatedItem>
        </AnimatedGroup>

        {/* Two-column layout */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewport}
          transition={{ duration: 0.55 }}
          className="grid lg:grid-cols-[1fr_300px] gap-5 items-start"
        >
          {/* ── Visualization panel ── */}
          <div className="rounded-2xl bg-[#06060e] border border-white/[0.07] overflow-hidden shadow-2xl shadow-black/50">
            {/* Panel header */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.06] bg-white/[0.02]">
              <div className="flex gap-1.5">
                <div className="h-3 w-3 rounded-full bg-[#ff5f57]" />
                <div className="h-3 w-3 rounded-full bg-[#febc2e]" />
                <div className="h-3 w-3 rounded-full bg-[#28c840]" />
              </div>
              <span className="text-[11px] font-mono text-white/35">
                {TABS.find((t) => t.id === active)?.label}
              </span>
              <div className="flex items-center gap-1.5">
                <motion.div
                  className="h-1.5 w-1.5 rounded-full bg-[#4ade80]"
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ repeat: Infinity, duration: 1.8 }}
                />
                <span className="text-[10px] font-mono text-white/25 tracking-wider">LIVE</span>
              </div>
            </div>

            {/* Visualization */}
            <div className="relative" style={{ aspectRatio: "580/340", minHeight: 240 }}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={active}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="absolute inset-0 p-4"
                >
                  <ActiveViz />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* ── Right panel: tabs + insights ── */}
          <div className="space-y-4">
            {/* Tab selector */}
            <div className="rounded-2xl border border-border bg-surface p-2 space-y-1">
              <p className="text-[10px] font-mono text-muted-foreground/50 uppercase tracking-wider px-2 pb-1">
                Switch view
              </p>
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = tab.id === active;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActive(tab.id)}
                    className={cn(
                      "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all duration-200",
                      isActive
                        ? "bg-brand-500/12 border border-brand-500/30 text-brand-300"
                        : "border border-transparent text-muted-foreground/60 hover:text-foreground hover:bg-white/[0.04]"
                    )}
                  >
                    <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-brand-400" : "")} />
                    <span className="text-[13px] font-medium">{tab.label}</span>
                    {isActive && (
                      <motion.div
                        layoutId="tab-indicator"
                        className="ml-auto h-1.5 w-1.5 rounded-full bg-brand-400"
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Insight badges */}
            <div className="rounded-2xl border border-border bg-surface p-4 space-y-2">
              <p className="text-[10px] font-mono text-muted-foreground/50 uppercase tracking-wider mb-3">
                Detected
              </p>
              {INSIGHTS.map((ins) => (
                <motion.div
                  key={ins.label}
                  initial={{ opacity: 0, x: -8 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.3, delay: ins.delay }}
                  className={cn(
                    "flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-[12px] font-mono",
                    INSIGHT_COLORS[ins.color]
                  )}
                >
                  <span className="text-[#4ade80] font-bold text-[11px]">✓</span>
                  {ins.label}
                </motion.div>
              ))}

              <motion.div
                initial={{ opacity: 0 }}
                animate={isInView ? { opacity: 1 } : {}}
                transition={{ delay: 2.0 }}
                className="pt-2 mt-1 border-t border-border/50 flex items-center gap-2"
              >
                <div className="h-px flex-1 bg-gradient-to-r from-brand-500/30 to-transparent" />
                <span className="text-[10px] font-mono text-muted-foreground/40">
                  847 files  ·  0.8s
                </span>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </Container>
    </section>
  );
}
