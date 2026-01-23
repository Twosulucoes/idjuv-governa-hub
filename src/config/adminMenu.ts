import {
  LayoutDashboard,
  Users,
  Building2,
  Briefcase,
  FileText,
  Settings,
  Shield,
  BarChart3,
  Plane,
  Calendar,
  Clock,
  FileCheck,
  FolderOpen,
  MapPin,
  UserCog,
  FileSpreadsheet,
  AlertTriangle,
  Eye,
  DollarSign,
  Car,
  Package,
  ShoppingCart,
  Handshake,
  Award,
  BookOpen,
  Scale,
  Network,
  ClipboardList,
  HelpCircle,
  Wallet,
  UserPlus,
  Video,
  Database,
  Megaphone,
  Image,
  type LucideIcon,
} from "lucide-react";

export interface AdminMenuItem {
  id: string;
  label: string;
  href?: string;
  icon: LucideIcon;
  children?: AdminMenuItem[];
  badge?: string | number;
  keywords?: string[]; // For search
}

export interface AdminMenuSection {
  id: string;
  label: string;
  icon: LucideIcon;
  items: AdminMenuItem[];
}

export const adminMenuConfig: AdminMenuSection[] = [
  {
    id: "dashboard",
    label: "Início",
    icon: LayoutDashboard,
    items: [
      {
        id: "admin-home",
        label: "Painel Administrativo",
        href: "/admin",
        icon: LayoutDashboard,
        keywords: ["dashboard", "painel", "início", "home"],
      },
    ],
  },
  {
    id: "cadastros",
    label: "Cadastros",
    icon: FolderOpen,
    items: [
      {
        id: "estrutura",
        label: "Estrutura Organizacional",
        icon: Building2,
        children: [
          {
            id: "organograma",
            label: "Organograma",
            href: "/organograma",
            icon: Network,
            keywords: ["organograma", "estrutura", "hierarquia"],
          },
          {
            id: "gestao-organograma",
            label: "Gestão do Organograma",
            href: "/organograma/gestao",
            icon: Settings,
            keywords: ["gestão", "organograma", "unidades"],
          },
          {
            id: "cargos",
            label: "Cargos",
            href: "/cargos",
            icon: Briefcase,
            keywords: ["cargos", "funções", "empregos"],
          },
          {
            id: "lotacoes",
            label: "Lotações",
            href: "/lotacoes",
            icon: MapPin,
            keywords: ["lotação", "alocação"],
          },
      {
        id: "designacoes",
        label: "Designações",
        href: "/rh/designacoes",
        icon: MapPin,
        keywords: ["designação", "temporária", "outro setor"],
      },
      {
        id: "portarias-rh",
        label: "Central de Portarias",
        href: "/rh/portarias",
        icon: FileSpreadsheet,
        keywords: ["portarias", "nomeação", "exoneração", "designação", "atos", "publicação"],
      },
        ],
      },
      {
        id: "unidades-locais",
        label: "Unidades Locais",
        icon: Building2,
        children: [
          {
            id: "gestao-unidades",
            label: "Gestão de Unidades",
            href: "/unidades",
            icon: Building2,
            keywords: ["unidades", "locais", "ginásios", "estádios", "parques", "piscinas"],
          },
          {
            id: "relatorios-unidades",
            label: "Relatórios de Unidades",
            href: "/unidades/relatorios",
            icon: BarChart3,
            keywords: ["relatórios", "unidades", "acervo", "patrimônio"],
          },
          {
            id: "cedencia-unidades",
            label: "Cedências e Termos",
            href: "/unidades/cedencia",
            icon: FileText,
            keywords: ["cedência", "termos", "cessão", "agendamentos"],
          },
        ],
      },
      {
        id: "documentos",
        label: "Documentos",
        href: "/admin/documentos",
        icon: FileText,
        keywords: ["documentos", "arquivos", "portarias"],
      },
    ],
  },
  {
    id: "pessoas",
    label: "Pessoas",
    icon: Users,
    items: [
      {
        id: "pre-cadastros",
        label: "Pré-Cadastros",
        href: "/admin/pre-cadastros",
        icon: UserPlus,
        keywords: ["pré-cadastro", "curriculo", "candidatos", "admissão", "mini-currículo"],
      },
      {
        id: "reunioes",
        label: "Reuniões",
        href: "/admin/reunioes",
        icon: Video,
        keywords: ["reunião", "reuniões", "convocação", "ata", "pauta", "participantes"],
      },
      {
        id: "servidores",
        label: "Servidores",
        icon: Users,
        children: [
          {
            id: "lista-servidores",
            label: "Lista de Servidores",
            href: "/rh/servidores",
            icon: Users,
            keywords: ["servidores", "funcionários", "colaboradores", "lista"],
          },
          {
            id: "novo-servidor",
            label: "Novo Servidor",
            href: "/rh/servidores/novo",
            icon: UserCog,
            keywords: ["novo", "servidor", "cadastrar", "adicionar"],
          },
        ],
      },
      {
        id: "aniversariantes",
        label: "Aniversariantes",
        href: "/rh/aniversariantes",
        icon: Calendar,
        keywords: ["aniversário", "aniversariantes", "parabéns", "nascimento", "comunicação"],
      },
      {
        id: "ferias",
        label: "Férias",
        href: "/rh/ferias",
        icon: Calendar,
        keywords: ["férias", "descanso", "recesso"],
      },
      {
        id: "licencas",
        label: "Licenças",
        href: "/rh/licencas",
        icon: Clock,
        keywords: ["licença", "afastamento", "ausência"],
      },
      {
        id: "frequencia",
        label: "Gestão de Frequência",
        href: "/rh/frequencia",
        icon: Clock,
        keywords: ["frequência", "ponto", "faltas", "atestado", "presença"],
      },
      {
        id: "viagens",
        label: "Viagens e Diárias",
        href: "/rh/viagens",
        icon: Plane,
        keywords: ["viagem", "diárias", "missão"],
      },
      {
        id: "modelos-documentos",
        label: "Modelos de Documentos",
        href: "/rh/modelos",
        icon: FileText,
        keywords: ["modelos", "documentos", "formulários", "pdf", "download"],
      },
      {
        id: "usuarios",
        label: "Usuários do Sistema",
        icon: UserCog,
        children: [
          {
            id: "usuarios-servidores",
            label: "Gerenciar Usuários",
            href: "/admin/usuarios",
            icon: Users,
            keywords: ["usuários", "acesso", "permissões", "login"],
          },
          {
            id: "usuarios-tecnicos",
            label: "Usuários Técnicos",
            href: "/admin/usuarios-tecnicos",
            icon: Settings,
            keywords: ["técnicos", "manutenção", "suporte", "desenvolvedor"],
          },
        ],
      },
      {
        id: "folha-pagamento",
        label: "Folha de Pagamento",
        icon: Wallet,
        children: [
          {
            id: "gestao-folha",
            label: "Gestão de Folhas",
            href: "/folha/gestao",
            icon: FileSpreadsheet,
            keywords: ["folha", "pagamento", "salário", "remuneração"],
          },
          {
            id: "configuracao-folha",
            label: "Configuração",
            href: "/folha/configuracao",
            icon: Settings,
            keywords: ["configuração", "folha", "rubricas", "parâmetros"],
          },
        ],
      },
    ],
  },
  {
    id: "processos",
    label: "Processos",
    icon: ClipboardList,
    items: [
      {
        id: "compras",
        label: "Compras e Contratos",
        href: "/processos/compras",
        icon: ShoppingCart,
        keywords: ["compras", "contratos", "licitação"],
      },
      {
        id: "diarias",
        label: "Diárias e Viagens",
        href: "/processos/diarias",
        icon: Plane,
        keywords: ["diárias", "viagens", "deslocamento"],
      },
      {
        id: "patrimonio",
        label: "Patrimônio",
        href: "/processos/patrimonio",
        icon: Package,
        keywords: ["patrimônio", "bens", "inventário"],
      },
      {
        id: "convenios",
        label: "Convênios e Parcerias",
        href: "/processos/convenios",
        icon: Handshake,
        keywords: ["convênios", "parcerias", "acordos"],
      },
      {
        id: "almoxarifado",
        label: "Almoxarifado",
        href: "/processos/almoxarifado",
        icon: Package,
        keywords: ["almoxarifado", "estoque", "materiais"],
      },
      {
        id: "veiculos",
        label: "Veículos",
        href: "/processos/veiculos",
        icon: Car,
        keywords: ["veículos", "frota", "transporte"],
      },
      {
        id: "pagamentos",
        label: "Pagamentos",
        href: "/processos/pagamentos",
        icon: DollarSign,
        keywords: ["pagamentos", "financeiro", "despesas"],
      },
    ],
  },
  {
    id: "governanca",
    label: "Governança",
    icon: Scale,
    items: [
      {
        id: "lei-criacao",
        label: "Lei de Criação",
        href: "/governanca/lei-criacao",
        icon: FileText,
        keywords: ["lei", "criação", "instituição"],
      },
      {
        id: "decreto",
        label: "Decreto Regulamentador",
        href: "/governanca/decreto",
        icon: FileCheck,
        keywords: ["decreto", "regulamento", "norma"],
      },
      {
        id: "regimento",
        label: "Regimento Interno",
        href: "/governanca/regimento",
        icon: BookOpen,
        keywords: ["regimento", "interno", "normas"],
      },
      {
        id: "portarias",
        label: "Portarias",
        href: "/governanca/portarias",
        icon: FileSpreadsheet,
        keywords: ["portarias", "atos", "normativos"],
      },
      {
        id: "matriz-raci",
        label: "Matriz RACI",
        href: "/governanca/matriz-raci",
        icon: BarChart3,
        keywords: ["matriz", "raci", "responsabilidades"],
      },
      {
        id: "relatorio-governanca",
        label: "Relatório de Governança",
        href: "/governanca/relatorio",
        icon: FileText,
        keywords: ["relatório", "governança", "anual"],
      },
    ],
  },
  {
    id: "integridade",
    label: "Integridade",
    icon: Shield,
    items: [
      {
        id: "denuncias",
        label: "Canal de Denúncias",
        href: "/integridade/denuncias",
        icon: AlertTriangle,
        keywords: ["denúncias", "ouvidoria", "reclamações"],
      },
      {
        id: "gestao-denuncias",
        label: "Gestão de Denúncias",
        href: "/integridade/gestao-denuncias",
        icon: Shield,
        keywords: ["gestão", "denúncias", "tratamento"],
      },
    ],
  },
  {
    id: "transparencia",
    label: "Transparência",
    icon: Eye,
    items: [
      {
        id: "cargos-remuneracao",
        label: "Cargos e Remuneração",
        href: "/transparencia/cargos",
        icon: DollarSign,
        keywords: ["cargos", "remuneração", "salários"],
      },
    ],
  },
  {
    id: "programas",
    label: "Programas",
    icon: Award,
    items: [
      {
        id: "bolsa-atleta",
        label: "Bolsa Atleta",
        href: "/programas/bolsa-atleta",
        icon: Award,
        keywords: ["bolsa", "atleta", "esporte"],
      },
      {
        id: "juventude-cidada",
        label: "Juventude Cidadã",
        href: "/programas/juventude-cidada",
        icon: Users,
        keywords: ["juventude", "cidadania"],
      },
      {
        id: "esporte-comunidade",
        label: "Esporte na Comunidade",
        href: "/programas/esporte-comunidade",
        icon: Award,
        keywords: ["esporte", "comunidade"],
      },
      {
        id: "jovem-empreendedor",
        label: "Jovem Empreendedor",
        href: "/programas/jovem-empreendedor",
        icon: Briefcase,
        keywords: ["jovem", "empreendedor", "negócios"],
      },
      {
        id: "jogos-escolares",
        label: "Jogos Escolares",
        href: "/programas/jogos-escolares",
        icon: Award,
        keywords: ["jogos", "escolares", "competição"],
      },
    ],
  },
  {
    id: "ascom",
    label: "ASCOM",
    icon: Megaphone,
    items: [
      {
        id: "demandas-ascom",
        label: "Gestão de Demandas",
        href: "/admin/ascom/demandas",
        icon: ClipboardList,
        keywords: ["ascom", "demandas", "comunicação", "cobertura", "arte", "mídia"],
      },
      {
        id: "nova-demanda-ascom",
        label: "Nova Demanda",
        href: "/admin/ascom/demandas/nova",
        icon: FileText,
        keywords: ["nova", "demanda", "solicitação", "ascom"],
      },
    ],
  },
  {
    id: "relatorios",
    label: "Relatórios",
    icon: BarChart3,
    items: [
      {
        id: "relatorios-rh",
        label: "Relatórios de RH",
        href: "/rh/relatorios",
        icon: FileSpreadsheet,
        keywords: ["relatórios", "rh", "pessoal"],
      },
      {
        id: "exportar-planilha",
        label: "Exportar Planilha",
        href: "/rh/exportar",
        icon: FileSpreadsheet,
        keywords: ["exportar", "planilha", "excel", "csv", "servidores", "dados"],
      },
      {
        id: "relatorios-unidades",
        label: "Relatórios de Unidades",
        href: "/unidades/relatorios",
        icon: Building2,
        keywords: ["relatórios", "unidades", "acervo", "patrimônio", "esportivas"],
      },
      {
        id: "relatorio-admin",
        label: "Relatório Admin (Indicação)",
        href: "/admin/relatorio",
        icon: Shield,
        keywords: ["admin", "indicação", "portarias", "telefone", "restrito"],
      },
    ],
  },
  {
    id: "formularios",
    label: "Formulários",
    icon: FileText,
    items: [
      {
        id: "termo-demanda",
        label: "Termo de Demanda",
        href: "/formularios/termo-demanda",
        icon: FileText,
        keywords: ["termo", "demanda", "solicitação"],
      },
      {
        id: "ordem-missao",
        label: "Ordem de Missão",
        href: "/formularios/ordem-missao",
        icon: Plane,
        keywords: ["ordem", "missão", "viagem"],
      },
      {
        id: "relatorio-viagem",
        label: "Relatório de Viagem",
        href: "/formularios/relatorio-viagem",
        icon: FileCheck,
        keywords: ["relatório", "viagem"],
      },
      {
        id: "requisicao-material",
        label: "Requisição de Material",
        href: "/formularios/requisicao-material",
        icon: Package,
        keywords: ["requisição", "material", "almoxarifado"],
      },
      {
        id: "termo-responsabilidade",
        label: "Termo de Responsabilidade",
        href: "/formularios/termo-responsabilidade",
        icon: FileCheck,
        keywords: ["termo", "responsabilidade", "patrimônio"],
      },
    ],
  },
  {
    id: "configuracoes",
    label: "Configurações",
    icon: Settings,
    items: [
      {
        id: "controle-acesso",
        label: "Controle de Acesso",
        href: "/admin/acesso",
        icon: Shield,
        keywords: ["controle", "acesso", "permissões"],
      },
      {
        id: "database-schema",
        label: "Visualização do Banco",
        href: "/admin/database",
        icon: Database,
        keywords: ["banco", "dados", "tabelas", "schema", "relacionamentos", "diagrama", "erd"],
      },
    ],
  },
  {
    id: "ajuda",
    label: "Ajuda",
    icon: HelpCircle,
    items: [
      {
        id: "tutoriais",
        label: "Tutoriais e Guias",
        href: "/admin/ajuda",
        icon: BookOpen,
        keywords: ["ajuda", "tutorial", "guia", "como fazer", "passo a passo"],
      },
    ],
  },
];

// Helper function to get all searchable items
export function getAllSearchableItems(): Array<{
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  section: string;
  keywords: string[];
  breadcrumb: string[];
}> {
  const items: Array<{
    id: string;
    label: string;
    href: string;
    icon: LucideIcon;
    section: string;
    keywords: string[];
    breadcrumb: string[];
  }> = [];

  const processItem = (
    item: AdminMenuItem,
    section: string,
    breadcrumb: string[]
  ) => {
    if (item.href) {
      items.push({
        id: item.id,
        label: item.label,
        href: item.href,
        icon: item.icon,
        section,
        keywords: item.keywords || [],
        breadcrumb: [...breadcrumb, item.label],
      });
    }
    if (item.children) {
      item.children.forEach((child) =>
        processItem(child, section, [...breadcrumb, item.label])
      );
    }
  };

  adminMenuConfig.forEach((section) => {
    section.items.forEach((item) => {
      processItem(item, section.label, [section.label]);
    });
  });

  return items;
}

// Helper function to find breadcrumb for a path
export function getBreadcrumbForPath(path: string): Array<{ label: string; href?: string }> {
  const breadcrumb: Array<{ label: string; href?: string }> = [
    { label: "Admin", href: "/admin" },
  ];

  const findPath = (
    items: AdminMenuItem[],
    sectionLabel: string,
    parentPath: Array<{ label: string; href?: string }>
  ): boolean => {
    for (const item of items) {
      if (item.href === path) {
        breadcrumb.push(...parentPath);
        breadcrumb.push({ label: item.label });
        return true;
      }
      if (item.children) {
        const newPath = item.href
          ? [...parentPath, { label: item.label, href: item.href }]
          : [...parentPath, { label: item.label }];
        if (findPath(item.children, sectionLabel, newPath)) {
          return true;
        }
      }
    }
    return false;
  };

  for (const section of adminMenuConfig) {
    if (findPath(section.items, section.label, [{ label: section.label }])) {
      break;
    }
  }

  return breadcrumb;
}
