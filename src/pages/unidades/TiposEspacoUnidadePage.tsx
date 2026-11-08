/**
 * TIPOS DE ESPAÇO DAS UNIDADES LOCAIS
 * Cadastro dos tipos (Ginásio, Campo de futebol, Praça...) que aparecem no cadastro da unidade.
 * Ver: unidades.visualizar (rota). Criar, editar, desativar e excluir: unidades.gerenciar (o banco também valida).
 */
import { useState } from "react";
import { Pencil, Plus, Shapes, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ModuleLayout } from "@/components/layout";
import { DataTable, PageHeader, StatusBadge, type ColunaTabela } from "@/components/design-system";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/contexts/AuthContext";
import {
  useExcluirTipoEspaco,
  useSalvarTipoEspaco,
  useTiposEspacoUnidade,
  type TipoEspacoUnidade,
} from "@/hooks/useTiposEspacoUnidade";

interface Edicao {
  id?: string;
  nome: string;
  ativo: boolean;
  ordem: string;
}

const VAZIO: Edicao = { nome: "", ativo: true, ordem: "500" };

export default function TiposEspacoUnidadePage() {
  const { hasPermission } = useAuth();
  const podeGerenciar = hasPermission("unidades.gerenciar");
  const { data: tipos = [], isLoading, isError, refetch } = useTiposEspacoUnidade();
  const salvar = useSalvarTipoEspaco();
  const excluir = useExcluirTipoEspaco();
  const [edicao, setEdicao] = useState<Edicao | null>(null);
  const [aExcluir, setAExcluir] = useState<TipoEspacoUnidade | null>(null);

  async function gravar() {
    if (!edicao) return;
    const nome = edicao.nome.trim();
    if (nome.length < 2) {
      toast.error("Informe o nome do tipo de espaço");
      return;
    }
    const atual = edicao.id ? tipos.find((t) => t.id === edicao.id) : undefined;
    try {
      await salvar.mutateAsync({
        id: edicao.id,
        dados: {
          nome,
          ativo: edicao.ativo,
          ordem: Number.parseInt(edicao.ordem, 10) || 500,
          // Tipo novo cai no tipo base "outro"; os que vieram com o sistema mantêm o seu.
          tipo_base: atual?.tipo_base ?? "outro",
        },
      });
      toast.success(edicao.id ? "Tipo de espaço atualizado" : "Tipo de espaço cadastrado");
      setEdicao(null);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  async function confirmarExclusao() {
    if (!aExcluir) return;
    try {
      await excluir.mutateAsync(aExcluir.id);
      toast.success("Tipo de espaço excluído");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setAExcluir(null);
    }
  }

  const colunas: ColunaTabela<TipoEspacoUnidade>[] = [
    {
      id: "nome",
      cabecalho: "Tipo de espaço",
      celula: (t) => <span className="font-medium">{t.nome}</span>,
      ordenarPor: (t) => t.nome,
      buscarPor: (t) => t.nome,
      mobile: "titulo",
    },
    {
      id: "situacao",
      cabecalho: "Situação",
      celula: (t) => (
        <StatusBadge tom={t.ativo ? "sucesso" : "neutro"}>{t.ativo ? "Ativo" : "Desativado"}</StatusBadge>
      ),
      ordenarPor: (t) => (t.ativo ? 0 : 1),
    },
    {
      id: "ordem",
      cabecalho: "Ordem na lista",
      celula: (t) => <span className="tabular-nums">{t.ordem}</span>,
      ordenarPor: (t) => t.ordem,
    },
  ];

  return (
    <ModuleLayout module="patrimonio">
      <div className="space-y-6">
        <PageHeader
          migalhas={[{ rotulo: "Unidades locais", href: "/unidades" }, { rotulo: "Tipos de espaço" }]}
          titulo="Tipos de espaço"
          descricao="Os tipos que aparecem no cadastro da unidade local. Desative um tipo para tirá-lo da lista sem mexer nas unidades que já o usam."
          acoes={
            podeGerenciar && (
              <Button onClick={() => setEdicao(VAZIO)}>
                <Plus className="h-4 w-4" aria-hidden="true" />
                Novo tipo
              </Button>
            )
          }
        />

        <DataTable
          rotulo="Tipos de espaço"
          dados={tipos}
          colunas={colunas}
          chaveLinha={(t) => t.id}
          carregando={isLoading}
          erro={isError ? "Não foi possível carregar os tipos de espaço." : null}
          aoTentarNovamente={() => refetch()}
          busca={{ placeholder: "Buscar tipo de espaço" }}
          vazio={{ icone: Shapes, titulo: "Nenhum tipo de espaço cadastrado" }}
          acoesLinha={
            podeGerenciar
              ? (t) => (
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Editar ${t.nome}`}
                      onClick={() => setEdicao({ id: t.id, nome: t.nome, ativo: t.ativo, ordem: String(t.ordem) })}
                    >
                      <Pencil className="h-4 w-4" aria-hidden="true" />
                    </Button>
                    {!t.codigo && (
                      <Button variant="ghost" size="icon" aria-label={`Excluir ${t.nome}`} onClick={() => setAExcluir(t)}>
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </Button>
                    )}
                  </div>
                )
              : undefined
          }
        />
      </div>

      <Dialog open={edicao !== null} onOpenChange={(aberto) => !aberto && setEdicao(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{edicao?.id ? "Editar tipo de espaço" : "Novo tipo de espaço"}</DialogTitle>
            <DialogDescription>Ex.: Pista de atletismo, Centro de treinamento.</DialogDescription>
          </DialogHeader>
          {edicao && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tipo-nome">Nome *</Label>
                <Input
                  id="tipo-nome"
                  value={edicao.nome}
                  maxLength={80}
                  onChange={(e) => setEdicao({ ...edicao, nome: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tipo-ordem">Ordem na lista</Label>
                <Input
                  id="tipo-ordem"
                  type="number"
                  inputMode="numeric"
                  value={edicao.ordem}
                  onChange={(e) => setEdicao({ ...edicao, ordem: e.target.value })}
                  className="max-w-[8rem]"
                />
                <p className="text-caption text-muted-foreground">Números menores aparecem primeiro.</p>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="tipo-ativo"
                  checked={edicao.ativo}
                  onCheckedChange={(v) => setEdicao({ ...edicao, ativo: v })}
                />
                <Label htmlFor="tipo-ativo">Ativo (aparece no cadastro da unidade)</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEdicao(null)} disabled={salvar.isPending}>
              Cancelar
            </Button>
            <Button onClick={gravar} disabled={salvar.isPending}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={aExcluir !== null} onOpenChange={(aberto) => !aberto && setAExcluir(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir "{aExcluir?.nome}"?</AlertDialogTitle>
            <AlertDialogDescription>
              Só é possível excluir um tipo que nenhuma unidade usa. Se alguma usa, desative-o.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmarExclusao}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ModuleLayout>
  );
}
