/**
 * Popover para atribuir/remover tags de um servidor
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tag } from "lucide-react";
import { toast } from "sonner";
import { getTagColorClass } from "./GerenciarTagsDialog";

interface ServidorTagsPopoverProps {
  servidorId: string;
  children: React.ReactNode;
}

export function ServidorTagsPopover({ servidorId, children }: ServidorTagsPopoverProps) {
  const queryClient = useQueryClient();

  const { data: allTags = [] } = useQuery({
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

  const { data: vinculos = [] } = useQuery({
    queryKey: ["servidor-tag-vinculos", servidorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("servidor_tag_vinculos")
        .select("tag_id")
        .eq("servidor_id", servidorId);
      if (error) throw error;
      return data.map((v) => v.tag_id);
    },
  });

  const toggleTag = useMutation({
    mutationFn: async ({ tagId, add }: { tagId: string; add: boolean }) => {
      if (add) {
        const { error } = await supabase
          .from("servidor_tag_vinculos")
          .insert({ servidor_id: servidorId, tag_id: tagId } as any);
        if (error && !error.message.includes("duplicate")) throw error;
      } else {
        const { error } = await supabase
          .from("servidor_tag_vinculos")
          .delete()
          .eq("servidor_id", servidorId)
          .eq("tag_id", tagId);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["servidor-tag-vinculos", servidorId] });
      queryClient.invalidateQueries({ queryKey: ["servidor-tag-vinculos-all"] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  return (
    <Popover>
      <PopoverTrigger asChild onClick={(e) => e.stopPropagation()}>
        {children}
      </PopoverTrigger>
      <PopoverContent className="w-56 p-3" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 mb-3 text-sm font-medium">
          <Tag className="h-4 w-4" />
          Tags
        </div>
        {allTags.length === 0 ? (
          <p className="text-xs text-muted-foreground">Nenhuma tag criada</p>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {allTags.map((tag) => {
              const checked = vinculos.includes(tag.id);
              return (
                <label
                  key={tag.id}
                  className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 p-1 rounded"
                >
                  <Checkbox
                    checked={checked}
                    onCheckedChange={() => toggleTag.mutate({ tagId: tag.id, add: !checked })}
                  />
                  <Badge className={`${getTagColorClass(tag.cor)} text-xs`}>{tag.nome}</Badge>
                </label>
              );
            })}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
