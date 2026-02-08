import { Link } from "react-router-dom";
import { ModuleLayout } from "@/components/layout/ModuleLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { FileText, Scale, Calendar, Building2, Download, ExternalLink } from "lucide-react";
import { useDadosOficiais } from "@/hooks/useDadosOficiais";

const DecretoPage = () => {
  const { obterValor } = useDadosOficiais();

  const handleDownload = () => {
    window.open('/documentos/DOE_5091_23-01-2026_Decreto_39840-E.pdf', '_blank');
  };

  return (
    <ModuleLayout module="governanca">
      <div className="max-w-4xl mx-auto">
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

            <Separator className="my-6" />

            <h2 className="text-xl font-semibold mt-6 mb-4">CAPÍTULO III – DAS DISPOSIÇÕES FINAIS</h2>
            
            <p className="mb-4">
              <strong>Art. 19.</strong> Este Decreto entra em vigor na data de sua publicação.
            </p>

            <div className="bg-muted/50 rounded-lg p-4 mt-6 text-center">
              <p className="text-sm">Palácio Senador Hélio Campos, em 23 de janeiro de 2026.</p>
              <p className="font-semibold mt-2">ANTONIO DENARIUM</p>
              <p className="text-sm text-muted-foreground">Governador do Estado de Roraima</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </ModuleLayout>
  );
};

export default DecretoPage;
