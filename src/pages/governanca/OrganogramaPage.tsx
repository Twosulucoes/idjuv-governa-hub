import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Scale, Users, Building2, Briefcase, Shield, FileText, ChevronDown, ChevronRight } from "lucide-react";

interface OrgUnit {
  id: string;
  name: string;
  shortName?: string;
  level: "presidencia" | "assessoria" | "diretoria" | "coordenacao";
  parent?: string;
  description: string;
  competencias: string[];
  responsavel?: string;
}

const orgUnits: OrgUnit[] = [
  // NÍVEL DE ADMINISTRAÇÃO SUPERIOR
  {
    id: "presidencia",
    name: "Presidência",
    level: "presidencia",
    description: "Órgão máximo de direção do IDJuv, responsável pela gestão estratégica e representação institucional.",
    competencias: [
      "Representar o Instituto judicial e extrajudicialmente",
      "Ordenar despesas e autorizar pagamentos",
      "Celebrar contratos, convênios e parcerias",
      "Nomear e exonerar ocupantes de cargos em comissão",
      "Aprovar o planejamento estratégico e operacional"
    ],
    responsavel: "Presidente"
  },
  // NÍVEL DE ASSESSORAMENTO
  {
    id: "gabinete",
    name: "Gabinete da Presidência",
    shortName: "GAB",
    level: "assessoria",
    parent: "presidencia",
    description: "Assessoria direta à Presidência para assuntos administrativos e de representação.",
    competencias: [
      "Assessorar o Presidente em suas atribuições",
      "Coordenar a agenda institucional",
      "Gerenciar correspondências oficiais",
      "Organizar eventos institucionais"
    ],
    responsavel: "Chefe de Gabinete"
  },
  {
    id: "assessoria-juridica",
    name: "Assessoria Jurídica",
    shortName: "ASJUR",
    level: "assessoria",
    parent: "presidencia",
    description: "Órgão de consultoria e assessoramento jurídico do Instituto.",
    competencias: [
      "Emitir pareceres jurídicos",
      "Analisar minutas de contratos e convênios",
      "Assessorar em processos administrativos",
      "Acompanhar processos judiciais"
    ],
    responsavel: "Assessor Jurídico"
  },
  {
    id: "assessoria-especial",
    name: "Assessoria Especial",
    shortName: "ASESP",
    level: "assessoria",
    parent: "presidencia",
    description: "Assessoria de alto nível para assuntos estratégicos e especiais.",
    competencias: [
      "Assessorar o Presidente em assuntos estratégicos",
      "Elaborar estudos e pareceres técnicos",
      "Acompanhar projetos especiais",
      "Representar o Instituto em missões específicas"
    ],
    responsavel: "Assessor Especial"
  },
  {
    id: "controle-interno",
    name: "Controle Interno",
    shortName: "CI",
    level: "assessoria",
    parent: "presidencia",
    description: "Órgão responsável pela fiscalização e orientação da gestão administrativa.",
    competencias: [
      "Realizar auditorias internas",
      "Orientar gestores sobre conformidade",
      "Acompanhar recomendações do TCE",
      "Elaborar relatórios de controle"
    ],
    responsavel: "Chefe de Controle Interno"
  },
  {
    id: "comissao-contratacao",
    name: "Comissão de Contratação",
    shortName: "CPL",
    level: "assessoria",
    parent: "presidencia",
    description: "Responsável pelos processos licitatórios e de contratação do Instituto.",
    competencias: [
      "Conduzir processos licitatórios",
      "Analisar propostas e documentação",
      "Julgar recursos administrativos",
      "Emitir atos de adjudicação"
    ],
    responsavel: "Presidente da CPL"
  },
  {
    id: "assessoria-comunicacao",
    name: "Assessoria de Comunicação",
    shortName: "ASCOM",
    level: "assessoria",
    parent: "presidencia",
    description: "Responsável pela comunicação institucional e relacionamento com a imprensa.",
    competencias: [
      "Coordenar a comunicação institucional",
      "Gerenciar redes sociais e portal",
      "Produzir conteúdo informativo",
      "Atender a imprensa"
    ],
    responsavel: "Assessor de Comunicação"
  },
  // NÍVEL DE EXECUÇÃO INSTRUMENTAL
  {
    id: "diraf",
    name: "Diretoria Administrativa e Financeira",
    shortName: "DIRAF",
    level: "diretoria",
    parent: "presidencia",
    description: "Responsável pela gestão dos recursos humanos, materiais, patrimoniais, orçamentários e financeiros.",
    competencias: [
      "Elaborar a proposta orçamentária anual",
      "Executar o orçamento e controlar a execução financeira",
      "Gerenciar a folha de pagamento",
      "Administrar o patrimônio e contratos",
      "Coordenar a tecnologia da informação"
    ],
    responsavel: "Diretor Administrativo e Financeiro"
  },
  {
    id: "dicof",
    name: "Divisão de Contabilidade, Orçamento e Finanças",
    shortName: "DiCOF",
    level: "coordenacao",
    parent: "diraf",
    description: "Gestão contábil, orçamentária e financeira do Instituto.",
    competencias: [
      "Efetuar e controlar arrecadações e pagamentos",
      "Controlar contas a receber e a pagar",
      "Executar a escrituração contábil",
      "Elaborar balancetes e balanços"
    ],
    responsavel: "Chefe de Divisão"
  },
  {
    id: "diagp",
    name: "Divisão Administrativa e Gestão Patrimonial",
    shortName: "DiAGP",
    level: "coordenacao",
    parent: "diraf",
    description: "Gestão administrativa, patrimonial e logística.",
    competencias: [
      "Elaborar cronograma de aquisição de material",
      "Promover cadastro e tombamento de bens",
      "Coordenar serviços de transporte",
      "Promover publicação de atos oficiais"
    ],
    responsavel: "Chefe de Divisão"
  },
  {
    id: "drh",
    name: "Divisão de Recursos Humanos",
    shortName: "DRH",
    level: "coordenacao",
    parent: "diraf",
    description: "Gestão de pessoal, folha de pagamento e desenvolvimento de servidores.",
    competencias: [
      "Propor normas relativas à área de pessoal",
      "Processar atos relativos aos servidores",
      "Elaborar folha de pagamento",
      "Coordenar programas de estágio"
    ],
    responsavel: "Chefe de Divisão"
  },
  {
    id: "diti",
    name: "Divisão de Tecnologia da Informação",
    shortName: "DiTI",
    level: "coordenacao",
    parent: "diraf",
    description: "Gestão de tecnologia, sistemas e infraestrutura digital.",
    competencias: [
      "Gerenciar infraestrutura de TI",
      "Desenvolver e manter sistemas",
      "Garantir segurança da informação",
      "Prestar suporte técnico"
    ],
    responsavel: "Chefe de Divisão"
  },
  // NÍVEL DE EXECUÇÃO PROGRAMÁTICA - DIESP
  {
    id: "diesp",
    name: "Diretoria de Esporte",
    shortName: "DIESP",
    level: "diretoria",
    parent: "presidencia",
    description: "Planejamento e execução das políticas de desenvolvimento esportivo.",
    competencias: [
      "Formular políticas de esporte",
      "Promover eventos esportivos",
      "Apoiar formação de atletas",
      "Administrar equipamentos esportivos",
      "Articular com federações esportivas"
    ],
    responsavel: "Diretor de Esporte"
  },
  {
    id: "digel",
    name: "Divisão de Gestão de Esporte e Lazer",
    shortName: "DiGEL",
    level: "coordenacao",
    parent: "diesp",
    description: "Promoção do esporte comunitário e atividades de lazer.",
    competencias: [
      "Promover desporto comunitário",
      "Desenvolver atividades de lazer",
      "Fomentar qualidade de vida através do esporte"
    ],
    responsavel: "Chefe de Divisão"
  },
  {
    id: "dire",
    name: "Divisão de Esporte de Alto Rendimento",
    shortName: "DiRE",
    level: "coordenacao",
    parent: "diesp",
    description: "Apoio ao esporte de alto rendimento e organizações esportivas.",
    competencias: [
      "Apoiar atletas de alto rendimento",
      "Articular com organizações esportivas",
      "Promover competições estaduais e nacionais"
    ],
    responsavel: "Chefe de Divisão"
  },
  {
    id: "diede",
    name: "Divisão de Educação e Desporto Estudantil",
    shortName: "DiEDE",
    level: "coordenacao",
    parent: "diesp",
    description: "Promoção do esporte educacional e de base.",
    competencias: [
      "Promover esporte educacional nas escolas",
      "Desenvolver esporte de base",
      "Organizar jogos escolares"
    ],
    responsavel: "Chefe de Divisão"
  },
  {
    id: "digi",
    name: "Divisão de Gestão Inclusiva e Qualidade de Vida",
    shortName: "DiGI",
    level: "coordenacao",
    parent: "diesp",
    description: "Promoção da inclusão social através do esporte e paradesporto.",
    competencias: [
      "Promover esporte inclusivo",
      "Desenvolver paradesporto",
      "Fomentar qualidade de vida"
    ],
    responsavel: "Chefe de Divisão"
  },
  // NÍVEL DE EXECUÇÃO PROGRAMÁTICA - DIJUV
  {
    id: "dijuv",
    name: "Diretoria da Juventude",
    shortName: "DIJUV",
    level: "diretoria",
    parent: "presidencia",
    description: "Políticas públicas voltadas à juventude e participação juvenil.",
    competencias: [
      "Formular políticas para juventude",
      "Promover protagonismo juvenil",
      "Fomentar participação em conselhos",
      "Desenvolver programas de inclusão"
    ],
    responsavel: "Diretor da Juventude"
  },
  {
    id: "dipp",
    name: "Divisão de Programas e Projetos",
    shortName: "DiPP",
    level: "coordenacao",
    parent: "dijuv",
    description: "Gestão de programas e projetos voltados à juventude.",
    competencias: [
      "Desenvolver programas para juventude",
      "Gerenciar projetos temáticos",
      "Articular com Centro de Referência da Juventude"
    ],
    responsavel: "Chefe de Divisão"
  },
  {
    id: "dapt",
    name: "Divisão de Articulação de Políticas Transversais",
    shortName: "DAPT",
    level: "coordenacao",
    parent: "dijuv",
    description: "Articulação de políticas transversais e relações institucionais.",
    competencias: [
      "Articular políticas transversais",
      "Promover relações institucionais",
      "Defender direitos da juventude"
    ],
    responsavel: "Chefe de Divisão"
  }
];

const OrganogramaPage = () => {
  const [selectedUnit, setSelectedUnit] = useState<OrgUnit | null>(null);
  const [expandedUnits, setExpandedUnits] = useState<string[]>(["presidencia"]);

  const toggleExpand = (unitId: string) => {
    setExpandedUnits(prev => 
      prev.includes(unitId) 
        ? prev.filter(id => id !== unitId)
        : [...prev, unitId]
    );
  };

  const getChildren = (parentId: string) => {
    return orgUnits.filter(unit => unit.parent === parentId);
  };

  const hasChildren = (unitId: string) => {
    return orgUnits.some(unit => unit.parent === unitId);
  };

  const getLevelColor = (level: OrgUnit["level"]) => {
    switch (level) {
      case "presidencia": return "bg-primary text-primary-foreground";
      case "assessoria": return "bg-secondary text-secondary-foreground";
      case "diretoria": return "bg-accent text-accent-foreground";
      case "coordenacao": return "bg-muted text-muted-foreground border border-border";
      default: return "bg-muted";
    }
  };

  const renderOrgUnit = (unit: OrgUnit, depth: number = 0) => {
    const children = getChildren(unit.id);
    const isExpanded = expandedUnits.includes(unit.id);
    const hasChildUnits = hasChildren(unit.id);

    return (
      <div key={unit.id} className="flex flex-col items-center">
        <div 
          className={`
            relative flex items-center gap-2 px-4 py-3 rounded-lg cursor-pointer
            transition-all duration-200 hover:scale-105 hover:shadow-lg
            ${getLevelColor(unit.level)}
            ${depth > 0 ? 'mt-4' : ''}
          `}
          onClick={() => setSelectedUnit(unit)}
        >
          {hasChildUnits && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleExpand(unit.id);
              }}
              className="absolute -left-6 p-1 rounded hover:bg-black/10"
            >
              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          )}
          
          {unit.level === "presidencia" && <Building2 className="w-5 h-5" />}
          {unit.level === "assessoria" && <Shield className="w-4 h-4" />}
          {unit.level === "diretoria" && <Briefcase className="w-4 h-4" />}
          {unit.level === "coordenacao" && <FileText className="w-4 h-4" />}
          
          <div className="text-center">
            <div className="font-semibold text-sm">{unit.shortName || unit.name}</div>
            {unit.shortName && <div className="text-xs opacity-80">{unit.name}</div>}
          </div>
        </div>

        {isExpanded && children.length > 0 && (
          <div className="relative mt-4">
            {/* Vertical line from parent */}
            <div className="absolute left-1/2 -top-4 w-px h-4 bg-border" />
            
            {/* Horizontal line connecting children */}
            {children.length > 1 && (
              <div 
                className="absolute top-0 h-px bg-border"
                style={{
                  left: `calc(50% - ${(children.length - 1) * 80}px)`,
                  width: `${(children.length - 1) * 160}px`
                }}
              />
            )}
            
            <div className="flex gap-8 justify-center">
              {children.map((child, index) => (
                <div key={child.id} className="relative">
                  {/* Vertical line to child */}
                  <div className="absolute left-1/2 -top-4 w-px h-4 bg-border" />
                  {renderOrgUnit(child, depth + 1)}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const presidencia = orgUnits.find(u => u.id === "presidencia")!;

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Badge variant="outline" className="mb-4">
            <Scale className="w-3 h-3 mr-1" />
            Governança
          </Badge>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Organograma
          </h1>
          <p className="text-muted-foreground">
            Estrutura organizacional do IDJUV - Clique nas unidades para ver detalhes
          </p>
        </div>

        {/* Legenda */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4 justify-center">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-primary" />
                <span className="text-sm">Direção Superior</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-secondary" />
                <span className="text-sm">Assessoramento</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-accent" />
                <span className="text-sm">Diretorias</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-muted border" />
                <span className="text-sm">Coordenações</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Organograma Interativo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Estrutura Organizacional
            </CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <div className="min-w-[800px] py-8 flex justify-center">
              {renderOrgUnit(presidencia)}
            </div>
          </CardContent>
        </Card>

        {/* Lista de Unidades */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Unidades Organizacionais</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {orgUnits.map(unit => (
                <button
                  key={unit.id}
                  onClick={() => setSelectedUnit(unit)}
                  className={`
                    p-4 rounded-lg text-left transition-all hover:shadow-md
                    ${getLevelColor(unit.level)}
                  `}
                >
                  <div className="font-semibold">{unit.name}</div>
                  {unit.shortName && (
                    <div className="text-xs opacity-80">({unit.shortName})</div>
                  )}
                  <div className="text-xs mt-1 opacity-70 line-clamp-2">
                    {unit.description}
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Dialog de Detalhes */}
        <Dialog open={!!selectedUnit} onOpenChange={() => setSelectedUnit(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {selectedUnit?.level === "presidencia" && <Building2 className="w-5 h-5 text-primary" />}
                {selectedUnit?.level === "assessoria" && <Shield className="w-5 h-5 text-secondary" />}
                {selectedUnit?.level === "diretoria" && <Briefcase className="w-5 h-5 text-accent" />}
                {selectedUnit?.level === "coordenacao" && <FileText className="w-5 h-5 text-muted-foreground" />}
                {selectedUnit?.name}
              </DialogTitle>
              <DialogDescription>
                {selectedUnit?.description}
              </DialogDescription>
            </DialogHeader>
            
            {selectedUnit && (
              <div className="space-y-4">
                {selectedUnit.responsavel && (
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground mb-1">Responsável</h4>
                    <p>{selectedUnit.responsavel}</p>
                  </div>
                )}
                
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground mb-2">Competências</h4>
                  <ul className="space-y-2">
                    {selectedUnit.competencias.map((comp, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <span className="text-primary mt-1">•</span>
                        {comp}
                      </li>
                    ))}
                  </ul>
                </div>

                {selectedUnit.parent && (
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground mb-1">Vinculação</h4>
                    <p className="text-sm">
                      {orgUnits.find(u => u.id === selectedUnit.parent)?.name}
                    </p>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
};

export default OrganogramaPage;
