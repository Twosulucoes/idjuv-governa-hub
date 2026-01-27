import { Link } from "react-router-dom";
import { Shield, FileText, Building2, Users, BookOpen, BarChart3, Network, Layers } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const governancaItems = [
  {
    title: "Lei de Criação",
    description: "Lei nº 2.301/2025 - Criação do IDJuv como autarquia estadual",
    icon: FileText,
    href: "/governanca/lei-criacao",
  },
  {
    title: "Decreto Regulamentador",
    description: "Regulamentação da estrutura organizacional e competências",
    icon: FileText,
    href: "/governanca/decreto",
  },
  {
    title: "Regimento Interno",
    description: "Normas de funcionamento e atribuições das unidades",
    icon: BookOpen,
    href: "/governanca/regimento",
  },
  {
    title: "Estrutura Organizacional",
    description: "Detalhamento dos níveis, vínculos e subordinação das unidades",
    icon: Layers,
    href: "/governanca/estrutura",
    featured: true,
  },
  {
    title: "Organograma Interativo",
    description: "Visualização gráfica da hierarquia institucional com dados em tempo real",
    icon: Network,
    href: "/organograma",
  },
  {
    title: "Portarias Estruturantes",
    description: "Atos normativos de organização interna",
    icon: FileText,
    href: "/governanca/portarias",
  },
  {
    title: "Matriz RACI",
    description: "Responsabilidades e papéis nos processos administrativos",
    icon: Users,
    href: "/governanca/matriz-raci",
  },
  {
    title: "Relatório de Governança",
    description: "Relatório anual de governança e integridade",
    icon: BarChart3,
    href: "/governanca/relatorio",
  },
];

export default function GovernancaPage() {
  return (
    <MainLayout>
      {/* Cabeçalho */}
      <section className="bg-primary text-primary-foreground py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 text-sm mb-4 opacity-80">
            <Link to="/" className="hover:underline">Início</Link>
            <span>/</span>
            <span>Governança</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-accent rounded-xl flex items-center justify-center">
              <Shield className="w-8 h-8 text-accent-foreground" />
            </div>
            <div>
              <h1 className="font-serif text-3xl lg:text-4xl font-bold">Governança</h1>
              <p className="opacity-90 mt-1">
                Estrutura normativa e organizacional do IDJUV
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Conteúdo */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* Introdução */}
            <div className="bg-muted/50 rounded-xl p-6 mb-8">
              <h2 className="font-serif text-xl font-bold mb-3">Sobre a Governança do IDJUV</h2>
              <p className="text-muted-foreground leading-relaxed">
                A governança do IDJUV está estruturada em conformidade com os princípios da 
                Administração Pública, garantindo transparência, legalidade, impessoalidade, 
                moralidade e eficiência em todas as ações institucionais. Esta seção reúne 
                todos os documentos normativos e estruturais da autarquia.
              </p>
            </div>

            <Separator className="my-8" />

            {/* Grid de documentos */}
            <h2 className="font-serif text-2xl font-bold mb-6">Documentos e Normativas</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {governancaItems.map((item) => (
                <Link key={item.href} to={item.href}>
                  <Card className="h-full hover:shadow-lg transition-all hover:border-primary group">
                    <CardHeader className="flex flex-row items-start gap-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <item.icon className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg group-hover:text-primary transition-colors">
                          {item.title}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          {item.description}
                        </CardDescription>
                      </div>
                    </CardHeader>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}
