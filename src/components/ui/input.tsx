import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          // Base styles
          "flex h-11 sm:h-10 w-full rounded-md border border-input bg-background px-3 py-2",
          // Typography - 16px on mobile to prevent iOS zoom
          "text-base md:text-sm",
          // Focus states
          "ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          // File input styles
          "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
          // Placeholder
          "placeholder:text-muted-foreground",
          // Disabled state
          "disabled:cursor-not-allowed disabled:opacity-50",
          // Touch-friendly
          "touch-action-manipulation",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
