import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart3, 
  DollarSign,
  Calendar,
  FileSpreadsheet
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { EmptyState } from "@/components/design-system";

interface ResumoAno {
  ano: number;
  valor_inicial: number;
  valor_atualizado: number;
  valor_empenhado: number;
  valor_liquidado: number;
  valor_pago: number;
  dotacoes: number;
}

export default function ExecucaoOrcamentariaPage() {
  const { data: dotacoes, isLoading } = useQuery({
    queryKey: ['transparencia-execucao'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dotacoes_orcamentarias')
        .select(`
          id,
          exercicio,
          programa,
          acao,
          elemento_despesa,
          fonte_recurso,
          valor_inicial,
          valor_atualizado,
          valor_empenhado,
          valor_liquidado,
          valor_pago,
          unidades_orcamentarias(nome)
        `)
        .order('exercicio', { ascending: false });
      
      if (error) throw error;
      return data || [];
    }
  });

  // Agregar por exercício (dados agregados, sem identificação pessoal)
  // Os tipos gerados acusam a coluna `acao` no select (ver relatório); a linha é
  // tipada à mão como antes, quando era `any`.
  type LinhaDotacao = { exercicio: number } & Partial<Record<"valor_inicial" | "valor_atualizado" | "valor_empenhado" | "valor_liquidado" | "valor_pago", number | null>>;
  const resumoPorAno = ((dotacoes || []) as unknown as LinhaDotacao[]).reduce((acc: Record<number, ResumoAno>, d) => {
    const ano = d.exercicio;
    if (!acc[ano]) {
      acc[ano] = {
        ano,
        valor_inicial: 0,
        valor_atualizado: 0,
        valor_empenhado: 0,
        valor_liquidado: 0,
        valor_pago: 0,
        dotacoes: 0
      };
    }
    acc[ano].valor_inicial += d.valor_inicial || 0;
    acc[ano].valor_atualizado += d.valor_atualizado || 0;
    acc[ano].valor_empenhado += d.valor_empenhado || 0;
    acc[ano].valor_liquidado += d.valor_liquidado || 0;
    acc[ano].valor_pago += d.valor_pago || 0;
    acc[ano].dotacoes += 1;
    return acc;
  }, {});

  const anos = Object.values(resumoPorAno).sort((a, b) => b.ano - a.ano);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const calcPercentual = (empenhado: number, atualizado: number) => {
    if (!atualizado || atualizado === 0) return 0;
    return Math.round((empenhado / atualizado) * 100);
  };

  return (
    <MainLayout>
      {/* Cabeçalho */}
      <section className="bg-warning text-warning-foreground py-12">
        <div className="container mx-auto px-4">
          <nav aria-label="Trilha de navegação" className="flex items-center gap-3 text-sm mb-4 opacity-90">
            <Link to="/" className="inline-flex min-h-11 items-center hover:underline">Início</Link>
            <span aria-hidden="true">/</span>
            <Link to="/transparencia" className="inline-flex min-h-11 items-center hover:underline">Transparência</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">Execução orçamentária</span>
          </nav>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-accent rounded-xl flex items-center justify-center" aria-hidden="true">
              <BarChart3 className="w-8 h-8 text-accent-foreground" />
            </div>
            <div>
              <h1 className="font-serif text-3xl lg:text-4xl font-bold">
                Execução Orçamentária
              </h1>
              <p className="text-base opacity-90 mt-1">
                Acompanhamento de receitas e despesas
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Conteúdo */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            {isLoading ? (
              <div className="text-center py-12 text-base text-muted-foreground" role="status">
                Carregando dados orçamentários…
              </div>
            ) : anos.length === 0 ? (
              <EmptyState
                icone={FileSpreadsheet}
                titulo="Dados em construção"
                descricao="Os dados de execução orçamentária estão sendo migrados e estarão disponíveis em breve."
              />
            ) : (
              <div className="space-y-8">
                {anos.map((resumo) => (
                  <Card key={resumo.ano} className="overflow-hidden">
                    <CardHeader className="bg-muted/30">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Calendar className="w-5 h-5 text-primary" aria-hidden="true" />
                          <h2 className="text-h3 leading-tight tracking-tight">Exercício {resumo.ano}</h2>
                        </div>
                        <Badge variant="outline">{resumo.dotacoes} dotações</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <div className="p-4 bg-muted/50 rounded-lg">
                          <p className="text-sm text-muted-foreground mb-1">Inicial</p>
                          <p className="font-semibold text-lg">{formatCurrency(resumo.valor_inicial)}</p>
                        </div>
                        <div className="p-4 bg-muted/50 rounded-lg">
                          <p className="text-sm text-muted-foreground mb-1">Atualizado</p>
                          <p className="font-semibold text-lg">{formatCurrency(resumo.valor_atualizado)}</p>
                        </div>
                        <div className="p-4 bg-muted/50 rounded-lg">
                          <p className="text-sm text-muted-foreground mb-1">Empenhado</p>
                          <p className="font-semibold text-lg">{formatCurrency(resumo.valor_empenhado)}</p>
                          <p className="text-sm text-muted-foreground">
                            {calcPercentual(resumo.valor_empenhado, resumo.valor_atualizado)}% executado
                          </p>
                        </div>
                        <div className="p-4 bg-muted/50 rounded-lg">
                          <p className="text-sm text-muted-foreground mb-1">Liquidado</p>
                          <p className="font-semibold text-lg">{formatCurrency(resumo.valor_liquidado)}</p>
                        </div>
                        <div className="p-4 bg-muted/50 rounded-lg">
                          <p className="text-sm text-muted-foreground mb-1">Pago</p>
                          <p className="font-semibold text-lg">{formatCurrency(resumo.valor_pago)}</p>
                        </div>
                      </div>

                      {/* Barra de progresso */}
                      <div className="mt-6">
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-muted-foreground" id={`execucao-${resumo.ano}`}>Execução orçamentária</span>
                          <span className="font-medium">
                            {calcPercentual(resumo.valor_empenhado, resumo.valor_atualizado)}%
                          </span>
                        </div>
                        <div
                          className="h-3 bg-muted rounded-full overflow-hidden"
                          role="progressbar"
                          aria-labelledby={`execucao-${resumo.ano}`}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-valuenow={calcPercentual(resumo.valor_empenhado, resumo.valor_atualizado)}
                        >
                          <div 
                            className="h-full bg-primary transition-all"
                            style={{ width: `${calcPercentual(resumo.valor_empenhado, resumo.valor_atualizado)}%` }}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Nota explicativa */}
            <div className="mt-8 bg-muted/50 rounded-xl p-6">
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-warning" aria-hidden="true" />
                Sobre os dados
              </h2>
              <p className="text-base text-muted-foreground">
                Os valores apresentados são dados agregados por exercício, conforme 
                Lei de Responsabilidade Fiscal. Não contêm dados pessoais identificáveis.
              </p>
            </div>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}
