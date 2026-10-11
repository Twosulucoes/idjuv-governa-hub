/**
 * Se a designação vale como fundamento de lançamento no setor de destino (regra de lançamento por setor), com o mesmo
 * critério do banco: aprovada, vigente, com número e data do ato, aprovada por alguém registrado (aprovado_por) que não
 * é o próprio servidor nem quem a criou, e destino que é setor ativo de algum módulo (setores_modulo, com as
 * subordinadas quando marcado). Se não vale, diz o que falta. Quem decide é o banco; isto é só exibição.
 */

import { StatusBadge } from "@/components/design-system";
import { nomeModulo } from "@/components/auditoria/trilhaRotulos";
import { useSetoresModulo, useUnidadesEstrutura } from "@/hooks/useLancamentoPorSetor";
import { avaliarDesignacaoComoFundamento, modulosDaUnidade } from "@/lib/lancamentoSetorRegras";
import type { Designacao } from "@/types/designacao";

interface FundamentoDesignacaoBadgeProps {
  designacao: Pick<
    Designacao,
    | "status"
    | "data_inicio"
    | "data_fim"
    | "ato_numero"
    | "ato_data"
    | "ativo"
    | "aprovado_por"
    | "created_by"
    | "servidor_id"
    | "unidade_destino_id"
    | "aprovador"
  >;
}

export function FundamentoDesignacaoBadge({ designacao }: FundamentoDesignacaoBadgeProps) {
  // Mesmas consultas (em cache) para todas as linhas da tabela
  const setores = useSetoresModulo();
  const unidades = useUnidadesEstrutura();
  const carregado = !!setores.data && !!unidades.data;
  const modulos = carregado
    ? modulosDaUnidade(designacao.unidade_destino_id, setores.data ?? [], unidades.data ?? [])
    : null;
  const { vale, faltas } = avaliarDesignacaoComoFundamento(designacao, {
    modulosDoDestino: modulos,
    aprovadorServidorId: designacao.aprovador?.servidor_id ?? null,
  });
  const encerrada = designacao.status === "encerrada" || designacao.status === "rejeitada";

  if (!carregado && !encerrada && faltas.length === 0) {
    return <span className="text-caption text-muted-foreground">{setores.error || unidades.error ? "—" : "Conferindo…"}</span>;
  }

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <StatusBadge tom={vale ? "sucesso" : encerrada ? "neutro" : "pendente"}>
        {vale ? "Vale para lançar" : "Não vale para lançar"}
      </StatusBadge>
      {vale && modulos && (
        <span className="text-caption text-muted-foreground">Em: {modulos.map(nomeModulo).join(", ")}</span>
      )}
      {!vale && !encerrada && faltas.length > 0 && (
        <span className="text-caption text-muted-foreground">Falta: {faltas.join(", ")}</span>
      )}
    </span>
  );
}
