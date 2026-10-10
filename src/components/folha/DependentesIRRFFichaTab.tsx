/**
 * Aba Dependentes IRRF da ficha financeira: dependentes ativos do servidor com badge de
 * vigência na competência da folha, inclusão/edição/inativação (sem DELETE) e aviso quando a
 * quantidade vigente difere da gravada na ficha (só o reprocessamento atualiza o IRRF).
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertTriangle, Loader2, Pencil, Plus, UserMinus } from "lucide-react";
import { useDependentesIRRF, useSaveDependenteIRRF, type DependenteIRRFRow } from "@/hooks/useFolhaPagamento";
import { contarDependentesVigentes, dependenteVigenteNaCompetencia } from "@/lib/folhaFichaRegras";
import { formatCPF, formatDateBR } from "@/lib/formatters";
import { MESES, TIPO_DEPENDENTE_LABELS } from "@/types/folha";
import { DependenteIRRFFormDialog } from "./DependenteIRRFFormDialog";

interface DependentesIRRFFichaTabProps {
  servidorId: string;
  competenciaAno: number;
  competenciaMes: number;
  /** `fichas_financeiras.quantidade_dependentes` gravado no último processamento. */
  quantidadeNaFicha: number | null | undefined;
  podeEditar: boolean;
}

export function DependentesIRRFFichaTab({
  servidorId,
  competenciaAno,
  competenciaMes,
  quantidadeNaFicha,
  podeEditar,
}: DependentesIRRFFichaTabProps) {
  const [formAberto, setFormAberto] = useState(false);
  const [emEdicao, setEmEdicao] = useState<DependenteIRRFRow | null>(null);
  const [inativando, setInativando] = useState<DependenteIRRFRow | null>(null);

  const { data: dependentes, isLoading } = useDependentesIRRF(servidorId);
  const salvar = useSaveDependenteIRRF();

  const lista = dependentes ?? [];
  const vigentes = contarDependentesVigentes(lista, competenciaAno, competenciaMes);
  const naFicha = quantidadeNaFicha ?? 0;
  const divergente = vigentes !== naFicha;
  const competencia = `${MESES[competenciaMes - 1]}/${competenciaAno}`;

  const confirmarInativacao = async () => {
    if (!inativando) return;
    try {
      await salvar.mutateAsync({ id: inativando.id, servidor_id: servidorId, ativo: false });
    } catch {
      // Toast de erro já emitido pelo hook (descreverErroBanco).
    } finally {
      setInativando(null);
    }
  };

  return (
    <div className="space-y-4">
      <Alert variant={divergente ? "destructive" : "default"}>
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>
          A ficha tem {naFicha} dependente(s); há {vigentes} vigente(s) em {competencia}
        </AlertTitle>
        <AlertDescription>
          {divergente
            ? "A dedução de IRRF gravada na ficha está desatualizada. Reprocesse a folha para aplicar (isso apaga itens lançados manualmente)."
            : "Dependentes editados aqui só refletem no IRRF da ficha ao reprocessar a folha."}
        </AlertDescription>
      </Alert>

      <div className="flex items-center justify-end">
        {podeEditar && (
          <Button
            size="sm"
            onClick={() => {
              setEmEdicao(null);
              setFormAberto(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Novo dependente
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : lista.length === 0 ? (
        <p className="text-sm text-muted-foreground py-6 text-center">Nenhum dependente ativo cadastrado para este servidor.</p>
      ) : (
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>CPF</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Nascimento</TableHead>
                <TableHead>Dedução</TableHead>
                <TableHead className="text-center">Vigência</TableHead>
                {podeEditar && <TableHead className="text-center">Ações</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {lista.map((d) => {
                const vigente = dependenteVigenteNaCompetencia(d, competenciaAno, competenciaMes);
                return (
                  <TableRow key={d.id}>
                    <TableCell className="font-medium">{d.nome}</TableCell>
                    <TableCell className="font-mono text-xs">{d.cpf ? formatCPF(d.cpf) : "-"}</TableCell>
                    <TableCell>{TIPO_DEPENDENTE_LABELS[d.tipo_dependente] ?? d.tipo_dependente}</TableCell>
                    <TableCell>{formatDateBR(d.data_nascimento)}</TableCell>
                    <TableCell className="text-xs">
                      {d.deduz_irrf === false ? (
                        <span className="text-muted-foreground">Não deduz</span>
                      ) : (
                        <>
                          {formatDateBR(d.data_inicio_deducao)}
                          {d.data_fim_deducao ? ` a ${formatDateBR(d.data_fim_deducao)}` : " em diante"}
                        </>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {vigente ? <Badge>Vigente</Badge> : <Badge variant="outline">Não vigente</Badge>}
                    </TableCell>
                    {podeEditar && (
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Editar"
                            onClick={() => {
                              setEmEdicao(d);
                              setFormAberto(true);
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" title="Inativar" onClick={() => setInativando(d)}>
                            <UserMinus className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <DependenteIRRFFormDialog open={formAberto} onOpenChange={setFormAberto} servidorId={servidorId} dependente={emEdicao} />

      <AlertDialog open={!!inativando} onOpenChange={(aberto) => !aberto && !salvar.isPending && setInativando(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Inativar dependente</AlertDialogTitle>
            <AlertDialogDescription>
              {inativando?.nome} deixa de aparecer na lista e de contar no IRRF a partir do próximo processamento. O registro
              é mantido (não há exclusão).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={salvar.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void confirmarInativacao();
              }}
              disabled={salvar.isPending}
            >
              {salvar.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Inativar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
