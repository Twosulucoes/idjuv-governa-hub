import { Link } from "react-router-dom";
import { ModuleLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/design-system";
import {
  Target,
  CheckCircle2,
  BookOpen,
  Briefcase,
  Heart,
  Lightbulb,
  GraduationCap
} from "lucide-react";

export default function JuventudeCidadaPage() {
  const eixos = [
    {
      icon: BookOpen,
      titulo: "Educação",
      descricao: "Incentivo à permanência escolar e acesso ao ensino superior"
    },
    {
      icon: Briefcase,
      titulo: "Trabalho",
      descricao: "Qualificação profissional e inserção no mercado de trabalho"
    },
    {
      icon: Heart,
      titulo: "Cidadania",
      descricao: "Formação política e participação social"
    },
    {
      icon: Lightbulb,
      titulo: "Empreendedorismo",
      descricao: "Estímulo ao protagonismo juvenil e criação de negócios"
    },
  ];

  const acoes = [
    "Cursos de capacitação profissional gratuitos",
    "Oficinas de empreendedorismo jovem",
    "Palestras sobre cidadania e direitos",
    "Apoio a projetos de impacto social",
    "Rede de mentoria com profissionais",
    "Feiras de oportunidades e emprego",
  ];

  return (
    <ModuleLayout module="programas">
      <div className="space-y-6">
        <PageHeader
          migalhas={[{ rotulo: "Programas", href: "/programas" }, { rotulo: "Juventude Cidadã" }]}
          titulo="Juventude Cidadã"
          descricao="Programa de formação cidadã e profissional para jovens roraimenses, promovendo protagonismo, qualificação e inserção social."
          acoes={
            <Button asChild>
              <Link to="/sistema">
                <Target className="h-4 w-4" aria-hidden="true" />
                Inscreva-se
              </Link>
            </Button>
          }
        />

        {/* Sobre o programa */}
        <Card>
          <CardHeader>
            <h2 className="text-h2 text-foreground">O que é o Juventude Cidadã?</h2>
          </CardHeader>
          <CardContent className="max-w-prose space-y-4 text-body text-muted-foreground">
            <p>
              O Juventude Cidadã é um programa integrado de políticas públicas voltado para jovens
              de 15 a 29 anos do Estado de Roraima. O programa busca promover o desenvolvimento
              integral da juventude através de ações de educação, capacitação profissional,
              formação cidadã e estímulo ao empreendedorismo.
            </p>
            <p>
              Por meio de parcerias com instituições de ensino, empresas e organizações da sociedade civil,
              o programa oferece oportunidades concretas para que os jovens roraimenses possam
              construir um futuro promissor, contribuindo para o desenvolvimento do estado.
            </p>
          </CardContent>
        </Card>

        {/* Eixos de atuação */}
        <section aria-labelledby="juventude-eixos" className="space-y-4">
          <h2 id="juventude-eixos" className="text-h2 text-foreground">Eixos de atuação</h2>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {eixos.map((eixo) => (
              <li key={eixo.titulo}>
                <Card className="h-full text-center">
                  <CardContent className="space-y-2 p-6">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-secondary/10">
                      <eixo.icon className="h-6 w-6 text-secondary" aria-hidden="true" />
                    </div>
                    <h3 className="text-h3 text-foreground">{eixo.titulo}</h3>
                    <p className="text-body text-muted-foreground">{eixo.descricao}</p>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        </section>

        {/* Ações */}
        <section aria-labelledby="juventude-acoes" className="space-y-4">
          <h2 id="juventude-acoes" className="text-h2 text-foreground">Principais ações</h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {acoes.map((acao) => (
              <li
                key={acao}
                className="flex items-center gap-3 rounded-lg border border-border bg-card p-4"
              >
                <CheckCircle2 className="h-5 w-5 shrink-0 text-secondary" aria-hidden="true" />
                <span className="text-body text-foreground">{acao}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Chamada */}
        <Card>
          <CardContent className="flex flex-col items-start gap-3 p-6 sm:flex-row sm:items-center">
            <GraduationCap className="h-8 w-8 shrink-0 text-primary" aria-hidden="true" />
            <div className="space-y-1">
              <h2 className="text-h2 text-foreground">Faça parte!</h2>
              <p className="text-body text-muted-foreground">
                Participe do programa Juventude Cidadã e transforme seu futuro.
                Acompanhe as inscrições para cursos e oficinas.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </ModuleLayout>
  );
}
