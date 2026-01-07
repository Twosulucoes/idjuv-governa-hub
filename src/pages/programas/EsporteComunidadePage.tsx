import { Link } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BadgeInstitucional } from "@/components/ui/BadgeInstitucional";
import { 
  Dumbbell, 
  Target, 
  CheckCircle2, 
  ArrowLeft,
  MapPin,
  Users,
  Heart,
  Calendar
} from "lucide-react";

export default function EsporteComunidadePage() {
  const modalidades = [
    "Futebol de Campo e Society",
    "Vôlei de Quadra e de Praia",
    "Basquete",
    "Natação",
    "Atletismo",
    "Artes Marciais",
    "Ginástica",
    "Ciclismo",
  ];

  const beneficios = [
    { icon: Heart, texto: "Promoção da saúde e qualidade de vida" },
    { icon: Users, texto: "Integração comunitária e socialização" },
    { icon: Target, texto: "Descoberta de talentos esportivos" },
    { icon: MapPin, texto: "Acesso gratuito ao esporte em todos os bairros" },
  ];

  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-accent via-accent/95 to-primary/70 text-primary-foreground overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-30"></div>
        
        <div className="container mx-auto px-4 py-16 md:py-24 relative z-10">
          <Link to="/" className="inline-flex items-center gap-2 text-primary-foreground/80 hover:text-primary-foreground mb-6 transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Voltar para o início
          </Link>
          
          <div className="flex items-center gap-4 mb-6">
            <div className="p-4 bg-primary-foreground/10 rounded-2xl backdrop-blur-sm">
              <Dumbbell className="h-12 w-12" />
            </div>
            <div>
              <BadgeInstitucional variant="highlight" className="mb-2">
                Programa
              </BadgeInstitucional>
              <h1 className="text-4xl md:text-5xl font-bold">Esporte na Comunidade</h1>
            </div>
          </div>
          
          <p className="text-xl opacity-90 max-w-3xl">
            Levando a prática esportiva para todos os bairros de Roraima, 
            promovendo saúde, integração social e descoberta de talentos.
          </p>
        </div>
      </section>

      {/* Sobre o Programa */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <BadgeInstitucional variant="primary" className="mb-4">
              Sobre o Programa
            </BadgeInstitucional>
            <h2 className="text-3xl font-bold text-foreground mb-6">O que é o Esporte na Comunidade?</h2>
            <p className="text-lg text-muted-foreground leading-relaxed mb-6">
              O programa Esporte na Comunidade é uma iniciativa do IDJUV que leva atividades 
              esportivas gratuitas para os bairros e comunidades do Estado de Roraima. 
              Com núcleos esportivos espalhados por toda a capital e interior, o programa 
              oferece aulas e treinamentos em diversas modalidades para todas as idades.
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Além de promover a saúde e o bem-estar da população, o programa funciona como 
              uma importante ferramenta de inclusão social e identificação de novos talentos 
              que podem representar o estado em competições oficiais.
            </p>
          </div>
        </div>
      </section>

      {/* Benefícios */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <BadgeInstitucional variant="secondary" className="mb-4">
              Impacto
            </BadgeInstitucional>
            <h2 className="text-3xl font-bold text-foreground">Benefícios do Programa</h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {beneficios.map((beneficio, index) => (
              <Card 
                key={index}
                className="text-center hover:shadow-lg transition-all duration-300 animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardContent className="p-6">
                  <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-accent to-primary flex items-center justify-center mb-4">
                    <beneficio.icon className="h-8 w-8 text-primary-foreground" />
                  </div>
                  <p className="text-foreground font-medium">{beneficio.texto}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Modalidades */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <BadgeInstitucional variant="accent" className="mb-4">
                Atividades
              </BadgeInstitucional>
              <h2 className="text-3xl font-bold text-foreground">Modalidades Oferecidas</h2>
            </div>

            <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
              {modalidades.map((modalidade, index) => (
                <div 
                  key={index}
                  className="flex items-center gap-3 p-4 rounded-lg border border-border hover:border-accent hover:bg-accent/5 transition-all duration-300 animate-fade-in"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <CheckCircle2 className="h-5 w-5 text-accent flex-shrink-0" />
                  <span className="text-foreground text-sm">{modalidade}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-br from-accent to-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <MapPin className="h-16 w-16 mx-auto mb-6 opacity-80" />
          <h2 className="text-3xl font-bold mb-4">Encontre um Núcleo Perto de Você!</h2>
          <p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto">
            Procure o núcleo esportivo mais próximo da sua casa e comece a praticar esportes gratuitamente.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" className="text-lg" asChild>
              <Link to="/sistema">
                <Calendar className="mr-2 h-5 w-5" />
                Ver Locais e Horários
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
