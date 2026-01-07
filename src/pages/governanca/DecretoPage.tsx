import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Scale, Calendar, Building2 } from "lucide-react";

const DecretoPage = () => {
  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Badge variant="outline" className="mb-4">
            <Scale className="w-3 h-3 mr-1" />
            Governança
          </Badge>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Decreto Regulamentador
          </h1>
          <p className="text-muted-foreground">
            Regulamentação da estrutura organizacional e funcionamento do IDJUV
          </p>
        </div>

        <Card className="mb-8">
          <CardHeader className="bg-primary/5">
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Decreto Estadual de Regulamentação do IDJUV
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 prose prose-slate max-w-none">
            <div className="flex items-center gap-4 mb-6 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                Aguardando publicação
              </span>
              <span className="flex items-center gap-1">
                <Building2 className="w-4 h-4" />
                Governo do Estado de Roraima
              </span>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
              <p className="text-amber-800 text-sm">
                <strong>Nota:</strong> O Decreto Regulamentador encontra-se em fase de elaboração, 
                aguardando a aprovação do Projeto de Lei nº 290/25 que cria o IDJUV.
              </p>
            </div>

            <h2 className="text-xl font-semibold mt-6 mb-4">Estrutura Prevista do Decreto</h2>
            
            <p className="mb-4">
              O Decreto Regulamentador estabelecerá as normas complementares para o funcionamento 
              do Instituto de Desporto, Juventude e Lazer – IDJUV, conforme previsto no art. 10 
              do Projeto de Lei nº 290/25.
            </p>

            <h3 className="text-lg font-semibold mt-6 mb-3">Capítulo I – Disposições Preliminares</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Definição do objeto e âmbito de aplicação</li>
              <li>Vinculação à Secretaria de Estado de Esporte e Lazer</li>
              <li>Sede e foro do Instituto</li>
              <li>Natureza jurídica de autarquia estadual</li>
            </ul>

            <h3 className="text-lg font-semibold mt-6 mb-3">Capítulo II – Da Estrutura Organizacional</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Órgãos de direção superior: Presidência</li>
              <li>Órgãos de assessoramento: Gabinete e Assessorias</li>
              <li>Órgãos de execução programática: Diretorias Técnicas</li>
              <li>Órgãos de apoio administrativo: DIRAF</li>
            </ul>

            <h3 className="text-lg font-semibold mt-6 mb-3">Capítulo III – Das Competências</h3>
            <p className="mb-4">Detalhamento das atribuições de cada unidade organizacional:</p>
            
            <div className="grid md:grid-cols-2 gap-4 mt-4">
              <Card className="border-l-4 border-l-primary">
                <CardContent className="pt-4">
                  <h4 className="font-semibold mb-2">Presidência</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Representação institucional</li>
                    <li>• Gestão estratégica</li>
                    <li>• Ordenação de despesas</li>
                    <li>• Celebração de contratos e convênios</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-secondary">
                <CardContent className="pt-4">
                  <h4 className="font-semibold mb-2">Diretoria Administrativa e Financeira</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Gestão orçamentária e financeira</li>
                    <li>• Recursos humanos</li>
                    <li>• Patrimônio e almoxarifado</li>
                    <li>• Compras e contratos</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-accent">
                <CardContent className="pt-4">
                  <h4 className="font-semibold mb-2">Diretoria de Esporte</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Políticas esportivas</li>
                    <li>• Eventos e competições</li>
                    <li>• Formação de atletas</li>
                    <li>• Gestão de equipamentos esportivos</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-primary">
                <CardContent className="pt-4">
                  <h4 className="font-semibold mb-2">Diretoria de Juventude e Lazer</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Políticas para juventude</li>
                    <li>• Programas de lazer</li>
                    <li>• Inclusão social</li>
                    <li>• Articulação intersetorial</li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            <h3 className="text-lg font-semibold mt-6 mb-3">Capítulo IV – Do Quadro de Pessoal</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Cargos em comissão e funções gratificadas</li>
              <li>Quadro de servidores efetivos</li>
              <li>Cessão de servidores de outros órgãos</li>
              <li>Contratação temporária quando necessário</li>
            </ul>

            <h3 className="text-lg font-semibold mt-6 mb-3">Capítulo V – Do Patrimônio e Recursos</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Dotações orçamentárias do Estado</li>
              <li>Recursos de convênios e parcerias</li>
              <li>Receitas próprias</li>
              <li>Doações e legados</li>
              <li>Bens móveis e imóveis transferidos</li>
            </ul>

            <h3 className="text-lg font-semibold mt-6 mb-3">Capítulo VI – Das Disposições Finais</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Prazo para elaboração do Regimento Interno</li>
              <li>Sucessão de direitos e obrigações</li>
              <li>Casos omissos</li>
              <li>Vigência do Decreto</li>
            </ul>

            <div className="mt-8 p-4 bg-muted rounded-lg">
              <h4 className="font-semibold mb-2">Base Legal</h4>
              <ul className="text-sm space-y-1">
                <li>• Constituição Estadual de Roraima</li>
                <li>• Lei Complementar Estadual nº 053/2001 (Organização Administrativa)</li>
                <li>• Projeto de Lei nº 290/25 (Criação do IDJUV)</li>
                <li>• Lei Federal nº 14.133/2021 (Licitações e Contratos)</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default DecretoPage;
