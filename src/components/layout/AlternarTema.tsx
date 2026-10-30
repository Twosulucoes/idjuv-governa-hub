/**
 * ALTERNAR TEMA
 *
 * Botão claro/escuro do cabeçalho dos módulos. O ícone só aparece depois de montar, porque o
 * next-themes só sabe o tema resolvido no navegador.
 */

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function AlternarTema() {
  const { resolvedTheme, setTheme } = useTheme();
  const [montado, setMontado] = useState(false);
  useEffect(() => setMontado(true), []);

  const escuro = montado && resolvedTheme === "dark";
  const rotulo = escuro ? "Usar tema claro" : "Usar tema escuro";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon" onClick={() => setTheme(escuro ? "light" : "dark")} aria-label={rotulo}>
          {escuro ? <Sun className="h-5 w-5" aria-hidden="true" /> : <Moon className="h-5 w-5" aria-hidden="true" />}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{rotulo}</TooltipContent>
    </Tooltip>
  );
}
