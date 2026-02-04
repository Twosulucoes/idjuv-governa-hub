import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Network, Download, Loader2, Users } from 'lucide-react';
import { toast } from 'sonner';
import { 
  gerarRelatorioServidoresDiretoria, 
  UnidadeComServidores, 
  ServidorDiretoria 
} from '@/lib/pdfRelatorioServidoresDiretoria';

interface UnidadeDB {
  id: string;
  nome: string;
  sigla: string | null;
  tipo: string;
  nivel: number;
  superior_id: string | null;
}

interface LotacaoDB {
  unidade_id: string;
  servidor: {
    nome_completo: string;
    telefone_celular: string | null;
  } | null;
  cargo: {
    nome: string;
    sigla: string | null;
  } | null;
}

export function RelatorioServidoresDiretoriaCard() {
  const [selectedDiretoria, setSelectedDiretoria] = useState<string>('');
  const [incluirLogos, setIncluirLogos] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  // Buscar diretorias disponíveis
  const { data: diretorias = [] } = useQuery({
    queryKey: ['diretorias-relatorio'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('estrutura_organizacional')
        .select('id, nome, sigla, tipo, nivel')
        .eq('ativo', true)
        .eq('tipo', 'diretoria')
        .order('nome');
      
      if (error) throw error;
      return data || [];
    },
  });

  // Buscar contagem de servidores quando uma diretoria é selecionada
  const { data: previewData, isLoading: isLoadingPreview } = useQuery({
    queryKey: ['preview-servidores-diretoria', selectedDiretoria],
    queryFn: async () => {
      if (!selectedDiretoria) return { total: 0 };

      // 1. Buscar divisões subordinadas à diretoria
      const { data: divisoes, error: errDiv } = await supabase
        .from('estrutura_organizacional')
        .select('id')
        .eq('superior_id', selectedDiretoria)
        .eq('ativo', true);

      if (errDiv) throw errDiv;

      const divisoesIds = (divisoes || []).map(d => d.id);

      // 2. Buscar núcleos subordinados às divisões
      let nucleosIds: string[] = [];
      if (divisoesIds.length > 0) {
        const { data: nucleos, error: errNuc } = await supabase
          .from('estrutura_organizacional')
          .select('id')
          .in('superior_id', divisoesIds)
          .eq('ativo', true);

        if (errNuc) throw errNuc;
        nucleosIds = (nucleos || []).map(n => n.id);
      }

      // 3. Combinar todos os IDs
      const todasUnidadesIds = [selectedDiretoria, ...divisoesIds, ...nucleosIds];

      // 4. Contar lotações ativas
      const { count, error: errCount } = await supabase
        .from('lotacoes')
        .select('id', { count: 'exact', head: true })
        .in('unidade_id', todasUnidadesIds)
        .eq('ativo', true);

      if (errCount) throw errCount;

      return { 
        total: count || 0,
        divisoes: divisoesIds.length,
        nucleos: nucleosIds.length
      };
    },
    enabled: !!selectedDiretoria,
  });

  const handleGerarRelatorio = async () => {
    if (!selectedDiretoria) {
      toast.error('Selecione uma diretoria');
      return;
    }

    setIsGenerating(true);
    try {
      // 1. Buscar diretoria selecionada
      const { data: diretoriaData, error: errDir } = await supabase
        .from('estrutura_organizacional')
        .select('id, nome, sigla, tipo, nivel')
        .eq('id', selectedDiretoria)
        .single();

      if (errDir) throw errDir;

      // 2. Buscar divisões subordinadas
      const { data: divisoesData, error: errDivisoes } = await supabase
        .from('estrutura_organizacional')
        .select('id, nome, sigla, tipo, nivel, superior_id')
        .eq('superior_id', selectedDiretoria)
        .eq('ativo', true)
        .order('nome');

      if (errDivisoes) throw errDivisoes;

      const divisoes: UnidadeDB[] = divisoesData || [];
      const divisoesIds = divisoes.map(d => d.id);

      // 3. Buscar núcleos subordinados às divisões
      let nucleos: UnidadeDB[] = [];
      if (divisoesIds.length > 0) {
        const { data: nucleosData, error: errNucleos } = await supabase
          .from('estrutura_organizacional')
          .select('id, nome, sigla, tipo, nivel, superior_id')
          .in('superior_id', divisoesIds)
          .eq('ativo', true)
          .order('nome');

        if (errNucleos) throw errNucleos;
        nucleos = nucleosData || [];
      }

      // 4. Combinar todos os IDs
      const todasUnidadesIds = [
        selectedDiretoria, 
        ...divisoesIds, 
        ...nucleos.map(n => n.id)
      ];

      // 5. Buscar lotações
      const { data: lotacoesData, error: errLot } = await supabase
        .from('lotacoes')
        .select(`
          unidade_id,
          servidor:servidores!lotacoes_servidor_id_fkey(
            nome_completo,
            telefone_celular
          ),
          cargo:cargos(
            nome,
            sigla
          )
        `)
        .in('unidade_id', todasUnidadesIds)
        .eq('ativo', true);

      if (errLot) throw errLot;

      const lotacoes: LotacaoDB[] = (lotacoesData || []).map(l => ({
        unidade_id: l.unidade_id,
        servidor: l.servidor as LotacaoDB['servidor'],
        cargo: l.cargo as LotacaoDB['cargo']
      }));

      // 6. Mapear servidores por unidade
      const servidoresPorUnidade = new Map<string, ServidorDiretoria[]>();
      
      lotacoes.forEach(l => {
        if (!servidoresPorUnidade.has(l.unidade_id)) {
          servidoresPorUnidade.set(l.unidade_id, []);
        }
        servidoresPorUnidade.get(l.unidade_id)!.push({
          nome: l.servidor?.nome_completo || '',
          telefone: l.servidor?.telefone_celular || null,
          cargo: l.cargo?.nome || l.cargo?.sigla || null
        });
      });

      // 7. Ordenar servidores por nome dentro de cada unidade
      servidoresPorUnidade.forEach((servidores) => {
        servidores.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
      });

      // 8. Montar estrutura hierárquica
      const buildNucleosSubordinados = (divisaoId: string): UnidadeComServidores[] => {
        return nucleos
          .filter(n => n.superior_id === divisaoId)
          .map(n => ({
            id: n.id,
            nome: n.nome,
            sigla: n.sigla,
            tipo: (n.tipo || 'nucleo') as UnidadeComServidores['tipo'],
            nivel: n.nivel,
            servidores: servidoresPorUnidade.get(n.id) || [],
            subordinadas: []
          }));
      };

      const estruturaDiretoria: UnidadeComServidores = {
        id: diretoriaData.id,
        nome: diretoriaData.nome,
        sigla: diretoriaData.sigla,
        tipo: (diretoriaData.tipo || 'diretoria') as UnidadeComServidores['tipo'],
        nivel: diretoriaData.nivel,
        servidores: servidoresPorUnidade.get(diretoriaData.id) || [],
        subordinadas: divisoes.map(d => ({
          id: d.id,
          nome: d.nome,
          sigla: d.sigla,
          tipo: (d.tipo || 'divisao') as UnidadeComServidores['tipo'],
          nivel: d.nivel,
          servidores: servidoresPorUnidade.get(d.id) || [],
          subordinadas: buildNucleosSubordinados(d.id)
        }))
      };

      // 9. Gerar PDF
      await gerarRelatorioServidoresDiretoria(estruturaDiretoria, incluirLogos);
      
      toast.success('Relatório gerado com sucesso!');
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      toast.error('Erro ao gerar relatório');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Network className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg">Servidores por Diretoria</CardTitle>
            <CardDescription>
              Relatório hierárquico com todas as unidades subordinadas
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Seletor de Diretoria */}
        <div className="space-y-2">
          <Label>Diretoria</Label>
          <Select value={selectedDiretoria} onValueChange={setSelectedDiretoria}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione uma diretoria" />
            </SelectTrigger>
            <SelectContent>
              {diretorias.map((dir) => (
                <SelectItem key={dir.id} value={dir.id}>
                  {dir.sigla ? `${dir.sigla} - ${dir.nome}` : dir.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Preview */}
        {selectedDiretoria && (
          <div className="p-3 bg-muted/50 rounded-lg">
            {isLoadingPreview ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Carregando...
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4 text-primary" />
                <span className="font-medium">{previewData?.total || 0}</span>
                <span className="text-muted-foreground">
                  servidor{previewData?.total !== 1 ? 'es' : ''} encontrado{previewData?.total !== 1 ? 's' : ''}
                </span>
                {previewData && previewData.divisoes > 0 && (
                  <span className="text-muted-foreground text-xs">
                    ({previewData.divisoes} divisão(ões), {previewData.nucleos} núcleo(s))
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Checkbox logos */}
        <div className="flex items-center space-x-2">
          <Checkbox
            id="incluir-logos"
            checked={incluirLogos}
            onCheckedChange={(checked) => setIncluirLogos(checked === true)}
          />
          <Label htmlFor="incluir-logos" className="text-sm font-normal cursor-pointer">
            Incluir logos no cabeçalho
          </Label>
        </div>

        {/* Botão gerar */}
        <Button 
          className="w-full" 
          onClick={handleGerarRelatorio}
          disabled={isGenerating || !selectedDiretoria}
        >
          {isGenerating ? (
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
