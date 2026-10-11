/**
 * Criar/editar comissão: nome, tipo, módulo, objeto opcional, ato (tipo, número e data obrigatórios; DOE opcional),
 * período, motivo e situação. Só vale como fundamento de lançamento com ato, ativa e vigente (o banco decide).
 */

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ErrorSummary, FormSection } from "@/components/design-system";
import { useSalvarComissao } from "@/hooks/useComissoes";
import { MODULES_CONFIG } from "@/shared/config/modules.config";
import {
  OBJETO_COMISSAO_LABELS,
  STATUS_COMISSAO_LABELS,
  TIPOS_COMISSAO,
  TIPO_COMISSAO_LABELS,
  type Comissao,
  type TipoComissao,
} from "@/types/comissao";

const SEM_OBJETO = "nenhum";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const schema = z
  .object({
    nome: z.string().trim().min(3, "Informe o nome (mínimo de 3 caracteres)").max(200, "Máximo de 200 caracteres"),
    tipo: z.enum(["inventario", "licitacao", "fiscalizacao_contrato", "outra"]),
    modulo: z.string().min(1, "Escolha o módulo"),
    objeto_tipo: z.string(),
    objeto_id: z.string().trim(),
    ato_tipo: z.string().trim().min(1, "Informe o tipo do ato (ex.: Portaria)").max(60, "Máximo de 60 caracteres"),
    ato_numero: z.string().trim().min(1, "Informe o número do ato").max(60, "Máximo de 60 caracteres"),
    ato_data: z.string().min(1, "Informe a data do ato"),
    ato_doe_numero: z.string().trim().max(60, "Máximo de 60 caracteres"),
    ato_doe_data: z.string(),
    data_inicio: z.string().min(1, "Informe o início"),
    data_fim: z.string(),
    motivo: z.string().trim().min(10, "Descreva o motivo (mínimo de 10 caracteres)").max(1000, "Máximo de 1000 caracteres"),
    status: z.enum(["ativa", "encerrada"]),
  })
  .refine((d) => !d.data_fim || d.data_fim >= d.data_inicio, {
    path: ["data_fim"],
    message: "O fim não pode ser antes do início",
  })
  .refine((d) => d.objeto_tipo === SEM_OBJETO || UUID.test(d.objeto_id), {
    path: ["objeto_id"],
    message: "Informe o identificador do objeto (formato UUID) ou escolha \"Sem objeto\"",
  });

type FormData = z.infer<typeof schema>;

const ROTULOS: Partial<Record<keyof FormData, string>> = {
  nome: "Nome",
  tipo: "Tipo",
  modulo: "Módulo",
  objeto_id: "Identificador do objeto",
  ato_tipo: "Tipo do ato",
  ato_numero: "Número do ato",
  ato_data: "Data do ato",
  data_inicio: "Início",
  data_fim: "Fim",
  motivo: "Motivo",
};

/** Sugestão de módulo e objeto ao escolher o tipo (dá para trocar). */
const SUGESTAO_POR_TIPO: Partial<Record<TipoComissao, { modulo: string; objeto: string }>> = {
  inventario: { modulo: "patrimonio", objeto: "campanha_inventario" },
  licitacao: { modulo: "compras", objeto: "processo_licitatorio" },
  fiscalizacao_contrato: { modulo: "contratos", objeto: "contrato" },
};

const VAZIO: FormData = {
  nome: "",
  tipo: "inventario",
  modulo: "patrimonio",
  objeto_tipo: SEM_OBJETO,
  objeto_id: "",
  ato_tipo: "Portaria",
  ato_numero: "",
  ato_data: "",
  ato_doe_numero: "",
  ato_doe_data: "",
  data_inicio: "",
  data_fim: "",
  motivo: "",
  status: "ativa",
};

function paraForm(c: Comissao | null): FormData {
  if (!c) return VAZIO;
  return {
    nome: c.nome,
    tipo: c.tipo,
    modulo: c.modulo,
    objeto_tipo: c.objeto_tipo ?? SEM_OBJETO,
    objeto_id: c.objeto_id ?? "",
    ato_tipo: c.ato_tipo ?? "",
    ato_numero: c.ato_numero ?? "",
    ato_data: c.ato_data?.slice(0, 10) ?? "",
    ato_doe_numero: c.ato_doe_numero ?? "",
    ato_doe_data: c.ato_doe_data?.slice(0, 10) ?? "",
    data_inicio: c.data_inicio?.slice(0, 10) ?? "",
    data_fim: c.data_fim?.slice(0, 10) ?? "",
    motivo: c.motivo ?? "",
    status: c.status,
  };
}

interface ComissaoFormDialogProps {
  aberto: boolean;
  /** Comissão em edição (nula = nova). */
  comissao: Comissao | null;
  onOpenChange: (aberto: boolean) => void;
}

export function ComissaoFormDialog({ aberto, comissao, onOpenChange }: ComissaoFormDialogProps) {
  const salvar = useSalvarComissao();
  const form = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: VAZIO, shouldFocusError: false });
  const objetoTipo = form.watch("objeto_tipo");

  useEffect(() => {
    if (aberto) form.reset(paraForm(comissao));
  }, [aberto, comissao, form]);

  const aoTrocarTipo = (tipo: TipoComissao) => {
    form.setValue("tipo", tipo);
    const sugestao = SUGESTAO_POR_TIPO[tipo];
    if (!comissao && sugestao) {
      form.setValue("modulo", sugestao.modulo);
      if (form.getValues("objeto_tipo") !== SEM_OBJETO) form.setValue("objeto_tipo", sugestao.objeto);
    }
  };

  const onSubmit = (d: FormData) => {
    const semObjeto = d.objeto_tipo === SEM_OBJETO;
    salvar.mutate(
      {
        id: comissao?.id,
        dados: {
          nome: d.nome,
          tipo: d.tipo,
          modulo: d.modulo,
          objeto_tipo: semObjeto ? null : d.objeto_tipo,
          objeto_id: semObjeto ? null : d.objeto_id,
          ato_tipo: d.ato_tipo,
          ato_numero: d.ato_numero,
          ato_data: d.ato_data,
          ato_doe_numero: d.ato_doe_numero || null,
          ato_doe_data: d.ato_doe_data || null,
          data_inicio: d.data_inicio,
          data_fim: d.data_fim || null,
          motivo: d.motivo,
          status: d.status,
        },
      },
      { onSuccess: () => onOpenChange(false) },
    );
  };

  return (
    <Dialog open={aberto} onOpenChange={(a) => !salvar.isPending && onOpenChange(a)}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{comissao ? "Editar comissão" : "Nova comissão"}</DialogTitle>
          <DialogDescription>
            Os membros só lançam pela comissão com o ato informado, a comissão ativa e dentro do período.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" noValidate>
            <ErrorSummary erros={form.formState.errors} envios={form.formState.submitCount} rotulos={ROTULOS} />

            <FormSection titulo="Identificação">
              <FormField
                control={form.control}
                name="nome"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Ex.: Comissão do levantamento patrimonial 2026" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="tipo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo</FormLabel>
                    <Select value={field.value} onValueChange={(v) => aoTrocarTipo(v as TipoComissao)}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {TIPOS_COMISSAO.map((t) => (
                          <SelectItem key={t} value={t}>
                            {TIPO_COMISSAO_LABELS[t]}
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
                name="modulo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Módulo</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Escolha o módulo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {MODULES_CONFIG.map((m) => (
                          <SelectItem key={m.codigo} value={m.codigo}>
                            {m.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>Onde os membros lançam por esta comissão.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="objeto_tipo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Objeto (opcional)</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={SEM_OBJETO}>Sem objeto (vale no módulo)</SelectItem>
                        {Object.entries(OBJETO_COMISSAO_LABELS).map(([valor, rotulo]) => (
                          <SelectItem key={valor} value={valor}>
                            {rotulo}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>Com objeto, a comissão só vale nele (a campanha, o contrato, o processo).</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {objetoTipo !== SEM_OBJETO && (
                <FormField
                  control={form.control}
                  name="objeto_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Identificador do objeto</FormLabel>
                      <FormControl>
                        <Input {...field} className="font-mono" placeholder="00000000-0000-0000-0000-000000000000" />
                      </FormControl>
                      <FormDescription>O ID do registro no módulo (copie da tela da campanha, do contrato ou do processo).</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </FormSection>

            <FormSection titulo="Ato de designação" descricao="Obrigatório: sem o ato, a comissão não vale como fundamento.">
              <FormField
                control={form.control}
                name="ato_tipo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo do ato</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Portaria" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="ato_numero"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número do ato</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="123/2026" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="ato_data"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data do ato</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="ato_doe_numero"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nº do Diário Oficial (opcional)</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="ato_doe_data"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data do Diário Oficial (opcional)</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </FormSection>

            <FormSection titulo="Período e motivo">
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
              <FormField
                control={form.control}
                name="motivo"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Motivo</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={3} placeholder="Para que a comissão foi criada" />
                    </FormControl>
                    <FormDescription>Não informe CPF nem outros dados pessoais.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {comissao && (
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Situação</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(STATUS_COMISSAO_LABELS).map(([valor, rotulo]) => (
                            <SelectItem key={valor} value={valor}>
                              {rotulo}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>Encerrada, a comissão deixa de valer como fundamento.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </FormSection>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={salvar.isPending}>
                Cancelar
              </Button>
              <Button type="submit" loading={salvar.isPending}>
                {comissao ? "Salvar alterações" : "Cadastrar comissão"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
