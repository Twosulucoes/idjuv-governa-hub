/**
 * Cartão de um processo SEI no localizador: o número (com o botão de copiar para colar na pesquisa do SEI), o objeto,
 * onde está, a última movimentação e cada registro que o sistema tem dele, com link para a tela do registro.
 */

import { Link } from "react-router-dom";
import { toast } from "sonner";
import { ChevronRight, Copy, MapPin } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/design-system";
import { BarraEvolucao } from "@/components/compras/processos/EvolucaoProcesso";
import { formatCurrency, formatDateBR } from "@/lib/formatters";
import { ORIGENS, resumoDasFontes, type ProcessoLocalizado, type RegistroLocalizado } from "@/lib/processos/localizador";
import { STATUS_PROCESSO_LABELS, type StatusProcesso } from "@/types/workflow";

/** "em_andamento" → "Em andamento"; o status do workflow usa os rótulos dele. */
export function situacaoLegivel(r: Pick<RegistroLocalizado, "origem" | "situacao">): string | null {
  if (!r.situacao) return null;
  if (r.origem === "workflow") return STATUS_PROCESSO_LABELS[r.situacao as StatusProcesso] ?? r.situacao;
  const texto = r.situacao.replace(/_/g, " ");
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export async function copiarNumero(numero: string) {
  try {
    await navigator.clipboard.writeText(numero);
    toast.success("Número copiado", { description: "Cole na pesquisa do SEI." });
  } catch {
    toast.error("Não foi possível copiar", { description: numero });
  }
}

function LinhaRegistro({ r }: { r: RegistroLocalizado }) {
  const origem = ORIGENS[r.origem];
  const situacao = situacaoLegivel(r);
  return (
    <li>
      <Link
        to={origem.link(r)}
        className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-md px-2 py-2 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span className="w-44 shrink-0 text-caption font-medium text-muted-foreground">{origem.rotulo}</span>
        <span className="min-w-0 flex-1 truncate text-body">{r.titulo ?? "Sem título"}</span>
        {r.origem === "contratacao" ? (
          <BarraEvolucao processo={{ etapa: r.situacao, atualizado_em: r.atualizado_em }} />
        ) : (
          situacao && <StatusBadge icone={false}>{situacao}</StatusBadge>
        )}
        {r.valor != null && <span className="text-caption tabular-nums text-muted-foreground">{formatCurrency(r.valor)}</span>}
        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      </Link>
    </li>
  );
}

export function CartaoProcessoSei({ processo }: { processo: ProcessoLocalizado }) {
  return (
    <Card>
      <CardHeader className="space-y-2 pb-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0 space-y-1">
            <p className="font-mono text-h3 text-foreground">{processo.numeroSei ?? "Sem nº SEI"}</p>
            <p className="text-body text-foreground">{processo.titulo ?? "Sem objeto informado"}</p>
          </div>
          {processo.numeroSei && (
            <Button variant="outline" size="sm" onClick={() => copiarNumero(processo.numeroSei!)}>
              <Copy className="mr-1 h-4 w-4" aria-hidden="true" />
              Copiar número
            </Button>
          )}
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-caption text-muted-foreground">
          {processo.onde && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
              {processo.onde}
            </span>
          )}
          {processo.ultimaMovimentacao && <span>Última movimentação em {formatDateBR(processo.ultimaMovimentacao)}</span>}
          <span>{resumoDasFontes(processo.registros)}</span>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <ul className="divide-y">
          {processo.registros.map((r) => (
            <LinhaRegistro key={`${r.origem}:${r.registro_id}`} r={r} />
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
