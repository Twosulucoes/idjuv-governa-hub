/**
 * Relatório "Lançamento por setor" (aba de /rh/auditoria):
 *   1. quem seria bloqueado: gravações (inclusão, alteração, exclusão) com fundamento negado
 *      (fundamento->>permitido = 'false') no período, sem leituras e sem as gravações em cascata (fundamento.em_cascata),
 *      agrupadas por responsável, tabela e motivo (lidas em páginas pelo cursor da sequencia, até um limite);
 *   2. saneamento: servidores ativos sem login vinculado, sem lotação vigente ou com lotação divergente
 *      (RPC saneamento_lancamento, que exige admin ou rh.auditoria.visualizar).
 * A RLS de audit_logs decide o que volta (rh.auditoria.visualizar lê só o módulo rh). Tudo é texto: nada vira HTML.
 */

import { useState } from "react";
import { format, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Filter, ShieldAlert, UserX, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DataTable, KpiCard, StatusBadge, type ColunaTabela } from "@/components/design-system";
import { nomeModulo, rotuloEntidade } from "@/components/auditoria/trilhaRotulos";
import { responsavelTrilha } from "@/hooks/useTrilhaAuditoria";
import {
  LIMITE_RELATORIO_BLOQUEIOS,
  useBloqueiosLancamento,
  useSaneamentoLancamento,
  type FiltrosBloqueios,
} from "@/hooks/useLancamentoPorSetor";
import { agruparBloqueios, hojeISO, type GrupoBloqueio } from "@/lib/lancamentoSetorRegras";
import {
  PROBLEMA_SANEAMENTO_LABELS,
  VIA_FUNDAMENTO_LABELS,
  type LinhaSaneamento,
  type ViaFundamento,
} from "@/types/lancamentoSetor";

interface RelatorioLancamentoSetorProps {
  /** Trava o módulo (ex.: "rh"); sem ele, todos os que a RLS libera. */
  moduloFixo?: string;
}

const periodoPadrao = () => ({ inicio: hojeISO(subDays(new Date(), 30)), fim: hojeISO() });

export function RelatorioLancamentoSetor({ moduloFixo }: RelatorioLancamentoSetorProps) {
  const [rascunho, setRascunho] = useState(periodoPadrao);
  const [filtros, setFiltros] = useState<FiltrosBloqueios>(() => ({ ...periodoPadrao(), modulo: moduloFixo }));
  const periodoInvalido = !!rascunho.inicio && !!rascunho.fim && rascunho.inicio > rascunho.fim;

  const bloqueios = useBloqueiosLancamento(filtros);
  const saneamento = useSaneamentoLancamento();

  const linhas = bloqueios.data?.linhas ?? [];
  const grupos = agruparBloqueios(linhas);
  const responsaveis = new Set(grupos.map((g) => (g.servidor_id ? `s:${g.servidor_id}` : `u:${g.user_id}`))).size;
  const semServidor = new Set(
    grupos.filter((g) => g.via === "negado_sem_servidor").map((g) => g.user_id ?? g.chave),
  ).size;

  const aplicar = (e: React.FormEvent) => {
    e.preventDefault();
    if (periodoInvalido) return;
    setFiltros({ inicio: rascunho.inicio || undefined, fim: rascunho.fim || undefined, modulo: moduloFixo });
  };

  const colunasBloqueio: ColunaTabela<GrupoBloqueio>[] = [
    {
      id: "responsavel",
      cabecalho: "Responsável",
      mobile: "titulo",
      buscarPor: (g) => `${g.servidor_nome ?? ""} ${g.servidor_matricula ?? ""} ${g.usuario_nome ?? ""}`,
      ordenarPor: (g) => responsavelTrilha({ ...g, origem: null }),
      celula: (g) => responsavelTrilha({ ...g, origem: g.servidor_id ? "usuario" : "usuario_sem_vinculo" }),
    },
    {
      id: "motivo",
      cabecalho: "Motivo",
      celula: (g) => (
        <StatusBadge tom="pendente">{VIA_FUNDAMENTO_LABELS[g.via as ViaFundamento] ?? g.via ?? "—"}</StatusBadge>
      ),
    },
    ...(moduloFixo
      ? []
      : [
          {
            id: "modulo",
            cabecalho: "Módulo",
            celula: (g: GrupoBloqueio) => nomeModulo(g.modulo),
          } satisfies ColunaTabela<GrupoBloqueio>,
        ]),
    {
      id: "tabela",
      cabecalho: "Tabela",
      buscarPor: (g) => g.tabela,
      celula: (g) => <span className="font-mono text-xs">{rotuloEntidade(g.tabela)}</span>,
    },
    {
      id: "quantidade",
      cabecalho: "Gravações",
      alinhamento: "direita",
      ordenarPor: (g) => g.quantidade,
      celula: (g) => <span className="tabular-nums">{g.quantidade}</span>,
    },
    {
      id: "ultima",
      cabecalho: "Última",
      ordenarPor: (g) => g.ultima,
      className: "whitespace-nowrap",
      celula: (g) => (
        <span className="tabular-nums">{format(new Date(g.ultima), "dd/MM/yyyy HH:mm", { locale: ptBR })}</span>
      ),
    },
  ];

  const colunasSaneamento: ColunaTabela<LinhaSaneamento>[] = [
    {
      id: "servidor",
      cabecalho: "Servidor",
      mobile: "titulo",
      buscarPor: (l) => `${l.nome} ${l.matricula ?? ""}`,
      ordenarPor: (l) => l.nome,
      celula: (l) => (
        <span>
          {l.nome}
          {l.matricula && <span className="block text-caption text-muted-foreground">mat. {l.matricula}</span>}
        </span>
      ),
    },
    {
      id: "problemas",
      cabecalho: "Pendência",
      celula: (l) => (
        <span className="flex flex-wrap gap-1">
          {l.problemas.length === 0 ? (
            <span className="text-muted-foreground">—</span>
          ) : (
            l.problemas.map((p) => (
              <StatusBadge key={p} tom="pendente">
                {PROBLEMA_SANEAMENTO_LABELS[p] ?? p}
              </StatusBadge>
            ))
          )}
          {l.tem_login && l.login_ativo === false && (
            <span className="block w-full text-caption text-muted-foreground">Login vinculado está inativo.</span>
          )}
        </span>
      ),
    },
    {
      id: "lotacao",
      cabecalho: "Lotação vigente / unidade atual",
      buscarPor: (l) => `${l.lotacao_unidade_nome ?? ""} ${l.unidade_atual_nome ?? ""}`,
      celula: (l) => (
        <span className="min-w-0 break-words">
          {l.lotacao_unidade_nome ?? <span className="text-muted-foreground">Sem lotação vigente</span>}
          {l.problemas.includes("lotacao_divergente") && (
            <span className="block text-caption text-muted-foreground">
              Cadastro aponta: {l.unidade_atual_nome ?? "nenhuma unidade"}
            </span>
          )}
        </span>
      ),
    },
    {
      id: "situacao",
      cabecalho: "Situação",
      mobile: "oculta",
      celula: (l) => l.situacao ?? "—",
    },
  ];

  return (
    <div className="space-y-8">
      <section aria-labelledby="bloqueios-titulo" className="space-y-4">
        <div>
          <h2 id="bloqueios-titulo" className="text-h2">
            Quem seria bloqueado
          </h2>
          <p className="text-body text-muted-foreground">
            Inclusões, alterações e exclusões sem fundamento no setor (login sem servidor, ou servidor sem lotação ou
            designação no setor). Leituras e gravações em cascata não contam. No modo registrar nada foi bloqueado: a
            trilha só anotou. No modo exigir, estas gravações seriam recusadas.
          </p>
        </div>

        <form onSubmit={aplicar} className="flex flex-col gap-3 rounded-lg border bg-card p-4 sm:flex-row sm:items-end" aria-label="Período do relatório">
          <div className="space-y-1">
            <Label htmlFor="bloqueios-inicio">De</Label>
            <Input
              id="bloqueios-inicio"
              type="date"
              value={rascunho.inicio}
              onChange={(e) => setRascunho((r) => ({ ...r, inicio: e.target.value }))}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="bloqueios-fim">Até</Label>
            <Input
              id="bloqueios-fim"
              type="date"
              value={rascunho.fim}
              aria-invalid={periodoInvalido}
              onChange={(e) => setRascunho((r) => ({ ...r, fim: e.target.value }))}
            />
          </div>
          <Button type="submit" size="sm" className="gap-2 sm:mb-0.5">
            <Filter className="h-4 w-4" aria-hidden="true" />
            Aplicar período
          </Button>
          {periodoInvalido && (
            <p role="alert" className="text-sm text-destructive">
              A data "De" não pode ser depois da data "Até".
            </p>
          )}
        </form>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <KpiCard rotulo="Gravações sem fundamento" valor={linhas.length} icone={ShieldAlert} carregando={bloqueios.isLoading} />
          <KpiCard rotulo="Responsáveis" valor={responsaveis} icone={Users} carregando={bloqueios.isLoading} />
          <KpiCard rotulo="Logins sem servidor" valor={semServidor} icone={UserX} carregando={bloqueios.isLoading} />
        </div>

        {bloqueios.data?.cortado && (
          <p role="status" className="text-caption text-muted-foreground">
            Mostrando as {LIMITE_RELATORIO_BLOQUEIOS} gravações mais recentes do período. Reduza o período para ver o
            restante.
          </p>
        )}

        <DataTable
          rotulo="Gravações sem fundamento por responsável e tabela"
          dados={grupos}
          colunas={colunasBloqueio}
          chaveLinha={(g) => g.chave}
          carregando={bloqueios.isLoading}
          erro={bloqueios.error ? "Não foi possível ler a trilha. Verifique sua permissão ou tente novamente." : null}
          aoTentarNovamente={() => bloqueios.refetch()}
          busca={{ placeholder: "Buscar por responsável ou tabela" }}
          vazio={{
            icone: ShieldAlert,
            titulo: "Ninguém seria bloqueado no período",
            descricao: "Nenhuma gravação sem fundamento foi anotada na trilha.",
          }}
        />
      </section>

      <section aria-labelledby="saneamento-titulo" className="space-y-4">
        <div>
          <h2 id="saneamento-titulo" className="text-h2">
            Saneamento do cadastro
          </h2>
          <p className="text-body text-muted-foreground">
            Servidores ativos sem login vinculado, sem lotação vigente, com lotação divergente ou com fundamento
            autoconcedido (designação ou comissão aprovada ou criada por ele mesmo). Acerte antes de um módulo passar para
            o modo exigir.
          </p>
        </div>
        <DataTable
          rotulo="Servidores com pendência de cadastro"
          dados={saneamento.data ?? []}
          colunas={colunasSaneamento}
          chaveLinha={(l) => l.servidor_id}
          carregando={saneamento.isLoading}
          erro={saneamento.error ? "Não foi possível carregar o saneamento. Verifique sua permissão ou tente novamente." : null}
          aoTentarNovamente={() => saneamento.refetch()}
          busca={{ placeholder: "Buscar por nome ou matrícula" }}
          vazio={{ icone: Users, titulo: "Nenhuma pendência", descricao: "Todos os servidores ativos têm login e lotação em dia." }}
        />
      </section>
    </div>
  );
}
