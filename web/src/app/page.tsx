import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/sections/Hero";
import { ProblemSolution } from "@/components/sections/ProblemSolution";
import { Features } from "@/components/sections/Features";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { CodeDemo } from "@/components/sections/CodeDemo";
import { ExplainSection } from "@/components/sections/ExplainSection";
import { ArchViz } from "@/components/sections/ArchViz";
import { WorkflowSection } from "@/components/sections/WorkflowSection";
import { OpenSourceSection } from "@/components/sections/OpenSourceSection";
import { FutureSection } from "@/components/sections/FutureSection";
import { Testimonials } from "@/components/sections/Testimonials";
import { CTA } from "@/components/sections/CTA";

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
        <ArchViz />
        <WorkflowSection />
        <OpenSourceSection />
        <FutureSection />
        <Testimonials />
        <CTA />
      </main>
      <Footer />
    </>
  );
}
