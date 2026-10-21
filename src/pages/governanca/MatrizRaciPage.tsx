import { useMemo } from "react";
import { Grid3X3 } from "lucide-react";
import { ModuleLayout } from "@/components/layout/ModuleLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { EmptyState, PageHeader } from "@/components/design-system";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useMatrizRaci, type PapelRaci, type TipoPapelRaci } from "@/hooks/useMatrizRaci";

// Papéis, processos e atribuições vêm das tabelas matriz_raci_*; só a legenda
// RACI (o método) fica no código.
const LEGENDA: Record<TipoPapelRaci, { letra: string; nome: string; descricao: string; cor: string }> = {
  responsavel: { letra: "R", nome: "Responsável", descricao: "Quem executa a atividade", cor: "bg-primary" },
  aprovador: { letra: "A", nome: "Aprovador", descricao: "Quem autoriza a atividade", cor: "bg-success" },
  consultado: { letra: "C", nome: "Consultado", descricao: "Quem é consultado", cor: "bg-info text-info-foreground" },
  // "I" segue a legenda (fundo neutro), distinto de "R"
  informado: { letra: "I", nome: "Informado", descricao: "Quem é informado", cor: "bg-muted text-muted-foreground hover:bg-muted" },
};
const ORDEM_TIPOS: TipoPapelRaci[] = ["responsavel", "aprovador", "consultado", "informado"];

interface LinhaMatriz {
  etapa: string;
  /** papel_id → tipos atribuídos nessa etapa */
  celulas: Map<string, TipoPapelRaci[]>;
}

export default function MatrizRaciPage() {
  const { data, isLoading, isError } = useMatrizRaci();

  // Uma tabela por processo: linhas são as etapas, colunas os papéis com atribuição nele
  const quadros = useMemo(() => {
    if (!data) return [];
    const papelPorId = new Map(data.papeis.map((p) => [p.id, p]));
    return data.processos.map((processo) => {
      const linhas = new Map<string, LinhaMatriz>();
      const papeisUsados = new Set<string>();
      for (const a of data.atribuicoes) {
        if (a.processo_id !== processo.id || !papelPorId.has(a.papel_id)) continue;
        const etapa = a.etapa_processo?.trim() || processo.nome;
        const linha = linhas.get(etapa) ?? { etapa, celulas: new Map() };
        const tipos = linha.celulas.get(a.papel_id) ?? [];
        if (!tipos.includes(a.tipo_papel)) tipos.push(a.tipo_papel);
        linha.celulas.set(a.papel_id, tipos);
        linhas.set(etapa, linha);
        papeisUsados.add(a.papel_id);
      }
      const colunas = data.papeis.filter((p) => papeisUsados.has(p.id));
      return { processo, colunas, linhas: [...linhas.values()] };
    });
  }, [data]);

  const papeis: PapelRaci[] = data?.papeis ?? [];
  const vazia = !isLoading && !isError && quadros.length === 0;

  return (
    <ModuleLayout module="governanca">
      <div className="space-y-6">
        <PageHeader
          migalhas={[{ rotulo: "Governança", href: "/governanca" }, { rotulo: "Matriz RACI" }]}
          titulo="Matriz RACI"
          descricao="Responsabilidades e papéis nos processos administrativos"
        />

        {/* Legenda */}
        <Card>
          <CardHeader>
            <CardTitle>Legenda RACI</CardTitle>
            <CardDescription>Papéis e responsabilidades por processo</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {ORDEM_TIPOS.map((tipo) => {
                const item = LEGENDA[tipo];
                return (
                  <div key={tipo} className="flex items-center gap-3">
                    <Badge className={item.cor}>{item.letra}</Badge>
                    <div>
                      <p className="font-medium text-sm">{item.nome}</p>
                      <p className="text-xs text-muted-foreground">{item.descricao}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            {papeis.length > 0 && (
              <>
                <Separator className="my-4" />
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-sm">
                  {papeis.map((p) => (
                    <div key={p.id} title={p.descricao ?? undefined}>
                      <strong>{p.codigo}</strong> – {p.nome}
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {isLoading && <p className="text-sm text-muted-foreground">Carregando a matriz…</p>}

        {isError && (
          <Card>
            <EmptyState
              icone={Grid3X3}
              titulo="Não foi possível carregar a matriz"
              descricao="Confira sua permissão no módulo de governança e tente de novo."
            />
          </Card>
        )}

        {vazia && (
          <Card>
            <EmptyState
              icone={Grid3X3}
              titulo="Nenhum processo na matriz RACI"
              descricao="A matriz é montada com os papéis, processos e atribuições cadastrados pela governança da instituição. Peça ao administrador do sistema para cadastrá-los; esta página passa a mostrá-los."
            />
          </Card>
        )}

        {quadros.map(({ processo, colunas, linhas }) => (
          <Card key={processo.id}>
            <CardHeader>
              <CardTitle className="flex flex-wrap items-center gap-2">
                {processo.nome}
                {processo.modulo_sistema && (
                  <Badge variant="outline" className="font-normal">{processo.modulo_sistema}</Badge>
                )}
              </CardTitle>
              {processo.descricao && <CardDescription>{processo.descricao}</CardDescription>}
            </CardHeader>
            <CardContent>
              {linhas.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma atribuição cadastrada para este processo.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Etapa</TableHead>
                      {colunas.map((p) => (
                        <TableHead key={p.id} className="text-center" title={p.nome}>{p.codigo}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {linhas.map((linha) => (
                      <TableRow key={linha.etapa}>
                        <TableCell className="font-medium">{linha.etapa}</TableCell>
                        {colunas.map((p) => (
                          <TableCell key={p.id} className="text-center">
                            <div className="flex justify-center gap-1">
                              {(linha.celulas.get(p.id) ?? []).map((tipo) => (
                                <Badge key={tipo} className={LEGENDA[tipo].cor} title={LEGENDA[tipo].nome}>
                                  {LEGENDA[tipo].letra}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </ModuleLayout>
  );
}
