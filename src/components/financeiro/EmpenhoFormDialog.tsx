/**
 * Formulário de Empenho - Dialog
 */

import { useState, useEffect } from "react";
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
import { useCriarEmpenho, useDotacoes, useNaturezasDespesa, useFontesRecurso } from "@/hooks/useFinanceiro";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/formatters";
import { validarEmpenho, type CampoEmpenho, type ErrosFormulario } from "@/lib/financeiro/validacaoLancamentos";

interface EmpenhoFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function EmpenhoFormDialog({ open, onOpenChange }: EmpenhoFormDialogProps) {
  const criarEmpenho = useCriarEmpenho();
  const { data: dotacoes } = useDotacoes();
  const { data: naturezas } = useNaturezasDespesa();
  const { data: fontes } = useFontesRecurso();

  const { data: fornecedores } = useQuery({
    queryKey: ["fornecedores_select"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fornecedores")
        .select("id, razao_social, cpf_cnpj")
        .eq("ativo", true)
        .order("razao_social")
        .limit(500);
      if (error) throw error;
      return data;
    },
  });

  const [form, setForm] = useState({
    dotacao_id: "",
    fornecedor_id: "",
    tipo: "ordinario",
    natureza_despesa_id: "",
    fonte_recurso_id: "",
    valor_empenhado: "",
    objeto: "",
    processo_sei: "",
    observacoes: "",
  });

  const [erros, setErros] = useState<ErrosFormulario<CampoEmpenho>>({});
  /** Atualiza o campo e apaga a mensagem dele */
  const mudar = (campo: keyof typeof form, valor: string) => {
    setForm((f) => ({ ...f, [campo]: valor }));
    setErros((e) => ({ ...e, [campo]: undefined }));
  };

  const dotacaoSelecionada = dotacoes?.find((d) => d.id === form.dotacao_id);
  const valorExcedesSaldo = dotacaoSelecionada && Number(form.valor_empenhado) > dotacaoSelecionada.saldo_disponivel;

  const resetForm = () => {
    setForm({
      dotacao_id: "",
      fornecedor_id: "",
      tipo: "ordinario",
      natureza_despesa_id: "",
      fonte_recurso_id: "",
      valor_empenhado: "",
      objeto: "",
      processo_sei: "",
      observacoes: "",
    });
    setErros({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const encontrados = validarEmpenho(form, dotacaoSelecionada?.saldo_disponivel);
    setErros(encontrados);
    if (Object.keys(encontrados).length > 0) return;
    await criarEmpenho.mutateAsync({
      dotacao_id: form.dotacao_id,
      fornecedor_id: form.fornecedor_id,
      tipo: form.tipo as any,
      natureza_despesa_id: form.natureza_despesa_id || undefined,
      fonte_recurso_id: form.fonte_recurso_id || undefined,
      valor_empenhado: Number(form.valor_empenhado),
      objeto: form.objeto.trim(),
      processo_sei: form.processo_sei.trim() || undefined,
      observacoes: form.observacoes.trim() || undefined,
    });
    resetForm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Empenho de contingência</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* Dotação */}
          <div className="space-y-2">
            <Label>Dotação Orçamentária *</Label>
            <Select value={form.dotacao_id} onValueChange={(v) => mudar("dotacao_id", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a dotação" />
              </SelectTrigger>
              <SelectContent>
                {dotacoes?.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.codigo_dotacao} — Saldo: {formatCurrency(d.saldo_disponivel)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {erros.dotacao_id && <p id="erro-dotacao_id" className="text-sm font-medium text-destructive">{erros.dotacao_id}</p>}
            {dotacaoSelecionada && (
              <p className={`text-xs ${valorExcedesSaldo ? 'text-destructive font-semibold' : 'text-muted-foreground'}`}>
                Saldo disponível: <strong>{formatCurrency(dotacaoSelecionada.saldo_disponivel)}</strong>
                {valorExcedesSaldo && ' — Valor excede o saldo disponível!'}
              </p>
            )}
          </div>

          {/* Fornecedor */}
          <div className="space-y-2">
            <Label>Fornecedor / Credor *</Label>
            <Select value={form.fornecedor_id} onValueChange={(v) => mudar("fornecedor_id", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o fornecedor" />
              </SelectTrigger>
              <SelectContent>
                {fornecedores?.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.razao_social} ({f.cpf_cnpj})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {erros.fornecedor_id && <p id="erro-fornecedor_id" className="text-sm font-medium text-destructive">{erros.fornecedor_id}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Tipo */}
            <div className="space-y-2">
              <Label>Tipo de Empenho *</Label>
              <Select value={form.tipo} onValueChange={(v) => mudar("tipo", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ordinario">Ordinário</SelectItem>
                  <SelectItem value="estimativo">Estimativo</SelectItem>
                  <SelectItem value="global">Global</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Valor */}
            <div className="space-y-2">
              <Label>Valor Empenhado (R$) *</Label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0,00"
                value={form.valor_empenhado}
                onChange={(e) => mudar("valor_empenhado", e.target.value)}
                aria-invalid={!!erros.valor_empenhado}
              />
              {erros.valor_empenhado && <p id="erro-valor_empenhado" className="text-sm font-medium text-destructive">{erros.valor_empenhado}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Natureza da Despesa */}
            <div className="space-y-2">
              <Label>Natureza da Despesa</Label>
              <Select value={form.natureza_despesa_id} onValueChange={(v) => mudar("natureza_despesa_id", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Opcional" />
                </SelectTrigger>
                <SelectContent>
                  {naturezas?.map((n) => (
                    <SelectItem key={n.id} value={n.id}>
                      {n.codigo} - {n.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Fonte de Recurso */}
            <div className="space-y-2">
              <Label>Fonte de Recurso</Label>
              <Select value={form.fonte_recurso_id} onValueChange={(v) => mudar("fonte_recurso_id", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Opcional" />
                </SelectTrigger>
                <SelectContent>
                  {fontes?.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.codigo} - {f.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Objeto */}
          <div className="space-y-2">
            <Label>Objeto / Descrição *</Label>
            <Textarea
              placeholder="Descreva o objeto do empenho..."
              value={form.objeto}
              onChange={(e) => mudar("objeto", e.target.value)}
              aria-invalid={!!erros.objeto}
              rows={3}
              maxLength={3000}
            />
            {erros.objeto && <p id="erro-objeto" className="text-sm font-medium text-destructive">{erros.objeto}</p>}
          </div>

          {/* Processo SEI */}
          <div className="space-y-2">
            <Label>Processo SEI</Label>
            <Input
              placeholder="Nº do processo"
              value={form.processo_sei}
              onChange={(e) => mudar("processo_sei", e.target.value)}
              maxLength={50}
            />
          </div>

          {/* Observações */}
          <div className="space-y-2">
            <Label>Observações</Label>
            <Textarea
              placeholder="Observações adicionais..."
              value={form.observacoes}
              onChange={(e) => mudar("observacoes", e.target.value)}
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
              disabled={criarEmpenho.isPending}
            >
              {criarEmpenho.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Emitir empenho
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
