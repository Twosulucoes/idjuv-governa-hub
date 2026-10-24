/**
 * Linha do tempo do processo no SEI, da movimentação mais recente para a mais antiga.
 */

import { History, Plus } from "lucide-react";
import { EmptyState, StatusBadge } from "@/components/design-system";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateBR } from "@/lib/formatters";
import { rotuloEtapa, type ProcessoAndamento } from "@/types/processos";

interface Props {
  andamentos: ProcessoAndamento[] | undefined;
  carregando: boolean;
  erro: boolean;
  aoTentarNovamente: () => void;
  podeEditar: boolean;
  aoNovaMovimentacao: () => void;
}

export function ProcessoAndamentoTab({ andamentos, carregando, erro, aoTentarNovamente, podeEditar, aoNovaMovimentacao }: Props) {
  if (carregando) return <Skeleton className="h-48" />;
  if (erro) {
    return (
      <EmptyState
        titulo="Não foi possível carregar o andamento"
        acao={<Button variant="outline" onClick={aoTentarNovamente}>Tentar novamente</Button>}
      />
    );
  }

  const botao = podeEditar && (
    <Button onClick={aoNovaMovimentacao}>
      <Plus className="h-4 w-4" aria-hidden="true" />
      Nova movimentação
    </Button>
  );

  if (!andamentos?.length) {
    return <EmptyState icone={History} titulo="Nenhuma movimentação registrada" descricao="Registre cada passo do processo no SEI." acao={botao || undefined} />;
  }

  return (
    <div className="space-y-4">
      {botao && <div className="flex justify-end">{botao}</div>}
      <ol className="relative space-y-4 border-l border-border pl-6">
        {andamentos.map((a) => (
          <li key={a.id} className="relative">
            <span className="absolute -left-[1.81rem] top-1.5 h-3 w-3 rounded-full border-2 border-background bg-primary" aria-hidden="true" />
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="font-medium">{a.data_informada ? formatDateBR(a.data) : "Data não informada"}</span>
              <StatusBadge tom="andamento" icone={false}>{rotuloEtapa(a.etapa)}</StatusBadge>
              {a.setor && <span className="text-muted-foreground">{a.setor}</span>}
            </div>
            <p className="mt-1 text-sm">{a.situacao}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
