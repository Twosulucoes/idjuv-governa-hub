/**
 * Assistente genérico de importação: arquivo → leitura e simulação → conferência → aplicação.
 * Funciona com qualquer `Importador` (src/lib/importacao/types.ts).
 */

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AlertCircle, AlertTriangle, CheckCircle2, FileUp, Loader2, RotateCcw } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { buscarImportacaoPorHash } from "@/hooks/useImportacoes";
import { calcularSha256 } from "@/lib/importacao/arquivo";
import type {
  AcaoLinha,
  Importador,
  MetadadosArquivo,
  ResultadoBanco,
  ResultadoLeitura,
} from "@/lib/importacao/types";

const ROTULO_ACAO: Record<AcaoLinha, string> = {
  inserir: "Nova",
  atualizar: "Atualiza",
  sem_alteracao: "Sem mudança",
};

const VARIANTE_ACAO: Record<AcaoLinha, "default" | "secondary" | "outline"> = {
  inserir: "default",
  atualizar: "secondary",
  sem_alteracao: "outline",
};

/** Arquivos maiores travariam o navegador na leitura; relatórios reais têm poucos MB. */
const TAMANHO_MAXIMO = 20 * 1024 * 1024;

type Etapa = "arquivo" | "processando" | "conferencia" | "aplicando" | "concluido";

interface Props<TLinha> {
  importador: Importador<TLinha>;
  /** Chamado depois de aplicar, com os parâmetros lidos do arquivo (ex.: exercício) */
  onConcluido?: (resultado: ResultadoBanco, parametros: Record<string, unknown>) => void;
  /** Avisa quando há leitura ou gravação em curso (o diálogo não deve fechar no meio) */
  onOcupadoChange?: (ocupado: boolean) => void;
}

function mensagemErro(e: unknown): string {
  if (e && typeof e === "object" && "message" in e) return String((e as { message: unknown }).message);
  return "Erro inesperado.";
}

export function ImportacaoWizard<TLinha>({ importador, onConcluido, onOcupadoChange }: Props<TLinha>) {
  const queryClient = useQueryClient();
  const [etapa, setEtapa] = useState<Etapa>("arquivo");
  const [arquivo, setArquivo] = useState<MetadadosArquivo | null>(null);
  const [leitura, setLeitura] = useState<ResultadoLeitura<TLinha> | null>(null);
  const [simulacao, setSimulacao] = useState<ResultadoBanco | null>(null);
  const [erroBanco, setErroBanco] = useState<string | null>(null);
  const [jaImportadoEm, setJaImportadoEm] = useState<string | null>(null);
  const [resultado, setResultado] = useState<ResultadoBanco | null>(null);
  /** Falha ao aplicar (rede, permissão): mostra, mas deixa tentar de novo */
  const [erroAplicar, setErroAplicar] = useState<string | null>(null);

  const ocupado = etapa === "processando" || etapa === "aplicando";
  useEffect(() => {
    onOcupadoChange?.(ocupado);
  }, [ocupado, onOcupadoChange]);

  const reiniciar = () => {
    setEtapa("arquivo");
    setArquivo(null);
    setLeitura(null);
    setSimulacao(null);
    setErroBanco(null);
    setJaImportadoEm(null);
    setResultado(null);
    setErroAplicar(null);
  };

  const selecionar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > TAMANHO_MAXIMO) {
      toast.error("Arquivo grande demais", { description: "O limite é 20 MB." });
      return;
    }
    setEtapa("processando");
    setErroBanco(null);
    try {
      const meta: MetadadosArquivo = { nome: file.name, tamanho: file.size, sha256: await calcularSha256(file) };
      const lido = await importador.ler(file);
      setArquivo(meta);
      setLeitura(lido);
      setSimulacao(null);
      const temErro = lido.problemas.some((p) => p.gravidade === "erro");
      if (!temErro) {
        const [sim, anterior] = await Promise.all([
          importador.enviar(lido, meta, true).catch((err) => {
            setErroBanco(mensagemErro(err));
            return null;
          }),
          buscarImportacaoPorHash(importador.id, meta.sha256).catch(() => null),
        ]);
        setSimulacao(sim);
        setJaImportadoEm(anterior?.created_at ?? null);
      }
      setEtapa("conferencia");
    } catch (err) {
      toast.error("Não foi possível ler o arquivo", { description: mensagemErro(err) });
      setEtapa("arquivo");
    }
  };

  const aplicar = async () => {
    if (!leitura || !arquivo) return;
    setEtapa("aplicando");
    setErroAplicar(null);
    try {
      const res = await importador.enviar(leitura, arquivo, false);
      setResultado(res);
      setEtapa("concluido");
      await Promise.all([
        ...(importador.invalidar ?? []).map((queryKey) => queryClient.invalidateQueries({ queryKey })),
        queryClient.invalidateQueries({ queryKey: ["importacoes"] }),
      ]);
      toast.success("Importação concluída");
      onConcluido?.(res, leitura.parametros);
    } catch (err) {
      toast.error("A importação não foi aplicada", { description: mensagemErro(err) });
      setErroAplicar(mensagemErro(err));
      setEtapa("conferencia");
    }
  };

  if (etapa === "arquivo" || etapa === "processando") {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">{importador.instrucoes}</p>
        <label className="flex cursor-pointer flex-col items-center gap-3 rounded-lg border-2 border-dashed p-8 text-center hover:bg-muted/50">
          {etapa === "processando" ? (
            <>
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-hidden />
              <span className="text-sm">Lendo o arquivo e comparando com o sistema…</span>
            </>
          ) : (
            <>
              <FileUp className="h-8 w-8 text-muted-foreground" aria-hidden />
              <span className="text-sm font-medium">Escolher arquivo</span>
              <span className="text-xs text-muted-foreground">Nada é gravado antes da sua confirmação.</span>
            </>
          )}
          <Input
            type="file"
            accept={importador.aceita}
            onChange={selecionar}
            disabled={etapa === "processando"}
            className="sr-only"
          />
        </label>
      </div>
    );
  }

  if (!leitura || !arquivo) return null;

  const erros = leitura.problemas.filter((p) => p.gravidade === "erro");
  const avisos = leitura.problemas.filter((p) => p.gravidade === "aviso");
  const final = resultado ?? simulacao;
  const acaoPorIndice = new Map(final?.linhas.map((l) => [l.indice, l]) ?? []);
  const criados = Object.entries(final?.criados ?? {}).filter(([, itens]) => itens.length > 0);
  const podeAplicar = etapa === "conferencia" && erros.length === 0 && simulacao && !erroBanco;
  const nadaMuda =
    simulacao && simulacao.totais.inserir === 0 && simulacao.totais.atualizar === 0 && criados.length === 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{arquivo.nome}</p>
          <p className="text-xs text-muted-foreground">
            {Object.entries(leitura.cabecalho)
              .map(([k, v]) => `${k}: ${v}`)
              .join(" · ")}
          </p>
        </div>
        {etapa !== "aplicando" && (
          <Button variant="ghost" size="sm" onClick={reiniciar}>
            <RotateCcw className="mr-2 h-4 w-4" aria-hidden />
            {etapa === "concluido" ? "Importar outro arquivo" : "Trocar arquivo"}
          </Button>
        )}
      </div>

      {etapa === "concluido" && resultado && (
        <Alert>
          <CheckCircle2 className="h-4 w-4 text-success" aria-hidden />
          <AlertTitle>Importação aplicada</AlertTitle>
          <AlertDescription>
            {resultado.totais.inserir} nova(s), {resultado.totais.atualizar} atualizada(s) e{" "}
            {resultado.totais.sem_alteracao} sem mudança. O registro ficou no histórico de importações.
          </AlertDescription>
        </Alert>
      )}

      {erros.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" aria-hidden />
          <AlertTitle>O arquivo não pode ser importado</AlertTitle>
          <AlertDescription>
            <ul className="list-disc pl-4">
              {erros.map((p, i) => (
                <li key={i}>{p.mensagem}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {erroAplicar && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" aria-hidden />
          <AlertTitle>A importação não foi aplicada</AlertTitle>
          <AlertDescription>{erroAplicar} Nada foi gravado; você pode tentar de novo.</AlertDescription>
        </Alert>
      )}

      {erroBanco && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" aria-hidden />
          <AlertTitle>O sistema recusou a importação</AlertTitle>
          <AlertDescription>{erroBanco}</AlertDescription>
        </Alert>
      )}

      {avisos.length > 0 && etapa !== "concluido" && (
        <Alert>
          <AlertTriangle className="h-4 w-4 text-warning" aria-hidden />
          <AlertTitle>Avisos</AlertTitle>
          <AlertDescription>
            <ul className="list-disc pl-4">
              {avisos.map((p, i) => (
                <li key={i}>{p.mensagem}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {jaImportadoEm && etapa !== "concluido" && (
        <Alert>
          <AlertTriangle className="h-4 w-4 text-warning" aria-hidden />
          <AlertTitle>Este mesmo arquivo já foi importado</AlertTitle>
          <AlertDescription>
            Em {new Date(jaImportadoEm).toLocaleString("pt-BR")}. Importar de novo só reaplica os mesmos valores.
          </AlertDescription>
        </Alert>
      )}

      {final && (
        <div className="flex flex-wrap gap-2 text-sm">
          <Badge>{final.totais.inserir} nova(s)</Badge>
          <Badge variant="secondary">{final.totais.atualizar} atualizada(s)</Badge>
          <Badge variant="outline">{final.totais.sem_alteracao} sem mudança</Badge>
        </div>
      )}

      {criados.length > 0 && (
        <div className="rounded-md border p-3 text-sm">
          <p className="font-medium">
            {etapa === "concluido" ? "Cadastros criados" : "Cadastros que serão criados"}
          </p>
          <ul className="mt-1 space-y-0.5 text-muted-foreground">
            {criados.map(([rotulo, itens]) => (
              <li key={rotulo}>
                {rotulo}: {itens.join(", ")}
              </li>
            ))}
          </ul>
        </div>
      )}

      {final?.ausentes && final.ausentes.length > 0 && (
        <div className="rounded-md border p-3 text-sm">
          <p className="font-medium">No sistema, mas fora do arquivo ({final.ausentes.length})</p>
          <p className="text-muted-foreground">
            Ficam como estão (nada é apagado): {final.ausentes.slice(0, 10).join(", ")}
            {final.ausentes.length > 10 ? "…" : ""}
          </p>
        </div>
      )}

      <div className="max-h-80 overflow-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow className="text-xs">
              <TableHead>Situação</TableHead>
              {importador.colunas.map((c) => (
                <TableHead key={c.id} className={c.alinhamento === "direita" ? "text-right" : undefined}>
                  {c.rotulo}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {leitura.linhas.map((linha, i) => {
              const banco = acaoPorIndice.get(i);
              const temErro = leitura.problemas.some((p) => p.linha === i && p.gravidade === "erro");
              return (
                <TableRow key={i} className="text-xs">
                  <TableCell>
                    {temErro ? (
                      <Badge variant="destructive">Erro</Badge>
                    ) : banco ? (
                      <div className="space-y-0.5">
                        <Badge variant={VARIANTE_ACAO[banco.acao]} className="whitespace-nowrap">
                          {ROTULO_ACAO[banco.acao]}
                        </Badge>
                        {banco.mudancas && (
                          <p className="max-w-[180px] text-[11px] text-muted-foreground">
                            {Object.keys(banco.mudancas)
                              .map((campo) => importador.rotulosCampos?.[campo] ?? campo)
                              .join(", ")}
                          </p>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  {importador.colunas.map((c) => (
                    <TableCell
                      key={c.id}
                      className={c.alinhamento === "direita" ? "text-right font-mono" : "font-mono"}
                    >
                      {c.valor(linha)}
                    </TableCell>
                  ))}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {etapa !== "concluido" && (
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={reiniciar} disabled={etapa === "aplicando"}>
            Cancelar
          </Button>
          <Button onClick={aplicar} disabled={!podeAplicar || !!nadaMuda}>
            {etapa === "aplicando" && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />}
            {nadaMuda ? "Nada a atualizar" : `Confirmar importação de ${leitura.linhas.length} linha(s)`}
          </Button>
        </div>
      )}
    </div>
  );
}
