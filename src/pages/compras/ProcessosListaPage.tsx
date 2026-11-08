/**
 * Processos de contratação: lista com etapa, setor, dias parado, valor estimado, empenhado (FIP 614 pelo nº SEI) e a
 * fase financeira (reservado → PED → empenhado → liquidado → pago). Próximo prazo (P2, migração 20261122090000), com
 * os prazos por etapa ajustáveis por quem edita. P3 (migração 20261128090000): o próximo prazo é o mais próximo em
 * aberto (de qualquer tipo), "Parado" passa do limite da etapa, e o filtro Atenção mostra vencidos e parados primeiro.
 * Compras cadastra o processo e carrega a planilha de acompanhamento; o andamento se registra na ficha.
 * Spec: docs/superpowers/specs/2026-10-23-compras-processos-reserva-natureza-design.md
 */

import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { CalendarClock, FileUp, FolderKanban, Landmark, Plus } from "lucide-react";
import { ModuleLayout } from "@/components/layout";
import { DataTable, PageHeader, StatusBadge, type ColunaTabela } from "@/components/design-system";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarraEvolucao } from "@/components/compras/processos/EvolucaoProcesso";
import { evolucaoDoProcesso } from "@/lib/compras/evolucaoProcesso";
import { ImportacaoDialog, useImportadorDaUrl } from "@/components/importacao";
import { ProcessoFormDialog } from "@/components/compras/processos/ProcessoFormDialog";
import { PrazosPorEtapaDialog } from "@/components/compras/processos/PrazosPorEtapaDialog";
import { SeloPrazo } from "@/components/compras/processos/ProximaAcao";
import { useAuth } from "@/contexts/AuthContext";
import { formatCurrency, formatDateBR } from "@/lib/formatters";
import { importadorProcessosPlanilha } from "@/lib/importacao/importadores/processosPlanilha";
import { FASES_FINANCEIRAS, faseFinanceira } from "@/lib/compras/faseFinanceira";
import {
  somarEmpenhado,
  useEmpenhosDosProcessos,
  useFinanceiroDosProcessos,
  useProcessos,
  useSalvarProcesso,
  useParametrosEtapa,
} from "@/hooks/useProcessosContratacao";
import { useProximosPrazos } from "@/hooks/useProcessoPrazos";
import { exigeProximaAcao, hojeLocal, situacaoPrazo, type ParametroEtapa, PARAMETROS_PADRAO } from "@/lib/compras/proximaAcao";
import { rotuloTipoPrazo } from "@/lib/compras/prazos";
import { ETAPAS_PROCESSO, rotuloEtapa, type ProcessoContratacao } from "@/types/processos";

const TODOS = "todos";

/** Dias desde a última movimentação com data; sem data, null (não zero). */
function diasParado(data: string | null): number | null {
  if (!data) return null;
  const [a, m, d] = data.split("-").map(Number);
  const hoje = new Date();
  const ms = Date.UTC(hoje.getFullYear(), hoje.getMonth(), hoje.getDate()) - Date.UTC(a, m - 1, d);
  return Math.max(0, Math.round(ms / 86_400_000));
}

/** Passou do limite de dias sem movimento da etapa (o mesmo cálculo de compras_meus_prazos). */
function estaParado(p: ProcessoContratacao, parametros: ParametroEtapa[] | undefined): boolean {
  if (!exigeProximaAcao(p.etapa)) return false;
  const dias = diasParado(p.atualizado_em ?? p.created_at.slice(0, 10));
  const limite = parametros?.find((x) => x.etapa === p.etapa)?.dias_limite_parado
    ?? PARAMETROS_PADRAO[p.etapa]?.dias_limite_parado ?? 15;
  return dias !== null && dias > limite;
}

const ATENCAO = [
  { value: "vencido", label: "Prazo vencido" },
  { value: "parado", label: "Parado" },
  { value: "qualquer", label: "Vencido ou parado" },
];

export default function ProcessosListaPage() {
  const { hasPermission } = useAuth();
  const podeEditar = hasPermission("compras.processos.editar");
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const processos = useProcessos();
  const empenhos = useEmpenhosDosProcessos();
  const financeiro = useFinanceiroDosProcessos();
  const salvar = useSalvarProcesso();
  const parametros = useParametrosEtapa();
  const proximos = useProximosPrazos();
  const [novo, setNovo] = useState(false);
  const [prazos, setPrazos] = useState(false);
  // Planilha de acompanhamento, importada aqui mesmo (?importador=processos_planilha)
  const importacao = useImportadorDaUrl([importadorProcessosPlanilha.id]);
  const [ano, setAno] = useState(TODOS);
  const [etapa, setEtapa] = useState(TODOS);
  const [setor, setSetor] = useState(TODOS);
  const [fase, setFase] = useState(TODOS);
  const [atencao, setAtencao] = useState(TODOS);

  // Atalho do menu "Novo processo" (/compras/processos?novo=1)
  useEffect(() => {
    if (params.get("novo") && podeEditar) {
      setNovo(true);
      setParams({}, { replace: true });
    }
  }, [params, podeEditar, setParams]);

  const empenhado = useMemo(() => somarEmpenhado(empenhos.data), [empenhos.data]);
  const lista = useMemo(() => processos.data ?? [], [processos.data]);
  const anos = useMemo(() => [...new Set(lista.map((p) => p.ano))].sort((a, b) => b - a), [lista]);
  const setores = useMemo(() => [...new Set(lista.map((p) => p.setor_atual).filter(Boolean) as string[])].sort(), [lista]);
  const faseDe = (id: string) => faseFinanceira(financeiro.data?.get(id));
  const hoje = hojeLocal();
  const proximoPrazo = (p: ProcessoContratacao) => proximos.data?.get(p.id)?.data_limite ?? p.prazo_proxima_acao;
  const vencido = (p: ProcessoContratacao) => exigeProximaAcao(p.etapa) && situacaoPrazo(proximoPrazo(p), hoje) === "vencido";
  const parado = (p: ProcessoContratacao) => estaParado(p, parametros.data);
  // vencidos primeiro, depois parados (a tabela ainda ordena pelo clique no cabeçalho)
  const peso = (p: ProcessoContratacao) => (vencido(p) ? 0 : parado(p) ? 1 : 2);
  const filtrados = lista
    .filter(
      (p) =>
        (ano === TODOS || String(p.ano) === ano) &&
        (etapa === TODOS || p.etapa === etapa) &&
        (setor === TODOS || p.setor_atual === setor) &&
        (fase === TODOS || faseDe(p.id).codigo === fase) &&
        (atencao === TODOS
          || (atencao === "vencido" && vencido(p))
          || (atencao === "parado" && parado(p))
          || (atencao === "qualquer" && (vencido(p) || parado(p)))),
    )
    .sort((a, b) => peso(a) - peso(b));

  const colunas: ColunaTabela<ProcessoContratacao>[] = [
    {
      id: "numero",
      cabecalho: "Processo SEI",
      celula: (p) => <span className="whitespace-nowrap font-medium">{p.numero_processo}</span>,
      ordenarPor: (p) => p.numero_processo,
      buscarPor: (p) => p.numero_processo,
      mobile: "titulo",
    },
    {
      id: "evolucao",
      cabecalho: "Evolução",
      celula: (p) => <BarraEvolucao processo={p} />,
      ordenarPor: (p) => evolucaoDoProcesso(p).percentual,
      buscarPor: (p) => evolucaoDoProcesso(p).fase?.rotulo,
    },
    {
      id: "objeto",
      cabecalho: "Objeto",
      celula: (p) => <span className="line-clamp-2">{p.objeto_resumido ?? p.objeto}</span>,
      buscarPor: (p) => `${p.objeto_resumido ?? ""} ${p.objeto}`,
      className: "min-w-[11rem]",
    },
    {
      id: "etapa",
      cabecalho: "Etapa e setor",
      celula: (p) => (
        <span className="space-y-1">
          <StatusBadge tom={p.etapa === "cancelado" ? "neutro" : p.etapa === "encerrado" ? "sucesso" : "andamento"} icone={false}>{rotuloEtapa(p.etapa)}</StatusBadge>
          <span className="block text-xs text-muted-foreground">{p.setor_atual ? p.setor_atual.replace(/\//g, "/\u200b") : "—"}</span>
        </span>
      ),
      ordenarPor: (p) => ETAPAS_PROCESSO.findIndex((e) => e.value === p.etapa),
      buscarPor: (p) => p.setor_atual,
      className: "min-w-[10rem]",
    },
    {
      id: "parado",
      cabecalho: "Dias parado",
      celula: (p) => {
        const dias = diasParado(p.atualizado_em);
        if (dias === null) return <span className="text-muted-foreground">sem data</span>;
        return (
          <span className="inline-flex flex-col items-end gap-0.5" title={`Última movimentação em ${formatDateBR(p.atualizado_em)}`}>
            <span>{dias}</span>
            {parado(p) && <StatusBadge tom="erro" icone={false}>Parado</StatusBadge>}
          </span>
        );
      },
      ordenarPor: (p) => diasParado(p.atualizado_em) ?? -1,
      alinhamento: "direita",
    },
    {
      id: "prazo",
      cabecalho: "Próximo prazo",
      celula: (p) => {
        const px = proximos.data?.get(p.id);
        const titulo = px && px.tipo !== "proxima_acao"
          ? rotuloTipoPrazo(px.tipo)
          : p.proxima_etapa ? `Próxima etapa: ${rotuloEtapa(p.proxima_etapa)}` : undefined;
        return (
          <span title={titulo}>
            <SeloPrazo prazo={exigeProximaAcao(p.etapa) ? proximoPrazo(p) : null} hoje={hoje} />
          </span>
        );
      },
      ordenarPor: (p) => (exigeProximaAcao(p.etapa) ? proximoPrazo(p) : null) ?? "9999-12-31",
      buscarPor: (p) => p.proximo_responsavel_nome ?? p.proximo_responsavel_setor,
      alinhamento: "direita",
    },
    {
      id: "estimado",
      cabecalho: "Valor estimado",
      celula: (p) => (p.valor_estimado == null ? <span className="text-muted-foreground">não informado</span> : formatCurrency(p.valor_estimado)),
      ordenarPor: (p) => p.valor_estimado ?? -1,
      alinhamento: "direita",
    },
    {
      id: "empenhado",
      cabecalho: "Empenhado",
      celula: (p) => (empenhado.has(p.id) ? formatCurrency(empenhado.get(p.id)) : "—"),
      ordenarPor: (p) => empenhado.get(p.id) ?? 0,
      alinhamento: "direita",
    },
    {
      id: "fase",
      cabecalho: "Fase financeira",
      celula: (p) => {
        const f = faseDe(p.id);
        return <StatusBadge tom={f.tom} icone={false}>{f.rotulo}</StatusBadge>;
      },
      ordenarPor: (p) => FASES_FINANCEIRAS.findIndex((f) => f.codigo === faseDe(p.id).codigo),
      buscarPor: (p) => faseDe(p.id).rotulo,
    },
  ];

  const filtro = (rotulo: string, valor: string, mudar: (v: string) => void, opcoes: { value: string; label: string }[]) => (
    <Select value={valor} onValueChange={mudar}>
      <SelectTrigger className="w-full sm:w-44" aria-label={rotulo}><SelectValue /></SelectTrigger>
      <SelectContent>
        <SelectItem value={TODOS}>{rotulo}: todos</SelectItem>
        {opcoes.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
      </SelectContent>
    </Select>
  );

  return (
    <ModuleLayout module="compras">
      <div className="space-y-6">
        <PageHeader
          titulo="Processos de contratação"
          descricao="Onde está cada processo no SEI, quanto se estima e quanto já foi empenhado"
          migalhas={[{ rotulo: "Compras", href: "/compras" }, { rotulo: "Processos" }]}
          acoes={
            <>
              <Button asChild variant="outline">
                <Link to="/compras/programacao">
                  <Landmark className="h-4 w-4" aria-hidden="true" />
                  Programação por natureza
                </Link>
              </Button>
              {podeEditar && (
                <>
                  <Button variant="outline" onClick={() => setPrazos(true)}>
                    <CalendarClock className="h-4 w-4" aria-hidden="true" />
                    Prazos e avisos
                  </Button>
                  <Button variant="outline" onClick={() => importacao.abrir(importadorProcessosPlanilha.id)}>
                    <FileUp className="h-4 w-4" aria-hidden="true" />
                    Importar planilha
                  </Button>
                  <Button onClick={() => setNovo(true)}>
                    <Plus className="h-4 w-4" aria-hidden="true" />
                    Novo processo
                  </Button>
                </>
              )}
            </>
          }
        />

        <DataTable
          rotulo="Processos de contratação"
          dados={filtrados}
          colunas={colunas}
          chaveLinha={(p) => p.id}
          carregando={processos.isLoading}
          erro={processos.isError ? "Não foi possível carregar os processos." : null}
          aoTentarNovamente={() => processos.refetch()}
          busca={{ placeholder: "Buscar por nº SEI, objeto ou setor" }}
          filtros={
            <div className="flex flex-col gap-2 sm:flex-row">
              {filtro("Ano", ano, setAno, anos.map((a) => ({ value: String(a), label: String(a) })))}
              {filtro("Etapa", etapa, setEtapa, ETAPAS_PROCESSO.map((e) => ({ value: e.value, label: e.label })))}
              {filtro("Setor", setor, setSetor, setores.map((s) => ({ value: s, label: s })))}
              {filtro("Fase", fase, setFase, FASES_FINANCEIRAS.map((f) => ({ value: f.codigo, label: f.rotulo })))}
              {filtro("Atenção", atencao, setAtencao, ATENCAO)}
            </div>
          }
          aoClicarLinha={(p) => navigate(`/compras/processos/${p.id}`)}
          vazio={{
            icone: FolderKanban,
            titulo: "Nenhum processo cadastrado",
            descricao: podeEditar ? "Cadastre um processo ou importe a planilha de acompanhamento." : "Ainda não há processos cadastrados.",
          }}
        />
      </div>

      <ProcessoFormDialog
        open={novo}
        onOpenChange={setNovo}
        salvando={salvar.isPending}
        onSalvar={async (dados) => {
          const p = await salvar.mutateAsync(dados);
          navigate(`/compras/processos/${p.id}`);
        }}
      />

      <ImportacaoDialog importador={importacao.aberto} onFechar={importacao.fechar} />
      {podeEditar && <PrazosPorEtapaDialog open={prazos} onOpenChange={setPrazos} />}
    </ModuleLayout>
  );
}
