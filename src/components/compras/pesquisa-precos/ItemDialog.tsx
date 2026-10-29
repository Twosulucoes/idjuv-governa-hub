/**
 * Item da pesquisa de preços: material (item exato do CATMAT ou, sem ele, o tipo de material inteiro) ou serviço do
 * CATSER, descrição, unidade e quantidade. O código do catálogo é o que a busca no Compras.gov.br usa.
 */

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { lerNumeroBr } from "@/lib/pca/numero";
import { catalogoDoItem } from "@/lib/compras/relatorioPesquisaPrecos";
import type { PesquisaPrecosItem, PesquisaPrecosItemInput } from "@/hooks/usePesquisaPrecos";
import { CatalogoBusca, type EscolhaCatalogo } from "@/components/compras/pca/CatalogoBusca";

interface ItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: PesquisaPrecosItem | null;
  proximoNumero: number;
  salvando?: boolean;
  onSalvar: (item: PesquisaPrecosItemInput) => Promise<unknown>;
}

const paraTexto = (n: number | null | undefined) => (n == null ? "" : String(n).replace(".", ","));

export function ItemDialog({ open, onOpenChange, item, proximoNumero, salvando, onSalvar }: ItemDialogProps) {
  const [tipo, setTipo] = useState<"material" | "servico">("material");
  const [manterCatalogo, setManterCatalogo] = useState(false);
  const [escolha, setEscolha] = useState<EscolhaCatalogo | null>(null);
  const [codigoItem, setCodigoItem] = useState<number | null>(null);
  const [nomeItem, setNomeItem] = useState<string | null>(null);
  const [campos, setCampos] = useState({ numero: "", descricao: "", unidade: "", quantidade: "" });
  const [tentou, setTentou] = useState(false);

  useEffect(() => {
    if (!open) {
      setEscolha(null);
      return;
    }
    setTentou(false);
    setTipo((item?.tipo as "material" | "servico") ?? "material");
    setManterCatalogo(!!item?.codigo_catalogo);
    setEscolha(null);
    setCodigoItem(null);
    setNomeItem(null);
    setCampos({
      numero: String(item?.numero ?? proximoNumero),
      descricao: item?.descricao ?? "",
      unidade: item?.unidade ?? "",
      quantidade: paraTexto(item?.quantidade),
    });
  }, [open, item, proximoNumero]);

  const quantidade = lerNumeroBr(campos.quantidade);
  const numero = Number(campos.numero);
  const erros = {
    numero: !(Number.isInteger(numero) && numero >= 1 && numero <= 9999) ? "Número de 1 a 9999" : null,
    descricao: !campos.descricao.trim() ? "Descreva o item (a especificação do termo de referência)" : null,
    unidade: !campos.unidade.trim() ? "Informe a unidade (ex.: unidade, caixa, mês)" : null,
    quantidade: !(quantidade > 0) ? "Quantidade maior que zero" : null,
  };
  const valido = !Object.values(erros).some(Boolean);

  const catalogo = (): Pick<PesquisaPrecosItemInput, "catalogo_campo" | "codigo_catalogo" | "nome_catalogo"> => {
    if (manterCatalogo && item) {
      return { catalogo_campo: item.catalogo_campo, codigo_catalogo: item.codigo_catalogo, nome_catalogo: item.nome_catalogo };
    }
    if (!escolha) return { catalogo_campo: null, codigo_catalogo: null, nome_catalogo: null };
    if (tipo === "material" && codigoItem) return { catalogo_campo: "codigoItemCatalogo", codigo_catalogo: codigoItem, nome_catalogo: nomeItem };
    return { catalogo_campo: tipo === "material" ? "codigoPdm" : "codigoItemCatalogo", codigo_catalogo: escolha.codigo, nome_catalogo: escolha.nome };
  };

  const salvar = async () => {
    setTentou(true);
    if (!valido) return;
    try {
      await onSalvar({
        id: item?.id,
        numero,
        tipo,
        ...catalogo(),
        descricao: campos.descricao.trim(),
        unidade: campos.unidade.trim(),
        quantidade,
      });
      onOpenChange(false);
    } catch {
      // erro já exibido pelo toast da mutation; o diálogo continua aberto
    }
  };

  const erro = (k: keyof typeof erros) => tentou && erros[k] ? <p className="text-sm text-destructive">{erros[k]}</p> : null;
  const muda = (k: keyof typeof campos) => (v: string) => setCampos((c) => ({ ...c, [k]: v }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{item ? `Editar item ${item.numero}` : "Novo item da pesquisa"}</DialogTitle>
          <DialogDescription>
            O código do catálogo busca os preços no Compras.gov.br. O item exato do CATMAT traz preços do mesmo produto; o tipo de
            material traz todos os itens dele.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <RadioGroup
            value={tipo}
            onValueChange={(v) => { setTipo(v as "material" | "servico"); setManterCatalogo(false); setEscolha(null); setCodigoItem(null); }}
            className="flex gap-6"
            aria-label="Tipo do item"
          >
            <div className="flex items-center gap-2"><RadioGroupItem value="material" id="pp-tipo-m" /><Label htmlFor="pp-tipo-m">Material</Label></div>
            <div className="flex items-center gap-2"><RadioGroupItem value="servico" id="pp-tipo-s" /><Label htmlFor="pp-tipo-s">Serviço</Label></div>
          </RadioGroup>

          {manterCatalogo && item?.codigo_catalogo ? (
            <div className="flex items-start justify-between gap-2 rounded-md border p-3 text-sm">
              <div>
                <p className="font-medium">{catalogoDoItem(item)}</p>
                {item.nome_catalogo && <p className="text-muted-foreground">{item.nome_catalogo}</p>}
              </div>
              <button type="button" className="text-sm font-medium text-primary underline-offset-4 hover:underline" onClick={() => setManterCatalogo(false)}>
                Trocar
              </button>
            </div>
          ) : (
            <CatalogoBusca
              tipo={tipo}
              escolha={escolha}
              aoEscolher={setEscolha}
              codigoItem={codigoItem}
              aoEscolherItem={(c, d) => { setCodigoItem(c); setNomeItem(d); }}
            />
          )}

          <div className="grid gap-4 sm:grid-cols-[6rem_1fr]">
            <div className="space-y-2">
              <Label htmlFor="pp-item-numero">Nº *</Label>
              <Input id="pp-item-numero" inputMode="numeric" value={campos.numero} onChange={(e) => muda("numero")(e.target.value.replace(/\D/g, "").slice(0, 4))} />
              {erro("numero")}
            </div>
            <div className="space-y-2">
              <Label htmlFor="pp-item-desc">Descrição *</Label>
              <Textarea id="pp-item-desc" rows={3} value={campos.descricao} onChange={(e) => muda("descricao")(e.target.value)} />
              {erro("descricao")}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="pp-item-unidade">Unidade *</Label>
              <Input id="pp-item-unidade" value={campos.unidade} onChange={(e) => muda("unidade")(e.target.value)} />
              {erro("unidade")}
            </div>
            <div className="space-y-2">
              <Label htmlFor="pp-item-qtd">Quantidade *</Label>
              <Input id="pp-item-qtd" inputMode="decimal" value={campos.quantidade} onChange={(e) => muda("quantidade")(e.target.value)} />
              {erro("quantidade")}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={salvar} disabled={salvando}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
