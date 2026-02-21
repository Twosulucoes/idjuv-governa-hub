/**
 * Dialog para gerenciar tags/etiquetas personalizadas de servidores
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Tag } from "lucide-react";
import { toast } from "sonner";

const TAG_COLORS = [
  { value: "blue", label: "Azul", class: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
  { value: "green", label: "Verde", class: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
  { value: "red", label: "Vermelho", class: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" },
  { value: "yellow", label: "Amarelo", class: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" },
  { value: "purple", label: "Roxo", class: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200" },
  { value: "pink", label: "Rosa", class: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200" },
  { value: "orange", label: "Laranja", class: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200" },
  { value: "cyan", label: "Ciano", class: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200" },
];

export function getTagColorClass(cor: string): string {
  return TAG_COLORS.find(c => c.value === cor)?.class || TAG_COLORS[0].class;
}

interface GerenciarTagsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GerenciarTagsDialog({ open, onOpenChange }: GerenciarTagsDialogProps) {
  const queryClient = useQueryClient();
  const [novaTag, setNovaTag] = useState("");
  const [novaCor, setNovaCor] = useState("blue");

  const { data: tags = [], isLoading } = useQuery({
    queryKey: ["servidor-tags"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("servidor_tags")
        .select("*")
        .order("nome");
      if (error) throw error;
      return data;
    },
  });

  const criarTag = useMutation({
    mutationFn: async () => {
      if (!novaTag.trim()) throw new Error("Nome obrigatório");
      const { error } = await supabase
        .from("servidor_tags")
        .insert({ nome: novaTag.trim(), cor: novaCor } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["servidor-tags"] });
      setNovaTag("");
      toast.success("Tag criada!");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const excluirTag = useMutation({
    mutationFn: async (tagId: string) => {
      const { error } = await supabase.from("servidor_tags").delete().eq("id", tagId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["servidor-tags"] });
      queryClient.invalidateQueries({ queryKey: ["servidor-tag-vinculos"] });
      toast.success("Tag excluída!");
    },
    onError: (err: any) => toast.error(err.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Gerenciar Tags
          </DialogTitle>
        </DialogHeader>

        {/* Criar nova tag */}
        <div className="space-y-3">
          <Label>Nova Tag</Label>
          <div className="flex gap-2">
            <Input
              placeholder="Nome da tag..."
              value={novaTag}
              onChange={(e) => setNovaTag(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && criarTag.mutate()}
              maxLength={50}
            />
            <Button onClick={() => criarTag.mutate()} size="icon" disabled={!novaTag.trim()}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {TAG_COLORS.map((c) => (
              <button
                key={c.value}
                onClick={() => setNovaCor(c.value)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${c.class} ${
                  novaCor === c.value ? "ring-2 ring-offset-2 ring-primary" : "opacity-60 hover:opacity-100"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Lista de tags */}
        <div className="space-y-2 mt-4 max-h-64 overflow-y-auto">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : tags.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma tag criada</p>
          ) : (
            tags.map((tag) => (
              <div key={tag.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                <Badge className={getTagColorClass(tag.cor)}>{tag.nome}</Badge>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive hover:text-destructive"
                  onClick={() => excluirTag.mutate(tag.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
