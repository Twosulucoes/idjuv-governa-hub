import { Link } from "react-router-dom";
import { Shield, FileText, Building2, Users, BookOpen, BarChart3, Network, Layers } from "lucide-react";
import { ModuleLayout } from "@/components/layout/ModuleLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useTenant } from "@/core/tenant";

const governancaItems = [
  {
    title: "Lei de Criação",
    // Descrição montada com a lei do cadastro da instituição (ver GovernancaPage)
    description: "",
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
  const { identidade: { sigla }, legal } = useTenant();
  const descricaoLei = legal?.leiCriacao
    ? `${legal.leiCriacao} - Criação do ${sigla}`
    : `Norma de criação do ${sigla}`;
  const itens = governancaItems.map((item) =>
    item.href === "/governanca/lei-criacao" ? { ...item, description: descricaoLei } : item,
  );

  return (
    <ModuleLayout module="governanca">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center">
              <Shield className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="font-serif text-3xl font-bold">Governança</h1>
              <p className="text-muted-foreground mt-1">
                Estrutura normativa e organizacional do {sigla}
              </p>
            </div>
          </div>
        </div>

        {/* Introdução */}
        <div className="bg-muted/50 rounded-xl p-6 mb-8">
          <h2 className="font-serif text-xl font-bold mb-3">Sobre a Governança do {sigla}</h2>
          <p className="text-muted-foreground leading-relaxed">
            A governança do {sigla} está estruturada em conformidade com os princípios da 
            Administração Pública, garantindo transparência, legalidade, impessoalidade, 
            moralidade e eficiência em todas as ações institucionais. Esta seção reúne 
            todos os documentos normativos e estruturais da autarquia.
          </p>
        </div>

        <Separator className="my-8" />

        {/* Grid de documentos */}
        <h2 className="font-serif text-2xl font-bold mb-6">Documentos e Normativas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {itens.map((item) => (
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
    </ModuleLayout>
  );
}
