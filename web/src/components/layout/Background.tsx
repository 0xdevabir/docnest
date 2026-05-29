import { cn } from "@/lib/utils";

export function Background() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 select-none overflow-hidden"
    >
      {/* Dot grid */}
      <div className="absolute inset-0 grid-bg opacity-50" />

      {/* Orb 1 — top-left, brand indigo */}
      <div
        className={cn(
          "absolute -left-64 -top-64",
          "h-[900px] w-[900px] rounded-full",
          "bg-brand-500/[0.08] blur-[140px]",
          "animate-orb-1"
        )}
      />

      {/* Orb 2 — top-right, cyan */}
      <div
        className={cn(
          "absolute -right-48 -top-32",
          "h-[650px] w-[650px] rounded-full",
          "bg-cyan-400/[0.05] blur-[120px]",
          "animate-orb-2"
        )}
      />

      {/* Orb 3 — bottom-left, brand deep */}
      <div
        className={cn(
          "absolute -bottom-48 left-1/4",
          "h-[600px] w-[600px] rounded-full",
          "bg-brand-600/[0.07] blur-[110px]",
          "animate-orb-3"
        )}
      />

      {/* Orb 4 — center accent, subtle violet */}
      <div
        className={cn(
          "absolute left-1/2 top-1/3 -translate-x-1/2",
          "h-[400px] w-[400px] rounded-full",
          "bg-brand-400/[0.03] blur-[100px]",
          "animate-orb-2 [animation-delay:-8s]"
        )}
      />

      {/* Top edge highlight */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-500/30 to-transparent" />

      {/* Noise texture */}
      <div className="noise absolute inset-0 opacity-20" />
    </div>
  );
}
