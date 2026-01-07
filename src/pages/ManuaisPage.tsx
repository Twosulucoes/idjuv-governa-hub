import { Link } from "react-router-dom";
import { BookOpen, ShoppingCart, MapPin, Building2, Handshake } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const manuaisItems = [
  {
    title: "Manual de Compras e Contratações",
    description: "Orientações para aquisições conforme Lei 14.133/2021",
    icon: ShoppingCart,
    href: "/manuais/compras",
  },
  {
    title: "Manual de Diárias e Viagens",
    description: "Procedimentos para solicitação de diárias e relatórios de viagem",
    icon: MapPin,
    href: "/manuais/diarias",
  },
  {
    title: "Manual de Patrimônio",
    description: "Gestão de bens patrimoniais e procedimentos de controle",
    icon: Building2,
    href: "/manuais/patrimonio",
  },
  {
    title: "Manual de Convênios e Parcerias",
    description: "Celebração, execução e prestação de contas de convênios",
    icon: Handshake,
    href: "/manuais/convenios",
  },
];

export default function ManuaisPage() {
  return (
    <MainLayout>
      {/* Cabeçalho */}
      <section className="bg-info text-info-foreground py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 text-sm mb-4 opacity-80">
            <Link to="/" className="hover:underline">Início</Link>
            <span>/</span>
            <span>Manuais</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-accent rounded-xl flex items-center justify-center">
              <BookOpen className="w-8 h-8 text-accent-foreground" />
            </div>
            <div>
              <h1 className="font-serif text-3xl lg:text-4xl font-bold">Manuais</h1>
              <p className="opacity-90 mt-1">
                Orientações técnicas e procedimentos operacionais
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Conteúdo */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* Introdução */}
            <div className="bg-muted/50 rounded-xl p-6 mb-8">
              <h2 className="font-serif text-xl font-bold mb-3">Biblioteca de Manuais</h2>
              <p className="text-muted-foreground leading-relaxed">
                Os manuais do IDJUV estabelecem procedimentos padronizados para a execução 
                de atividades administrativas, garantindo conformidade com normas legais e 
                orientações dos órgãos de controle.
              </p>
            </div>

            <Separator className="my-8" />

            {/* Grid de manuais */}
            <h2 className="font-serif text-2xl font-bold mb-6">Manuais Disponíveis</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {manuaisItems.map((item) => (
                <Link key={item.href} to={item.href}>
                  <Card className="h-full hover:shadow-lg transition-all hover:border-info group">
                    <CardHeader className="flex flex-row items-start gap-4">
                      <div className="w-12 h-12 bg-info/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <item.icon className="w-6 h-6 text-info" />
                      </div>
                      <div>
                        <CardTitle className="text-lg group-hover:text-info transition-colors">
                          {item.title}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          {item.description}
                        </CardDescription>
                      </div>
                    </CardHeader>
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
