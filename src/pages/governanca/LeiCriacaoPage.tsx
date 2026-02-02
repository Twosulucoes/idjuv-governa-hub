import { Link } from "react-router-dom";
import { FileText, ArrowLeft, Download, BookOpen, ExternalLink } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useDadosOficiais } from "@/hooks/useDadosOficiais";

export default function LeiCriacaoPage() {
  const { obterValor } = useDadosOficiais();
  
  const handleDownload = () => {
    window.open('/documentos/LEI_2301_29-12-2025.pdf', '_blank');
  };

  return (
    <MainLayout>
      {/* Cabeçalho */}
      <section className="bg-primary text-primary-foreground py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 text-sm mb-4 opacity-80">
            <Link to="/" className="hover:underline">Início</Link>
            <span>/</span>
            <Link to="/governanca" className="hover:underline">Governança</Link>
            <span>/</span>
            <span>Lei de Criação</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-accent rounded-xl flex items-center justify-center">
              <FileText className="w-8 h-8 text-accent-foreground" />
            </div>
            <div>
              <h1 className="font-serif text-3xl lg:text-4xl font-bold">Lei de Criação</h1>
              <p className="opacity-90 mt-1">
                {obterValor('lei_criacao')} - Criação do IDJuv
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Conteúdo */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Texto Integral
                </CardTitle>
                <Button variant="outline" size="sm" onClick={handleDownload}>
                  <Download className="w-4 h-4 mr-2" />
                  Baixar PDF
                </Button>
              </CardHeader>
              <CardContent className="prose prose-sm max-w-none">
                <div className="bg-muted/50 rounded-lg p-6 mb-6 text-center">
                  <p className="text-sm text-muted-foreground mb-1">ESTADO DE RORAIMA</p>
                  <p className="text-lg font-serif font-bold">LEI Nº 2.301, DE 29 DE DEZEMBRO DE 2025</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Publicada no DOE Edição nº 5076 de 29/12/2025
                  </p>
                </div>

                <p className="italic text-muted-foreground">
                  Dispõe sobre a criação do Instituto de Desporto, Juventude e Lazer do Estado 
                  de Roraima – IDJuv no âmbito da Estrutura Organizacional do Poder Executivo 
                  Estadual, e dá outras providências.
                </p>

                <p><strong>O GOVERNADOR DO ESTADO DE RORAIMA:</strong></p>
                <p>Faço saber que a Assembleia Legislativa aprovou e eu sanciono a seguinte Lei:</p>

                <Separator className="my-6" />

                <h2 className="font-serif text-xl font-bold">CAPÍTULO I - DA NATUREZA, DA FINALIDADE E DOS OBJETIVOS</h2>
                
                <h3 className="font-semibold mt-6">Seção I - Da Natureza</h3>
                <p>
                  <strong>Art. 1º</strong> - Fica criado no âmbito da Estrutura Organizacional do Poder 
                  Executivo Estadual, o Instituto de Desporto, Juventude e Lazer do Estado de 
                  Roraima – IDJuv; entidade autárquica com personalidade jurídica de Direito 
                  Público, dotada de autonomia administrativa e financeira, com sede e foro 
                  nesta capital e jurisdição em todo o Estado de Roraima, com prazo de duração 
                  indeterminado.
                </p>
                <p className="text-muted-foreground text-sm pl-4 border-l-2 border-primary">
                  <strong>Parágrafo único.</strong> O IDJuv está vinculado à Secretaria de Estado da 
                  Educação e Desporto - SEED, responsável pelas políticas públicas de Educação 
                  do Estado de Roraima.
                </p>

                <h3 className="font-semibold mt-6">Seção II - Da Finalidade</h3>
                <p>
                  <strong>Art. 2º</strong> O IDJuv tem por finalidade promover, coordenar e executar 
                  políticas públicas de desporto, lazer e Juventude no Estado, visando ao 
                  desenvolvimento social, educacional, tecnológico e cultural do público-alvo, 
                  atuando em conjunto com a população e suas organizações.
                </p>
                <p className="text-muted-foreground text-sm pl-4 border-l-2 border-primary">
                  <strong>Parágrafo único.</strong> É também finalidade precípua do IDJuv, a implementação 
                  e a gestão no âmbito da Administração Pública Estadual, do Programa Estadual de 
                  Incentivo ao Esporte - ProEsporte, instituído pela Lei nº 1.859, de 18 de setembro de 2023.
                </p>

                <h3 className="font-semibold mt-6">Seção III - Dos Objetivos</h3>
                <p><strong>Art. 3º</strong> O IDJuv tem por objetivos:</p>
                <ul className="list-[upper-roman] pl-6 space-y-2">
                  <li>promover o desporto comunitário;</li>
                  <li>desenvolver a promoção de atividade física e lazer;</li>
                  <li>fomentar o esporte e a tecnologia através dos jogos eletrônicos;</li>
                  <li>executar a educação e desporto estudantil, compreendendo o esporte educacional;</li>
                  <li>promover e gerir o esporte de alto rendimento e apoiar as Organizações Esportivas;</li>
                  <li>atuar na gestão inclusiva e qualidade de vida, promovendo o esporte, o lazer, a saúde e a inclusão social através do desenvolvimento do paradesporto;</li>
                  <li>desenvolver programas, projetos e políticas voltados à Juventude;</li>
                  <li>adotar indicadores que sirvam para apresentar e medir os serviços oferecidos aos seus beneficiários; e</li>
                  <li>apoiar o associativismo e cooperativismo no âmbito de suas finalidades.</li>
                </ul>

                <Separator className="my-6" />

                <h2 className="font-serif text-xl font-bold">CAPÍTULO II - DA ESTRUTURA ORGANIZACIONAL BÁSICA</h2>
                <p><strong>Art. 4º</strong> O IDJuv tem a seguinte estrutura organizacional básica:</p>
                
                <div className="bg-muted/50 rounded-lg p-4 my-4">
                  <p className="font-semibold mb-2">I - Nível de Administração Superior:</p>
                  <ul className="list-[lower-alpha] pl-6"><li>Presidência.</li></ul>

                  <p className="font-semibold mb-2 mt-4">II - Nível de Assessoramento:</p>
                  <ul className="list-[lower-alpha] pl-6">
                    <li>Chefia de Gabinete;</li>
                    <li>Assessoria Jurídica;</li>
                    <li>Assessoria Especial;</li>
                    <li>Controle Interno;</li>
                    <li>Comissão de Contratação; e</li>
                    <li>Assessoria de Comunicação (ASCOM).</li>
                  </ul>

                  <p className="font-semibold mb-2 mt-4">III - Nível de Execução Instrumental:</p>
                  <ul className="list-decimal pl-6">
                    <li className="font-medium">Diretoria Administrativa e Financeira (DIRAF):
                      <ul className="list-[lower-alpha] pl-6 font-normal">
                        <li>Divisão de Contabilidade, Orçamento e Finanças (DiCOF):
                          <ul className="list-[lower-roman] pl-6">
                            <li>Núcleo de Contabilidade (NCONT)</li>
                            <li>Núcleo de Orçamento (NORC)</li>
                            <li>Núcleo de Finanças (NFIN)</li>
                          </ul>
                        </li>
                        <li>Divisão Administrativa e Gestão Patrimonial (DiAGP):
                          <ul className="list-[lower-roman] pl-6">
                            <li>Núcleo de Almoxarifado (NALMO)</li>
                            <li>Núcleo de Patrimônio (NPAT)</li>
                            <li>Núcleo de Transporte (NTRANS)</li>
                            <li>Núcleo de Serviços Gerais (NSG)</li>
                          </ul>
                        </li>
                        <li>Divisão de Recursos Humanos (DRH):
                          <ul className="list-[lower-roman] pl-6">
                            <li>Núcleo de Gestão de Pessoas (NGP)</li>
                            <li>Núcleo de Folha de Pagamento (NFPAG)</li>
                          </ul>
                        </li>
                        <li>Divisão de Tecnologia da Informação (DiTI):
                          <ul className="list-[lower-roman] pl-6">
                            <li>Núcleo de Infraestrutura e Suporte (NIS)</li>
                            <li>Núcleo de Sistemas e Desenvolvimento (NSD)</li>
                          </ul>
                        </li>
                      </ul>
                    </li>
                  </ul>

                  <p className="font-semibold mb-2 mt-4">IV - Nível de Execução Programática:</p>
                  <ul className="list-decimal pl-6">
                    <li className="font-medium">Diretoria de Esporte (DIESP):
                      <ul className="list-[lower-alpha] pl-6 font-normal">
                        <li>Divisão de Gestão de Esporte e Lazer (DiGEL):
                          <ul className="list-[lower-roman] pl-6">
                            <li>Núcleo de Esporte Comunitário (NEC)</li>
                            <li>Núcleo de Lazer e Recreação (NLR)</li>
                          </ul>
                        </li>
                        <li>Divisão de Esporte de Alto Rendimento (DiRE):
                          <ul className="list-[lower-roman] pl-6">
                            <li>Núcleo de Apoio a Atletas (NAA)</li>
                            <li>Núcleo de Federações e Entidades (NFE)</li>
                          </ul>
                        </li>
                        <li>Divisão de Educação e Desporto Estudantil (DiEDE):
                          <ul className="list-[lower-roman] pl-6">
                            <li>Núcleo de Jogos Escolares (NJE)</li>
                            <li>Núcleo de Formação Esportiva (NFE)</li>
                          </ul>
                        </li>
                        <li>Divisão de Gestão Inclusiva e Qualidade de Vida (DiGI):
                          <ul className="list-[lower-roman] pl-6">
                            <li>Núcleo de Paradesporto (NPAR)</li>
                            <li>Núcleo de Promoção à Saúde (NPS)</li>
                          </ul>
                        </li>
                      </ul>
                    </li>
                    <li className="font-medium mt-2">Diretoria da Juventude (DIJUV):
                      <ul className="list-[lower-alpha] pl-6 font-normal">
                        <li>Divisão de Programas e Projetos (DiPP):
                          <ul className="list-[lower-roman] pl-6">
                            <li>Núcleo de Programas de Juventude (NPJ)</li>
                            <li>Núcleo de Projetos Especiais (NPE)</li>
                          </ul>
                        </li>
                        <li>Divisão de Articulação de Políticas Transversais (DAPT):
                          <ul className="list-[lower-roman] pl-6">
                            <li>Núcleo de Articulação Intersetorial (NAI)</li>
                            <li>Núcleo de Participação Social (NPS)</li>
                          </ul>
                        </li>
                      </ul>
                    </li>
                  </ul>
                </div>

                <Separator className="my-6" />

                <h2 className="font-serif text-xl font-bold">CAPÍTULO III - DOS CARGOS</h2>
                <p><strong>Art. 5º</strong> O Quadro de Cargos de Provimento em Comissão e Funções Gratificadas do IDJuv é composto conforme o Anexo I desta Lei.</p>
                
                <p><strong>Art. 6º</strong> Os cargos de provimento em comissão são de livre nomeação e exoneração pelo Governador do Estado, mediante indicação do Presidente do IDJuv.</p>

                <h3 className="font-semibold mt-6">ANEXO I - QUADRO DE CARGOS</h3>
                
                <div className="overflow-x-auto my-4">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="bg-muted">
                        <th className="border p-2 text-left">Cargo</th>
                        <th className="border p-2 text-center">Símbolo</th>
                        <th className="border p-2 text-center">Qtd</th>
                        <th className="border p-2 text-right">Vencimento (R$)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="bg-primary/5 font-medium">
                        <td colSpan={4} className="border p-2">NÍVEL DE ADMINISTRAÇÃO SUPERIOR</td>
                      </tr>
                      <tr>
                        <td className="border p-2">Presidente</td>
                        <td className="border p-2 text-center">CDS-1</td>
                        <td className="border p-2 text-center">1</td>
                        <td className="border p-2 text-right">18.500,00</td>
                      </tr>
                      
                      <tr className="bg-primary/5 font-medium">
                        <td colSpan={4} className="border p-2">NÍVEL DE ASSESSORAMENTO</td>
                      </tr>
                      <tr>
                        <td className="border p-2">Chefe de Gabinete</td>
                        <td className="border p-2 text-center">CDS-2</td>
                        <td className="border p-2 text-center">1</td>
                        <td className="border p-2 text-right">12.000,00</td>
                      </tr>
                      <tr>
                        <td className="border p-2">Assessor Jurídico</td>
                        <td className="border p-2 text-center">CDS-3</td>
                        <td className="border p-2 text-center">1</td>
                        <td className="border p-2 text-right">10.000,00</td>
                      </tr>
                      <tr>
                        <td className="border p-2">Assessor Especial</td>
                        <td className="border p-2 text-center">CDS-3</td>
                        <td className="border p-2 text-center">2</td>
                        <td className="border p-2 text-right">10.000,00</td>
                      </tr>
                      <tr>
                        <td className="border p-2">Controlador Interno</td>
                        <td className="border p-2 text-center">CDS-4</td>
                        <td className="border p-2 text-center">1</td>
                        <td className="border p-2 text-right">8.000,00</td>
                      </tr>
                      <tr>
                        <td className="border p-2">Presidente da Comissão de Contratação</td>
                        <td className="border p-2 text-center">CDS-5</td>
                        <td className="border p-2 text-center">1</td>
                        <td className="border p-2 text-right">6.000,00</td>
                      </tr>
                      <tr>
                        <td className="border p-2">Assessor de Comunicação</td>
                        <td className="border p-2 text-center">CDS-5</td>
                        <td className="border p-2 text-center">1</td>
                        <td className="border p-2 text-right">6.000,00</td>
                      </tr>
                      
                      <tr className="bg-primary/5 font-medium">
                        <td colSpan={4} className="border p-2">NÍVEL DE EXECUÇÃO INSTRUMENTAL</td>
                      </tr>
                      <tr>
                        <td className="border p-2">Diretor Administrativo e Financeiro</td>
                        <td className="border p-2 text-center">CDS-2</td>
                        <td className="border p-2 text-center">1</td>
                        <td className="border p-2 text-right">12.000,00</td>
                      </tr>
                      <tr>
                        <td className="border p-2">Chefe de Divisão</td>
                        <td className="border p-2 text-center">CDS-5</td>
                        <td className="border p-2 text-center">4</td>
                        <td className="border p-2 text-right">6.000,00</td>
                      </tr>
                      <tr>
                        <td className="border p-2">Chefe de Núcleo</td>
                        <td className="border p-2 text-center">CDS-6</td>
                        <td className="border p-2 text-center">11</td>
                        <td className="border p-2 text-right">4.500,00</td>
                      </tr>
                      
                      <tr className="bg-primary/5 font-medium">
                        <td colSpan={4} className="border p-2">NÍVEL DE EXECUÇÃO PROGRAMÁTICA</td>
                      </tr>
                      <tr>
                        <td className="border p-2">Diretor de Esporte</td>
                        <td className="border p-2 text-center">CDS-2</td>
                        <td className="border p-2 text-center">1</td>
                        <td className="border p-2 text-right">12.000,00</td>
                      </tr>
                      <tr>
                        <td className="border p-2">Diretor da Juventude</td>
                        <td className="border p-2 text-center">CDS-2</td>
                        <td className="border p-2 text-center">1</td>
                        <td className="border p-2 text-right">12.000,00</td>
                      </tr>
                      <tr>
                        <td className="border p-2">Chefe de Divisão</td>
                        <td className="border p-2 text-center">CDS-5</td>
                        <td className="border p-2 text-center">6</td>
                        <td className="border p-2 text-right">6.000,00</td>
                      </tr>
                      <tr>
                        <td className="border p-2">Chefe de Núcleo</td>
                        <td className="border p-2 text-center">CDS-6</td>
                        <td className="border p-2 text-center">12</td>
                        <td className="border p-2 text-right">4.500,00</td>
                      </tr>
                      
                      <tr className="bg-primary/5 font-medium">
                        <td colSpan={4} className="border p-2">FUNÇÕES GRATIFICADAS</td>
                      </tr>
                      <tr>
                        <td className="border p-2">Função Gratificada - FG-1</td>
                        <td className="border p-2 text-center">FG-1</td>
                        <td className="border p-2 text-center">10</td>
                        <td className="border p-2 text-right">2.500,00</td>
                      </tr>
                      <tr>
                        <td className="border p-2">Função Gratificada - FG-2</td>
                        <td className="border p-2 text-center">FG-2</td>
                        <td className="border p-2 text-center">15</td>
                        <td className="border p-2 text-right">1.800,00</td>
                      </tr>
                      <tr>
                        <td className="border p-2">Função Gratificada - FG-3</td>
                        <td className="border p-2 text-center">FG-3</td>
                        <td className="border p-2 text-center">30</td>
                        <td className="border p-2 text-right">1.200,00</td>
                      </tr>
                      
                      <tr className="bg-muted font-semibold">
                        <td className="border p-2">TOTAL DE CARGOS E FUNÇÕES</td>
                        <td className="border p-2 text-center">-</td>
                        <td className="border p-2 text-center">98</td>
                        <td className="border p-2 text-right">-</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <Separator className="my-6" />

                <h2 className="font-serif text-xl font-bold">CAPÍTULO IV - DAS DISPOSIÇÕES FINAIS</h2>
                <p>
                  <strong>Art. 7º</strong> A regulamentação desta Lei será feita por Decreto do Poder Executivo 
                  no prazo de 30 (trinta) dias, contados da data de sua publicação.
                </p>
                <p>
                  <strong>Art. 8º</strong> As despesas decorrentes da execução desta Lei correrão à conta das 
                  dotações orçamentárias próprias, suplementadas se necessário.
                </p>
                <p>
                  <strong>Art. 9º</strong> Esta Lei entra em vigor na data de sua publicação.
                </p>

                <div className="bg-muted/50 rounded-lg p-4 my-6 text-center">
                  <p className="text-sm">Palácio Senador Hélio Campos, Boa Vista-RR, 29 de dezembro de 2025.</p>
                  <p className="font-semibold mt-2">ANTONIO DENARIUM</p>
                  <p className="text-sm text-muted-foreground">Governador do Estado de Roraima</p>
                </div>

                <Separator className="my-6" />

                {/* Card de documentos relacionados */}
                <div className="not-prose bg-accent/10 rounded-lg p-4 mt-6">
                  <h3 className="font-semibold text-base mb-3">Documentos Relacionados</h3>
                  <div className="space-y-2">
                    <a 
                      href="/documentos/DOE_5076_29-12-2025.pdf" 
                      target="_blank" 
                      className="flex items-center gap-2 text-sm text-primary hover:underline"
                    >
                      <FileText className="w-4 h-4" />
                      DOE Edição nº 5076 - Publicação da Lei
                      <ExternalLink className="w-3 h-3" />
                    </a>
                    <a 
                      href="/documentos/DOE_5091_23-01-2026_Decreto_39840-E.pdf" 
                      target="_blank" 
                      className="flex items-center gap-2 text-sm text-primary hover:underline"
                    >
                      <FileText className="w-4 h-4" />
                      Decreto nº 39.840-E - Regulamentação do IDJuv
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
        </div>
      </section>
    </MainLayout>
  );
}
