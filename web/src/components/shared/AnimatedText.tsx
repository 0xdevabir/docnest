"use client";

import { motion } from "framer-motion";
import { fadeInUp, staggerContainer, viewport } from "@/styles/animations";
import { cn } from "@/lib/utils";

interface AnimatedTextProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  as?: "h1" | "h2" | "h3" | "h4" | "p" | "span";
}

export function AnimatedText({
  children,
  className,
  delay = 0,
  as: Tag = "p",
}: AnimatedTextProps) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={viewport}
      variants={fadeInUp}
      transition={{ delay }}
    >
      <Tag className={className}>{children}</Tag>
    </motion.div>
  );
}

interface AnimatedGroupProps {
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number;
  delayChildren?: number;
}

export function AnimatedGroup({
  children,
  className,
  staggerDelay = 0.1,
  delayChildren = 0,
}: AnimatedGroupProps) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={viewport}
      variants={staggerContainer(staggerDelay, delayChildren)}
    >
      {children}
    </motion.div>
  );
}

export function AnimatedItem({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div className={cn(className)} variants={fadeInUp}>
      {children}
    </motion.div>
  );
}
