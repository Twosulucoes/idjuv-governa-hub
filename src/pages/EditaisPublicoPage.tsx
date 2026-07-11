import { Link } from "react-router-dom";
import { FileText, Download, Calendar, Loader2 } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTransparenciaPublicacoesPublicas } from "@/hooks/useTransparenciaPublicacoes";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function EditaisPublicoPage() {
  const { publicacoes, isLoading } = useTransparenciaPublicacoesPublicas();
  const editais = publicacoes.filter((doc) => doc.categoria === "Edital");

  return (
    <MainLayout>
      {/* Cabeçalho */}
      <section className="bg-primary text-primary-foreground py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 text-sm mb-4 opacity-80">
            <Link to="/" className="hover:underline">Início</Link>
            <span>/</span>
            <span>Editais</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-accent rounded-xl flex items-center justify-center">
              <FileText className="w-8 h-8 text-accent-foreground" />
            </div>
            <div>
              <h1 className="font-serif text-3xl lg:text-4xl font-bold">Editais</h1>
              <p className="opacity-90 mt-1">
                Editais e chamamentos públicos do IDJUV
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
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : editais.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground bg-muted/30 rounded-xl">
                Nenhum edital disponível no momento
              </div>
            ) : (
              <div className="grid gap-4">
                {editais.map((doc) => (
                  <Card key={doc.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex-1">
                          {doc.data_publicacao && (
                            <span className="text-sm text-muted-foreground flex items-center gap-1 mb-2">
                              <Calendar className="w-3 h-3" />
                              {format(new Date(doc.data_publicacao), "dd/MM/yyyy", { locale: ptBR })}
                            </span>
                          )}
                          <h3 className="font-semibold mb-1">{doc.titulo}</h3>
                          {doc.descricao && (
                            <p className="text-sm text-muted-foreground">{doc.descricao}</p>
                          )}
                        </div>
                        {doc.arquivo_url && (
                          <Button asChild variant="outline">
                            <a href={doc.arquivo_url} target="_blank" rel="noopener noreferrer">
                              <Download className="w-4 h-4 mr-2" />
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
