import { Link } from "react-router-dom";
import { ModuleLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/design-system";
import { useIdentidade } from "@/core/tenant";
import {
  Target,
  CheckCircle2,
  MapPin,
  Users,
  Heart,
  Calendar
} from "lucide-react";

export default function EsporteComunidadePage() {
  const { sigla } = useIdentidade();

  const modalidades = [
    "Futebol de Campo e Society",
    "Vôlei de Quadra e de Praia",
    "Basquete",
    "Natação",
    "Atletismo",
    "Artes Marciais",
    "Ginástica",
    "Ciclismo",
  ];

  const beneficios = [
    { icon: Heart, texto: "Promoção da saúde e qualidade de vida" },
    { icon: Users, texto: "Integração comunitária e socialização" },
    { icon: Target, texto: "Descoberta de talentos esportivos" },
    { icon: MapPin, texto: "Acesso gratuito ao esporte em todos os bairros" },
  ];

  return (
    <ModuleLayout module="programas">
      <div className="space-y-6">
        <PageHeader
          migalhas={[{ rotulo: "Programas", href: "/programas" }, { rotulo: "Esporte na Comunidade" }]}
          titulo="Esporte na Comunidade"
          descricao="Levando a prática esportiva para todos os bairros de Roraima, promovendo saúde, integração social e descoberta de talentos."
          acoes={
            <Button asChild>
              <Link to="/sistema">
                <Calendar className="h-4 w-4" aria-hidden="true" />
                Ver locais e horários
              </Link>
            </Button>
          }
        />

        {/* Sobre o programa */}
        <Card>
          <CardHeader>
            <h2 className="text-h2 text-foreground">O que é o Esporte na Comunidade?</h2>
          </CardHeader>
          <CardContent className="max-w-prose space-y-4 text-body text-muted-foreground">
            <p>
              O programa Esporte na Comunidade é uma iniciativa do {sigla} que leva atividades
              esportivas gratuitas para os bairros e comunidades do Estado de Roraima.
              Com núcleos esportivos espalhados por toda a capital e interior, o programa
              oferece aulas e treinamentos em diversas modalidades para todas as idades.
            </p>
            <p>
              Além de promover a saúde e o bem-estar da população, o programa funciona como
              uma importante ferramenta de inclusão social e identificação de novos talentos
              que podem representar o estado em competições oficiais.
            </p>
          </CardContent>
        </Card>

        {/* Benefícios */}
        <section aria-labelledby="comunidade-beneficios" className="space-y-4">
          <h2 id="comunidade-beneficios" className="text-h2 text-foreground">Benefícios do programa</h2>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {beneficios.map((beneficio) => (
              <li key={beneficio.texto}>
                <Card className="h-full text-center">
                  <CardContent className="space-y-3 p-6">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                      <beneficio.icon className="h-6 w-6 text-primary" aria-hidden="true" />
                    </div>
                    <p className="text-body font-medium text-foreground">{beneficio.texto}</p>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        </section>

        {/* Modalidades */}
        <section aria-labelledby="comunidade-modalidades" className="space-y-4">
          <h2 id="comunidade-modalidades" className="text-h2 text-foreground">Modalidades oferecidas</h2>
          <ul className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
            {modalidades.map((modalidade) => (
              <li
                key={modalidade}
                className="flex items-center gap-3 rounded-lg border border-border bg-card p-4"
              >
                <CheckCircle2 className="h-5 w-5 shrink-0 text-accent" aria-hidden="true" />
                <span className="text-body text-foreground">{modalidade}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Chamada */}
        <Card>
          <CardContent className="flex flex-col items-start gap-3 p-6 sm:flex-row sm:items-center">
            <MapPin className="h-8 w-8 shrink-0 text-primary" aria-hidden="true" />
            <div className="space-y-1">
              <h2 className="text-h2 text-foreground">Encontre um núcleo perto de você</h2>
              <p className="text-body text-muted-foreground">
                Procure o núcleo esportivo mais próximo da sua casa e comece a praticar esportes gratuitamente.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </ModuleLayout>
  );
}
