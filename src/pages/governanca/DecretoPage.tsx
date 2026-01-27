import { Link } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { FileText, Scale, Calendar, Building2, Download, ArrowLeft, ExternalLink } from "lucide-react";
import { useDadosOficiais } from "@/hooks/useDadosOficiais";

const DecretoPage = () => {
  const { obterValor } = useDadosOficiais();

  const handleDownload = () => {
    window.open('/documentos/DOE_5091_23-01-2026_Decreto_39840-E.pdf', '_blank');
  };

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-3 text-sm mb-6 text-muted-foreground">
          <Link to="/" className="hover:underline hover:text-foreground">Início</Link>
          <span>/</span>
          <Link to="/governanca" className="hover:underline hover:text-foreground">Governança</Link>
          <span>/</span>
          <span className="text-foreground">Decreto Regulamentador</span>
        </div>

        <div className="mb-8">
          <Badge variant="outline" className="mb-4">
            <Scale className="w-3 h-3 mr-1" />
            Governança
          </Badge>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Decreto Regulamentador
          </h1>
          <p className="text-muted-foreground">
            {obterValor('decreto_regulamentacao')}
          </p>
        </div>

        <Card className="mb-8">
          <CardHeader className="bg-primary/5 flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Decreto nº 39.840-E, de 23 de janeiro de 2026
            </CardTitle>
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="w-4 h-4 mr-2" />
              Baixar PDF
            </Button>
          </CardHeader>
          <CardContent className="pt-6 prose prose-slate max-w-none">
            <div className="flex items-center gap-4 mb-6 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                23 de janeiro de 2026
              </span>
              <span className="flex items-center gap-1">
                <Building2 className="w-4 h-4" />
                Governo do Estado de Roraima
              </span>
            </div>

            <div className="bg-muted/50 rounded-lg p-6 mb-6 text-center">
              <p className="text-sm text-muted-foreground mb-1">ESTADO DE RORAIMA</p>
              <p className="text-lg font-serif font-bold">DECRETO Nº 39.840-E, DE 23 DE JANEIRO DE 2026</p>
              <p className="text-xs text-muted-foreground mt-2">
                Publicado no DOE Edição nº 5091 de 23/01/2026
              </p>
            </div>

            <p className="italic text-muted-foreground mb-6">
              Estabelece as medidas constitutivas regulamentares do Instituto de Desporto, 
              Juventude e Lazer do Estado de Roraima – IDJuv.
            </p>

            <p className="mb-4">
              <strong>O GOVERNADOR DO ESTADO DE RORAIMA</strong>, no uso das atribuições que lhe conferem 
              o artigo 12 e o parágrafo único do artigo 4º da Lei nº 2.301, de 29 de dezembro de 2025, <strong>DECRETA:</strong>
            </p>

            <Separator className="my-6" />

            <h2 className="text-xl font-semibold mt-6 mb-4">CAPÍTULO I – DAS DISPOSIÇÕES GERAIS</h2>
            
            <p className="mb-4">
              <strong>Art. 1º</strong> O Instituto de Desporto, Juventude e Lazer do Estado de Roraima – IDJuv 
              será regido pela sua norma constitutiva, a Lei nº 2.301, de 29 de dezembro de 2025, 
              pelas disposições do presente Decreto e pelo seu Regimento Interno.
            </p>

            <Separator className="my-6" />

            <h2 className="text-xl font-semibold mt-6 mb-4">CAPÍTULO II – DO FUNCIONAMENTO, DAS ATRIBUIÇÕES E DAS RESPONSABILIDADES</h2>
            
            <h3 className="text-lg font-semibold mt-6 mb-3">Seção I – Do Funcionamento das Unidades Administrativas</h3>
            <p className="mb-4">
              <strong>Art. 2º</strong> As unidades administrativas do Instituto de Desporto, Juventude e Lazer 
              do Estado de Roraima – IDJuv funcionarão conforme o disposto neste Decreto e no Regimento Interno 
              da referida Autarquia.
            </p>

            <h3 className="text-lg font-semibold mt-6 mb-3">Seção II – Das Atribuições e das Responsabilidades das Unidades Administrativas</h3>
            
            <p className="mb-2"><strong>Art. 3º</strong> Compete ao Presidente do IDJuv:</p>
            <ol className="list-[upper-roman] pl-6 space-y-1 mb-4 text-sm">
              <li>cumprir e fazer cumprir a legislação aplicável à IDJuv, bem como as deliberações de suas unidades administrativas;</li>
              <li>dirigir, coordenar, supervisionar, controlar e avaliar as atividades do IDJuv;</li>
              <li>formular as políticas e diretrizes básicas do IDJuv, a programação anual de suas atividades e fixar prioridades;</li>
              <li>apreciar e aprovar planos, programas e projetos apresentados pelas diversas unidades do IDJuv;</li>
              <li>articular-se com organismos públicos e/ou privados, estaduais, nacionais, estrangeiros e internacionais, objetivando o cumprimento das finalidades do IDJuv;</li>
              <li>coordenar a elaboração do programa de trabalho e da proposta orçamentária anual e plurianual do IDJuv e suas alterações;</li>
              <li>coordenar a elaboração das propostas de Regimento, bem como alterações de seus dispositivos;</li>
              <li>estabelecer critérios para contratação de serviços de terceiros;</li>
              <li>administrar os recursos financeiros do IDJuv;</li>
              <li>coordenar ações operacionais da Autarquia, com vista à obtenção de sua autossustentação financeira;</li>
              <li>elaborar, na forma e prazo definidos na legislação específica, a prestação de contas, os demonstrativos orçamentários, financeiros, patrimonial e o relatório das atividades do IDJuv;</li>
              <li>elaborar o Quadro de Pessoal da Autarquia, o Plano de Cargos e Salários e suas alterações;</li>
              <li>coordenar as atividades de comunicação social;</li>
              <li>encaminhar à Secretaria Estadual de Educação e Desporto relatórios periódicos referentes às atividades do IDJuv.</li>
            </ol>

            <p className="mb-2"><strong>Art. 4º</strong> Compete ao Diretor Administrativo e Financeiro:</p>
            <p className="text-sm mb-2 pl-4">I – por meio da Divisão de Recursos Humanos (DRH):</p>
            <ol className="list-[lower-alpha] pl-10 space-y-1 mb-2 text-sm">
              <li>propor normas relativas à área de pessoal;</li>
              <li>processar, examinar e expedir todos os atos, certificados, certidões e documentos relativos aos servidores;</li>
              <li>promover o recrutamento, seleção e avaliação de pessoal;</li>
              <li>elaborar a folha de pagamento de pessoal e recolhimento das obrigações trabalhistas e previdenciárias;</li>
              <li>organizar e manter atualizado o registro de atos referentes a vida funcional dos servidores;</li>
              <li>coordenar programas de estágio para estudantes de nível médio e superior.</li>
            </ol>
            <p className="text-sm mb-2 pl-4">II – por meio da Divisão Administrativa e de Gestão Patrimonial (DiAGP):</p>
            <ol className="list-[lower-alpha] pl-10 space-y-1 mb-2 text-sm">
              <li>elaborar cronograma de aquisição de material;</li>
              <li>receber, conferir e guardar o material adquirido;</li>
              <li>atender às requisições de material e efetuar controle físico e financeiro;</li>
              <li>promover o cadastro e tombamento dos bens móveis e imóveis;</li>
              <li>coordenar os serviços de transporte, controlando o uso da frota;</li>
              <li>promover a publicação dos atos e documentos do IDJuv.</li>
            </ol>
            <p className="text-sm mb-2 pl-4">III – por meio da Divisão de Contabilidade, Orçamento e Finanças (DiCOF):</p>
            <ol className="list-[lower-alpha] pl-10 space-y-1 mb-4 text-sm">
              <li>efetuar e controlar arrecadações e pagamentos;</li>
              <li>controlar as contas a receber e a pagar;</li>
              <li>executar a escrituração contábil e proceder a contabilidade orçamentária, financeira e patrimonial;</li>
              <li>elaborar balancetes e balanços orçamentários, financeiros e patrimoniais.</li>
            </ol>

            <p className="mb-2"><strong>Art. 5º</strong> Compete ao Diretor de Esporte:</p>
            <ol className="list-[upper-roman] pl-6 space-y-1 mb-4 text-sm">
              <li>coordenar a edição, a execução e o monitoramento das políticas, programas e projetos esportivos da Autarquia, assegurando sua conformidade com os eixos educacional, participativo e de alto rendimento;</li>
              <li>promover o desenvolvimento técnico das modalidades, acompanhar o desempenho das ações nas regiões do Estado e articular parcerias com federações, clubes e entidades esportivas;</li>
              <li>propor iniciativas e diretrizes que fortaleçam a prática esportiva;</li>
              <li>outras competências pertinentes, definidas no Regimento Interno.</li>
            </ol>

            <p className="mb-2"><strong>Art. 6º</strong> Compete ao Diretor da Juventude:</p>
            <ol className="list-[upper-roman] pl-6 space-y-1 mb-4 text-sm">
              <li>coordenar a edição, a execução e o monitoramento das políticas, programas e projetos da Autarquia voltados às ações temáticas de Políticas da Juventude;</li>
              <li>outras competências pertinentes, definidas no Regimento Interno.</li>
            </ol>

            <p className="mb-2"><strong>Art. 7º</strong> Compete ao Assessor Jurídico:</p>
            <ol className="list-[upper-roman] pl-6 space-y-1 mb-4 text-sm">
              <li>prestar assessoramento jurídico à Presidência e às unidades administrativas do IDJuv;</li>
              <li>emitir pareceres jurídicos sobre contratos, convênios, licitações, atos normativos e processos administrativos;</li>
              <li>zelar pela legalidade, constitucionalidade e regimentalidade dos atos administrativos;</li>
              <li>outras competências pertinentes, definidas no Regimento Interno.</li>
            </ol>

            <p className="mb-2"><strong>Art. 8º</strong> Compete ao Assessor Especial:</p>
            <ol className="list-[upper-roman] pl-6 space-y-1 mb-4 text-sm">
              <li>assessorar a Presidência em matérias estratégicas, técnicas ou institucionais de elevada complexidade;</li>
              <li>elaborar estudos, notas técnicas e relatórios especiais para subsidiar decisões superiores;</li>
              <li>apoiar a articulação interinstitucional com órgãos governamentais e entidades da sociedade civil;</li>
              <li>desempenhar outras atribuições correlatas determinadas pelo Presidente;</li>
              <li>outras competências pertinentes, definidas no Regimento Interno.</li>
            </ol>

            <p className="mb-2"><strong>Art. 9º</strong> Compete ao Agente de Contratação:</p>
            <ol className="list-[upper-roman] pl-6 space-y-1 mb-4 text-sm">
              <li>conduzir os procedimentos de contratação pública, desde a fase preparatória até a adjudicação;</li>
              <li>elaborar e revisar documentos do processo de contratação;</li>
              <li>analisar propostas, lances e documentos de habilitação dos licitantes;</li>
              <li>zelar pela observância dos princípios da legalidade, isonomia, transparência e eficiência nas contratações;</li>
              <li>outras competências pertinentes, definidas no Regimento Interno.</li>
            </ol>

            <p className="mb-2"><strong>Art. 10.</strong> Compete ao Chefe de Controle Interno:</p>
            <ol className="list-[upper-roman] pl-6 space-y-1 mb-4 text-sm">
              <li>avaliar a legalidade, legitimidade e economicidade dos atos de gestão administrativa e financeira;</li>
              <li>fiscalizar a execução orçamentária, financeira e patrimonial do Instituto;</li>
              <li>emitir relatórios e recomendações visando ao aperfeiçoamento dos controles internos;</li>
              <li>apoiar os órgãos de controle externo e atender às suas diligências;</li>
              <li>outras competências pertinentes, definidas no Regimento Interno.</li>
            </ol>

            <p className="mb-2"><strong>Art. 11.</strong> Compete ao Assessor de Comunicação:</p>
            <ol className="list-[upper-roman] pl-6 space-y-1 mb-4 text-sm">
              <li>planejar e executar a política de comunicação institucional do IDJuv;</li>
              <li>produzir conteúdos informativos sobre programas, projetos e ações do Instituto;</li>
              <li>gerenciar a relação com a imprensa e os canais oficiais de comunicação;</li>
              <li>zelar pela transparência e pela correta divulgação das ações institucionais;</li>
              <li>outras competências pertinentes, definidas no Regimento Interno.</li>
            </ol>

            <p className="mb-2"><strong>Art. 12.</strong> Compete ao Chefe de Gabinete:</p>
            <ol className="list-[upper-roman] pl-6 space-y-1 mb-4 text-sm">
              <li>coordenar a representação social e política do Presidente do IDJuv;</li>
              <li>assistir ao Presidente em sua representação e contato com o público e organismos oficiais;</li>
              <li>organizar, preparar e encaminhar o expediente do IDJuv;</li>
              <li>orientar, supervisionar e controlar as atividades do Gabinete;</li>
              <li>coordenar o fluxo de informações e as relações de interesse do IDJuv;</li>
              <li>exercer outras atribuições pertinentes ao cargo.</li>
            </ol>

            <p className="mb-2"><strong>Art. 13.</strong> Compete ao Pregoeiro:</p>
            <ol className="list-[upper-roman] pl-6 space-y-1 mb-4 text-sm">
              <li>conduzir sessões públicas de pregão eletrônico ou presencial;</li>
              <li>receber, analisar e julgar propostas e lances, bem como verificar a habilitação dos licitantes;</li>
              <li>elaborar atas, relatórios e demais documentos decorrentes dos procedimentos de pregão;</li>
              <li>atuar em conformidade com as normas legais e orientações da autoridade competente;</li>
              <li>outras competências pertinentes, definidas no Regimento Interno.</li>
            </ol>

            <p className="mb-2"><strong>Art. 14.</strong> Compete ao Chefe de Divisão:</p>
            <ol className="list-[upper-roman] pl-6 space-y-1 mb-4 text-sm">
              <li>coordenar e supervisionar as atividades técnicas e administrativas da divisão;</li>
              <li>executar as diretrizes estabelecidas pela diretoria à qual está vinculada;</li>
              <li>controlar prazos, metas e resultados das ações desenvolvidas;</li>
              <li>elaborar relatórios e prestar informações à instância superior;</li>
              <li>outras competências pertinentes, definidas no Regimento Interno.</li>
            </ol>

            <p className="mb-2"><strong>Art. 15.</strong> Compete ao Assistente Técnico:</p>
            <ol className="list-[upper-roman] pl-6 space-y-1 mb-4 text-sm">
              <li>prestar apoio técnico e administrativo às unidades organizacionais do IDJuv;</li>
              <li>auxiliar na elaboração de relatórios, pareceres, planilhas e documentos técnicos;</li>
              <li>organizar informações, dados e processos necessários à execução das atividades institucionais;</li>
              <li>executar outras atividades correlatas determinadas pela chefia imediata;</li>
              <li>outras competências pertinentes, definidas no Regimento Interno.</li>
            </ol>

            <p className="mb-2"><strong>Art. 16.</strong> Compete ao Membro da Comissão de Contratação:</p>
            <ol className="list-[upper-roman] pl-6 space-y-1 mb-4 text-sm">
              <li>planejar, coordenar e executar os procedimentos de contratação pública do IDJuv;</li>
              <li>elaborar termos de referência, editais, atas e demais documentos do processo licitatório;</li>
              <li>conduzir sessões públicas e analisar propostas e habilitações;</li>
              <li>zelar pela observância dos princípios da legalidade, impessoalidade, moralidade, publicidade e eficiência;</li>
              <li>outras competências pertinentes, definidas no Regimento Interno.</li>
            </ol>

            <p className="mb-2"><strong>Art. 17.</strong> Compete à Secretária da Presidência:</p>
            <ol className="list-[upper-roman] pl-6 space-y-1 mb-4 text-sm">
              <li>assessorar administrativamente o Presidente no desempenho de suas atribuições;</li>
              <li>organizar agendas, compromissos oficiais, reuniões e despachos da Presidência;</li>
              <li>redigir, controlar e arquivar expedientes, documentos e correspondências oficiais;</li>
              <li>manter fluxo adequado de informações entre a Presidência e as demais unidades do IDJuv;</li>
              <li>outras competências pertinentes, definidas no Regimento Interno.</li>
            </ol>

            <p className="mb-2"><strong>Art. 18.</strong> Compete ao Chefe de Núcleo:</p>
            <ol className="list-[upper-roman] pl-6 space-y-1 mb-4 text-sm">
              <li>executar atividades operacionais e técnicas específicas do núcleo;</li>
              <li>apoiar a divisão na implementação de programas, projetos e rotinas administrativas;</li>
              <li>organizar documentos, dados e informações sob sua responsabilidade;</li>
              <li>cumprir e fazer cumprir normas e procedimentos internos;</li>
              <li>outras competências pertinentes, definidas no Regimento Interno.</li>
            </ol>

            <p className="mb-2"><strong>Art. 19.</strong> Compete à Secretária da Diretoria:</p>
            <ol className="list-[upper-roman] pl-6 space-y-1 mb-4 text-sm">
              <li>prestar apoio administrativo às diretorias do IDJuv;</li>
              <li>organizar agendas, reuniões e expedientes da diretoria à qual estiver vinculada;</li>
              <li>elaborar, registrar e arquivar documentos, atas e relatórios administrativos;</li>
              <li>controlar prazos, demandas e fluxos de processos sob responsabilidade da diretoria.</li>
            </ol>

            <p className="mb-2"><strong>Art. 20.</strong> Compete ao Chefe de Unidade Local:</p>
            <ol className="list-[upper-roman] pl-6 space-y-1 mb-4 text-sm">
              <li>coordenar e supervisionar as atividades administrativas e operacionais da unidade local;</li>
              <li>executar, no âmbito local, os programas, projetos e ações do IDJuv;</li>
              <li>articular com a administração central para o cumprimento das diretrizes institucionais;</li>
              <li>elaborar relatórios de atividades e prestar informações à instância superior;</li>
              <li>outras competências pertinentes, definidas no Regimento Interno.</li>
            </ol>

            <p className="mb-4">
              <strong>Art. 21.</strong> O Regimento Interno definirá e detalhará outras responsabilidades das unidades administrativas.
            </p>

            <Separator className="my-6" />

            <h2 className="text-xl font-semibold mt-6 mb-4">CAPÍTULO III – DOS DEMAIS ATOS CONSTITUTIVOS REGULAMENTARES</h2>
            
            <p className="mb-4">
              <strong>Art. 22.</strong> Os demais atos constitutivos regulamentares que se fizerem necessários estarão 
              consignados no Regimento Interno do IDJuv, sendo autorizado ao Presidente da Autarquia a edição de 
              Portaria para tratar da regulação pós-constitutiva.
            </p>

            <Separator className="my-6" />

            <h2 className="text-xl font-semibold mt-6 mb-4">CAPÍTULO IV – DAS DISPOSIÇÕES FINAIS</h2>
            
            <p className="mb-4">
              <strong>Art. 23.</strong> O Regimento Interno disporá sobre o afastamento e as substituições nos cargos 
              em comissão, detalhando as eventuais medidas necessárias e os reflexos financeiros inerentes, 
              sejam eles compensatórios ou não.
            </p>

            <p className="mb-4">
              <strong>Art. 24.</strong> O Presidente do IDJuv poderá constituir, mediante Portaria, grupos de trabalho 
              para o desenvolvimento de projetos e atividades específicas, estabelecendo sua finalidade, prazo de 
              duração e atribuições dos respectivos titulares.
            </p>

            <p className="mb-4">
              <strong>Art. 25.</strong> O Presidente do IDJuv será nomeado pelo Governador do Estado de Roraima.
            </p>

            <p className="mb-4">
              <strong>Art. 26.</strong> Os titulares dos cargos em comissão do IDJuv serão nomeados e exonerados 
              mediante Portaria do seu Presidente.
            </p>

            <p className="mb-4">
              <strong>Art. 27.</strong> Os recursos financeiros do IDJuv serão depositados em instituição bancária 
              credenciada pelo Governo do Estado de Roraima, salvo condições em contrário expressas em contrato ou convênio.
            </p>

            <p className="mb-4">
              <strong>Art. 28.</strong> As dúvidas de aplicação e os casos omissos neste Decreto serão dirimidos pela 
              interpretação sistemática e teleológica do mesmo em conjunto com o Regimento Interno à luz da norma 
              constitucional vigente.
            </p>

            <div className="bg-muted/50 rounded-lg p-4 mt-6 text-center">
              <p className="text-sm">Palácio Senador Hélio Campos/RR, 23 de janeiro de 2026.</p>
              <p className="font-semibold mt-2">ANTONIO DENARIUM</p>
              <p className="text-sm text-muted-foreground">Governador do Estado de Roraima</p>
            </div>

            {/* Card de documentos relacionados */}
            <div className="not-prose bg-accent/10 rounded-lg p-4 mt-6">
              <h3 className="font-semibold text-base mb-3">Documentos Relacionados</h3>
              <div className="space-y-2">
                <a 
                  href="/documentos/LEI_2301_29-12-2025.pdf" 
                  target="_blank" 
                  className="flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <FileText className="w-4 h-4" />
                  Lei nº 2.301/2025 - Lei de Criação do IDJuv
                  <ExternalLink className="w-3 h-3" />
                </a>
                <a 
                  href="/documentos/DOE_5084_12-01-2026_Nomeacao_Presidente.pdf" 
                  target="_blank" 
                  className="flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <FileText className="w-4 h-4" />
                  Decreto nº 86-P - Nomeação do Presidente
                  <ExternalLink className="w-3 h-3" />
                </a>
                <a 
                  href="/documentos/DOE_5085_13-01-2026_Portaria_001_Nomeacoes.pdf" 
                  target="_blank" 
                  className="flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <FileText className="w-4 h-4" />
                  Portaria nº 001/2026 - Nomeações de Cargos
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Voltar */}
        <div className="mt-8">
          <Button asChild variant="outline">
            <Link to="/governanca">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar para Governança
            </Link>
          </Button>
        </div>
      </div>
    </MainLayout>
  );
};

export default DecretoPage;
