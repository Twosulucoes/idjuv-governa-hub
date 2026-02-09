/**
 * Página exibida quando uma página pública está desativada
 */

import { XCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export function PaginaDesativada() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/30 to-background">
      <div className="max-w-lg mx-auto px-6 py-12 text-center">
        {/* Ícone */}
        <div className="relative mb-8">
          <div className="flex items-center justify-center">
            <div className="w-24 h-24 rounded-full bg-destructive/10 flex items-center justify-center">
              <XCircle className="h-12 w-12 text-destructive" />
            </div>
          </div>
        </div>

        {/* Título */}
        <h1 className="text-3xl font-bold text-foreground mb-4">
          Página Indisponível
        </h1>

        {/* Mensagem */}
        <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
          Esta página não está disponível no momento. 
          Por favor, retorne à página inicial.
        </p>

        {/* Botão voltar */}
        <Button asChild variant="default" size="lg">
          <Link to="/" className="inline-flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Voltar ao Início
          </Link>
        </Button>

        {/* Rodapé institucional */}
        <div className="mt-12 pt-8 border-t border-border">
          <p className="text-sm text-muted-foreground">
            Instituto de Desenvolvimento da Juventude
          </p>
          <p className="text-xs text-muted-foreground/70 mt-1">
            Governo do Estado de Rondônia
          </p>
        </div>
      </div>
    </div>
  );
}
