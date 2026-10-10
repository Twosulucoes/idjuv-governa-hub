import { useState } from "react";
import { Link } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FileText, 
  Search, 
  Send, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  ExternalLink,
  Info,
  FileQuestion,
  Scale
} from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/design-system";
import { useIdentidade } from "@/core/tenant";

export default function PortalLAIPage() {
  const [protocolo, setProtocolo] = useState("");
  const [buscando, setBuscando] = useState(false);
  const { sigla } = useIdentidade();

  const handleConsulta = async () => {
    if (!protocolo.trim()) {
      toast.error("Digite o número do protocolo");
      return;
    }
    setBuscando(true);
    // Integração com consultar_protocolo_sic() em fase futura
    setTimeout(() => {
      setBuscando(false);
      toast.info("Funcionalidade em implementação");
    }, 1000);
  };

  return (
    <MainLayout>
      {/* Cabeçalho */}
      <section className="bg-info text-info-foreground py-12">
        <div className="container mx-auto px-4">
          <nav aria-label="Trilha de navegação" className="flex items-center gap-3 text-sm mb-4 opacity-90">
            <Link to="/" className="inline-flex min-h-11 items-center hover:underline">Início</Link>
            <span aria-hidden="true">/</span>
            <Link to="/transparencia" className="inline-flex min-h-11 items-center hover:underline">Transparência</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">e-SIC / LAI</span>
          </nav>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-accent rounded-xl flex items-center justify-center" aria-hidden="true">
              <FileQuestion className="w-8 h-8 text-accent-foreground" />
            </div>
            <div>
              <h1 className="font-serif text-3xl lg:text-4xl font-bold">
                Serviço de Informação ao Cidadão
              </h1>
              <p className="text-base opacity-90 mt-1">
                Lei de Acesso à Informação - Lei nº 12.527/2011
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Conteúdo */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* Sobre a LAI */}
            <Card className="mb-8 border-info/30 bg-info/5">
              <CardHeader>
                <h2 className="text-h3 leading-tight tracking-tight flex items-center gap-2">
                  <Scale className="w-5 h-5 text-info" aria-hidden="true" />
                  Sobre a Lei de Acesso à Informação
                </h2>
              </CardHeader>
              <CardContent className="space-y-3 text-base text-muted-foreground">
                <p>
                  A Lei nº 12.527/2011 garante ao cidadão o direito de acesso às 
                  informações públicas. O pedido de informação pode ser feito por 
                  qualquer pessoa, física ou jurídica, sem necessidade de justificativa.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div className="flex items-start gap-2">
                    <Clock className="w-4 h-4 text-info mt-1" aria-hidden="true" />
                    <div>
                      <p className="font-medium text-foreground">Prazo de resposta</p>
                      <p>20 dias úteis (prorrogável por +10)</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-warning mt-1" aria-hidden="true" />
                    <div>
                      <p className="font-medium text-foreground">Recurso em 1ª instância</p>
                      <p>10 dias após resposta</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-success mt-1" aria-hidden="true" />
                    <div>
                      <p className="font-medium text-foreground">Recurso em 2ª instância</p>
                      <p>10 dias após 1ª instância</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Tabs defaultValue="consultar" className="space-y-6">
              <TabsList className="grid h-auto w-full grid-cols-2">
                <TabsTrigger value="consultar" className="min-h-11 gap-2 text-base">
                  <Search className="w-4 h-4" aria-hidden="true" />
                  Consultar pedido
                </TabsTrigger>
                <TabsTrigger value="solicitar" className="min-h-11 gap-2 text-base">
                  <Send className="w-4 h-4" aria-hidden="true" />
                  Novo pedido
                </TabsTrigger>
              </TabsList>

              {/* Consultar Pedido */}
              <TabsContent value="consultar">
                <Card>
                  <CardHeader>
                    <h2 className="text-h3 leading-tight tracking-tight">Consultar andamento</h2>
                    <CardDescription className="text-base">
                      Digite o número do protocolo recebido para acompanhar seu pedido
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <Label htmlFor="protocolo">Número do protocolo</Label>
                        <Input
                          id="protocolo"
                          placeholder="Ex: SIC-2026-000001"
                          value={protocolo}
                          onChange={(e) => setProtocolo(e.target.value)}
                        />
                      </div>
                      <div className="flex items-end">
                        <Button onClick={handleConsulta} disabled={buscando}>
                          <Search className="w-4 h-4 mr-2" aria-hidden="true" />
                          {buscando ? "Buscando..." : "Consultar"}
                        </Button>
                      </div>
                    </div>

                    <Separator />

                    <EmptyState
                      icone={FileText}
                      titulo="Nenhum pedido consultado"
                      descricao="Digite um protocolo para ver o andamento."
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Novo Pedido */}
              <TabsContent value="solicitar">
                <Card>
                  <CardHeader>
                    <h2 className="text-h3 leading-tight tracking-tight">Registrar pedido de informação</h2>
                    <CardDescription className="text-base">
                      Preencha o formulário abaixo para solicitar acesso à informação pública
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Dados do Solicitante */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-lg">Dados do solicitante</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="nome">Nome completo *</Label>
                          <Input id="nome" placeholder="Seu nome completo" />
                        </div>
                        <div>
                          <Label htmlFor="email">E-mail *</Label>
                          <Input id="email" type="email" placeholder="seu@email.com" />
                        </div>
                        <div>
                          <Label htmlFor="telefone">Telefone</Label>
                          <Input id="telefone" placeholder="(00) 00000-0000" />
                        </div>
                        <div>
                          <Label htmlFor="documento">CPF/CNPJ</Label>
                          <Input id="documento" placeholder="000.000.000-00" />
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Pedido */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-lg">Pedido de informação</h3>
                      <div>
                        <Label htmlFor="assunto">Assunto *</Label>
                        <Input id="assunto" placeholder="Resumo do seu pedido" />
                      </div>
                      <div>
                        <Label htmlFor="descricao">Descrição detalhada *</Label>
                        <Textarea 
                          id="descricao" 
                          placeholder="Descreva de forma clara e objetiva a informação que deseja obter..."
                          className="min-h-[120px]"
                        />
                      </div>
                    </div>

                    <div className="bg-muted/50 p-4 rounded-lg flex items-start gap-3">
                      <Info className="w-5 h-5 text-info mt-0.5" aria-hidden="true" />
                      <div className="text-base text-muted-foreground">
                        <p className="font-medium text-foreground mb-1">Termo de ciência</p>
                        <p>
                          Ao enviar este pedido, você concorda que seus dados serão 
                          utilizados exclusivamente para resposta à sua solicitação, 
                          conforme LGPD (Lei 13.709/2018). Seus dados pessoais são 
                          protegidos por hash criptográfico.
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-end gap-3">
                      <Button variant="outline">Cancelar</Button>
                      <Button onClick={() => toast.info("Funcionalidade em implementação")}>
                        <Send className="w-4 h-4 mr-2" aria-hidden="true" />
                        Enviar pedido
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Links úteis */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
              <a 
                href="http://www.planalto.gov.br/ccivil_03/_ato2011-2014/2011/lei/l12527.htm"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <FileText className="w-5 h-5 text-info" aria-hidden="true" />
                <div className="flex-1">
                  <p className="font-medium">Lei nº 12.527/2011</p>
                  <p className="text-base text-muted-foreground">Lei de Acesso à Informação</p>
                </div>
                <span className="sr-only">(abre em nova aba)</span>
                <ExternalLink className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
              </a>
              <Link 
                to="/transparencia"
                className="flex items-center gap-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <Search className="w-5 h-5 text-success" aria-hidden="true" />
                <div className="flex-1">
                  <p className="font-medium">Portal de Transparência</p>
                  <p className="text-base text-muted-foreground">Dados públicos do {sigla}</p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}
