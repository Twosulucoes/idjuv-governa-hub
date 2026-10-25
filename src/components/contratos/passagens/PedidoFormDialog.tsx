/**
 * Cadastro (ou edição) do pedido de passagem: o processo SEI, quem pediu, o evento e o contrato da agência.
 * A situação não se digita aqui: muda pelo botão "Mudar situação" da ficha.
 */

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useContratosPassagens, type PedidoInput } from "@/hooks/usePassagens";
import { MODOS_PRESTACAO, ORIGENS_PEDIDO, TIPOS_SOLICITANTE, type PassagemPedido } from "@/types/passagens";
import { BeneficiarioBusca } from "./BeneficiarioBusca";
import { ServidorBusca } from "./ServidorBusca";

const SEM_CONTRATO = "sem_contrato";
const pessoa = z.object({ id: z.string(), nome: z.string() }).nullable();
type Escolha = { id: string; nome: string } | null;

const schema = z
  .object({
    numero_sei: z.string().trim().min(5, "Informe o nº do processo SEI").max(60),
    data_pedido: z.string().min(1, "Informe a data"),
    origem: z.string(),
    solicitante_tipo: z.enum(["servidor", "beneficiario", "instituicao"]),
    servidor: pessoa,
    beneficiario: pessoa,
    instituicao_nome: z.string().trim().max(200).optional(),
    contrato_id: z.string(),
    finalidade: z.string().trim().min(3, "Descreva a finalidade").max(2000),
    evento: z.string().trim().max(300).optional(),
    destino_cidade: z.string().trim().max(120).optional(),
    destino_uf: z.string().trim().toUpperCase().refine((v) => !v || /^[A-Z]{2}$/.test(v), "UF com 2 letras").optional(),
    data_inicio: z.string().optional(),
    data_fim: z.string().optional(),
    prestacao_contas: z.string(),
    prestacao_dispensa_motivo: z.string().trim().max(1000).optional(),
    observacoes: z.string().trim().max(2000).optional(),
  })
  .refine((d) => d.solicitante_tipo !== "servidor" || d.servidor, { message: "Escolha o servidor", path: ["servidor"] })
  .refine((d) => d.solicitante_tipo !== "beneficiario" || d.beneficiario, { message: "Escolha a pessoa", path: ["beneficiario"] })
  .refine((d) => d.solicitante_tipo !== "instituicao" || d.instituicao_nome, { message: "Informe a instituição", path: ["instituicao_nome"] })
  .refine((d) => !d.data_inicio || !d.data_fim || d.data_fim >= d.data_inicio, { message: "O fim vem depois do início", path: ["data_fim"] })
  .refine((d) => d.prestacao_contas !== "dispensado" || (d.prestacao_dispensa_motivo ?? "").length >= 3, {
    message: "Escreva o motivo da dispensa",
    path: ["prestacao_dispensa_motivo"],
  });

type FormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pedido?: PassagemPedido | null;
  salvando?: boolean;
  podeCadastrar?: boolean;
  onSalvar: (dados: PedidoInput) => Promise<unknown>;
}

const hoje = () => new Date().toLocaleDateString("sv-SE");

export function PedidoFormDialog({ open, onOpenChange, pedido, salvando, podeCadastrar, onSalvar }: Props) {
  const contratos = useContratosPassagens();
  const form = useForm<FormData>({ resolver: zodResolver(schema) });
  const tipo = form.watch("solicitante_tipo");
  const modoPrestacao = form.watch("prestacao_contas");

  useEffect(() => {
    if (!open) return;
    const unicoContrato = contratos.data?.length === 1 ? contratos.data[0].id : undefined;
    form.reset({
      numero_sei: pedido?.numero_sei ?? "",
      data_pedido: pedido?.data_pedido ?? hoje(),
      origem: pedido?.origem ?? "sei",
      solicitante_tipo: (pedido?.solicitante_tipo as FormData["solicitante_tipo"]) ?? "instituicao",
      servidor: pedido?.solicitante_servidor_id ? { id: pedido.solicitante_servidor_id, nome: pedido.solicitante_nome ?? "" } : null,
      beneficiario: pedido?.solicitante_beneficiario_id ? { id: pedido.solicitante_beneficiario_id, nome: pedido.solicitante_nome ?? "" } : null,
      instituicao_nome: pedido?.solicitante_tipo === "instituicao" ? (pedido.solicitante_nome ?? "") : "",
      contrato_id: pedido?.contrato_id ?? unicoContrato ?? SEM_CONTRATO,
      finalidade: pedido?.finalidade ?? "",
      evento: pedido?.evento ?? "",
      destino_cidade: pedido?.destino_cidade ?? "",
      destino_uf: pedido?.destino_uf ?? "",
      data_inicio: pedido?.data_inicio ?? "",
      data_fim: pedido?.data_fim ?? "",
      prestacao_contas: pedido?.prestacao_contas ?? "individual",
      prestacao_dispensa_motivo: pedido?.prestacao_dispensa_motivo ?? "",
      observacoes: pedido?.observacoes ?? "",
    });
  }, [open, pedido, form, contratos.data]);

  const onSubmit = async (d: FormData) => {
    try {
      await onSalvar({
        id: pedido?.id,
        numero_sei: d.numero_sei,
        data_pedido: d.data_pedido,
        origem: d.origem,
        solicitante_tipo: d.solicitante_tipo,
        solicitante_servidor_id: d.solicitante_tipo === "servidor" ? d.servidor!.id : null,
        solicitante_beneficiario_id: d.solicitante_tipo === "beneficiario" ? d.beneficiario!.id : null,
        solicitante_instituicao_id: null,
        ...(d.solicitante_tipo === "instituicao" ? { solicitante_nome: d.instituicao_nome } : {}),
        contrato_id: d.contrato_id === SEM_CONTRATO ? null : d.contrato_id,
        finalidade: d.finalidade,
        evento: d.evento || null,
        destino_cidade: d.destino_cidade || null,
        destino_uf: d.destino_uf || null,
        data_inicio: d.data_inicio || null,
        data_fim: d.data_fim || null,
        prestacao_contas: d.prestacao_contas,
        prestacao_dispensa_motivo: d.prestacao_contas === "dispensado" ? d.prestacao_dispensa_motivo : null,
        observacoes: d.observacoes || null,
      });
      onOpenChange(false);
    } catch {
      // erro já exibido pelo toast da mutation; o diálogo continua aberto
    }
  };

  const lista = (name: "origem" | "solicitante_tipo" | "prestacao_contas", rotulo: string, opcoes: readonly { value: string; label: string }[]) => (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{rotulo}</FormLabel>
          <Select value={field.value} onValueChange={field.onChange}>
            <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
            <SelectContent>
              {opcoes.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );

  const texto = (name: "numero_sei" | "data_pedido" | "evento" | "destino_cidade" | "destino_uf" | "data_inicio" | "data_fim", rotulo: string, extra: React.ComponentProps<typeof Input> = {}) => (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{rotulo}</FormLabel>
          <FormControl><Input {...extra} {...field} value={field.value ?? ""} /></FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{pedido ? "Editar pedido" : "Novo pedido de passagem"}</DialogTitle>
          <DialogDescription>Um pedido para cada processo SEI. Passageiros e trechos entram na ficha.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div className="grid gap-4 sm:grid-cols-[minmax(0,1.3fr)_minmax(9.5rem,1fr)_minmax(0,0.9fr)]">
              {texto("numero_sei", "Processo SEI *", { placeholder: "Nº do processo no SEI", inputMode: "numeric" })}
              {texto("data_pedido", "Data do pedido *", { type: "date" })}
              {lista("origem", "Chegou por", ORIGENS_PEDIDO)}
            </div>
            {lista("solicitante_tipo", "Quem pediu", TIPOS_SOLICITANTE)}
            {tipo === "servidor" && (
              <FormField
                control={form.control}
                name="servidor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Servidor *</FormLabel>
                    <ServidorBusca escolhido={field.value as Escolha} aoEscolher={(s) => field.onChange(s && { id: s.id, nome: s.nome })} />
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            {tipo === "beneficiario" && (
              <FormField
                control={form.control}
                name="beneficiario"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pessoa *</FormLabel>
                    <BeneficiarioBusca escolhido={field.value as Escolha} aoEscolher={field.onChange} podeCadastrar={podeCadastrar} />
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            {tipo === "instituicao" && (
              <FormField
                control={form.control}
                name="instituicao_nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Instituição *</FormLabel>
                    <FormControl><Input placeholder="Ex.: Federação Estadual de Judô" {...field} value={field.value ?? ""} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <FormField
              control={form.control}
              name="finalidade"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Finalidade *</FormLabel>
                  <FormControl><Textarea rows={2} placeholder="Ex.: participação no Campeonato Brasileiro Sub-18" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {texto("evento", "Evento")}
            <div className="grid gap-4 sm:grid-cols-[1fr_5rem]">
              {texto("destino_cidade", "Cidade de destino")}
              {texto("destino_uf", "UF", { maxLength: 2 })}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {texto("data_inicio", "Início do evento", { type: "date" })}
              {texto("data_fim", "Fim do evento", { type: "date" })}
            </div>
            <FormField
              control={form.control}
              name="contrato_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contrato da agência</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value={SEM_CONTRATO}>Sem contrato definido</SelectItem>
                      {(contratos.data ?? []).map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.numero_contrato}/{c.ano} · {c.fornecedor?.nome_fantasia ?? c.fornecedor?.razao_social ?? c.objeto_resumido ?? "contrato"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>O valor emitido sai do saldo deste contrato.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            {lista("prestacao_contas", "Prestação de contas", MODOS_PRESTACAO)}
            {modoPrestacao === "dispensado" && (
              <FormField
                control={form.control}
                name="prestacao_dispensa_motivo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Motivo da dispensa</FormLabel>
                    <FormControl><Textarea rows={2} {...field} /></FormControl>
                    <FormDescription>O cartão de embarque continua sendo pedido.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
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
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button type="submit" disabled={salvando}>Salvar</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
