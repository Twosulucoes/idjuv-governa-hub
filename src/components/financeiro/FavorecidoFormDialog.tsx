/**
 * Formulário do Favorecido - Dialog
 * Cadastro e edição de quem recebe pagamentos (tabela `fornecedores`): documento, nome, endereço e a conta de
 * crédito usada na remessa OBN600 quando o pagamento não traz conta própria. O código do credor no FIPLAN liga
 * os empenhos importados do FIP 614 a este favorecido.
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
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { formatCEP } from "@/lib/formatters";
import {
  agenciaValida,
  contaValida,
  documentoValido,
  formatarDocumento,
  mascararDocumento,
  normalizarAgenciaConta,
  tipoPessoaDoDocumento,
} from "@/lib/bancario/favorecido";
import { useBancosCNAB } from "@/hooks/useFolhaPagamento";
import { useSalvarFavorecido, type Favorecido } from "@/hooks/useFavorecidos";

const opcional = (max: number) => z.string().trim().max(max, `Máximo de ${max} caracteres`);

const schema = z.object({
  cpf_cnpj: z.string().trim().refine(documentoValido, "CPF ou CNPJ inválido"),
  razao_social: z.string().trim().min(3, "Mínimo de 3 caracteres").max(255),
  codigo_credor_fiplan: z.string().trim().regex(/^(\d{4}\.\d{5}-\d)?$/, "Use o formato 2001.00001-1"),
  endereco_logradouro: opcional(255),
  endereco_numero: opcional(20),
  endereco_bairro: opcional(100),
  endereco_cidade: opcional(100),
  endereco_uf: z.string().trim().regex(/^([A-Za-z]{2})?$/, "Use a sigla com 2 letras"),
  endereco_cep: z.string().trim().regex(/^(\d{5}-?\d{3})?$/, "CEP com 8 dígitos"),
  telefone: opcional(20),
  email: z.union([z.literal(""), z.string().trim().email("E-mail inválido").max(255)]),
  banco_codigo: z.string().min(1, "Escolha o banco"),
  agencia: z.string().trim().refine(agenciaValida, "Até 4 dígitos; o dígito depois do hífen (ex.: 1234-5)"),
  conta: z.string().trim().refine(contaValida, "Até 9 dígitos; o dígito depois do hífen (ex.: 12345-6)"),
  tipo_conta: z.enum(["corrente", "poupanca"]),
  ativo: z.boolean(),
});

type FormData = z.infer<typeof schema>;

const VAZIO: FormData = {
  cpf_cnpj: "",
  razao_social: "",
  codigo_credor_fiplan: "",
  endereco_logradouro: "",
  endereco_numero: "",
  endereco_bairro: "",
  endereco_cidade: "",
  endereco_uf: "",
  endereco_cep: "",
  telefone: "",
  email: "",
  banco_codigo: "",
  agencia: "",
  conta: "",
  tipo_conta: "corrente",
  ativo: true,
};

const doFavorecido = (f: Favorecido): FormData => ({
  cpf_cnpj: f.cpf_cnpj ?? "",
  razao_social: f.razao_social ?? "",
  codigo_credor_fiplan: f.codigo_credor_fiplan ?? "",
  endereco_logradouro: f.endereco_logradouro ?? "",
  endereco_numero: f.endereco_numero ?? "",
  endereco_bairro: f.endereco_bairro ?? "",
  endereco_cidade: f.endereco_cidade ?? "",
  endereco_uf: f.endereco_uf ?? "",
  endereco_cep: f.endereco_cep ?? "",
  telefone: f.telefone ?? "",
  email: f.email ?? "",
  banco_codigo: f.banco_codigo ?? "",
  agencia: f.agencia ?? "",
  conta: f.conta ?? "",
  tipo_conta: f.tipo_conta === "poupanca" ? "poupanca" : "corrente",
  ativo: f.ativo ?? true,
});

const ouNulo = (v: string) => v.trim() || null;

function CampoTexto({
  control,
  name,
  rotulo,
  maxLength,
  className,
  ...resto
}: {
  control: Control<FormData>;
  name: FieldPath<FormData>;
  rotulo: string;
  maxLength?: number;
  className?: string;
  placeholder?: string;
  inputMode?: "numeric" | "email" | "tel";
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          <FormLabel>{rotulo}</FormLabel>
          <FormControl>
            <Input maxLength={maxLength} {...resto} {...field} value={String(field.value ?? "")} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

interface FavorecidoFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Favorecido em edição; ausente, cadastro novo. */
  favorecido?: Favorecido | null;
}

export default function FavorecidoFormDialog({ open, onOpenChange, favorecido }: FavorecidoFormDialogProps) {
  const salvar = useSalvarFavorecido();
  const { data: bancos, isLoading: carregandoBancos } = useBancosCNAB();
  const form = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: VAZIO });

  useEffect(() => {
    if (open) form.reset(favorecido ? doFavorecido(favorecido) : VAZIO);
  }, [open, favorecido, form]);

  const bancoAtual = form.watch("banco_codigo");
  // Banco gravado que não está na lista (cadastro antigo): continua aparecendo para não sumir na edição.
  const bancoForaDaLista = !!bancoAtual && !!bancos && !bancos.some((b) => b.codigo_banco === bancoAtual);

  const onSubmit = async (d: FormData) => {
    const banco = bancos?.find((b) => b.codigo_banco === d.banco_codigo);
    try {
      await salvar.mutateAsync({
        id: favorecido?.id,
        dados: {
          tipo_pessoa: tipoPessoaDoDocumento(d.cpf_cnpj) ?? "PJ",
          cpf_cnpj: formatarDocumento(d.cpf_cnpj),
          razao_social: d.razao_social.trim(),
          nome_fantasia: favorecido?.nome_fantasia ?? null,
          endereco_logradouro: ouNulo(d.endereco_logradouro),
          endereco_numero: ouNulo(d.endereco_numero),
          endereco_bairro: ouNulo(d.endereco_bairro),
          endereco_cidade: ouNulo(d.endereco_cidade),
          endereco_uf: ouNulo(d.endereco_uf.toUpperCase()),
          endereco_cep: ouNulo(d.endereco_cep),
          telefone: ouNulo(d.telefone),
          email: ouNulo(d.email),
          banco_codigo: d.banco_codigo,
          banco_nome: banco?.nome ?? favorecido?.banco_nome ?? null,
          agencia: normalizarAgenciaConta(d.agencia),
          conta: normalizarAgenciaConta(d.conta),
          tipo_conta: d.tipo_conta,
          ativo: d.ativo,
          codigo_credor_fiplan: ouNulo(d.codigo_credor_fiplan),
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
          <DialogTitle>{favorecido ? "Editar favorecido" : "Novo favorecido"}</DialogTitle>
          <DialogDescription>
            Quem recebe o pagamento. A conta abaixo vai na remessa OBN600 quando o pagamento não informa outra.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" noValidate>
            <fieldset className="space-y-4">
              <legend className="text-sm font-semibold">Identificação</legend>
              <div className="grid gap-4 sm:grid-cols-[12rem_1fr]">
                <FormField
                  control={form.control}
                  name="cpf_cnpj"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CPF ou CNPJ *</FormLabel>
                      <FormControl>
                        <Input
                          inputMode="numeric"
                          maxLength={18}
                          {...field}
                          onChange={(e) => field.onChange(mascararDocumento(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <CampoTexto control={form.control} name="razao_social" rotulo="Nome ou razão social *" maxLength={255} />
              </div>
              <FormField
                control={form.control}
                name="codigo_credor_fiplan"
                render={({ field }) => (
                  <FormItem className="max-w-xs">
                    <FormLabel>Código do credor no FIPLAN</FormLabel>
                    <FormControl>
                      <Input placeholder="2001.00001-1" maxLength={12} {...field} />
                    </FormControl>
                    <FormDescription>Liga os empenhos importados do FIPLAN a este favorecido.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </fieldset>

            <fieldset className="space-y-4">
              <legend className="text-sm font-semibold">Conta para crédito</legend>
              <div className="grid gap-4 sm:grid-cols-[1fr_8rem_10rem]">
                <FormField
                  control={form.control}
                  name="banco_codigo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Banco *</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange} disabled={carregandoBancos}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={carregandoBancos ? "Carregando…" : "Escolha o banco"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {bancoForaDaLista && (
                            <SelectItem value={bancoAtual}>
                              {bancoAtual} - {favorecido?.banco_nome ?? "banco do cadastro"}
                            </SelectItem>
                          )}
                          {(bancos ?? []).map((b) => (
                            <SelectItem key={b.id} value={b.codigo_banco}>
                              {b.codigo_banco} - {b.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {!carregandoBancos && !bancos?.length && (
                        <FormDescription>A lista de bancos está vazia. Peça ao suporte para carregá-la.</FormDescription>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <CampoTexto control={form.control} name="agencia" rotulo="Agência *" placeholder="1234-5" maxLength={8} />
                <CampoTexto control={form.control} name="conta" rotulo="Conta *" placeholder="12345-6" maxLength={14} />
              </div>
              <FormField
                control={form.control}
                name="tipo_conta"
                render={({ field }) => (
                  <FormItem className="max-w-xs">
                    <FormLabel>Tipo de conta</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="corrente">Corrente</SelectItem>
                        <SelectItem value="poupanca">Poupança</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </fieldset>

            <fieldset className="space-y-4">
              <legend className="text-sm font-semibold">Endereço e contato</legend>
              <div className="grid gap-4 sm:grid-cols-[1fr_7rem]">
                <CampoTexto control={form.control} name="endereco_logradouro" rotulo="Logradouro" maxLength={255} />
                <CampoTexto control={form.control} name="endereco_numero" rotulo="Número" maxLength={20} />
              </div>
              <div className="grid gap-4 sm:grid-cols-[1fr_1fr_5rem_8rem]">
                <CampoTexto control={form.control} name="endereco_bairro" rotulo="Bairro" maxLength={100} />
                <CampoTexto control={form.control} name="endereco_cidade" rotulo="Cidade" maxLength={100} />
                <CampoTexto control={form.control} name="endereco_uf" rotulo="UF" maxLength={2} />
                <FormField
                  control={form.control}
                  name="endereco_cep"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CEP</FormLabel>
                      <FormControl>
                        <Input
                          inputMode="numeric"
                          maxLength={9}
                          {...field}
                          onChange={(e) => field.onChange(formatCEP(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <CampoTexto control={form.control} name="telefone" rotulo="Telefone" inputMode="tel" maxLength={20} />
                <CampoTexto control={form.control} name="email" rotulo="E-mail" inputMode="email" maxLength={255} />
              </div>
            </fieldset>

            <FormField
              control={form.control}
              name="ativo"
              render={({ field }) => (
                <FormItem className="flex items-center gap-3 space-y-0">
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <FormLabel className="font-normal">Ativo (aparece para novos empenhos e pagamentos)</FormLabel>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={salvar.isPending}>
                {salvar.isPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                Salvar favorecido
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
