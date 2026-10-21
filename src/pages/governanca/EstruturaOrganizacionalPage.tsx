import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ModuleLayout } from '@/components/layout/ModuleLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { EmptyState, PageHeader } from '@/components/design-system';
import {
  Crown,
  Users,
  ArrowRight,
  ChevronDown,
  Network,
  Scale,
  Briefcase,
  Target,
  Layers,
  FileDown,
  FileText
} from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { RelatorioEstruturaDialog } from '@/components/relatorios/RelatorioEstruturaDialog';
import { useTenant } from "@/core/tenant";
import { useEstruturaOrganizacional, type UnidadeEstrutura } from '@/hooks/useOrganograma';
import { useResumoQuadroCargos } from '@/hooks/useTransparenciaCargos';

// Tudo o que esta página mostra vem do cadastro: unidades, siglas, descrições e
// competências de `estrutura_organizacional` (Organograma > Gestão), total de cargos
// do quadro (`cargos`/`composicao_cargos`) e lei/vinculação do cadastro da instituição.

// Cores das diretorias pela ordem do organograma, sem sigla fixa no código.
const CORES_DIRETORIA = [
  { borda: 'border-l-accent', selo: 'bg-accent text-accent-foreground', ponto: 'bg-accent', caixa: 'bg-accent/10 border-accent/20' },
  { borda: 'border-l-info', selo: 'bg-info text-primary-foreground', ponto: 'bg-info', caixa: 'bg-info/10 border-info/20' },
  { borda: 'border-l-success', selo: 'bg-success text-success-foreground', ponto: 'bg-success', caixa: 'bg-success/10 border-success/20' },
];

const rotulo = (u: UnidadeEstrutura) => u.sigla || u.nome;

function ListaFilhos({ unidade, filhos, ponto }: { unidade: UnidadeEstrutura; filhos: UnidadeEstrutura[]; ponto: string }) {
  return (
    <div className="pl-4 py-2 space-y-2">
      {unidade.descricao && <p className="text-xs text-muted-foreground">{unidade.descricao}</p>}
      {filhos.length > 0 && <p className="text-xs text-muted-foreground mb-2">Unidades vinculadas:</p>}
      {filhos.map((filho) => (
        <div key={filho.id} className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className={`w-2 h-2 rounded-full ${ponto}`} />
          {filho.sigla && <Badge variant="secondary" className="font-mono text-xs">{filho.sigla}</Badge>}
          <span className="text-xs">{filho.nome}</span>
        </div>
      ))}
    </div>
  );
}

export default function EstruturaOrganizacionalPage() {
  const { identidade: { sigla, nomeOficial, naturezaJuridica }, legal } = useTenant();
  const [relatorioOpen, setRelatorioOpen] = useState(false);
  const { data: unidades = [], isLoading } = useEstruturaOrganizacional();
  const { resumo } = useResumoQuadroCargos();

  const estrutura = useMemo(() => {
    const filhosDe = new Map<string, UnidadeEstrutura[]>();
    for (const u of unidades) {
      if (!u.superior_id) continue;
      const lista = filhosDe.get(u.superior_id) ?? [];
      lista.push(u);
      filhosDe.set(u.superior_id, lista);
    }
    const porId = new Map(unidades.map((u) => [u.id, u]));
    const presidencias = unidades.filter((u) => u.tipo === 'presidencia');
    return {
      filhosDe: (id: string) => filhosDe.get(id) ?? [],
      superiorDe: (u: UnidadeEstrutura) => (u.superior_id ? porId.get(u.superior_id) : undefined),
      presidencias,
      assessorias: unidades.filter((u) => u.tipo === 'assessoria'),
      diretorias: unidades.filter((u) => u.tipo === 'diretoria'),
    };
  }, [unidades]);

  // Vagas por diretoria: a RPC do quadro devolve a sigla (ou o nome) da diretoria
  const vagasDe = (u: UnidadeEstrutura) =>
    resumo?.porDiretoria.find((d) => d.diretoria === rotulo(u))?.quantidade;

  const fonte = resumo?.leis.length ? resumo.leis.join('; ') : legal?.leiCriacao;
  const tituloSuperior = estrutura.presidencias.map(rotulo).join(', ');

  // Frase de abertura montada só com os campos preenchidos no cadastro da instituição
  const abertura = [
    legal?.leiCriacao && `foi criado pela ${legal.leiCriacao}`,
    naturezaJuridica && `como ${naturezaJuridica.toLowerCase()}`,
    legal?.vinculacao && `vinculada à ${legal.vinculacao}`,
  ].filter(Boolean).join(', ');

  return (
    <ModuleLayout module="governanca">
      <div className="space-y-6">
        <PageHeader
          migalhas={[{ rotulo: "Governança", href: "/governanca" }, { rotulo: "Estrutura organizacional" }]}
          titulo={`Estrutura organizacional do ${sigla}`}
          descricao={nomeOficial}
          acoes={
            <>
              <Button variant="outline" asChild>
                <Link to="/organograma">
                  <Network className="h-4 w-4" aria-hidden="true" />
                  Ver organograma interativo
                </Link>
              </Button>
              <Button onClick={() => setRelatorioOpen(true)}>
                <FileDown className="h-4 w-4" aria-hidden="true" />
                Gerar relatório PDF
              </Button>
            </>
          }
        />

        <div className="flex flex-wrap gap-2">
          {fonte && (
            <Badge variant="outline" className="gap-1">
              <Scale className="h-3 w-3" aria-hidden="true" />
              {fonte}
            </Badge>
          )}
          {!!resumo?.total && (
            <Badge variant="secondary" className="gap-1">
              <Users className="h-3 w-3" aria-hidden="true" />
              {resumo.total} cargos comissionados
            </Badge>
          )}
        </div>

        <RelatorioEstruturaDialog
          open={relatorioOpen}
          onOpenChange={setRelatorioOpen}
        />

        {/* Introdução */}
        {abertura && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-6">
              <p className="text-foreground leading-relaxed">
                O <strong>{nomeOficial} ({sigla})</strong> {abertura}.
              </p>
            </CardContent>
          </Card>
        )}

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando a estrutura…</p>
        ) : unidades.length === 0 ? (
          <Card>
            <EmptyState
              icone={Network}
              titulo="Nenhuma unidade cadastrada"
              descricao="Cadastre presidência, assessorias, diretorias e suas unidades na gestão do organograma; esta página passa a mostrá-las."
              acao={
                <Button variant="outline" asChild>
                  <Link to="/organograma/gestao">Gestão do organograma</Link>
                </Button>
              }
            />
          </Card>
        ) : (
          <div className="space-y-8">
            {/* 1. Nível de Administração Superior */}
            {estrutura.presidencias.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                    <Crown className="h-5 w-5 text-primary-foreground" aria-hidden="true" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground">Nível de Administração Superior</h2>
                    <p className="text-sm text-muted-foreground">{estrutura.presidencias.map((p) => p.nome).join(', ')}</p>
                  </div>
                </div>

                {estrutura.presidencias.map((presidencia) => (
                  <Card key={presidencia.id} className="border-l-4 border-l-primary">
                    <CardContent className="pt-6">
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                            <Briefcase className="h-4 w-4 text-primary" aria-hidden="true" />
                            {presidencia.nome}
                          </h3>
                          {presidencia.descricao && (
                            <p className="text-muted-foreground text-sm leading-relaxed">{presidencia.descricao}</p>
                          )}
                        </div>
                        {(presidencia.competencias?.length || vagasDe(presidencia) !== undefined) && (
                          <div className="bg-muted/50 rounded-lg p-4">
                            {!!presidencia.competencias?.length && (
                              <>
                                <p className="text-sm font-medium text-foreground mb-2">Competências:</p>
                                <ul className="text-sm text-muted-foreground space-y-1">
                                  {presidencia.competencias.map((c) => (
                                    <li key={c} className="flex items-center gap-2">
                                      <ArrowRight className="h-3 w-3 text-primary" aria-hidden="true" />
                                      {c}
                                    </li>
                                  ))}
                                </ul>
                              </>
                            )}
                            {vagasDe(presidencia) !== undefined && (
                              <p className="mt-3 text-xs text-muted-foreground">
                                Total: {vagasDe(presidencia)} cargos
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </section>
            )}

            {/* 2. Nível de Assessoramento */}
            {estrutura.assessorias.length > 0 && (
              <>
                <Separator />
                <section>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                      <Target className="h-5 w-5 text-secondary-foreground" aria-hidden="true" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-foreground">Nível de Assessoramento</h2>
                      <p className="text-sm text-muted-foreground">Unidades de apoio direto à administração superior</p>
                    </div>
                  </div>

                  <Card className="border-l-4 border-l-secondary">
                    <CardContent className="pt-6">
                      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {estrutura.assessorias.map((unidade) => (
                          <div
                            key={unidade.id}
                            className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg"
                            title={unidade.descricao}
                          >
                            <ChevronDown className="h-4 w-4 text-secondary rotate-[-90deg]" aria-hidden="true" />
                            <span className="text-sm font-medium">{unidade.nome}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </section>
              </>
            )}

            {/* 3. Diretorias */}
            {estrutura.diretorias.length > 0 && (
              <>
                <Separator />
                <section>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center">
                      <Layers className="h-5 w-5 text-accent-foreground" aria-hidden="true" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-foreground">Diretorias</h2>
                      <p className="text-sm text-muted-foreground">Unidades de execução e suas divisões</p>
                    </div>
                  </div>

                  <div className="grid lg:grid-cols-2 gap-6">
                    {estrutura.diretorias.map((diretoria, i) => {
                      const cor = CORES_DIRETORIA[i % CORES_DIRETORIA.length];
                      const superior = estrutura.superiorDe(diretoria);
                      const vagas = vagasDe(diretoria);
                      return (
                        <Card key={diretoria.id} className={`border-l-4 ${cor.borda}`}>
                          <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                              {diretoria.sigla && <Badge className={cor.selo}>{diretoria.sigla}</Badge>}
                              {diretoria.nome}
                            </CardTitle>
                            {diretoria.descricao && (
                              <CardDescription className="text-xs">{diretoria.descricao}</CardDescription>
                            )}
                          </CardHeader>
                          <CardContent>
                            {superior && (
                              <div className={`mb-4 p-3 rounded-lg border ${cor.caixa}`}>
                                <p className="text-xs text-muted-foreground flex items-center gap-2">
                                  <ArrowRight className="h-3 w-3" aria-hidden="true" />
                                  <strong>Vínculo:</strong> Subordinada a {superior.nome}
                                </p>
                              </div>
                            )}

                            <Accordion type="multiple" className="space-y-2">
                              {estrutura.filhosDe(diretoria.id).map((divisao) => (
                                <AccordionItem key={divisao.id} value={divisao.id} className="border rounded-lg px-4">
                                  <AccordionTrigger className="text-sm font-medium hover:no-underline">
                                    <span className="flex items-center gap-2 text-left">
                                      {divisao.sigla && <Badge variant="outline" className="font-mono text-xs">{divisao.sigla}</Badge>}
                                      {divisao.nome}
                                    </span>
                                  </AccordionTrigger>
                                  <AccordionContent>
                                    <ListaFilhos unidade={divisao} filhos={estrutura.filhosDe(divisao.id)} ponto={cor.ponto} />
                                  </AccordionContent>
                                </AccordionItem>
                              ))}
                            </Accordion>

                            {vagas !== undefined && (
                              <p className="mt-4 text-xs text-muted-foreground text-right">
                                Total: {vagas} cargos nesta diretoria
                              </p>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </section>
              </>
            )}
          </div>
        )}

        {/* Diagrama de vínculos — leitura rápida da hierarquia */}
        {unidades.length > 0 && (
          <Card className="bg-muted/30">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Network className="h-5 w-5 text-primary" aria-hidden="true" />
                Diagrama de vínculos
              </CardTitle>
              <CardDescription>Representação visual da hierarquia e subordinação</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center space-y-4">
                {tituloSuperior && (
                  <>
                    <div className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-bold text-center uppercase">
                      {tituloSuperior}
                    </div>
                    <div className="w-px h-6 bg-border" />
                  </>
                )}

                {estrutura.assessorias.length > 0 && (
                  <>
                    <div className="w-full max-w-3xl">
                      <div className="text-center text-xs text-muted-foreground mb-2">Assessoramento</div>
                      <div className="flex justify-center flex-wrap gap-2">
                        {estrutura.assessorias.map((u) => (
                          <Badge key={u.id} variant="secondary" className="text-xs">{rotulo(u)}</Badge>
                        ))}
                      </div>
                    </div>
                    <div className="w-px h-6 bg-border" />
                  </>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-3xl">
                  {estrutura.diretorias.map((d, i) => (
                    <div key={d.id} className="text-center">
                      <div className={`px-4 py-2 rounded-lg font-semibold text-sm ${CORES_DIRETORIA[i % CORES_DIRETORIA.length].selo}`}>
                        {rotulo(d)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Rodapé legal */}
        <Card className="border-dashed">
          <CardContent className="py-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-muted-foreground mt-0.5" aria-hidden="true" />
                <div>
                  <p className="font-medium text-foreground">Base legal</p>
                  <p className="text-sm text-muted-foreground">
                    {legal?.leiCriacao
                      ? `${legal.leiCriacao} — dispõe sobre a criação do ${sigla}`
                      : 'Lei de criação não informada no cadastro da instituição'}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link to="/governanca/lei-criacao">
                    <FileText className="h-3 w-3" aria-hidden="true" />
                    Ver lei completa
                  </Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/transparencia/cargos">
                    <Users className="h-3 w-3" aria-hidden="true" />
                    Ver cargos
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </ModuleLayout>
  );
}
