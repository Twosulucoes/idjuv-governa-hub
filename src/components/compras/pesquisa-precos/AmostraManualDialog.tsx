/**
 * Preço lançado à mão, com o que cada inciso do art. 17 do Decreto 39.050-E/2025 pede: site ou publicação com o
 * endereço e a data e hora de acesso (III); orçamento de fornecedor com CNPJ/CPF, nome e data (IV, § 3º); nota
 * fiscal com o emitente e a data (V). Também serve para os incisos I e II quando a fonte não veio pela busca.
 */

import { useEffect, useState, type ComponentProps } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { lerNumeroBr } from "@/lib/pca/numero";
import { documentoFornecedor, PARAMETROS, type ParametroPesquisa } from "@/lib/compras/pesquisaPrecos";
import type { AmostraInput } from "@/hooks/usePesquisaPrecos";

interface AmostraManualDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unidadeDoItem: string;
  incluindo?: boolean;
  onIncluir: (amostras: AmostraInput[]) => Promise<unknown>;
}

/** Agora no fuso do navegador, no formato do input datetime-local. */
const agoraLocal = () => {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
};

const ROTULO_FONTE: Record<ParametroPesquisa, string> = {
  1: "Sistema oficial (painel ou banco de preços)",
  2: "Órgão ou ente da contratação",
  3: "Site, publicação ou tabela",
  4: "Fornecedor consultado (razão social)",
  5: "Emitente da nota fiscal (razão social)",
};

const ROTULO_DOCUMENTO: Record<ParametroPesquisa, string> = {
  1: "Compra ou relatório",
  2: "Contrato, ata ou compra",
  3: "Produto ou referência na página",
  4: "Proposta ou orçamento (nº ou data)",
  5: "Número da nota fiscal",
};

export function AmostraManualDialog({ open, onOpenChange, unidadeDoItem, incluindo, onIncluir }: AmostraManualDialogProps) {
  const vazio = {
    parametro: "4", fonte: "", uf: "", documento: "", data: "", fornecedor: "", ni: "", marca: "", unidade: "", quantidade: "",
    preco: "", link: "", consultado: "",
  };
  const [c, setC] = useState(vazio);
  const [tentou, setTentou] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTentou(false);
    setC({ ...vazio, unidade: unidadeDoItem, consultado: agoraLocal() });
    // vazio é recriado a cada render; só a abertura e a unidade reiniciam o formulário
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, unidadeDoItem]);

  const p = Number(c.parametro) as ParametroPesquisa;
  const preco = lerNumeroBr(c.preco);
  const quantidade = c.quantidade.trim() ? lerNumeroBr(c.quantidade) : null;
  const ni = documentoFornecedor(c.ni);
  const link = c.link.trim();
  const ehFornecedor = p === 4 || p === 5;
  const erros = {
    preco: !(preco > 0) ? "Informe o preço unitário" : null,
    data: !/^\d{4}-\d{2}-\d{2}$/.test(c.data) ? "Informe a data do preço (compra, orçamento ou nota)" : null,
    fonte: !c.fonte.trim() && !(p === 3 && link) ? "Informe a fonte" : null,
    ni: ehFornecedor && !ni ? "CNPJ (14 dígitos) ou CPF (11 dígitos)" : c.ni.trim() && !ni ? "CNPJ ou CPF inválido" : null,
    link: link && !/^https:\/\//.test(link) ? "O endereço precisa começar com https://" : p === 3 && !link && !c.fonte.trim() ? "Informe o endereço" : null,
    quantidade: quantidade !== null && !(quantidade > 0) ? "Quantidade inválida" : null,
    uf: c.uf && !/^[A-Za-z]{2}$/.test(c.uf) ? "UF com 2 letras" : null,
    consultado: !c.consultado ? "Informe a data e hora da consulta" : null,
  };
  const valido = !Object.values(erros).some(Boolean);

  const incluir = async () => {
    setTentou(true);
    if (!valido) return;
    try {
      await onIncluir([{
        parametro: p,
        origem: "manual",
        orgao: ehFornecedor ? null : c.fonte.trim() || null,
        uf: c.uf ? c.uf.toUpperCase() : null,
        numero_compra: c.documento.trim() || null,
        data_referencia: c.data,
        fornecedor_nome: ehFornecedor ? c.fonte.trim() : c.fornecedor.trim() || null,
        fornecedor_ni: ni,
        marca: c.marca.trim() || null,
        unidade: c.unidade.trim().slice(0, 60) || null,
        quantidade,
        preco_unitario: preco,
        link: link || null,
        consultado_em: new Date(c.consultado).toISOString(),
      }]);
      onOpenChange(false);
    } catch {
      // erro já exibido pelo toast da mutation
    }
  };

  const muda = (k: keyof typeof vazio) => (v: string) => setC((x) => ({ ...x, [k]: v }));
  const erro = (k: keyof typeof erros) => tentou && erros[k] ? <p className="text-sm text-destructive">{erros[k]}</p> : null;
  const campo = (k: keyof typeof vazio, rotulo: string, extra: ComponentProps<typeof Input> = {}) => (
    <div className="space-y-1">
      <Label htmlFor={`pm-${k}`}>{rotulo}</Label>
      <Input id={`pm-${k}`} value={c[k]} onChange={(e) => muda(k)(e.target.value)} {...extra} />
      {k in erros && erro(k as keyof typeof erros)}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Lançar preço à mão</DialogTitle>
          <DialogDescription>
            Junte ao processo a cópia da página, do orçamento ou da nota. O orçamento de fornecedor precisa de descrição, valor,
            CNPJ/CPF, contato, responsável, data e assinatura (art. 17, § 3º).
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="pm-parametro">Parâmetro (art. 17)</Label>
            <Select value={c.parametro} onValueChange={muda("parametro")}>
              <SelectTrigger id="pm-parametro"><SelectValue /></SelectTrigger>
              <SelectContent>
                {([1, 2, 3, 4, 5] as const).map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {PARAMETROS[n].inciso} – {PARAMETROS[n].rotulo} (até {PARAMETROS[n].prazoMeses} meses)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-4 sm:grid-cols-[1fr_5rem]">
            {campo("fonte", `${ROTULO_FONTE[p]}${p === 3 ? "" : " *"}`)}
            {campo("uf", "UF", { maxLength: 2 })}
          </div>
          {ehFornecedor
            ? campo("ni", "CNPJ ou CPF *", { inputMode: "numeric" })
            : (
              <div className="grid gap-4 sm:grid-cols-2">
                {campo("fornecedor", "Fornecedor")}
                {campo("ni", "CNPJ ou CPF do fornecedor", { inputMode: "numeric" })}
              </div>
            )}
          <div className="grid gap-4 sm:grid-cols-2">
            {campo("documento", ROTULO_DOCUMENTO[p])}
            {campo("data", "Data do preço *", { type: "date" })}
          </div>
          {campo("link", p === 3 ? "Endereço da página (https://) *" : "Link da fonte (https://)", { inputMode: "url" })}
          <div className="grid gap-4 sm:grid-cols-4">
            {campo("unidade", "Unidade")}
            {campo("quantidade", "Quantidade", { inputMode: "decimal" })}
            {campo("marca", "Marca")}
            {campo("preco", "Preço unitário *", { inputMode: "decimal" })}
          </div>
          {campo("consultado", "Data e hora da consulta *", { type: "datetime-local" })}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={incluir} disabled={incluindo}>Incluir preço</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
