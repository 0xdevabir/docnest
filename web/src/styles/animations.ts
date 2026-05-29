import type { Variants, Transition } from "framer-motion";

// ─── Easing presets ───────────────────────────────────────────────────────────
export const ease = {
  smooth: [0.25, 0.46, 0.45, 0.94] as const,
  spring: [0.34, 1.56, 0.64, 1] as const,
  out: [0, 0, 0.2, 1] as const,
  in: [0.4, 0, 1, 1] as const,
};

export const spring: Transition = {
  type: "spring",
  stiffness: 300,
  damping: 30,
};

export const springSnappy: Transition = {
  type: "spring",
  stiffness: 500,
  damping: 40,
};

// ─── Shared variants ──────────────────────────────────────────────────────────

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.5, ease: ease.out } },
};

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: ease.smooth },
  },
};

export const fadeInDown: Variants = {
  hidden: { opacity: 0, y: -16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: ease.smooth },
  },
};

export const fadeInLeft: Variants = {
  hidden: { opacity: 0, x: -24 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.5, ease: ease.smooth },
  },
};

export const fadeInRight: Variants = {
  hidden: { opacity: 0, x: 24 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.5, ease: ease.smooth },
  },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.4, ease: ease.out },
  },
};

// ─── Container / stagger ─────────────────────────────────────────────────────

export const staggerContainer = (
  staggerChildren = 0.1,
  delayChildren = 0
): Variants => ({
  hidden: {},
  visible: {
    transition: {
      staggerChildren,
      delayChildren,
    },
  },
});

export const staggerContainerFast: Variants = staggerContainer(0.06);
export const staggerContainerSlow: Variants = staggerContainer(0.15);

// ─── Hover effects ────────────────────────────────────────────────────────────

export const hoverLift = {
  whileHover: { y: -4, transition: spring },
  whileTap: { y: -2, scale: 0.98, transition: spring },
};

export const hoverScale = {
  whileHover: { scale: 1.03, transition: spring },
  whileTap: { scale: 0.97, transition: spring },
};

export const hoverGlow = {
  whileHover: {
    boxShadow: "0 0 30px rgba(99,102,241,0.5), 0 0 60px rgba(99,102,241,0.2)",
    transition: { duration: 0.3 },
  },
};

// ─── Viewport trigger config ─────────────────────────────────────────────────
export const viewport = { once: true, margin: "-80px" };
