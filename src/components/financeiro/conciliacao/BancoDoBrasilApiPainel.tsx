/**
 * Aba "Banco do Brasil (API)": situação da conexão com as APIs do BB (Edge Function `bb-api`) e importação
 * do extrato de uma conta por período (até 31 dias). Só leitura: nenhum pagamento é feito pela API.
 * As credenciais ficam nos segredos das Edge Functions desta instância; a tela não recebe nem guarda segredo.
 */

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle2, CloudDownload, Loader2, PlugZap, RefreshCw, XCircle } from "lucide-react";
import { DataTable, StatusBadge, type ColunaTabela } from "@/components/design-system";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useExtratoLancamentos, useImportarExtratoBB, useStatusBB } from "@/hooks/useConciliacaoBancaria";
import { useContasBancarias } from "@/hooks/useFinanceiro";
import { formatCurrency } from "@/lib/formatters";
import type { LancamentoExtrato } from "@/types/conciliacaoBancaria";
import { dataBR, documentoMascarado } from "@/lib/bancario/exibicao";

const MAX_DIAS = 31;
const DIA_MS = 86_400_000;

const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const schema = z
  .object({
    conta_bancaria_id: z.string().min(1, "Escolha a conta"),
    data_inicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Informe a data inicial"),
    data_fim: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Informe a data final"),
  })
  .refine((d) => d.data_fim >= d.data_inicio, { path: ["data_fim"], message: "A data final é antes da inicial" })
  .refine((d) => d.data_fim <= iso(new Date()), { path: ["data_fim"], message: "A data final não pode ser futura" })
  .refine(
    (d) => (Date.parse(d.data_fim) - Date.parse(d.data_inicio)) / DIA_MS + 1 <= MAX_DIAS,
    { path: ["data_fim"], message: `O período tem no máximo ${MAX_DIAS} dias` },
  );

type Dados = z.infer<typeof schema>;

const colunas: ColunaTabela<LancamentoExtrato>[] = [
  {
    id: "data",
    cabecalho: "Data",
    celula: (l) => dataBR(l.data_lancamento),
    ordenarPor: (l) => l.data_lancamento,
  },
  {
    id: "descricao",
    cabecalho: "Descrição",
    celula: (l) => l.descricao || "—",
    buscarPor: (l) => l.descricao,
    mobile: "titulo",
  },
  {
    id: "contrapartida",
    cabecalho: "Contrapartida",
    celula: (l) => <span className="font-mono">{documentoMascarado(l.contrapartida_documento)}</span>,
  },
  {
    id: "valor",
    cabecalho: "Valor",
    celula: (l) => (
      <span className="tabular-nums">
        {l.sinal === "D" ? "−" : "+"} {formatCurrency(Number(l.valor))}
      </span>
    ),
    ordenarPor: (l) => (l.sinal === "D" ? -1 : 1) * Number(l.valor),
    alinhamento: "direita",
  },
  {
    id: "conciliado",
    cabecalho: "Pagamento",
    celula: (l) =>
      l.pagamento_id ? <StatusBadge tom="sucesso">Conciliado</StatusBadge> : <StatusBadge tom="neutro">—</StatusBadge>,
  },
];

export function BancoDoBrasilApiPainel() {
  const status = useStatusBB();
  const contas = useContasBancarias();
  const importar = useImportarExtratoBB();
  const hoje = new Date();
  const [periodo, setPeriodo] = useState<Dados | null>(null);
  const extrato = useExtratoLancamentos(periodo?.conta_bancaria_id, periodo?.data_inicio ?? "", periodo?.data_fim ?? "");

  const form = useForm<Dados>({
    resolver: zodResolver(schema),
    defaultValues: {
      conta_bancaria_id: "",
      data_inicio: iso(new Date(hoje.getTime() - 7 * DIA_MS)),
      data_fim: iso(hoje),
    },
  });

  const enviar = async (d: Dados) => {
    const { conta_bancaria_id, data_inicio, data_fim } = d;
    await importar.mutateAsync({ conta_bancaria_id, data_inicio, data_fim });
    setPeriodo(d);
  };

  const s = status.data;
  const faltando = s ? Object.entries(s.configurado ?? {}).filter(([, ok]) => !ok).map(([nome]) => nome) : [];
  const configurado = !!s && faltando.length === 0 && s.ambiente !== "invalido";
  const extratoOk = !!s?.token?.extrato?.ok;
  const validacaoOk = !!s?.token?.validacao?.ok;
  const ambiente = s?.ambiente === "producao" ? "produção" : s?.ambiente === "homologacao" ? "homologação" : null;

  const contasBB = (contas.data ?? []).filter((c) => (c.banco_codigo ?? "").replace(/^0+/, "") === "1");

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-base">
              <PlugZap className="h-4 w-4" aria-hidden /> Conexão com o Banco do Brasil
            </CardTitle>
            <CardDescription>Extratos e validação de contas (só leitura).</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => status.refetch()} disabled={status.isFetching}>
            {status.isFetching ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" aria-hidden />
            )}
            Testar conexão
          </Button>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div aria-live="polite">
            {status.isLoading ? (
              <p className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Consultando…
              </p>
            ) : status.isError ? (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" aria-hidden />
                <AlertTitle>Não foi possível consultar a conexão</AlertTitle>
                <AlertDescription>
                  A função do servidor não respondeu. Ela pode não estar publicada nesta instância.
                </AlertDescription>
              </Alert>
            ) : configurado ? (
              <ul className="space-y-1">
                <li className="flex items-center gap-2">
                  {extratoOk ? (
                    <CheckCircle2 className="h-4 w-4 text-success" aria-hidden />
                  ) : (
                    <XCircle className="h-4 w-4 text-destructive" aria-hidden />
                  )}
                  API de Extratos: {extratoOk ? "conectada" : `sem acesso (${s?.token?.extrato?.erro ?? "erro"})`}
                </li>
                <li className="flex items-center gap-2">
                  {validacaoOk ? (
                    <CheckCircle2 className="h-4 w-4 text-success" aria-hidden />
                  ) : (
                    <XCircle className="h-4 w-4 text-destructive" aria-hidden />
                  )}
                  API de Validação de Contas:{" "}
                  {validacaoOk ? "conectada" : `sem acesso (${s?.token?.validacao?.erro ?? "erro"})`}
                </li>
                <li className="text-muted-foreground">
                  Ambiente: {ambiente ?? "não informado"} · certificado (mTLS): {s?.mtls_pronto ? "configurado" : "ausente"}
                </li>
              </ul>
            ) : (
              <Alert>
                <XCircle className="h-4 w-4" aria-hidden />
                <AlertTitle>Conexão não configurada</AlertTitle>
                <AlertDescription>
                  Faltam credenciais do BB nos segredos das funções do servidor
                  {faltando.length ? `: ${faltando.join(", ")}` : ""}
                  {s?.ambiente === "invalido" ? ". BB_AMBIENTE deve ser homologacao ou producao" : ""}.
                </AlertDescription>
              </Alert>
            )}
          </div>

          <div className="space-y-1 text-muted-foreground">
            <p className="font-medium text-foreground">O que configurar</p>
            <ol className="list-decimal space-y-1 pl-5">
              <li>
                No Portal Developers BB, crie a aplicação com as APIs de Extratos e de Validação de Contas e peça a
                liberação para produção.
              </li>
              <li>Gere o certificado digital da instituição para o acesso com mTLS.</li>
              <li>
                Nos segredos das funções do servidor desta instância, informe <code>BB_AMBIENTE</code> (homologacao
                ou producao), <code>BB_CLIENT_ID</code>, <code>BB_CLIENT_SECRET</code>, <code>BB_APP_KEY</code>,{" "}
                <code>BB_CERT_PEM</code> e <code>BB_KEY_PEM</code>.
              </li>
              <li>Volte aqui e use “Testar conexão”.</li>
            </ol>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Importar extrato</CardTitle>
          <CardDescription>
            Os lançamentos ficam guardados e são conciliados com os pagamentos pelo CPF/CNPJ, valor e data.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(enviar)}
              className="grid gap-4 sm:grid-cols-[2fr_1fr_1fr_auto] sm:items-end"
              noValidate
            >
              <FormField
                control={form.control}
                name="conta_bancaria_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Conta</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange} disabled={contas.isLoading}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={contas.isLoading ? "Carregando…" : "Escolha a conta"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {contasBB.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.nome_conta} · {c.banco_nome}
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
                    <FormLabel>De</FormLabel>
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
                    <FormLabel>Até</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={importar.isPending || !extratoOk}>
                {importar.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                ) : (
                  <CloudDownload className="mr-2 h-4 w-4" aria-hidden />
                )}
                Importar
              </Button>
            </form>
          </Form>
          {!extratoOk && !status.isLoading && (
            <p className="text-xs text-muted-foreground">Disponível depois de configurar a conexão com a API de Extratos.</p>
          )}
          {!contas.isLoading && contasBB.length === 0 && (
            <p className="text-xs text-muted-foreground">
              Nenhuma conta do Banco do Brasil cadastrada em Contas bancárias.
            </p>
          )}

          {periodo && (
            <DataTable
              rotulo="Lançamentos do extrato"
              dados={extrato.data ?? []}
              colunas={colunas}
              chaveLinha={(l) => l.id}
              carregando={extrato.isLoading}
              erro={extrato.isError ? "Não foi possível carregar os lançamentos." : null}
              aoTentarNovamente={() => extrato.refetch()}
              busca={{ placeholder: "Buscar na descrição…" }}
              vazio={{
                icone: CloudDownload,
                titulo: "Nenhum lançamento no período",
                descricao: "O banco não devolveu lançamentos para a conta e o período escolhidos.",
              }}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
