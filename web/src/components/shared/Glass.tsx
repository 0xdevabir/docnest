import { cn } from "@/lib/utils";

type GlassIntensity = "sm" | "md" | "lg";

interface GlassProps {
  children: React.ReactNode;
  className?: string;
  intensity?: GlassIntensity;
  bordered?: boolean;
  rounded?: string;
  glow?: boolean;
}

const intensityMap: Record<GlassIntensity, string> = {
  sm: "glass-sm",
  md: "glass",
  lg: "glass-lg",
};

export function Glass({
  children,
  className,
  intensity = "md",
  bordered = true,
  rounded = "rounded-2xl",
  glow = false,
}: GlassProps) {
  return (
    <div
      className={cn(
        "relative",
        rounded,
        intensityMap[intensity],
        !bordered && "border-0",
        glow && "shadow-glow-sm",
        className
      )}
    >
      {children}
    </div>
  );
}
