/**
 * Linha do tempo do processo no SEI: as movimentações com data, da mais recente para a mais antiga, e depois as sem
 * data (registros antigos da planilha), que ficam numa lista para preencher a data ou excluir. Quem tem
 * compras.processos.editar corrige (com motivo) ou exclui (exclusão lógica, com motivo); tudo vai para a trilha
 * "Correções e exclusões" (migração 20261120090000).
 */

import { useState } from "react";
import { AlertTriangle, ChevronDown, History, Pencil, Plus, Trash2 } from "lucide-react";
import { EmptyState, StatusBadge } from "@/components/design-system";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { formatDateBR } from "@/lib/formatters";
import { rotuloEtapa, type ProcessoAndamento, type ProcessoAndamentoAlteracao } from "@/types/processos";

interface Props {
  andamentos: ProcessoAndamento[] | undefined;
  carregando: boolean;
  erro: boolean;
  aoTentarNovamente: () => void;
  podeEditar: boolean;
  aoNovaMovimentacao: () => void;
  aoCorrigir: (a: ProcessoAndamento) => void;
  excluindo: boolean;
  aoExcluir: (ids: string[], motivo: string) => Promise<unknown>;
  alteracoes: ProcessoAndamentoAlteracao[] | undefined;
}

const MOTIVO_MINIMO = 3;

/** Data (AAAA-MM-DD) em que a movimentação foi lançada no sistema, no fuso de quem vê. */
function dataDoRegistro(createdAt: string): string {
  const d = new Date(createdAt);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function resumo(v: unknown): string {
  const o = (v ?? {}) as { data?: string; data_informada?: boolean; etapa?: string; setor?: string | null; situacao?: string };
  const data = o.data_informada === false ? "sem data" : o.data ? formatDateBR(o.data) : "sem data";
  return [data, rotuloEtapa(o.etapa), o.setor, o.situacao].filter(Boolean).join(" · ");
}

export function ProcessoAndamentoTab({
  andamentos,
  carregando,
  erro,
  aoTentarNovamente,
  podeEditar,
  aoNovaMovimentacao,
  aoCorrigir,
  excluindo,
  aoExcluir,
  alteracoes,
}: Props) {
  const [excluir, setExcluir] = useState<ProcessoAndamento[] | null>(null);
  const [motivo, setMotivo] = useState("");

  if (carregando) return <Skeleton className="h-48" />;
  if (erro) {
    return (
      <EmptyState
        titulo="Não foi possível carregar o andamento"
        acao={<Button variant="outline" onClick={aoTentarNovamente}>Tentar novamente</Button>}
      />
    );
  }

  const lista = andamentos ?? [];
  const comData = lista.filter((a) => a.data_informada);
  const semData = lista.filter((a) => !a.data_informada);

  const abrirExclusao = (itens: ProcessoAndamento[]) => {
    setMotivo(itens.length > 1 ? "Registros antigos sem data, da planilha" : "");
    setExcluir(itens);
  };
  const confirmar = async () => {
    if (!excluir || motivo.trim().length < MOTIVO_MINIMO) return;
    try {
      await aoExcluir(excluir.map((a) => a.id), motivo.trim());
      setExcluir(null);
    } catch {
      // erro já exibido pelo toast da mutation
    }
  };

  const botao = podeEditar && (
    <Button onClick={aoNovaMovimentacao}>
      <Plus className="h-4 w-4" aria-hidden="true" />
      Nova movimentação
    </Button>
  );

  const item = (a: ProcessoAndamento) => {
    const registro = dataDoRegistro(a.created_at);
    return (
      <li key={a.id} className="relative">
        <span className="absolute -left-[1.81rem] top-1.5 h-3 w-3 rounded-full border-2 border-background bg-primary" aria-hidden="true" />
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              {a.data_informada ? (
                <span className="font-medium">{formatDateBR(a.data)}</span>
              ) : (
                <StatusBadge tom="pendente" icone={false}>Sem data</StatusBadge>
              )}
              <StatusBadge tom="andamento" icone={false}>{rotuloEtapa(a.etapa)}</StatusBadge>
              {a.setor && <span className="text-muted-foreground">{a.setor}</span>}
            </div>
            <p className="mt-1 text-sm">{a.situacao}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Registrada no sistema em {formatDateBR(registro)}
              {a.alterado_em && ` · corrigida em ${formatDateBR(dataDoRegistro(a.alterado_em))}`}
            </p>
          </div>
          {podeEditar && (
            <div className="flex shrink-0 gap-1">
              <Button variant="ghost" size="icon" onClick={() => aoCorrigir(a)} aria-label={a.data_informada ? "Corrigir movimentação" : "Informar a data"}>
                <Pencil className="h-4 w-4" aria-hidden="true" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => abrirExclusao([a])} aria-label="Excluir movimentação">
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
          )}
        </div>
      </li>
    );
  };

  return (
    <div className="space-y-4">
      {botao && <div className="flex justify-end">{botao}</div>}

      {semData.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" aria-hidden="true" />
          <AlertTitle>
            {semData.length === 1 ? "1 movimentação sem data" : `${semData.length} movimentações sem data`}
          </AlertTitle>
          <AlertDescription className="space-y-2">
            <p>
              Vieram da planilha sem a data do SEI e não contam para o setor, a situação nem os dias parado. Informe a
              data no lápis de cada uma ou exclua as que já não servem.
            </p>
            {podeEditar && semData.length > 1 && (
              <Button variant="outline" size="sm" onClick={() => abrirExclusao(semData)}>
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                Excluir as {semData.length} sem data
              </Button>
            )}
          </AlertDescription>
        </Alert>
      )}

      {lista.length === 0 ? (
        <EmptyState icone={History} titulo="Nenhuma movimentação registrada" descricao="Registre cada passo do processo no SEI." />
      ) : (
        <>
          {comData.length > 0 && <ol className="relative space-y-4 border-l border-border pl-6">{comData.map(item)}</ol>}
          {semData.length > 0 && (
            <section aria-label="Movimentações sem data" className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">Sem data (para preencher)</h3>
              <ol className="relative space-y-4 border-l border-dashed border-border pl-6">{semData.map(item)}</ol>
            </section>
          )}
        </>
      )}

      {(alteracoes?.length ?? 0) > 0 && (
        <Collapsible>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-1 px-2 text-muted-foreground">
              <ChevronDown className="h-4 w-4" aria-hidden="true" />
              Correções e exclusões ({alteracoes!.length})
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <ul className="mt-2 space-y-3 rounded-md border border-border p-3 text-sm">
              {alteracoes!.map((h) => (
                <li key={h.id} className="space-y-0.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge tom={h.acao === "exclusao" ? "erro" : "neutro"} icone={false}>
                      {h.acao === "exclusao" ? "Excluída" : "Corrigida"}
                    </StatusBadge>
                    <span className="text-muted-foreground">{formatDateBR(dataDoRegistro(h.feito_em))}</span>
                  </div>
                  <p>Motivo: {h.motivo}</p>
                  <p className="text-muted-foreground">Antes: {resumo(h.antes)}</p>
                  {h.depois && <p className="text-muted-foreground">Depois: {resumo(h.depois)}</p>}
                </li>
              ))}
            </ul>
          </CollapsibleContent>
        </Collapsible>
      )}

      <Dialog open={!!excluir} onOpenChange={(aberto) => !aberto && setExcluir(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{excluir && excluir.length > 1 ? `Excluir ${excluir.length} movimentações` : "Excluir movimentação"}</DialogTitle>
            <DialogDescription>
              A movimentação sai da linha do tempo e deixa de contar para o setor, a situação e os dias parado. Ela fica
              guardada em "Correções e exclusões", com o motivo.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="motivo-exclusao">Motivo *</Label>
            <Textarea id="motivo-exclusao" rows={3} value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Ex.: registro duplicado" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExcluir(null)}>Voltar</Button>
            <Button variant="destructive" onClick={confirmar} disabled={excluindo || motivo.trim().length < MOTIVO_MINIMO}>Excluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
