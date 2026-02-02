import { Link } from "react-router-dom";
import { Eye, ExternalLink, FileText, BarChart3, Users, DollarSign, Download, Building2, Calendar } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const transparenciaItems = [
  {
    title: "Cargos e Remuneração",
    description: "Quadro completo dos 98 cargos comissionados com valores e ocupantes",
    icon: Users,
    href: "/transparencia/cargos",
    highlight: true,
  },
  {
    title: "Licitações e Contratos",
    description: "Processos licitatórios e contratos (apenas pessoa jurídica)",
    icon: FileText,
    href: "/transparencia/licitacoes",
  },
  {
    title: "Execução Orçamentária",
    description: "Dados agregados de receitas e despesas",
    icon: DollarSign,
    href: "/transparencia/orcamento",
  },
  {
    title: "Patrimônio Público",
    description: "Bens patrimoniais (dados institucionais)",
    icon: Building2,
    href: "/transparencia/patrimonio",
  },
  {
    title: "e-SIC / LAI",
    description: "Serviço de Informação ao Cidadão - Lei de Acesso à Informação",
    icon: BarChart3,
    href: "/transparencia/lai",
  },
  {
    title: "Portal da Transparência",
    description: "Acesso ao portal de transparência do Governo do Estado de Roraima",
    icon: ExternalLink,
    external: true,
    href: "https://transparencia.rr.gov.br",
  },
];

const documentosOficiais = [
  {
    titulo: "Lei nº 2.301/2025 - Criação do IDJuv",
    descricao: "Lei que cria o Instituto de Desporto, Juventude e Lazer do Estado de Roraima",
    data: "29/12/2025",
    tipo: "Lei",
    arquivo: "/documentos/LEI_2301_25.pdf",
  },
  {
    titulo: "Quadro de Cargos - 98 Cargos",
    descricao: "Relação completa dos cargos comissionados com vínculos e valores",
    data: "29/12/2025",
    tipo: "Anexo",
    arquivo: "/documentos/IDJUV_98_cargos_vinculo.pdf",
  },
];

export default function TransparenciaPage() {
  return (
    <MainLayout>
      {/* Cabeçalho */}
      <section className="bg-success text-success-foreground py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 text-sm mb-4 opacity-80">
            <Link to="/" className="hover:underline">Início</Link>
            <span>/</span>
            <span>Transparência</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-accent rounded-xl flex items-center justify-center">
              <Eye className="w-8 h-8 text-accent-foreground" />
            </div>
            <div>
              <h1 className="font-serif text-3xl lg:text-4xl font-bold">Transparência</h1>
              <p className="opacity-90 mt-1">
                Acesso público a informações institucionais
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Conteúdo */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            {/* Introdução */}
            <div className="bg-muted/50 rounded-xl p-6 mb-8">
              <h2 className="font-serif text-xl font-bold mb-3">Compromisso com a Transparência</h2>
              <p className="text-muted-foreground leading-relaxed">
                Em cumprimento à Lei de Acesso à Informação (Lei nº 12.527/2011) e aos 
                princípios constitucionais da publicidade e transparência, o IDJUV 
                disponibiliza informações sobre sua gestão, estrutura e atividades.
              </p>
            </div>

            {/* Documentos Oficiais */}
            <div className="mb-10">
              <h2 className="font-serif text-2xl font-bold mb-6 flex items-center gap-3">
                <FileText className="w-6 h-6 text-primary" />
                Documentos Oficiais
              </h2>
              <div className="grid gap-4">
                {documentosOficiais.map((doc) => (
                  <Card key={doc.titulo} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline">{doc.tipo}</Badge>
                            <span className="text-sm text-muted-foreground flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {doc.data}
                            </span>
                          </div>
                          <h3 className="font-semibold mb-1">{doc.titulo}</h3>
                          <p className="text-sm text-muted-foreground">{doc.descricao}</p>
                        </div>
                        <Button asChild variant="outline">
                          <a href={doc.arquivo} target="_blank" rel="noopener noreferrer">
                            <Download className="w-4 h-4 mr-2" />
                            Baixar PDF
                          </a>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <Separator className="my-8" />

            {/* Grid de itens */}
            <h2 className="font-serif text-2xl font-bold mb-6">Informações Disponíveis</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {transparenciaItems.map((item) => (
                item.external ? (
                  <a key={item.href} href={item.href} target="_blank" rel="noopener noreferrer">
                    <Card className="h-full hover:shadow-lg transition-all hover:border-success group">
                      <CardHeader className="flex flex-row items-start gap-4">
                        <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center flex-shrink-0">
                          <item.icon className="w-6 h-6 text-success" />
                        </div>
                        <div>
                          <CardTitle className="text-lg group-hover:text-success transition-colors flex items-center gap-2">
                            {item.title}
                            <ExternalLink className="w-4 h-4" />
                          </CardTitle>
                          <CardDescription className="mt-1">
                            {item.description}
                          </CardDescription>
                        </div>
                      </CardHeader>
                    </Card>
                  </a>
                ) : (
                  <Link key={item.href} to={item.href}>
                    <Card className={`h-full hover:shadow-lg transition-all hover:border-success group ${item.highlight ? 'border-primary/50 bg-primary/5' : ''}`}>
                      <CardHeader className="flex flex-row items-start gap-4">
                        <div className={`w-12 h-12 ${item.highlight ? 'bg-primary/20' : 'bg-success/10'} rounded-lg flex items-center justify-center flex-shrink-0`}>
                          <item.icon className={`w-6 h-6 ${item.highlight ? 'text-primary' : 'text-success'}`} />
                        </div>
                        <div>
                          <CardTitle className="text-lg group-hover:text-success transition-colors flex items-center gap-2">
                            {item.title}
                            {item.highlight && <Badge className="bg-primary text-primary-foreground">Novo</Badge>}
                          </CardTitle>
                          <CardDescription className="mt-1">
                            {item.description}
                          </CardDescription>
                        </div>
                      </CardHeader>
                    </Card>
                  </Link>
                )
              ))}
            </div>

            {/* LAI */}
            <div className="mt-12 bg-info/10 border border-info/30 rounded-xl p-6">
              <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                <FileText className="w-5 h-5 text-info" />
                Lei de Acesso à Informação
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Para solicitar informações não disponíveis neste portal, utilize o 
                Serviço de Informação ao Cidadão (SIC) do Estado de Roraima.
              </p>
              <a 
                href="https://transparencia.rr.gov.br" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-info hover:underline font-medium"
              >
                Acessar SIC
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>

            {/* Última atualização */}
            <div className="mt-8 text-center text-sm text-muted-foreground">
              <p>Dados atualizados em: 29/12/2025</p>
              <p>Fonte: Lei nº 2.301, de 29 de dezembro de 2025</p>
            </div>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}
