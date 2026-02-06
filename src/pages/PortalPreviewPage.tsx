/**
 * PortalPreviewPage - Página secreta para preview do portal público
 * 
 * Acesso via: /portal-preview-idjuv-2026
 */

import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Trophy, 
  Users, 
  Calendar, 
  FileText, 
  MapPin, 
  Phone, 
  Mail,
  ExternalLink,
  Newspaper,
  Award,
  Heart
} from "lucide-react";
import { Link } from "react-router-dom";

export default function PortalPreviewPage() {
  return (
    <MainLayout>
      {/* Banner de teste */}
      <div className="bg-destructive/10 border-b border-destructive/20 py-2 px-4 text-center">
        <Badge variant="destructive" className="animate-pulse">
          🔒 AMBIENTE DE TESTES - NÃO PÚBLICO
        </Badge>
      </div>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary via-primary/90 to-accent py-20 px-4 text-primary-foreground overflow-hidden">
        <div className="absolute inset-0 bg-[url('/placeholder.svg')] opacity-10 bg-cover bg-center" />
        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <Badge variant="secondary" className="text-sm">
                Governo do Estado de Roraima
              </Badge>
              <h1 className="text-4xl md:text-5xl font-bold leading-tight">
                Instituto de Desporto, Juventude e Lazer
              </h1>
              <p className="text-lg text-primary-foreground/80">
                Promovendo o esporte, a cultura e o desenvolvimento da juventude roraimense.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button size="lg" variant="secondary">
                  <Trophy className="mr-2 h-5 w-5" />
                  Nossos Programas
                </Button>
                <Button size="lg" variant="outline" className="bg-transparent border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
                  <Calendar className="mr-2 h-5 w-5" />
                  Eventos
                </Button>
              </div>
            </div>
            <div className="hidden md:flex justify-center">
              <div className="w-64 h-64 bg-primary-foreground/10 rounded-full flex items-center justify-center backdrop-blur-sm">
                <Trophy className="h-32 w-32 text-primary-foreground/50" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Links */}
      <section className="py-12 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: Users, label: "Bolsa Atleta", color: "text-blue-600" },
              { icon: Heart, label: "Juventude Cidadã", color: "text-rose-600" },
              { icon: Award, label: "Federações", color: "text-amber-600" },
              { icon: Newspaper, label: "Notícias", color: "text-emerald-600" },
            ].map((item, i) => (
              <Card key={i} className="group hover:shadow-lg transition-all cursor-pointer hover:-translate-y-1">
                <CardContent className="p-6 text-center">
                  <item.icon className={`h-10 w-10 mx-auto mb-3 ${item.color} group-hover:scale-110 transition-transform`} />
                  <p className="font-medium text-foreground">{item.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Notícias */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-foreground">Últimas Notícias</h2>
              <p className="text-muted-foreground">Fique por dentro das novidades do IDJuv</p>
            </div>
            <Button variant="ghost" className="hidden md:flex">
              Ver todas <ExternalLink className="ml-2 h-4 w-4" />
            </Button>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="group overflow-hidden hover:shadow-xl transition-all">
                <div className="aspect-video bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                  <FileText className="h-12 w-12 text-muted-foreground/30" />
                </div>
                <CardContent className="p-5">
                  <Badge variant="secondary" className="mb-3">Esporte</Badge>
                  <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors">
                    Título da Notícia {i}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt.
                  </p>
                  <p className="text-xs text-muted-foreground mt-3">
                    {new Date().toLocaleDateString('pt-BR')}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Programas */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-3">Nossos Programas</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Conheça as iniciativas do IDJuv para o desenvolvimento do esporte e da juventude em Roraima
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: "Bolsa Atleta", desc: "Apoio financeiro a atletas de alto rendimento", icon: Trophy },
              { title: "Juventude Cidadã", desc: "Formação e inclusão social para jovens", icon: Heart },
              { title: "Federações Esportivas", desc: "Apoio às federações estaduais", icon: Award },
              { title: "Espaços Esportivos", desc: "Gestão de arenas e centros esportivos", icon: MapPin },
              { title: "Eventos", desc: "Calendário esportivo estadual", icon: Calendar },
              { title: "Capacitação", desc: "Cursos e treinamentos", icon: Users },
            ].map((prog, i) => (
              <Card key={i} className="hover:shadow-lg transition-all hover:-translate-y-1">
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                    <prog.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{prog.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{prog.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contato */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <Card className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground overflow-hidden">
            <CardContent className="p-8 md:p-12">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold mb-4">Entre em Contato</h2>
                  <p className="text-primary-foreground/80 mb-6">
                    Estamos à disposição para atender você. Entre em contato conosco!
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <MapPin className="h-5 w-5" />
                      <span>Av. Major Willians, 2805 - São Francisco, Boa Vista - RR</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone className="h-5 w-5" />
                      <span>(95) 3621-3737</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5" />
                      <span>contato@idjuv.rr.gov.br</span>
                    </div>
                  </div>
                </div>
                <div className="flex justify-center">
                  <Button size="lg" variant="secondary" className="shadow-lg">
                    Fale Conosco
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Voltar para área admin */}
      <div className="fixed bottom-4 right-4 z-50">
        <Button asChild variant="default" className="shadow-lg">
          <Link to="/auth">
            Voltar para Área Administrativa
          </Link>
        </Button>
      </div>
    </MainLayout>
  );
}
