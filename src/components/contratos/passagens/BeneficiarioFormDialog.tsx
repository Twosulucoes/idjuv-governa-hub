/**
 * Cadastro (ou edição) de beneficiário de passagem que não é servidor: atleta, técnico, convidado.
 * CPF com dígitos verificadores; o banco guarda só os números e recusa CPF repetido.
 */

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { validarCPF } from "@/lib/folhaCalculos";
import { somenteDigitos } from "@/lib/passagens/regras";
import { useSalvarBeneficiario } from "@/hooks/usePassagens";
import { TIPOS_DOCUMENTO, type PassagemBeneficiario } from "@/types/passagens";

const NENHUM = "nenhum";

const schema = z.object({
  nome: z.string().trim().min(3, "Nome completo").max(200),
  cpf: z.string().refine((v) => validarCPF(v), "CPF inválido"),
  data_nascimento: z.string().optional(),
  documento_tipo: z.string(),
  documento_numero: z.string().trim().max(40).optional(),
  documento_orgao: z.string().trim().max(40).optional(),
  telefone: z.string().trim().max(30).optional(),
  email: z.string().trim().max(200).refine((v) => !v || z.string().email().safeParse(v).success, "E-mail inválido").optional(),
  instituicao_nome: z.string().trim().max(200).optional(),
  observacoes: z.string().trim().max(2000).optional(),
  ativo: z.boolean(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  beneficiario?: PassagemBeneficiario | null;
  aoSalvar?: (b: PassagemBeneficiario) => void;
}

const formatarCpfDigitado = (v: string) => {
  const d = somenteDigitos(v).slice(0, 11);
  return d.replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})$/, "$1-$2");
};

export function BeneficiarioFormDialog({ open, onOpenChange, beneficiario, aoSalvar }: Props) {
  const salvar = useSalvarBeneficiario();
  const form = useForm<FormData>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (!open) return;
    form.reset({
      nome: beneficiario?.nome ?? "",
      cpf: formatarCpfDigitado(beneficiario?.cpf ?? ""),
      data_nascimento: beneficiario?.data_nascimento ?? "",
      documento_tipo: beneficiario?.documento_tipo ?? NENHUM,
      documento_numero: beneficiario?.documento_numero ?? "",
      documento_orgao: beneficiario?.documento_orgao ?? "",
      telefone: beneficiario?.telefone ?? "",
      email: beneficiario?.email ?? "",
      instituicao_nome: beneficiario?.instituicao_nome ?? "",
      observacoes: beneficiario?.observacoes ?? "",
      ativo: beneficiario?.ativo ?? true,
    });
  }, [open, beneficiario, form]);

  const onSubmit = async (d: FormData) => {
    try {
      const b = await salvar.mutateAsync({
        id: beneficiario?.id,
        nome: d.nome,
        cpf: somenteDigitos(d.cpf),
        data_nascimento: d.data_nascimento || null,
        documento_tipo: d.documento_tipo === NENHUM ? null : d.documento_tipo,
        documento_numero: d.documento_numero || null,
        documento_orgao: d.documento_orgao || null,
        telefone: d.telefone || null,
        email: d.email || null,
        instituicao_nome: d.instituicao_nome || null,
        observacoes: d.observacoes || null,
        ativo: d.ativo,
      });
      aoSalvar?.(b);
      onOpenChange(false);
    } catch {
      // erro já exibido pelo toast da mutation; o diálogo continua aberto
    }
  };

  const texto = (name: keyof FormData, rotulo: string, extra: React.ComponentProps<typeof Input> = {}) => (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{rotulo}</FormLabel>
          <FormControl><Input {...extra} {...field} value={(field.value as string) ?? ""} /></FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{beneficiario ? "Editar beneficiário" : "Novo beneficiário"}</DialogTitle>
          <DialogDescription>Pessoa que viaja e não é servidor. Os dados ficam só para quem controla as passagens.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            // o submit do React atravessa o portal: sem isto, salvar o beneficiário dentro do pedido envia o pedido também
            onSubmit={(e) => { e.stopPropagation(); form.handleSubmit(onSubmit)(e); }}
            className="space-y-4"
            noValidate
          >
            {texto("nome", "Nome completo *", { autoComplete: "off" })}
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="cpf"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CPF *</FormLabel>
                    <FormControl>
                      <Input inputMode="numeric" placeholder="000.000.000-00" {...field} onChange={(e) => field.onChange(formatarCpfDigitado(e.target.value))} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {texto("data_nascimento", "Data de nascimento", { type: "date" })}
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <FormField
                control={form.control}
                name="documento_tipo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Documento</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value={NENHUM}>Não informado</SelectItem>
                        {TIPOS_DOCUMENTO.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              {texto("documento_numero", "Número")}
              {texto("documento_orgao", "Órgão emissor")}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {texto("telefone", "Telefone", { inputMode: "tel" })}
              {texto("email", "E-mail", { type: "email", inputMode: "email" })}
            </div>
            {texto("instituicao_nome", "Instituição (federação, escola…)")}
            <FormField
              control={form.control}
              name="observacoes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl><Textarea rows={2} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {beneficiario && (
              <FormField
                control={form.control}
                name="ativo"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-3 space-y-0">
                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    <FormLabel className="font-normal">Ativo (aparece na escolha de passageiros)</FormLabel>
                  </FormItem>
                )}
              />
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button type="submit" disabled={salvar.isPending}>Salvar</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
