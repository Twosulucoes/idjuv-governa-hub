/**
 * Aba Prazos da ficha do processo (P3, migração 20261128090000): os prazos em aberto (da data mais próxima para a
 * mais distante, com o selo de vencido), os encerrados e o histórico das remarcações. Quem tem
 * compras.processos.editar lança, remarca (com motivo), cumpre, cancela (com motivo) e muda os avisos. O prazo da
 * próxima ação vem da movimentação: remarcá-lo é corrigir o prazo dela (abre a correção na aba Andamento).
 */

import { useState } from "react";
import { BellRing, CalendarCheck, CalendarClock, Check, ChevronDown, Pencil, Plus, X } from "lucide-react";
import { EmptyState, StatusBadge, type TomStatus } from "@/components/design-system";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Skeleton } from "@/components/ui/skeleton";
import { SeloPrazo } from "@/components/compras/processos/ProximaAcao";
import { AcaoPrazoDialog, NovoPrazoDialog, type ModoAcao } from "@/components/compras/processos/PrazoDialog";
import {
  useAlterarPrazo,
  useNovoPrazo,
  usePrazosDoProcesso,
  useRemarcacoesDoProcesso,
  type ProcessoPrazo,
} from "@/hooks/useProcessoPrazos";
import {
  prazoEmAberto,
  ROTULO_SITUACAO_PRAZO,
  rotuloTipoPrazo,
  situacaoExibida,
  textoAvisos,
  type SituacaoExibida,
} from "@/lib/compras/prazos";
import { hojeLocal } from "@/lib/compras/proximaAcao";
import { formatDateBR } from "@/lib/formatters";
import { rotuloEtapa } from "@/types/processos";

const TOM: Record<SituacaoExibida, TomStatus> = {
  aberto: "andamento", remarcado: "pendente", vencido: "erro", cumprido: "sucesso", cancelado: "neutro",
};

interface Props {
  processoId: string;
  podeEditar: boolean;
  /** Abre a correção da movimentação de onde veio o prazo da próxima ação. */
  aoCorrigirMovimentacao: (andamentoId: string) => void;
}

export function ProcessoPrazosTab({ processoId, podeEditar, aoCorrigirMovimentacao }: Props) {
  const prazos = usePrazosDoProcesso(processoId);
  const remarcacoes = useRemarcacoesDoProcesso(processoId);
  const novo = useNovoPrazo();
  const alterar = useAlterarPrazo();
  const [lancando, setLancando] = useState(false);
  const [acao, setAcao] = useState<{ prazo: ProcessoPrazo; modo: ModoAcao } | null>(null);
  const hoje = hojeLocal();

  if (prazos.isLoading) return <Skeleton className="h-48" />;
  if (prazos.isError) {
    return (
      <EmptyState
        titulo="Não foi possível carregar os prazos"
        acao={<Button variant="outline" onClick={() => prazos.refetch()}>Tentar novamente</Button>}
      />
    );
  }

  const todos = prazos.data ?? [];
  const abertos = todos.filter((p) => prazoEmAberto(p.situacao));
  const encerrados = todos.filter((p) => !prazoEmAberto(p.situacao)).reverse();
  const descricao = (p: ProcessoPrazo) =>
    p.tipo === "proxima_acao" && p.descricao ? rotuloEtapa(p.descricao) : p.descricao;

  const item = (p: ProcessoPrazo) => {
    const s = situacaoExibida(p.situacao, p.data_limite, hoje);
    const aberto = prazoEmAberto(p.situacao);
    const daMovimentacao = p.tipo === "proxima_acao";
    return (
      <li key={p.id} className="flex flex-col gap-3 rounded-md border border-border p-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium">{rotuloTipoPrazo(p.tipo)}</span>
            <StatusBadge tom={TOM[s]} icone={s === "vencido"}>{ROTULO_SITUACAO_PRAZO[s]}</StatusBadge>
          </div>
          {descricao(p) && <p className="text-sm">{daMovimentacao ? `Próxima etapa: ${descricao(p)}` : descricao(p)}</p>}
          <p className="text-sm text-muted-foreground">
            {p.responsavel_nome ?? p.responsavel_setor ?? "sem responsável"}
            {aberto && <> · avisos {textoAvisos(p.avisos_dias)} dia(s) antes</>}
          </p>
          {p.remarcacao_motivo && aberto && <p className="text-sm text-muted-foreground">Remarcado: {p.remarcacao_motivo}</p>}
          {!aberto && p.conclusao_motivo && <p className="text-sm text-muted-foreground">{p.conclusao_motivo}</p>}
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:items-end">
          {aberto ? <SeloPrazo prazo={p.data_limite} hoje={hoje} /> : <span className="text-sm">{formatDateBR(p.data_limite)}</span>}
          {podeEditar && aberto && (
            <div className="flex flex-wrap gap-1 sm:justify-end">
              {daMovimentacao ? (
                p.andamento_id && (
                  <Button variant="outline" size="sm" onClick={() => aoCorrigirMovimentacao(p.andamento_id!)}>
                    <Pencil className="h-4 w-4" aria-hidden="true" /> Remarcar
                  </Button>
                )
              ) : (
                <>
                  <Button variant="outline" size="sm" disabled={alterar.isPending}
                    onClick={() => alterar.mutate({ prazo: p, acao: "cumprir" })}>
                    <Check className="h-4 w-4" aria-hidden="true" /> Cumprido
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setAcao({ prazo: p, modo: "remarcar" })}>
                    <CalendarClock className="h-4 w-4" aria-hidden="true" /> Remarcar
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setAcao({ prazo: p, modo: "cancelar" })}>
                    <X className="h-4 w-4" aria-hidden="true" /> Cancelar
                  </Button>
                </>
              )}
              <Button variant="ghost" size="sm" aria-label={`Avisos de ${rotuloTipoPrazo(p.tipo)}`} onClick={() => setAcao({ prazo: p, modo: "avisos" })}>
                <BellRing className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
          )}
        </div>
      </li>
    );
  };

  return (
    <div className="space-y-4">
      {podeEditar && (
        <div className="flex justify-end">
          <Button onClick={() => setLancando(true)}>
            <Plus className="h-4 w-4" aria-hidden="true" /> Novo prazo
          </Button>
        </div>
      )}

      {abertos.length === 0 ? (
        <EmptyState
          icone={CalendarCheck}
          titulo="Nenhum prazo em aberto"
          descricao="A próxima ação de cada movimentação vira prazo aqui. Lance os outros (resposta de órgão externo, vigência, empenho) em Novo prazo."
        />
      ) : (
        <ul className="space-y-2" aria-label="Prazos em aberto">{abertos.map(item)}</ul>
      )}

      {encerrados.length > 0 && (
        <Collapsible>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-1 px-2 text-muted-foreground">
              <ChevronDown className="h-4 w-4" aria-hidden="true" /> Cumpridos e cancelados ({encerrados.length})
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <ul className="mt-2 space-y-2" aria-label="Prazos encerrados">{encerrados.map(item)}</ul>
          </CollapsibleContent>
        </Collapsible>
      )}

      {(remarcacoes.data?.length ?? 0) > 0 && (
        <Collapsible>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-1 px-2 text-muted-foreground">
              <ChevronDown className="h-4 w-4" aria-hidden="true" /> Remarcações ({remarcacoes.data!.length})
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <ul className="mt-2 space-y-3 rounded-md border border-border p-3 text-sm">
              {remarcacoes.data!.map((r) => {
                const prazo = todos.find((p) => p.id === r.prazo_id);
                return (
                  <li key={r.id} className="space-y-0.5">
                    <p className="font-medium">
                      {rotuloTipoPrazo(prazo?.tipo)}: {formatDateBR(r.data_anterior)} → {formatDateBR(r.data_nova)}
                    </p>
                    <p>Motivo: {r.motivo}</p>
                    <p className="text-muted-foreground">em {formatDateBR(hojeLocal(new Date(r.feito_em)))}</p>
                  </li>
                );
              })}
            </ul>
          </CollapsibleContent>
        </Collapsible>
      )}

      <NovoPrazoDialog
        open={lancando}
        onOpenChange={setLancando}
        processoId={processoId}
        salvando={novo.isPending}
        onSalvar={(p) => novo.mutateAsync(p)}
      />
      <AcaoPrazoDialog
        prazo={acao?.prazo ?? null}
        modo={acao?.modo ?? "remarcar"}
        onOpenChange={(aberto) => !aberto && setAcao(null)}
        salvando={alterar.isPending}
        onSalvar={(a) => alterar.mutateAsync({ ...a, prazo: acao!.prazo })}
      />
    </div>
  );
}
