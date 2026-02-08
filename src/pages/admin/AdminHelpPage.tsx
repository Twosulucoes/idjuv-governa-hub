import { useState } from "react";
import { Link } from "react-router-dom";
import {
  HelpCircle,
  Users,
  Plane,
  FileText,
  Building2,
  Calendar,
  Briefcase,
  ChevronRight,
  CheckCircle2,
  Search,
  BookOpen,
  ArrowRight,
  Clock,
  type LucideIcon,
} from "lucide-react";
import { ModuleLayout } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface TaskStep {
  title: string;
  description: string;
  path?: string;
}

interface TaskGuide {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  category: string;
  estimatedTime: string;
  steps: TaskStep[];
}

const taskGuides: TaskGuide[] = [
  {
    id: "cadastrar-servidor",
    title: "Cadastrar um novo servidor",
    description: "Como adicionar um novo servidor ao sistema",
    icon: Users,
    category: "Pessoas",
    estimatedTime: "5-10 min",
    steps: [
      {
        title: "Acessar o módulo de Servidores",
        description: "No menu lateral, clique em Pessoas → Servidores → Lista de Servidores",
        path: "/rh/servidores",
      },
      {
        title: "Iniciar novo cadastro",
        description: "Clique no botão 'Novo Servidor' no canto superior direito da página",
        path: "/rh/servidores/novo",
      },
      {
        title: "Preencher dados pessoais",
        description: "Preencha nome completo, CPF, data de nascimento, sexo e demais dados pessoais",
      },
      {
        title: "Informar dados funcionais",
        description: "Selecione o vínculo (comissionado, efetivo, etc.), cargo, unidade de lotação e data de admissão",
      },
      {
        title: "Adicionar documentos",
        description: "Informe RG, título de eleitor, PIS/PASEP e demais documentos",
      },
      {
        title: "Salvar cadastro",
        description: "Clique em 'Salvar' para finalizar o cadastro do servidor",
      },
    ],
  },
  {
    id: "lancar-viagem",
    title: "Lançar uma viagem/diária",
    description: "Como registrar uma viagem a serviço para um servidor",
    icon: Plane,
    category: "Viagens",
    estimatedTime: "3-5 min",
    steps: [
      {
        title: "Acessar o módulo de Viagens",
        description: "No menu lateral, clique em Pessoas → Viagens e Diárias",
        path: "/rh/viagens",
      },
      {
        title: "Iniciar nova viagem",
        description: "Clique no botão 'Nova Viagem' no canto superior direito",
      },
      {
        title: "Selecionar o servidor",
        description: "Escolha o servidor que irá realizar a viagem na lista suspensa",
      },
      {
        title: "Informar destino e período",
        description: "Preencha a cidade/UF de destino, data de saída e data de retorno",
      },
      {
        title: "Descrever finalidade",
        description: "Descreva a finalidade/objetivo da viagem no campo correspondente",
      },
      {
        title: "Informar diárias",
        description: "Preencha a quantidade de diárias e o valor unitário, se aplicável",
      },
      {
        title: "Salvar viagem",
        description: "Clique em 'Salvar' para registrar a viagem",
      },
    ],
  },
  {
    id: "criar-portaria-viagem",
    title: "Criar portaria de viagem",
    description: "Como gerar uma portaria de viagem vinculada ao servidor",
    icon: FileText,
    category: "Documentos",
    estimatedTime: "5-8 min",
    steps: [
      {
        title: "Acessar Viagens",
        description: "No menu, vá em Pessoas → Viagens e Diárias",
        path: "/rh/viagens",
      },
      {
        title: "Localizar a viagem",
        description: "Use a busca ou filtros para encontrar a viagem do servidor",
      },
      {
        title: "Editar a viagem",
        description: "Clique na viagem para editar seus dados",
      },
      {
        title: "Informar dados da portaria",
        description: "Preencha o número da portaria e a data de publicação",
      },
      {
        title: "Anexar documento",
        description: "Se tiver o PDF da portaria, faça o upload no campo correspondente",
      },
      {
        title: "Alterar status para Autorizada",
        description: "Mude o status da viagem para 'Autorizada' após a portaria",
      },
    ],
  },
  {
    id: "gerenciar-ferias",
    title: "Gerenciar férias de servidor",
    description: "Como lançar e acompanhar férias dos servidores",
    icon: Calendar,
    category: "Pessoas",
    estimatedTime: "3-5 min",
    steps: [
      {
        title: "Acessar módulo de Férias",
        description: "No menu, clique em Pessoas → Férias",
        path: "/rh/ferias",
      },
      {
        title: "Cadastrar novo período de férias",
        description: "Clique em 'Nova Férias' e selecione o servidor",
      },
      {
        title: "Definir período aquisitivo",
        description: "Informe o período aquisitivo (ex: 01/2024 a 01/2025)",
      },
      {
        title: "Definir período de gozo",
        description: "Preencha a data de início e fim das férias",
      },
      {
        title: "Informar parcelamento",
        description: "Se houver parcelamento, indique qual parcela (1ª, 2ª, 3ª)",
      },
      {
        title: "Salvar férias",
        description: "Clique em 'Salvar' para registrar as férias",
      },
    ],
  },
  {
    id: "cadastrar-cargo",
    title: "Cadastrar um novo cargo",
    description: "Como adicionar cargos à estrutura organizacional",
    icon: Briefcase,
    category: "Estrutura",
    estimatedTime: "5-10 min",
    steps: [
      {
        title: "Acessar Gestão de Cargos",
        description: "No menu, vá em Cadastros → Estrutura Organizacional → Cargos",
        path: "/cargos",
      },
      {
        title: "Novo cargo",
        description: "Clique em 'Novo Cargo' no canto superior direito",
      },
      {
        title: "Informar dados básicos",
        description: "Preencha nome do cargo, sigla e categoria (comissionado, efetivo, etc.)",
      },
      {
        title: "Definir requisitos",
        description: "Informe escolaridade exigida, experiência e conhecimentos necessários",
      },
      {
        title: "Descrever atribuições",
        description: "Liste as atribuições e responsabilidades do cargo",
      },
      {
        title: "Definir remuneração",
        description: "Informe o vencimento base e quantidade de vagas",
      },
      {
        title: "Salvar cargo",
        description: "Clique em 'Salvar' para criar o cargo",
      },
    ],
  },
  {
    id: "gestao-unidades",
    title: "Gerenciar unidades organizacionais",
    description: "Como criar e editar unidades no organograma",
    icon: Building2,
    category: "Estrutura",
    estimatedTime: "5-10 min",
    steps: [
      {
        title: "Acessar Gestão do Organograma",
        description: "No menu, vá em Cadastros → Estrutura Organizacional → Gestão do Organograma",
        path: "/organograma/gestao",
      },
      {
        title: "Criar nova unidade",
        description: "Clique em 'Nova Unidade' para adicionar uma nova",
      },
      {
        title: "Definir hierarquia",
        description: "Selecione a unidade superior (se houver) e o tipo (diretoria, departamento, setor)",
      },
      {
        title: "Informar dados da unidade",
        description: "Preencha nome, sigla, descrição e competências",
      },
      {
        title: "Vincular responsável",
        description: "Selecione o servidor responsável pela unidade",
      },
      {
        title: "Salvar unidade",
        description: "Clique em 'Salvar' para criar a unidade",
      },
    ],
  },
  {
    id: "gerar-relatorios",
    title: "Gerar relatórios de RH",
    description: "Como gerar e exportar relatórios de pessoal",
    icon: FileText,
    category: "Relatórios",
    estimatedTime: "2-5 min",
    steps: [
      {
        title: "Acessar Relatórios de RH",
        description: "No menu, vá em Relatórios → Relatórios de RH",
        path: "/rh/relatorios",
      },
      {
        title: "Escolher tipo de relatório",
        description: "Selecione o tipo de relatório desejado (quantitativo, férias, afastamentos, etc.)",
      },
      {
        title: "Aplicar filtros",
        description: "Configure os filtros conforme necessário (período, unidade, vínculo)",
      },
      {
        title: "Gerar relatório",
        description: "Clique em 'Gerar' para visualizar o relatório",
      },
      {
        title: "Exportar",
        description: "Use o botão 'Exportar' para baixar em PDF ou Excel",
      },
    ],
  },
  {
    id: "gerenciar-licencas",
    title: "Lançar licença/afastamento",
    description: "Como registrar licenças e afastamentos de servidores",
    icon: Clock,
    category: "Pessoas",
    estimatedTime: "3-5 min",
    steps: [
      {
        title: "Acessar módulo de Licenças",
        description: "No menu, clique em Pessoas → Licenças",
        path: "/rh/licencas",
      },
      {
        title: "Nova licença",
        description: "Clique em 'Nova Licença' e selecione o servidor",
      },
      {
        title: "Selecionar tipo",
        description: "Escolha o tipo de licença (médica, maternidade, capacitação, etc.)",
      },
      {
        title: "Informar período",
        description: "Preencha a data de início e previsão de término",
      },
      {
        title: "Anexar documentos",
        description: "Anexe atestados ou documentos comprobatórios",
      },
      {
        title: "Salvar licença",
        description: "Clique em 'Salvar' para registrar a licença",
      },
    ],
  },
];

const categories = ["Todas", "Pessoas", "Viagens", "Documentos", "Estrutura", "Relatórios"];

export default function AdminHelpPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todas");

  const filteredGuides = taskGuides.filter((guide) => {
    const matchesSearch =
      guide.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      guide.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      guide.steps.some(
        (step) =>
          step.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          step.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    const matchesCategory =
      selectedCategory === "Todas" || guide.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <ModuleLayout module="admin">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/10 rounded-xl">
              <HelpCircle className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Ajuda e Tutoriais</h1>
              <p className="text-muted-foreground">
                Guias passo a passo para tarefas comuns do sistema
              </p>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por tarefa, ação ou palavra-chave..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {categories.map((cat) => (
              <Button
                key={cat}
                variant={selectedCategory === cat ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </Button>
            ))}
          </div>
        </div>

        {/* Quick Access Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {taskGuides.slice(0, 4).map((guide) => (
            <Card
              key={guide.id}
              className="hover:bg-accent/50 transition-colors cursor-pointer"
              onClick={() => {
                const element = document.getElementById(guide.id);
                element?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <guide.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium text-sm">{guide.title}</h3>
                    <p className="text-xs text-muted-foreground">
                      {guide.estimatedTime}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Task Guides */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Guias de Tarefas
          </h2>

          {filteredGuides.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Nenhum guia encontrado para "{searchTerm}"
              </CardContent>
            </Card>
          ) : (
            <Accordion type="multiple" className="space-y-2">
              {filteredGuides.map((guide) => (
                <AccordionItem
                  key={guide.id}
                  value={guide.id}
                  id={guide.id}
                  className="bg-card border rounded-lg px-4"
                >
                  <AccordionTrigger className="hover:no-underline py-4">
                    <div className="flex items-center gap-4 text-left">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <guide.icon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-medium">{guide.title}</h3>
                          <Badge variant="secondary" className="text-xs">
                            {guide.category}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            <Clock className="h-3 w-3 mr-1" />
                            {guide.estimatedTime}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {guide.description}
                        </p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-4">
                    <div className="ml-14 space-y-3">
                      {guide.steps.map((step, index) => (
                        <div
                          key={index}
                          className="flex gap-3 p-3 rounded-lg bg-muted/50"
                        >
                          <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-xs font-medium text-primary">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <h4 className="font-medium text-sm">
                                {step.title}
                              </h4>
                              {step.path && (
                                <Link to={step.path}>
                                  <Button variant="ghost" size="sm" className="h-7 text-xs">
                                    Ir para página
                                    <ArrowRight className="h-3 w-3 ml-1" />
                                  </Button>
                                </Link>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {step.description}
                            </p>
                          </div>
                        </div>
                      ))}
                      
                      {/* Link direto para a primeira página do fluxo */}
                      {guide.steps[0]?.path && (
                        <div className="pt-2">
                          <Link to={guide.steps[0].path}>
                            <Button className="w-full">
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              Iniciar: {guide.title}
                              <ChevronRight className="h-4 w-4 ml-2" />
                            </Button>
                          </Link>
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </div>

        {/* Navigation Map */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Fluxos Comuns de Navegação
            </CardTitle>
            <CardDescription>
              Caminhos rápidos para as tarefas mais executadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  Servidor + Viagem
                </h4>
                <div className="flex items-center flex-wrap gap-2 text-sm">
                  <Link to="/rh/servidores/novo" className="text-primary hover:underline">
                    Novo Servidor
                  </Link>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  <Link to="/rh/viagens" className="text-primary hover:underline">
                    Viagens
                  </Link>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Nova Viagem</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Portaria</span>
                </div>
              </div>

              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-primary" />
                  Estrutura + Lotação
                </h4>
                <div className="flex items-center flex-wrap gap-2 text-sm">
                  <Link to="/organograma/gestao" className="text-primary hover:underline">
                    Organograma
                  </Link>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  <Link to="/cargos" className="text-primary hover:underline">
                    Cargos
                  </Link>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  <Link to="/lotacoes" className="text-primary hover:underline">
                    Lotações
                  </Link>
                </div>
              </div>

              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  Servidor + Férias
                </h4>
                <div className="flex items-center flex-wrap gap-2 text-sm">
                  <Link to="/rh/servidores" className="text-primary hover:underline">
                    Lista de Servidores
                  </Link>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Ficha do Servidor</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  <Link to="/rh/ferias" className="text-primary hover:underline">
                    Férias
                  </Link>
                </div>
              </div>

              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  Relatórios
                </h4>
                <div className="flex items-center flex-wrap gap-2 text-sm">
                  <Link to="/rh/relatorios" className="text-primary hover:underline">
                    Relatórios de RH
                  </Link>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Selecionar tipo</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Exportar PDF/Excel</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </ModuleLayout>
  );
}
