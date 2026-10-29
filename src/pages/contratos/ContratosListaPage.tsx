/**
 * Lista dos contratos (entrega C1): número, objeto, contratado, setor, gestor, valor e prazo, com filtros de situação e
 * de prazo (vence em até N dias, vencidos, sem gestor ou fiscal). Cadastrar exige contratos.criar; a carga inicial
 * vem pela Central de Importações. Spec: docs/superpowers/specs/2026-10-27-contratos-gestao-completa-design.md
 */

import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { FileSignature, FileSpreadsheet, Plus, Upload } from "lucide-react";
import { ModuleLayout } from "@/components/layout";
import { DataTable, PageHeader, type ColunaTabela } from "@/components/design-system";
import { ContratoFormDialog } from "@/components/contratos/ContratoFormDialog";
import { SeloVigencia } from "@/components/contratos/SeloVigencia";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { exportarParaExcel } from "@/export/exportExcel";
import { LIMITE_LISTA, useContratosLista, useSalvarContrato } from "@/hooks/useContratos";
import { formatCurrency, formatDateBR } from "@/lib/formatters";
import { ehFiltroPrazo, FILTROS_PRAZO, linhasPlanilhaContratos, passaNoFiltroPrazo, type FiltroPrazo } from "@/lib/contratos/lista";
import { situacaoVigencia } from "@/lib/contratos/vigencia";
import { nomeContratado, responsaveisAtivos, SITUACOES_CONTRATO, type ContratoLista } from "@/types/contratos";

const TODAS = "todas";
const IMPORTAR = "/admin/importacoes?importador=contratos_planilha";

export default function ContratosListaPage() {
  const { hasPermission } = useAuth();
  const podeCriar = hasPermission("contratos.criar");
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const contratos = useContratosLista();
  const salvar = useSalvarContrato();
  const [novo, setNovo] = useState(false);
  const [situacao, setSituacao] = useState(() => params.get("situacao") ?? TODAS);
  const [prazo, setPrazo] = useState<FiltroPrazo>(() => {
    const p = params.get("prazo");
    return ehFiltroPrazo(p) ? p : "todos";
  });

  // Atalho do menu "Novo contrato" (/contratos/lista?novo=1)
  useEffect(() => {
    if (params.get("novo") && podeCriar) {
      setNovo(true);
      const resto = new URLSearchParams(params);
      resto.delete("novo");
      setParams(resto, { replace: true });
    }
  }, [params, podeCriar, setParams]);

  const lista = useMemo(() => contratos.data ?? [], [contratos.data]);
  const filtrados = useMemo(
    () => lista.filter((c) => (situacao === TODAS || c.status === situacao) && passaNoFiltroPrazo(c, prazo)),
    [lista, situacao, prazo],
  );

  const colunas: ColunaTabela<ContratoLista>[] = [
    {
      id: "numero",
      cabecalho: "Contrato",
      celula: (c) => (
        <span className="whitespace-nowrap font-medium">
          {c.numero_contrato}/{c.ano}
          {c.processo_sei && <span className="block text-xs font-normal text-muted-foreground">SEI {c.processo_sei}</span>}
        </span>
      ),
      ordenarPor: (c) => `${c.ano}-${c.numero_contrato.padStart(6, "0")}`,
      buscarPor: (c) => `${c.numero_contrato}/${c.ano} ${c.processo_sei ?? ""}`,
      mobile: "titulo",
    },
    {
      id: "objeto",
      cabecalho: "Objeto e contratado",
      celula: (c) => (
        <span className="line-clamp-2">
          {c.objeto_resumido || c.objeto}
          <span className="block text-xs text-muted-foreground">{nomeContratado(c.fornecedor)}</span>
        </span>
      ),
      buscarPor: (c) => `${c.objeto_resumido ?? ""} ${c.objeto} ${c.fornecedor?.razao_social ?? ""} ${c.fornecedor?.nome_fantasia ?? ""} ${c.fornecedor?.cpf_cnpj ?? ""}`,
      className: "min-w-[14rem]",
    },
    {
      id: "setor",
      cabecalho: "Setor",
      celula: (c) => c.unidade?.sigla || c.unidade?.nome || "—",
      ordenarPor: (c) => c.unidade?.sigla ?? c.unidade?.nome,
      buscarPor: (c) => `${c.unidade?.sigla ?? ""} ${c.unidade?.nome ?? ""}`,
    },
    {
      id: "gestor",
      cabecalho: "Gestor",
      celula: (c) => responsaveisAtivos(c.responsaveis).gestor?.nome ?? <span className="text-muted-foreground">sem gestor</span>,
      buscarPor: (c) => c.responsaveis.map((r) => r.nome).join(" "),
      className: "min-w-[9rem]",
    },
    {
      id: "valor",
      cabecalho: "Valor atual",
      celula: (c) => <span className="tabular-nums">{formatCurrency(Number(c.valor_atual))}</span>,
      ordenarPor: (c) => Number(c.valor_atual),
      alinhamento: "direita",
    },
    {
      id: "prazo",
      cabecalho: "Vigência",
      celula: (c) => (
        <span className="flex flex-col items-start gap-1">
          <span className="whitespace-nowrap text-sm tabular-nums">até {formatDateBR(c.data_fim_atual || c.data_fim)}</span>
          <SeloVigencia situacao={situacaoVigencia(c)} />
        </span>
      ),
      ordenarPor: (c) => c.data_fim_atual || c.data_fim,
    },
  ];

  return (
    <ModuleLayout module="contratos">
      <div className="space-y-6">
        <PageHeader
          titulo="Contratos"
          descricao="Contratos assinados: contratado, objeto, valores, vigência, gestor e fiscais"
          migalhas={[{ rotulo: "Contratos", href: "/contratos" }, { rotulo: "Lista" }]}
          acoes={
            <>
              <Button
                variant="outline"
                disabled={filtrados.length === 0}
                onClick={() => exportarParaExcel(linhasPlanilhaContratos(filtrados), "contratos", "Contratos")}
              >
                <FileSpreadsheet className="h-4 w-4" aria-hidden="true" />
                Planilha
              </Button>
              {podeCriar && (
                <>
                  <Button variant="outline" asChild>
                    <Link to={IMPORTAR}>
                      <Upload className="h-4 w-4" aria-hidden="true" />
                      Importar planilha
                    </Link>
                  </Button>
                  <Button onClick={() => setNovo(true)}>
                    <Plus className="h-4 w-4" aria-hidden="true" />
                    Novo contrato
                  </Button>
                </>
              )}
            </>
          }
        />

        {lista.length >= LIMITE_LISTA && (
          <Alert>
            <AlertDescription>
              A lista mostra os {LIMITE_LISTA} contratos mais recentes; os mais antigos não aparecem aqui nem na planilha.
              Para achar um deles, use Processos SEI → Localizar processo.
            </AlertDescription>
          </Alert>
        )}

        <DataTable
          rotulo="Contratos"
          dados={filtrados}
          colunas={colunas}
          chaveLinha={(c) => c.id}
          carregando={contratos.isLoading}
          erro={contratos.isError ? "Não foi possível carregar os contratos." : null}
          aoTentarNovamente={() => contratos.refetch()}
          busca={{ placeholder: "Buscar por nº, processo SEI, objeto, contratado, CNPJ, setor ou servidor" }}
          filtros={
            <>
              <Select value={situacao} onValueChange={setSituacao}>
                <SelectTrigger className="w-full sm:w-48" aria-label="Situação"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={TODAS}>Situação: todas</SelectItem>
                  {SITUACOES_CONTRATO.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={prazo} onValueChange={(v) => setPrazo(v as FiltroPrazo)}>
                <SelectTrigger className="w-full sm:w-64" aria-label="Prazo"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FILTROS_PRAZO.map((f) => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </>
          }
          aoClicarLinha={(c) => navigate(`/contratos/${c.id}`)}
          vazio={{
            icone: FileSignature,
            titulo: lista.length ? "Nenhum contrato com esses filtros" : "Nenhum contrato cadastrado",
            descricao: lista.length
              ? "Mude a situação ou o prazo para ver os outros."
              : podeCriar ? "Cadastre um a um ou traga todos de uma vez pela planilha." : "Ainda não há contratos registrados.",
            acao: !lista.length && podeCriar ? (
              <Button variant="outline" asChild><Link to={IMPORTAR}>Importar planilha</Link></Button>
            ) : undefined,
          }}
        />
      </div>

      <ContratoFormDialog
        open={novo}
        onOpenChange={setNovo}
        salvando={salvar.isPending}
        onSalvar={async (dados) => {
          const id = await salvar.mutateAsync(dados);
          navigate(`/contratos/${id}`);
        }}
      />
    </ModuleLayout>
  );
}
