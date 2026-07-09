/**
 * Página de gerenciamento do menu de navegação do site público
 * Permite marcar quais itens do menu ficam visíveis para os visitantes
 */

import { ModuleLayout } from "@/components/layout/ModuleLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Loader2, ListChecks, Eye, EyeOff } from "lucide-react";
import { useConfigMenuPublico, useToggleMenuVisivel } from "@/hooks/useConfigMenuPublico";

export default function GerenciadorMenuPublicoPage() {
  const { data: itens = [], isLoading } = useConfigMenuPublico();
  const toggleVisivel = useToggleMenuVisivel();

  return (
    <ModuleLayout module="admin" title="Menu do Site Público">
      <div className="container py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ListChecks className="h-6 w-6 text-primary" />
            Menu do Site Público
          </h1>
          <p className="text-muted-foreground">
            Marque quais itens do menu de navegação do site ficam visíveis para os visitantes
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Itens do Menu</CardTitle>
            <CardDescription>
              Itens ocultos deixam de aparecer no cabeçalho do site, mas as páginas continuam
              acessíveis diretamente pelo link
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="divide-y">
                {itens.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between py-4 first:pt-0 last:pb-0"
                  >
                    <div className="flex items-center gap-3">
                      {item.visivel ? (
                        <Eye className="h-4 w-4 text-success" />
                      ) : (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className="font-medium">{item.label}</span>
                    </div>
                    <Switch
                      checked={item.visivel}
                      disabled={toggleVisivel.isPending}
                      onCheckedChange={(checked) =>
                        toggleVisivel.mutate({ id: item.id, visivel: checked })
                      }
                    />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ModuleLayout>
  );
}
