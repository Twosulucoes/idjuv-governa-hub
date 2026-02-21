/**
 * Formulário de Liquidação - Dialog
 */

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useCriarLiquidacao, useEmpenhos } from "@/hooks/useFinanceiro";
import { formatCurrency } from "@/lib/formatters";

interface LiquidacaoFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  empenhoIdPadrao?: string;
}

export default function LiquidacaoFormDialog({ open, onOpenChange, empenhoIdPadrao }: LiquidacaoFormDialogProps) {
  const criarLiquidacao = useCriarLiquidacao();
  const { data: empenhos } = useEmpenhos({ status: undefined });

  // Empenhos com saldo a liquidar
  const empenhosDisponiveis = empenhos?.filter(
    (e) => e.status !== "anulado" && e.status !== "pago" && Number(e.saldo_liquidar) > 0
  );

  const [form, setForm] = useState({
    empenho_id: empenhoIdPadrao || "",
    tipo_documento: "nota_fiscal",
    numero_documento: "",
    serie_documento: "",
    data_documento: new Date().toISOString().split("T")[0],
    chave_nfe: "",
    valor_documento: "",
    valor_liquidado: "",
    retencao_inss: "",
    retencao_irrf: "",
    retencao_iss: "",
    outras_retencoes: "",
    observacoes: "",
  });

  const empenhoSelecionado = empenhos?.find((e) => e.id === form.empenho_id);

  const valorRetencoes =
    (Number(form.retencao_inss) || 0) +
    (Number(form.retencao_irrf) || 0) +
    (Number(form.retencao_iss) || 0) +
    (Number(form.outras_retencoes) || 0);

  const resetForm = () => {
    setForm({
      empenho_id: "",
      tipo_documento: "nota_fiscal",
      numero_documento: "",
      serie_documento: "",
      data_documento: new Date().toISOString().split("T")[0],
      chave_nfe: "",
      valor_documento: "",
      valor_liquidado: "",
      retencao_inss: "",
      retencao_irrf: "",
      retencao_iss: "",
      outras_retencoes: "",
      observacoes: "",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await criarLiquidacao.mutateAsync({
      empenho_id: form.empenho_id,
      tipo_documento: form.tipo_documento,
      numero_documento: form.numero_documento.trim(),
      serie_documento: form.serie_documento.trim() || undefined,
      data_documento: form.data_documento,
      chave_nfe: form.chave_nfe.trim() || undefined,
      valor_documento: Number(form.valor_documento),
      valor_liquidado: Number(form.valor_liquidado),
      valor_retencoes: valorRetencoes,
      retencao_inss: Number(form.retencao_inss) || 0,
      retencao_irrf: Number(form.retencao_irrf) || 0,
      retencao_iss: Number(form.retencao_iss) || 0,
      outras_retencoes: Number(form.outras_retencoes) || 0,
      observacoes: form.observacoes.trim() || undefined,
    });
    resetForm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Liquidação</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Empenho */}
          <div className="space-y-2">
            <Label>Empenho *</Label>
            <Select value={form.empenho_id} onValueChange={(v) => setForm((f) => ({ ...f, empenho_id: v }))}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o empenho" />
              </SelectTrigger>
              <SelectContent>
                {empenhosDisponiveis?.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.numero} — {(e.fornecedor as any)?.razao_social} — Saldo: {formatCurrency(Number(e.saldo_liquidar))}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {empenhoSelecionado && (
              <p className="text-xs text-muted-foreground">
                Objeto: {empenhoSelecionado.objeto} | Saldo a liquidar:{" "}
                <strong>{formatCurrency(Number(empenhoSelecionado.saldo_liquidar))}</strong>
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Tipo Documento */}
            <div className="space-y-2">
              <Label>Tipo de Documento *</Label>
              <Select value={form.tipo_documento} onValueChange={(v) => setForm((f) => ({ ...f, tipo_documento: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nota_fiscal">Nota Fiscal</SelectItem>
                  <SelectItem value="fatura">Fatura</SelectItem>
                  <SelectItem value="recibo">Recibo</SelectItem>
                  <SelectItem value="folha_pagamento">Folha de Pagamento</SelectItem>
                  <SelectItem value="guia_recolhimento">Guia de Recolhimento</SelectItem>
                  <SelectItem value="outros">Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Nº Documento */}
            <div className="space-y-2">
              <Label>Nº do Documento *</Label>
              <Input
                placeholder="Número"
                value={form.numero_documento}
                onChange={(e) => setForm((f) => ({ ...f, numero_documento: e.target.value }))}
                required
                maxLength={50}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Data Documento */}
            <div className="space-y-2">
              <Label>Data do Documento *</Label>
              <Input
                type="date"
                value={form.data_documento}
                onChange={(e) => setForm((f) => ({ ...f, data_documento: e.target.value }))}
                required
              />
            </div>

            {/* Chave NFe */}
            <div className="space-y-2">
              <Label>Chave NF-e</Label>
              <Input
                placeholder="44 dígitos"
                value={form.chave_nfe}
                onChange={(e) => setForm((f) => ({ ...f, chave_nfe: e.target.value }))}
                maxLength={44}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Valor Documento */}
            <div className="space-y-2">
              <Label>Valor do Documento (R$) *</Label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                value={form.valor_documento}
                onChange={(e) => setForm((f) => ({ ...f, valor_documento: e.target.value }))}
                required
              />
            </div>

            {/* Valor Liquidado */}
            <div className="space-y-2">
              <Label>Valor a Liquidar (R$) *</Label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                value={form.valor_liquidado}
                onChange={(e) => setForm((f) => ({ ...f, valor_liquidado: e.target.value }))}
                required
              />
            </div>
          </div>

          {/* Retenções */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Retenções</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">INSS</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  value={form.retencao_inss}
                  onChange={(e) => setForm((f) => ({ ...f, retencao_inss: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">IRRF</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  value={form.retencao_irrf}
                  onChange={(e) => setForm((f) => ({ ...f, retencao_irrf: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">ISS</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  value={form.retencao_iss}
                  onChange={(e) => setForm((f) => ({ ...f, retencao_iss: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Outras</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  value={form.outras_retencoes}
                  onChange={(e) => setForm((f) => ({ ...f, outras_retencoes: e.target.value }))}
                />
              </div>
            </div>
            {valorRetencoes > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                Total de retenções: <strong>{formatCurrency(valorRetencoes)}</strong> |
                Valor líquido: <strong>{formatCurrency((Number(form.valor_liquidado) || 0) - valorRetencoes)}</strong>
              </p>
            )}
          </div>

          {/* Observações */}
          <div className="space-y-2">
            <Label>Observações</Label>
            <Textarea
              placeholder="Observações adicionais..."
              value={form.observacoes}
              onChange={(e) => setForm((f) => ({ ...f, observacoes: e.target.value }))}
              rows={2}
              maxLength={1000}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={
                !form.empenho_id || !form.numero_documento || !form.valor_liquidado || criarLiquidacao.isPending
              }
            >
              {criarLiquidacao.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Registrar Liquidação
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
