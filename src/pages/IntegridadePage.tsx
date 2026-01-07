import { Link } from "react-router-dom";
import { Scale, FileText, AlertTriangle, UserX, ShieldCheck } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

const integridadeItems = [
  {
    title: "Código de Conduta e Ética",
    description: "Princípios, deveres, vedações e padrões de comportamento dos agentes públicos",
    icon: FileText,
    href: "/integridade/codigo-etica",
  },
  {
    title: "Canal de Denúncias",
    description: "Comunicação de irregularidades com garantia de sigilo e anonimato",
    icon: AlertTriangle,
    href: "/integridade/denuncias",
    destaque: true,
  },
  {
    title: "Conflito de Interesses",
    description: "Declaração e gestão de situações de conflito de interesses",
    icon: UserX,
    href: "/integridade/conflito",
  },
  {
    title: "Política de Integridade",
    description: "Diretrizes e compromissos institucionais com a integridade",
    icon: ShieldCheck,
    href: "/integridade/politica",
  },
];

export default function IntegridadePage() {
  return (
    <MainLayout>
      {/* Cabeçalho */}
      <section className="bg-warning text-warning-foreground py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 text-sm mb-4 opacity-80">
            <Link to="/" className="hover:underline">Início</Link>
            <span>/</span>
            <span>Integridade</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-primary rounded-xl flex items-center justify-center">
              <Scale className="w-8 h-8 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-serif text-3xl lg:text-4xl font-bold">Integridade</h1>
              <p className="opacity-90 mt-1">
                Ética, transparência e compromisso institucional
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
              <h2 className="font-serif text-xl font-bold mb-3">Compromisso com a Integridade</h2>
              <p className="text-muted-foreground leading-relaxed">
                O IDJUV está comprometido com os mais altos padrões de ética e integridade 
                na gestão pública. Esta seção reúne instrumentos e canais para garantir a 
                conformidade com princípios constitucionais e prevenir irregularidades.
              </p>
            </div>

            {/* Canal de Denúncias em destaque */}
            <Card className="border-2 border-warning bg-warning/5 mb-8">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-8 h-8 text-warning" />
                  <div>
                    <CardTitle className="text-xl">Canal de Denúncias</CardTitle>
                    <CardDescription>
                      Relate irregularidades de forma segura e confidencial
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  O Canal de Denúncias do IDJUV garante sigilo absoluto e oferece opção de 
                  denúncia anônima. Todas as comunicações são tratadas de acordo com a LGPD 
                  e protocolos de integridade.
                </p>
                <Button asChild className="bg-warning text-warning-foreground hover:bg-warning/90">
                  <Link to="/integridade/denuncias">
                    Acessar Canal de Denúncias
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Separator className="my-8" />

            {/* Grid de itens */}
            <h2 className="font-serif text-2xl font-bold mb-6">Instrumentos de Integridade</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {integridadeItems.filter(i => !i.destaque).map((item) => (
                <Link key={item.href} to={item.href}>
                  <Card className="h-full hover:shadow-lg transition-all hover:border-warning group">
                    <CardHeader className="flex flex-row items-start gap-4">
                      <div className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <item.icon className="w-6 h-6 text-warning" />
                      </div>
                      <div>
                        <CardTitle className="text-lg group-hover:text-warning transition-colors">
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
