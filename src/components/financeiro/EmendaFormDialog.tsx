/**
 * Formulário da Emenda parlamentar - Dialog
 * Cadastro e edição da emenda (tabela `fin_emendas`): a dotação de emenda do QDD em que ela caiu, número, autor,
 * objeto, beneficiário, valor e a reserva (PED) lançada à mão. O tipo (IDU) vem da dotação escolhida.
 */

import { useEffect } from "react";
import { useForm, type Control, type FieldPath } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import { rotuloDotacaoEmenda } from "@/lib/financeiro/origemDotacao";
import { useSalvarEmenda } from "@/hooks/useEmendas";
import type { Dotacao, Emenda } from "@/types/financeiro";

const opcional = (max: number) => z.string().trim().max(max, `Máximo de ${max} caracteres`);
const dinheiro = (rotulo: string, minimo: number) =>
  z
    .string()
    .trim()
    .refine((v) => v !== "" && Number.isFinite(Number(v)) && Number(v) >= minimo && /^\d+(\.\d{1,2})?$/.test(v), {
      message: `${rotulo}: use número com até 2 casas (ex.: 1500.50)`,
    });

const schema = z
  .object({
    dotacao_id: z.string().min(1, "Escolha a dotação de emenda do QDD"),
    numero: z.string().trim().min(1, "Informe o número da emenda").max(50),
    autor: z.string().trim().min(1, "Informe o autor (parlamentar ou bancada)").max(200),
    objeto: z.string().trim().min(1, "Informe o objeto").max(2000),
    beneficiario: opcional(300),
    beneficiario_cnpj: z.string().trim().refine((v) => v === "" || v.replace(/\D/g, "").length === 14, "CNPJ com 14 dígitos"),
    valor: dinheiro("Valor", 0.01),
    valor_reservado: dinheiro("Reservado", 0),
    ped_numero: opcional(30),
    processo_sei: opcional(50),
    observacoes: opcional(2000),
  })
  .refine((d) => Number(d.valor_reservado) <= Number(d.valor), {
    path: ["valor_reservado"],
    message: "O reservado não pode passar do valor da emenda",
  });

type FormData = z.infer<typeof schema>;

const VAZIO: FormData = {
  dotacao_id: "",
  numero: "",
  autor: "",
  objeto: "",
  beneficiario: "",
  beneficiario_cnpj: "",
  valor: "",
  valor_reservado: "0",
  ped_numero: "",
  processo_sei: "",
  observacoes: "",
};

const daEmenda = (e: Emenda): FormData => ({
  dotacao_id: e.dotacao_id,
  numero: e.numero,
  autor: e.autor,
  objeto: e.objeto,
  beneficiario: e.beneficiario ?? "",
  beneficiario_cnpj: e.beneficiario_cnpj ?? "",
  valor: String(e.valor),
  valor_reservado: String(e.valor_reservado ?? 0),
  ped_numero: e.ped_numero ?? "",
  processo_sei: e.processo_sei ?? "",
  observacoes: e.observacoes ?? "",
});

const ouNulo = (v: string) => v.trim() || null;

function CampoTexto({
  control,
  name,
  rotulo,
  descricao,
  className,
  ...resto
}: {
  control: Control<FormData>;
  name: FieldPath<FormData>;
  rotulo: string;
  descricao?: string;
  className?: string;
  placeholder?: string;
  maxLength?: number;
  inputMode?: "numeric" | "decimal";
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          <FormLabel>{rotulo}</FormLabel>
          <FormControl>
            <Input {...resto} {...field} value={String(field.value ?? "")} />
          </FormControl>
          {descricao && <FormDescription>{descricao}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

interface EmendaFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exercicio: number;
  /** Dotações de emenda do QDD do exercício (IDU diferente de "Não") */
  dotacoes: Dotacao[];
  /** Emenda em edição; ausente, cadastro novo. */
  emenda?: Emenda | null;
}

export default function EmendaFormDialog({ open, onOpenChange, exercicio, dotacoes, emenda }: EmendaFormDialogProps) {
  const salvar = useSalvarEmenda();
  const form = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: VAZIO });

  useEffect(() => {
    if (open) form.reset(emenda ? daEmenda(emenda) : VAZIO);
  }, [open, emenda, form]);

  const dotacaoAtual = dotacoes.find((d) => d.id === form.watch("dotacao_id"));

  const onSubmit = async (d: FormData) => {
    const dotacao = dotacoes.find((x) => x.id === d.dotacao_id);
    if (!dotacao?.idu) return;
    try {
      await salvar.mutateAsync({
        id: emenda?.id,
        dados: {
          exercicio,
          dotacao_id: d.dotacao_id,
          idu: dotacao.idu.trim(),
          numero: d.numero.trim(),
          autor: d.autor.trim(),
          objeto: d.objeto.trim(),
          beneficiario: ouNulo(d.beneficiario),
          beneficiario_cnpj: ouNulo(d.beneficiario_cnpj.replace(/\D/g, "")),
          valor: Number(d.valor),
          valor_reservado: Number(d.valor_reservado),
          ped_numero: ouNulo(d.ped_numero),
          processo_sei: ouNulo(d.processo_sei),
          observacoes: ouNulo(d.observacoes),
        },
      });
      onOpenChange(false);
    } catch {
      // erro já exibido pelo toast da mutation; o diálogo continua aberto
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{emenda ? "Editar emenda" : "Nova emenda"}</DialogTitle>
          <DialogDescription>
            O FIPLAN não traz autor, objeto nem beneficiário: eles entram aqui, a partir da emenda aprovada. O empenhado sai dos
            empenhos ligados à emenda.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <FormField
              control={form.control}
              name="dotacao_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dotação de emenda (QDD {exercicio})</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Escolha a natureza e o tipo de emenda" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {dotacoes.map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          {rotuloDotacaoEmenda(d)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {dotacaoAtual && (
                    <FormDescription>
                      Dotação atual {formatCurrency(dotacaoAtual.valor_atual)} · disponível no QDD{" "}
                      {formatCurrency(dotacaoAtual.saldo_disponivel)}
                    </FormDescription>
                  )}
                  {dotacoes.length === 0 && (
                    <FormDescription>Nenhuma dotação de emenda no QDD de {exercicio}. Importe o QDD primeiro.</FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <CampoTexto control={form.control} name="numero" rotulo="Número da emenda" maxLength={50} />
              <CampoTexto control={form.control} name="autor" rotulo="Autor" placeholder="Parlamentar ou bancada" maxLength={200} />
            </div>

            <FormField
              control={form.control}
              name="objeto"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Objeto</FormLabel>
                  <FormControl>
                    <Textarea rows={3} maxLength={2000} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <CampoTexto control={form.control} name="beneficiario" rotulo="Beneficiário" placeholder="Entidade, município ou o próprio órgão" maxLength={300} />
              <CampoTexto control={form.control} name="beneficiario_cnpj" rotulo="CNPJ do beneficiário (opcional)" inputMode="numeric" maxLength={18} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <CampoTexto control={form.control} name="valor" rotulo="Valor da emenda (R$)" inputMode="decimal" />
              <CampoTexto
                control={form.control}
                name="valor_reservado"
                rotulo="Reservado (R$)"
                inputMode="decimal"
                descricao="PED ainda sem empenho"
              />
              <CampoTexto control={form.control} name="ped_numero" rotulo="Nº do PED" maxLength={30} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <CampoTexto control={form.control} name="processo_sei" rotulo="Processo SEI" maxLength={50} />
              <CampoTexto control={form.control} name="observacoes" rotulo="Observações" maxLength={2000} />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={salvar.isPending}>
                {salvar.isPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                Salvar
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
