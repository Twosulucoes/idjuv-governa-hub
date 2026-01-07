import { Link } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BadgeInstitucional } from "@/components/ui/BadgeInstitucional";
import { 
  Users, 
  Target, 
  Eye, 
  Heart, 
  MapPin, 
  Phone, 
  Mail, 
  Clock,
  Trophy,
  Dumbbell,
  Tent,
  Building2,
  ArrowRight,
  CheckCircle2,
  Calendar,
  Newspaper,
  CalendarDays
} from "lucide-react";
import { LogoIdjuv, logoIdjuvOficial } from "@/components/ui/LogoIdjuv";
import logoGoverno from "@/assets/logo-governo-roraima.jpg";

export default function ApresentacaoPage() {
  const valores = [
    { icon: Heart, titulo: "Compromisso", descricao: "Dedicação integral ao desenvolvimento da juventude roraimense" },
    { icon: Users, titulo: "Inclusão", descricao: "Políticas públicas acessíveis a todos os jovens do estado" },
    { icon: Trophy, titulo: "Excelência", descricao: "Busca constante pela qualidade em todas as ações" },
    { icon: CheckCircle2, titulo: "Transparência", descricao: "Gestão pública ética e prestação de contas à sociedade" },
  ];

  const areasAtuacao = [
    { 
      icon: Dumbbell, 
      titulo: "Desporto", 
      descricao: "Fomento ao esporte em todas as modalidades, apoio a atletas e eventos esportivos estaduais e nacionais.",
      cor: "bg-primary"
    },
    { 
      icon: Users, 
      titulo: "Juventude", 
      descricao: "Políticas públicas voltadas aos jovens roraimenses, capacitação profissional e protagonismo juvenil.",
      cor: "bg-secondary"
    },
    { 
      icon: Tent, 
      titulo: "Lazer", 
      descricao: "Promoção de atividades recreativas e de lazer para a população, eventos sociais e comunitários.",
      cor: "bg-accent"
    },
  ];

  const programas = [
    { nome: "Bolsa Atleta Estadual", link: "/programas/bolsa-atleta" },
    { nome: "Juventude Cidadã", link: "/programas/juventude-cidada" },
    { nome: "Esporte na Comunidade", link: "/programas/esporte-comunidade" },
    { nome: "Capacitação Jovem Empreendedor", link: "/programas/jovem-empreendedor" },
    { nome: "Jogos Escolares de Roraima", link: "/programas/jogos-escolares" },
  ];

  const noticias = [
    {
      id: 1,
      titulo: "IDJUV abre inscrições para o Bolsa Atleta 2025",
      resumo: "Atletas de alto rendimento podem se inscrever até o dia 15 de janeiro para o programa de incentivo ao esporte.",
      data: "20 Dez 2024",
      categoria: "Esporte",
      destaque: true
    },
    {
      id: 2,
      titulo: "Jogos Escolares de Roraima batem recorde de participação",
      resumo: "Mais de 5 mil estudantes participaram da edição 2024, representando escolas de todos os municípios do estado.",
      data: "18 Dez 2024",
      categoria: "Educação",
      destaque: false
    },
    {
      id: 3,
      titulo: "Programa de Lazer nos Bairros amplia atividades recreativas",
      resumo: "Iniciativa levou atividades esportivas e recreativas para mais de 20 bairros de Boa Vista.",
      data: "15 Dez 2024",
      categoria: "Lazer",
      destaque: false
    },
  ];

  const eventos = [
    {
      id: 1,
      titulo: "Abertura das Inscrições - Bolsa Atleta 2025",
      data: "02 Jan 2025",
      local: "Online",
      tipo: "Inscrição"
    },
    {
      id: 2,
      titulo: "Workshop de Empreendedorismo Jovem",
      data: "15 Jan 2025",
      local: "Centro de Convenções",
      tipo: "Capacitação"
    },
    {
      id: 3,
      titulo: "Campeonato Estadual de Futsal",
      data: "20 Jan 2025",
      local: "Ginásio Hélio Campos",
      tipo: "Esporte"
    },
    {
      id: 4,
      titulo: "Reunião do Conselho da Juventude",
      data: "25 Jan 2025",
      local: "Sede do IDJUV",
      tipo: "Institucional"
    },
  ];

  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary via-primary/95 to-secondary/70 text-primary-foreground overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-30"></div>
        
        <div className="container mx-auto px-4 py-20 md:py-32 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="flex-1 text-center lg:text-left animate-fade-in">
              <BadgeInstitucional variant="highlight" className="mb-6">
                Governo do Estado de Roraima
              </BadgeInstitucional>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                Instituto de Desporto, Juventude e Lazer
              </h1>
              
              <p className="text-xl md:text-2xl opacity-90 mb-8 max-w-2xl">
                Promovendo o desenvolvimento integral da juventude roraimense através do esporte, juventude e lazer.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button size="lg" variant="secondary" className="text-lg px-8" asChild>
                  <Link to="/sistema">
                    <Building2 className="mr-2 h-5 w-5" />
                    Área Administrativa
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="text-lg px-8 bg-transparent border-primary-foreground/30 hover:bg-primary-foreground/10" asChild>
                  <a href="#contato">
                    <Phone className="mr-2 h-5 w-5" />
                    Fale Conosco
                  </a>
                </Button>
              </div>
            </div>
            
            <div className="flex-shrink-0 animate-fade-in" style={{ animationDelay: "0.2s" }}>
              <div className="bg-white/95 rounded-2xl p-6 shadow-2xl">
                <img 
                  src={logoIdjuvOficial} 
                  alt="IDJUV - Instituto de Desporto, Juventude e Lazer" 
                  className="h-48 md:h-64 w-auto object-contain"
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Wave decoration */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="hsl(var(--background))"/>
          </svg>
        </div>
      </section>

      {/* Sobre o IDJUV */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <BadgeInstitucional variant="primary" className="mb-4">
              Sobre Nós
            </BadgeInstitucional>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
              Quem Somos
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              O IDJUV – Instituto de Desporto, Juventude e Lazer é uma autarquia pública estadual 
              vinculada ao Governo do Estado de Roraima, criada com a missão de desenvolver e 
              executar políticas públicas voltadas ao esporte, à juventude e ao lazer no estado.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <Card className="border-l-4 border-l-primary animate-fade-in hover:shadow-lg transition-all duration-300">
              <CardContent className="p-8">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 rounded-full bg-primary/10">
                    <Target className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground">Missão</h3>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Promover o desenvolvimento integral da juventude roraimense por meio de políticas 
                  públicas de esporte, juventude e lazer, contribuindo para a formação de cidadãos 
                  saudáveis, participativos e comprometidos com o progresso do estado.
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-secondary animate-fade-in hover:shadow-lg transition-all duration-300" style={{ animationDelay: "0.1s" }}>
              <CardContent className="p-8">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 rounded-full bg-secondary/10">
                    <Eye className="h-8 w-8 text-secondary" />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground">Visão</h3>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Ser referência nacional em políticas públicas de juventude, esporte e lazer, 
                  reconhecido pela excelência na gestão, inovação e pelo impacto positivo na 
                  qualidade de vida da população roraimense.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Valores */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <BadgeInstitucional variant="secondary" className="mb-4">
              Nossos Princípios
            </BadgeInstitucional>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              Valores Institucionais
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {valores.map((valor, index) => (
              <Card 
                key={valor.titulo} 
                className="text-center hover:shadow-lg transition-all duration-300 hover:-translate-y-1 animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardContent className="p-6">
                  <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center mb-4">
                    <valor.icon className="h-8 w-8 text-primary-foreground" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-2">{valor.titulo}</h3>
                  <p className="text-muted-foreground text-sm">{valor.descricao}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Áreas de Atuação */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <BadgeInstitucional variant="accent" className="mb-4">
              O Que Fazemos
            </BadgeInstitucional>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              Áreas de Atuação
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {areasAtuacao.map((area, index) => (
              <Card 
                key={area.titulo}
                className="overflow-hidden hover:shadow-xl transition-all duration-300 animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className={`${area.cor} p-4`}>
                  <area.icon className="h-10 w-10 text-primary-foreground" />
                </div>
                <CardContent className="p-6">
                  <h3 className="text-2xl font-bold text-foreground mb-3">{area.titulo}</h3>
                  <p className="text-muted-foreground leading-relaxed">{area.descricao}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Programas e Projetos */}
      <section className="py-20 bg-gradient-to-br from-primary to-secondary text-primary-foreground">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <BadgeInstitucional variant="highlight" className="mb-4">
              Iniciativas
            </BadgeInstitucional>
            <h2 className="text-3xl md:text-4xl font-bold">
              Programas e Projetos
            </h2>
            <p className="text-lg opacity-90 mt-4 max-w-2xl mx-auto">
              Conheça algumas das principais iniciativas do IDJUV para o desenvolvimento 
              da juventude e do esporte em Roraima.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {programas.map((programa, index) => (
              <Link 
                key={programa.nome}
                to={programa.link}
                className="bg-primary-foreground/10 backdrop-blur-sm rounded-lg p-6 flex items-center gap-4 hover:bg-primary-foreground/20 transition-all duration-300 animate-fade-in group"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CheckCircle2 className="h-6 w-6 flex-shrink-0" />
                <span className="font-medium">{programa.nome}</span>
                <ArrowRight className="h-5 w-5 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Notícias e Eventos */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <BadgeInstitucional variant="primary" className="mb-4">
              Fique por Dentro
            </BadgeInstitucional>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              Notícias e Eventos
            </h2>
          </div>

          <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Coluna de Notícias */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <Newspaper className="h-5 w-5 text-primary" />
                <h3 className="text-xl font-bold text-foreground">Últimas Notícias</h3>
              </div>
              
              {noticias.map((noticia, index) => (
                <Card 
                  key={noticia.id}
                  className={`hover:shadow-lg transition-all duration-300 animate-fade-in overflow-hidden ${
                    noticia.destaque ? 'border-l-4 border-l-primary' : ''
                  }`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-xs font-medium px-2 py-1 rounded-full bg-primary/10 text-primary">
                        {noticia.categoria}
                      </span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {noticia.data}
                      </span>
                    </div>
                    <h4 className="text-lg font-bold text-foreground mb-2 hover:text-primary transition-colors cursor-pointer">
                      {noticia.titulo}
                    </h4>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {noticia.resumo}
                    </p>
                  </CardContent>
                </Card>
              ))}
              
              <Button variant="outline" className="w-full mt-4" asChild>
                <Link to="/noticias">
                  Ver Todas as Notícias
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </div>

            {/* Coluna de Eventos */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <CalendarDays className="h-5 w-5 text-secondary" />
                <h3 className="text-xl font-bold text-foreground">Próximos Eventos</h3>
              </div>

              <Card className="bg-gradient-to-br from-secondary/5 to-primary/5">
                <CardContent className="p-4 space-y-4">
                  {eventos.map((evento, index) => (
                    <div 
                      key={evento.id}
                      className={`flex gap-4 p-3 rounded-lg bg-background hover:shadow-md transition-all duration-300 animate-fade-in cursor-pointer ${
                        index < eventos.length - 1 ? 'border-b border-border' : ''
                      }`}
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <div className="flex-shrink-0 w-14 h-14 rounded-lg bg-primary/10 flex flex-col items-center justify-center">
                        <span className="text-xs text-primary font-medium">
                          {evento.data.split(' ')[1]}
                        </span>
                        <span className="text-lg font-bold text-primary">
                          {evento.data.split(' ')[0]}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h5 className="font-semibold text-foreground text-sm leading-tight mb-1 truncate">
                          {evento.titulo}
                        </h5>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {evento.local}
                        </p>
                        <span className="inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded bg-secondary/10 text-secondary">
                          {evento.tipo}
                        </span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Button variant="outline" className="w-full" asChild>
                <Link to="/sistema">
                  Ver Calendário Completo
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Contato */}
      <section id="contato" className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <BadgeInstitucional variant="primary" className="mb-4">
              Contato
            </BadgeInstitucional>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              Fale Conosco
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <Card className="hover:shadow-lg transition-all duration-300">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold text-foreground mb-6">Informações de Contato</h3>
                
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-full bg-primary/10">
                      <MapPin className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">Endereço</h4>
                      <p className="text-muted-foreground">
                        Av. Ville Roy, 4935 - São Pedro<br />
                        Boa Vista - RR, 69306-665
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-full bg-primary/10">
                      <Phone className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">Telefone</h4>
                      <p className="text-muted-foreground">(95) 3621-0000</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-full bg-primary/10">
                      <Mail className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">E-mail</h4>
                      <p className="text-muted-foreground">contato@idjuv.rr.gov.br</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-full bg-primary/10">
                      <Clock className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">Horário de Funcionamento</h4>
                      <p className="text-muted-foreground">
                        Segunda a Sexta: 8h às 14h
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all duration-300">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold text-foreground mb-6">Acesso Rápido</h3>
                
                <div className="space-y-4">
                  <Link 
                    to="/sistema"
                    className="flex items-center justify-between p-4 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-all duration-300 group"
                  >
                    <div className="flex items-center gap-3">
                      <Building2 className="h-5 w-5 text-primary" />
                      <span className="font-medium text-foreground">Sistema de Governança</span>
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </Link>

                  <Link 
                    to="/transparencia"
                    className="flex items-center justify-between p-4 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-all duration-300 group"
                  >
                    <div className="flex items-center gap-3">
                      <Eye className="h-5 w-5 text-primary" />
                      <span className="font-medium text-foreground">Portal da Transparência</span>
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </Link>

                  <Link 
                    to="/integridade/denuncias"
                    className="flex items-center justify-between p-4 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-all duration-300 group"
                  >
                    <div className="flex items-center gap-3">
                      <Heart className="h-5 w-5 text-primary" />
                      <span className="font-medium text-foreground">Canal de Denúncias</span>
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </Link>
                </div>

                <div className="mt-8 pt-6 border-t border-border">
                  <div className="flex items-center justify-center gap-6">
                    <LogoIdjuv 
                      className="h-16 w-auto"
                    />
                    <img 
                      src={logoGoverno} 
                      alt="Governo de Roraima" 
                      className="h-16 w-auto rounded object-contain"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}
