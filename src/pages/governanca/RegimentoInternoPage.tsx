import { ModuleLayout } from "@/components/layout/ModuleLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { FileText, Scale, BookOpen, Users, Building2, Briefcase, Shield, AlertTriangle } from "lucide-react";

const RegimentoInternoPage = () => {
  return (
    <ModuleLayout module="governanca">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <Badge variant="outline" className="mb-4">
            <Scale className="w-3 h-3 mr-1" />
            Governança
          </Badge>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Regimento Interno
          </h1>
          <p className="text-muted-foreground">
            Normas de organização e funcionamento do IDJUV
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader className="bg-primary/5">
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              Regimento Interno do IDJUV
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-blue-800 text-sm">
                <strong>Status:</strong> Minuta em fase de aprovação pela Presidência e posterior publicação no DOE.
              </p>
            </div>

            <Tabs defaultValue="titulo1" className="w-full">
              <TabsList className="flex-wrap h-auto gap-1 mb-6">
                <TabsTrigger value="titulo1" className="text-xs">Título I</TabsTrigger>
                <TabsTrigger value="titulo2" className="text-xs">Título II</TabsTrigger>
                <TabsTrigger value="titulo3" className="text-xs">Título III</TabsTrigger>
                <TabsTrigger value="titulo4" className="text-xs">Título IV</TabsTrigger>
                <TabsTrigger value="titulo5" className="text-xs">Título V</TabsTrigger>
                <TabsTrigger value="titulo6" className="text-xs">Título VI</TabsTrigger>
              </TabsList>

              <TabsContent value="titulo1">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Building2 className="w-5 h-5" />
                      Título I – Da Natureza, Finalidade e Competência
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="prose prose-slate max-w-none">
                    <Accordion type="single" collapsible className="w-full">
                      <AccordionItem value="cap1">
                        <AccordionTrigger>Capítulo I – Da Natureza e Finalidade</AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-4 text-sm">
                            <p><strong>Art. 1º</strong> O Instituto de Desporto, Juventude e Lazer – IDJUV é uma autarquia estadual, dotada de personalidade jurídica de direito público, patrimônio próprio e autonomia administrativa e financeira, vinculada à Secretaria de Estado de Esporte e Lazer – SEEL.</p>
                            
                            <p><strong>Art. 2º</strong> O IDJUV tem por finalidade:</p>
                            <ul className="list-disc pl-6 space-y-1">
                              <li>I – Planejar, coordenar, executar e avaliar a política estadual de esporte, juventude e lazer;</li>
                              <li>II – Promover o desenvolvimento do esporte educacional, de participação e de rendimento;</li>
                              <li>III – Fomentar atividades de lazer e recreação para a população;</li>
                              <li>IV – Implementar políticas públicas voltadas à juventude;</li>
                              <li>V – Administrar os equipamentos esportivos e de lazer do Estado;</li>
                              <li>VI – Captar recursos e estabelecer parcerias para o desenvolvimento de suas atividades.</li>
                            </ul>
                            
                            <p><strong>Art. 3º</strong> O IDJUV tem sede e foro na capital do Estado de Roraima, com atuação em todo o território estadual.</p>
                          </div>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="cap2">
                        <AccordionTrigger>Capítulo II – Da Competência</AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-4 text-sm">
                            <p><strong>Art. 4º</strong> Compete ao IDJUV:</p>
                            <ul className="list-disc pl-6 space-y-1">
                              <li>I – Elaborar e executar o Plano Estadual de Esporte, Juventude e Lazer;</li>
                              <li>II – Promover eventos esportivos, recreativos e de lazer;</li>
                              <li>III – Apoiar tecnicamente os municípios na implementação de políticas esportivas;</li>
                              <li>IV – Manter cadastro atualizado de entidades esportivas;</li>
                              <li>V – Celebrar convênios, contratos e parcerias;</li>
                              <li>VI – Administrar recursos do Fundo Estadual de Esporte;</li>
                              <li>VII – Promover a formação e capacitação de profissionais;</li>
                              <li>VIII – Outras atribuições correlatas.</li>
                            </ul>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="titulo2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      Título II – Da Estrutura Organizacional
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="prose prose-slate max-w-none">
                    <Accordion type="single" collapsible className="w-full">
                      <AccordionItem value="cap1">
                        <AccordionTrigger>Capítulo I – Dos Órgãos</AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-4 text-sm">
                            <p><strong>Art. 5º</strong> A estrutura organizacional do IDJUV compreende:</p>
                            
                            <p><strong>I – Órgão de Direção Superior:</strong></p>
                            <ul className="list-disc pl-6">
                              <li>a) Presidência</li>
                            </ul>
                            
                            <p><strong>II – Órgãos de Assessoramento:</strong></p>
                            <ul className="list-disc pl-6">
                              <li>a) Gabinete da Presidência</li>
                              <li>b) Assessoria Jurídica</li>
                              <li>c) Assessoria de Comunicação</li>
                              <li>d) Controle Interno</li>
                            </ul>
                            
                            <p><strong>III – Órgãos de Execução Programática:</strong></p>
                            <ul className="list-disc pl-6">
                              <li>a) Diretoria de Esporte</li>
                              <li>b) Diretoria de Juventude e Lazer</li>
                            </ul>
                            
                            <p><strong>IV – Órgão de Apoio Administrativo:</strong></p>
                            <ul className="list-disc pl-6">
                              <li>a) Diretoria Administrativa e Financeira – DIRAF</li>
                            </ul>
                          </div>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="cap2">
                        <AccordionTrigger>Capítulo II – Da Presidência</AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-4 text-sm">
                            <p><strong>Art. 6º</strong> A Presidência é o órgão máximo de direção do IDJUV, exercida pelo Presidente, de livre nomeação e exoneração pelo Governador do Estado.</p>
                            
                            <p><strong>Art. 7º</strong> Compete ao Presidente:</p>
                            <ul className="list-disc pl-6 space-y-1">
                              <li>I – Representar o Instituto judicial e extrajudicialmente;</li>
                              <li>II – Dirigir, coordenar e supervisionar as atividades do Instituto;</li>
                              <li>III – Ordenar despesas e autorizar pagamentos;</li>
                              <li>IV – Celebrar contratos, convênios e parcerias;</li>
                              <li>V – Nomear e exonerar ocupantes de cargos em comissão;</li>
                              <li>VI – Designar servidores para funções gratificadas;</li>
                              <li>VII – Aprovar o planejamento estratégico e operacional;</li>
                              <li>VIII – Submeter ao Secretário de Estado relatórios de gestão;</li>
                              <li>IX – Editar portarias, instruções normativas e ordens de serviço;</li>
                              <li>X – Exercer outras atribuições inerentes ao cargo.</li>
                            </ul>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="titulo3">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Briefcase className="w-5 h-5" />
                      Título III – Dos Cargos e Funções
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="prose prose-slate max-w-none">
                    <Accordion type="single" collapsible className="w-full">
                      <AccordionItem value="cap1">
                        <AccordionTrigger>Capítulo I – Dos Cargos em Comissão</AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-4 text-sm">
                            <p><strong>Art. 15.</strong> Os cargos em comissão do IDJUV são de livre nomeação e exoneração, observados os requisitos legais.</p>
                            
                            <p><strong>Art. 16.</strong> Os ocupantes de cargos em comissão devem possuir:</p>
                            <ul className="list-disc pl-6">
                              <li>I – Idoneidade moral e reputação ilibada;</li>
                              <li>II – Capacidade técnica para o exercício do cargo;</li>
                              <li>III – Notória experiência profissional, quando exigido.</li>
                            </ul>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="titulo4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Título IV – Do Regime de Trabalho
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">Conteúdo em elaboração.</p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="titulo5">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Shield className="w-5 h-5" />
                      Título V – Do Patrimônio e Finanças
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">Conteúdo em elaboração.</p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="titulo6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5" />
                      Título VI – Das Disposições Finais
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">Conteúdo em elaboração.</p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </ModuleLayout>
  );
};

export default RegimentoInternoPage;
