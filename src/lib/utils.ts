import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// Ensina ao tailwind-merge a escala tipográfica do design system (tailwind.config.ts → fontSize),
// para que `text-h3` e `text-lg` se substituam em vez de acumular (e não sejam lidos como cor).
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [{ text: ["display", "h1", "h2", "h3", "body", "body-lg", "caption"] }],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
