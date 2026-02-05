import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { FileText, Download, Loader2, Users } from "lucide-react";
import { toast } from "sonner";
import { gerarRelatorioContatosEstrategicos } from "@/lib/pdfRelatorioContatosEstrategicos";

export function RelatorioContatosEstrategicosCard() {
  const [isExporting, setIsExporting] = useState(false);
  const [incluirLogos, setIncluirLogos] = useState(true);
  const [apenasComIndicacao, setApenasComIndicacao] = useState(true);

  // Preview de quantos registros serão exportados
  const { data: previewCount = 0 } = useQuery({
    queryKey: ["contatos-estrategicos-preview", apenasComIndicacao],
    queryFn: async () => {
      let query = supabase
        .from("servidores")
        .select("id", { count: "exact", head: true })
        .eq("ativo", true);
      
      if (apenasComIndicacao) {
        query = query.not("indicacao", "is", null).neq("indicacao", "");
      }

      const { count, error } = await query;
      if (error) throw error;
      return count || 0;
    },
  });

  const handleExportar = async () => {
    setIsExporting(true);
    try {
      let query = supabase
        .from("servidores")
        .select("nome_completo, telefone_celular, indicacao, possui_vinculo_externo, vinculo_externo_orgao")
        .eq("ativo", true)
        .order("nome_completo");

      if (apenasComIndicacao) {
        query = query.not("indicacao", "is", null).neq("indicacao", "");
      }

      const { data: servidores, error } = await query;

      if (error) throw error;

      if (!servidores || servidores.length === 0) {
        toast.error("Nenhum servidor encontrado");
        return;
      }

      await gerarRelatorioContatosEstrategicos(servidores, incluirLogos);
      toast.success(`Relatório gerado com ${servidores.length} registros`);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao gerar relatório");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-lg">Contatos Estratégicos</CardTitle>
            <CardDescription>
              Relatório com Nome, Telefone e Indicação
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Opções */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="apenas-indicacao"
              checked={apenasComIndicacao}
              onCheckedChange={(checked) => setApenasComIndicacao(checked === true)}
            />
            <Label htmlFor="apenas-indicacao" className="text-sm cursor-pointer">
              Apenas servidores com indicação preenchida
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="incluir-logos"
              checked={incluirLogos}
              onCheckedChange={(checked) => setIncluirLogos(checked === true)}
            />
            <Label htmlFor="incluir-logos" className="text-sm cursor-pointer">
              Incluir logos no cabeçalho
            </Label>
          </div>
        </div>

        {/* Preview */}
        <div className="p-3 bg-muted rounded-lg">
          <div className="flex items-center gap-2 text-sm">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              Serão exportados <strong className="text-foreground">{previewCount}</strong> registros
            </span>
          </div>
        </div>

        {/* Botão de exportar */}
        <Button 
          className="w-full" 
          onClick={handleExportar}
          disabled={isExporting || previewCount === 0}
        >
          {isExporting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          Gerar Relatório PDF
        </Button>
      </CardContent>
    </Card>
  );
}
