/**
 * Vencimentos (entrega C2): o que vence em 30, 60, 90 e 120 dias, o que já venceu e as garantias que acabam antes do
 * contrato, com a ação esperada (prorrogar, nova contratação ou encerrar) e a providência registrada pelo NuAC.
 * Registrar a providência exige contratos.editar (conferido também no banco). Regras em src/lib/contratos/vencimentos.ts.
 * Spec: docs/superpowers/specs/2026-10-27-contratos-gestao-completa-design.md (§4, C2)
 */

import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CalendarClock, CalendarX2, ClipboardCheck, FileSpreadsheet, ShieldAlert } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ModuleLayout } from "@/components/layout";
import { DataTable, KpiCard, PageHeader, type ColunaTabela } from "@/components/design-system";
import { ProvidenciaRenovacaoDialog } from "@/components/contratos/ProvidenciaRenovacaoDialog";
import { SeloVigencia } from "@/components/contratos/SeloVigencia";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/contexts/AuthContext";
import { exportarParaExcel } from "@/export/exportExcel";
import { useVencimentos } from "@/hooks/useContratosVencimentos";
import { formatDateBR } from "@/lib/formatters";
import {
  ehFiltroVencimento,
  FILTROS_VENCIMENTO,
  linhasPlanilhaVencimentos,
  montarVencimentos,
  passaNoFiltroVencimento,
  resumoVencimentos,
  semProvidencia,
  textoAcao,
  textoLimite,
  textoProvidencia,
  type FiltroVencimento,
  type LinhaVencimento,
} from "@/lib/contratos/vencimentos";
import { cn } from "@/lib/utils";
import { nomeContratado } from "@/types/contratos";

const numero = new Intl.NumberFormat("pt-BR");

const CARTOES: { filtro: Exclude<FiltroVencimento, "todos">; rotulo: string; icone: LucideIcon }[] = [
  { filtro: "vencido", rotulo: "Vencidos", icone: CalendarX2 },
  { filtro: "ate30", rotulo: "Em até 30 dias", icone: CalendarClock },
  { filtro: "ate60", rotulo: "De 31 a 60 dias", icone: CalendarClock },
  { filtro: "ate90", rotulo: "De 61 a 90 dias", icone: CalendarClock },
  { filtro: "ate120", rotulo: "De 91 a 120 dias", icone: CalendarClock },
  { filtro: "garantia", rotulo: "Garantia vencendo", icone: ShieldAlert },
];

export default function ContratosVencimentosPage() {
  const { hasPermission } = useAuth();
  const podeEditar = hasPermission("contratos.editar");
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const consulta = useVencimentos();
  const [filtro, setFiltro] = useState<FiltroVencimento>(() => {
    const f = params.get("faixa");
    return ehFiltroVencimento(f) ? f : "todos";
  });
  const [soSem, setSoSem] = useState(() => params.get("providencia") === "sem");
  const [providencia, setProvidencia] = useState<LinhaVencimento | null>(null);

  const linhas = useMemo(() => montarVencimentos(consulta.data ?? []), [consulta.data]);
  const resumo = useMemo(() => resumoVencimentos(linhas), [linhas]);
  const filtradas = useMemo(() => linhas.filter((l) => passaNoFiltroVencimento(l, filtro, soSem)), [linhas, filtro, soSem]);

  const colunas: ColunaTabela<LinhaVencimento>[] = [
    {
      id: "numero",
      cabecalho: "Contrato",
      celula: (l) => <span className="whitespace-nowrap font-medium">{l.contrato.numero_contrato}/{l.contrato.ano}</span>,
      ordenarPor: (l) => `${l.contrato.ano}-${l.contrato.numero_contrato.padStart(6, "0")}`,
      buscarPor: (l) => `${l.contrato.numero_contrato}/${l.contrato.ano}`,
      mobile: "titulo",
    },
    {
      id: "objeto",
      cabecalho: "Objeto e contratado",
      celula: (l) => (
        <span className="line-clamp-2">
          {l.contrato.objeto_resumido || l.contrato.objeto}
          <span className="block text-xs text-muted-foreground">{nomeContratado(l.contrato.fornecedor)}</span>
        </span>
      ),
      buscarPor: (l) => `${l.contrato.objeto_resumido ?? ""} ${l.contrato.objeto} ${l.contrato.fornecedor?.razao_social ?? ""} ${l.contrato.fornecedor?.nome_fantasia ?? ""}`,
      className: "min-w-[14rem]",
    },
    {
      id: "gestor",
      cabecalho: "Gestor",
      celula: (l) => l.gestor ?? <span className="text-muted-foreground">sem gestor</span>,
      buscarPor: (l) => l.gestor ?? "",
      className: "min-w-[9rem]",
    },
    {
      id: "fim",
      cabecalho: "Fim atual",
      celula: (l) => (
        <span className="flex flex-col items-start gap-1">
          <span className="whitespace-nowrap text-sm tabular-nums">{formatDateBR(l.contrato.data_fim_atual || l.contrato.data_fim)}</span>
          <SeloVigencia situacao={l.situacao} />
        </span>
      ),
      ordenarPor: (l) => l.contrato.data_fim_atual || l.contrato.data_fim,
    },
    {
      id: "limite",
      cabecalho: "Pode prorrogar",
      celula: (l) => <span className="whitespace-nowrap text-sm">{textoLimite(l)}</span>,
      ordenarPor: (l) => l.limite ?? "",
    },
    {
      id: "acao",
      cabecalho: "Ação esperada",
      celula: (l) => (
        <span className="text-sm">
          {l.noPrazo ? textoAcao(l.acao) : "Renovar a garantia"}
          {l.garantia && l.noPrazo && (
            <span className="block text-xs text-muted-foreground">e a garantia, que vence em {formatDateBR(l.contrato.garantia_vencimento)}</span>
          )}
          {l.garantia && !l.noPrazo && (
            <span className="block text-xs text-muted-foreground">vence em {formatDateBR(l.contrato.garantia_vencimento)}</span>
          )}
        </span>
      ),
      buscarPor: (l) => textoAcao(l.acao),
      className: "min-w-[11rem]",
    },
    {
      id: "providencia",
      cabecalho: "Providência",
      celula: (l) =>
        l.contrato.renovacao_providencia ? (
          <span className="text-sm">
            {textoProvidencia(l.contrato)}
            {l.contrato.renovacao_observacao && <span className="line-clamp-2 block text-xs text-muted-foreground">{l.contrato.renovacao_observacao}</span>}
            {l.contrato.renovacao_atualizada_em && (
              <span className="block text-xs text-muted-foreground">em {formatDateBR(l.contrato.renovacao_atualizada_em)}</span>
            )}
          </span>
        ) : (
          <span className={cn("text-sm", semProvidencia(l) ? "font-medium text-destructive" : "text-muted-foreground")}>
            {semProvidencia(l) ? "Sem providência" : "—"}
          </span>
        ),
      buscarPor: (l) => `${textoProvidencia(l.contrato)} ${l.contrato.renovacao_observacao ?? ""}`,
      className: "min-w-[11rem]",
    },
  ];

  return (
    <ModuleLayout module="contratos">
      <div className="space-y-6">
        <PageHeader
          titulo="Vencimentos"
          descricao="Contratos que vencem em até 120 dias ou já venceram, com a ação esperada e a providência"
          migalhas={[{ rotulo: "Contratos", href: "/contratos" }, { rotulo: "Vencimentos" }]}
          acoes={
            <Button
              variant="outline"
              disabled={filtradas.length === 0}
              onClick={() => exportarParaExcel(linhasPlanilhaVencimentos(filtradas), "vencimentos-contratos", "Vencimentos")}
            >
              <FileSpreadsheet className="h-4 w-4" aria-hidden="true" />
              Planilha
            </Button>
          }
        />

        <section aria-labelledby="venc-cartoes">
          <h2 id="venc-cartoes" className="sr-only">Resumo por prazo</h2>
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
            {CARTOES.map((c) => {
              const ativo = filtro === c.filtro;
              return (
                <li key={c.filtro}>
                  <button
                    type="button"
                    aria-pressed={ativo}
                    onClick={() => setFiltro(ativo ? "todos" : c.filtro)}
                    className={cn(
                      "block h-full w-full rounded-lg text-left transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                      ativo && "ring-2 ring-primary",
                    )}
                  >
                    <KpiCard
                      rotulo={c.rotulo}
                      valor={consulta.isError ? "—" : numero.format(resumo[c.filtro])}
                      icone={c.icone}
                      carregando={consulta.isLoading}
                      className="h-full"
                    />
                  </button>
                </li>
              );
            })}
          </ul>
        </section>

        <DataTable
          rotulo="Vencimentos"
          dados={filtradas}
          colunas={colunas}
          chaveLinha={(l) => l.contrato.id}
          carregando={consulta.isLoading}
          erro={consulta.isError ? "Não foi possível carregar os vencimentos." : null}
          aoTentarNovamente={() => consulta.refetch()}
          busca={{ placeholder: "Buscar por nº, objeto, contratado, gestor ou providência" }}
          filtros={
            <>
              <Select value={filtro} onValueChange={(v) => setFiltro(v as FiltroVencimento)}>
                <SelectTrigger className="w-full sm:w-52" aria-label="Prazo"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FILTROS_VENCIMENTO.map((f) => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2">
                <Switch id="venc-sem" checked={soSem} onCheckedChange={setSoSem} />
                <Label htmlFor="venc-sem" className="font-normal">Só sem providência ({numero.format(resumo.semProvidencia)})</Label>
              </div>
            </>
          }
          acoesLinha={podeEditar ? (l) => (
            <Button variant="outline" size="sm" onClick={() => setProvidencia(l)}>
              <ClipboardCheck className="h-4 w-4" aria-hidden="true" />
              Providência
            </Button>
          ) : undefined}
          aoClicarLinha={(l) => navigate(`/contratos/${l.contrato.id}`)}
          vazio={{
            icone: CalendarClock,
            titulo: linhas.length ? "Nenhum contrato com esses filtros" : "Nada vencendo nos próximos 120 dias",
            descricao: linhas.length ? "Mude o prazo ou desligue \"Só sem providência\"." : "Os contratos em vigor vencem depois de 120 dias e nenhuma garantia está acabando.",
          }}
        />
        <p className="text-sm text-muted-foreground">
          Avisos em 120, 90, 60 e 30 dias. O gestor e os fiscais veem os contratos deles no sino; quem tem "Editar contratos" vê todos.
        </p>
      </div>

      <ProvidenciaRenovacaoDialog linha={providencia} onClose={() => setProvidencia(null)} />
    </ModuleLayout>
  );
}
