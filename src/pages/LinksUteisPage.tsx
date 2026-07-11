import { Link } from "react-router-dom";
import { LinkIcon, ExternalLink, Loader2 } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent } from "@/components/ui/card";
import { useLinksUteisPublicos } from "@/hooks/useLinksUteis";

export default function LinksUteisPage() {
  const { links, isLoading } = useLinksUteisPublicos();

  return (
    <MainLayout>
      {/* Cabeçalho */}
      <section className="bg-primary text-primary-foreground py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 text-sm mb-4 opacity-80">
            <Link to="/" className="hover:underline">Início</Link>
            <span>/</span>
            <span>Links Úteis</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-accent rounded-xl flex items-center justify-center">
              <LinkIcon className="w-8 h-8 text-accent-foreground" />
            </div>
            <div>
              <h1 className="font-serif text-3xl lg:text-4xl font-bold">Links Úteis</h1>
              <p className="opacity-90 mt-1">
                Acesso rápido a serviços e páginas de interesse público
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Conteúdo */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : links.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground bg-muted/30 rounded-xl">
                Nenhum link disponível no momento
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {links.map((link) => (
                  <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group"
                  >
                    <Card className="h-full hover:shadow-md transition-all hover:border-primary">
                      <CardContent className="p-6 flex items-start gap-4">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                          <ExternalLink className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold group-hover:text-primary transition-colors">
                            {link.titulo}
                          </h3>
                          {link.descricao && (
                            <p className="text-sm text-muted-foreground mt-1">{link.descricao}</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </MainLayout>
  );
}
