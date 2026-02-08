/**
 * RELATÓRIOS - SELEÇÕES ESTUDANTIS
 * Dashboard com estatísticas de participação
 */

import { ModuleLayout } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  BarChart3, 
  Users, 
  TrendingUp,
  Download,
  FileSpreadsheet,
  FileText,
  Printer,
  School,
  MapPin
} from "lucide-react";

// Dados mock para relatórios
const estatisticas = {
  totalInscritos: 156,
  porModalidade: [
    { modalidade: "Voleibol", total: 48, feminino: 26, masculino: 22 },
    { modalidade: "Futsal", total: 42, feminino: 18, masculino: 24 },
    { modalidade: "Basquetebol", total: 36, feminino: 16, masculino: 20 },
    { modalidade: "Handebol", total: 30, feminino: 14, masculino: 16 }
  ],
  porStatus: {
    aprovados: 98,
    pendentes: 45,
    rejeitados: 13
  },
  porEscola: [
    { escola: "E.E. Prof. Antônio Ferreira", total: 32 },
    { escola: "E.E. Hélio Campos", total: 28 },
    { escola: "Colégio Estadual de Boa Vista", total: 24 },
    { escola: "E.E. Maria das Dores", total: 20 },
    { escola: "Outras escolas", total: 52 }
  ],
  porIdade: [
    { idade: 15, total: 58 },
    { idade: 16, total: 62 },
    { idade: 17, total: 36 }
  ],
  crescimento: {
    semanaAnterior: 120,
    semanaAtual: 156,
    percentual: 30
  }
};

const getMaxModalidade = () => Math.max(...estatisticas.porModalidade.map(m => m.total));
const getMaxEscola = () => Math.max(...estatisticas.porEscola.map(e => e.total));

export default function RelatoriosSelecaoPage() {
  return (
    <ModuleLayout module="programas">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-primary" />
              Relatórios
            </h1>
            <p className="text-muted-foreground">Seleções Estudantis - Jogos da Juventude 2026</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2">
              <FileSpreadsheet className="h-4 w-4" />
              Excel
            </Button>
            <Button variant="outline" className="gap-2">
              <FileText className="h-4 w-4" />
              PDF
            </Button>
            <Button variant="outline" className="gap-2">
              <Printer className="h-4 w-4" />
              Imprimir
            </Button>
          </div>
        </div>

        {/* Cards de Resumo */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total de Inscritos
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{estatisticas.totalInscritos}</div>
              <div className="flex items-center gap-1 text-sm text-green-600 mt-1">
                <TrendingUp className="h-3 w-3" />
                +{estatisticas.crescimento.percentual}% vs semana anterior
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Aprovados
              </CardTitle>
              <Badge className="bg-green-500/10 text-green-600 border-green-200">
                {Math.round((estatisticas.porStatus.aprovados / estatisticas.totalInscritos) * 100)}%
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{estatisticas.porStatus.aprovados}</div>
              <Progress 
                value={(estatisticas.porStatus.aprovados / estatisticas.totalInscritos) * 100} 
                className="mt-2 h-2"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pendentes
              </CardTitle>
              <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-200">
                {Math.round((estatisticas.porStatus.pendentes / estatisticas.totalInscritos) * 100)}%
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-600">{estatisticas.porStatus.pendentes}</div>
              <p className="text-xs text-muted-foreground mt-1">Aguardando análise</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Escolas Participantes
              </CardTitle>
              <School className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{estatisticas.porEscola.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Diferentes instituições</p>
            </CardContent>
          </Card>
        </div>

        {/* Gráficos */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Por Modalidade */}
          <Card>
            <CardHeader>
              <CardTitle>Inscritos por Modalidade</CardTitle>
              <CardDescription>Distribuição por modalidade esportiva</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {estatisticas.porModalidade.map((mod) => (
                <div key={mod.modalidade} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{mod.modalidade}</span>
                    <span className="text-sm text-muted-foreground">{mod.total} atletas</span>
                  </div>
                  <div className="flex gap-1 h-6">
                    <div 
                      className="bg-pink-500 rounded-l"
                      style={{ width: `${(mod.feminino / getMaxModalidade()) * 100}%` }}
                      title={`Feminino: ${mod.feminino}`}
                    />
                    <div 
                      className="bg-blue-500 rounded-r"
                      style={{ width: `${(mod.masculino / getMaxModalidade()) * 100}%` }}
                      title={`Masculino: ${mod.masculino}`}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-pink-500 rounded" />
                      Feminino: {mod.feminino}
                    </span>
                    <span className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-blue-500 rounded" />
                      Masculino: {mod.masculino}
                    </span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Por Escola */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Top Escolas
              </CardTitle>
              <CardDescription>Escolas com mais inscritos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {estatisticas.porEscola.map((escola, idx) => (
                <div key={escola.escola} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{escola.escola}</span>
                    <Badge variant="outline">{escola.total}</Badge>
                  </div>
                  <Progress 
                    value={(escola.total / getMaxEscola()) * 100}
                    className="h-2"
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Por Idade */}
          <Card>
            <CardHeader>
              <CardTitle>Distribuição por Idade</CardTitle>
              <CardDescription>Faixa etária dos atletas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-center gap-8 h-40">
                {estatisticas.porIdade.map((idade) => (
                  <div key={idade.idade} className="flex flex-col items-center gap-2">
                    <div 
                      className="w-16 bg-primary/80 rounded-t transition-all hover:bg-primary"
                      style={{ 
                        height: `${(idade.total / Math.max(...estatisticas.porIdade.map(i => i.total))) * 120}px` 
                      }}
                    />
                    <div className="text-center">
                      <p className="font-bold text-lg">{idade.total}</p>
                      <p className="text-sm text-muted-foreground">{idade.idade} anos</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Cronograma de Seletivas */}
          <Card>
            <CardHeader>
              <CardTitle>Próximas Seletivas</CardTitle>
              <CardDescription>Calendário das avaliações</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { data: "28/02", modalidade: "Voleibol Feminino", local: "Ginásio Hélio Campos" },
                { data: "01/03", modalidade: "Voleibol Masculino", local: "Ginásio Hélio Campos" },
                { data: "07/03", modalidade: "Futsal Masculino", local: "E.E. Prof. Antônio Ferreira" },
                { data: "08/03", modalidade: "Futsal Feminino", local: "Ginásio Hélio Campos" },
              ].map((seletiva, idx) => (
                <div 
                  key={idx} 
                  className="flex items-center gap-4 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="text-center min-w-[60px]">
                    <p className="text-lg font-bold">{seletiva.data.split('/')[0]}</p>
                    <p className="text-xs text-muted-foreground">
                      {seletiva.data.split('/')[1] === '02' ? 'FEV' : 'MAR'}
                    </p>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{seletiva.modalidade}</p>
                    <p className="text-sm text-muted-foreground">{seletiva.local}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </ModuleLayout>
  );
}
