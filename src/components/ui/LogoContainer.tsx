import { cn } from "@/lib/utils";

interface LogoContainerProps {
  children: React.ReactNode;
  variant?: "light" | "dark" | "transparent";
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function LogoContainer({ 
  children, 
  variant = "light", 
  size = "md",
  className 
}: LogoContainerProps) {
  const variantClasses = {
    light: "bg-white/95 dark:bg-white/90",
    dark: "bg-primary dark:bg-primary",
    transparent: "bg-transparent",
  };

  const sizeClasses = {
    sm: "p-1 rounded",
    md: "p-2 rounded-lg",
    lg: "p-3 rounded-xl",
  };

  return (
    <div
      className={cn(
        variantClasses[variant],
        sizeClasses[size],
        "backdrop-blur-sm transition-all",
        className
      )}
    >
      {children}
    </div>
  );
}
