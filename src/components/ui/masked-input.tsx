import * as React from "react";
import { cn } from "@/lib/utils";
import { 
  MASK_FORMATTERS, 
  MASK_PLACEHOLDERS, 
  type MaskType,
  toUpperCase 
} from "@/lib/formatters";

// ========================================
// MASKED INPUT - Input com máscara
// ========================================

interface MaskedInputProps extends Omit<React.ComponentProps<"input">, 'onChange'> {
  mask: MaskType;
  value: string;
  onChange: (value: string) => void;
}

const MaskedInput = React.forwardRef<HTMLInputElement, MaskedInputProps>(
  ({ className, mask, value, onChange, placeholder, ...props }, ref) => {
    const formatter = MASK_FORMATTERS[mask];
    const defaultPlaceholder = MASK_PLACEHOLDERS[mask];

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const formatted = formatter(e.target.value);
      onChange(formatted);
    };

    return (
      <input
        type="text"
        className={cn(
          // Base styles
          "flex h-11 sm:h-10 w-full rounded-md border border-input bg-background px-3 py-2",
          // Typography - 16px on mobile to prevent iOS zoom
          "text-base md:text-sm",
          // Focus states
          "ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          // Placeholder
          "placeholder:text-muted-foreground",
          // Disabled state
          "disabled:cursor-not-allowed disabled:opacity-50",
          // Touch-friendly
          "touch-action-manipulation",
          className,
        )}
        ref={ref}
        value={value}
        onChange={handleChange}
        placeholder={placeholder || defaultPlaceholder}
        {...props}
      />
    );
  },
);
MaskedInput.displayName = "MaskedInput";

// ========================================
// UPPERCASE INPUT - Input com maiúsculas
// ========================================

interface UppercaseInputProps extends Omit<React.ComponentProps<"input">, 'onChange'> {
  value: string;
  onChange: (value: string) => void;
}

const UppercaseInput = React.forwardRef<HTMLInputElement, UppercaseInputProps>(
  ({ className, value, onChange, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(toUpperCase(e.target.value));
    };

    return (
      <input
        type="text"
        className={cn(
          // Base styles
          "flex h-11 sm:h-10 w-full rounded-md border border-input bg-background px-3 py-2",
          // Typography - 16px on mobile to prevent iOS zoom
          "text-base md:text-sm",
          // Uppercase styling
          "uppercase",
          // Focus states
          "ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          // Placeholder
          "placeholder:text-muted-foreground placeholder:normal-case",
          // Disabled state
          "disabled:cursor-not-allowed disabled:opacity-50",
          // Touch-friendly
          "touch-action-manipulation",
          className,
        )}
        ref={ref}
        value={value}
        onChange={handleChange}
        {...props}
      />
    );
  },
);
UppercaseInput.displayName = "UppercaseInput";

// ========================================
// UPPERCASE TEXTAREA - Textarea com maiúsculas
// ========================================

interface UppercaseTextareaProps extends Omit<React.ComponentProps<"textarea">, 'onChange'> {
  value: string;
  onChange: (value: string) => void;
}

const UppercaseTextarea = React.forwardRef<HTMLTextAreaElement, UppercaseTextareaProps>(
  ({ className, value, onChange, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChange(toUpperCase(e.target.value));
    };

    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2",
          "text-base md:text-sm",
          "uppercase",
          "ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "placeholder:text-muted-foreground placeholder:normal-case",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        value={value}
        onChange={handleChange}
        {...props}
      />
    );
  },
);
UppercaseTextarea.displayName = "UppercaseTextarea";

export { MaskedInput, UppercaseInput, UppercaseTextarea };
