import { Link } from "react-router-dom";
import { LinkIcon, ExternalLink, Loader2 } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/design-system";
import { useLinksUteisPublicos } from "@/hooks/useLinksUteis";

export default function LinksUteisPage() {
  const { links, isLoading } = useLinksUteisPublicos();

  return (
    <MainLayout>
      {/* Cabeçalho */}
      <section className="bg-primary text-primary-foreground py-12">
        <div className="container mx-auto px-4">
          <nav aria-label="Trilha de navegação" className="flex items-center gap-3 text-sm mb-4 opacity-90">
            <Link to="/" className="inline-flex min-h-11 items-center hover:underline">Início</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">Links úteis</span>
          </nav>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-accent rounded-xl flex items-center justify-center" aria-hidden="true">
              <LinkIcon className="w-8 h-8 text-accent-foreground" />
            </div>
            <div>
              <h1 className="font-serif text-3xl lg:text-4xl font-bold">Links Úteis</h1>
              <p className="text-base opacity-90 mt-1">
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
              <div className="flex items-center justify-center py-12" role="status">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" aria-hidden="true" />
                <span className="sr-only">Carregando links</span>
              </div>
            ) : links.length === 0 ? (
              <EmptyState
                icone={LinkIcon}
                titulo="Nenhum link disponível no momento"
                className="bg-muted/30 rounded-xl"
              />
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {links.map((link) => (
                  <Card
                    key={link.id}
                    className="group relative h-full hover:shadow-md transition-all hover:border-primary focus-within:ring-2 focus-within:ring-ring"
                  >
                      <CardContent className="p-6 flex items-start gap-4">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0" aria-hidden="true">
                          <ExternalLink className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h2 className="text-lg font-semibold group-hover:text-primary transition-colors">
                            <a
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="focus-visible:outline-none after:absolute after:inset-0 after:content-['']"
                            >
                              {link.titulo}
                              <span className="sr-only"> (abre em nova aba)</span>
                            </a>
                          </h2>
                          {link.descricao && (
                            <p className="text-base text-muted-foreground mt-1">{link.descricao}</p>
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
