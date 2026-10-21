/**
 * Aba "Remessa OBN600" da conciliação: pagamentos programados/autorizados do exercício que ainda não saíram numa
 * remessa. O usuário seleciona e gera o arquivo; o servidor confere tudo de novo (situação, favorecido e conta).
 * A conta do favorecido é a do pagamento ou, vazia, a do cadastro do fornecedor (a mesma regra do servidor).
 */

import { useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, FileDown } from "lucide-react";
import { DataTable, StatusBadge, type ColunaTabela } from "@/components/design-system";
import { Button } from "@/components/ui/button";
import { GerarRemessaObnDialog } from "@/components/financeiro/conciliacao/GerarRemessaObnDialog";
import { usePagamentosParaRemessa } from "@/hooks/useConciliacaoBancaria";
import { dataBR, documentoMascarado } from "@/lib/bancario/exibicao";
import { formatCurrency } from "@/lib/formatters";
import type { PagamentoParaRemessa } from "@/types/conciliacaoBancaria";

/** Banco / agência / conta que vai na OB (do pagamento ou do fornecedor). */
function contaDestino(p: PagamentoParaRemessa) {
  if (p.conta_favorecido?.trim()) {
    return { banco: p.banco_favorecido ?? "", agencia: p.agencia_favorecido ?? "", conta: p.conta_favorecido };
  }
  const f = p.fornecedor;
  return { banco: f?.banco_codigo ?? "", agencia: f?.agencia ?? "", conta: f?.conta ?? "" };
}

/** O que falta para o pagamento entrar na remessa (vazio = pode entrar). Conferência prévia; o servidor decide. */
function pendencia(p: PagamentoParaRemessa): string | null {
  const doc = (p.fornecedor?.cpf_cnpj ?? "").replace(/\D/g, "");
  if (doc.length !== 11 && doc.length !== 14) return "Sem CPF/CNPJ do favorecido";
  const c = contaDestino(p);
  if (!c.banco.trim() || !c.agencia.trim() || !c.conta.trim()) return "Sem banco/agência/conta";
  if (!/^OP-\d+$/.test(p.numero)) return "Número fora do padrão OP";
  return null;
}

const colunas: ColunaTabela<PagamentoParaRemessa>[] = [
  {
    id: "numero",
    cabecalho: "Pagamento",
    celula: (p) => (
      <Link to={`/financeiro/pagamentos/${p.id}`} className="font-mono text-primary underline-offset-4 hover:underline">
        {p.numero}
      </Link>
    ),
    buscarPor: (p) => p.numero,
    ordenarPor: (p) => p.numero,
  },
  {
    id: "data",
    cabecalho: "Data",
    celula: (p) => <span className="whitespace-nowrap">{dataBR(p.data_pagamento)}</span>,
    ordenarPor: (p) => p.data_pagamento,
  },
  {
    id: "favorecido",
    cabecalho: "Favorecido",
    celula: (p) => (
      <span className="block min-w-0">
        <span className="block truncate">{p.fornecedor?.razao_social || "—"}</span>
        <span className="block font-mono text-xs text-muted-foreground">{documentoMascarado(p.fornecedor?.cpf_cnpj)}</span>
      </span>
    ),
    buscarPor: (p) => p.fornecedor?.razao_social,
    ordenarPor: (p) => p.fornecedor?.razao_social,
    mobile: "titulo",
  },
  {
    id: "conta",
    cabecalho: "Banco / agência / conta",
    celula: (p) => {
      const c = contaDestino(p);
      return c.conta ? (
        <span className="whitespace-nowrap font-mono text-xs">
          {c.banco} / {c.agencia} / {c.conta}
        </span>
      ) : (
        <span className="text-muted-foreground">—</span>
      );
    },
  },
  {
    id: "valor",
    cabecalho: "Valor líquido",
    celula: (p) => <span className="tabular-nums">{formatCurrency(Number(p.valor_liquido))}</span>,
    ordenarPor: (p) => Number(p.valor_liquido),
    alinhamento: "direita",
  },
  {
    id: "pronto",
    cabecalho: "Remessa",
    celula: (p) => {
      const falta = pendencia(p);
      return falta ? <StatusBadge tom="pendente">{falta}</StatusBadge> : <StatusBadge tom="sucesso">Pronto</StatusBadge>;
    },
  },
];

export function RemessaObnPagamentos({ exercicio }: { exercicio: number }) {
  const { data, isLoading, isError, refetch } = usePagamentosParaRemessa(exercicio);
  const [selecao, setSelecao] = useState<{ pagamentos: PagamentoParaRemessa[]; limpar: () => void } | null>(null);

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Selecione os pagamentos e gere o arquivo de ordens bancárias (OBN600) para enviar ao Banco do Brasil. Cada
        pagamento vira uma OB com o número do pagamento; quando o retorno do banco for importado, o pagamento é baixado
        como pago ou recusado. Fatura e guia com código de barras ficam fora.
      </p>
      <DataTable
        rotulo="Pagamentos para a remessa OBN600"
        dados={data ?? []}
        colunas={colunas}
        chaveLinha={(p) => p.id}
        carregando={isLoading}
        erro={isError ? "Não foi possível carregar os pagamentos." : null}
        aoTentarNovamente={() => refetch()}
        busca={{ placeholder: "Buscar por pagamento ou favorecido…" }}
        vazio={{
          icone: CheckCircle2,
          titulo: "Nenhum pagamento a enviar",
          descricao: "Os pagamentos programados ou autorizados deste exercício aparecem aqui até saírem numa remessa.",
        }}
        acoesEmLote={(selecionadas, limpar) => {
          const elegiveis = selecionadas.filter((p) => !pendencia(p));
          const fora = selecionadas.length - elegiveis.length;
          return (
            <>
              <Button
                size="sm"
                disabled={elegiveis.length === 0}
                onClick={() => setSelecao({ pagamentos: elegiveis, limpar })}
              >
                <FileDown className="h-4 w-4" aria-hidden />
                Gerar remessa OBN600 ({elegiveis.length})
              </Button>
              {fora > 0 && (
                <span className="text-xs text-muted-foreground">{fora} fora do arquivo (faltam dados do favorecido)</span>
              )}
            </>
          );
        }}
      />
      <GerarRemessaObnDialog
        aberto={!!selecao}
        onOpenChange={(v) => !v && setSelecao(null)}
        pagamentos={selecao?.pagamentos ?? []}
        onGerado={() => selecao?.limpar()}
      />
    </div>
  );
}
