import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2, Save, X } from "lucide-react";
import { useBancosCNAB, useSaveContaAutarquia } from "@/hooks/useFolhaPagamento";
import type { ContaAutarquia } from "@/types/folha";

const contaSchema = z.object({
  banco_id: z.string().min(1, "Selecione o banco"),
  descricao: z.string().min(3, "Descrição é obrigatória"),
  agencia: z.string().min(1, "Agência é obrigatória"),
  agencia_digito: z.string().optional(),
  conta: z.string().min(1, "Conta é obrigatória"),
  conta_digito: z.string().optional(),
  tipo_conta: z.string().min(1, "Tipo é obrigatório"),
  uso_principal: z.string().optional(),
  convenio_pagamento: z.string().optional(),
  codigo_cedente: z.string().optional(),
  codigo_transmissao: z.string().optional(),
  ativo: z.boolean().default(true),
});

type ContaFormData = z.infer<typeof contaSchema>;

interface ContaAutarquiaFormProps {
  conta?: ContaAutarquia | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ContaAutarquiaForm({ conta, onSuccess, onCancel }: ContaAutarquiaFormProps) {
  const { data: bancos } = useBancosCNAB();
  const saveConta = useSaveContaAutarquia();

  const form = useForm<ContaFormData>({
    resolver: zodResolver(contaSchema),
    defaultValues: {
      banco_id: conta?.banco_id || "",
      descricao: conta?.descricao || "",
      agencia: conta?.agencia || "",
      agencia_digito: conta?.agencia_digito || "",
      conta: conta?.conta || "",
      conta_digito: conta?.conta_digito || "",
      tipo_conta: conta?.tipo_conta || "corrente",
      uso_principal: conta?.uso_principal || "",
      convenio_pagamento: conta?.convenio_pagamento || "",
      codigo_cedente: conta?.codigo_cedente || "",
      codigo_transmissao: conta?.codigo_transmissao || "",
      ativo: conta?.ativo ?? true,
    },
  });

  const onSubmit = (data: ContaFormData) => {
    saveConta.mutate(
      {
        ...data,
        id: conta?.id,
      },
      {
        onSuccess: () => {
          onSuccess?.();
        },
      }
    );
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="banco_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Banco *</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o banco" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {bancos?.map((banco) => (
                    <SelectItem key={banco.id} value={banco.id}>
                      {banco.codigo_banco} - {banco.nome}
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
          name="descricao"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição *</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Ex: Conta Principal de Pagamentos" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 grid-cols-3">
          <FormField
            control={form.control}
            name="agencia"
            render={({ field }) => (
              <FormItem className="col-span-2">
                <FormLabel>Agência *</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="0000" className="font-mono" />
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
                  <Input {...field} placeholder="0" className="font-mono" maxLength={2} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-4 grid-cols-3">
          <FormField
            control={form.control}
            name="conta"
            render={({ field }) => (
              <FormItem className="col-span-2">
                <FormLabel>Conta *</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="00000000" className="font-mono" />
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
                  <Input {...field} placeholder="0" className="font-mono" maxLength={2} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-4 grid-cols-2">
          <FormField
            control={form.control}
            name="tipo_conta"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de Conta *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="corrente">Conta Corrente</SelectItem>
                    <SelectItem value="poupanca">Poupança</SelectItem>
                    <SelectItem value="pagamento">Conta Pagamento</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="uso_principal"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Uso Principal</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="folha">Folha de Pagamento</SelectItem>
                    <SelectItem value="ferias">Férias</SelectItem>
                    <SelectItem value="decimo">13º Salário</SelectItem>
                    <SelectItem value="rescisao">Rescisões</SelectItem>
                    <SelectItem value="geral">Uso Geral</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="convenio_pagamento"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Convênio de Pagamento</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Número do convênio com o banco" />
              </FormControl>
              <FormDescription>Código do convênio para geração de arquivos CNAB</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="ativo"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <FormLabel>Conta Ativa</FormLabel>
                <FormDescription>
                  Contas inativas não aparecem nas seleções
                </FormDescription>
              </div>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            <X className="mr-2 h-4 w-4" />
            Cancelar
          </Button>
          <Button type="submit" disabled={saveConta.isPending}>
            {saveConta.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Salvar
          </Button>
        </div>
      </form>
    </Form>
  );
}
