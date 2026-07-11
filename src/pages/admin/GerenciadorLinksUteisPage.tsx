/**
 * Página de administração dos "Links Úteis" do site público.
 * Permite cadastrar, editar, reordenar, ligar/desligar e excluir os links
 * exibidos na página pública /links-uteis.
 */

import { useState } from "react";
import { ModuleLayout } from "@/components/layout/ModuleLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

  return (
    <ModuleLayout module="admin" title="Links Úteis">
      <div className="container py-6 space-y-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Link2 className="h-6 w-6 text-primary" />
              Links Úteis
            </h1>
            <p className="text-muted-foreground">
              Cadastre e administre os links exibidos na página pública de Links Úteis
            </p>
          </div>
          <Button onClick={abrirNovo}>
            <Plus className="h-4 w-4 mr-2" />
            Novo link
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Links cadastrados</CardTitle>
            <CardDescription>
              Links desligados não aparecem no site, mas continuam salvos aqui
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : links.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                Nenhum link cadastrado ainda. Clique em "Novo link" para começar.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Ordem</TableHead>
                    <TableHead>Título</TableHead>
                    <TableHead className="hidden md:table-cell">URL</TableHead>
                    <TableHead className="w-24 text-center">Visível</TableHead>
                    <TableHead className="w-28 text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {links.map((link) => (
                    <TableRow key={link.id}>
                      <TableCell className="text-muted-foreground">{link.ordem}</TableCell>
                      <TableCell className="font-medium">{link.titulo}</TableCell>
                      <TableCell className="hidden md:table-cell max-w-[280px] truncate">
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline inline-flex items-center gap-1"
                        >
                          <span className="truncate">{link.url}</span>
                          <ExternalLink className="h-3 w-3 flex-shrink-0" />
                        </a>
                      </TableCell>
                      <TableCell className="text-center">
                        <Switch
                          checked={link.ativo}
                          disabled={toggleAtivo.isPending}
                          onCheckedChange={(checked) =>
                            toggleAtivo.mutate({ id: link.id, ativo: checked })
                          }
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => abrirEdicao(link)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => setAExcluir(link)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
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
              {salvando && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
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
