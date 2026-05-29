import { cn } from "@/lib/utils";

interface DividerProps {
  className?: string;
  glow?: boolean;
  label?: string;
}

export function Divider({ className, glow = false, label }: DividerProps) {
  if (label) {
    return (
      <div className={cn("relative flex items-center gap-4 py-2", className)}>
        <div className="h-px flex-1 bg-gradient-to-r from-transparent to-border/60" />
        <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground/50">
          {label}
        </span>
        <div className="h-px flex-1 bg-gradient-to-l from-transparent to-border/60" />
      </div>
    );
  }

  return (
    <div className={cn("relative flex items-center justify-center py-2", className)}>
      <div className="absolute inset-y-0 flex w-full items-center">
        <div className="h-px w-full bg-gradient-to-r from-transparent via-border/60 to-transparent" />
      </div>
      {glow && (
        <div className="relative z-10 flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-400/60 opacity-75" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-brand-500/80" />
        </div>
      )}
    </div>
  );
}
