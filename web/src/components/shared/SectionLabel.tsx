import { cn } from "@/lib/utils";
import { GradientBadge } from "./GradientBorder";

interface SectionLabelProps {
  label: string;
  className?: string;
}

export function SectionLabel({ label, className }: SectionLabelProps) {
  return (
    <div className={cn("flex justify-center", className)}>
      <GradientBadge>
        <span className="h-1.5 w-1.5 rounded-full bg-brand-400 animate-pulse" />
        {label}
      </GradientBadge>
    </div>
  );
}
