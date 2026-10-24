/**
 * O que acontece com o bilhete do trecho: emitir (localizador e valores), remarcar (novo voo e multa),
 * cancelar (multa) ou registrar o reembolso. Valores como vêm do bilhete ou da fatura da agência.
 */

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/formatters";
import { lerNumeroBr } from "@/lib/pca/numero";
import { deDataHoraLocal, paraDataHoraLocal, valorTrecho } from "@/lib/passagens/regras";
import { useAlterarTrecho } from "@/hooks/usePassagens";
import type { TrechoComCotacoes } from "@/types/passagens";

export type AcaoBilhete = "emitir" | "remarcar" | "cancelar" | "reembolsar";

const TITULOS: Record<AcaoBilhete, string> = {
  emitir: "Registrar emissão",
  remarcar: "Remarcar bilhete",
  cancelar: "Cancelar trecho",
  reembolsar: "Registrar reembolso",
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pedidoId: string;
  trecho: TrechoComCotacoes;
  acao: AcaoBilhete;
}

const paraTexto = (n: number | null | undefined) => (n ? String(n).replace(".", ",") : "");
const hoje = () => new Date().toLocaleDateString("sv-SE");

export function BilheteDialog({ open, onOpenChange, pedidoId, trecho, acao }: Props) {
  const alterar = useAlterarTrecho(pedidoId);
  const [campos, setCampos] = useState<Record<string, string>>({});
  const [erro, setErro] = useState<string | null>(null);
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setCampos((c) => ({ ...c, [k]: e.target.value }));

  useEffect(() => {
    if (!open) return;
    const escolhida = trecho.cotacoes.find((c) => c.escolhida);
    setCampos({
      localizador: trecho.localizador ?? "",
      numero_bilhete: trecho.numero_bilhete ?? "",
      data_emissao: trecho.data_emissao ?? hoje(),
      companhia: trecho.companhia ?? escolhida?.companhia ?? "",
      voo: trecho.voo ?? escolhida?.voo ?? "",
      partida: paraDataHoraLocal(trecho.partida ?? escolhida?.partida),
      chegada: paraDataHoraLocal(trecho.chegada ?? escolhida?.chegada),
      data_voo: trecho.data_voo,
      valor_tarifa: paraTexto(trecho.valor_tarifa) || (acao === "emitir" ? paraTexto(escolhida?.valor) : ""),
      valor_taxa_embarque: paraTexto(trecho.valor_taxa_embarque),
      valor_taxa_servico: paraTexto(trecho.valor_taxa_servico),
      valor_desconto: paraTexto(trecho.valor_desconto),
      valor_multa: paraTexto(trecho.valor_multa),
      valor_reembolso: paraTexto(trecho.valor_reembolso),
    });
    setErro(null);
  }, [open, trecho, acao]);

  const n = (k: string) => (campos[k]?.trim() ? lerNumeroBr(campos[k]) : 0);

  const previa = valorTrecho({
    situacao: acao,
    localizador: acao === "cancelar" && !trecho.localizador ? null : campos.localizador || trecho.localizador || "x",
    valor_emissao: n("valor_tarifa") + n("valor_taxa_embarque") + n("valor_taxa_servico") - n("valor_desconto"),
    valor_multa: n("valor_multa"),
    valor_reembolso: n("valor_reembolso"),
  });

  const gravar = async () => {
    const numeros = ["valor_tarifa", "valor_taxa_embarque", "valor_taxa_servico", "valor_desconto", "valor_multa", "valor_reembolso"];
    if (numeros.some((k) => !(n(k) >= 0))) {
      setErro("Confira os valores: use números como 1.234,56.");
      return;
    }
    let dados: Parameters<typeof alterar.mutateAsync>[0];
    if (acao === "emitir" || acao === "remarcar") {
      if (!campos.localizador?.trim() || !campos.data_emissao) {
        setErro("Informe o localizador e a data de emissão.");
        return;
      }
      dados = {
        id: trecho.id,
        situacao: acao === "emitir" ? "emitido" : "remarcado",
        localizador: campos.localizador.trim().toUpperCase(),
        numero_bilhete: campos.numero_bilhete?.trim() || null,
        data_emissao: campos.data_emissao,
        companhia: campos.companhia?.trim() || null,
        voo: campos.voo?.trim() || null,
        partida: deDataHoraLocal(campos.partida),
        chegada: deDataHoraLocal(campos.chegada),
        data_voo: campos.data_voo || trecho.data_voo,
        valor_tarifa: n("valor_tarifa"),
        valor_taxa_embarque: n("valor_taxa_embarque"),
        valor_taxa_servico: n("valor_taxa_servico"),
        valor_desconto: n("valor_desconto"),
        ...(acao === "remarcar" ? { valor_multa: n("valor_multa") } : {}),
      };
    } else if (acao === "cancelar") {
      dados = { id: trecho.id, situacao: "cancelado", valor_multa: n("valor_multa") };
    } else {
      dados = { id: trecho.id, situacao: "reembolsado", valor_multa: n("valor_multa"), valor_reembolso: n("valor_reembolso") };
    }
    try {
      await alterar.mutateAsync(dados);
      onOpenChange(false);
    } catch {
      // erro já exibido pelo toast da mutation
    }
  };

  const campo = (k: string, rotulo: string, extra: React.ComponentProps<typeof Input> = {}) => (
    <div className="space-y-2">
      <Label htmlFor={`bil-${k}`}>{rotulo}</Label>
      <Input id={`bil-${k}`} value={campos[k] ?? ""} onChange={set(k)} {...extra} />
    </div>
  );
  const dinheiro = (k: string, rotulo: string) => campo(k, rotulo, { inputMode: "decimal", placeholder: "0,00" });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{TITULOS[acao]}</DialogTitle>
          <DialogDescription>{trecho.origem} → {trecho.destino}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {(acao === "emitir" || acao === "remarcar") && (
            <>
              <div className="grid gap-4 sm:grid-cols-3">
                {campo("localizador", "Localizador *", { autoCapitalize: "characters", maxLength: 20 })}
                {campo("numero_bilhete", "Nº do bilhete", { maxLength: 30 })}
                {campo("data_emissao", "Data da emissão *", { type: "date" })}
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                {campo("companhia", "Companhia")}
                {campo("voo", "Voo")}
                {campo("data_voo", "Data do voo", { type: "date" })}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {campo("partida", "Partida", { type: "datetime-local" })}
                {campo("chegada", "Chegada", { type: "datetime-local" })}
              </div>
              <div className="grid grid-cols-2 gap-4">
                {dinheiro("valor_tarifa", "Tarifa")}
                {dinheiro("valor_taxa_embarque", "Taxa de embarque")}
                {dinheiro("valor_taxa_servico", "Taxa de serviço")}
                {dinheiro("valor_desconto", "Desconto")}
              </div>
            </>
          )}
          {acao !== "emitir" && (
            <div className="grid gap-4 sm:grid-cols-2">
              {dinheiro("valor_multa", acao === "remarcar" ? "Multa e diferença da remarcação" : "Multa do cancelamento")}
              {acao === "reembolsar" && dinheiro("valor_reembolso", "Valor reembolsado")}
            </div>
          )}
          {acao === "cancelar" && !trecho.localizador && (
            <p className="text-sm text-muted-foreground">Trecho ainda não emitido: cancelar não gera custo no contrato.</p>
          )}
          <p className="rounded-md bg-muted px-3 py-2 text-sm">
            Valor deste trecho no contrato: <strong className="tabular-nums">{formatCurrency(previa)}</strong>
          </p>
          {erro && <p className="text-sm font-medium text-destructive" role="alert">{erro}</p>}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Voltar</Button>
          <Button onClick={gravar} disabled={alterar.isPending}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
