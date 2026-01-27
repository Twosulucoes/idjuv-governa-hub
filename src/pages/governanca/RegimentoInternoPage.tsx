import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { FileText, Scale, BookOpen, Users, Building2, Briefcase, Shield, AlertTriangle } from "lucide-react";

const RegimentoInternoPage = () => {
  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
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

                      <AccordionItem value="cap3">
                        <AccordionTrigger>Capítulo III – Da Diretoria Administrativa e Financeira</AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-4 text-sm">
                            <p><strong>Art. 8º</strong> A Diretoria Administrativa e Financeira – DIRAF é responsável pela gestão dos recursos humanos, materiais, patrimoniais, orçamentários e financeiros do Instituto.</p>
                            
                            <p><strong>Art. 9º</strong> Compete à DIRAF:</p>
                            <ul className="list-disc pl-6 space-y-1">
                              <li>I – Elaborar a proposta orçamentária anual;</li>
                              <li>II – Executar o orçamento e controlar a execução financeira;</li>
                              <li>III – Gerenciar a folha de pagamento;</li>
                              <li>IV – Administrar o patrimônio e o almoxarifado;</li>
                              <li>V – Conduzir processos de aquisição e contratação;</li>
                              <li>VI – Fiscalizar contratos administrativos;</li>
                              <li>VII – Manter atualizados os registros contábeis;</li>
                              <li>VIII – Elaborar prestações de contas;</li>
                              <li>IX – Gerenciar a frota de veículos;</li>
                              <li>X – Exercer outras atribuições correlatas.</li>
                            </ul>
                            
                            <p><strong>Art. 10.</strong> A DIRAF compreende as seguintes coordenações:</p>
                            <ul className="list-disc pl-6">
                              <li>I – Coordenação de Recursos Humanos</li>
                              <li>II – Coordenação de Orçamento e Finanças</li>
                              <li>III – Coordenação de Compras e Contratos</li>
                              <li>IV – Coordenação de Patrimônio e Almoxarifado</li>
                            </ul>
                          </div>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="cap4">
                        <AccordionTrigger>Capítulo IV – Das Diretorias Técnicas</AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-4 text-sm">
                            <p><strong>Art. 11.</strong> A Diretoria de Esporte é responsável pelo planejamento e execução das políticas de desenvolvimento esportivo.</p>
                            
                            <p><strong>Art. 12.</strong> Compete à Diretoria de Esporte:</p>
                            <ul className="list-disc pl-6 space-y-1">
                              <li>I – Formular políticas de esporte educacional, de participação e de rendimento;</li>
                              <li>II – Promover eventos e competições esportivas;</li>
                              <li>III – Apoiar a formação de atletas;</li>
                              <li>IV – Administrar equipamentos esportivos;</li>
                              <li>V – Articular com federações e entidades esportivas.</li>
                            </ul>
                            
                            <p><strong>Art. 13.</strong> A Diretoria de Juventude e Lazer é responsável pelas políticas voltadas à juventude e atividades de lazer.</p>
                            
                            <p><strong>Art. 14.</strong> Compete à Diretoria de Juventude e Lazer:</p>
                            <ul className="list-disc pl-6 space-y-1">
                              <li>I – Formular políticas públicas para juventude;</li>
                              <li>II – Promover atividades de lazer e recreação;</li>
                              <li>III – Fomentar a participação juvenil;</li>
                              <li>IV – Desenvolver programas de inclusão social;</li>
                              <li>V – Articular com conselhos e movimentos juvenis.</li>
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

                      <AccordionItem value="cap2">
                        <AccordionTrigger>Capítulo II – Das Substituições</AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-4 text-sm">
                            <p><strong>Art. 17.</strong> Os ocupantes de cargos de direção serão substituídos, em suas faltas e impedimentos, por servidores previamente designados.</p>
                            
                            <p><strong>Art. 18.</strong> O Presidente será substituído pelo Diretor Administrativo e Financeiro nas ausências e impedimentos eventuais.</p>
                            
                            <p><strong>Art. 19.</strong> A substituição superior a 30 dias dependerá de ato do Governador do Estado.</p>
                          </div>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="cap3">
                        <AccordionTrigger>Capítulo III – Das Atribuições Comuns</AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-4 text-sm">
                            <p><strong>Art. 20.</strong> São atribuições comuns aos dirigentes:</p>
                            <ul className="list-disc pl-6 space-y-1">
                              <li>I – Cumprir e fazer cumprir as normas legais e regulamentares;</li>
                              <li>II – Zelar pela disciplina e eficiência do serviço;</li>
                              <li>III – Propor medidas de melhoria dos processos;</li>
                              <li>IV – Elaborar relatórios de atividades;</li>
                              <li>V – Colaborar com os demais setores;</li>
                              <li>VI – Atender às solicitações dos órgãos de controle.</li>
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
                      Título IV – Dos Atos Administrativos
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="prose prose-slate max-w-none">
                    <Accordion type="single" collapsible className="w-full">
                      <AccordionItem value="cap1">
                        <AccordionTrigger>Capítulo I – Dos Instrumentos Normativos</AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-4 text-sm">
                            <p><strong>Art. 21.</strong> São instrumentos normativos do IDJUV:</p>
                            <ul className="list-disc pl-6 space-y-1">
                              <li>I – Portaria: ato de competência do Presidente para regulamentar matérias de caráter geral;</li>
                              <li>II – Instrução Normativa: ato de competência do Presidente ou Diretores para disciplinar procedimentos;</li>
                              <li>III – Ordem de Serviço: ato de competência dos dirigentes para organização interna;</li>
                              <li>IV – Despacho: manifestação em processos administrativos;</li>
                              <li>V – Parecer: opinião técnica fundamentada.</li>
                            </ul>
                          </div>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="cap2">
                        <AccordionTrigger>Capítulo II – Da Delegação de Competência</AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-4 text-sm">
                            <p><strong>Art. 22.</strong> O Presidente poderá delegar competências aos Diretores, mediante portaria, exceto:</p>
                            <ul className="list-disc pl-6">
                              <li>I – Edição de atos normativos;</li>
                              <li>II – Nomeação e exoneração de cargos;</li>
                              <li>III – Celebração de contratos e convênios de valor superior ao limite estabelecido;</li>
                              <li>IV – Representação institucional de alto nível.</li>
                            </ul>
                            
                            <p><strong>Art. 23.</strong> A delegação especificará as matérias e poderes transferidos, sendo sempre revogável.</p>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="titulo5">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Shield className="w-5 h-5" />
                      Título V – Do Regime Disciplinar
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="prose prose-slate max-w-none">
                    <Accordion type="single" collapsible className="w-full">
                      <AccordionItem value="cap1">
                        <AccordionTrigger>Capítulo I – Dos Deveres</AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-4 text-sm">
                            <p><strong>Art. 24.</strong> São deveres dos servidores do IDJUV:</p>
                            <ul className="list-disc pl-6 space-y-1">
                              <li>I – Exercer com zelo e dedicação as atribuições do cargo;</li>
                              <li>II – Ser leal às instituições;</li>
                              <li>III – Observar as normas legais e regulamentares;</li>
                              <li>IV – Cumprir as ordens superiores, salvo quando manifestamente ilegais;</li>
                              <li>V – Atender com presteza ao público;</li>
                              <li>VI – Guardar sigilo sobre assuntos da repartição;</li>
                              <li>VII – Zelar pela economia do material e conservação do patrimônio;</li>
                              <li>VIII – Manter conduta compatível com a moralidade administrativa.</li>
                            </ul>
                          </div>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="cap2">
                        <AccordionTrigger>Capítulo II – Das Proibições</AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-4 text-sm">
                            <p><strong>Art. 25.</strong> Ao servidor é proibido:</p>
                            <ul className="list-disc pl-6 space-y-1">
                              <li>I – Ausentar-se do serviço durante o expediente sem prévia autorização;</li>
                              <li>II – Recusar fé a documentos públicos;</li>
                              <li>III – Opor resistência injustificada ao andamento de processos;</li>
                              <li>IV – Promover manifestação de apreço ou desapreço no recinto da repartição;</li>
                              <li>V – Cometer a pessoa estranha à repartição o desempenho de atribuição do cargo;</li>
                              <li>VI – Valer-se do cargo para lograr proveito pessoal;</li>
                              <li>VII – Exercer atividade incompatível com o cargo;</li>
                              <li>VIII – Receber propina, comissão, presente ou vantagem indevida.</li>
                            </ul>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
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
                  <CardContent className="prose prose-slate max-w-none">
                    <div className="space-y-4 text-sm">
                      <p><strong>Art. 26.</strong> Os casos omissos neste Regimento serão resolvidos pelo Presidente, ouvida a Assessoria Jurídica quando necessário.</p>
                      
                      <p><strong>Art. 27.</strong> As disposições deste Regimento poderão ser complementadas por Instruções Normativas e Portarias.</p>
                      
                      <p><strong>Art. 28.</strong> Compete ao Controle Interno acompanhar o cumprimento deste Regimento e propor atualizações.</p>
                      
                      <p><strong>Art. 29.</strong> Este Regimento entra em vigor na data de sua publicação no Diário Oficial do Estado.</p>
                      
                      <div className="mt-6 p-4 bg-muted rounded-lg">
                        <h4 className="font-semibold mb-2">Referências Normativas</h4>
                        <ul className="text-sm space-y-1">
                          <li>• Lei Complementar Estadual nº 053/2001</li>
                          <li>• Lei nº 2.301, de 29 de dezembro de 2025 (Criação do IDJuv)</li>
                          <li>• Decreto nº 39.840-E, de 23 de janeiro de 2026 (Regulamentação)</li>
                          <li>• Lei Estadual nº 053/2001 (Estatuto dos Servidores)</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default RegimentoInternoPage;
