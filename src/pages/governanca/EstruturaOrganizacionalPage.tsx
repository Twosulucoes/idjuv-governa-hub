import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Building2, 
  Crown, 
  Users, 
  ArrowRight, 
  ChevronDown, 
  Network,
  Scale,
  Briefcase,
  Target,
  Layers,
  FileText,
  ArrowLeft
} from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface Nucleo {
  sigla: string;
  nome: string;
}

interface Divisao {
  nome: string;
  descricao: string;
  nucleos: string[];
}

interface Diretoria {
  nome: string;
  sigla: string;
  tipo: 'instrumental' | 'programatica';
  descricao: string;
  vinculo: string;
  divisoes: Divisao[];
}

interface ResumoData {
  ultima_atualizacao: string;
  fonte: string;
  total_cargos: number;
  estrutura_organizacional: {
    nivel_superior: { nome: string; descricao: string };
    assessoramento: { unidades: string[] };
    execucao_instrumental: { nome: string; divisoes: Divisao[] };
    execucao_programatica: { nome: string; divisoes: Divisao[] }[];
  };
  por_diretoria: Record<string, { quantidade: number; cargos: string[] }>;
}

// Descrições detalhadas dos vínculos
const DESCRICOES_VINCULOS = {
  presidencia: `A Presidência do IDJUV representa o nível de administração superior do Instituto, 
    sendo responsável pela direção geral, coordenação estratégica e representação institucional. 
    Todas as unidades de assessoramento e as diretorias estão diretamente vinculadas à Presidência.`,
  
  assessoramento: `As unidades de assessoramento são órgãos de apoio direto à Presidência, 
    responsáveis por funções técnicas especializadas como: assessoria jurídica, controle interno, 
    comunicação institucional e apoio executivo ao Presidente.`,
  
  diraf: `A Diretoria Administrativa e Financeira (DIRAF) é o órgão de execução instrumental, 
    responsável pela gestão dos meios administrativos e financeiros necessários ao funcionamento do Instituto. 
    Está diretamente vinculada à Presidência e coordena as atividades de recursos humanos, 
    contabilidade, patrimônio, tecnologia da informação e gestão documental.`,
  
  diesp: `A Diretoria de Esporte (DIESP) é um órgão de execução programática, 
    responsável pelo planejamento, coordenação e execução das políticas públicas de esporte no Estado. 
    Está diretamente vinculada à Presidência e coordena programas de esporte comunitário, 
    alto rendimento, esporte educacional e inclusão através do esporte.`,
  
  dijuv: `A Diretoria da Juventude (DIJUV) é um órgão de execução programática, 
    responsável pelo desenvolvimento e implementação de políticas públicas voltadas à juventude. 
    Está diretamente vinculada à Presidência e coordena programas de protagonismo juvenil, 
    empreendedorismo, políticas transversais e articulação com conselhos de juventude.`
};

// Mapeamento de núcleos com nomes completos
const NUCLEOS_COMPLETOS: Record<string, string> = {
  // DIRAF
  'NuPrO': 'Núcleo de Programação Orçamentária',
  'NuFI': 'Núcleo de Finanças',
  'NuCont': 'Núcleo de Contabilidade',
  'NuDoc': 'Núcleo de Documentação',
  'NuPat': 'Núcleo de Patrimônio',
  'NuAC': 'Núcleo de Almoxarifado e Compras',
  'NuP': 'Núcleo de Pessoal',
  'NuF': 'Núcleo de Folha de Pagamento',
  'NuST': 'Núcleo de Suporte Técnico',
  'NuProg': 'Núcleo de Programação e Desenvolvimento',
  // DIESP
  'NuDeC': 'Núcleo de Desporto Comunitário',
  'NuPAF': 'Núcleo de Promoção de Atividades Físicas',
  'NuRE': 'Núcleo de Rendimento Esportivo',
  'NuGAO': 'Núcleo de Gestão de Atletas Olímpicos',
  'NuED': 'Núcleo de Educação Esportiva',
  'NuBase': 'Núcleo de Esporte de Base',
  'NuInc': 'Núcleo de Inclusão',
  'NuPar': 'Núcleo de Paradesporto',
  // DIJUV
  'NAT': 'Núcleo de Apoio Técnico',
  'CRJuv': 'Centro de Referência da Juventude',
  'NuREL': 'Núcleo de Relações Institucionais',
  'NuPol': 'Núcleo de Políticas Públicas'
};

export default function EstruturaOrganizacionalPage() {
  const [resumo, setResumo] = useState<ResumoData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/data/resumo.json')
      .then(res => res.json())
      .then(data => {
        setResumo(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Erro ao carregar dados:', err);
        setLoading(false);
      });
  }, []);

  const getNucleoNome = (sigla: string) => NUCLEOS_COMPLETOS[sigla] || sigla;

  return (
    <MainLayout>
      <div className="container mx-auto py-8 px-4 max-w-6xl">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/governanca" className="hover:text-primary flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" />
            Governança
          </Link>
          <span>/</span>
          <span className="text-foreground">Estrutura Organizacional</span>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3 mb-2">
            <Building2 className="h-8 w-8 text-primary" />
            Estrutura Organizacional do IDJUV
          </h1>
          <p className="text-muted-foreground text-lg">
            Instituto de Desporto, Juventude e Lazer do Estado de Roraima
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge variant="outline" className="gap-1">
              <Scale className="h-3 w-3" />
              {resumo?.fonte || 'Lei nº 2.301/2025'}
            </Badge>
            <Badge variant="secondary" className="gap-1">
              <Users className="h-3 w-3" />
              {resumo?.total_cargos || 98} Cargos
            </Badge>
            <Link to="/organograma">
              <Badge variant="default" className="gap-1 cursor-pointer hover:bg-primary/80">
                <Network className="h-3 w-3" />
                Ver Organograma Interativo
              </Badge>
            </Link>
          </div>
        </div>

        {/* Introdução */}
        <Card className="mb-8 border-primary/20 bg-primary/5">
          <CardContent className="pt-6">
            <p className="text-foreground leading-relaxed">
              O <strong>Instituto de Desporto, Juventude e Lazer do Estado de Roraima (IDJUV)</strong> foi 
              criado pela Lei nº 2.301, de 29 de dezembro de 2025, como autarquia especial vinculada à 
              Secretaria de Estado de Desporto, Juventude e Lazer (SEDJUVEL). O IDJUV possui personalidade 
              jurídica de direito público, com autonomia administrativa, patrimonial e financeira.
            </p>
          </CardContent>
        </Card>

        {/* Níveis da Estrutura */}
        <div className="space-y-8">
          
          {/* 1. Nível de Administração Superior - Presidência */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                <Crown className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">Nível de Administração Superior</h2>
                <p className="text-sm text-muted-foreground">Presidência do IDJUV</p>
              </div>
            </div>
            
            <Card className="border-l-4 border-l-primary">
              <CardContent className="pt-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-primary" />
                      Presidência
                    </h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {DESCRICOES_VINCULOS.presidencia}
                    </p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="text-sm font-medium text-foreground mb-2">Cargos vinculados:</p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li className="flex items-center gap-2">
                        <ArrowRight className="h-3 w-3 text-primary" />
                        Presidente (Subsídio)
                      </li>
                      <li className="flex items-center gap-2">
                        <ArrowRight className="h-3 w-3 text-primary" />
                        Secretária da Presidência
                      </li>
                    </ul>
                    <p className="mt-3 text-xs text-muted-foreground">
                      Total: {resumo?.por_diretoria?.['Presidência']?.quantidade || 21} cargos
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          <Separator />

          {/* 2. Nível de Assessoramento */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                <Target className="h-5 w-5 text-secondary-foreground" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">Nível de Assessoramento</h2>
                <p className="text-sm text-muted-foreground">Unidades de apoio direto à Presidência</p>
              </div>
            </div>

            <Card className="border-l-4 border-l-secondary">
              <CardContent className="pt-6">
                <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                  {DESCRICOES_VINCULOS.assessoramento}
                </p>
                
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {resumo?.estrutura_organizacional?.assessoramento?.unidades.map((unidade, idx) => (
                    <div 
                      key={idx}
                      className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg"
                    >
                      <ChevronDown className="h-4 w-4 text-secondary rotate-[-90deg]" />
                      <span className="text-sm font-medium">{unidade}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-4 p-3 bg-secondary/10 rounded-lg border border-secondary/20">
                  <p className="text-xs text-muted-foreground flex items-center gap-2">
                    <ArrowRight className="h-3 w-3" />
                    <strong>Vínculo:</strong> Todas as unidades de assessoramento respondem diretamente à Presidência
                  </p>
                </div>
              </CardContent>
            </Card>
          </section>

          <Separator />

          {/* 3. Nível de Execução Instrumental - DIRAF */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center">
                <Layers className="h-5 w-5 text-accent-foreground" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">Nível de Execução Instrumental</h2>
                <p className="text-sm text-muted-foreground">Gestão administrativa e financeira</p>
              </div>
            </div>

            <Card className="border-l-4 border-l-accent">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Badge className="bg-accent text-accent-foreground">DIRAF</Badge>
                  Diretoria Administrativa e Financeira
                </CardTitle>
                <CardDescription>
                  {DESCRICOES_VINCULOS.diraf}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4 p-3 bg-accent/10 rounded-lg border border-accent/20">
                  <p className="text-xs text-muted-foreground flex items-center gap-2">
                    <ArrowRight className="h-3 w-3" />
                    <strong>Vínculo:</strong> Subordinada diretamente à Presidência do IDJUV
                  </p>
                </div>

                <Accordion type="multiple" className="space-y-2">
                  {resumo?.estrutura_organizacional?.execucao_instrumental?.divisoes.map((divisao, idx) => (
                    <AccordionItem key={idx} value={`diraf-${idx}`} className="border rounded-lg px-4">
                      <AccordionTrigger className="text-sm font-medium hover:no-underline">
                        <span className="flex items-center gap-2">
                          <Badge variant="outline" className="font-mono text-xs">{divisao.nome}</Badge>
                          {divisao.descricao}
                        </span>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="pl-4 py-2 space-y-2">
                          <p className="text-xs text-muted-foreground mb-2">Núcleos vinculados:</p>
                          {divisao.nucleos.map((nucleo, nIdx) => (
                            <div key={nIdx} className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span className="w-2 h-2 rounded-full bg-accent" />
                              <Badge variant="secondary" className="font-mono text-xs">{nucleo}</Badge>
                              <span className="text-xs">{getNucleoNome(nucleo)}</span>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>

                <p className="mt-4 text-xs text-muted-foreground text-right">
                  Total: {resumo?.por_diretoria?.['DIRAF']?.quantidade || 58} cargos nesta diretoria
                </p>
              </CardContent>
            </Card>
          </section>

          <Separator />

          {/* 4. Nível de Execução Programática - DIESP e DIJUV */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-full bg-highlight flex items-center justify-center">
                <Target className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">Nível de Execução Programática</h2>
                <p className="text-sm text-muted-foreground">Políticas de esporte e juventude</p>
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              {/* DIESP */}
              <Card className="border-l-4 border-l-info">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Badge className="bg-info text-primary-foreground">DIESP</Badge>
                    Diretoria de Esporte
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {DESCRICOES_VINCULOS.diesp}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-4 p-3 bg-info/10 rounded-lg border border-info/20">
                    <p className="text-xs text-muted-foreground flex items-center gap-2">
                      <ArrowRight className="h-3 w-3" />
                      <strong>Vínculo:</strong> Subordinada à Presidência
                    </p>
                  </div>

                  <Accordion type="multiple" className="space-y-2">
                    {resumo?.estrutura_organizacional?.execucao_programatica?.find(d => d.nome.includes('DIESP'))?.divisoes.map((divisao, idx) => (
                      <AccordionItem key={idx} value={`diesp-${idx}`} className="border rounded-lg px-4">
                        <AccordionTrigger className="text-sm font-medium hover:no-underline">
                          <span className="flex items-center gap-2">
                            <Badge variant="outline" className="font-mono text-xs">{divisao.nome}</Badge>
                            <span className="text-xs text-muted-foreground truncate">{divisao.descricao}</span>
                          </span>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="pl-4 py-2 space-y-2">
                            {divisao.nucleos.map((nucleo, nIdx) => (
                              <div key={nIdx} className="flex items-center gap-2 text-sm text-muted-foreground">
                                <span className="w-2 h-2 rounded-full bg-info" />
                                <Badge variant="secondary" className="font-mono text-xs">{nucleo}</Badge>
                                <span className="text-xs">{getNucleoNome(nucleo)}</span>
                              </div>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>

                  <p className="mt-4 text-xs text-muted-foreground text-right">
                    Total: {resumo?.por_diretoria?.['DIESP']?.quantidade || 13} cargos
                  </p>
                </CardContent>
              </Card>

              {/* DIJUV */}
              <Card className="border-l-4 border-l-success">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Badge className="bg-success text-primary-foreground">DIJUV</Badge>
                    Diretoria da Juventude
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {DESCRICOES_VINCULOS.dijuv}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-4 p-3 bg-success/10 rounded-lg border border-success/20">
                    <p className="text-xs text-muted-foreground flex items-center gap-2">
                      <ArrowRight className="h-3 w-3" />
                      <strong>Vínculo:</strong> Subordinada à Presidência
                    </p>
                  </div>

                  <Accordion type="multiple" className="space-y-2">
                    {resumo?.estrutura_organizacional?.execucao_programatica?.find(d => d.nome.includes('DIJUV'))?.divisoes.map((divisao, idx) => (
                      <AccordionItem key={idx} value={`dijuv-${idx}`} className="border rounded-lg px-4">
                        <AccordionTrigger className="text-sm font-medium hover:no-underline">
                          <span className="flex items-center gap-2">
                            <Badge variant="outline" className="font-mono text-xs">{divisao.nome}</Badge>
                            <span className="text-xs text-muted-foreground truncate">{divisao.descricao}</span>
                          </span>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="pl-4 py-2 space-y-2">
                            {divisao.nucleos.map((nucleo, nIdx) => (
                              <div key={nIdx} className="flex items-center gap-2 text-sm text-muted-foreground">
                                <span className="w-2 h-2 rounded-full bg-success" />
                                <Badge variant="secondary" className="font-mono text-xs">{nucleo}</Badge>
                                <span className="text-xs">{getNucleoNome(nucleo)}</span>
                              </div>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>

                  <p className="mt-4 text-xs text-muted-foreground text-right">
                    Total: {resumo?.por_diretoria?.['DIJUV']?.quantidade || 6} cargos
                  </p>
                </CardContent>
              </Card>
            </div>
          </section>
        </div>

        {/* Diagrama Visual Simplificado */}
        <Card className="mt-8 bg-muted/30">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Network className="h-5 w-5 text-primary" />
              Diagrama de Vínculos
            </CardTitle>
            <CardDescription>Representação visual da hierarquia e subordinação</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center space-y-4">
              {/* Presidência */}
              <div className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-bold text-center">
                PRESIDÊNCIA
              </div>
              <div className="w-px h-6 bg-border" />
              
              {/* Linha de Assessoramento */}
              <div className="w-full max-w-3xl">
                <div className="text-center text-xs text-muted-foreground mb-2">Assessoramento</div>
                <div className="flex justify-center flex-wrap gap-2">
                  {['Gabinete', 'Jurídico', 'ASCOM', 'Controle', 'CPL'].map((item, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">{item}</Badge>
                  ))}
                </div>
              </div>
              
              <div className="w-px h-6 bg-border" />
              
              {/* Diretorias */}
              <div className="grid grid-cols-3 gap-4 w-full max-w-3xl">
                <div className="text-center">
                  <div className="px-4 py-2 bg-accent text-accent-foreground rounded-lg font-semibold text-sm">
                    DIRAF
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Instrumental</p>
                </div>
                <div className="text-center">
                  <div className="px-4 py-2 bg-info text-primary-foreground rounded-lg font-semibold text-sm">
                    DIESP
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Programática</p>
                </div>
                <div className="text-center">
                  <div className="px-4 py-2 bg-success text-primary-foreground rounded-lg font-semibold text-sm">
                    DIJUV
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Programática</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Rodapé Legal */}
        <Card className="mt-8 border-dashed">
          <CardContent className="py-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium text-foreground">Base Legal</p>
                  <p className="text-sm text-muted-foreground">
                    Lei nº 2.301, de 29 de dezembro de 2025 — Dispõe sobre a criação do IDJUV
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Link to="/documentos/LEI_2301_25.pdf" target="_blank">
                  <Badge variant="outline" className="cursor-pointer hover:bg-muted">
                    <FileText className="h-3 w-3 mr-1" />
                    Ver Lei Completa
                  </Badge>
                </Link>
                <Link to="/transparencia/cargos">
                  <Badge variant="outline" className="cursor-pointer hover:bg-muted">
                    <Users className="h-3 w-3 mr-1" />
                    Ver Cargos
                  </Badge>
                </Link>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Última atualização: {resumo?.ultima_atualizacao || '29/12/2025'}
            </p>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
