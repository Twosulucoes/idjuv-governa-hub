import { Link } from "react-router-dom";
import { FileText, ShoppingCart, MapPin, Building2, Handshake, Package, Car, CreditCard } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const processosItems = [
  {
    title: "Compras e Contratos",
    description: "Aquisições, contratações e gestão de contratos conforme Lei 14.133/2021",
    icon: ShoppingCart,
    href: "/processos/compras",
    baseLegal: "Lei 14.133/2021",
    status: "ativo",
  },
  {
    title: "Diárias e Viagens",
    description: "Ordem de missão, diárias e relatórios de viagem a serviço",
    icon: MapPin,
    href: "/processos/diarias",
    baseLegal: "Decreto Estadual",
    status: "ativo",
  },
  {
    title: "Patrimônio",
    description: "Tombamento, distribuição, inventário e baixa de bens patrimoniais",
    icon: Building2,
    href: "/processos/patrimonio",
    baseLegal: "IN TCE-RR",
    status: "ativo",
  },
  {
    title: "Convênios e Parcerias",
    description: "Celebração e prestação de contas de convênios e parcerias",
    icon: Handshake,
    href: "/processos/convenios",
    baseLegal: "Lei 14.133/2021",
    status: "ativo",
  },
  {
    title: "Almoxarifado",
    description: "Requisição, controle e distribuição de materiais",
    icon: Package,
    href: "/processos/almoxarifado",
    baseLegal: "IN Interna",
    status: "ativo",
  },
  {
    title: "Veículos",
    description: "Controle de uso, tráfego e manutenção de veículos oficiais",
    icon: Car,
    href: "/processos/veiculos",
    baseLegal: "IN Interna",
    status: "ativo",
  },
  {
    title: "Pagamentos",
    description: "Liquidação e pagamento de despesas públicas",
    icon: CreditCard,
    href: "/processos/pagamentos",
    baseLegal: "Lei 4.320/64",
    status: "ativo",
  },
];

export default function ProcessosPage() {
  return (
    <MainLayout>
      {/* Cabeçalho */}
      <section className="bg-secondary text-secondary-foreground py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 text-sm mb-4 opacity-80">
            <Link to="/" className="hover:underline">Início</Link>
            <span>/</span>
            <span>Processos Administrativos</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-accent rounded-xl flex items-center justify-center">
              <FileText className="w-8 h-8 text-accent-foreground" />
            </div>
            <div>
              <h1 className="font-serif text-3xl lg:text-4xl font-bold">Processos Administrativos</h1>
              <p className="opacity-90 mt-1">
                Fluxos padronizados com rastreabilidade e conformidade
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
            <div className="bg-warning/10 border-l-4 border-warning rounded-r-lg p-6 mb-8">
              <h2 className="font-semibold text-lg mb-2">Orientação Importante</h2>
              <p className="text-muted-foreground leading-relaxed">
                Todos os processos administrativos do IDJUV seguem fluxos padronizados com 
                checklist obrigatório, garantindo conformidade com normas do TCE-RR. Cada 
                processo gera documentação rastreável e auditável.
              </p>
            </div>

            <Separator className="my-8" />

            {/* Grid de processos */}
            <h2 className="font-serif text-2xl font-bold mb-6">Tipos de Processos</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {processosItems.map((item) => (
                <Link key={item.href} to={item.href}>
                  <Card className="h-full hover:shadow-lg transition-all hover:border-secondary group">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center">
                          <item.icon className="w-6 h-6 text-secondary" />
                        </div>
                        <Badge variant="outline" className="text-success border-success">
                          Ativo
                        </Badge>
                      </div>
                      <CardTitle className="text-lg group-hover:text-secondary transition-colors mt-3">
                        {item.title}
                      </CardTitle>
                      <CardDescription>
                        {item.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">Base legal:</span>
                        <Badge variant="secondary">{item.baseLegal}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}
