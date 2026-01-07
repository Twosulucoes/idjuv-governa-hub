import { Link } from "react-router-dom";
import { FileText, ArrowLeft, Download, BookOpen } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export default function LeiCriacaoPage() {
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
                Projeto de Lei nº 290/2025 - Criação do IDJUV
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
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Baixar PDF
                </Button>
              </CardHeader>
              <CardContent className="prose prose-sm max-w-none">
                <div className="bg-muted/50 rounded-lg p-6 mb-6 text-center">
                  <p className="text-sm text-muted-foreground mb-1">ESTADO DE RORAIMA</p>
                  <p className="text-lg font-serif font-bold">PROJETO DE LEI Nº 290, DE 22 DE DEZEMBRO DE 2025</p>
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

                <h3 className="font-semibold mt-6">Seção III - Dos Objetivos</h3>
                <p><strong>Art. 3º</strong> O IDJuv tem por objetivos:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Planejar, coordenar e executar programas de desporto, lazer e juventude;</li>
                  <li>Promover o desporto comunitário;</li>
                  <li>Desenvolver a promoção de atividade física e lazer;</li>
                  <li>Fomentar o esporte e a tecnologia através dos jogos eletrônicos;</li>
                  <li>Executar a educação e desporto estudantil;</li>
                  <li>Promover e gerir o esporte de alto rendimento;</li>
                  <li>Atuar na gestão inclusiva e qualidade de vida;</li>
                  <li>Desenvolver programas, projetos e políticas voltados à Juventude;</li>
                  <li>Adotar indicadores de medição de serviços;</li>
                  <li>Apoiar o associativismo e cooperativismo.</li>
                </ul>

                <Separator className="my-6" />

                <h2 className="font-serif text-xl font-bold">CAPÍTULO II - DA ESTRUTURA ORGANIZACIONAL BÁSICA</h2>
                <p><strong>Art. 4º</strong> O IDJuv tem a seguinte estrutura organizacional básica:</p>
                
                <div className="bg-muted/50 rounded-lg p-4 my-4">
                  <p className="font-semibold mb-2">I - Nível de Administração Superior:</p>
                  <ul className="list-disc pl-6"><li>Presidência</li></ul>

                  <p className="font-semibold mb-2 mt-4">II - Nível de Assessoramento:</p>
                  <ul className="list-disc pl-6">
                    <li>Chefia de Gabinete</li>
                    <li>Assessoria Jurídica</li>
                    <li>Assessoria Especial</li>
                    <li>Controle Interno</li>
                    <li>Comissão Permanente de Licitação (CPL)</li>
                    <li>Assessoria de Comunicação (ASCOM)</li>
                  </ul>

                  <p className="font-semibold mb-2 mt-4">III - Nível de Execução Instrumental:</p>
                  <ul className="list-disc pl-6">
                    <li>Diretoria Administrativa e Financeira (DIRAF)</li>
                  </ul>

                  <p className="font-semibold mb-2 mt-4">IV - Nível de Execução Programática:</p>
                  <ul className="list-disc pl-6">
                    <li>Diretoria de Esporte (DIESP)</li>
                    <li>Diretoria da Juventude (DIJUV)</li>
                  </ul>
                </div>

                <p className="text-center text-muted-foreground mt-8">
                  [Texto parcial - documento completo disponível para download]
                </p>
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
