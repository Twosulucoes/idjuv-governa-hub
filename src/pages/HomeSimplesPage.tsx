import { Link } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Building2, MapPin, Phone, Mail, Clock } from "lucide-react";
import { Logo, LogoEntidadeSuperior } from "@/components/ui/Logo";
import { useTenant } from '@/core/tenant';

export default function HomeSimplesPage() {
  const { identidade, contato, endereco } = useTenant();

  const linhasEndereco = [
    [endereco?.logradouro, endereco?.numero].filter(Boolean).join(', '),
    [endereco?.bairro].filter(Boolean).join(''),
    [[endereco?.cidade, endereco?.uf].filter(Boolean).join(' - '), endereco?.cep]
      .filter(Boolean)
      .join(', '),
  ].filter(Boolean);

  return (
    <MainLayout>
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary via-primary/95 to-secondary/70 text-primary-foreground py-20">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row items-center gap-10">
            <div className="bg-white/95 rounded-2xl p-6 shadow-2xl flex-shrink-0">
              <Logo
                variant="light"
                className="h-32 md:h-40 w-auto"
              />
            </div>
            <div className="flex-1 text-center lg:text-left">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 leading-tight">
                {identidade.nomeOficial}
              </h1>
              {/* TODO (White Label — Fase 5): chamada editorial, vai para CMS. */}
              <p className="text-lg md:text-xl opacity-90 mb-8 max-w-2xl">
                Autarquia pública estadual dedicada ao desenvolvimento do esporte,
                da juventude e do lazer no Estado de Roraima.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button size="lg" variant="secondary" className="text-base px-8" asChild>
                  <Link to="/transparencia">
                    <FileText className="mr-2 h-5 w-5" />
                    Editais e Transparência
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="text-base px-8 bg-transparent border-primary-foreground/30 hover:bg-primary-foreground/10"
                  asChild
                >
                  <Link to="/auth">
                    <Building2 className="mr-2 h-5 w-5" />
                    Área Administrativa
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quem somos */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
              Quem Somos
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {/* TODO (White Label — Fase 5): texto institucional editorial.
                  Vira conteúdo de CMS/banco, como as normas em governanca/. */}
              O IDJUV é responsável por desenvolver e executar políticas públicas
              voltadas ao esporte, à juventude e ao lazer em Roraima, promovendo
              o desenvolvimento integral da juventude roraimense.
            </p>
          </div>
        </div>
      </section>

      {/* Contato */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardContent className="p-8 space-y-6">
                <h2 className="text-xl font-bold text-foreground mb-2">Fale Conosco</h2>

                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-full bg-primary/10">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Endereço</h3>
                    <p className="text-muted-foreground text-sm">
                      {linhasEndereco.map((linha, i) => (
                        <span key={linha}>
                          {linha}
                          {i < linhasEndereco.length - 1 && <br />}
                        </span>
                      ))}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-full bg-primary/10">
                    <Phone className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Telefone</h3>
                    <p className="text-muted-foreground text-sm">{contato?.telefone}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-full bg-primary/10">
                    <Mail className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">E-mail</h3>
                    <p className="text-muted-foreground text-sm">{contato?.email}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-full bg-primary/10">
                    <Clock className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Horário de Funcionamento</h3>
                    <p className="text-muted-foreground text-sm">Segunda a Sexta: 8h às 14h</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-border flex items-center justify-center gap-6">
                  <Logo className="h-12 w-auto" />
                  <LogoEntidadeSuperior
                    variant="light"
                    className="h-12 w-auto rounded"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}
