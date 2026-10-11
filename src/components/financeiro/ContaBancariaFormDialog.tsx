/**
 * Formulário de Conta Bancária - Dialog
 * Cadastro simples da conta da instituição (dados do banco, agência e conta).
 */

import { useEffect } from "react";
import { useForm } from "react-hook-form";
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useCriarContaBancaria } from "@/hooks/useFinanceiro";

const TIPOS_CONTA = [
  { value: "corrente", label: "Corrente" },
  { value: "poupanca", label: "Poupança" },
  { value: "aplicacao", label: "Aplicação" },
  { value: "vinculada", label: "Vinculada" },
] as const;

const soDigitos = (rotulo: string, max: number) =>
  z
    .string()
    .trim()
    .min(1, `Informe ${rotulo}`)
    .max(max, `Máximo de ${max} caracteres`)
    .regex(/^\d+$/, "Use só números");

const digitoOpcional = z
  .string()
  .trim()
  .max(2, "Máximo de 2 caracteres")
  .regex(/^[0-9Xx]*$/, "Use número ou X")
  .optional();

const schema = z.object({
  nome_conta: z.string().trim().min(3, "Mínimo de 3 caracteres").max(255),
  banco_codigo: soDigitos("o código do banco", 3).length(3, "O código do banco tem 3 dígitos"),
  banco_nome: z.string().trim().min(2, "Informe o nome do banco").max(100),
  agencia: soDigitos("a agência", 10),
  agencia_digito: digitoOpcional,
  conta: soDigitos("a conta", 20),
  conta_digito: digitoOpcional,
  tipo: z.enum(["corrente", "poupanca", "aplicacao", "vinculada"]),
});

type FormData = z.infer<typeof schema>;

const VALORES_INICIAIS: FormData = {
  nome_conta: "",
  banco_codigo: "",
  banco_nome: "",
  agencia: "",
  agencia_digito: "",
  conta: "",
  conta_digito: "",
  tipo: "corrente",
};

interface ContaBancariaFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ContaBancariaFormDialog({ open, onOpenChange }: ContaBancariaFormDialogProps) {
  const criarConta = useCriarContaBancaria();
  const form = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: VALORES_INICIAIS });

  useEffect(() => {
    if (open) form.reset(VALORES_INICIAIS);
  }, [open, form]);

  const onSubmit = async (d: FormData) => {
    try {
      await criarConta.mutateAsync({
        nome_conta: d.nome_conta,
        banco_codigo: d.banco_codigo,
        banco_nome: d.banco_nome,
        agencia: d.agencia,
        agencia_digito: d.agencia_digito?.toUpperCase(),
        conta: d.conta,
        conta_digito: d.conta_digito?.toUpperCase(),
        tipo: d.tipo,
      });
      onOpenChange(false);
    } catch {
      // erro já exibido pelo toast da mutation; o diálogo continua aberto
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova conta bancária</DialogTitle>
          <DialogDescription>Conta da instituição usada para pagamentos e recebimentos.</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <FormField
              control={form.control}
              name="nome_conta"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da conta *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex.: Conta movimento" maxLength={255} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 grid-cols-[7rem_1fr]">
              <FormField
                control={form.control}
                name="banco_codigo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cód. banco *</FormLabel>
                    <FormControl>
                      <Input inputMode="numeric" placeholder="001" maxLength={3} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="banco_nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do banco *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex.: Banco do Brasil" maxLength={100} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 grid-cols-[1fr_5rem]">
              <FormField
                control={form.control}
                name="agencia"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Agência *</FormLabel>
                    <FormControl>
                      <Input inputMode="numeric" maxLength={10} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="agencia_digito"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dígito</FormLabel>
                    <FormControl>
                      <Input maxLength={2} aria-label="Dígito da agência" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 grid-cols-[1fr_5rem]">
              <FormField
                control={form.control}
                name="conta"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Conta *</FormLabel>
                    <FormControl>
                      <Input inputMode="numeric" maxLength={20} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="conta_digito"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dígito</FormLabel>
                    <FormControl>
                      <Input maxLength={2} aria-label="Dígito da conta" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="tipo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo *</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {TIPOS_CONTA.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={criarConta.isPending}>
                {criarConta.isPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                Salvar conta
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
