/**
 * HISTÓRICO DE IMPORTAÇÕES (Administração)
 *
 * Cada setor importa os seus arquivos no próprio menu (Financeiro → Atualizar dados, RH → Folha, Gabinete →
 * Central de Portarias, Compras → Processos, Contratos → Contratos): o assistente abre na tela do setor
 * (`?importador=<id>`, ver `local` em cada importador). Aqui a Administração só consulta o histórico e vê onde
 * cada arquivo entra. O histórico respeita o setor no banco: cada um lê as importações dos módulos a que tem acesso.
 */

import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { ModuleLayout } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { HistoricoImportacoes } from "@/components/importacao";
import { PageHeader } from "@/components/design-system";
import { IMPORTADORES } from "@/lib/importacao/registro";

export default function ImportacoesPage() {
  return (
    <ModuleLayout module="admin">
      <div className="space-y-6">
        <PageHeader
          migalhas={[{ rotulo: "Administração", href: "/admin" }, { rotulo: "Histórico de importações" }]}
          titulo="Histórico de importações"
          descricao="Cada setor importa os seus arquivos no próprio menu. Aqui você consulta tudo o que foi importado."
        />

        <Card>
          <CardHeader>
            <CardTitle className="text-h3">Histórico</CardTitle>
            <CardDescription>Últimas importações aplicadas nos módulos a que você tem acesso.</CardDescription>
          </CardHeader>
          <CardContent className="p-0 sm:p-6 sm:pt-0">
            <HistoricoImportacoes />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-h3">Onde cada arquivo é importado</CardTitle>
            <CardDescription>Quem importa precisa da permissão do importador, dada no Painel de Permissões.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="divide-y">
              {IMPORTADORES.map((imp) => (
                <li key={imp.id} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                  <div className="min-w-0">
                    <p className="text-body font-medium text-foreground">{imp.titulo}</p>
                    <p className="text-caption text-muted-foreground">
                      Permissão: <code>{imp.permissao}</code>
                    </p>
                  </div>
                  <Link
                    to={imp.local.rota}
                    className="inline-flex shrink-0 items-center gap-1 text-body text-primary underline-offset-4 hover:underline"
                  >
                    {imp.local.caminho}
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </ModuleLayout>
  );
}
