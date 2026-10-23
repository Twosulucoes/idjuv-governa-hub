import { useState } from "react";
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  ClipboardCheck,
  Download,
  FileText,
  Megaphone,
  Shield,
  Target,
} from "lucide-react";
import { ModuleLayout } from "@/components/layout/ModuleLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChartCard, EmptyState, KpiCard, PageHeader, StatusBadge, tomDaSituacao } from "@/components/design-system";
import { generateRelatorioGovernancaPDF } from "@/lib/pdfGenerator";
import { useRelatorioGovernanca } from "@/hooks/useRelatorioGovernanca";
import { useAuth } from "@/contexts/AuthContext";
import {
  AVISO_SEM_CADASTRO,
  indicadoresGovernanca,
  relatorioSemCadastro,
} from "@/lib/documentos/modelos/governanca/relatorioAnual";
import { toast } from "sonner";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, Legend, XAxis, YAxis } from "recharts";

// Relatório anual com os cadastros reais de governança e integridade (hook `useRelatorioGovernanca`).
// Seção sem registro mostra "sem dados cadastrados"; nenhum número fica escrito no código.

const ICONES_INDICADOR: Record<string, typeof CheckCircle2> = {
  Conformidade: CheckCircle2,
  "Processos mapeados": FileText,
  "Riscos identificados": Shield,
  "Ações de tratamento": Target,
  "Avaliações de controles": ClipboardCheck,
  "Denúncias recebidas": Megaphone,
};

const chartConfig = {
  quantidade: { label: "Processos", color: "hsl(var(--chart-1))" },
  inerente: { label: "Inerente", color: "hsl(var(--chart-3))" },
  residual: { label: "Residual", color: "hsl(var(--chart-2))" },
};

const SemDados = () => (
  <EmptyState titulo="Sem dados cadastrados" descricao="Nenhum registro deste assunto no exercício escolhido." />
);

export default function RelatorioGovernancaPage() {
  const anoAtual = new Date().getFullYear();
  const [ano, setAno] = useState(anoAtual);
  const { hasPermission } = useAuth();
  const podeVerDenuncias = hasPermission("integridade.gerenciar");
  const { data, isLoading, isError } = useRelatorioGovernanca(ano, podeVerDenuncias);

  const anos = Array.from({ length: 6 }, (_, i) => anoAtual - i);
  const semCadastro = data ? relatorioSemCadastro(data) : false;
  const indicadores = data ? indicadoresGovernanca(data) : [];

  const baixar = async () => {
    if (!data) return;
    try {
      await generateRelatorioGovernancaPDF(data);
      toast.success("PDF do Relatório de Governança gerado com sucesso!");
    } catch (error) {
      console.error("Erro ao gerar relatório de governança:", error);
      toast.error("Erro ao gerar o PDF do Relatório de Governança");
    }
  };

  return (
    <ModuleLayout module="governanca">
      <div className="space-y-6">
        <PageHeader
          migalhas={[{ rotulo: "Governança", href: "/governanca" }, { rotulo: "Relatório de governança" }]}
          titulo="Relatório anual de governança e integridade"
          descricao={
            <span className="flex items-center gap-2">
              <Calendar className="w-4 h-4" aria-hidden="true" />
              Exercício {ano}, com os cadastros de governança do sistema
            </span>
          }
          acoes={
            <div className="flex items-center gap-2">
              <Select value={String(ano)} onValueChange={(v) => setAno(Number(v))}>
                <SelectTrigger className="w-28" aria-label="Exercício">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {anos.map((a) => (
                    <SelectItem key={a} value={String(a)}>
                      {a}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={baixar} disabled={!data}>
                <Download className="w-4 h-4" aria-hidden="true" />
                Baixar PDF
              </Button>
            </div>
          }
        />

        {isError && (
          <EmptyState
            icone={AlertTriangle}
            titulo="Não foi possível carregar o relatório"
            descricao="Verifique sua conexão e permissões e tente novamente."
          />
        )}

        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }, (_, i) => (
              <KpiCard key={i} rotulo="Carregando" valor="" carregando />
            ))}
          </div>
        )}

        {data && semCadastro && (
          <EmptyState
            icone={AlertTriangle}
            titulo={AVISO_SEM_CADASTRO}
            descricao={`Não há riscos, controles, checklists de conformidade, processos mapeados nem ações de tratamento cadastrados para ${ano}. O PDF sai com este aviso e sem números.`}
          />
        )}

        {data && !semCadastro && (
          <>
            <section aria-labelledby="relatorio-indicadores">
              <h2 id="relatorio-indicadores" className="sr-only">Indicadores principais</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {indicadores.map((i) => (
                  <KpiCard key={i.titulo} rotulo={i.titulo} valor={i.valor} detalhe={i.base} icone={ICONES_INDICADOR[i.titulo]} />
                ))}
              </div>
            </section>

            <h2 className="sr-only">Detalhamento</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Conformidade por checklist */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-primary" aria-hidden="true" />
                    Conformidade por checklist
                  </CardTitle>
                  <CardDescription>Itens conformes sobre os itens aplicáveis do exercício {ano}</CardDescription>
                </CardHeader>
                <CardContent>
                  {data.conformidade.length === 0 ? (
                    <SemDados />
                  ) : (
                    <div className="space-y-4">
                      {data.conformidade.map((c) => {
                        const aplicaveis = c.itens - c.naoAplicaveis;
                        const pct = aplicaveis > 0 ? Math.round((c.conformes / aplicaveis) * 100) : null;
                        return (
                          <div key={`${c.nome}-${c.orgao}`} className="space-y-1">
                            <div className="flex items-center justify-between gap-2 text-sm">
                              <span className="font-medium">{c.nome} <span className="text-muted-foreground">({c.orgao})</span></span>
                              <span className="tabular-nums">{pct === null ? "—" : `${pct}%`}</span>
                            </div>
                            <Progress value={pct ?? 0} className="h-2" aria-label={`${c.nome}: ${pct ?? 0}% conforme`} />
                            <p className="text-xs text-muted-foreground tabular-nums">
                              {c.conformes} conformes · {c.parciais} parciais · {c.naoConformes} não conformes · {c.pendentes} pendentes
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Processos por área */}
              <ChartCard
                titulo="Processos mapeados por área"
                descricao="Processos ativos da matriz RACI"
                tabela={{
                  colunas: [
                    { chave: "area", rotulo: "Área" },
                    { chave: "quantidade", rotulo: "Processos", numerica: true },
                  ],
                  linhas: data.processosPorArea,
                }}
              >
                {data.processosPorArea.length === 0 ? (
                  <SemDados />
                ) : (
                  <ChartContainer config={chartConfig} className="h-[300px] w-full">
                    <BarChart data={data.processosPorArea} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis type="number" allowDecimals={false} className="text-xs" />
                      <YAxis dataKey="area" type="category" className="text-xs" width={110} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="quantidade" fill="var(--color-quantidade)" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ChartContainer>
                )}
              </ChartCard>

              {/* Matriz de riscos */}
              <ChartCard
                titulo="Matriz de riscos"
                descricao="Riscos ativos por nível inerente e residual (residual só dos já reavaliados)"
                tabela={{
                  colunas: [
                    { chave: "nivel", rotulo: "Nível" },
                    { chave: "inerente", rotulo: "Inerente", numerica: true },
                    { chave: "residual", rotulo: "Residual", numerica: true },
                  ],
                  linhas: data.riscosPorNivel,
                }}
              >
                {data.riscosPorNivel.length === 0 ? (
                  <SemDados />
                ) : (
                  <>
                    <ChartContainer config={chartConfig} className="h-[260px] w-full">
                      <BarChart data={data.riscosPorNivel}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="nivel" className="text-xs" />
                        <YAxis allowDecimals={false} className="text-xs" />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Legend />
                        <Bar dataKey="inerente" fill="var(--color-inerente)" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="residual" fill="var(--color-residual)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ChartContainer>
                    <ul className="mt-3 flex flex-wrap gap-2 text-xs">
                      {data.riscosPorSituacao.map((s) => (
                        <li key={s.situacao}>
                          <StatusBadge tom="neutro">{s.situacao}: {s.quantidade}</StatusBadge>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </ChartCard>

              {/* Plano de tratamento */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-primary" aria-hidden="true" />
                    Plano de tratamento de riscos
                  </CardTitle>
                  <CardDescription>Ações vigentes em {ano}</CardDescription>
                </CardHeader>
                <CardContent>
                  {data.acoes.length === 0 ? (
                    <SemDados />
                  ) : (
                    <div className="space-y-4">
                      {data.acoes.map((acao, i) => (
                        <div key={`${acao.titulo}-${i}`} className="space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-medium">{acao.titulo}</span>
                            <div className="flex items-center gap-2">
                              <StatusBadge tom={tomDaSituacao(acao.situacao)}>{acao.situacao}</StatusBadge>
                              {acao.prazo && <span className="text-xs text-muted-foreground">{acao.prazo}</span>}
                            </div>
                          </div>
                          {acao.percentual !== null && (
                            <Progress value={acao.percentual} className="h-2" aria-label={`${acao.titulo}: ${acao.percentual}% executado`} />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Controles internos */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ClipboardCheck className="w-5 h-5 text-primary" aria-hidden="true" />
                    Avaliação de controles internos
                  </CardTitle>
                  <CardDescription>Avaliações registradas em {ano}, por efetividade</CardDescription>
                </CardHeader>
                <CardContent>
                  {data.avaliacoesControle.length === 0 ? (
                    <SemDados />
                  ) : (
                    <ul className="space-y-2 text-sm">
                      {data.avaliacoesControle.map((a) => (
                        <li key={a.efetividade} className="flex justify-between">
                          <span>{a.efetividade}</span>
                          <span className="tabular-nums">{a.quantidade}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>

              {/* Canal de denúncias (só para quem gerencia o canal) */}
              {data.denuncias !== null && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Megaphone className="w-5 h-5 text-primary" aria-hidden="true" />
                      Canal de denúncias
                    </CardTitle>
                    <CardDescription>Denúncias recebidas em {ano}, por situação</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {data.denuncias.length === 0 ? (
                      <SemDados />
                    ) : (
                      <ul className="space-y-2 text-sm">
                        {data.denuncias.map((d) => (
                          <li key={d.situacao} className="flex justify-between">
                            <span>{d.situacao}</span>
                            <span className="tabular-nums">{d.quantidade}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </>
        )}

        {/* Fundamentos legais (legislação federal geral; normas do órgão ficam no portal de governança) */}
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="text-h3">Fundamentação legal</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>• Lei nº 12.846/2013 (Anticorrupção)</li>
              <li>• Decreto nº 9.203/2017 (Governança)</li>
              <li>• Lei nº 13.303/2016 (Estatais)</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </ModuleLayout>
  );
}
