import * as React from "react";

import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        // Base styles
        "flex min-h-[100px] sm:min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-3 sm:py-2",
        // Typography - 16px on mobile to prevent iOS zoom
        "text-base md:text-sm",
        // Focus states
        "ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        // Placeholder and disabled
        "placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50",
        // Resize behavior
        "resize-y",
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";

export { Textarea };
