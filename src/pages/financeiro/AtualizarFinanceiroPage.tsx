/**
 * ATUALIZAR O FINANCEIRO
 * O que baixar do FIPLAN e do banco, de quanto em quanto tempo, e o que está atrasado. O sistema não entra no FIPLAN:
 * a tela guia quem baixa os arquivos e leva ao importador certo.
 * Spec: docs/superpowers/specs/2026-10-23-rotina-atualizacao-financeiro-design.md
 */

import { useMemo } from "react";
import { ModuleLayout } from "@/components/layout";
import { PageHeader } from "@/components/design-system";
import { SeletorExercicio } from "@/components/financeiro/SeletorExercicio";
import { EstadoQuadro } from "@/components/financeiro/painel/EstadoQuadro";
import { CartaoRotina } from "@/components/financeiro/atualizacao/CartaoRotina";
import { useAuth } from "@/contexts/AuthContext";
import { useExercicioFinanceiro } from "@/hooks/useExercicioFinanceiro";
import { useRotinaAtualizacao } from "@/hooks/useFinanceiro";
import { obterImportador } from "@/lib/importacao/registro";
import { ROTINA_FINANCEIRO, resumirRotina, situacaoDoItem } from "@/lib/financeiro/rotinaAtualizacao";

const TIPOS = ROTINA_FINANCEIRO.flatMap((i) => (i.importador ? [i.importador] : []));
/** Mesma permissão da rota da conciliação */
const PERMISSAO_CONCILIACAO = "pagamento.conciliar";

export default function AtualizarFinanceiroPage() {
  const { exercicio } = useExercicioFinanceiro();
  const { hasPermission } = useAuth();
  const ultimas = useRotinaAtualizacao(exercicio, TIPOS);
  const hoje = useMemo(() => new Date(), []);
  const encerrado = exercicio < hoje.getFullYear();

  const itens = useMemo(
    () =>
      ROTINA_FINANCEIRO.map((item) => {
        const ultima = ultimas.data?.[item.id] ?? null;
        const permissao = item.importador ? obterImportador(item.importador)?.permissao : PERMISSAO_CONCILIACAO;
        return {
          item,
          ultima,
          situacao: situacaoDoItem(item.frequencia, ultima, hoje, { encerrado }),
          podeAtualizar: !!permissao && hasPermission(permissao),
        };
      }),
    [ultimas.data, hoje, encerrado, hasPermission],
  );
  const resumo = resumirRotina(itens.map((i) => i.situacao));

  return (
    <ModuleLayout module="financeiro">
      <div className="space-y-6">
        <PageHeader
          migalhas={[{ rotulo: "Financeiro", href: "/financeiro" }, { rotulo: "Atualizar dados" }]}
          titulo="Atualizar o Financeiro"
          descricao={
            ultimas.data
              ? `${resumo.emDia} de ${resumo.comPrazo} itens com prazo em dia no exercício ${exercicio}. ` +
                "O sistema não entra no FIPLAN: baixe cada arquivo e importe aqui."
              : `Rotina de atualização do exercício ${exercicio}.`
          }
          acoes={<SeletorExercicio />}
        />

        <EstadoQuadro
          carregando={ultimas.isLoading}
          erro={ultimas.isError}
          onTentarNovamente={() => ultimas.refetch()}
        >
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 [&>*]:min-w-0">
            {itens.map((i) => (
              <CartaoRotina key={i.item.id} {...i} />
            ))}
          </div>
        </EstadoQuadro>
      </div>
    </ModuleLayout>
  );
}
