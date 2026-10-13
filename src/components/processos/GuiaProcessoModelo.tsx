/**
 * Guia de um tipo de processo, lido do modelo cadastrado no banco: etapas, checklist e os processos em andamento.
 * "Iniciar processo" abre o diálogo de novo processo já fixado no modelo (exige o módulo workflow e workflow.criar).
 * Sem o módulo workflow a RLS esconde o modelo: a tela pede acesso em vez de dizer que o modelo não existe.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DataTable, EmptyState, StatusBadge, type ColunaTabela } from '@/components/design-system';
import { AvisoLimiteLinhas } from '@/components/workflow/AvisoLimiteLinhas';
import { NovoProcessoDialog } from '@/components/workflow/NovoProcessoDialog';
import { useAuth } from '@/contexts/AuthContext';
import { useModeloProcesso, useProcessosAcompanhamento } from '@/hooks/useAcompanhamentoProcessos';
import { rotuloSituacaoPrazo, TOM_STATUS_PROCESSO, tomStatusDoSemaforo } from '@/lib/workflow/semaforoPrazo';
import { STATUS_PROCESSO_LABELS, type ProcessoAcompanhamento } from '@/types/workflow';

const colunas: ColunaTabela<ProcessoAcompanhamento>[] = [
  {
    id: 'processo',
    cabecalho: 'Processo',
    mobile: 'titulo',
    celula: (p) => (
      <div className="min-w-0">
        <div className="font-medium text-foreground">{p.assunto}</div>
        <div className="font-mono text-caption text-muted-foreground">
          {p.numero_formatado || `${p.numero_processo}/${p.ano}`}
          {p.numero_sei ? ` • SEI ${p.numero_sei}` : ''}
        </div>
      </div>
    ),
    ordenarPor: (p) => p.assunto,
    buscarPor: (p) => `${p.assunto} ${p.numero_formatado} ${p.numero_sei ?? ''} ${p.interessado_nome}`,
  },
  {
    id: 'etapa',
    cabecalho: 'Etapa',
    celula: (p) =>
      p.etapa_atual_ordem ? (
        <span>{p.etapa_atual_ordem}/{p.etapa_total}. {p.etapa_nome}</span>
      ) : (
        <span className="text-muted-foreground">Sem trilha</span>
      ),
    ordenarPor: (p) => p.etapa_atual_ordem ?? 0,
  },
  {
    id: 'unidade',
    cabecalho: 'Unidade',
    celula: (p) => <span>{p.unidade_sigla ?? p.unidade_nome ?? '-'}</span>,
    ordenarPor: (p) => p.unidade_sigla ?? p.unidade_nome ?? '',
  },
  {
    id: 'status',
    cabecalho: 'Situação',
    celula: (p) => (
      <StatusBadge tom={TOM_STATUS_PROCESSO[p.status] ?? 'neutro'}>{STATUS_PROCESSO_LABELS[p.status] ?? p.status}</StatusBadge>
    ),
    ordenarPor: (p) => STATUS_PROCESSO_LABELS[p.status] ?? p.status,
  },
  {
    id: 'prazo',
    cabecalho: 'Prazo',
    celula: (p) => {
      const prazo = rotuloSituacaoPrazo(p.situacao_prazo);
      return <StatusBadge tom={tomStatusDoSemaforo(prazo.tom)}>{prazo.texto}</StatusBadge>;
    },
    ordenarPor: (p) => rotuloSituacaoPrazo(p.situacao_prazo).texto,
  },
];

function ListaProcessos({ modeloCodigo }: { modeloCodigo: string }) {
  const navigate = useNavigate();
  const processos = useProcessosAcompanhamento({ escopo: 'todos', modeloCodigo });
  const lista = processos.data ?? [];
  return (
    <>
      <AvisoLimiteLinhas total={lista.length} />
      <DataTable
        rotulo="Processos deste tipo"
        dados={lista}
        colunas={colunas}
        chaveLinha={(p) => p.id}
        carregando={processos.isLoading}
        erro={processos.isError ? 'Não foi possível carregar os processos.' : null}
        aoTentarNovamente={() => processos.refetch()}
        aoClicarLinha={(p) => navigate(`/workflow/processos/${p.id}`)}
        busca={{ placeholder: 'Buscar por assunto, interessado, nº interno ou SEI' }}
        vazio={{
          icone: FolderOpen,
          titulo: 'Nenhum processo deste tipo',
          descricao: 'Os processos iniciados aparecem aqui.',
        }}
      />
    </>
  );
}

interface GuiaProcessoModeloProps {
  /** Código do modelo (compras, diarias, convenios, almoxarifado, pagamentos, patrimonio_tombamento, patrimonio_baixa) */
  modeloCodigo: string;
}

export function GuiaProcessoModelo({ modeloCodigo }: GuiaProcessoModeloProps) {
  const { hasPermission, hasModule } = useAuth();
  const [dialogAberto, setDialogAberto] = useState(false);
  // o módulo é o "onde" (RLS dos modelos e da lista); a permissão, o "o quê" (mesma regra das RPCs e do sigilo)
  const temModulo = hasModule('workflow');
  const modelo = useModeloProcesso(modeloCodigo, temModulo);
  const podeCriar = temModulo && hasPermission('workflow.criar');
  const podeVer = temModulo && hasPermission('workflow.visualizar');

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-h2 text-foreground">{modelo.data?.nome ?? 'Etapas e checklist'}</h2>
        {podeCriar ? (
          <Button onClick={() => setDialogAberto(true)} disabled={!modelo.data}>
            Iniciar processo
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        ) : (
          <p className="text-body text-muted-foreground">Peça acesso ao módulo Processos para iniciar</p>
        )}
      </div>

      <Tabs defaultValue="guia" className="space-y-6">
        <TabsList>
          <TabsTrigger value="guia">Etapas e checklist</TabsTrigger>
          <TabsTrigger value="processos">Processos</TabsTrigger>
        </TabsList>

        <TabsContent value="guia" className="space-y-6">
          {!temModulo && (
            <EmptyState
              icone={FolderOpen}
              titulo="Peça acesso ao módulo Processos para ver o fluxo"
              descricao="As etapas e o checklist deste tipo de processo ficam no módulo Processos."
            />
          )}
          {temModulo && modelo.isLoading && <Skeleton className="h-48 w-full" aria-busy="true" />}
          {temModulo && modelo.isError && (
            <p className="text-body text-destructive" role="alert">Não foi possível carregar o modelo do processo.</p>
          )}
          {temModulo && !modelo.isLoading && !modelo.isError && !modelo.data && (
            <EmptyState icone={FolderOpen} titulo="Modelo não cadastrado" descricao="Este tipo de processo ainda não tem modelo de fluxo." />
          )}
          {modelo.data && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Etapas</CardTitle>
                  <CardDescription>Caminho que o processo percorre, com a unidade e o prazo de cada etapa</CardDescription>
                </CardHeader>
                <CardContent>
                  <ol className="space-y-3" aria-label="Etapas do processo">
                    {modelo.data.etapas.map((etapa) => (
                      <li key={etapa.id} className="flex items-start gap-3 rounded-lg border p-3">
                        <span
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground"
                          aria-hidden="true"
                        >
                          {etapa.ordem}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium">{etapa.nome}</p>
                          <p className="text-caption text-muted-foreground">
                            {etapa.unidade_sigla}
                            {etapa.responsavel_rotulo ? ` • ${etapa.responsavel_rotulo}` : ''}
                            {' • '}
                            {etapa.prazo_dias_uteis != null
                              ? `Prazo: ${etapa.prazo_dias_uteis} dia(s) útil(eis)`
                              : 'Sem prazo'}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ol>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Checklist</CardTitle>
                  <CardDescription>Documentação conferida em cada etapa; é marcada dentro do processo</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {modelo.data.checklist.length === 0 && (
                    <p className="text-body text-muted-foreground">Este modelo não tem itens de checklist.</p>
                  )}
                  {modelo.data.etapas
                    .filter((e) => modelo.data!.checklist.some((i) => i.etapa_ordem === e.ordem))
                    .map((etapa) => (
                      <section key={etapa.id} aria-label={`Checklist da etapa ${etapa.ordem}`} className="space-y-2">
                        <h3 className="text-body font-medium">Etapa {etapa.ordem}: {etapa.nome}</h3>
                        <ul className="space-y-2">
                          {modelo.data!.checklist
                            .filter((i) => i.etapa_ordem === etapa.ordem)
                            .map((item) => (
                              <li key={item.id} className="flex items-start justify-between gap-3 rounded-lg border p-3">
                                <span className="flex-1 text-sm leading-snug">{item.descricao}</span>
                                <StatusBadge tom={item.obrigatorio ? 'pendente' : 'neutro'}>
                                  {item.obrigatorio ? 'Obrigatório' : 'Opcional'}
                                </StatusBadge>
                              </li>
                            ))}
                        </ul>
                      </section>
                    ))}
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="processos" className="space-y-4">
          {podeVer ? (
            <ListaProcessos modeloCodigo={modeloCodigo} />
          ) : (
            <p className="text-body text-muted-foreground">
              Peça acesso ao módulo Processos para acompanhar os processos
            </p>
          )}
        </TabsContent>
      </Tabs>

      {podeCriar && (
        <NovoProcessoDialog open={dialogAberto} onOpenChange={setDialogAberto} modeloCodigo={modeloCodigo} />
      )}
    </div>
  );
}
