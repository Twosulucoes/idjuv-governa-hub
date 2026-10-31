/**
 * Salvar a montagem como modelo: nome, descrição e se fica só para quem criou ou para o setor.
 * Com um modelo seu aberto, dá para atualizá-lo ou salvar como um novo.
 */

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

export interface DadosSalvarModelo {
  nome: string;
  descricao: string;
  compartilhado: boolean;
  /** true = atualizar o modelo aberto; false = criar outro. */
  atualizar: boolean;
}

interface SalvarModeloDialogProps {
  aberto: boolean;
  aoFechar: () => void;
  inicial: { nome: string; descricao: string; compartilhado: boolean };
  /** Há um modelo do próprio usuário aberto (pode ser atualizado). */
  podeAtualizar: boolean;
  salvando: boolean;
  aoSalvar: (d: DadosSalvarModelo) => void;
}

export function SalvarModeloDialog({ aberto, aoFechar, inicial, podeAtualizar, salvando, aoSalvar }: SalvarModeloDialogProps) {
  const [nome, setNome] = useState(inicial.nome);
  const [descricao, setDescricao] = useState(inicial.descricao);
  const [compartilhado, setCompartilhado] = useState(inicial.compartilhado);

  useEffect(() => {
    if (!aberto) return;
    setNome(inicial.nome);
    setDescricao(inicial.descricao);
    setCompartilhado(inicial.compartilhado);
  }, [aberto, inicial.nome, inicial.descricao, inicial.compartilhado]);

  const valido = nome.trim().length > 0;
  const salvar = (atualizar: boolean) => valido && aoSalvar({ nome: nome.trim(), descricao: descricao.trim(), compartilhado, atualizar });

  return (
    <Dialog open={aberto} onOpenChange={(v) => !v && aoFechar()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Salvar modelo</DialogTitle>
          <DialogDescription>
            O modelo guarda a fonte, as colunas, os filtros, o agrupamento, os totais e a ordem. Período como “este mês”
            continua relativo: no mês que vem, o mesmo modelo traz o mês novo.
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            salvar(podeAtualizar);
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="modelo-nome">Nome</Label>
            <Input id="modelo-nome" value={nome} maxLength={120} onChange={(e) => setNome(e.target.value)} aria-invalid={!valido} autoFocus />
            {!valido && <p className="text-caption text-destructive">Dê um nome ao modelo.</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="modelo-descricao">Descrição (opcional)</Label>
            <Textarea id="modelo-descricao" value={descricao} maxLength={500} rows={2} onChange={(e) => setDescricao(e.target.value)} />
          </div>
          <div className="flex items-start justify-between gap-4 rounded-md border border-border p-3">
            <div className="space-y-0.5">
              <Label htmlFor="modelo-compartilhado">Compartilhar com o setor</Label>
              <p className="text-caption text-muted-foreground">
                Quem tem acesso ao Financeiro vê e usa este modelo. Só você altera ou apaga.
              </p>
            </div>
            <Switch id="modelo-compartilhado" checked={compartilhado} onCheckedChange={setCompartilhado} />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="ghost" onClick={aoFechar}>
              Cancelar
            </Button>
            {podeAtualizar && (
              <Button type="button" variant="outline" disabled={!valido || salvando} onClick={() => salvar(false)}>
                Salvar como novo
              </Button>
            )}
            <Button type="submit" disabled={!valido || salvando}>
              {salvando ? "Salvando…" : podeAtualizar ? "Salvar alterações" : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
