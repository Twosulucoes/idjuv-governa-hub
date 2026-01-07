import { cn } from "@/lib/utils";

interface FaixaBrasilProps {
  className?: string;
  vertical?: boolean;
  size?: "sm" | "md" | "lg";
}

export function FaixaBrasil({ className, vertical = false, size = "md" }: FaixaBrasilProps) {
  const sizeClasses = {
    sm: vertical ? "w-1" : "h-1",
    md: vertical ? "w-1" : "h-1",
    lg: vertical ? "w-2" : "h-2",
  };

  return (
    <div
      className={cn(
        vertical ? "faixa-brasil-vertical" : "faixa-brasil",
        sizeClasses[size],
        className
      )}
    />
  );
}
