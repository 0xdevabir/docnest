import dynamic from "next/dynamic";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/sections/Hero";
import { ProblemSolution } from "@/components/sections/ProblemSolution";
import { Features } from "@/components/sections/Features";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { CodeDemo } from "@/components/sections/CodeDemo";
import { Divider } from "@/components/shared/Divider";

// Lazy-load below-fold sections to reduce initial bundle
const ExplainSection   = dynamic(() => import("@/components/sections/ExplainSection").then(m => ({ default: m.ExplainSection })));
const ArchViz          = dynamic(() => import("@/components/sections/ArchViz").then(m => ({ default: m.ArchViz })));
const WorkflowSection  = dynamic(() => import("@/components/sections/WorkflowSection").then(m => ({ default: m.WorkflowSection })));
const OpenSourceSection = dynamic(() => import("@/components/sections/OpenSourceSection").then(m => ({ default: m.OpenSourceSection })));
const FutureSection    = dynamic(() => import("@/components/sections/FutureSection").then(m => ({ default: m.FutureSection })));
const Testimonials     = dynamic(() => import("@/components/sections/Testimonials").then(m => ({ default: m.Testimonials })));
const CTA              = dynamic(() => import("@/components/sections/CTA").then(m => ({ default: m.CTA })));

export default function HomePage() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <ProblemSolution />
        <Features />
        <HowItWorks />
        <CodeDemo />
        <ExplainSection />
        <Divider glow />
        <ArchViz />
        <Divider />
        <WorkflowSection />
        <Divider glow />
        <OpenSourceSection />
        <Divider />
        <FutureSection />
        <Divider glow />
        <Testimonials />
        <CTA />
      </main>
      <Footer />
    </>
  );
}
