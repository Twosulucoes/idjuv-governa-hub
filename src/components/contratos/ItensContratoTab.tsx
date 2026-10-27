/**
 * Itens do contrato (itens_contrato): descrição, unidade, quantidade e valor unitário; o total de cada item é calculado
 * pelo banco. Mostra a soma dos itens ao lado do valor do contrato, para conferir. Incluir e alterar exigem
 * contratos.criar ou contratos.editar; apagar, contratos.editar (conferido também no banco).
 */

import { useEffect, useMemo, useState } from "react";
import { ListOrdered, Pencil, Plus, Trash2 } from "lucide-react";
import { DataTable, type ColunaTabela } from "@/components/design-system";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useExcluirItem, useItensContrato, useSalvarItem } from "@/hooks/useContratos";
import { formatCurrency } from "@/lib/formatters";
import { lerNumeroBr } from "@/lib/pca/numero";
import type { ItemContrato } from "@/types/contratos";

const QTD = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 4 });
// sem separador de milhar: "1.234" sem vírgula seria lido como 1,234 por lerNumeroBr
const numeroTexto = (v: number | null | undefined) =>
  v === null || v === undefined ? "" : v.toLocaleString("pt-BR", { maximumFractionDigits: 4, useGrouping: false });

interface Props {
  contratoId: string;
  valorContrato: number;
  podeGravar: boolean;
  podeApagar: boolean;
}

export function ItensContratoTab({ contratoId, valorContrato, podeGravar, podeApagar }: Props) {
  const itens = useItensContrato(contratoId);
  const excluir = useExcluirItem();
  const [editando, setEditando] = useState<ItemContrato | "novo" | null>(null);
  const [apagando, setApagando] = useState<ItemContrato | null>(null);

  const lista = useMemo(() => itens.data ?? [], [itens.data]);
  const soma = Math.round(lista.reduce((s, i) => s + Number(i.valor_total ?? 0), 0) * 100) / 100;
  const diferenca = Math.round((valorContrato - soma) * 100) / 100;
  const proximoNumero = lista.reduce((m, i) => Math.max(m, i.numero_item), 0) + 1;

  const colunas: ColunaTabela<ItemContrato>[] = [
    { id: "numero", cabecalho: "Item", celula: (i) => i.numero_item, ordenarPor: (i) => i.numero_item, alinhamento: "direita" },
    {
      id: "descricao",
      cabecalho: "Descrição",
      celula: (i) => <span className="line-clamp-3">{i.descricao}</span>,
      buscarPor: (i) => i.descricao,
      className: "min-w-[14rem]",
      mobile: "titulo",
    },
    { id: "unidade", cabecalho: "Unid.", celula: (i) => i.unidade_medida },
    { id: "qtd", cabecalho: "Qtd.", celula: (i) => <span className="tabular-nums">{QTD.format(Number(i.quantidade))}</span>, alinhamento: "direita" },
    {
      id: "unitario",
      cabecalho: "Unitário",
      celula: (i) => <span className="tabular-nums">{formatCurrency(Number(i.valor_unitario))}</span>,
      ordenarPor: (i) => Number(i.valor_unitario),
      alinhamento: "direita",
    },
    {
      id: "total",
      cabecalho: "Total",
      celula: (i) => <span className="tabular-nums">{formatCurrency(Number(i.valor_total ?? 0))}</span>,
      ordenarPor: (i) => Number(i.valor_total ?? 0),
      alinhamento: "direita",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          Soma dos itens <span className="font-medium tabular-nums text-foreground">{formatCurrency(soma)}</span> · valor do contrato{" "}
          <span className="font-medium tabular-nums text-foreground">{formatCurrency(valorContrato)}</span>
        </p>
        {podeGravar && (
          <Button size="sm" onClick={() => setEditando("novo")}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Incluir item
          </Button>
        )}
      </div>
      {lista.length > 0 && diferenca !== 0 && (
        <Alert>
          <AlertDescription>
            A soma dos itens {diferenca > 0 ? "fica abaixo" : "passa"} do valor do contrato em {formatCurrency(Math.abs(diferenca))}. Confira os itens ou o valor atual.
          </AlertDescription>
        </Alert>
      )}
      <DataTable
        rotulo="Itens do contrato"
        dados={lista}
        colunas={colunas}
        chaveLinha={(i) => i.id}
        carregando={itens.isLoading}
        erro={itens.isError ? "Não foi possível carregar os itens." : null}
        aoTentarNovamente={() => itens.refetch()}
        acoesLinha={podeGravar ? (i) => (
          <div className="flex justify-end gap-1">
            <Button variant="ghost" size="icon" aria-label={`Editar item ${i.numero_item}`} onClick={() => setEditando(i)}>
              <Pencil className="h-4 w-4" aria-hidden="true" />
            </Button>
            {podeApagar && (
              <Button variant="ghost" size="icon" aria-label={`Apagar item ${i.numero_item}`} onClick={() => setApagando(i)}>
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </Button>
            )}
          </div>
        ) : undefined}
        vazio={{
          icone: ListOrdered,
          titulo: "Nenhum item",
          descricao: podeGravar ? "Inclua os itens como estão no contrato (opcional)." : "O contrato não tem itens registrados.",
        }}
      />

      <ItemDialog item={editando} proximoNumero={proximoNumero} contratoId={contratoId} onClose={() => setEditando(null)} />
      <AlertDialog open={!!apagando} onOpenChange={(v) => !v && setApagando(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apagar o item {apagando?.numero_item}?</AlertDialogTitle>
            <AlertDialogDescription>{apagando?.descricao}. A exclusão fica no histórico do contrato.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction
              disabled={excluir.isPending}
              onClick={() => apagando && excluir.mutate({ id: apagando.id, contrato_id: contratoId })}
            >
              Apagar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ItemDialog({ item, proximoNumero, contratoId, onClose }: { item: ItemContrato | "novo" | null; proximoNumero: number; contratoId: string; onClose: () => void }) {
  const salvar = useSalvarItem();
  const [numero, setNumero] = useState("");
  const [descricao, setDescricao] = useState("");
  const [unidade, setUnidade] = useState("");
  const [quantidade, setQuantidade] = useState("");
  const [unitario, setUnitario] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const existente = item && item !== "novo" ? item : null;

  useEffect(() => {
    if (!item) return;
    setNumero(String(existente?.numero_item ?? proximoNumero));
    setDescricao(existente?.descricao ?? "");
    setUnidade(existente?.unidade_medida ?? "");
    setQuantidade(numeroTexto(existente ? Number(existente.quantidade) : null));
    setUnitario(numeroTexto(existente ? Number(existente.valor_unitario) : null));
    setErro(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reabrir zera o formulário
  }, [item]);

  const qtd = lerNumeroBr(quantidade);
  const vu = lerNumeroBr(unitario);
  const total = Number.isFinite(qtd) && Number.isFinite(vu) ? Math.round(qtd * vu * 100) / 100 : null;

  const gravar = async () => {
    if (!/^\d+$/.test(numero.trim()) || Number(numero) < 1) return setErro("Nº do item: número inteiro a partir de 1.");
    if (descricao.trim().length < 3) return setErro("Descreva o item.");
    if (!unidade.trim()) return setErro("Informe a unidade (ex.: mês, unidade, serviço).");
    if (!Number.isFinite(qtd) || qtd <= 0) return setErro("Quantidade maior que zero (ex.: 12 ou 1,5).");
    if (!Number.isFinite(vu) || vu < 0) return setErro("Valor unitário inválido (ex.: 10.000,00).");
    try {
      await salvar.mutateAsync({
        id: existente?.id,
        contrato_id: contratoId,
        numero_item: Number(numero),
        descricao: descricao.trim(),
        unidade_medida: unidade.trim(),
        quantidade: qtd,
        valor_unitario: vu,
      });
      onClose();
    } catch {
      // erro já exibido pelo toast da mutation
    }
  };

  return (
    <Dialog open={!!item} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{existente ? `Editar item ${existente.numero_item}` : "Incluir item"}</DialogTitle>
          <DialogDescription>Como está na planilha de itens do contrato.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="item-numero">Nº *</Label>
              <Input id="item-numero" inputMode="numeric" value={numero} onChange={(e) => setNumero(e.target.value)} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="item-unidade">Unidade *</Label>
              <Input id="item-unidade" maxLength={20} value={unidade} placeholder="Ex.: mês" onChange={(e) => setUnidade(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="item-descricao">Descrição *</Label>
            <Textarea id="item-descricao" rows={3} maxLength={4000} value={descricao} onChange={(e) => setDescricao(e.target.value)} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="item-qtd">Quantidade *</Label>
              <Input id="item-qtd" inputMode="decimal" value={quantidade} onChange={(e) => setQuantidade(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="item-vu">Valor unitário (R$) *</Label>
              <Input id="item-vu" inputMode="decimal" value={unitario} placeholder="0,00" onChange={(e) => setUnitario(e.target.value)} />
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Total do item: <span className="font-medium tabular-nums text-foreground">{total === null ? "—" : formatCurrency(total)}</span>
          </p>
          {erro && <p className="text-sm font-medium text-destructive" role="alert">{erro}</p>}
        </div>
        <DialogFooter className="gap-2">
          <Button type="button" variant="outline" onClick={onClose}>Voltar</Button>
          <Button onClick={gravar} disabled={salvar.isPending}>{existente ? "Salvar" : "Incluir"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
