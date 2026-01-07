import { Link } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BadgeInstitucional } from "@/components/ui/BadgeInstitucional";
import { 
  GraduationCap, 
  Target, 
  CheckCircle2, 
  ArrowLeft,
  Trophy,
  Users,
  Medal,
  Calendar,
  MapPin
} from "lucide-react";

export default function JogosEscolaresPage() {
  const modalidades = [
    { nome: "Futebol", categorias: "Sub-12, Sub-14, Sub-17" },
    { nome: "Futsal", categorias: "Sub-12, Sub-14, Sub-17" },
    { nome: "Voleibol", categorias: "Sub-14, Sub-17" },
    { nome: "Basquete", categorias: "Sub-14, Sub-17" },
    { nome: "Handebol", categorias: "Sub-14, Sub-17" },
    { nome: "Atletismo", categorias: "Sub-14, Sub-17" },
    { nome: "Natação", categorias: "Sub-12, Sub-14, Sub-17" },
    { nome: "Xadrez", categorias: "Livre" },
  ];

  const etapas = [
    { fase: "Fase Municipal", periodo: "Março a Abril", descricao: "Competições dentro de cada município" },
    { fase: "Fase Regional", periodo: "Maio a Junho", descricao: "Confrontos entre municípios da mesma região" },
    { fase: "Fase Estadual", periodo: "Julho a Agosto", descricao: "Finais com os melhores de cada região" },
    { fase: "Fase Nacional", periodo: "Setembro a Novembro", descricao: "Representação estadual nos JEBs" },
  ];

  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary via-primary/95 to-accent/70 text-primary-foreground overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-30"></div>
        
        <div className="container mx-auto px-4 py-16 md:py-24 relative z-10">
          <Link to="/" className="inline-flex items-center gap-2 text-primary-foreground/80 hover:text-primary-foreground mb-6 transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Voltar para o início
          </Link>
          
          <div className="flex items-center gap-4 mb-6">
            <div className="p-4 bg-primary-foreground/10 rounded-2xl backdrop-blur-sm">
              <GraduationCap className="h-12 w-12" />
            </div>
            <div>
              <BadgeInstitucional variant="highlight" className="mb-2">
                Programa
              </BadgeInstitucional>
              <h1 className="text-4xl md:text-5xl font-bold">Jogos Escolares de Roraima</h1>
            </div>
          </div>
          
          <p className="text-xl opacity-90 max-w-3xl">
            A maior competição esportiva estudantil do estado, revelando talentos e 
            promovendo a integração entre escolas de toda Roraima.
          </p>
        </div>
      </section>

      {/* Sobre */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <BadgeInstitucional variant="primary" className="mb-4">
              Sobre o Evento
            </BadgeInstitucional>
            <h2 className="text-3xl font-bold text-foreground mb-6">O que são os Jogos Escolares?</h2>
            <p className="text-lg text-muted-foreground leading-relaxed mb-6">
              Os Jogos Escolares de Roraima (JER) são a maior competição esportiva estudantil 
              do estado, reunindo milhares de alunos das redes pública e privada de ensino. 
              O evento é organizado pelo IDJUV em parceria com a Secretaria de Educação e 
              acontece anualmente em quatro fases.
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Os campeões estaduais conquistam o direito de representar Roraima nos 
              Jogos Escolares Brasileiros (JEBs), a maior competição estudantil do país.
            </p>
          </div>
        </div>
      </section>

      {/* Etapas */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <BadgeInstitucional variant="secondary" className="mb-4">
              Calendário
            </BadgeInstitucional>
            <h2 className="text-3xl font-bold text-foreground">Etapas da Competição</h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {etapas.map((etapa, index) => (
              <Card 
                key={etapa.fase}
                className="hover:shadow-lg transition-all duration-300 animate-fade-in relative overflow-hidden"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-accent"></div>
                <CardContent className="p-6">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <span className="font-bold text-primary">{index + 1}</span>
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-1">{etapa.fase}</h3>
                  <p className="text-sm text-primary font-medium mb-2">{etapa.periodo}</p>
                  <p className="text-sm text-muted-foreground">{etapa.descricao}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Modalidades */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <BadgeInstitucional variant="accent" className="mb-4">
              Esportes
            </BadgeInstitucional>
            <h2 className="text-3xl font-bold text-foreground">Modalidades Disputadas</h2>
          </div>

          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto">
            {modalidades.map((mod, index) => (
              <Card 
                key={mod.nome}
                className="hover:shadow-lg transition-all duration-300 animate-fade-in"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <Trophy className="h-5 w-5 text-primary" />
                    <h3 className="font-bold text-foreground">{mod.nome}</h3>
                  </div>
                  <p className="text-xs text-muted-foreground">{mod.categorias}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Como Participar */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <BadgeInstitucional variant="primary" className="mb-4">
                Participação
              </BadgeInstitucional>
              <h2 className="text-3xl font-bold text-foreground">Como Participar?</h2>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {[
                { icon: Users, titulo: "Inscrição pela Escola", texto: "A escola deve estar regularmente matriculada e inscrever seus alunos através do portal" },
                { icon: Calendar, titulo: "Período de Inscrição", texto: "As inscrições acontecem entre janeiro e fevereiro de cada ano" },
                { icon: MapPin, titulo: "Locais de Competição", texto: "As competições acontecem em ginásios e campos em todo o estado" },
              ].map((item, index) => (
                <Card 
                  key={index}
                  className="text-center animate-fade-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <CardContent className="p-6">
                    <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                      <item.icon className="h-7 w-7 text-primary" />
                    </div>
                    <h3 className="font-bold text-foreground mb-2">{item.titulo}</h3>
                    <p className="text-sm text-muted-foreground">{item.texto}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-br from-primary to-accent text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <Medal className="h-16 w-16 mx-auto mb-6 opacity-80" />
          <h2 className="text-3xl font-bold mb-4">Sua Escola Está Pronta?</h2>
          <p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto">
            Inscreva sua escola nos Jogos Escolares de Roraima e revele os campeões do futuro!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" className="text-lg" asChild>
              <Link to="/sistema">
                <Target className="mr-2 h-5 w-5" />
                Acessar Regulamento
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="text-lg bg-transparent border-primary-foreground/30 hover:bg-primary-foreground/10" asChild>
              <Link to="/">
                <ArrowLeft className="mr-2 h-5 w-5" />
                Voltar ao Início
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}
