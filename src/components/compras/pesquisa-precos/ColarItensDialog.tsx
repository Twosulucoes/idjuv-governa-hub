/**
 * Itens do termo de referência colados de uma vez: a pessoa copia a tabela de itens do TR (Word ou Excel) e cola. O
 * sistema reconhece as colunas (src/lib/compras/itensColados.ts), mostra a prévia e cria os itens. O código do CATMAT
 * ou do CATSER, quando a tabela tem, já entra no item; sem ele, a busca de preços sugere o código pelo nome.
 */

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { lerItensColados } from "@/lib/compras/itensColados";
import { quantidadeBR } from "@/lib/compras/relatorioPesquisaPrecos";
import type { PesquisaPrecosItemInput } from "@/hooks/usePesquisaPrecos";

interface ColarItensDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  proximoNumero: number;
  salvando?: boolean;
  onSalvar: (itens: PesquisaPrecosItemInput[]) => Promise<unknown>;
}

export function ColarItensDialog({ open, onOpenChange, proximoNumero, salvando, onSalvar }: ColarItensDialogProps) {
  const [texto, setTexto] = useState("");
  const [tipo, setTipo] = useState<"material" | "servico">("material");

  useEffect(() => {
    if (open) {
      setTexto("");
      setTipo("material");
    }
  }, [open]);

  const lidos = useMemo(() => lerItensColados(texto), [texto]);
  const itens: PesquisaPrecosItemInput[] = useMemo(() => {
    let seguinte = proximoNumero;
    return lidos.itens.map((i) => ({
      numero: i.numero ?? seguinte++,
      tipo,
      catalogo_campo: i.codigo ? "codigoItemCatalogo" : null,
      codigo_catalogo: i.codigo,
      nome_catalogo: null,
      descricao: i.descricao,
      unidade: i.unidade,
      quantidade: i.quantidade,
    }));
  }, [lidos, tipo, proximoNumero]);

  const salvar = async () => {
    try {
      await onSalvar(itens);
      onOpenChange(false);
    } catch {
      // erro já exibido pelo toast da mutation
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Colar os itens do termo de referência</DialogTitle>
          <DialogDescription>
            Copie a tabela de itens do TR no Word ou no Excel, com o cabeçalho, e cole aqui. Colunas reconhecidas: item, descrição
            (ou especificação), unidade, quantidade e, se houver, o código do CATMAT ou do CATSER.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <RadioGroup value={tipo} onValueChange={(v) => setTipo(v as "material" | "servico")} className="flex gap-6" aria-label="Tipo dos itens">
            <div className="flex items-center gap-2"><RadioGroupItem value="material" id="ci-tipo-m" /><Label htmlFor="ci-tipo-m">Materiais</Label></div>
            <div className="flex items-center gap-2"><RadioGroupItem value="servico" id="ci-tipo-s" /><Label htmlFor="ci-tipo-s">Serviços</Label></div>
          </RadioGroup>
          <div className="space-y-1">
            <Label htmlFor="ci-texto">Tabela de itens</Label>
            <Textarea id="ci-texto" rows={8} value={texto} onChange={(e) => setTexto(e.target.value)} className="font-mono text-xs"
              placeholder={"ITEM\tDESCRIÇÃO\tUNIDADE\tQUANTIDADE\n1\tBola de futebol de campo\tunidade\t50"} />
          </div>
          {lidos.ignoradas.length > 0 && (
            <p className="text-sm text-destructive">
              Linha(s) {lidos.ignoradas.join(", ")} sem descrição, unidade ou quantidade válida: ficam de fora. Corrija na tabela e cole de novo.
            </p>
          )}
          {itens.length > 0 && (
            <div className="max-h-[40vh] overflow-auto rounded-md border">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-muted">
                  <tr className="text-left">
                    <th className="p-2">Nº</th>
                    <th className="p-2">Descrição</th>
                    <th className="p-2">Unidade</th>
                    <th className="p-2 text-right">Qtd.</th>
                    <th className="p-2">Código</th>
                  </tr>
                </thead>
                <tbody>
                  {itens.map((i, n) => (
                    <tr key={n} className="border-t align-top">
                      <td className="p-2">{i.numero}</td>
                      <td className="p-2">{i.descricao}</td>
                      <td className="p-2">{i.unidade}</td>
                      <td className="p-2 text-right tabular-nums">{quantidadeBR(Number(i.quantidade))}</td>
                      <td className="p-2">{i.codigo_catalogo ?? "pelo nome"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={salvar} disabled={!itens.length || salvando}>Incluir {itens.length || ""} item(ns)</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
