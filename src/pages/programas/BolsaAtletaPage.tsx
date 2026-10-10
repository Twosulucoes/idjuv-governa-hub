import { Link } from "react-router-dom";
import { ModuleLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/design-system";
import { useIdentidade } from "@/core/tenant";
import {
  Target,
  CheckCircle2,
  FileText,
  Calendar,
  Medal,
  Dumbbell
} from "lucide-react";

export default function BolsaAtletaPage() {
  const { sigla } = useIdentidade();

  const beneficios = [
    "Apoio financeiro mensal para atletas de alto rendimento",
    "Custeio de participação em competições estaduais e nacionais",
    "Auxílio para aquisição de equipamentos esportivos",
    "Acompanhamento técnico e nutricional",
  ];

  const requisitos = [
    "Ser atleta federado em modalidade esportiva reconhecida",
    "Residir no Estado de Roraima há pelo menos 2 anos",
    "Ter idade entre 14 e 35 anos",
    "Comprovar participação em competições oficiais",
    "Manter regularidade escolar (para menores de 18 anos)",
  ];

  const categorias = [
    { nome: "Atleta Base", valor: "R$ 400,00", descricao: "Atletas em formação com resultados estaduais" },
    { nome: "Atleta Estadual", valor: "R$ 600,00", descricao: "Atletas com resultados em competições estaduais" },
    { nome: "Atleta Nacional", valor: "R$ 1.000,00", descricao: "Atletas com participação em competições nacionais" },
    { nome: "Atleta de Elite", valor: "R$ 1.500,00", descricao: "Atletas com resultados expressivos em nível nacional" },
  ];

  return (
    <ModuleLayout module="programas">
      <div className="space-y-6">
        <PageHeader
          migalhas={[{ rotulo: "Programas", href: "/programas" }, { rotulo: "Bolsa Atleta" }]}
          titulo="Bolsa Atleta Estadual"
          descricao="Programa de incentivo ao esporte que oferece apoio financeiro a atletas roraimenses de alto rendimento, contribuindo para o desenvolvimento do esporte no estado."
          acoes={
            <Button asChild>
              <Link to="/sistema">
                <Calendar className="h-4 w-4" aria-hidden="true" />
                Ver editais abertos
              </Link>
            </Button>
          }
        />

        {/* Sobre o programa */}
        <Card>
          <CardHeader>
            <h2 className="text-h2 text-foreground">O que é o Bolsa Atleta?</h2>
          </CardHeader>
          <CardContent className="max-w-prose space-y-4 text-body text-muted-foreground">
            <p>
              O Bolsa Atleta Estadual é um programa do Governo do Estado de Roraima, executado pelo {sigla},
              que visa incentivar e apoiar atletas que representam o estado em competições esportivas.
              O programa oferece suporte financeiro mensal para que os atletas possam se dedicar
              integralmente aos treinamentos e competições.
            </p>
            <p>
              Criado para valorizar o talento esportivo roraimense, o programa já beneficiou centenas
              de atletas de diversas modalidades, contribuindo para conquistas importantes em
              competições regionais, nacionais e internacionais.
            </p>
          </CardContent>
        </Card>

        {/* Categorias */}
        <section aria-labelledby="bolsa-categorias" className="space-y-4">
          <h2 id="bolsa-categorias" className="text-h2 text-foreground">Valores por categoria</h2>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {categorias.map((cat) => (
              <li key={cat.nome}>
                <Card className="h-full text-center">
                  <CardContent className="space-y-2 p-6">
                    <Medal className="mx-auto h-8 w-8 text-primary" aria-hidden="true" />
                    <h3 className="text-h3 text-foreground">{cat.nome}</h3>
                    <p className="text-h2 tabular-nums text-primary">{cat.valor}</p>
                    <p className="text-body text-muted-foreground">{cat.descricao}</p>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        </section>

        {/* Benefícios e requisitos */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center gap-3 space-y-0">
              <Target className="h-6 w-6 text-primary" aria-hidden="true" />
              <h2 className="text-h2 text-foreground">Benefícios</h2>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {beneficios.map((beneficio) => (
                  <li key={beneficio} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                    <span className="text-body text-muted-foreground">{beneficio}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center gap-3 space-y-0">
              <FileText className="h-6 w-6 text-secondary" aria-hidden="true" />
              <h2 className="text-h2 text-foreground">Requisitos</h2>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {requisitos.map((requisito) => (
                  <li key={requisito} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-secondary" aria-hidden="true" />
                    <span className="text-body text-muted-foreground">{requisito}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Chamada */}
        <Card>
          <CardContent className="flex flex-col items-start gap-3 p-6 sm:flex-row sm:items-center">
            <Dumbbell className="h-8 w-8 shrink-0 text-primary" aria-hidden="true" />
            <div className="space-y-1">
              <h2 className="text-h2 text-foreground">Quer ser um bolsista?</h2>
              <p className="text-body text-muted-foreground">
                Fique atento aos editais de seleção do Bolsa Atleta Estadual.
                As inscrições são abertas anualmente.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </ModuleLayout>
  );
}
