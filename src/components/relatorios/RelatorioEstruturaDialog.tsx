import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileDown, Loader2, Building2 } from "lucide-react";
import { toast } from "sonner";
import { generateRelatorioEstruturaPDF, UnidadeEstruturaData } from "@/lib/pdfRelatorioEstrutura";

interface RelatorioEstruturaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RelatorioEstruturaDialog({
  open,
  onOpenChange,
}: RelatorioEstruturaDialogProps) {
  const [loading, setLoading] = useState(false);
  const [orgaoSigla, setOrgaoSigla] = useState("IDJuv");

  // Buscar unidades da estrutura organizacional
  const { data: unidades = [], isLoading } = useQuery({
    queryKey: ["estrutura-organizacional-relatorio"],
    queryFn: async () => {
      // Primeiro, buscar todas as unidades
      const { data: todasUnidades, error } = await supabase
        .from("estrutura_organizacional")
        .select("id, nome, sigla, email, superior_id, tipo, nivel, ativo")
        .eq("ativo", true)
        .order("nivel")
        .order("nome");

      if (error) throw error;

      // Criar mapa para lookup de superiores
      const unidadesMap = new Map<string, { sigla: string | null; nome: string }>();
      (todasUnidades || []).forEach((u) => {
        unidadesMap.set(u.id, { sigla: u.sigla, nome: u.nome });
      });

      // Adicionar sigla do superior a cada unidade
      const unidadesComSuperior: UnidadeEstruturaData[] = (todasUnidades || []).map((u) => {
        const superior = u.superior_id ? unidadesMap.get(u.superior_id) : null;
        return {
          ...u,
          superior_sigla: superior?.sigla || null,
          superior_nome: superior?.nome || null,
        };
      });

      return unidadesComSuperior;
    },
    enabled: open,
  });

  const handleGerarPDF = async () => {
    if (unidades.length === 0) {
      toast.error("Nenhuma unidade encontrada");
      return;
    }

    setLoading(true);
    try {
      const doc = await generateRelatorioEstruturaPDF(unidades, {
        orgaoSigla,
      });

      const fileName = `relatorio-estrutura-organizacional-${new Date().toISOString().split("T")[0]}.pdf`;
      doc.save(fileName);

      toast.success("Relatório gerado com sucesso!");
      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao gerar relatório:", error);
      toast.error("Erro ao gerar relatório");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Relatório de Estrutura Organizacional
          </DialogTitle>
          <DialogDescription>
            Gera um relatório com as unidades da estrutura organizacional
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="orgao-sigla">Sigla do Órgão (Secretaria)</Label>
            <Input
              id="orgao-sigla"
              value={orgaoSigla}
              onChange={(e) => setOrgaoSigla(e.target.value.toUpperCase())}
              placeholder="Ex: IDJUV"
            />
            <p className="text-xs text-muted-foreground">
              Esta sigla será exibida na primeira coluna do relatório
            </p>
          </div>

          <div className="rounded-lg border p-4 bg-muted/30">
            <h4 className="font-medium text-sm mb-2">Colunas do Relatório:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Órgão (Sigla da Secretaria)</li>
              <li>• Nome da Unidade</li>
              <li>• Sigla da Unidade</li>
              <li>• Sigla da Unidade Vinculada (se houver)</li>
              <li>• E-mail</li>
            </ul>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">
                Carregando unidades...
              </span>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {unidades.length} unidade(s) encontrada(s)
            </p>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleGerarPDF}
            disabled={loading || isLoading || unidades.length === 0}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Gerando...
              </>
            ) : (
              <>
                <FileDown className="h-4 w-4 mr-2" />
                Gerar PDF
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
