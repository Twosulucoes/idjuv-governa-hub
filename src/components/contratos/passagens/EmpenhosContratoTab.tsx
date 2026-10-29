/**
 * Aba "Empenhos" das faturas de passagens: o empenho de cada exercício × bilhetes emitidos no ano, a lista dos
 * empenhos ligados ao contrato e, para quem tem o financeiro das passagens, os candidatos do elemento 33 para ligar ou
 * desligar. O FIP 614 não traz o contrato, por isso a ligação é feita aqui. Liquidado e pago vêm do FIPLAN.
 */

import { useMemo, useState } from "react";
import { Link2, Link2Off, Receipt } from "lucide-react";
import { DataTable, EmptyState, type ColunaTabela } from "@/components/design-system";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency, formatDateBR } from "@/lib/formatters";
import { saldoEmpenhoPorExercicio } from "@/lib/passagens/faturas";
import { useEmpenhosCandidatos, useEmpenhosContrato, useLigarEmpenho } from "@/hooks/usePassagensFaturas";
import type { BilheteDoContrato, EmpenhoCandidato, EmpenhoDoContrato } from "@/types/passagens";

interface Props {
  contratoId: string;
  bilhetes: BilheteDoContrato[];
  podeEditar: boolean;
}

const liquido = (e: { valor_empenhado: number; valor_anulado: number }) => Number(e.valor_empenhado) - Number(e.valor_anulado);

export function EmpenhosContratoTab({ contratoId, bilhetes, podeEditar }: Props) {
  const empenhos = useEmpenhosContrato(contratoId);
  const [ano, setAno] = useState<string>(String(new Date().getFullYear()));
  const [ligando, setLigando] = useState(false);
  const candidatos = useEmpenhosCandidatos(contratoId, Number(ano), podeEditar && ligando);
  const ligar = useLigarEmpenho(contratoId);
  const exercicios = useMemo(() => saldoEmpenhoPorExercicio(empenhos.data ?? [], bilhetes), [empenhos.data, bilhetes]);

  const colunasLigados: ColunaTabela<EmpenhoDoContrato>[] = [
    { id: "numero", cabecalho: "Empenho", celula: (e) => <span className="font-medium">{e.numero}</span>, ordenarPor: (e) => e.numero, buscarPor: (e) => e.numero, mobile: "titulo" },
    { id: "exercicio", cabecalho: "Exercício", celula: (e) => e.exercicio, ordenarPor: (e) => e.exercicio },
    { id: "data", cabecalho: "Data", celula: (e) => formatDateBR(e.data_empenho), ordenarPor: (e) => e.data_empenho },
    { id: "natureza", cabecalho: "Natureza", celula: (e) => e.natureza ?? "—" },
    { id: "empenhado", cabecalho: "Empenhado", celula: (e) => <span className="tabular-nums">{formatCurrency(liquido(e))}</span>, ordenarPor: liquido, alinhamento: "direita" },
    { id: "liquidado", cabecalho: "Liquidado", celula: (e) => <span className="tabular-nums">{formatCurrency(e.valor_liquidado)}</span>, alinhamento: "direita" },
    { id: "pago", cabecalho: "Pago", celula: (e) => <span className="tabular-nums">{formatCurrency(e.valor_pago)}</span>, alinhamento: "direita" },
  ];

  const colunasCandidatos: ColunaTabela<EmpenhoCandidato>[] = [
    { id: "numero", cabecalho: "Empenho", celula: (e) => <span className="font-medium">{e.numero}</span>, ordenarPor: (e) => e.numero, buscarPor: (e) => `${e.numero} ${e.credor ?? ""} ${e.processo_sei ?? ""}`, mobile: "titulo" },
    { id: "credor", cabecalho: "Credor", celula: (e) => e.credor ?? "—", ordenarPor: (e) => e.credor ?? "", className: "min-w-[12rem]" },
    { id: "natureza", cabecalho: "Natureza", celula: (e) => e.natureza ?? "—" },
    { id: "valor", cabecalho: "Empenhado", celula: (e) => <span className="tabular-nums">{formatCurrency(liquido(e))}</span>, ordenarPor: liquido, alinhamento: "direita" },
    {
      id: "acao",
      cabecalho: <span className="sr-only">Ligar</span>,
      celula: (e) => (
        <Button
          size="sm"
          variant={e.ligado ? "outline" : "default"}
          disabled={ligar.isPending}
          onClick={() => ligar.mutate({ empenhoId: e.empenho_id, ligar: !e.ligado })}
        >
          {e.ligado ? <Link2Off className="h-4 w-4" aria-hidden="true" /> : <Link2 className="h-4 w-4" aria-hidden="true" />}
          {e.ligado ? "Desligar" : "Ligar"}
        </Button>
      ),
      alinhamento: "direita",
    },
  ];

  const anos = Array.from({ length: 4 }, (_, i) => String(new Date().getFullYear() - i));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Empenho por exercício</CardTitle>
          <p className="text-sm text-muted-foreground">Empenhado (menos anulado) × bilhetes emitidos no ano. Liquidado e pago vêm da última importação do FIP 614.</p>
        </CardHeader>
        <CardContent>
          {exercicios.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum empenho ligado e nenhum bilhete emitido.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <caption className="sr-only">Empenho por exercício</caption>
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                    <th scope="col" className="py-2 pr-4 font-medium">Exercício</th>
                    <th scope="col" className="py-2 pr-4 text-right font-medium">Empenhado</th>
                    <th scope="col" className="py-2 pr-4 text-right font-medium">Emitido</th>
                    <th scope="col" className="py-2 pr-4 text-right font-medium">Sobra do empenho</th>
                    <th scope="col" className="py-2 pr-4 text-right font-medium">Liquidado</th>
                    <th scope="col" className="py-2 text-right font-medium">Pago</th>
                  </tr>
                </thead>
                <tbody>
                  {exercicios.map((e) => (
                    <tr key={e.exercicio} className="border-b border-border last:border-0">
                      <th scope="row" className="py-2 pr-4 text-left font-medium">{e.exercicio}</th>
                      <td className="py-2 pr-4 text-right tabular-nums">{formatCurrency(e.empenhado)}</td>
                      <td className="py-2 pr-4 text-right tabular-nums">{formatCurrency(e.emitido)}</td>
                      <td className={`py-2 pr-4 text-right tabular-nums ${e.disponivel < 0 ? "font-medium text-destructive" : ""}`}>
                        {formatCurrency(e.disponivel)}
                        {e.disponivel < 0 && <span className="block text-xs">emitido passou do empenho</span>}
                      </td>
                      <td className="py-2 pr-4 text-right tabular-nums">{formatCurrency(e.liquidado)}</td>
                      <td className="py-2 text-right tabular-nums">{formatCurrency(e.pago)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <DataTable
        rotulo="Empenhos ligados ao contrato"
        dados={empenhos.data ?? []}
        colunas={colunasLigados}
        chaveLinha={(e) => e.empenho_id}
        carregando={empenhos.isLoading}
        erro={empenhos.isError ? "Não foi possível carregar os empenhos." : null}
        aoTentarNovamente={() => empenhos.refetch()}
        filtros={podeEditar && !ligando ? <Button variant="outline" onClick={() => setLigando(true)}><Link2 className="h-4 w-4" aria-hidden="true" />Ligar empenhos</Button> : undefined}
        vazio={{
          icone: Receipt,
          titulo: "Nenhum empenho ligado",
          descricao: podeEditar ? "Ligue os empenhos da agência para ver quanto o empenho do ano ainda cobre." : "O financeiro ainda não ligou os empenhos deste contrato.",
        }}
      />

      {podeEditar && ligando && (
        <section aria-label="Empenhos para ligar" className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-base font-semibold">
              Empenhos para ligar
              <span className="block text-sm font-normal text-muted-foreground">Elemento 33 (passagens e locomoção) e os que já apontam para o contrato</span>
            </h2>
            <div className="flex w-full gap-2 sm:w-auto">
              <Select value={ano} onValueChange={setAno}>
                <SelectTrigger className="w-full sm:w-40" aria-label="Exercício"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {anos.map((a) => <SelectItem key={a} value={a}>Exercício {a}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={() => setLigando(false)}>Fechar</Button>
            </div>
          </div>
          {candidatos.isError ? (
            <EmptyState titulo="Não foi possível listar os empenhos" acao={<Button variant="outline" onClick={() => candidatos.refetch()}>Tentar novamente</Button>} />
          ) : (
            <DataTable
              rotulo="Empenhos para ligar"
              dados={candidatos.data ?? []}
              colunas={colunasCandidatos}
              chaveLinha={(e) => e.empenho_id}
              carregando={candidatos.isLoading}
              busca={{ placeholder: "Buscar por nº, credor ou processo" }}
              vazio={{ icone: Receipt, titulo: "Nenhum empenho do elemento 33 neste exercício", descricao: "Importe o FIP 614 no Financeiro ou escolha outro exercício." }}
            />
          )}
        </section>
      )}
    </div>
  );
}
