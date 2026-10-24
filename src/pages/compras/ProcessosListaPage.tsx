/**
 * Processos de contratação: lista com etapa, setor, dias parado, valor estimado e empenhado (FIP 614 pelo nº SEI).
 * Compras cadastra o processo e carrega a planilha de acompanhamento; o andamento se registra na ficha.
 * Spec: docs/superpowers/specs/2026-10-23-compras-processos-reserva-natureza-design.md
 */

import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FileUp, FolderKanban, Plus } from "lucide-react";
import { ModuleLayout } from "@/components/layout";
import { DataTable, PageHeader, StatusBadge, type ColunaTabela } from "@/components/design-system";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ImportacaoWizard } from "@/components/importacao";
import { ProcessoFormDialog } from "@/components/compras/processos/ProcessoFormDialog";
import { useAuth } from "@/contexts/AuthContext";
import { formatCurrency, formatDateBR } from "@/lib/formatters";
import { importadorProcessosPlanilha } from "@/lib/importacao/importadores/processosPlanilha";
import { somarEmpenhado, useEmpenhosDosProcessos, useProcessos, useSalvarProcesso } from "@/hooks/useProcessosContratacao";
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

export default function ProcessosListaPage() {
  const { hasPermission } = useAuth();
  const podeEditar = hasPermission("compras.processos.editar");
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const processos = useProcessos();
  const empenhos = useEmpenhosDosProcessos();
  const salvar = useSalvarProcesso();
  const [novo, setNovo] = useState(false);
  const [importando, setImportando] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [ano, setAno] = useState(TODOS);
  const [etapa, setEtapa] = useState(TODOS);
  const [setor, setSetor] = useState(TODOS);

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
  const filtrados = lista.filter(
    (p) => (ano === TODOS || String(p.ano) === ano) && (etapa === TODOS || p.etapa === etapa) && (setor === TODOS || p.setor_atual === setor),
  );

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
      id: "objeto",
      cabecalho: "Objeto",
      celula: (p) => <span className="line-clamp-2">{p.objeto_resumido ?? p.objeto}</span>,
      buscarPor: (p) => `${p.objeto_resumido ?? ""} ${p.objeto}`,
      className: "min-w-[11rem]",
    },
    {
      id: "etapa",
      cabecalho: "Etapa",
      celula: (p) => <StatusBadge tom={p.etapa === "cancelado" ? "neutro" : p.etapa === "encerrado" ? "sucesso" : "andamento"} icone={false}>{rotuloEtapa(p.etapa)}</StatusBadge>,
      ordenarPor: (p) => ETAPAS_PROCESSO.findIndex((e) => e.value === p.etapa),
    },
    { id: "setor", cabecalho: "Setor", celula: (p) => (p.setor_atual ? p.setor_atual.replace(/\//g, "/\u200b") : "—"), className: "min-w-[11rem]", buscarPor: (p) => p.setor_atual, ordenarPor: (p) => p.setor_atual },
    {
      id: "parado",
      cabecalho: "Dias parado",
      celula: (p) => {
        const dias = diasParado(p.atualizado_em);
        return dias === null ? <span className="text-muted-foreground">sem data</span> : <span title={`Última movimentação em ${formatDateBR(p.atualizado_em)}`}>{dias}</span>;
      },
      ordenarPor: (p) => diasParado(p.atualizado_em) ?? -1,
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
            podeEditar && (
              <>
                <Button variant="outline" onClick={() => setImportando(true)}>
                  <FileUp className="h-4 w-4" aria-hidden="true" />
                  Importar planilha
                </Button>
                <Button onClick={() => setNovo(true)}>
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  Novo processo
                </Button>
              </>
            )
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

      <Dialog open={importando} onOpenChange={(aberto) => !ocupado && setImportando(aberto)}>
        <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{importadorProcessosPlanilha.titulo}</DialogTitle>
            <DialogDescription>{importadorProcessosPlanilha.descricao}</DialogDescription>
          </DialogHeader>
          {importando && <ImportacaoWizard importador={importadorProcessosPlanilha} onOcupadoChange={setOcupado} />}
        </DialogContent>
      </Dialog>
    </ModuleLayout>
  );
}
