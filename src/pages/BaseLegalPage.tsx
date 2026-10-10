import { Link } from "react-router-dom";
import { Scale, FileText, BookOpen, ArrowRight } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardDescription } from "@/components/ui/card";
import { useDadosOficiais } from "@/hooks/useDadosOficiais";
import { useIdentidade } from "@/core/tenant";

export default function BaseLegalPage() {
  const { obterValor } = useDadosOficiais();
  const { sigla } = useIdentidade();

  const documentos = [
    {
      titulo: "Lei de Criação",
      referencia: obterValor("lei_criacao"),
      descricao: `Lei que institui o ${sigla} e define sua natureza, finalidade e competências.`,
      href: "/governanca/lei-criacao",
      icon: BookOpen,
    },
    {
      titulo: "Decreto Regulamentador",
      referencia: obterValor("decreto_regulamentacao"),
      descricao: "Decreto que regulamenta a estrutura e o funcionamento do Instituto.",
      href: "/governanca/decreto",
      icon: FileText,
    },
  ];

  return (
    <MainLayout>
      {/* Cabeçalho */}
      <section className="bg-primary text-primary-foreground py-12">
        <div className="container mx-auto px-4">
          <nav aria-label="Trilha de navegação" className="flex items-center gap-3 text-sm mb-4 opacity-90">
            <Link to="/" className="inline-flex min-h-11 items-center hover:underline">Início</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">Base legal</span>
          </nav>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-accent rounded-xl flex items-center justify-center" aria-hidden="true">
              <Scale className="w-8 h-8 text-accent-foreground" />
            </div>
            <div>
              <h1 className="font-serif text-3xl lg:text-4xl font-bold">Base Legal</h1>
              <p className="text-base opacity-90 mt-1">
                Legislação que fundamenta a criação e o funcionamento do {sigla}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Conteúdo */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto grid gap-6 md:grid-cols-2">
            {documentos.map((doc) => (
              <Card
                key={doc.href}
                className="group relative h-full hover:shadow-lg transition-all hover:border-primary focus-within:ring-2 focus-within:ring-ring"
              >
                  <CardHeader className="flex flex-row items-start gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0" aria-hidden="true">
                      <doc.icon className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold leading-tight tracking-tight">
                        <Link
                          to={doc.href}
                          className="focus-visible:outline-none after:absolute after:inset-0 after:content-['']"
                        >
                          {doc.titulo}
                        </Link>
                      </h2>
                      {doc.referencia && (
                        <CardDescription className="mt-1">{doc.referencia}</CardDescription>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-base text-muted-foreground">{doc.descricao}</p>
                    <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary" aria-hidden="true">
                      Ver documento
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </span>
                  </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </MainLayout>
  );
}
