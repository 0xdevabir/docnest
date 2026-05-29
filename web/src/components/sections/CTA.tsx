"use client";

import { motion } from "framer-motion";
import { ArrowRight, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/shared/Container";
import { GradientBorder } from "@/components/shared/GradientBorder";
import { fadeInUp, scaleIn, viewport } from "@/styles/animations";

export function CTA() {
  return (
    <section className="relative py-28 overflow-hidden">
      <Container size="lg">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewport}
          variants={scaleIn}
        >
          <GradientBorder
            rounded="rounded-3xl"
            gradient="linear-gradient(135deg, rgba(99,102,241,0.5) 0%, rgba(34,211,238,0.25) 50%, rgba(99,102,241,0.15) 100%)"
          >
            <div className="relative rounded-3xl bg-surface overflow-hidden px-8 py-16 sm:px-16 sm:py-20 text-center">
              {/* Background glow inside card */}
              <div className="pointer-events-none absolute inset-0">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-brand-500/10 blur-[80px] rounded-full" />
                <div className="absolute bottom-0 right-1/4 w-[300px] h-[200px] bg-cyan-500/8 blur-[60px] rounded-full" />
                {/* Grid */}
                <div className="absolute inset-0 grid-bg opacity-40" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_50%,hsl(var(--surface))_100%)]" />
              </div>

              <div className="relative z-10 space-y-8">
                {/* Icon */}
                <motion.div
                  variants={scaleIn}
                  className="flex justify-center"
                >
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-500/20 border border-brand-500/30 shadow-glow-md">
                    <Terminal className="h-8 w-8 text-brand-400" />
                  </div>
                </motion.div>

                {/* Copy */}
                <motion.div variants={fadeInUp} className="space-y-4">
                  <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-balance">
                    Your docs are{" "}
                    <span className="text-gradient-brand">
                      one command away
                    </span>
                  </h2>
                  <p className="mx-auto max-w-lg text-lg text-muted-foreground text-balance">
                    Drop DocSmith into any codebase and get beautiful,
                    accurate documentation in seconds.
                  </p>
                </motion.div>

                {/* Install snippet */}
                <motion.div
                  variants={fadeInUp}
                  className="flex justify-center"
                >
                  <div className="flex items-center gap-3 rounded-xl border border-border bg-background px-5 py-3 font-mono text-sm">
                    <span className="text-brand-400">$</span>
                    <span className="text-foreground">npx docsmith init</span>
                  </div>
                </motion.div>

                {/* Buttons */}
                <motion.div
                  variants={fadeInUp}
                  className="flex flex-col sm:flex-row items-center justify-center gap-3"
                >
                  <Button size="xl" className="group gap-2 shadow-glow-md">
                    Get started free
                    <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                  </Button>
                  <Button size="xl" variant="secondary">
                    Read the docs
                  </Button>
                </motion.div>

                {/* Trust note */}
                <motion.p
                  variants={fadeInUp}
                  className="text-xs text-muted-foreground"
                >
                  Free forever for open-source · No account required · MIT license
                </motion.p>
              </div>
            </div>
          </GradientBorder>
        </motion.div>
      </Container>
    </section>
  );
}
