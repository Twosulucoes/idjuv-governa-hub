import { X, Building2, Users, Phone, Mail, MapPin, FileText, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { UnidadeOrganizacional, LABELS_UNIDADE, CORES_UNIDADE, Lotacao } from '@/types/organograma';
import { cn } from '@/lib/utils';

interface UnidadeDetailPanelProps {
  unidade: UnidadeOrganizacional;
  lotacoes: Lotacao[];
  onClose: () => void;
}

export default function UnidadeDetailPanel({ unidade, lotacoes, onClose }: UnidadeDetailPanelProps) {
  const cores = CORES_UNIDADE[unidade.tipo];

  return (
    <div className="w-96 bg-card border-l h-full flex flex-col">
      {/* Header */}
      <div className={cn('p-4', cores.bg, cores.text)}>
        <div className="flex items-start justify-between">
          <div>
            <Badge variant="secondary" className="mb-2 bg-background/20 text-inherit">
              {LABELS_UNIDADE[unidade.tipo]}
            </Badge>
            {unidade.sigla && (
              <p className="text-sm opacity-80 font-mono">{unidade.sigla}</p>
            )}
            <h2 className="text-xl font-bold">{unidade.nome}</h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-inherit hover:bg-background/20"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Responsável */}
          {unidade.servidor_responsavel && (
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Responsável
              </h3>
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={unidade.servidor_responsavel.avatar_url || undefined} />
                  <AvatarFallback>
                    {unidade.servidor_responsavel.full_name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{unidade.servidor_responsavel.full_name}</p>
                  <p className="text-sm text-muted-foreground">Chefe da Unidade</p>
                </div>
              </div>
            </div>
          )}

          {/* Descrição */}
          {unidade.descricao && (
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-2">Descrição</h3>
              <p className="text-sm text-foreground">{unidade.descricao}</p>
            </div>
          )}

          {/* Competências */}
          {unidade.competencias && unidade.competencias.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-2">Competências</h3>
              <ul className="space-y-1">
                {unidade.competencias.map((comp, index) => (
                  <li key={index} className="text-sm text-foreground flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    {comp}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <Separator />

          {/* Contato */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-2">Contato</h3>
            <div className="space-y-2">
              {unidade.telefone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{unidade.telefone}</span>
                  {unidade.ramal && <span className="text-muted-foreground">(Ramal: {unidade.ramal})</span>}
                </div>
              )}
              {unidade.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <a href={`mailto:${unidade.email}`} className="text-primary hover:underline">
                    {unidade.email}
                  </a>
                </div>
              )}
              {unidade.localizacao && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{unidade.localizacao}</span>
                </div>
              )}
              {!unidade.telefone && !unidade.email && !unidade.localizacao && (
                <p className="text-sm text-muted-foreground italic">Nenhum contato cadastrado</p>
              )}
            </div>
          </div>

          {/* Dados Legais */}
          {unidade.lei_criacao_numero && (
            <>
              <Separator />
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Base Legal
                </h3>
                <div className="p-3 bg-muted/50 rounded-lg space-y-1">
                  <p className="text-sm font-medium">Lei {unidade.lei_criacao_numero}</p>
                  {unidade.lei_criacao_data && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(unidade.lei_criacao_data).toLocaleDateString('pt-BR')}
                    </p>
                  )}
                </div>
              </div>
            </>
          )}

          <Separator />

          {/* Servidores Lotados */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Servidores Lotados ({lotacoes.length})
            </h3>
            {lotacoes.length > 0 ? (
              <div className="space-y-2">
                {lotacoes.map((lotacao) => (
                  <div key={lotacao.id} className="flex items-center gap-3 p-2 bg-muted/30 rounded-lg">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={lotacao.servidor?.avatar_url || undefined} />
                      <AvatarFallback className="text-xs">
                        {lotacao.servidor?.full_name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {lotacao.servidor?.full_name || 'Servidor'}
                      </p>
                      {lotacao.cargo && (
                        <p className="text-xs text-muted-foreground truncate">
                          {lotacao.cargo.nome}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">Nenhum servidor lotado</p>
            )}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
