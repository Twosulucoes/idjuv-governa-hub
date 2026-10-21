/**
 * Arquivos gerados pelo sistema (`fin_remessas_bancarias`): reenvio para o Gestão MAX e remessas OBN600.
 *  - Confirmados: "Baixar novamente" lê o retrato no banco, gera de novo e só baixa se o SHA-256 conferir.
 *  - Reservas sem arquivo (falha depois da reserva): "Cancelar reserva" libera os créditos para outro reenvio.
 */

import { useState } from "react";
import { FileClock, FileDown, Loader2, XCircle } from "lucide-react";
import { DataTable, StatusBadge, type ColunaTabela } from "@/components/design-system";
import { Button } from "@/components/ui/button";
import {
  useBaixarRemessaNovamente,
  useCancelarRemessaBancaria,
  useDadosPagador,
  useRemessasBancarias,
} from "@/hooks/useConciliacaoBancaria";
import { dataBR } from "@/lib/bancario/exibicao";
import { formatCurrency } from "@/lib/formatters";
import type { RemessaBancaria } from "@/types/conciliacaoBancaria";

const ROTULO_LAYOUT: Record<string, string> = { gestao_max_cnab240: "Gestão MAX", obn600: "OBN600" };

const colunas: ColunaTabela<RemessaBancaria>[] = [
  {
    id: "layout",
    cabecalho: "Arquivo",
    celula: (r) => <span className="whitespace-nowrap text-xs">{ROTULO_LAYOUT[r.layout] ?? r.layout}</span>,
    ordenarPor: (r) => r.layout,
  },
  {
    id: "data",
    cabecalho: "Gerado em",
    celula: (r) => <span className="whitespace-nowrap">{dataBR(r.data_geracao)}</span>,
    ordenarPor: (r) => r.data_geracao,
  },
  {
    id: "nsa",
    cabecalho: "Nº / NSA",
    celula: (r) => <span className="font-mono">{r.nsa}</span>,
    ordenarPor: (r) => r.nsa,
    buscarPor: (r) => String(r.nsa),
  },
  {
    id: "convenio",
    cabecalho: "Convênio / cliente",
    celula: (r) => <span className="font-mono">{r.convenio}</span>,
    buscarPor: (r) => r.convenio,
  },
  {
    id: "quantidade",
    cabecalho: "Pagamentos",
    celula: (r) => <span className="tabular-nums">{r.quantidade}</span>,
    alinhamento: "direita",
  },
  {
    id: "valor",
    cabecalho: "Valor",
    celula: (r) => <span className="tabular-nums">{formatCurrency(Number(r.valor_total))}</span>,
    ordenarPor: (r) => Number(r.valor_total),
    alinhamento: "direita",
  },
  {
    id: "situacao",
    cabecalho: "Situação",
    celula: (r) =>
      r.arquivo_sha256 ? (
        <StatusBadge tom="sucesso">Arquivo gerado</StatusBadge>
      ) : (
        <StatusBadge tom="pendente">Reserva sem arquivo</StatusBadge>
      ),
  },
];

export function RemessasGeradas() {
  const { data, isLoading, isError, refetch } = useRemessasBancarias();
  const pagador = useDadosPagador();
  const baixar = useBaixarRemessaNovamente();
  const cancelar = useCancelarRemessaBancaria();
  const [emAndamento, setEmAndamento] = useState<string | null>(null);

  const executar = async (id: string, acao: () => Promise<unknown>) => {
    setEmAndamento(id);
    try {
      await acao();
    } catch {
      // toast de erro já exibido pela mutation
    } finally {
      setEmAndamento(null);
    }
  };

  return (
    <section className="space-y-2" aria-labelledby="titulo-remessas-geradas">
      <h2 id="titulo-remessas-geradas" className="text-base font-semibold">
        Arquivos gerados
      </h2>
      <DataTable
        rotulo="Arquivos gerados"
        dados={data ?? []}
        colunas={colunas}
        chaveLinha={(r) => r.id}
        carregando={isLoading}
        erro={isError ? "Não foi possível carregar os arquivos gerados." : null}
        aoTentarNovamente={() => refetch()}
        vazio={{
          icone: FileClock,
          titulo: "Nenhum arquivo gerado",
          descricao: "As remessas OBN600 e os arquivos de reenvio aparecem aqui depois de gerados.",
        }}
        acoesLinha={(r) => {
          const ocupado = emAndamento === r.id;
          return r.arquivo_sha256 ? (
            <Button
              variant="ghost"
              size="sm"
              disabled={!!emAndamento || (r.layout !== "obn600" && !pagador.data)}
              onClick={() => executar(r.id, () => baixar.mutateAsync({ remessaId: r.id, pagador: pagador.data }))}
            >
              {ocupado ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <FileDown className="h-4 w-4" aria-hidden />}
              Baixar novamente
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              disabled={!!emAndamento}
              onClick={() => executar(r.id, () => cancelar.mutateAsync(r.id))}
            >
              {ocupado ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <XCircle className="h-4 w-4" aria-hidden />}
              Cancelar reserva
            </Button>
          );
        }}
      />
    </section>
  );
}
