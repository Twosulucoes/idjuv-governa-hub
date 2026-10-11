/**
 * Corrige banco/agência/conta de um crédito recusado antes do reenvio pelo Gestão MAX.
 * A correção vale para o arquivo gerado; o retorno do banco traz a situação nova.
 * Conta do BB (001) pode ser conferida na API de Validação de Contas (Edge Function `bb-api`).
 */

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle2, Loader2, ShieldCheck, XCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useValidarContaBB, mensagemErro } from "@/hooks/useConciliacaoBancaria";
import { separarDigito } from "@/lib/cnabGenerator";
import type { CorrecaoBancaria, MovimentoBancario } from "@/types/conciliacaoBancaria";
import { documentoMascarado } from "@/lib/bancario/exibicao";

const schema = z.object({
  banco: z.string().trim().regex(/^\d{3}$/, "Código do banco com 3 dígitos (ex.: 001)"),
  agencia: z.string().trim().regex(/^\d{1,5}$/, "Agência: até 5 dígitos, sem o DV"),
  agencia_dv: z.string().trim().regex(/^[0-9Xx]?$/, "DV com 1 posição (número ou X)"),
  conta: z.string().trim().regex(/^\d{1,12}$/, "Conta: até 12 dígitos, sem o DV"),
  conta_dv: z.string().trim().regex(/^[0-9Xx]?$/, "DV com 1 posição (número ou X)"),
});

type Dados = z.infer<typeof schema>;

interface Props {
  movimento: MovimentoBancario | null;
  /** Correção já feita nesta sessão (tem prioridade sobre o que veio do arquivo) */
  correcao?: CorrecaoBancaria;
  onOpenChange: (aberto: boolean) => void;
  onSalvar: (movimentoId: string, correcao: CorrecaoBancaria) => void;
}

function valoresIniciais(m: MovimentoBancario | null, c?: CorrecaoBancaria): Dados {
  if (c) return { ...c };
  const ag = separarDigito(m?.agencia);
  const ct = separarDigito(m?.conta);
  return {
    banco: m?.banco ?? "",
    agencia: ag.numero,
    agencia_dv: ag.digito,
    conta: ct.numero,
    conta_dv: ct.digito,
  };
}

export function CorrigirContaDialog({ movimento, correcao, onOpenChange, onSalvar }: Props) {
  const form = useForm<Dados>({ resolver: zodResolver(schema), defaultValues: valoresIniciais(movimento, correcao) });
  const validar = useValidarContaBB();
  const [erroValidacao, setErroValidacao] = useState<string | null>(null);

  useEffect(() => {
    if (movimento) {
      form.reset(valoresIniciais(movimento, correcao));
      validar.reset();
      setErroValidacao(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reinicia só ao abrir para outro movimento
  }, [movimento?.id]);

  const banco = form.watch("banco");
  const documento = (movimento?.favorecido_documento ?? "").replace(/\D/g, "");

  const validarNoBB = async () => {
    const ok = await form.trigger(["banco", "agencia", "conta"]);
    if (!ok) return;
    setErroValidacao(null);
    const { agencia, conta } = form.getValues();
    try {
      await validar.mutateAsync({ agencia, conta, cpf_cnpj: documento });
    } catch (e) {
      setErroValidacao(await mensagemErro(e));
    }
  };

  const salvar = (d: Dados) => {
    if (!movimento) return;
    onSalvar(movimento.id, {
      banco: d.banco,
      agencia: d.agencia,
      agencia_dv: d.agencia_dv.toUpperCase(),
      conta: d.conta,
      conta_dv: d.conta_dv.toUpperCase(),
    });
    onOpenChange(false);
  };

  const resultado = validar.data;
  const sim = (v: boolean | string | null | undefined) => v === true || v === "S";
  const contaAtiva = sim(resultado?.contaAtiva);
  const titular = sim(resultado?.titularConta);
  const valida = contaAtiva && titular;

  return (
    <Dialog open={!!movimento} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Corrigir dados bancários</DialogTitle>
          <DialogDescription>
            {movimento?.favorecido_nome || "Favorecido"} · {documentoMascarado(movimento?.favorecido_documento)}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(salvar)} className="space-y-4" noValidate>
            <FormField
              control={form.control}
              name="banco"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Banco</FormLabel>
                  <FormControl>
                    <Input inputMode="numeric" maxLength={3} placeholder="001" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-[1fr_5rem] gap-3">
              <FormField
                control={form.control}
                name="agencia"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Agência</FormLabel>
                    <FormControl>
                      <Input inputMode="numeric" maxLength={5} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="agencia_dv"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>DV</FormLabel>
                    <FormControl>
                      <Input maxLength={1} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-[1fr_5rem] gap-3">
              <FormField
                control={form.control}
                name="conta"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Conta</FormLabel>
                    <FormControl>
                      <Input inputMode="numeric" maxLength={12} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="conta_dv"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>DV</FormLabel>
                    <FormControl>
                      <Input maxLength={1} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {banco === "001" && (
              <div className="space-y-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={validarNoBB}
                  disabled={validar.isPending || documento.length < 11}
                >
                  {validar.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                  ) : (
                    <ShieldCheck className="mr-2 h-4 w-4" aria-hidden />
                  )}
                  Validar no BB
                </Button>
                {documento.length < 11 && (
                  <p className="text-xs text-muted-foreground">Sem CPF/CNPJ no movimento: não dá para validar.</p>
                )}
                <div aria-live="polite">
                  {erroValidacao && (
                    <Alert variant="destructive">
                      <XCircle className="h-4 w-4" aria-hidden />
                      <AlertTitle>Validação indisponível</AlertTitle>
                      <AlertDescription>{erroValidacao}</AlertDescription>
                    </Alert>
                  )}
                  {resultado && (
                    <Alert variant={valida ? "default" : "destructive"}>
                      {valida ? (
                        <CheckCircle2 className="h-4 w-4 text-success" aria-hidden />
                      ) : (
                        <XCircle className="h-4 w-4" aria-hidden />
                      )}
                      <AlertTitle>{valida ? "Conta confere" : "Conta não confere"}</AlertTitle>
                      <AlertDescription>
                        Conta {contaAtiva ? "ativa" : "inativa ou inexistente"}; o CPF/CNPJ{" "}
                        {titular ? "é" : "não é"} o titular.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit">Usar estes dados no reenvio</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
