import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { 
  ArrowRight, Building2, Users, FileCheck,
  AlertTriangle, CheckCircle2, Clock, FileText, BookOpen,
  Briefcase, TrendingUp, DollarSign
} from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  IconeGovernanca, 
  IconeProcessos, 
  IconeManuais, 
  IconeIntegridade, 
  IconeTransparencia 
} from "@/components/icons";
import { useDadosOficiais } from "@/hooks/useDadosOficiais";
import { DadoOficialDisplay } from "@/components/institucional";

interface ResumoData {
  total_cargos: number;
  valor_total_mensal_formatado: string;
  ocupacao: {
    ocupados: number;
    vagos: number;
    percentual_ocupacao: number;
  };
  por_diretoria: Record<string, { quantidade: number }>;
}

const quickLinks = [
  {
    title: "Governança",
    description: "Normas, estrutura organizacional e matriz de responsabilidades",
    IconComponent: IconeGovernanca,
    href: "/governanca",
    colorClass: "bg-primary/10 border-primary/20",
  },
  {
    title: "Processos Administrativos",
    description: "Fluxos, formulários e controles de processos internos",
    IconComponent: IconeProcessos,
    href: "/processos",
    colorClass: "bg-secondary/10 border-secondary/20",
  },
  {
    title: "Manuais",
    description: "Orientações técnicas e procedimentos operacionais",
    IconComponent: IconeManuais,
    href: "/manuais",
    colorClass: "bg-accent/10 border-accent/20",
  },
  {
    title: "Integridade",
    description: "Ética, canal de denúncias e conflito de interesses",
    IconComponent: IconeIntegridade,
    href: "/integridade",
    colorClass: "bg-highlight/10 border-highlight/20",
  },
  {
    title: "Transparência",
    description: "Acesso público a informações institucionais",
    IconComponent: IconeTransparencia,
    href: "/transparencia",
    colorClass: "bg-success/10 border-success/20",
  },
];

const processos = [
  {
    title: "Compras e Contratos",
    icon: FileCheck,
    href: "/processos/compras",
    status: "ativo",
  },
  {
    title: "Diárias e Viagens",
    icon: Users,
    href: "/processos/diarias",
    status: "ativo",
  },
  {
    title: "Patrimônio",
    icon: Building2,
    href: "/processos/patrimonio",
    status: "ativo",
  },
];

const Index = () => {
  const [resumo, setResumo] = useState<ResumoData | null>(null);
  const { 
    nomeOficial, 
    nomeCurto, 
    vinculacao, 
    obterValor,
    leiCriacao 
  } = useDadosOficiais();

  useEffect(() => {
    fetch('/data/resumo.json')
      .then(res => res.json())
      .then(data => setResumo(data))
      .catch(err => console.error('Erro ao carregar resumo:', err));
  }, []);

  return (
    <AdminLayout title="Portal de Governança" description="Sistema integrado de gestão do IDJUV">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background com gradiente institucional */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/95 to-secondary/70" />
        
        {/* Padrão decorativo */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-accent rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary rounded-full blur-3xl" />
        </div>
        
        <div className="relative container mx-auto px-4 py-16 lg:py-24">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/15 backdrop-blur-sm text-white rounded-full text-sm font-medium mb-6 border border-white/20">
              <IconeGovernanca size={18} className="opacity-90" />
              Sistema de Governança Administrativa
            </div>
            <h1 className="font-serif text-4xl lg:text-5xl font-bold mb-6 leading-tight text-white drop-shadow-sm">
              Portal de Governança do IDJUV
            </h1>
            <p className="text-lg lg:text-xl text-white/90 mb-8 leading-relaxed">
              Sistema integrado de controle administrativo, padronização de processos e 
              conformidade com normas do TCE para o Instituto de Desporto, Juventude e 
              Lazer do Estado de Roraima.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button asChild size="lg" className="bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5">
                <Link to="/processos">
                  <FileText className="w-5 h-5 mr-2" />
                  Iniciar Processo
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="border-white/30 text-white hover:bg-white/10 bg-white/5 backdrop-blur-sm hover:-translate-y-0.5 transition-all">
                <Link to="/governanca">
                  <BookOpen className="w-5 h-5 mr-2" />
                  Ver Normativas
                </Link>
              </Button>
            </div>
          </div>
        </div>
        
        {/* Faixa decorativa inferior */}
        <div className="faixa-brasil" />
      </section>

      {/* Painel de Resumo - Cargos */}
      {resumo && (
        <section className="py-12 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="font-serif text-2xl font-bold mb-1">Quadro de Cargos</h2>
                <p className="text-sm text-muted-foreground">Dados atualizados conforme Lei nº 2.301/2025</p>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link to="/transparencia/cargos">
                  Ver detalhes
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <Card className="border-l-4 border-l-primary">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-3">
                    <Briefcase className="h-8 w-8 text-primary" />
                    <div>
                      <p className="text-2xl font-bold">{resumo.total_cargos}</p>
                      <p className="text-xs text-muted-foreground">Total de Cargos</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-success">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-3">
                    <Users className="h-8 w-8 text-success" />
                    <div>
                      <p className="text-2xl font-bold">{resumo.ocupacao.ocupados}</p>
                      <p className="text-xs text-muted-foreground">Ocupados</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-warning">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="h-8 w-8 text-warning" />
                    <div>
                      <p className="text-2xl font-bold">{resumo.ocupacao.vagos}</p>
                      <p className="text-xs text-muted-foreground">Vagos</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-secondary">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-3">
                    <Building2 className="h-8 w-8 text-secondary" />
                    <div>
                      <p className="text-2xl font-bold">{resumo.por_diretoria['Presidência']?.quantidade || 0}</p>
                      <p className="text-xs text-muted-foreground">Presidência</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-accent">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-3">
                    <Building2 className="h-8 w-8 text-accent" />
                    <div>
                      <p className="text-2xl font-bold">
                        {(resumo.por_diretoria['DIRAF']?.quantidade || 0) + 
                         (resumo.por_diretoria['DIESP']?.quantidade || 0) + 
                         (resumo.por_diretoria['DIJUV']?.quantidade || 0)}
                      </p>
                      <p className="text-xs text-muted-foreground">Diretorias</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-info">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-3">
                    <DollarSign className="h-8 w-8 text-info" />
                    <div>
                      <p className="text-lg font-bold">{resumo.valor_total_mensal_formatado}</p>
                      <p className="text-xs text-muted-foreground">Custo Mensal</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      )}

      {/* Cards de Acesso Rápido */}
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 animate-fade-in">
            <h2 className="font-serif text-3xl font-bold mb-4">Áreas do Sistema</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Acesse as principais áreas do sistema de governança administrativa do IDJUV
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {quickLinks.map((link, index) => (
              <Link key={link.href} to={link.href}>
                <Card 
                  className="h-full hover:shadow-lg transition-all duration-300 border-t-4 border-t-secondary group hover:-translate-y-1 animate-fade-in"
                  style={{ animationDelay: `${index * 100}ms`, animationFillMode: 'both' }}
                >
                  <CardHeader>
                    <div className={`w-16 h-16 ${link.colorClass} rounded-xl flex items-center justify-center mb-3 transition-transform duration-300 group-hover:scale-110 border`}>
                      <link.IconComponent size={36} />
                    </div>
                    <CardTitle className="text-lg group-hover:text-primary transition-colors">
                      {link.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>{link.description}</CardDescription>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Processos em Destaque */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8 animate-fade-in">
            <div>
              <h2 className="font-serif text-3xl font-bold mb-2">Processos Administrativos</h2>
              <p className="text-muted-foreground">
                Inicie e acompanhe processos com formulários digitais e rastreabilidade
              </p>
            </div>
            <Button asChild variant="outline" className="hover:scale-105 transition-transform">
              <Link to="/processos">
                Ver todos
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {processos.map((processo, index) => (
              <Link key={processo.href} to={processo.href}>
                <Card 
                  className="card-processo group hover:-translate-y-1 transition-all duration-300 animate-fade-in"
                  style={{ animationDelay: `${index * 150}ms`, animationFillMode: 'both' }}
                >
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <processo.icon className="w-8 h-8 text-primary transition-transform duration-300 group-hover:scale-110" />
                    <span className="text-xs font-medium text-success flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Ativo
                    </span>
                  </CardHeader>
                  <CardContent>
                    <CardTitle className="text-lg mb-2 group-hover:text-primary transition-colors">
                      {processo.title}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Clique para ver fluxo, checklist e iniciar processo
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Alertas e Conformidade */}
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Canal de Denúncias */}
            <Card className="border-l-4 border-l-warning animate-fade-in hover:shadow-lg transition-all duration-300" style={{ animationDelay: '100ms', animationFillMode: 'both' }}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-8 h-8 text-warning" />
                  <div>
                    <CardTitle>Canal de Denúncias</CardTitle>
                    <CardDescription>Comunicação segura e confidencial</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Relate irregularidades, condutas antiéticas ou situações que comprometam 
                  a integridade institucional. Opção de denúncia anônima disponível.
                </p>
                <Button asChild className="btn-gov hover:scale-105 transition-transform">
                  <Link to="/integridade/denuncias">
                    Acessar Canal
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Controle Interno */}
            <Card className="border-l-4 border-l-info animate-fade-in hover:shadow-lg transition-all duration-300" style={{ animationDelay: '200ms', animationFillMode: 'both' }}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Clock className="w-8 h-8 text-info" />
                  <div>
                    <CardTitle>Controle Interno</CardTitle>
                    <CardDescription>Conformidade e orientação</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Orientações sobre conformidade com normas do TCE-RR, pareceres técnicos 
                  e acompanhamento de processos administrativos.
                </p>
                <Button asChild variant="outline" className="hover:scale-105 transition-transform">
                  <Link to="/governanca/matriz-raci">
                    Ver Matriz RACI
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Informações Institucionais */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="bg-card border rounded-xl p-8 lg:p-12 animate-fade-in" style={{ animationDelay: '100ms', animationFillMode: 'both' }}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <h2 className="font-serif text-2xl font-bold mb-4">
                  Sobre o {nomeCurto}
                </h2>
                <p className="text-muted-foreground mb-4 leading-relaxed">
                  O {nomeOficial} é uma entidade autárquica com personalidade 
                  jurídica de Direito Público, dotada de autonomia administrativa e financeira, 
                  vinculada à {vinculacao}.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Tem por finalidade promover, coordenar e executar políticas públicas de desporto, 
                  lazer e juventude no Estado, visando ao desenvolvimento social, educacional 
                  e tecnológico do público-alvo.
                </p>
              </div>
              <div className="space-y-4">
                <DadoOficialDisplay
                  label="Vinculação"
                  valor={vinculacao}
                  leiReferencia={leiCriacao}
                  variant="card"
                />
                <DadoOficialDisplay
                  label="Natureza Jurídica"
                  valor={obterValor('natureza_juridica')}
                  leiReferencia={leiCriacao}
                  variant="card"
                />
                <div className="bg-muted rounded-lg p-4">
                  <h3 className="font-semibold mb-2 text-sm">Jurisdição</h3>
                  <p className="text-sm text-muted-foreground">
                    Todo o Estado de Roraima
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </AdminLayout>
  );
};

export default Index;
