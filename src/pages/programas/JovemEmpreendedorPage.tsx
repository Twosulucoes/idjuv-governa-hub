import { Link } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BadgeInstitucional } from "@/components/ui/BadgeInstitucional";
import { 
  Lightbulb, 
  Target, 
  CheckCircle2, 
  ArrowLeft,
  Briefcase,
  TrendingUp,
  Users,
  Award,
  Rocket
} from "lucide-react";

export default function JovemEmpreendedorPage() {
  const modulos = [
    { titulo: "Ideação", descricao: "Desenvolvimento de ideias e identificação de oportunidades" },
    { titulo: "Modelo de Negócio", descricao: "Estruturação do Canvas e validação de mercado" },
    { titulo: "Finanças", descricao: "Gestão financeira e precificação" },
    { titulo: "Marketing Digital", descricao: "Presença online e estratégias de vendas" },
    { titulo: "Pitch", descricao: "Apresentação para investidores" },
    { titulo: "Mentoria", descricao: "Acompanhamento com empresários experientes" },
  ];

  const resultados = [
    { numero: "500+", texto: "Jovens capacitados" },
    { numero: "80+", texto: "Negócios criados" },
    { numero: "R$ 2M+", texto: "Faturamento gerado" },
    { numero: "15", texto: "Municípios atendidos" },
  ];

  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-highlight via-highlight/95 to-secondary/70 text-primary-foreground overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-30"></div>
        
        <div className="container mx-auto px-4 py-16 md:py-24 relative z-10">
          <Link to="/" className="inline-flex items-center gap-2 text-primary-foreground/80 hover:text-primary-foreground mb-6 transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Voltar para o início
          </Link>
          
          <div className="flex items-center gap-4 mb-6">
            <div className="p-4 bg-primary-foreground/10 rounded-2xl backdrop-blur-sm">
              <Lightbulb className="h-12 w-12" />
            </div>
            <div>
              <BadgeInstitucional variant="highlight" className="mb-2">
                Programa
              </BadgeInstitucional>
              <h1 className="text-4xl md:text-5xl font-bold">Capacitação Jovem Empreendedor</h1>
            </div>
          </div>
          
          <p className="text-xl opacity-90 max-w-3xl">
            Formando a próxima geração de empreendedores roraimenses, 
            transformando ideias em negócios de sucesso.
          </p>
        </div>
      </section>

      {/* Resultados */}
      <section className="py-12 bg-background border-b">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {resultados.map((resultado, index) => (
              <div 
                key={index}
                className="text-center animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <p className="text-3xl md:text-4xl font-bold text-primary">{resultado.numero}</p>
                <p className="text-muted-foreground">{resultado.texto}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sobre o Programa */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <BadgeInstitucional variant="primary" className="mb-4">
              Sobre o Programa
            </BadgeInstitucional>
            <h2 className="text-3xl font-bold text-foreground mb-6">O que é a Capacitação Jovem Empreendedor?</h2>
            <p className="text-lg text-muted-foreground leading-relaxed mb-6">
              A Capacitação Jovem Empreendedor é um programa intensivo de formação empresarial 
              voltado para jovens de 18 a 29 anos que desejam abrir seu próprio negócio ou 
              formalizar um empreendimento já existente. O programa oferece conhecimentos 
              práticos em gestão, finanças, marketing e vendas.
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Com uma metodologia hands-on, os participantes desenvolvem seus projetos de negócio 
              ao longo do curso, recebendo mentoria de empresários experientes e tendo acesso a 
              uma rede de contatos que pode impulsionar suas carreiras empreendedoras.
            </p>
          </div>
        </div>
      </section>

      {/* Módulos */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <BadgeInstitucional variant="secondary" className="mb-4">
              Conteúdo
            </BadgeInstitucional>
            <h2 className="text-3xl font-bold text-foreground">Módulos do Programa</h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {modulos.map((modulo, index) => (
              <Card 
                key={modulo.titulo}
                className="hover:shadow-lg transition-all duration-300 animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-highlight/20 flex items-center justify-center">
                      <span className="font-bold text-highlight">{index + 1}</span>
                    </div>
                    <h3 className="text-lg font-bold text-foreground">{modulo.titulo}</h3>
                  </div>
                  <p className="text-muted-foreground">{modulo.descricao}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefícios */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto items-center">
            <div>
              <BadgeInstitucional variant="accent" className="mb-4">
                Diferenciais
              </BadgeInstitucional>
              <h2 className="text-3xl font-bold text-foreground mb-6">Por que participar?</h2>
              <ul className="space-y-4">
                {[
                  "Capacitação 100% gratuita",
                  "Certificado reconhecido",
                  "Mentoria individualizada",
                  "Acesso a rede de investidores",
                  "Possibilidade de financiamento",
                  "Suporte pós-programa",
                ].map((item, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-highlight flex-shrink-0" />
                    <span className="text-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <Card className="bg-gradient-to-br from-highlight/10 to-secondary/10 border-highlight/20">
              <CardContent className="p-8 text-center">
                <Rocket className="h-16 w-16 text-highlight mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-foreground mb-4">Próxima Turma</h3>
                <p className="text-muted-foreground mb-6">
                  As inscrições para a próxima turma estão abertas. Vagas limitadas!
                </p>
                <Button size="lg" className="w-full" asChild>
                  <Link to="/sistema">
                    <Award className="mr-2 h-5 w-5" />
                    Inscreva-se Agora
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-br from-highlight to-secondary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <TrendingUp className="h-16 w-16 mx-auto mb-6 opacity-80" />
          <h2 className="text-3xl font-bold mb-4">Transforme Sua Ideia em Realidade!</h2>
          <p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto">
            Não perca a oportunidade de se capacitar gratuitamente e iniciar sua jornada empreendedora.
          </p>
          <Button size="lg" variant="secondary" className="text-lg" asChild>
            <Link to="/">
              <ArrowLeft className="mr-2 h-5 w-5" />
              Voltar ao Início
            </Link>
          </Button>
        </div>
      </section>
    </MainLayout>
  );
}
