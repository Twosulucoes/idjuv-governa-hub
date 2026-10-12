import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Briefcase, CircleSlash, History, Upload, UserCheck, UserMinus } from "lucide-react";
import { ModuleLayout } from "@/components/layout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DataTable,
  KpiCard,
  PageHeader,
  StatusBadge,
  type ColunaTabela,
  type TomStatus,
} from "@/components/design-system";
import { ImportarQuadroVagasDialog } from "@/components/cargos/ImportarQuadroVagasDialog";
import { useAuth } from "@/contexts/AuthContext";
import {
  useHistoricoVagas,
  useQuadroVagas,
  type EventoHistoricoVaga,
  type EventoVaga,
  type SituacaoVaga,
  type VagaQuadro,
} from "@/hooks/useQuadroVagas";

const SITUACAO: Record<SituacaoVaga, { label: string; tom: TomStatus }> = {
  livre: { label: "Livre", tom: "sucesso" },
  ocupada: { label: "Ocupada", tom: "andamento" },
  extinta: { label: "Extinta", tom: "neutro" },
};

const EVENTO: Record<EventoVaga, { label: string; tom: TomStatus }> = {
  vaga_criada: { label: "Vaga criada", tom: "destaque" },
  vaga_extinta: { label: "Vaga extinta", tom: "neutro" },
  entrada: { label: "Entrada", tom: "sucesso" },
  saida: { label: "Saída", tom: "pendente" },
};

const formatarData = (data: string | null) => (data ? new Date(`${data}T12:00:00`).toLocaleDateString("pt-BR") : "-");

const colunasHistorico = (comVaga: boolean): ColunaTabela<EventoHistoricoVaga>[] => [
  {
    id: "data",
    cabecalho: "Data",
    mobile: "titulo",
    ordenarPor: (e) => e.data,
    celula: (e) => formatarData(e.data),
  },
  {
    id: "evento",
    cabecalho: "Evento",
    ordenarPor: (e) => EVENTO[e.evento].label,
    celula: (e) => <StatusBadge tom={EVENTO[e.evento].tom}>{EVENTO[e.evento].label}</StatusBadge>,
  },
  ...(comVaga
    ? [
        {
          id: "vaga",
          cabecalho: "Vaga",
          ordenarPor: (e: EventoHistoricoVaga) => e.codigo,
          buscarPor: (e: EventoHistoricoVaga) => [e.codigo, e.cargo_nome, e.cargo_sigla, e.unidade_sigla].join(" "),
          celula: (e: EventoHistoricoVaga) => (
            <div>
              <p className="font-medium">{e.codigo}</p>
              <p className="text-body text-muted-foreground">{e.cargo_nome}</p>
            </div>
          ),
        },
      ]
    : []),
  {
    id: "servidor",
    cabecalho: "Servidor",
    ordenarPor: (e) => e.servidor_nome ?? "",
    buscarPor: (e) => e.servidor_nome,
    celula: (e) => e.servidor_nome ?? (e.servidor_id ? "(sem acesso ao nome)" : "-"),
  },
  {
    id: "detalhe",
    cabecalho: "Ato / motivo",
    celula: (e) => e.detalhe ?? "-",
  },
];

function HistoricoVagaDialog({ vaga, onClose }: { vaga: VagaQuadro | null; onClose: () => void }) {
  const { data = [], isLoading, isError, refetch } = useHistoricoVagas(vaga?.id, Boolean(vaga));
  return (
    <Dialog open={Boolean(vaga)} onOpenChange={(aberto) => !aberto && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Histórico da vaga {vaga?.codigo}</DialogTitle>
          <DialogDescription>
            {vaga?.cargo_sigla ? `${vaga.cargo_sigla} - ` : ""}
            {vaga?.cargo_nome}
            {vaga?.unidade_sigla ? ` (${vaga.unidade_sigla})` : ""}. Quem entrou e saiu, do mais recente para o mais antigo.
          </DialogDescription>
        </DialogHeader>
        <DataTable
          rotulo={`Histórico da vaga ${vaga?.codigo ?? ""}`}
          dados={data}
          colunas={colunasHistorico(false)}
          chaveLinha={(e) => `${e.evento}-${e.provimento_id ?? e.vaga_id}-${e.data}`}
          carregando={isLoading}
          erro={isError ? "Não foi possível carregar o histórico." : null}
          aoTentarNovamente={() => refetch()}
          vazio={{ icone: History, titulo: "Sem movimentação registrada" }}
        />
      </DialogContent>
    </Dialog>
  );
}

export default function QuadroVagasPage() {
  const { hasPermission } = useAuth();
  const podeImportar = hasPermission("governanca.cargos.gerenciar");
  const [importarAberto, setImportarAberto] = useState(false);
  const [vagaHistorico, setVagaHistorico] = useState<VagaQuadro | null>(null);
  const [aba, setAba] = useState("vagas");

  const { data: vagas = [], isLoading, isError, refetch } = useQuadroVagas();
  const historico = useHistoricoVagas(null, aba === "historico");

  const totais = useMemo(
    () => ({
      ativas: vagas.filter((v) => v.situacao !== "extinta").length,
      ocupadas: vagas.filter((v) => v.situacao === "ocupada").length,
      livres: vagas.filter((v) => v.situacao === "livre").length,
      extintas: vagas.filter((v) => v.situacao === "extinta").length,
    }),
    [vagas],
  );

  const colunas: ColunaTabela<VagaQuadro>[] = [
    {
      id: "codigo",
      cabecalho: "Vaga",
      mobile: "titulo",
      ordenarPor: (v) => v.codigo,
      buscarPor: (v) => [v.codigo, v.cargo_nome, v.cargo_sigla, v.unidade_sigla, v.unidade_nome, v.ocupante_nome].join(" "),
      celula: (v) => <span className="font-medium">{v.codigo}</span>,
    },
    {
      id: "cargo",
      cabecalho: "Cargo",
      ordenarPor: (v) => v.cargo_nome,
      celula: (v) => (
        <div>
          <p>{v.cargo_nome}</p>
          {v.cargo_sigla && <p className="text-body text-muted-foreground">{v.cargo_sigla}</p>}
        </div>
      ),
    },
    {
      id: "unidade",
      cabecalho: "Unidade",
      ordenarPor: (v) => v.unidade_sigla ?? "",
      celula: (v) => v.unidade_sigla ?? v.unidade_nome ?? <span className="text-muted-foreground">Sem unidade</span>,
    },
    {
      id: "situacao",
      cabecalho: "Situação",
      alinhamento: "centro",
      ordenarPor: (v) => SITUACAO[v.situacao]?.label ?? v.situacao,
      celula: (v) => (
        <StatusBadge tom={SITUACAO[v.situacao]?.tom ?? "neutro"}>{SITUACAO[v.situacao]?.label ?? v.situacao}</StatusBadge>
      ),
    },
    {
      id: "ocupante",
      cabecalho: "Ocupante",
      ordenarPor: (v) => v.ocupante_nome ?? "",
      celula: (v) =>
        v.situacao === "ocupada" ? (
          <div>
            <p>{v.ocupante_nome ?? "(sem acesso ao nome)"}</p>
            {v.ocupante_desde && (
              <p className="text-body text-muted-foreground">desde {formatarData(v.ocupante_desde)}</p>
            )}
          </div>
        ) : (
          "-"
        ),
    },
    {
      id: "criacao",
      cabecalho: "Criada em",
      ordenarPor: (v) => v.data_criacao,
      celula: (v) => (
        <div>
          <p>{formatarData(v.data_criacao)}</p>
          {v.ato_criacao && <p className="text-body text-muted-foreground">{v.ato_criacao}</p>}
        </div>
      ),
    },
  ];

  return (
    <ProtectedRoute requiredModule="governanca">
      <ModuleLayout module="governanca">
        <div className="space-y-6">
          <PageHeader
            migalhas={[
              { rotulo: "Governança", href: "/governanca" },
              { rotulo: "Gestão de cargos", href: "/cargos" },
              { rotulo: "Quadro de vagas" },
            ]}
            titulo="Quadro de vagas"
            descricao="Cada vaga tem um código e uma pessoa por vez. Para nomear alguém numa vaga ocupada, registre antes a saída de quem está nela."
            acoes={
              <>
                <Button variant="outline" asChild>
                  <Link to="/cargos">
                    <Briefcase className="h-4 w-4" aria-hidden="true" />
                    Cargos
                  </Link>
                </Button>
                {podeImportar && (
                  <Button onClick={() => setImportarAberto(true)}>
                    <Upload className="h-4 w-4" aria-hidden="true" />
                    Importar planilha
                  </Button>
                )}
              </>
            }
          />

          <section aria-labelledby="vagas-resumo">
            <h2 id="vagas-resumo" className="sr-only">Resumo do quadro</h2>
            <ul className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <li><KpiCard rotulo="Vagas ativas" valor={totais.ativas} icone={Briefcase} carregando={isLoading} className="h-full" /></li>
              <li><KpiCard rotulo="Ocupadas" valor={totais.ocupadas} icone={UserCheck} carregando={isLoading} className="h-full" /></li>
              <li><KpiCard rotulo="Livres" valor={totais.livres} icone={UserMinus} carregando={isLoading} className="h-full" /></li>
              <li><KpiCard rotulo="Extintas" valor={totais.extintas} icone={CircleSlash} carregando={isLoading} className="h-full" /></li>
            </ul>
          </section>

          <Tabs value={aba} onValueChange={setAba}>
            <TabsList>
              <TabsTrigger value="vagas">Vagas</TabsTrigger>
              <TabsTrigger value="historico">Histórico do quadro</TabsTrigger>
            </TabsList>

            <TabsContent value="vagas">
              <DataTable
                rotulo="Vagas"
                dados={vagas}
                colunas={colunas}
                chaveLinha={(v) => v.id}
                carregando={isLoading}
                erro={isError ? "Não foi possível carregar o quadro de vagas." : null}
                aoTentarNovamente={() => refetch()}
                busca={{ placeholder: "Buscar por código, cargo, unidade ou ocupante..." }}
                vazio={{
                  icone: Briefcase,
                  titulo: "Nenhuma vaga cadastrada",
                  descricao: podeImportar
                    ? "Use “Importar planilha” para lançar os cargos e as vagas do órgão."
                    : "Peça a quem gerencia os cargos para importar o quadro.",
                }}
                acoesLinha={(v) => (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setVagaHistorico(v)}
                    aria-label={`Histórico da vaga ${v.codigo}`}
                  >
                    <History className="h-4 w-4" aria-hidden="true" />
                  </Button>
                )}
              />
            </TabsContent>

            <TabsContent value="historico">
              <DataTable
                rotulo="Histórico do quadro de vagas"
                dados={historico.data ?? []}
                colunas={colunasHistorico(true)}
                chaveLinha={(e) => `${e.evento}-${e.provimento_id ?? e.vaga_id}-${e.data}`}
                carregando={historico.isLoading}
                erro={historico.isError ? "Não foi possível carregar o histórico." : null}
                aoTentarNovamente={() => historico.refetch()}
                busca={{ placeholder: "Buscar por vaga, cargo ou servidor..." }}
                vazio={{ icone: History, titulo: "Sem movimentação registrada" }}
              />
            </TabsContent>
          </Tabs>

          <HistoricoVagaDialog vaga={vagaHistorico} onClose={() => setVagaHistorico(null)} />
          <ImportarQuadroVagasDialog open={importarAberto} onOpenChange={setImportarAberto} />
        </div>
      </ModuleLayout>
    </ProtectedRoute>
  );
}
