import { cn } from "@/lib/utils";

interface GradientBorderProps {
  children: React.ReactNode;
  className?: string;
  containerClassName?: string;
  gradient?: string;
  rounded?: string;
  padding?: string;
}

export function GradientBorder({
  children,
  className,
  containerClassName,
  gradient = "linear-gradient(135deg, rgba(99,102,241,0.6), rgba(34,211,238,0.3), rgba(99,102,241,0.1))",
  rounded = "rounded-2xl",
  padding = "p-px",
}: GradientBorderProps) {
  return (
    <div
      className={cn("relative", rounded, padding, containerClassName)}
      style={{ background: gradient }}
    >
      <div className={cn("relative w-full h-full", rounded, className)}>
        {children}
      </div>
    </div>
  );
}

export function GradientBadge({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <GradientBorder
      rounded="rounded-full"
      padding="p-px"
      containerClassName="inline-flex"
    >
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-3 py-1",
          "bg-surface text-xs font-medium text-brand-300",
          "tracking-wide",
          className
        )}
      >
        {children}
      </span>
    </GradientBorder>
  );
}
