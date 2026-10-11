/**
 * Comissões (/rh/comissoes): inventário, licitação, fiscalização de contrato… com ato, período, motivo, módulo, objeto
 * (obrigatório exceto no tipo "Outra") e membros. Na fase 1 da regra de setor a comissão é só cadastro: não vale como
 * fundamento de lançamento. Rota com o módulo rh; criar, editar e mexer em membros pede `rh.comissoes.gerenciar`
 * (a RLS exige o mesmo).
 */

import { useMemo, useState } from "react";
import { Pencil, Plus, Scale, Users } from "lucide-react";
import { ModuleLayout } from "@/components/layout";
import { DataTable, PageHeader, StatusBadge, type ColunaTabela } from "@/components/design-system";
import { Button } from "@/components/ui/button";
import { ComissaoFormDialog } from "@/components/rh/comissoes/ComissaoFormDialog";
import { MembrosComissaoDialog } from "@/components/rh/comissoes/MembrosComissaoDialog";
import { nomeModulo } from "@/components/auditoria/trilhaRotulos";
import { useAuth } from "@/contexts/AuthContext";
import { useComissoes } from "@/hooks/useComissoes";
import { formatarDataISO, vigenteEm } from "@/lib/lancamentoSetorRegras";
import { OBJETO_COMISSAO_LABELS, STATUS_COMISSAO_LABELS, TIPO_COMISSAO_LABELS, type Comissao } from "@/types/comissao";

export default function ComissoesPage() {
  const { hasPermission } = useAuth();
  const podeGerenciar = hasPermission("rh.comissoes.gerenciar");
  const { data: comissoes = [], isLoading, error, refetch } = useComissoes();
  const [formAberto, setFormAberto] = useState(false);
  const [emEdicao, setEmEdicao] = useState<Comissao | null>(null);
  // Guarda o id: a comissão exibida nos membros vem sempre da lista atualizada
  const [membrosDe, setMembrosDe] = useState<string | null>(null);
  const comissaoMembros = useMemo(() => comissoes.find((c) => c.id === membrosDe) ?? null, [comissoes, membrosDe]);

  const colunas: ColunaTabela<Comissao>[] = [
    {
      id: "nome",
      cabecalho: "Comissão",
      mobile: "titulo",
      buscarPor: (c) => `${c.nome} ${c.ato_numero ?? ""}`,
      ordenarPor: (c) => c.nome,
      celula: (c) => (
        <span className="min-w-0">
          <span className="block font-medium break-words">{c.nome}</span>
          <span className="block text-caption text-muted-foreground">
            {TIPO_COMISSAO_LABELS[c.tipo] ?? c.tipo} · {nomeModulo(c.modulo)}
            {c.objeto_tipo && ` · ${OBJETO_COMISSAO_LABELS[c.objeto_tipo] ?? c.objeto_tipo}`}
          </span>
        </span>
      ),
    },
    {
      id: "ato",
      cabecalho: "Ato",
      celula: (c) =>
        c.ato_numero ? (
          <span>
            {c.ato_tipo ?? "Ato"} nº {c.ato_numero}
            {c.ato_data && <span className="block text-caption text-muted-foreground">de {formatarDataISO(c.ato_data)}</span>}
          </span>
        ) : (
          <span className="text-muted-foreground">Sem ato</span>
        ),
    },
    {
      id: "periodo",
      cabecalho: "Período",
      ordenarPor: (c) => c.data_inicio,
      className: "whitespace-nowrap",
      celula: (c) => (
        <span className="tabular-nums">
          {formatarDataISO(c.data_inicio)}
          <span className="block text-caption text-muted-foreground">
            {c.data_fim ? `até ${formatarDataISO(c.data_fim)}` : "sem data de fim"}
          </span>
        </span>
      ),
    },
    {
      id: "membros",
      cabecalho: "Membros",
      alinhamento: "centro",
      ordenarPor: (c) => c.membros?.length ?? 0,
      celula: (c) => {
        const total = c.membros?.length ?? 0;
        const vigentes = (c.membros ?? []).filter((m) => vigenteEm(m.data_inicio, m.data_fim)).length;
        return (
          <span className="tabular-nums">
            {total}
            {total > 0 && vigentes !== total && (
              <span className="block text-caption text-muted-foreground">{vigentes} vigente(s)</span>
            )}
          </span>
        );
      },
    },
    {
      id: "situacao",
      cabecalho: "Situação",
      celula: (c) => {
        const vigente = c.status === "ativa" && vigenteEm(c.data_inicio, c.data_fim);
        return (
          <span>
            <StatusBadge tom={vigente ? "andamento" : "neutro"}>
              {c.status === "encerrada" ? STATUS_COMISSAO_LABELS.encerrada : vigente ? "Ativa e vigente" : "Fora do período"}
            </StatusBadge>
            {/* Fase 1: o banco não conta comissão como fundamento (só cadastro) */}
            <span className="block pt-1 text-caption text-muted-foreground">
              Cadastro; não vale como fundamento na fase 1
            </span>
          </span>
        );
      },
    },
  ];

  return (
    <ModuleLayout module="rh">
      <div className="space-y-6">
        <PageHeader
          migalhas={[{ rotulo: "Recursos Humanos", href: "/rh" }, { rotulo: "Comissões" }]}
          titulo="Comissões"
          descricao="Cadastro das comissões com ato, período e membros (por exemplo, o levantamento patrimonial). Na fase 1 a comissão ainda não vale como fundamento de lançamento"
          acoes={
            podeGerenciar && (
              <Button
                className="gap-2"
                onClick={() => {
                  setEmEdicao(null);
                  setFormAberto(true);
                }}
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                Nova comissão
              </Button>
            )
          }
        />

        {!podeGerenciar && (
          <p className="text-caption text-muted-foreground">
            Somente consulta: cadastrar e alterar comissões pede a permissão de gerenciar comissões.
          </p>
        )}

        <DataTable
          rotulo="Comissões"
          dados={comissoes}
          colunas={colunas}
          chaveLinha={(c) => c.id}
          carregando={isLoading}
          erro={error ? "Não foi possível carregar as comissões. Verifique sua permissão ou tente novamente." : null}
          aoTentarNovamente={() => refetch()}
          busca={{ placeholder: "Buscar por nome ou número do ato" }}
          aoClicarLinha={(c) => setMembrosDe(c.id)}
          vazio={{
            icone: Scale,
            titulo: "Nenhuma comissão cadastrada",
            descricao: podeGerenciar ? "Cadastre a primeira comissão com o ato de designação." : undefined,
          }}
          acoesLinha={(c) => (
            <div className="flex items-center gap-1">
              <Button
                size="icon"
                variant="ghost"
                aria-label={`Membros de ${c.nome}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setMembrosDe(c.id);
                }}
              >
                <Users className="h-4 w-4" aria-hidden="true" />
              </Button>
              {podeGerenciar && (
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label={`Editar ${c.nome}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setEmEdicao(c);
                    setFormAberto(true);
                  }}
                >
                  <Pencil className="h-4 w-4" aria-hidden="true" />
                </Button>
              )}
            </div>
          )}
        />
      </div>

      <ComissaoFormDialog aberto={formAberto} comissao={emEdicao} onOpenChange={setFormAberto} />
      <MembrosComissaoDialog
        comissao={comissaoMembros}
        podeGerenciar={podeGerenciar}
        onOpenChange={(a) => !a && setMembrosDe(null)}
      />
    </ModuleLayout>
  );
}
