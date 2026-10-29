/**
 * Contrato da agência: marca um contrato já cadastrado ou faz o cadastro mínimo (número, fornecedor, objeto, valor e
 * vigência), sem sair das passagens. O cadastro completo (gestor, fiscais, itens) fica na ficha do contrato
 * (/contratos/:id). O fornecedor já precisa existir (Financeiro → Favorecidos).
 */

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { lerNumeroBr } from "@/lib/pca/numero";
import { useCadastrarContrato, useFornecedoresContrato, useMarcarContratoPassagens, useOutrosContratos } from "@/hooks/usePassagens";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  aoCadastrar?: (id: string) => void;
}

export function ContratoCadastroDialog({ open, onOpenChange, aoCadastrar }: Props) {
  const fornecedores = useFornecedoresContrato();
  const cadastrar = useCadastrarContrato();
  const outros = useOutrosContratos(open);
  const marcar = useMarcarContratoPassagens();
  const [existente, setExistente] = useState("");
  const [c, setC] = useState<Record<string, string>>({});
  const [erro, setErro] = useState<string | null>(null);
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setC((x) => ({ ...x, [k]: e.target.value }));

  useEffect(() => {
    if (!open) return;
    setC({ ano: String(new Date().getFullYear()), objeto: "Agenciamento de viagens: reserva, emissão, remarcação e cancelamento de passagens aéreas" });
    setErro(null);
    setExistente("");
  }, [open]);

  const usarExistente = async () => {
    try {
      aoCadastrar?.(await marcar.mutateAsync(existente));
      onOpenChange(false);
    } catch {
      // erro já exibido pelo toast da mutation
    }
  };

  const gravar = async () => {
    const valor = lerNumeroBr(c.valor ?? "");
    if (!c.numero?.trim() || !/^\d{4}$/.test(c.ano ?? "") || !c.fornecedor || !c.objeto?.trim() || !(valor > 0) || !c.assinatura || !c.inicio || !c.fim) {
      setErro("Preencha todos os campos.");
      return;
    }
    if (c.fim < c.inicio) {
      setErro("O fim da vigência vem depois do início.");
      return;
    }
    try {
      const id = await cadastrar.mutateAsync({
        numero_contrato: c.numero.trim(),
        ano: Number(c.ano),
        fornecedor_id: c.fornecedor,
        objeto: c.objeto.trim(),
        objeto_resumido: "Passagens aéreas (agência de viagens)",
        valor_inicial: valor,
        data_assinatura: c.assinatura,
        data_inicio: c.inicio,
        data_fim: c.fim,
      });
      aoCadastrar?.(id);
      onOpenChange(false);
    } catch {
      // erro já exibido pelo toast da mutation
    }
  };

  const campo = (k: string, rotulo: string, extra: React.ComponentProps<typeof Input> = {}) => (
    <div className="space-y-2">
      <Label htmlFor={`ct-${k}`}>{rotulo}</Label>
      <Input id={`ct-${k}`} value={c[k] ?? ""} onChange={set(k)} {...extra} />
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Cadastrar contrato da agência</DialogTitle>
          <DialogDescription>Os dados como estão no contrato assinado. O saldo das passagens sai deste valor.</DialogDescription>
        </DialogHeader>
        {(outros.data?.length ?? 0) > 0 && (
          <div className="space-y-2 rounded-md border border-border p-3">
            <Label htmlFor="ct-existente">O contrato já está cadastrado no sistema?</Label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Select value={existente} onValueChange={setExistente}>
                <SelectTrigger id="ct-existente" className="sm:flex-1"><SelectValue placeholder="Escolha o contrato" /></SelectTrigger>
                <SelectContent>
                  {outros.data!.map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.numero_contrato}/{o.ano} · {o.fornecedor?.nome_fantasia || o.fornecedor?.razao_social || o.objeto_resumido || "—"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button type="button" variant="outline" onClick={usarExistente} disabled={!existente || marcar.isPending}>Usar este</Button>
            </div>
            <p className="text-sm text-muted-foreground">Se não estiver na lista, preencha abaixo.</p>
          </div>
        )}
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-[1fr_7rem]">
            {campo("numero", "Nº do contrato", { placeholder: "Ex.: 01" })}
            {campo("ano", "Ano", { inputMode: "numeric", maxLength: 4 })}
          </div>
          <div className="space-y-2">
            <Label htmlFor="ct-fornecedor">Agência (fornecedor)</Label>
            <Select value={c.fornecedor ?? ""} onValueChange={(v) => setC((x) => ({ ...x, fornecedor: v }))}>
              <SelectTrigger id="ct-fornecedor"><SelectValue placeholder="Escolha" /></SelectTrigger>
              <SelectContent>
                {(fornecedores.data ?? []).map((f) => (
                  <SelectItem key={f.id} value={f.id}>{f.nome_fantasia || f.razao_social} · {f.cpf_cnpj}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {fornecedores.data?.length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhum fornecedor cadastrado. Cadastre a agência em Financeiro → Favorecidos.</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="ct-objeto">Objeto</Label>
            <Textarea id="ct-objeto" rows={2} value={c.objeto ?? ""} onChange={set("objeto")} />
          </div>
          {campo("valor", "Valor do contrato (R$)", { inputMode: "decimal", placeholder: "0,00" })}
          <div className="grid gap-4 sm:grid-cols-3">
            {campo("assinatura", "Assinatura", { type: "date" })}
            {campo("inicio", "Início da vigência", { type: "date" })}
            {campo("fim", "Fim da vigência", { type: "date" })}
          </div>
          {erro && <p className="text-sm font-medium text-destructive" role="alert">{erro}</p>}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={gravar} disabled={cadastrar.isPending}>Cadastrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
