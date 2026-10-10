/**
 * Página de gerenciamento do menu de navegação do site público
 * Permite marcar quais itens do menu ficam visíveis para os visitantes
 */

import { ModuleLayout } from "@/components/layout/ModuleLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Loader2, Eye, EyeOff, ListChecks } from "lucide-react";
import { EmptyState, PageHeader, StatusBadge } from "@/components/design-system";
import { useConfigMenuPublico, useToggleMenuVisivel } from "@/hooks/useConfigMenuPublico";

export default function GerenciadorMenuPublicoPage() {
  const { data: itens = [], isLoading } = useConfigMenuPublico();
  const toggleVisivel = useToggleMenuVisivel();

  return (
    <ModuleLayout module="admin">
      <div className="space-y-6">
        <PageHeader
          migalhas={[{ rotulo: "Administração", href: "/admin" }, { rotulo: "Menu do site público" }]}
          titulo="Menu do site público"
          descricao="Marque quais itens do menu de navegação do site ficam visíveis para os visitantes"
        />

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Itens do menu</CardTitle>
            <CardDescription>
              Itens ocultos deixam de aparecer no cabeçalho do site, mas as páginas continuam
              acessíveis diretamente pelo link
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12" role="status" aria-label="Carregando itens do menu">
                <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
              </div>
            ) : itens.length === 0 ? (
              <EmptyState icone={ListChecks} titulo="Nenhum item de menu configurado" />
            ) : (
              <div className="divide-y">
                {itens.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between py-4 first:pt-0 last:pb-0"
                  >
                    <div className="flex items-center gap-3">
                      {item.visivel ? (
                        <Eye className="h-4 w-4 text-success" aria-hidden="true" />
                      ) : (
                        <EyeOff className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                      )}
                      <span className="font-medium">{item.label}</span>
                      <StatusBadge tom={item.visivel ? "sucesso" : "neutro"}>
                        {item.visivel ? "Visível" : "Oculto"}
                      </StatusBadge>
                    </div>
                    <Switch
                      aria-label={`Exibir "${item.label}" no menu do site`}
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
