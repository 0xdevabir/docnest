import { cn } from "@/lib/utils";
import { Container } from "@/components/shared/Container";

type SectionSize = "sm" | "md" | "lg" | "xl";
type ContainerSize = "sm" | "md" | "lg" | "xl" | "full";

interface SectionProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
  size?: SectionSize;
  container?: boolean | ContainerSize;
}

const paddingMap: Record<SectionSize, string> = {
  sm: "py-12 md:py-16",
  md: "py-16 md:py-24",
  lg: "py-24 md:py-32",
  xl: "py-28 md:py-40",
};

export function Section({
  children,
  className,
  id,
  size = "lg",
  container = true,
}: SectionProps) {
  const containerSize = typeof container === "string" ? container : undefined;
  const withContainer = container !== false;

  return (
    <section
      id={id}
      className={cn("relative", paddingMap[size], className)}
    >
      {withContainer ? (
        <Container size={containerSize}>{children}</Container>
      ) : (
        children
      )}
    </section>
  );
}
