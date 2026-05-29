"use client";

import { Star } from "lucide-react";
import { Container } from "@/components/shared/Container";
import { SectionLabel } from "@/components/shared/SectionLabel";
import { GlowCard } from "@/components/shared/GlowCard";
import { AnimatedGroup, AnimatedItem } from "@/components/shared/AnimatedText";

const testimonials = [
  {
    quote:
      "DocSmith cut our onboarding docs time from 2 days to 3 minutes. The architecture detection is genuinely magical.",
    name: "Sarah Kim",
    role: "Staff Engineer",
    company: "Vercel",
    avatar: "SK",
    color: "from-purple-500 to-brand-500",
    stars: 5,
  },
  {
    quote:
      "Our CONTRIBUTING.md used to be an afterthought. DocSmith generated one that's better than anything we'd written manually.",
    name: "Marcus Weber",
    role: "Open Source Maintainer",
    company: "OSS / 12k stars",
    avatar: "MW",
    color: "from-brand-500 to-cyan-400",
    stars: 5,
  },
  {
    quote:
      "Dropped it into a 200k LOC TypeScript monorepo. 6 seconds. Perfect docs. I genuinely didn't believe it until I saw it.",
    name: "Priya Nair",
    role: "Engineering Manager",
    company: "Stripe",
    avatar: "PN",
    color: "from-cyan-400 to-emerald-400",
    stars: 5,
  },
  {
    quote:
      "The dependency graph visualization alone is worth it. Finally understand why our bundle is the size it is.",
    name: "James Okoro",
    role: "Frontend Architect",
    company: "Shopify",
    avatar: "JO",
    color: "from-brand-400 to-purple-500",
    stars: 5,
  },
  {
    quote:
      "We run DocSmith in CI on every PR that changes the API surface. Docs stay in sync automatically. Game-changer.",
    name: "Elena Sokolova",
    role: "DevOps Lead",
    company: "Linear",
    avatar: "ES",
    color: "from-emerald-400 to-brand-400",
    stars: 5,
  },
  {
    quote:
      "DocSmith understood our DDD layering better than some engineers I've interviewed. Seriously impressive.",
    name: "Chen Liu",
    role: "Principal Engineer",
    company: "Notion",
    avatar: "CL",
    color: "from-amber-400 to-brand-400",
    stars: 5,
  },
];

export function Testimonials() {
  return (
    <section className="relative py-28 overflow-hidden">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-brand-500/4 blur-[120px] rounded-full" />
      </div>

      <Container>
        <AnimatedGroup className="text-center mb-16 space-y-4">
          <AnimatedItem>
            <SectionLabel label="Testimonials" />
          </AnimatedItem>
          <AnimatedItem>
            <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-balance">
              Loved by{" "}
              <span className="text-gradient-brand">engineering teams</span>
            </h2>
          </AnimatedItem>
          <AnimatedItem>
            <p className="mx-auto max-w-lg text-lg text-muted-foreground">
              From solo devs to infrastructure teams at scale.
            </p>
          </AnimatedItem>
        </AnimatedGroup>

        <AnimatedGroup
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          staggerDelay={0.07}
        >
          {testimonials.map((t) => (
            <AnimatedItem key={t.name}>
              <GlowCard className="p-6 h-full flex flex-col gap-5">
                {/* Stars */}
                <div className="flex gap-0.5">
                  {Array.from({ length: t.stars }, (_, i) => (
                    <Star
                      key={i}
                      className="h-3.5 w-3.5 fill-amber-400 text-amber-400"
                    />
                  ))}
                </div>

                {/* Quote */}
                <p className="flex-1 text-sm text-muted-foreground leading-relaxed">
                  &ldquo;{t.quote}&rdquo;
                </p>

                {/* Author */}
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br ${t.color} text-white text-xs font-bold shrink-0`}
                  >
                    {t.avatar}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-foreground">
                      {t.name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {t.role} · {t.company}
                    </div>
                  </div>
                </div>
              </GlowCard>
            </AnimatedItem>
          ))}
        </AnimatedGroup>
      </Container>
    </section>
  );
}
