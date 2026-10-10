import { Link } from "react-router-dom";
import { FileText, Download, Calendar, Loader2 } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/design-system";
import { useIdentidade } from "@/core/tenant";
import { useTransparenciaPublicacoesPublicas } from "@/hooks/useTransparenciaPublicacoes";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function EditaisPublicoPage() {
  const { publicacoes, isLoading } = useTransparenciaPublicacoesPublicas();
  const { sigla } = useIdentidade();
  const editais = publicacoes.filter((doc) => doc.categoria === "Edital");

  return (
    <MainLayout>
      {/* Cabeçalho */}
      <section className="bg-primary text-primary-foreground py-12">
        <div className="container mx-auto px-4">
          <nav aria-label="Trilha de navegação" className="flex items-center gap-3 text-sm mb-4 opacity-90">
            <Link to="/" className="inline-flex min-h-11 items-center hover:underline">Início</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">Editais</span>
          </nav>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-accent rounded-xl flex items-center justify-center" aria-hidden="true">
              <FileText className="w-8 h-8 text-accent-foreground" />
            </div>
            <div>
              <h1 className="font-serif text-3xl lg:text-4xl font-bold">Editais</h1>
              <p className="text-base opacity-90 mt-1">
                Editais e chamamentos públicos do {sigla}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Conteúdo */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-12" role="status">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" aria-hidden="true" />
                <span className="sr-only">Carregando editais</span>
              </div>
            ) : editais.length === 0 ? (
              <EmptyState
                icone={FileText}
                titulo="Nenhum edital disponível no momento"
                className="bg-muted/30 rounded-xl"
              />
            ) : (
              <div className="grid gap-4">
                {editais.map((doc) => (
                  <Card key={doc.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex-1">
                          {doc.data_publicacao && (
                            <span className="text-sm text-muted-foreground flex items-center gap-1 mb-2">
                              <Calendar className="w-3 h-3" aria-hidden="true" />
                              {format(new Date(doc.data_publicacao), "dd/MM/yyyy", { locale: ptBR })}
                            </span>
                          )}
                          <h2 className="text-lg font-semibold mb-1">{doc.titulo}</h2>
                          {doc.descricao && (
                            <p className="text-base text-muted-foreground">{doc.descricao}</p>
                          )}
                        </div>
                        {doc.arquivo_url && (
                          <Button asChild variant="outline">
                            <a
                              href={doc.arquivo_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label={`Baixar ${doc.titulo} (abre em nova aba)`}
                            >
                              <Download className="w-4 h-4 mr-2" aria-hidden="true" />
                              Baixar
                            </a>
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </MainLayout>
  );
}
