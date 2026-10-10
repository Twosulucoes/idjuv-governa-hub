/**
 * Grade servidor × etapas do fechamento (assinado / validado / consolidado / reaberto)
 * com ações por linha e seleção para consolidar em lote.
 *
 * Regras em @/lib/frequenciaFluxo: chefia valida o que ainda não validou (ou o reaberto);
 * RH consolida depois da chefia; reabrir só o consolidado e sempre com justificativa.
 * Etapa da chefia só com `podeChefia`, etapas do RH só com `podeRH`; ninguém mexe no
 * próprio fechamento (`meuServidorId`).
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Loader2, Users, CheckCircle, Circle, UserCheck, ShieldCheck, Unlock } from "lucide-react";
import type { FrequenciaFechamento } from "@/types/frequencia";
import { podeConsolidarRH, podeReabrir, podeValidarChefia, type RegrasReabertura } from "@/lib/frequenciaFluxo";

export interface LinhaFechamento {
  servidor_id: string;
  nome: string;
  matricula?: string;
  unidade?: string;
  unidade_id?: string;
  fechamento: FrequenciaFechamento | null;
}

interface GradeFechamentoTableProps {
  linhas: LinhaFechamento[];
  isLoading?: boolean;
  processando?: boolean;
  regrasReabertura?: RegrasReabertura;
  /** Servidor vinculado ao usuário logado: a própria linha não tem ações nem seleção. */
  meuServidorId?: string;
  podeChefia?: boolean;
  podeRH?: boolean;
  selecionados: string[];
  onSelecionadosChange: (ids: string[]) => void;
  onValidarChefia: (servidorId: string) => void;
  onConsolidarRH: (servidorId: string) => void;
  onReabrir: (servidorId: string, justificativa: string) => Promise<unknown>;
}

function Etapa({ feita, quando }: { feita: boolean; quando?: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      {feita ? <CheckCircle className="h-4 w-4 text-success" /> : <Circle className="h-4 w-4 text-muted-foreground/50" />}
      {feita && quando && (
        <span className="text-[10px] text-muted-foreground">{new Date(quando).toLocaleDateString("pt-BR")}</span>
      )}
    </div>
  );
}

export function GradeFechamentoTable({
  linhas,
  isLoading,
  processando,
  regrasReabertura,
  meuServidorId,
  podeChefia = false,
  podeRH = false,
  selecionados,
  onSelecionadosChange,
  onValidarChefia,
  onConsolidarRH,
  onReabrir,
}: GradeFechamentoTableProps) {
  const [reabrindo, setReabrindo] = useState<LinhaFechamento | null>(null);
  const [justificativa, setJustificativa] = useState("");

  const ehPropria = (l: LinhaFechamento) => !!meuServidorId && l.servidor_id === meuServidorId;
  const consolidaveis = linhas
    .filter((l) => podeRH && !ehPropria(l) && podeConsolidarRH(l.fechamento))
    .map((l) => l.servidor_id);
  const todosSelecionados = consolidaveis.length > 0 && consolidaveis.every((id) => selecionados.includes(id));

  const alternarTodos = (marcar: boolean) => onSelecionadosChange(marcar ? consolidaveis : []);
  const alternar = (id: string, marcar: boolean) =>
    onSelecionadosChange(marcar ? [...selecionados, id] : selecionados.filter((s) => s !== id));

  const confirmarReabertura = async () => {
    if (!reabrindo || justificativa.trim().length < 5) return;
    try {
      await onReabrir(reabrindo.servidor_id, justificativa.trim());
      setReabrindo(null);
      setJustificativa("");
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

  if (linhas.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>Nenhum servidor encontrado.</p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  checked={todosSelecionados}
                  disabled={consolidaveis.length === 0}
                  onCheckedChange={(v) => alternarTodos(v === true)}
                  aria-label="Selecionar todos os consolidáveis"
                />
              </TableHead>
              <TableHead>Servidor</TableHead>
              <TableHead>Unidade</TableHead>
              <TableHead className="text-center">Assinado</TableHead>
              <TableHead className="text-center">Chefia</TableHead>
              <TableHead className="text-center">RH</TableHead>
              <TableHead className="text-center">Reaberto</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {linhas.map((l) => {
              const f = l.fechamento;
              const propria = ehPropria(l);
              const consolidavel = consolidaveis.includes(l.servidor_id);
              return (
                <TableRow key={l.servidor_id}>
                  <TableCell>
                    <Checkbox
                      checked={selecionados.includes(l.servidor_id)}
                      disabled={!consolidavel}
                      onCheckedChange={(v) => alternar(l.servidor_id, v === true)}
                      aria-label={`Selecionar ${l.nome}`}
                    />
                  </TableCell>
                  <TableCell>
                    <p className="font-medium">{l.nome}</p>
                    {l.matricula && <p className="text-xs text-muted-foreground font-mono">{l.matricula}</p>}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{l.unidade || "-"}</TableCell>
                  <TableCell className="text-center">
                    <Etapa feita={!!f?.assinado_servidor} quando={f?.assinado_servidor_em} />
                  </TableCell>
                  <TableCell className="text-center">
                    <Etapa feita={!!f?.validado_chefia} quando={f?.validado_chefia_em} />
                  </TableCell>
                  <TableCell className="text-center">
                    <Etapa feita={!!f?.consolidado_rh} quando={f?.consolidado_rh_em} />
                  </TableCell>
                  <TableCell className="text-center">
                    {f?.reaberto ? (
                      <Badge variant="outline" className="bg-warning/15 text-warning border-warning/30" title={f.justificativa_reabertura}>
                        Reaberto
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {propria ? (
                      <span className="text-xs text-muted-foreground">Seu próprio fechamento</span>
                    ) : (
                    <div className="flex justify-end gap-1 flex-wrap">
                      {podeChefia && podeValidarChefia(f) && (
                        <Button size="sm" variant="outline" disabled={processando} onClick={() => onValidarChefia(l.servidor_id)}>
                          <UserCheck className="mr-1 h-4 w-4" />
                          Validar (chefia)
                        </Button>
                      )}
                      {consolidavel && (
                        <Button size="sm" disabled={processando} onClick={() => onConsolidarRH(l.servidor_id)}>
                          <ShieldCheck className="mr-1 h-4 w-4" />
                          Consolidar (RH)
                        </Button>
                      )}
                      {podeRH && podeReabrir(f, regrasReabertura) && (
                        <Button size="sm" variant="ghost" disabled={processando} onClick={() => setReabrindo(l)}>
                          <Unlock className="mr-1 h-4 w-4" />
                          Reabrir
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

      <Dialog open={!!reabrindo} onOpenChange={(o) => { if (!o) { setReabrindo(null); setJustificativa(""); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reabrir frequência</DialogTitle>
            <DialogDescription>
              {reabrindo?.nome}: a frequência volta a aceitar lançamentos e precisará ser consolidada de novo.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="justificativa-reabertura">Justificativa (obrigatória)</Label>
            <Textarea
              id="justificativa-reabertura"
              rows={3}
              value={justificativa}
              onChange={(e) => setJustificativa(e.target.value)}
              placeholder="Por que esta frequência está sendo reaberta?"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setReabrindo(null); setJustificativa(""); }}>
              Cancelar
            </Button>
            <Button disabled={justificativa.trim().length < 5 || processando} onClick={confirmarReabertura}>
              {processando ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Reabrir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
