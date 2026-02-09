/**
 * Página de manutenção exibida quando uma página pública está em manutenção
 */

import { Construction, Clock, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Props {
  titulo?: string;
  mensagem?: string;
  previsaoRetorno?: string | null;
  mostrarVoltar?: boolean;
}

export function PaginaManutencao({
  titulo = "Página em Manutenção",
  mensagem = "Esta página está temporariamente em manutenção. Voltaremos em breve!",
  previsaoRetorno,
  mostrarVoltar = true,
}: Props) {
  const previsaoDate = previsaoRetorno ? new Date(previsaoRetorno) : null;
  const previsaoPassou = previsaoDate && previsaoDate < new Date();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/30 to-background">
      <div className="max-w-lg mx-auto px-6 py-12 text-center">
        {/* Ícone animado */}
        <div className="relative mb-8">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-32 h-32 rounded-full bg-warning/20 animate-pulse" />
          </div>
          <div className="relative flex items-center justify-center">
            <div className="w-24 h-24 rounded-full bg-warning/30 flex items-center justify-center">
              <Construction className="h-12 w-12 text-warning animate-bounce" />
            </div>
          </div>
        </div>

        {/* Título */}
        <h1 className="text-3xl font-bold text-foreground mb-4">
          {titulo}
        </h1>

        {/* Mensagem */}
        <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
          {mensagem}
        </p>

        {/* Previsão de retorno */}
        {previsaoDate && !previsaoPassou && (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-8">
            <Clock className="h-4 w-4" />
            <span className="text-sm font-medium">
              Previsão de retorno:{" "}
              {formatDistanceToNow(previsaoDate, { locale: ptBR, addSuffix: true })}
            </span>
          </div>
        )}

        {previsaoDate && !previsaoPassou && (
          <p className="text-xs text-muted-foreground mb-8">
            {format(previsaoDate, "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
          </p>
        )}

        {/* Botão voltar */}
        {mostrarVoltar && (
          <Button asChild variant="outline" size="lg">
            <Link to="/" className="inline-flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Voltar ao Início
            </Link>
          </Button>
        )}

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
