/**
 * Corrige banco/agência/conta de um crédito recusado antes do reenvio pelo Gestão MAX
 * (RPC `corrigir_conta_movimento`, que confere `pagamento.conciliar` e guarda quem corrigiu e quando).
 * O servidor usa a conta corrigida ao montar o arquivo de reenvio; o retorno do banco traz a situação nova.
 *
 * Justificativa sempre obrigatória. Conta do BB (001): grava com "Conta confere" na API de Validação de Contas
 * (Edge Function `bb-api`) ou com justificativa de pelo menos 15 caracteres — a RPC exige a mesma regra.
 */

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle2, Loader2, ShieldCheck, XCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { mensagemErro, useCorrigirContaMovimento, useValidarContaBB } from "@/hooks/useConciliacaoBancaria";
import { separarDigito } from "@/lib/cnabGenerator";
import type { MovimentoBancario } from "@/types/conciliacaoBancaria";
import { documentoMascarado } from "@/lib/bancario/exibicao";

/** Mínimo da justificativa para gravar conta do BB sem a validação na API (mesma regra da RPC). */
const MINIMO_JUSTIFICATIVA_SEM_VALIDACAO = 15;

const schema = z.object({
  banco: z.string().trim().regex(/^\d{3}$/, "Código do banco com 3 dígitos (ex.: 001)"),
  agencia: z.string().trim().regex(/^\d{1,5}$/, "Agência: até 5 dígitos, sem o DV"),
  agencia_dv: z.string().trim().regex(/^[0-9Xx]?$/, "DV com 1 posição (número ou X)"),
  conta: z.string().trim().regex(/^\d{1,12}$/, "Conta: até 12 dígitos, sem o DV"),
  conta_dv: z.string().trim().regex(/^[0-9Xx]?$/, "DV com 1 posição (número ou X)"),
  justificativa: z.string().trim().min(1, "Informe por que a conta foi corrigida").max(500, "Até 500 caracteres"),
});

type Dados = z.infer<typeof schema>;

interface Props {
  movimento: MovimentoBancario | null;
  onOpenChange: (aberto: boolean) => void;
}

function valoresIniciais(m: MovimentoBancario | null): Dados {
  const c = m?.conta_corrigida;
  if (c) {
    return {
      banco: c.banco,
      agencia: c.agencia,
      agencia_dv: c.agencia_dv ?? "",
      conta: c.conta,
      conta_dv: c.conta_dv ?? "",
      justificativa: "",
    };
  }
  const ag = separarDigito(m?.agencia);
  const ct = separarDigito(m?.conta);
  return {
    banco: m?.banco ?? "",
    agencia: ag.numero,
    agencia_dv: ag.digito,
    conta: ct.numero,
    conta_dv: ct.digito,
    justificativa: "",
  };
}

/** Chave dos dados conferidos no BB: a validação só vale enquanto banco/agência/conta não mudarem. */
const chaveConta = (d: Pick<Dados, "banco" | "agencia" | "conta">) =>
  `${d.banco.trim()}|${d.agencia.trim()}|${d.conta.trim()}`;

export function CorrigirContaDialog({ movimento, onOpenChange }: Props) {
  const form = useForm<Dados>({ resolver: zodResolver(schema), defaultValues: valoresIniciais(movimento) });
  const validar = useValidarContaBB();
  const corrigir = useCorrigirContaMovimento();
  const [erroValidacao, setErroValidacao] = useState<string | null>(null);
  const [validadoPara, setValidadoPara] = useState<string | null>(null);

  useEffect(() => {
    if (movimento) {
      form.reset(valoresIniciais(movimento));
      validar.reset();
      setErroValidacao(null);
      setValidadoPara(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reinicia só ao abrir para outro movimento
  }, [movimento?.id]);

  const [banco, agencia, conta, justificativa] = form.watch(["banco", "agencia", "conta", "justificativa"]);
  const ehBB = banco.trim() === "001";
  const temDocumento = (movimento?.favorecido_documento ?? "").replace(/\D/g, "").length >= 11;

  const resultado = validar.data;
  const sim = (v: boolean | string | null | undefined) => v === true || v === "S";
  const contaAtiva = sim(resultado?.contaAtiva);
  const titular = sim(resultado?.titularConta);
  const valida = contaAtiva && titular;
  // "Conta confere" só vale para os dados conferidos; mudou banco/agência/conta, precisa validar de novo
  const validadoAtual = valida && validadoPara === chaveConta({ banco, agencia, conta });
  const justificativaLonga = justificativa.trim().length >= MINIMO_JUSTIFICATIVA_SEM_VALIDACAO;
  const liberadoBB = !ehBB || validadoAtual || justificativaLonga;

  const validarNoBB = async () => {
    if (!movimento) return;
    const ok = await form.trigger(["banco", "agencia", "conta"]);
    if (!ok) return;
    setErroValidacao(null);
    const d = form.getValues();
    try {
      await validar.mutateAsync({ movimento_id: movimento.id, banco: d.banco, agencia: d.agencia, conta: d.conta });
      setValidadoPara(chaveConta(d));
    } catch (e) {
      setValidadoPara(null);
      setErroValidacao(await mensagemErro(e));
    }
  };

  const salvar = async (d: Dados) => {
    if (!movimento || !liberadoBB) return;
    await corrigir.mutateAsync({
      movimentoId: movimento.id,
      dados: {
        banco: d.banco,
        agencia: d.agencia,
        agencia_dv: d.agencia_dv.toUpperCase(),
        conta: d.conta,
        conta_dv: d.conta_dv.toUpperCase(),
        justificativa: d.justificativa,
        validado_bb: ehBB && validadoAtual,
      },
    });
    onOpenChange(false);
  };

  const fechar = (v: boolean) => {
    if (corrigir.isPending) return;
    onOpenChange(v);
  };

  return (
    <Dialog open={!!movimento} onOpenChange={fechar}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
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

            {ehBB && (
              <div className="space-y-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={validarNoBB}
                  disabled={validar.isPending || !temDocumento}
                >
                  {validar.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                  ) : (
                    <ShieldCheck className="mr-2 h-4 w-4" aria-hidden />
                  )}
                  Validar no BB
                </Button>
                {!temDocumento && (
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
                  {resultado && validadoPara && (
                    <Alert variant={validadoAtual ? "default" : "destructive"}>
                      {validadoAtual ? (
                        <CheckCircle2 className="h-4 w-4 text-success" aria-hidden />
                      ) : (
                        <XCircle className="h-4 w-4" aria-hidden />
                      )}
                      <AlertTitle>
                        {validadoAtual ? "Conta confere" : valida ? "Dados alterados depois da validação" : "Conta não confere"}
                      </AlertTitle>
                      <AlertDescription>
                        {valida && !validadoAtual
                          ? "Valide de novo com os dados atuais."
                          : `Conta ${contaAtiva ? "ativa" : "inativa ou inexistente"}; o CPF/CNPJ ${titular ? "é" : "não é"} o titular.`}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </div>
            )}

            <FormField
              control={form.control}
              name="justificativa"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Justificativa</FormLabel>
                  <FormControl>
                    <Textarea rows={3} maxLength={500} placeholder="Ex.: conta informada pelo servidor por e-mail" {...field} />
                  </FormControl>
                  <FormDescription>
                    {ehBB
                      ? `Conta do BB: valide no BB ("Conta confere") ou escreva pelo menos ${MINIMO_JUSTIFICATIVA_SEM_VALIDACAO} caracteres.`
                      : "Fica registrada com o seu nome e a data da correção."}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => fechar(false)} disabled={corrigir.isPending}>
                Cancelar
              </Button>
              <Button type="submit" disabled={corrigir.isPending || !liberadoBB}>
                {corrigir.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />}
                Salvar conta corrigida
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
