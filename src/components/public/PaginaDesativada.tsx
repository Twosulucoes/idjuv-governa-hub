/**
 * Página exibida quando uma página pública está desativada
 */

import { XCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { SkipLink } from "@/components/design-system";
import { useTenant } from "@/core/tenant";

export function PaginaDesativada() {
  const { identidade, entidadeSuperior } = useTenant();
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/30 to-background">
      <SkipLink />
      <main id="conteudo" tabIndex={-1} className="max-w-lg mx-auto px-6 py-12 text-center focus:outline-none">
        {/* Ícone */}
        <div className="relative mb-8">
          <div className="flex items-center justify-center">
            <div className="w-24 h-24 rounded-full bg-destructive/10 flex items-center justify-center">
              <XCircle className="h-12 w-12 text-destructive" aria-hidden="true" />
            </div>
          </div>
        </div>

        {/* Título */}
        <h1 className="text-3xl font-bold text-foreground mb-4">
          Página indisponível
        </h1>

        {/* Mensagem */}
        <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
          Esta página não está disponível no momento. 
          Por favor, retorne à página inicial.
        </p>

        {/* Botão voltar */}
        <Button asChild variant="default" size="lg">
          <Link to="/" className="inline-flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Voltar ao início
          </Link>
        </Button>

        {/* Rodapé institucional */}
        <div className="mt-12 pt-8 border-t border-border">
          <p className="text-base text-muted-foreground">
            {identidade.nomeOficial}
          </p>
          {entidadeSuperior && (
            <p className="text-sm text-muted-foreground mt-1">
              {entidadeSuperior.nome}
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
