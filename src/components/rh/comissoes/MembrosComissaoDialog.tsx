/**
 * Membros de uma comissão: lista (papel, período, se está vigente) e, para quem tem `rh.comissoes.gerenciar`, incluir,
 * editar e retirar. Retirar apaga a participação; para encerrar mantendo o histórico, informe o fim.
 */

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Pencil, Plus, Trash2, Users } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState, StatusBadge } from "@/components/design-system";
import { SeletorBusca } from "@/components/lancamento-setor/SeletorBusca";
import { useAuth } from "@/contexts/AuthContext";
import {
  useExcluirMembroComissao,
  useSalvarMembroComissao,
  useServidoresAtivosOpcoes,
} from "@/hooks/useComissoes";
import { formatarDataISO, vigenteEm } from "@/lib/lancamentoSetorRegras";
import {
  PAPEIS_MEMBRO_COMISSAO,
  PAPEL_MEMBRO_LABELS,
  type Comissao,
  type MembroComissao,
  type PapelMembroComissao,
} from "@/types/comissao";

const schema = z
  .object({
    servidor_id: z.string().min(1, "Escolha o servidor"),
    papel: z.enum(["presidente", "membro", "secretario"]),
    data_inicio: z.string().min(1, "Informe o início"),
    data_fim: z.string(),
  })
  .refine((d) => !d.data_fim || d.data_fim >= d.data_inicio, {
    path: ["data_fim"],
    message: "O fim não pode ser antes do início",
  });

type FormData = z.infer<typeof schema>;

interface MembrosComissaoDialogProps {
  comissao: Comissao | null;
  podeGerenciar: boolean;
  onOpenChange: (aberto: boolean) => void;
}

export function MembrosComissaoDialog({ comissao, podeGerenciar, onOpenChange }: MembrosComissaoDialogProps) {
  const [editando, setEditando] = useState<MembroComissao | "novo" | null>(null);
  const [retirando, setRetirando] = useState<MembroComissao | null>(null);
  const salvar = useSalvarMembroComissao();
  const excluir = useExcluirMembroComissao();
  const { data: servidores = [], isLoading: carregandoServidores } = useServidoresAtivosOpcoes(!!comissao && podeGerenciar);
  const meuServidorId = useAuth().user?.servidorId ?? null;

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { servidor_id: "", papel: "membro", data_inicio: "", data_fim: "" },
  });

  useEffect(() => {
    if (!comissao) setEditando(null);
  }, [comissao]);

  useEffect(() => {
    if (editando === "novo") {
      form.reset({ servidor_id: "", papel: "membro", data_inicio: comissao?.data_inicio?.slice(0, 10) ?? "", data_fim: "" });
    } else if (editando) {
      form.reset({
        servidor_id: editando.servidor_id,
        papel: editando.papel,
        data_inicio: editando.data_inicio?.slice(0, 10) ?? "",
        data_fim: editando.data_fim?.slice(0, 10) ?? "",
      });
    }
  }, [editando, comissao, form]);

  const membros = useMemo(
    () =>
      [...(comissao?.membros ?? [])].sort((a, b) =>
        (a.servidor?.nome_completo ?? "").localeCompare(b.servidor?.nome_completo ?? ""),
      ),
    [comissao],
  );

  const jaMembros = new Set(membros.map((m) => m.servidor_id));
  // O banco recusa incluir o próprio servidor (e quem criou a comissão): o próprio nem aparece na lista
  const opcoes = servidores
    .filter((s) => s.id !== meuServidorId)
    .map((s) => ({
    valor: s.id,
    rotulo: s.nome_completo,
    detalhe: s.matricula ? `mat. ${s.matricula}` : null,
    // Não repete quem já está (exceto o membro em edição)
    desabilitada: jaMembros.has(s.id) && !(editando && editando !== "novo" && editando.servidor_id === s.id),
  }));

  const onSubmit = (d: FormData) => {
    if (!comissao) return;
    salvar.mutate(
      {
        id: editando && editando !== "novo" ? editando.id : undefined,
        dados: {
          comissao_id: comissao.id,
          servidor_id: d.servidor_id,
          papel: d.papel,
          data_inicio: d.data_inicio,
          data_fim: d.data_fim || null,
        },
      },
      { onSuccess: () => setEditando(null) },
    );
  };

  return (
    <>
      <Dialog open={!!comissao} onOpenChange={(a) => !salvar.isPending && onOpenChange(a)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Membros: {comissao?.nome}</DialogTitle>
            <DialogDescription>
              Na fase 1 a comissão é só cadastro: os membros ainda não lançam por ela. Você não pode incluir a si mesmo
              nem quem criou a comissão.
            </DialogDescription>
          </DialogHeader>

          {membros.length === 0 ? (
            <EmptyState icone={Users} titulo="Nenhum membro" descricao="Inclua os servidores que compõem a comissão." />
          ) : (
            <ul className="divide-y rounded-md border" aria-label="Membros da comissão">
              {membros.map((m) => {
                const vigente = vigenteEm(m.data_inicio, m.data_fim);
                return (
                  <li key={m.id} className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="font-medium break-words">
                        {m.servidor?.nome_completo ?? "Servidor sem acesso de leitura"}
                        {m.servidor?.matricula && (
                          <span className="text-caption text-muted-foreground"> · mat. {m.servidor.matricula}</span>
                        )}
                      </p>
                      <p className="text-caption text-muted-foreground">
                        {PAPEL_MEMBRO_LABELS[m.papel] ?? m.papel} · {formatarDataISO(m.data_inicio)}
                        {m.data_fim ? ` até ${formatarDataISO(m.data_fim)}` : " em diante"}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <StatusBadge tom={vigente ? "sucesso" : "neutro"}>{vigente ? "Vigente" : "Fora do período"}</StatusBadge>
                      {podeGerenciar && (
                        <>
                          <Button
                            size="icon"
                            variant="ghost"
                            aria-label={`Editar participação de ${m.servidor?.nome_completo ?? "membro"}`}
                            onClick={() => setEditando(m)}
                          >
                            <Pencil className="h-4 w-4" aria-hidden="true" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            aria-label={`Retirar ${m.servidor?.nome_completo ?? "membro"} da comissão`}
                            onClick={() => setRetirando(m)}
                          >
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                          </Button>
                        </>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          {podeGerenciar && !editando && (
            <Button type="button" variant="outline" className="gap-2 self-start" onClick={() => setEditando("novo")}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Incluir membro
            </Button>
          )}

          {podeGerenciar && editando && (
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4 rounded-md border bg-muted/30 p-4"
                aria-label={editando === "novo" ? "Incluir membro" : "Editar participação"}
                noValidate
              >
                <p className="text-h3">{editando === "novo" ? "Incluir membro" : "Editar participação"}</p>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="servidor_id"
                    render={({ field, fieldState }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel htmlFor="membro-servidor">Servidor</FormLabel>
                        <SeletorBusca
                          id="membro-servidor"
                          opcoes={opcoes}
                          valor={field.value}
                          aoEscolher={field.onChange}
                          carregando={carregandoServidores}
                          desabilitado={editando !== "novo"}
                          invalido={!!fieldState.error}
                          placeholder="Escolha o servidor"
                          placeholderBusca="Nome ou matrícula"
                          vazio="Nenhum servidor ativo encontrado."
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="papel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Papel</FormLabel>
                        <Select value={field.value} onValueChange={(v) => field.onChange(v as PapelMembroComissao)}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {PAPEIS_MEMBRO_COMISSAO.map((p) => (
                              <SelectItem key={p} value={p}>
                                {PAPEL_MEMBRO_LABELS[p]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="data_inicio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Início</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="data_fim"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fim (opcional)</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="flex flex-wrap justify-end gap-2">
                  <Button type="button" variant="ghost" onClick={() => setEditando(null)} disabled={salvar.isPending}>
                    Cancelar
                  </Button>
                  <Button type="submit" loading={salvar.isPending}>
                    {editando === "novo" ? "Incluir" : "Salvar"}
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!retirando} onOpenChange={(a) => !a && setRetirando(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Retirar da comissão?</AlertDialogTitle>
            <AlertDialogDescription>
              {retirando?.servidor?.nome_completo ?? "O membro"} deixa de lançar por esta comissão. Para só encerrar a
              participação mantendo o registro, cancele e informe a data de fim.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (retirando) excluir.mutate(retirando);
                setRetirando(null);
              }}
            >
              Retirar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
