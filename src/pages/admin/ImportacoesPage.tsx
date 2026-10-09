/**
 * CENTRAL DE IMPORTAÇÕES
 *
 * Lista os importadores que o usuário pode usar (permissão de cada um) e o
 * histórico das importações aplicadas. Cada importador roda no mesmo assistente
 * (ImportacaoWizard): arquivo → conferência → confirmação.
 */

import { useState } from "react";
import { FileUp } from "lucide-react";
import { ModuleLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { HistoricoImportacoes, ImportacaoWizard } from "@/components/importacao";
import { useAuth } from "@/contexts/AuthContext";
import { IMPORTADORES } from "@/lib/importacao/registro";
import type { Importador } from "@/lib/importacao/types";

export default function ImportacoesPage() {
  const { hasPermission } = useAuth();
  const [aberto, setAberto] = useState<Importador<unknown> | null>(null);
  const disponiveis = IMPORTADORES.filter((i) => hasPermission(i.permissao));

  return (
    <ModuleLayout module="admin">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Importação de dados</h1>
          <p className="text-muted-foreground">
            Atualize o sistema a partir de arquivos de outros sistemas. Tudo é conferido antes de gravar.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {disponiveis.map((imp) => (
            <Card key={imp.id}>
              <CardHeader>
                <CardTitle className="text-base">{imp.titulo}</CardTitle>
                <CardDescription>{imp.descricao}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => setAberto(imp)}>
                  <FileUp className="mr-2 h-4 w-4" aria-hidden />
                  Importar
                </Button>
              </CardContent>
            </Card>
          ))}
          {disponiveis.length === 0 && (
            <p className="text-sm text-muted-foreground">Você não tem permissão para nenhum importador.</p>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Histórico</CardTitle>
            <CardDescription>Últimas importações aplicadas nos módulos a que você tem acesso.</CardDescription>
          </CardHeader>
          <CardContent className="p-0 sm:p-6 sm:pt-0">
            <HistoricoImportacoes />
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!aberto} onOpenChange={(open) => !open && setAberto(null)}>
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Importar {aberto?.titulo}</DialogTitle>
            <DialogDescription>{aberto?.descricao}</DialogDescription>
          </DialogHeader>
          {aberto && <ImportacaoWizard importador={aberto} />}
        </DialogContent>
      </Dialog>
    </ModuleLayout>
  );
}
