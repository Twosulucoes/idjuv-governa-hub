import { Link } from "react-router-dom";
import { ModuleLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { KpiCard, PageHeader } from "@/components/design-system";
import {
  CheckCircle2,
  TrendingUp,
  Award,
  Rocket
} from "lucide-react";

export default function JovemEmpreendedorPage() {
  const modulos = [
    { titulo: "Ideação", descricao: "Desenvolvimento de ideias e identificação de oportunidades" },
    { titulo: "Modelo de Negócio", descricao: "Estruturação do Canvas e validação de mercado" },
    { titulo: "Finanças", descricao: "Gestão financeira e precificação" },
    { titulo: "Marketing Digital", descricao: "Presença online e estratégias de vendas" },
    { titulo: "Pitch", descricao: "Apresentação para investidores" },
    { titulo: "Mentoria", descricao: "Acompanhamento com empresários experientes" },
  ];

  const resultados = [
    { numero: "500+", texto: "Jovens capacitados" },
    { numero: "80+", texto: "Negócios criados" },
    { numero: "R$ 2M+", texto: "Faturamento gerado" },
    { numero: "15", texto: "Municípios atendidos" },
  ];

  const diferenciais = [
    "Capacitação 100% gratuita",
    "Certificado reconhecido",
    "Mentoria individualizada",
    "Acesso a rede de investidores",
    "Possibilidade de financiamento",
    "Suporte pós-programa",
  ];

  return (
    <ModuleLayout module="programas">
      <div className="space-y-6">
        <PageHeader
          migalhas={[{ rotulo: "Programas", href: "/programas" }, { rotulo: "Jovem Empreendedor" }]}
          titulo="Capacitação Jovem Empreendedor"
          descricao="Formando a próxima geração de empreendedores roraimenses, transformando ideias em negócios de sucesso."
          acoes={
            <Button asChild>
              <Link to="/sistema">
                <Award className="h-4 w-4" aria-hidden="true" />
                Inscreva-se agora
              </Link>
            </Button>
          }
        />

        {/* Resultados */}
        <section aria-labelledby="empreendedor-resultados">
          <h2 id="empreendedor-resultados" className="sr-only">Resultados</h2>
          <ul className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {resultados.map((resultado) => (
              <li key={resultado.texto}>
                <KpiCard rotulo={resultado.texto} valor={resultado.numero} className="h-full" />
              </li>
            ))}
          </ul>
        </section>

        {/* Sobre o programa */}
        <Card>
          <CardHeader>
            <h2 className="text-h2 text-foreground">O que é a Capacitação Jovem Empreendedor?</h2>
          </CardHeader>
          <CardContent className="max-w-prose space-y-4 text-body text-muted-foreground">
            <p>
              A Capacitação Jovem Empreendedor é um programa intensivo de formação empresarial
              voltado para jovens de 18 a 29 anos que desejam abrir seu próprio negócio ou
              formalizar um empreendimento já existente. O programa oferece conhecimentos
              práticos em gestão, finanças, marketing e vendas.
            </p>
            <p>
              Com uma metodologia hands-on, os participantes desenvolvem seus projetos de negócio
              ao longo do curso, recebendo mentoria de empresários experientes e tendo acesso a
              uma rede de contatos que pode impulsionar suas carreiras empreendedoras.
            </p>
          </CardContent>
        </Card>

        {/* Módulos */}
        <section aria-labelledby="empreendedor-modulos" className="space-y-4">
          <h2 id="empreendedor-modulos" className="text-h2 text-foreground">Módulos do programa</h2>
          <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {modulos.map((modulo, index) => (
              <li key={modulo.titulo}>
                <Card className="h-full">
                  <CardContent className="space-y-2 p-6">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                        <span className="font-semibold tabular-nums text-primary">{index + 1}</span>
                      </div>
                      <h3 className="text-h3 text-foreground">{modulo.titulo}</h3>
                    </div>
                    <p className="text-body text-muted-foreground">{modulo.descricao}</p>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ol>
        </section>

        {/* Diferenciais e próxima turma */}
        <div className="grid items-start gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <h2 className="text-h2 text-foreground">Por que participar?</h2>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {diferenciais.map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                    <span className="text-body text-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-3 p-6">
              <Rocket className="h-8 w-8 text-primary" aria-hidden="true" />
              <h2 className="text-h2 text-foreground">Próxima turma</h2>
              <p className="text-body text-muted-foreground">
                As inscrições para a próxima turma estão abertas. Vagas limitadas!
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Chamada */}
        <Card>
          <CardContent className="flex flex-col items-start gap-3 p-6 sm:flex-row sm:items-center">
            <TrendingUp className="h-8 w-8 shrink-0 text-primary" aria-hidden="true" />
            <div className="space-y-1">
              <h2 className="text-h2 text-foreground">Transforme sua ideia em realidade</h2>
              <p className="text-body text-muted-foreground">
                Não perca a oportunidade de se capacitar gratuitamente e iniciar sua jornada empreendedora.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </ModuleLayout>
  );
}
