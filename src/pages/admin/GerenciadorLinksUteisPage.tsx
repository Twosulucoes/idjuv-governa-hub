/**
 * Página de administração dos "Links Úteis" do site público.
 * Permite cadastrar, editar, reordenar, ligar/desligar e excluir os links
 * exibidos na página pública /links-uteis.
 */

import { useState } from "react";
import { ModuleLayout } from "@/components/layout/ModuleLayout";
import { DataTable, PageHeader, type ColunaTabela } from "@/components/design-system";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Loader2, Link2, Plus, Pencil, Trash2, ExternalLink } from "lucide-react";
import { useLinksUteis, type LinkUtil } from "@/hooks/useLinksUteis";

interface FormState {
  titulo: string;
  url: string;
  descricao: string;
  ordem: number;
}

const FORM_VAZIO: FormState = { titulo: "", url: "", descricao: "", ordem: 0 };

export default function GerenciadorLinksUteisPage() {
  const { links, isLoading, createLink, updateLink, deleteLink, toggleAtivo } = useLinksUteis();

  const [dialogAberto, setDialogAberto] = useState(false);
  const [editando, setEditando] = useState<LinkUtil | null>(null);
  const [form, setForm] = useState<FormState>(FORM_VAZIO);
  const [aExcluir, setAExcluir] = useState<LinkUtil | null>(null);

  const abrirNovo = () => {
    setEditando(null);
    setForm({ ...FORM_VAZIO, ordem: links.length });
    setDialogAberto(true);
  };

  const abrirEdicao = (link: LinkUtil) => {
    setEditando(link);
    setForm({
      titulo: link.titulo,
      url: link.url,
      descricao: link.descricao || "",
      ordem: link.ordem,
    });
    setDialogAberto(true);
  };

  const salvar = async () => {
    const payload = {
      titulo: form.titulo.trim(),
      url: form.url.trim(),
      descricao: form.descricao.trim() || null,
      ordem: form.ordem,
    };
    if (editando) {
      await updateLink.mutateAsync({ id: editando.id, ...payload });
    } else {
      await createLink.mutateAsync(payload);
    }
    setDialogAberto(false);
  };

  const salvando = createLink.isPending || updateLink.isPending;
  const formValido = form.titulo.trim().length > 0 && form.url.trim().length > 0;

  const colunas: ColunaTabela<LinkUtil>[] = [
    {
      id: "ordem",
      cabecalho: "Ordem",
      celula: (link) => <span className="text-muted-foreground">{link.ordem}</span>,
      ordenarPor: (link) => link.ordem,
      className: "w-16",
    },
    {
      id: "titulo",
      cabecalho: "Título",
      celula: (link) => <span className="font-medium">{link.titulo}</span>,
      ordenarPor: (link) => link.titulo,
      buscarPor: (link) => link.titulo,
      mobile: "titulo",
    },
    {
      id: "url",
      cabecalho: "URL",
      celula: (link) => (
        <a
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline inline-flex max-w-[280px] items-center gap-1"
        >
          <span className="truncate">{link.url}</span>
          <ExternalLink className="h-3 w-3 flex-shrink-0" aria-hidden="true" />
          <span className="sr-only">(abre em nova aba)</span>
        </a>
      ),
      buscarPor: (link) => link.url,
    },
    {
      id: "visivel",
      cabecalho: "Visível",
      celula: (link) => (
        <Switch
          checked={link.ativo}
          disabled={toggleAtivo.isPending}
          aria-label={`Exibir "${link.titulo}" no site`}
          onCheckedChange={(checked) =>
            toggleAtivo.mutate({ id: link.id, ativo: checked })
          }
        />
      ),
      ordenarPor: (link) => (link.ativo ? 1 : 0),
      alinhamento: "centro",
    },
  ];

  return (
    <ModuleLayout module="admin">
      <div className="space-y-6">
        <PageHeader
          migalhas={[{ rotulo: "Administração", href: "/admin" }, { rotulo: "Links úteis" }]}
          titulo="Links úteis"
          descricao="Cadastre e administre os links exibidos na página pública de links úteis. Links desligados não aparecem no site, mas continuam salvos aqui."
          acoes={
            <Button onClick={abrirNovo}>
              <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
              Novo link
            </Button>
          }
        />

        <DataTable
          rotulo="Links cadastrados"
          dados={links}
          colunas={colunas}
          chaveLinha={(link) => link.id}
          carregando={isLoading}
          busca={{ placeholder: "Buscar por título ou URL..." }}
          vazio={{
            icone: Link2,
            titulo: "Nenhum link cadastrado ainda",
            descricao: 'Clique em "Novo link" para começar.',
          }}
          acoesLinha={(link) => (
            <div className="flex justify-end gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => abrirEdicao(link)}
                aria-label={`Editar link ${link.titulo}`}
                title="Editar"
              >
                <Pencil className="h-4 w-4" aria-hidden="true" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive"
                onClick={() => setAExcluir(link)}
                aria-label={`Excluir link ${link.titulo}`}
                title="Excluir"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
          )}
        />
      </div>

      {/* Dialog criar/editar */}
      <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editando ? "Editar link" : "Novo link"}</DialogTitle>
            <DialogDescription>
              Preencha o título e o endereço (URL) do link.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="titulo">Título</Label>
              <Input
                id="titulo"
                value={form.titulo}
                onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))}
                placeholder="Ex.: Portal da Transparência"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="url">URL</Label>
              <Input
                id="url"
                value={form.url}
                onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
                placeholder="https://..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição (opcional)</Label>
              <Textarea
                id="descricao"
                value={form.descricao}
                onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))}
                placeholder="Breve descrição do link"
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ordem">Ordem de exibição</Label>
              <Input
                id="ordem"
                type="number"
                value={form.ordem}
                onChange={(e) => setForm((f) => ({ ...f, ordem: Number(e.target.value) }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogAberto(false)}>
              Cancelar
            </Button>
            <Button onClick={salvar} disabled={!formValido || salvando}>
              {salvando && <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmação de exclusão */}
      <AlertDialog open={!!aExcluir} onOpenChange={(open) => !open && setAExcluir(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir link?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O link "{aExcluir?.titulo}" será removido
              permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (aExcluir) deleteLink.mutate(aExcluir.id);
                setAExcluir(null);
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ModuleLayout>
  );
}
