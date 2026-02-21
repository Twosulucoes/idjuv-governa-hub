/**
 * Formulário de Pagamento - Dialog
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
import { useCriarPagamento, useLiquidacoes, useContasBancarias } from "@/hooks/useFinanceiro";
import { formatCurrency } from "@/lib/formatters";
import { FORMA_PAGAMENTO_OPTIONS } from "@/types/financeiro";

interface PagamentoFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function PagamentoFormDialog({ open, onOpenChange }: PagamentoFormDialogProps) {
  const criarPagamento = useCriarPagamento();
  const { data: liquidacoes } = useLiquidacoes({ status: "aprovada" });
  const { data: contas } = useContasBancarias();

  const [form, setForm] = useState({
    liquidacao_id: "",
    conta_bancaria_id: "",
    forma_pagamento: "ted",
    valor_bruto: "",
    valor_retencoes: "",
    banco_favorecido: "",
    agencia_favorecido: "",
    conta_favorecido: "",
    tipo_conta_favorecido: "corrente",
    observacoes: "",
  });

  const liquidacaoSelecionada = liquidacoes?.find((l) => l.id === form.liquidacao_id);

  const valorLiquido = (Number(form.valor_bruto) || 0) - (Number(form.valor_retencoes) || 0);

  const resetForm = () => {
    setForm({
      liquidacao_id: "",
      conta_bancaria_id: "",
      forma_pagamento: "ted",
      valor_bruto: "",
      valor_retencoes: "",
      banco_favorecido: "",
      agencia_favorecido: "",
      conta_favorecido: "",
      tipo_conta_favorecido: "corrente",
      observacoes: "",
    });
  };

  const handleSelectLiquidacao = (id: string) => {
    const liq = liquidacoes?.find((l) => l.id === id);
    setForm((f) => ({
      ...f,
      liquidacao_id: id,
      valor_bruto: liq ? String(liq.valor_liquidado) : "",
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const liq = liquidacoes?.find((l) => l.id === form.liquidacao_id);
    if (!liq) return;

    await criarPagamento.mutateAsync({
      liquidacao_id: form.liquidacao_id,
      empenho_id: liq.empenho_id,
      conta_bancaria_id: form.conta_bancaria_id,
      fornecedor_id: (liq.empenho as any)?.fornecedor?.id || undefined,
      forma_pagamento: form.forma_pagamento,
      valor_bruto: Number(form.valor_bruto),
      valor_retencoes: Number(form.valor_retencoes) || 0,
      banco_favorecido: form.banco_favorecido.trim() || undefined,
      agencia_favorecido: form.agencia_favorecido.trim() || undefined,
      conta_favorecido: form.conta_favorecido.trim() || undefined,
      tipo_conta_favorecido: form.tipo_conta_favorecido || undefined,
      observacoes: form.observacoes.trim() || undefined,
    });
    resetForm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Pagamento</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Liquidação */}
          <div className="space-y-2">
            <Label>Liquidação *</Label>
            <Select value={form.liquidacao_id} onValueChange={handleSelectLiquidacao}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a liquidação aprovada" />
              </SelectTrigger>
              <SelectContent>
                {liquidacoes?.map((l) => (
                  <SelectItem key={l.id} value={l.id}>
                    {l.numero} — Empenho: {(l.empenho as any)?.numero} — {formatCurrency(l.valor_liquidado)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {liquidacaoSelecionada && (
              <p className="text-xs text-muted-foreground">
                Fornecedor: {(liquidacaoSelecionada.empenho as any)?.fornecedor?.razao_social || "—"} |
                Valor liquidado: <strong>{formatCurrency(liquidacaoSelecionada.valor_liquidado)}</strong>
              </p>
            )}
          </div>

          {/* Conta bancária */}
          <div className="space-y-2">
            <Label>Conta Bancária de Saída *</Label>
            <Select value={form.conta_bancaria_id} onValueChange={(v) => setForm((f) => ({ ...f, conta_bancaria_id: v }))}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a conta" />
              </SelectTrigger>
              <SelectContent>
                {contas?.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.nome_conta} — {c.banco_nome} (Saldo: {formatCurrency(c.saldo_atual)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Forma de Pagamento */}
            <div className="space-y-2">
              <Label>Forma de Pagamento *</Label>
              <Select value={form.forma_pagamento} onValueChange={(v) => setForm((f) => ({ ...f, forma_pagamento: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FORMA_PAGAMENTO_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Valor Bruto */}
            <div className="space-y-2">
              <Label>Valor Bruto (R$) *</Label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                value={form.valor_bruto}
                onChange={(e) => setForm((f) => ({ ...f, valor_bruto: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Retenções */}
            <div className="space-y-2">
              <Label>Retenções (R$)</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="0,00"
                value={form.valor_retencoes}
                onChange={(e) => setForm((f) => ({ ...f, valor_retencoes: e.target.value }))}
              />
            </div>

            {/* Valor Líquido (calculado) */}
            <div className="space-y-2">
              <Label>Valor Líquido</Label>
              <Input
                type="text"
                value={formatCurrency(valorLiquido)}
                disabled
                className="bg-muted"
              />
            </div>
          </div>

          {/* Dados bancários do favorecido */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Dados Bancários do Favorecido</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Banco</Label>
                <Input
                  placeholder="Cód. Banco"
                  value={form.banco_favorecido}
                  onChange={(e) => setForm((f) => ({ ...f, banco_favorecido: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Agência</Label>
                <Input
                  placeholder="Agência"
                  value={form.agencia_favorecido}
                  onChange={(e) => setForm((f) => ({ ...f, agencia_favorecido: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Conta</Label>
                <Input
                  placeholder="Conta"
                  value={form.conta_favorecido}
                  onChange={(e) => setForm((f) => ({ ...f, conta_favorecido: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Tipo</Label>
                <Select value={form.tipo_conta_favorecido} onValueChange={(v) => setForm((f) => ({ ...f, tipo_conta_favorecido: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="corrente">Corrente</SelectItem>
                    <SelectItem value="poupanca">Poupança</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
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
                !form.liquidacao_id || !form.conta_bancaria_id || !form.valor_bruto || criarPagamento.isPending
              }
            >
              {criarPagamento.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Programar Pagamento
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
