/**
 * Fila de solicitações de abono para chefia e RH.
 *
 * Encadeamento (regras em @/lib/frequenciaFluxo): chefia aprova o pendente;
 * RH aprova depois da chefia (ou direto, se o tipo de abono dispensa a chefia);
 * rejeitar exige motivo. No banco, UPDATE exige o módulo RH e `rh.aprovar` ou
 * `rh.frequencia.lancar`, nunca na própria linha; o trigger `validar_etapa_frequencia` confere a etapa.
 *
 * Quem age: etapa da chefia só com `podeChefia` (rh.aprovar), etapa do RH só com
 * `podeRH` (rh.frequencia.lancar). Rejeitar depois do aval da chefia é etapa do RH (o banco
 * nega a chefia). Ninguém decide sobre a própria solicitação.
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Inbox, UserCheck, ShieldCheck, XCircle } from "lucide-react";
import type { SolicitacaoAbono } from "@/types/frequencia";
import { chefiaEncerraFluxo, formatarPeriodoAbono, podeAprovarChefia, podeAprovarRH, podeRejeitar } from "@/lib/frequenciaFluxo";
import { StatusAbonoBadge } from "@/components/frequencia/MinhasSolicitacoesAbonoTable";

interface FilaAbonosTableProps {
  solicitacoes: SolicitacaoAbono[];
  isLoading?: boolean;
  processando?: boolean;
  /** Servidor vinculado ao usuário logado: a própria solicitação não tem ações. */
  meuServidorId?: string;
  podeChefia?: boolean;
  podeRH?: boolean;
  onAprovarChefia: (s: SolicitacaoAbono, encerra: boolean) => void;
  onAprovarRH: (s: SolicitacaoAbono) => void;
  onRejeitar: (s: SolicitacaoAbono, motivo: string) => Promise<unknown>;
}

export function FilaAbonosTable({
  solicitacoes,
  isLoading,
  processando,
  meuServidorId,
  podeChefia = false,
  podeRH = false,
  onAprovarChefia,
  onAprovarRH,
  onRejeitar,
}: FilaAbonosTableProps) {
  const [rejeitando, setRejeitando] = useState<SolicitacaoAbono | null>(null);
  const [motivo, setMotivo] = useState("");

  const confirmarRejeicao = async () => {
    if (!rejeitando || motivo.trim().length < 5) return;
    try {
      await onRejeitar(rejeitando, motivo.trim());
      setRejeitando(null);
      setMotivo("");
    } catch {
      // toast já emitido pelo hook; o diálogo fica aberto para nova tentativa
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (solicitacoes.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Inbox className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>Nenhuma solicitação de abono com esse filtro.</p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Servidor</TableHead>
              <TableHead>Unidade</TableHead>
              <TableHead>Período</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Justificativa</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {solicitacoes.map((s) => {
              const encerraNaChefia = chefiaEncerraFluxo(s);
              const propria = !!meuServidorId && s.servidor_id === meuServidorId;
              return (
                <TableRow key={s.id}>
                  <TableCell>
                    <p className="font-medium">{s.servidor?.nome_completo ?? "-"}</p>
                    {s.servidor?.matricula && (
                      <p className="text-xs text-muted-foreground font-mono">{s.servidor.matricula}</p>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {s.servidor?.unidade?.sigla || s.servidor?.unidade?.nome || "-"}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">{formatarPeriodoAbono(s)}</TableCell>
                  <TableCell>
                    <p>{s.tipo_abono?.nome ?? "-"}</p>
                    {s.tipo_abono && (
                      <p className="text-xs text-muted-foreground">
                        {[
                          s.tipo_abono.exige_aprovacao_chefia ? "chefia" : null,
                          s.tipo_abono.exige_aprovacao_rh ? "RH" : null,
                        ]
                          .filter(Boolean)
                          .join(" + ") || "sem aprovação"}
                      </p>
                    )}
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <p className="truncate" title={s.justificativa}>{s.justificativa}</p>
                    {s.status === "rejeitado" && s.motivo_rejeicao && (
                      <p className="text-xs text-destructive mt-1">Motivo: {s.motivo_rejeicao}</p>
                    )}
                  </TableCell>
                  <TableCell>
                    <StatusAbonoBadge status={s.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    {propria ? (
                      <span className="text-xs text-muted-foreground">Sua própria solicitação</span>
                    ) : (
                    <div className="flex justify-end gap-1 flex-wrap">
                      {podeChefia && podeAprovarChefia(s) && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={processando}
                          onClick={() => onAprovarChefia(s, encerraNaChefia)}
                          title={encerraNaChefia ? "Este tipo dispensa o RH: a aprovação da chefia encerra o fluxo" : undefined}
                        >
                          <UserCheck className="mr-1 h-4 w-4" />
                          Aprovar (chefia)
                        </Button>
                      )}
                      {podeRH && podeAprovarRH(s) && (
                        <Button size="sm" disabled={processando} onClick={() => onAprovarRH(s)}>
                          <ShieldCheck className="mr-1 h-4 w-4" />
                          Aprovar (RH)
                        </Button>
                      )}
                      {(podeRH || (podeChefia && s.status === "pendente")) && podeRejeitar(s) && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          disabled={processando}
                          onClick={() => setRejeitando(s)}
                        >
                          <XCircle className="mr-1 h-4 w-4" />
                          Rejeitar
                        </Button>
                      )}
                    </div>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!rejeitando} onOpenChange={(o) => { if (!o) { setRejeitando(null); setMotivo(""); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Rejeitar solicitação</DialogTitle>
            <DialogDescription>
              {rejeitando?.servidor?.nome_completo} · {rejeitando ? formatarPeriodoAbono(rejeitando) : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="motivo-rejeicao">Motivo (obrigatório)</Label>
            <Textarea
              id="motivo-rejeicao"
              rows={3}
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Explique ao servidor por que a solicitação foi rejeitada..."
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setRejeitando(null); setMotivo(""); }}>
              Cancelar
            </Button>
            <Button variant="destructive" disabled={motivo.trim().length < 5 || processando} onClick={confirmarRejeicao}>
              {processando ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Rejeitar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
