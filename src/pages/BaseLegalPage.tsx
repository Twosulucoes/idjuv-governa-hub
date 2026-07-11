import { Link } from "react-router-dom";
import { Scale, FileText, BookOpen, ArrowRight } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useDadosOficiais } from "@/hooks/useDadosOficiais";

export default function BaseLegalPage() {
  const { obterValor } = useDadosOficiais();

  const documentos = [
    {
      titulo: "Lei de Criação",
      referencia: obterValor("lei_criacao"),
      descricao: "Lei que institui o IDJUV e define sua natureza, finalidade e competências.",
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
          <div className="flex items-center gap-3 text-sm mb-4 opacity-80">
            <Link to="/" className="hover:underline">Início</Link>
            <span>/</span>
            <span>Base Legal</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-accent rounded-xl flex items-center justify-center">
              <Scale className="w-8 h-8 text-accent-foreground" />
            </div>
            <div>
              <h1 className="font-serif text-3xl lg:text-4xl font-bold">Base Legal</h1>
              <p className="opacity-90 mt-1">
                Legislação que fundamenta a criação e o funcionamento do IDJUV
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
              <Link key={doc.href} to={doc.href} className="group">
                <Card className="h-full hover:shadow-lg transition-all hover:border-primary">
                  <CardHeader className="flex flex-row items-start gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <doc.icon className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{doc.titulo}</CardTitle>
                      {doc.referencia && (
                        <CardDescription className="mt-1">{doc.referencia}</CardDescription>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{doc.descricao}</p>
                    <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary">
                      Ver documento
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </MainLayout>
  );
}
