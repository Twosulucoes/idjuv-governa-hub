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

            <h2 className="text-xl font-semibold mt-6 mb-4">CAPÍTULO I - DAS DISPOSIÇÕES GERAIS</h2>
            
            <p className="mb-4">
              <strong>Art. 1º</strong> O Instituto de Desporto, Juventude e Lazer do Estado de Roraima – IDJuv 
              será regido pela sua norma constitutiva, a Lei nº 2.301, de 29 de dezembro de 2025, 
              pelas disposições do presente Decreto e pelo seu Regimento Interno.
            </p>

            <Separator className="my-6" />

            <h2 className="text-xl font-semibold mt-6 mb-4">CAPÍTULO II - DA ESTRUTURA ORGANIZACIONAL</h2>
            
            <p className="mb-4">
              <strong>Art. 2º</strong> A estrutura organizacional do IDJuv, conforme estabelecida no art. 4º 
              da Lei nº 2.301/2025, compreende:
            </p>

            <div className="grid md:grid-cols-2 gap-4 mt-4">
              <Card className="border-l-4 border-l-primary">
                <CardContent className="pt-4">
                  <h4 className="font-semibold mb-2">I - Administração Superior</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Presidência</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-secondary">
                <CardContent className="pt-4">
                  <h4 className="font-semibold mb-2">II - Assessoramento</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Chefia de Gabinete</li>
                    <li>• Assessoria Jurídica</li>
                    <li>• Assessoria Especial</li>
                    <li>• Controle Interno</li>
                    <li>• Comissão de Contratação</li>
                    <li>• Assessoria de Comunicação (ASCOM)</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-accent">
                <CardContent className="pt-4">
                  <h4 className="font-semibold mb-2">III - Execução Instrumental</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• <strong>DIRAF</strong> - Diretoria Administrativa e Financeira
                      <ul className="pl-4 mt-1">
                        <li>- DiCOF (Contabilidade, Orçamento e Finanças)</li>
                        <li>- DiAGP (Administrativa e Gestão Patrimonial)</li>
                        <li>- DiGP (Gestão de Pessoas)</li>
                      </ul>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-primary">
                <CardContent className="pt-4">
                  <h4 className="font-semibold mb-2">IV - Execução Programática</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• <strong>DiEsp</strong> - Diretoria de Esporte
                      <ul className="pl-4 mt-1">
                        <li>- DiPDCL (Desporto Comunitário, Lazer)</li>
                        <li>- DiDAR (Alto Rendimento)</li>
                        <li>- DiEspE (Esporte Educacional)</li>
                      </ul>
                    </li>
                    <li className="mt-2">• <strong>DiJuv</strong> - Diretoria da Juventude
                      <ul className="pl-4 mt-1">
                        <li>- DiDIT (Desenvolvimento, Inovação e Tecnologia)</li>
                        <li>- DiPPJ (Políticas Públicas para Juventude)</li>
                      </ul>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            <Separator className="my-6" />

            <h2 className="text-xl font-semibold mt-6 mb-4">CAPÍTULO III - DAS COMPETÊNCIAS</h2>

            <h3 className="text-lg font-semibold mt-6 mb-3">Seção I - Da Presidência</h3>
            <p className="mb-4">
              <strong>Art. 3º</strong> Compete ao Presidente do IDJuv:
            </p>
            <ul className="list-[upper-roman] pl-6 space-y-2">
              <li>representar o IDJuv judicial e extrajudicialmente;</li>
              <li>dirigir, coordenar e supervisionar as atividades do Instituto;</li>
              <li>ordenar despesas e autorizar pagamentos;</li>
              <li>celebrar contratos, convênios e acordos;</li>
              <li>nomear e exonerar servidores ocupantes de cargos em comissão;</li>
              <li>aprovar o Regimento Interno;</li>
              <li>exercer outras atribuições previstas em lei.</li>
            </ul>

            <h3 className="text-lg font-semibold mt-6 mb-3">Seção II - Das Diretorias</h3>
            <p className="mb-4">
              <strong>Art. 4º</strong> As competências específicas de cada Diretoria e suas Divisões 
              serão detalhadas no Regimento Interno do IDJuv.
            </p>

            <Separator className="my-6" />

            <h2 className="text-xl font-semibold mt-6 mb-4">CAPÍTULO IV - DAS DISPOSIÇÕES FINAIS</h2>
            
            <p className="mb-4">
              <strong>Art. 5º</strong> O IDJuv deverá elaborar e aprovar seu Regimento Interno 
              no prazo de 90 (noventa) dias a contar da publicação deste Decreto.
            </p>

            <p className="mb-4">
              <strong>Art. 6º</strong> Este Decreto entra em vigor na data de sua publicação.
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

            <div className="mt-8 p-4 bg-muted rounded-lg">
              <h4 className="font-semibold mb-2">Base Legal</h4>
              <ul className="text-sm space-y-1">
                <li>• Constituição Estadual de Roraima, art. 62</li>
                <li>• Lei nº 2.301, de 29 de dezembro de 2025 (Criação do IDJuv)</li>
                <li>• Lei Complementar Estadual nº 053/2001 (Organização Administrativa)</li>
              </ul>
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
