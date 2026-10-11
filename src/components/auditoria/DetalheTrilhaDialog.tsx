/**
 * Detalhe de uma linha da trilha de auditoria: quem fez (servidor responsável e origem), quando, onde (IP, user
 * agent, unidade) e o diff campo a campo. Os valores vêm do banco já mascarados (LGPD); tudo é exibido como texto
 * (descrição e metadados nunca viram HTML).
 */

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AlertCircle, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/design-system";
import { AUDIT_ACTION_LABELS } from "@/types/auth";
import {
  ORIGEM_TRILHA_LABELS,
  calcularDiff,
  responsavelTrilha,
  useDetalheTrilha,
  valorComoTexto,
} from "@/hooks/useTrilhaAuditoria";
import { TOM_ACAO_TRILHA, nomeModulo, rotuloEntidade } from "@/components/auditoria/trilhaRotulos";

interface DetalheTrilhaDialogProps {
  id: string | null;
  onOpenChange: (aberto: boolean) => void;
}

function Campo({ rotulo, children }: { rotulo: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-sm font-medium text-muted-foreground">{rotulo}</dt>
      <dd className="break-words">{children}</dd>
    </div>
  );
}

export function DetalheTrilhaDialog({ id, onOpenChange }: DetalheTrilhaDialogProps) {
  const { data: linha, isLoading, error } = useDetalheTrilha(id);
  const [todosCampos, setTodosCampos] = useState(false);

  const diff = useMemo(() => (linha ? calcularDiff(linha) : []), [linha]);
  const visiveis = todosCampos ? diff : diff.filter((c) => c.alterado);
  const ehAtualizacao = !!linha?.before_data && !!linha?.after_data;
  const metadados = linha?.metadata && Object.keys(linha.metadata).length > 0 ? linha.metadata : null;

  return (
    <Dialog open={!!id} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Registro da trilha de auditoria</DialogTitle>
          <DialogDescription>Quem fez, quando, de onde e o que mudou. Dados pessoais aparecem mascarados.</DialogDescription>
        </DialogHeader>

        {isLoading && (
          <div className="flex items-center justify-center py-10" role="status">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-hidden="true" />
            <span className="sr-only">Carregando registro…</span>
          </div>
        )}

        {error && (
          <p role="alert" className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-4 w-4" aria-hidden="true" />
            Não foi possível carregar o registro.
          </p>
        )}

        {!isLoading && !error && !linha && id && (
          <p className="text-muted-foreground">Registro não encontrado ou sem permissão de leitura.</p>
        )}

        {linha && (
          <div className="space-y-6">
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Campo rotulo="Data/hora">
                {format(new Date(linha.timestamp), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })}
              </Campo>
              <Campo rotulo="Sequência">
                <span className="font-mono">{linha.sequencia ?? "—"}</span>
              </Campo>
              <Campo rotulo="Responsável">{responsavelTrilha(linha)}</Campo>
              <Campo rotulo="Origem">{linha.origem ? ORIGEM_TRILHA_LABELS[linha.origem] ?? linha.origem : "—"}</Campo>
              <Campo rotulo="Ação">
                <StatusBadge tom={TOM_ACAO_TRILHA[linha.action] ?? "neutro"} icone={false}>
                  {AUDIT_ACTION_LABELS[linha.action] ?? linha.action}
                </StatusBadge>
              </Campo>
              <Campo rotulo="Perfil no momento">
                {linha.role_at_time ? <Badge variant="outline">{linha.role_at_time}</Badge> : "—"}
              </Campo>
              <Campo rotulo="Módulo">{nomeModulo(linha.module_name)}</Campo>
              <Campo rotulo="Tabela/entidade">
                <span className="font-mono">{rotuloEntidade(linha.entity_type)}</span>
              </Campo>
              <Campo rotulo="ID do registro">
                <span className="font-mono text-xs">{linha.entity_id ?? "—"}</span>
              </Campo>
              <Campo rotulo="Unidade">{linha.org_unit?.nome ?? "—"}</Campo>
              <Campo rotulo="IP">
                <span className="font-mono">{linha.ip_address ?? "—"}</span>
              </Campo>
              <Campo rotulo="Transação">
                <span className="font-mono">{linha.transacao ?? "—"}</span>
              </Campo>
            </dl>

            {linha.description && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Descrição</h3>
                <p className="whitespace-pre-wrap break-words">{linha.description}</p>
              </div>
            )}

            {diff.length > 0 && (
              <section aria-labelledby="trilha-diff-titulo" className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 id="trilha-diff-titulo" className="text-h3">
                    {ehAtualizacao ? "Campos alterados" : linha.after_data ? "Dados gravados" : "Dados excluídos"}
                  </h3>
                  {ehAtualizacao && (
                    <div className="flex items-center gap-2">
                      <Switch id="trilha-todos-campos" checked={todosCampos} onCheckedChange={setTodosCampos} />
                      <Label htmlFor="trilha-todos-campos">Mostrar todos os campos</Label>
                    </div>
                  )}
                </div>
                {visiveis.length === 0 ? (
                  <p className="text-muted-foreground">Nenhum campo alterado.</p>
                ) : (
                  <ul className="divide-y rounded-md border">
                    {ehAtualizacao && (
                      <li
                        aria-hidden="true"
                        className="hidden sm:grid grid-cols-[minmax(0,10rem)_1fr_1fr] gap-3 bg-muted/50 p-3 text-caption font-medium text-muted-foreground"
                      >
                        <span>Campo</span>
                        <span>Antes</span>
                        <span>Depois</span>
                      </li>
                    )}
                    {visiveis.map((c) => (
                      <li key={c.campo} className="grid grid-cols-1 gap-1 p-3 sm:grid-cols-[minmax(0,10rem)_1fr_1fr] sm:gap-3">
                        <span className="font-mono text-xs font-medium break-all">
                          {c.campo}
                          {ehAtualizacao && c.alterado && <span className="sr-only"> (alterado)</span>}
                        </span>
                        {ehAtualizacao || linha.before_data ? (
                          <span className="min-w-0">
                            <span className="text-caption text-muted-foreground sm:sr-only">Antes: </span>
                            <span className="whitespace-pre-wrap break-words text-sm">{valorComoTexto(c.antes)}</span>
                          </span>
                        ) : (
                          <span className="hidden sm:block" aria-hidden="true" />
                        )}
                        {ehAtualizacao || linha.after_data ? (
                          <span className={c.alterado && ehAtualizacao ? "min-w-0 font-medium" : "min-w-0"}>
                            <span className="text-caption text-muted-foreground sm:sr-only">Depois: </span>
                            <span className="whitespace-pre-wrap break-words text-sm">{valorComoTexto(c.depois)}</span>
                          </span>
                        ) : (
                          <span className="hidden sm:block" aria-hidden="true" />
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            )}

            {metadados && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Metadados</h3>
                <pre className="bg-muted p-3 rounded-md text-xs overflow-auto max-h-48 whitespace-pre-wrap break-words">
                  {JSON.stringify(metadados, null, 2)}
                </pre>
              </div>
            )}

            {linha.user_agent && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Navegador (user agent)</h3>
                <p className="text-xs text-muted-foreground break-words">{linha.user_agent}</p>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
