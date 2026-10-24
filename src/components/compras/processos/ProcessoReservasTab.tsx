/**
 * Reservas do processo por natureza do QDD: quanto se reservou, quanto já chegou ao FIPLAN (PED autorizado ou empenho)
 * e o pendente, que é o que ainda ocupa o saldo livre. Reserva não se apaga: cancela-se com motivo.
 */

import { useState } from "react";
import { Ban, Pencil, PiggyBank, Plus } from "lucide-react";
import { DataTable, StatusBadge, type ColunaTabela } from "@/components/design-system";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatarNatureza } from "@/lib/financeiro/painelExecucao";
import { formatCurrency } from "@/lib/formatters";
import type { ReservaDoProcesso } from "@/hooks/useProcessosContratacao";

interface Props {
  reservas: ReservaDoProcesso[] | undefined;
  carregando: boolean;
  erro: boolean;
  aoTentarNovamente: () => void;
  podeEditar: boolean;
  aoNovaReserva: () => void;
  aoEditar: (r: ReservaDoProcesso) => void;
  cancelando?: boolean;
  aoCancelar: (r: ReservaDoProcesso, motivo: string) => Promise<unknown>;
}

const colunas: ColunaTabela<ReservaDoProcesso>[] = [
  {
    id: "natureza",
    cabecalho: "Natureza",
    celula: (r) => (
      <span>
        <span className="font-medium">{formatarNatureza(r.natureza_codigo)}</span>
        <span className="block text-muted-foreground">{r.natureza_nome}</span>
      </span>
    ),
    ordenarPor: (r) => r.natureza_codigo,
    mobile: "titulo",
    className: "min-w-[12rem]",
  },
  {
    id: "acao",
    cabecalho: "Ação · fonte",
    celula: (r) => (
      <span className="whitespace-nowrap">
        {r.acao_codigo} · {r.fonte_codigo}
        <span className="block text-muted-foreground">{r.exercicio}</span>
      </span>
    ),
    ordenarPor: (r) => r.exercicio,
  },
  { id: "valor", cabecalho: "Reservado", celula: (r) => <span className="whitespace-nowrap">{formatCurrency(r.valor)}</span>, ordenarPor: (r) => r.valor, alinhamento: "direita" },
  {
    id: "materializado",
    cabecalho: "Já no FIPLAN",
    celula: (r) => <span className="whitespace-nowrap">{formatCurrency(r.materializado)}</span>,
    ordenarPor: (r) => r.materializado,
    alinhamento: "direita",
  },
  {
    id: "pendente",
    cabecalho: "Pendente",
    celula: (r) => (r.situacao === "cancelada" ? "—" : <span className="whitespace-nowrap">{formatCurrency(r.pendente)}</span>),
    ordenarPor: (r) => r.pendente,
    alinhamento: "direita",
  },
  {
    id: "saldo",
    cabecalho: "Saldo livre hoje",
    celula: (r) =>
      r.saldo_livre === null ? (
        <span className="text-muted-foreground">sem QDD</span>
      ) : (
        <span className={r.saldo_livre < 0 ? "whitespace-nowrap font-medium text-destructive" : "whitespace-nowrap"}>{formatCurrency(r.saldo_livre)}</span>
      ),
    alinhamento: "direita",
  },
  {
    id: "situacao",
    cabecalho: "Situação",
    celula: (r) =>
      r.situacao === "cancelada" ? (
        <StatusBadge tom="neutro" icone={false}>Cancelada</StatusBadge>
      ) : r.justificativa_saldo ? (
        <span title={r.justificativa_saldo}><StatusBadge tom="pendente" icone={false}>Sem saldo (justificada)</StatusBadge></span>
      ) : (
        <StatusBadge tom="sucesso" icone={false}>Reservada</StatusBadge>
      ),
  },
];

export function ProcessoReservasTab({
  reservas,
  carregando,
  erro,
  aoTentarNovamente,
  podeEditar,
  aoNovaReserva,
  aoEditar,
  cancelando,
  aoCancelar,
}: Props) {
  const [cancelar, setCancelar] = useState<ReservaDoProcesso | null>(null);
  const [motivo, setMotivo] = useState("");
  const ativas = (reservas ?? []).filter((r) => r.situacao === "reservada");
  const total = ativas.reduce((s, r) => s + r.valor, 0);
  const pendente = ativas.reduce((s, r) => s + r.pendente, 0);

  const confirmar = async () => {
    if (!cancelar || motivo.trim().length < 5) return;
    try {
      await aoCancelar(cancelar, motivo.trim());
      setCancelar(null);
    } catch {
      // erro já exibido pelo toast da mutation
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {ativas.length > 0
            ? `Reservado ${formatCurrency(total)}; ainda pendente de PED ou empenho: ${formatCurrency(pendente)}.`
            : "Reserve o valor do processo na natureza do QDD para o Financeiro saber que ele já está programado."}
        </p>
        {podeEditar && (
          <Button onClick={aoNovaReserva}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Nova reserva
          </Button>
        )}
      </div>

      <DataTable
        rotulo="Reservas do processo"
        dados={reservas ?? []}
        colunas={colunas}
        chaveLinha={(r) => r.id}
        carregando={carregando}
        erro={erro ? "Não foi possível carregar as reservas." : null}
        aoTentarNovamente={aoTentarNovamente}
        acoesLinha={
          podeEditar
            ? (r) =>
                r.situacao === "reservada" ? (
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => aoEditar(r)} aria-label="Editar reserva">
                      <Pencil className="h-4 w-4" aria-hidden="true" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setMotivo("");
                        setCancelar(r);
                      }}
                      aria-label="Cancelar reserva"
                    >
                      <Ban className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </div>
                ) : null
            : undefined
        }
        vazio={{
          icone: PiggyBank,
          titulo: "Nenhuma reserva",
          descricao: podeEditar ? "Use \"Nova reserva\" para separar o valor numa natureza do QDD." : "Compras ainda não reservou valor para este processo.",
        }}
      />

      <Dialog open={!!cancelar} onOpenChange={(aberto) => !aberto && setCancelar(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Cancelar reserva</DialogTitle>
            <DialogDescription>
              {cancelar && `${formatarNatureza(cancelar.natureza_codigo)} · ${formatCurrency(cancelar.valor)}. O valor volta ao saldo livre da natureza.`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="motivo-cancelamento">Motivo *</Label>
            <Textarea id="motivo-cancelamento" rows={3} value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Ex.: processo mudou de natureza" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelar(null)}>Voltar</Button>
            <Button variant="destructive" onClick={confirmar} disabled={cancelando || motivo.trim().length < 5}>Cancelar reserva</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
