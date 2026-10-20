import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertTriangle, FileCheck2, Loader2, Upload } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import { decodificarArquivoBancario, type ResultadoArquivoBancario } from "@/lib/bancario/comum";
import { lerCnab240 } from "@/lib/bancario/cnab240";
import {
  casarRetorno,
  ehRetornoPrevia,
  problemasRetorno,
  ROTULO_SITUACAO_RETORNO,
  type SituacaoRetorno,
} from "@/lib/bancario/retornoFolha";
import {
  creditosRetornoPensao,
  creditosRetornoServidores,
  useDadosRemessaCNAB,
  useDadosRemessaPensao,
  useRegistrarRetorno,
  useRetornosFolha,
} from "@/hooks/useArquivosFolha";

export interface RemessaParaRetorno {
  id: string;
  folha_id: string;
  numero_remessa: number;
  tipo_credito?: string | null;
  convenio?: string | null;
}

const VARIANTE_SITUACAO: Record<SituacaoRetorno, "secondary" | "default" | "destructive"> = {
  agendado: "secondary",
  pago: "default",
  rejeitado: "destructive",
};

interface Lido {
  arquivo: File;
  lido: ResultadoArquivoBancario;
  previa: boolean;
}

/**
 * Lê o arquivo de retorno que o banco devolveu para a remessa, mostra o que foi agendado, pago e recusado (com o
 * motivo) e grava pela RPC `registrar_retorno_remessa`. Os créditos são remontados das fichas da folha (fechada), do
 * mesmo jeito que o gerador da remessa.
 */
export function ImportarRetornoDialog({
  remessa,
  onOpenChange,
}: {
  remessa: RemessaParaRetorno | null;
  onOpenChange: (open: boolean) => void;
}) {
  const aberto = !!remessa;
  const pensao = remessa?.tipo_credito === "pensao";
  const { fichas } = useDadosRemessaCNAB(remessa?.folha_id ?? "", aberto && !pensao);
  const dadosPensao = useDadosRemessaPensao(remessa?.folha_id ?? "", aberto && pensao);
  const registrar = useRegistrarRetorno();
  const [arquivo, setArquivo] = useState<Lido | null>(null);
  const [erroLeitura, setErroLeitura] = useState<string | null>(null);

  useEffect(() => {
    if (remessa) {
      setArquivo(null);
      setErroLeitura(null);
    }
  }, [remessa]);

  const carregando = pensao ? dadosPensao.fichas.isLoading || dadosPensao.pensoes.isLoading : fichas.isLoading;
  const erroDados = pensao ? dadosPensao.fichas.error || dadosPensao.pensoes.error : fichas.error;
  const creditos = useMemo(() => {
    if (pensao) return creditosRetornoPensao(dadosPensao.fichas.data ?? [], dadosPensao.pensoes.data ?? []);
    return creditosRetornoServidores(fichas.data ?? []);
  }, [pensao, fichas.data, dadosPensao.fichas.data, dadosPensao.pensoes.data]);

  const casado = useMemo(() => (arquivo ? casarRetorno(arquivo.lido, creditos) : null), [arquivo, creditos]);
  const problemas = arquivo && casado ? problemasRetorno(arquivo.lido, casado, remessa?.convenio) : [];
  const recusados = casado?.itens.filter((i) => i.situacao === "rejeitado") ?? [];

  const escolher = async (f: File | undefined) => {
    setArquivo(null);
    setErroLeitura(null);
    if (!f) return;
    try {
      const texto = decodificarArquivoBancario(await f.arrayBuffer());
      setArquivo({ arquivo: f, lido: lerCnab240(texto), previa: ehRetornoPrevia(texto) });
    } catch {
      setErroLeitura("Não foi possível ler o arquivo.");
    }
  };

  const confirmar = () => {
    if (!remessa || !arquivo || !casado) return;
    registrar.mutate(
      { remessaId: remessa.id, folhaId: remessa.folha_id, arquivo: arquivo.arquivo, lido: arquivo.lido, casado, previa: arquivo.previa },
      { onSuccess: () => onOpenChange(false) },
    );
  };

  return (
    <Dialog open={aberto} onOpenChange={(a) => !registrar.isPending && onOpenChange(a)}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Retorno do banco: remessa nº {remessa?.numero_remessa}</DialogTitle>
          <DialogDescription>
            Escolha o arquivo de retorno (.ret) que o banco devolveu para esta remessa. A prévia mostra os créditos
            aceitos e agendados; o retorno depois da data do crédito mostra os pagos. Nada é registrado antes de você
            confirmar.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Input
            type="file"
            accept=".ret,.RET,.txt,.TXT"
            disabled={carregando || registrar.isPending}
            onChange={(e) => escolher(e.target.files?.[0])}
          />
          {carregando && (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Carregando os créditos da remessa...
            </p>
          )}
          {erroDados && (
            <Alert variant="destructive">
              <AlertDescription>Não foi possível carregar os créditos da remessa para conferir o retorno.</AlertDescription>
            </Alert>
          )}
          {erroLeitura && (
            <Alert variant="destructive">
              <AlertDescription>{erroLeitura}</AlertDescription>
            </Alert>
          )}

          {arquivo && casado && (
            <>
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="text-muted-foreground">
                  Arquivo de {arquivo.lido.cabecalho.dataArquivo ? format(new Date(`${arquivo.lido.cabecalho.dataArquivo}T12:00:00`), "dd/MM/yyyy") : "data não informada"}
                  {arquivo.lido.cabecalho.sequencial != null && `, nº ${arquivo.lido.cabecalho.sequencial}`}
                </span>
                {arquivo.previa && <Badge variant="outline">Prévia</Badge>}
              </div>

              {problemas.length > 0 ? (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>O retorno não pode ser registrado nesta remessa</AlertTitle>
                  <AlertDescription>
                    <ul className="list-disc pl-4">
                      {problemas.map((p) => (
                        <li key={p}>{p}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              ) : (
                <>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    {(Object.keys(casado.resumo) as SituacaoRetorno[]).map((s) => (
                      <div key={s} className="rounded-md border p-3">
                        <p className="text-sm text-muted-foreground">{ROTULO_SITUACAO_RETORNO[s]}</p>
                        <p className="text-lg font-semibold">{casado.resumo[s].quantidade}</p>
                        <p className="font-mono text-sm">{formatCurrency(casado.resumo[s].valor)}</p>
                      </div>
                    ))}
                  </div>

                  {(casado.semCredito > 0 || casado.naoRetornados.length > 0) && (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        {casado.semCredito > 0 &&
                          `${casado.semCredito} crédito(s) do retorno não acharam a remessa (ficam registrados sem ficha). `}
                        {casado.naoRetornados.length > 0 &&
                          `${casado.naoRetornados.length} crédito(s) da remessa não vieram no retorno: ` +
                            casado.naoRetornados.map((c) => c.nome).join(", ") + "."}
                      </AlertDescription>
                    </Alert>
                  )}

                  {recusados.length > 0 && (
                    <div className="rounded-md border overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Recusado</TableHead>
                            <TableHead className="text-right">Valor</TableHead>
                            <TableHead>Motivo do banco</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {recusados.map((i, k) => (
                            <TableRow key={k}>
                              <TableCell>{i.credito?.nome || i.linha.favorecido_nome}</TableCell>
                              <TableCell className="text-right font-mono">{formatCurrency(i.linha.valor)}</TableCell>
                              <TableCell className="text-sm">{i.motivo}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                  {recusados.length > 0 && (
                    <p className="text-sm text-muted-foreground">
                      Corrija o banco, a agência, a conta ou o CPF no cadastro de quem foi recusado e pague por uma
                      nova remessa ou pela folha seguinte.
                    </p>
                  )}
                </>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={registrar.isPending}>
            Voltar
          </Button>
          <Button
            type="button"
            onClick={confirmar}
            disabled={!arquivo || !casado || problemas.length > 0 || carregando || !!erroDados || registrar.isPending}
          >
            {registrar.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
            Registrar retorno
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Retornos registrados nas remessas da folha, com os créditos recusados de cada um. */
export function RetornosDaFolha({ folhaId }: { folhaId: string }) {
  const { data: retornos, isLoading } = useRetornosFolha(folhaId);
  if (isLoading || !retornos?.length) return null;

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <FileCheck2 className="h-4 w-4" />
          Retornos do banco
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {retornos.map((r) => {
          const recusados = (r.itens ?? []).filter((i) => i.status === "rejeitado");
          return (
            <div key={r.id} className="space-y-2 rounded-md border p-3">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="font-medium">Remessa nº {r.remessa?.numero_remessa}</span>
                <span className="text-muted-foreground">
                  {r.arquivo_nome ?? "arquivo"}
                  {r.data_arquivo && `, de ${format(new Date(`${r.data_arquivo}T12:00:00`), "dd/MM/yyyy")}`}
                </span>
                {r.previa && <Badge variant="outline">Prévia</Badge>}
              </div>
              <div className="flex flex-wrap gap-2 text-sm">
                <Badge variant={VARIANTE_SITUACAO.agendado}>
                  {r.quantidade_agendados ?? 0} agendado(s) · {formatCurrency(r.valor_agendado ?? 0)}
                </Badge>
                <Badge variant={VARIANTE_SITUACAO.pago}>
                  {r.quantidade_pagos ?? 0} pago(s) · {formatCurrency(r.valor_pago ?? 0)}
                </Badge>
                <Badge variant={VARIANTE_SITUACAO.rejeitado}>
                  {r.quantidade_rejeitados ?? 0} recusado(s) · {formatCurrency(r.valor_rejeitado ?? 0)}
                </Badge>
              </div>
              {recusados.length > 0 && (
                <ul className="list-disc pl-5 text-sm">
                  {recusados.map((i) => (
                    <li key={i.id}>
                      {i.servidor?.nome_completo ?? i.favorecido_nome ?? "Favorecido"}: {formatCurrency(i.valor ?? 0)}
                      {i.descricao_ocorrencia && <span className="text-muted-foreground"> ({i.descricao_ocorrencia})</span>}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
