import { Link } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BadgeInstitucional } from "@/components/ui/BadgeInstitucional";
import { 
  Trophy, 
  Target, 
  Users, 
  CheckCircle2, 
  ArrowLeft,
  FileText,
  Calendar,
  Medal,
  Dumbbell
} from "lucide-react";

export default function BolsaAtletaPage() {
  const beneficios = [
    "Apoio financeiro mensal para atletas de alto rendimento",
    "Custeio de participação em competições estaduais e nacionais",
    "Auxílio para aquisição de equipamentos esportivos",
    "Acompanhamento técnico e nutricional",
  ];

  const requisitos = [
    "Ser atleta federado em modalidade esportiva reconhecida",
    "Residir no Estado de Roraima há pelo menos 2 anos",
    "Ter idade entre 14 e 35 anos",
    "Comprovar participação em competições oficiais",
    "Manter regularidade escolar (para menores de 18 anos)",
  ];

  const categorias = [
    { nome: "Atleta Base", valor: "R$ 400,00", descricao: "Atletas em formação com resultados estaduais" },
    { nome: "Atleta Estadual", valor: "R$ 600,00", descricao: "Atletas com resultados em competições estaduais" },
    { nome: "Atleta Nacional", valor: "R$ 1.000,00", descricao: "Atletas com participação em competições nacionais" },
    { nome: "Atleta de Elite", valor: "R$ 1.500,00", descricao: "Atletas com resultados expressivos em nível nacional" },
  ];

  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary via-primary/95 to-secondary/70 text-primary-foreground overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-30"></div>
        
        <div className="container mx-auto px-4 py-16 md:py-24 relative z-10">
          <Link to="/" className="inline-flex items-center gap-2 text-primary-foreground/80 hover:text-primary-foreground mb-6 transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Voltar para o início
          </Link>
          
          <div className="flex items-center gap-4 mb-6">
            <div className="p-4 bg-primary-foreground/10 rounded-2xl backdrop-blur-sm">
              <Trophy className="h-12 w-12" />
            </div>
            <div>
              <BadgeInstitucional variant="highlight" className="mb-2">
                Programa
              </BadgeInstitucional>
              <h1 className="text-4xl md:text-5xl font-bold">Bolsa Atleta Estadual</h1>
            </div>
          </div>
          
          <p className="text-xl opacity-90 max-w-3xl">
            Programa de incentivo ao esporte que oferece apoio financeiro a atletas roraimenses 
            de alto rendimento, contribuindo para o desenvolvimento do esporte no estado.
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
            <h2 className="text-3xl font-bold text-foreground mb-6">O que é o Bolsa Atleta?</h2>
            <p className="text-lg text-muted-foreground leading-relaxed mb-6">
              O Bolsa Atleta Estadual é um programa do Governo do Estado de Roraima, executado pelo IDJUV, 
              que visa incentivar e apoiar atletas que representam o estado em competições esportivas. 
              O programa oferece suporte financeiro mensal para que os atletas possam se dedicar 
              integralmente aos treinamentos e competições.
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Criado para valorizar o talento esportivo roraimense, o programa já beneficiou centenas 
              de atletas de diversas modalidades, contribuindo para conquistas importantes em 
              competições regionais, nacionais e internacionais.
            </p>
          </div>
        </div>
      </section>

      {/* Categorias */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <BadgeInstitucional variant="secondary" className="mb-4">
              Categorias
            </BadgeInstitucional>
            <h2 className="text-3xl font-bold text-foreground">Valores por Categoria</h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {categorias.map((cat, index) => (
              <Card 
                key={cat.nome}
                className="text-center hover:shadow-lg transition-all duration-300 animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardContent className="p-6">
                  <Medal className="h-10 w-10 text-primary mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-foreground mb-2">{cat.nome}</h3>
                  <p className="text-2xl font-bold text-primary mb-2">{cat.valor}</p>
                  <p className="text-sm text-muted-foreground">{cat.descricao}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefícios e Requisitos */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <Card className="border-l-4 border-l-primary">
              <CardContent className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <Target className="h-8 w-8 text-primary" />
                  <h3 className="text-2xl font-bold text-foreground">Benefícios</h3>
                </div>
                <ul className="space-y-4">
                  {beneficios.map((beneficio, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">{beneficio}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-secondary">
              <CardContent className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <FileText className="h-8 w-8 text-secondary" />
                  <h3 className="text-2xl font-bold text-foreground">Requisitos</h3>
                </div>
                <ul className="space-y-4">
                  {requisitos.map((requisito, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-secondary flex-shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">{requisito}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-br from-primary to-secondary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <Dumbbell className="h-16 w-16 mx-auto mb-6 opacity-80" />
          <h2 className="text-3xl font-bold mb-4">Quer ser um Bolsista?</h2>
          <p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto">
            Fique atento aos editais de seleção do Bolsa Atleta Estadual. 
            As inscrições são abertas anualmente.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" className="text-lg" asChild>
              <Link to="/sistema">
                <Calendar className="mr-2 h-5 w-5" />
                Ver Editais Abertos
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
