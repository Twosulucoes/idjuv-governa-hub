/**
 * Diálogo de visualização de uma portaria (somente leitura).
 *
 * Usado pela Central de Portarias (/gabinete/portarias), que passa as ações de
 * editar e baixar PDF, e pela tela de pendências do RH
 * (/rh/portarias/pendencias), que só consulta.
 */
import { useMemo } from 'react';
import { AlertTriangle, Download, Pencil } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { STATUS_PORTARIA_LABELS, Portaria } from '@/types/portaria';

function htmlToText(html?: string | null) {
  if (!html) return '';
  try {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return (doc.body.textContent || '').trim();
  } catch {
    return html;
  }
}

interface VisualizarPortariaDialogProps {
  portaria: Portaria | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Quando informado, mostra o botão Editar. */
  onEditar?: (portaria: Portaria) => void;
  /** Quando informado, mostra o botão Baixar PDF. */
  onBaixarPdf?: (portaria: Portaria) => void;
  gerandoPdf?: boolean;
}

export function VisualizarPortariaDialog({
  portaria,
  open,
  onOpenChange,
  onEditar,
  onBaixarPdf,
  gerandoPdf = false,
}: VisualizarPortariaDialogProps) {
  const conteudoTexto = useMemo(() => htmlToText(portaria?.conteudo_html), [portaria?.conteudo_html]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {portaria ? `Portaria nº ${portaria.numero}` : 'Portaria'}
          </DialogTitle>
          <DialogDescription>
            {portaria?.ementa || portaria?.titulo || ''}
          </DialogDescription>
        </DialogHeader>

        {portaria && (
          <div className="space-y-4">
            {/* Status e Categoria */}
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">
                {STATUS_PORTARIA_LABELS[portaria.status]}
              </Badge>
              {portaria.categoria && (
                <Badge variant="outline" className="capitalize">
                  {portaria.categoria}
                </Badge>
              )}
            </div>

            {/* Grid de informações */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border bg-muted/20 p-3 space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Data do Documento</p>
                <p className="text-sm font-semibold">
                  {new Date(portaria.data_documento).toLocaleDateString('pt-BR')}
                </p>
              </div>

              <div className="rounded-lg border bg-muted/20 p-3 space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Assinatura</p>
                <p className="text-sm font-semibold">
                  {portaria.data_assinatura
                    ? new Date(portaria.data_assinatura).toLocaleDateString('pt-BR')
                    : <span className="text-muted-foreground font-normal">Não assinada</span>}
                </p>
                {portaria.assinante?.full_name && (
                  <p className="text-xs text-muted-foreground">{portaria.assinante.full_name}</p>
                )}
              </div>

              <div className="rounded-lg border bg-muted/20 p-3 space-y-1">
                <p className="text-xs font-medium text-muted-foreground">DOE (Diário Oficial)</p>
                {portaria.doe_numero || portaria.doe_data ? (
                  <>
                    {portaria.doe_numero && (
                      <p className="text-sm font-semibold">Nº {portaria.doe_numero}</p>
                    )}
                    {portaria.doe_data && (
                      <p className="text-xs text-muted-foreground">
                        {new Date(portaria.doe_data).toLocaleDateString('pt-BR')}
                      </p>
                    )}
                  </>
                ) : (
                  <div className="flex items-center gap-1 text-warning">
                    <AlertTriangle className="h-3 w-3" />
                    <span className="text-xs font-medium">Não informado</span>
                  </div>
                )}
              </div>

              <div className="rounded-lg border bg-muted/20 p-3 space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Anexo / Arquivo</p>
                {portaria.arquivo_assinado_url ? (
                  <a href={portaria.arquivo_assinado_url} target="_blank" rel="noreferrer"
                     className="text-sm text-primary underline font-medium">
                    📎 Arquivo assinado
                  </a>
                ) : portaria.arquivo_url ? (
                  <a href={portaria.arquivo_url} target="_blank" rel="noreferrer"
                     className="text-sm text-primary underline font-medium">
                    📎 Arquivo anexado
                  </a>
                ) : (
                  <div className="flex items-center gap-1 text-warning">
                    <AlertTriangle className="h-3 w-3" />
                    <span className="text-xs font-medium">Sem anexo</span>
                  </div>
                )}
              </div>
            </div>

            {/* Servidor / Cargo / Unidade */}
            {(portaria.servidor || portaria.cargo || portaria.unidade) && (
              <div className="rounded-lg border bg-muted/20 p-3 space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Vínculos</p>
                <div className="grid grid-cols-3 gap-2">
                  {portaria.servidor && (
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase">Servidor</p>
                      <p className="text-sm">{portaria.servidor.nome_completo}</p>
                      {portaria.servidor.matricula && (
                        <p className="text-xs text-muted-foreground">Mat. {portaria.servidor.matricula}</p>
                      )}
                    </div>
                  )}
                  {portaria.cargo && (
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase">Cargo</p>
                      <p className="text-sm">{portaria.cargo.nome}</p>
                      {portaria.cargo.sigla && (
                        <p className="text-xs text-muted-foreground">{portaria.cargo.sigla}</p>
                      )}
                    </div>
                  )}
                  {portaria.unidade && (
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase">Unidade</p>
                      <p className="text-sm">{portaria.unidade.nome}</p>
                      {portaria.unidade.sigla && (
                        <p className="text-xs text-muted-foreground">{portaria.unidade.sigla}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Servidores vinculados (múltiplos) */}
            {portaria.servidores_ids && portaria.servidores_ids.length > 0 && !portaria.servidor && (
              <div className="rounded-lg border bg-muted/20 p-3 space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Servidores vinculados</p>
                <p className="text-sm">{portaria.servidores_ids.length} servidor(es)</p>
              </div>
            )}

            {/* Vigência */}
            {(portaria.data_vigencia_inicio || portaria.data_vigencia_fim) && (
              <div className="rounded-lg border bg-muted/20 p-3 space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Vigência</p>
                <p className="text-sm">
                  {portaria.data_vigencia_inicio && new Date(portaria.data_vigencia_inicio).toLocaleDateString('pt-BR')}
                  {portaria.data_vigencia_inicio && portaria.data_vigencia_fim && ' a '}
                  {portaria.data_vigencia_fim && new Date(portaria.data_vigencia_fim).toLocaleDateString('pt-BR')}
                </p>
              </div>
            )}

            {/* Conteúdo */}
            {conteudoTexto && (
              <div className="rounded-lg border bg-muted/20 p-3">
                <p className="text-xs font-medium text-muted-foreground mb-2">Conteúdo</p>
                <pre className="whitespace-pre-wrap text-sm text-foreground/80 max-h-[30vh] overflow-auto">
                  {conteudoTexto}
                </pre>
              </div>
            )}

            {/* Observações */}
            {portaria.observacoes && (
              <div className="rounded-lg border bg-muted/20 p-3">
                <p className="text-xs font-medium text-muted-foreground mb-1">Observações</p>
                <p className="text-sm text-foreground/80">{portaria.observacoes}</p>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
          {portaria && onEditar && (
            <Button variant="outline" onClick={() => {
              onOpenChange(false);
              onEditar(portaria);
            }}>
              <Pencil className="h-4 w-4 mr-2" />
              Editar
            </Button>
          )}
          {portaria && onBaixarPdf && (
            <Button onClick={() => onBaixarPdf(portaria)} disabled={gerandoPdf}>
              <Download className="h-4 w-4 mr-2" />
              {gerandoPdf ? 'Gerando PDF...' : 'Baixar PDF'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
