import { Link } from "react-router-dom";
import { ModuleLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/design-system";
import { useIdentidade } from "@/core/tenant";
import {
  Target,
  Trophy,
  Users,
  Medal,
  Calendar,
  MapPin
} from "lucide-react";

export default function JogosEscolaresPage() {
  const { sigla } = useIdentidade();

  const modalidades = [
    { nome: "Futebol", categorias: "Sub-12, Sub-14, Sub-17" },
    { nome: "Futsal", categorias: "Sub-12, Sub-14, Sub-17" },
    { nome: "Voleibol", categorias: "Sub-14, Sub-17" },
    { nome: "Basquete", categorias: "Sub-14, Sub-17" },
    { nome: "Handebol", categorias: "Sub-14, Sub-17" },
    { nome: "Atletismo", categorias: "Sub-14, Sub-17" },
    { nome: "Natação", categorias: "Sub-12, Sub-14, Sub-17" },
    { nome: "Xadrez", categorias: "Livre" },
  ];

  const etapas = [
    { fase: "Fase Municipal", periodo: "Março a Abril", descricao: "Competições dentro de cada município" },
    { fase: "Fase Regional", periodo: "Maio a Junho", descricao: "Confrontos entre municípios da mesma região" },
    { fase: "Fase Estadual", periodo: "Julho a Agosto", descricao: "Finais com os melhores de cada região" },
    { fase: "Fase Nacional", periodo: "Setembro a Novembro", descricao: "Representação estadual nos JEBs" },
  ];

  const comoParticipar = [
    { icon: Users, titulo: "Inscrição pela escola", texto: "A escola deve estar regularmente matriculada e inscrever seus alunos através do portal" },
    { icon: Calendar, titulo: "Período de inscrição", texto: "As inscrições acontecem entre janeiro e fevereiro de cada ano" },
    { icon: MapPin, titulo: "Locais de competição", texto: "As competições acontecem em ginásios e campos em todo o estado" },
  ];

  return (
    <ModuleLayout module="programas">
      <div className="space-y-6">
        <PageHeader
          migalhas={[{ rotulo: "Programas", href: "/programas" }, { rotulo: "Jogos Escolares" }]}
          titulo="Jogos Escolares de Roraima"
          descricao="A maior competição esportiva estudantil do estado, revelando talentos e promovendo a integração entre escolas de toda Roraima."
          acoes={
            <Button asChild>
              <Link to="/sistema">
                <Target className="h-4 w-4" aria-hidden="true" />
                Acessar regulamento
              </Link>
            </Button>
          }
        />

        {/* Sobre */}
        <Card>
          <CardHeader>
            <h2 className="text-h2 text-foreground">O que são os Jogos Escolares?</h2>
          </CardHeader>
          <CardContent className="max-w-prose space-y-4 text-body text-muted-foreground">
            <p>
              Os Jogos Escolares de Roraima (JER) são a maior competição esportiva estudantil
              do estado, reunindo milhares de alunos das redes pública e privada de ensino.
              O evento é organizado pelo {sigla} em parceria com a Secretaria de Educação e
              acontece anualmente em quatro fases.
            </p>
            <p>
              Os campeões estaduais conquistam o direito de representar Roraima nos
              Jogos Escolares Brasileiros (JEBs), a maior competição estudantil do país.
            </p>
          </CardContent>
        </Card>

        {/* Etapas */}
        <section aria-labelledby="jer-etapas" className="space-y-4">
          <h2 id="jer-etapas" className="text-h2 text-foreground">Etapas da competição</h2>
          <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {etapas.map((etapa, index) => (
              <li key={etapa.fase}>
                <Card className="h-full">
                  <CardContent className="space-y-2 p-6">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <span className="font-semibold tabular-nums text-primary">{index + 1}</span>
                    </div>
                    <h3 className="text-h3 text-foreground">{etapa.fase}</h3>
                    <p className="text-body font-medium text-primary">{etapa.periodo}</p>
                    <p className="text-body text-muted-foreground">{etapa.descricao}</p>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ol>
        </section>

        {/* Modalidades */}
        <section aria-labelledby="jer-modalidades" className="space-y-4">
          <h2 id="jer-modalidades" className="text-h2 text-foreground">Modalidades disputadas</h2>
          <ul className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
            {modalidades.map((mod) => (
              <li key={mod.nome}>
                <Card className="h-full">
                  <CardContent className="space-y-1 p-4">
                    <div className="flex items-center gap-3">
                      <Trophy className="h-5 w-5 text-primary" aria-hidden="true" />
                      <h3 className="text-h3 text-foreground">{mod.nome}</h3>
                    </div>
                    <p className="text-caption text-muted-foreground">{mod.categorias}</p>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        </section>

        {/* Como participar */}
        <section aria-labelledby="jer-participar" className="space-y-4">
          <h2 id="jer-participar" className="text-h2 text-foreground">Como participar?</h2>
          <ul className="grid gap-4 md:grid-cols-3">
            {comoParticipar.map((item) => (
              <li key={item.titulo}>
                <Card className="h-full text-center">
                  <CardContent className="space-y-2 p-6">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                      <item.icon className="h-6 w-6 text-primary" aria-hidden="true" />
                    </div>
                    <h3 className="text-h3 text-foreground">{item.titulo}</h3>
                    <p className="text-body text-muted-foreground">{item.texto}</p>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        </section>

        {/* Chamada */}
        <Card>
          <CardContent className="flex flex-col items-start gap-3 p-6 sm:flex-row sm:items-center">
            <Medal className="h-8 w-8 shrink-0 text-primary" aria-hidden="true" />
            <div className="space-y-1">
              <h2 className="text-h2 text-foreground">Sua escola está pronta?</h2>
              <p className="text-body text-muted-foreground">
                Inscreva sua escola nos Jogos Escolares de Roraima e revele os campeões do futuro!
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </ModuleLayout>
  );
}
