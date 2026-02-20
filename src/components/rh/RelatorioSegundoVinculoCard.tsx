import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileText, Download, Loader2, Link2 } from "lucide-react";
import { toast } from "sonner";
import { gerarRelatorioSegundoVinculo, type ServidorSegundoVinculo } from "@/lib/pdfRelatorioSegundoVinculo";
import {
  VINCULO_EXTERNO_ESFERA_LABELS,
  VINCULO_EXTERNO_FORMA_LABELS,
  VINCULO_LABELS,
  type VinculoExternoEsfera,
  type VinculoExternoForma,
} from "@/types/rh";

export function RelatorioSegundoVinculoCard() {
  const [filtroEsfera, setFiltroEsfera] = useState<string>("all");
  const [filtroForma, setFiltroForma] = useState<string>("all");
  const [agruparPor, setAgruparPor] = useState<'esfera' | 'forma' | 'nenhum'>('nenhum');
  const [isExporting, setIsExporting] = useState(false);

  // Preview de quantos registros serão exportados
  const { data: previewCount = 0 } = useQuery({
    queryKey: ["segundo-vinculo-preview", filtroEsfera, filtroForma],
    queryFn: async () => {
      let query = supabase
        .from("servidores")
        .select("id", { count: "exact", head: true })
        .eq("ativo", true)
        .eq("possui_vinculo_externo", true);
      
      if (filtroEsfera !== "all") {
        query = query.eq("vinculo_externo_esfera", filtroEsfera);
      }
      if (filtroForma !== "all") {
        query = query.eq("vinculo_externo_forma", filtroForma);
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
        .select(`
          nome_completo,
          cpf,
          matricula,
          vinculo,
          possui_vinculo_externo,
          vinculo_externo_esfera,
          vinculo_externo_orgao,
          vinculo_externo_cargo,
          vinculo_externo_matricula,
          vinculo_externo_forma,
          cargo:cargos(nome),
          unidade:estrutura_organizacional(nome, sigla),
          vinculo_externo_ato:documentos!servidores_vinculo_externo_ato_id_fkey(numero)
        `)
        .eq("ativo", true)
        .eq("possui_vinculo_externo", true)
        .order("nome_completo");

      if (filtroEsfera !== "all") {
        query = query.eq("vinculo_externo_esfera", filtroEsfera);
      }
      if (filtroForma !== "all") {
        query = query.eq("vinculo_externo_forma", filtroForma);
      }

      const { data: servidores, error } = await query;

      if (error) throw error;

      if (!servidores || servidores.length === 0) {
        toast.error("Nenhum servidor com segundo vínculo encontrado");
        return;
      }

      const dadosFormatados: ServidorSegundoVinculo[] = servidores.map(s => ({
        nome: s.nome_completo || '',
        cpf: s.cpf || '',
        matricula: s.matricula,
        vinculo_idjuv: VINCULO_LABELS[s.vinculo as keyof typeof VINCULO_LABELS] || s.vinculo || '',
        cargo_idjuv: (s.cargo as { nome?: string } | null)?.nome || '-',
        unidade_idjuv: (s.unidade as { sigla?: string; nome?: string } | null)?.sigla || (s.unidade as { nome?: string } | null)?.nome || '-',
        vinculo_externo_esfera: s.vinculo_externo_esfera || '',
        vinculo_externo_orgao: s.vinculo_externo_orgao || '',
        vinculo_externo_cargo: s.vinculo_externo_cargo || '',
        vinculo_externo_matricula: s.vinculo_externo_matricula,
        vinculo_externo_forma: s.vinculo_externo_forma || '',
        vinculo_externo_ato_numero: (s.vinculo_externo_ato as { numero?: string } | null)?.numero || null,
      }));

      await gerarRelatorioSegundoVinculo({
        servidores: dadosFormatados,
        totalServidores: dadosFormatados.length,
        dataGeracao: new Date().toLocaleDateString('pt-BR'),
        filtroEsfera: filtroEsfera !== 'all' ? filtroEsfera : null,
        filtroForma: filtroForma !== 'all' ? filtroForma : null,
        agruparPor: agruparPor !== 'nenhum' ? agruparPor : null,
      });

      toast.success(`Relatório gerado com ${dadosFormatados.length} servidores`);
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
            <Link2 className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-lg">Servidores com Segundo Vínculo</CardTitle>
            <CardDescription>
              Servidores com vínculo funcional externo (cessão, requisição)
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filtro por Esfera */}
        <div className="space-y-2">
          <Label htmlFor="filtro-esfera">Esfera do Vínculo</Label>
          <Select value={filtroEsfera} onValueChange={setFiltroEsfera}>
            <SelectTrigger id="filtro-esfera">
              <SelectValue placeholder="Todas as esferas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as esferas</SelectItem>
              {(Object.keys(VINCULO_EXTERNO_ESFERA_LABELS) as VinculoExternoEsfera[]).map(key => (
                <SelectItem key={key} value={key}>
                  {VINCULO_EXTERNO_ESFERA_LABELS[key]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Filtro por Forma */}
        <div className="space-y-2">
          <Label htmlFor="filtro-forma">Forma do Vínculo</Label>
          <Select value={filtroForma} onValueChange={setFiltroForma}>
            <SelectTrigger id="filtro-forma">
              <SelectValue placeholder="Todas as formas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as formas</SelectItem>
              {(Object.keys(VINCULO_EXTERNO_FORMA_LABELS) as VinculoExternoForma[]).map(key => (
                <SelectItem key={key} value={key}>
                  {VINCULO_EXTERNO_FORMA_LABELS[key]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Opção de Agrupamento */}
        <div className="space-y-2">
          <Label>Agrupar por</Label>
          <RadioGroup 
            value={agruparPor} 
            onValueChange={(v) => setAgruparPor(v as 'esfera' | 'forma' | 'nenhum')}
            className="flex gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="nenhum" id="agrupar-nenhum" />
              <Label htmlFor="agrupar-nenhum" className="text-sm cursor-pointer">Nenhum</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="esfera" id="agrupar-esfera" />
              <Label htmlFor="agrupar-esfera" className="text-sm cursor-pointer">Esfera</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="forma" id="agrupar-forma" />
              <Label htmlFor="agrupar-forma" className="text-sm cursor-pointer">Forma</Label>
            </div>
          </RadioGroup>
        </div>

        {/* Preview */}
        <div className="p-3 bg-muted rounded-lg">
          <div className="flex items-center gap-2 text-sm">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              Serão exportados <strong className="text-foreground">{previewCount}</strong> servidores
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