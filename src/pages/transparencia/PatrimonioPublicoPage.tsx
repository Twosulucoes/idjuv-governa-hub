import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/MainLayout";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DataTable, KpiCard, StatusBadge, type ColunaTabela, type TomStatus } from "@/components/design-system";
import { useIdentidade } from "@/core/tenant";
import { 
  Package, 
  MapPin,
  Building2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

/** Situação do bem → rótulo e tom. Valor desconhecido cai em neutro com o próprio texto. */
const SITUACAO_BEM: Record<string, { label: string; tom: TomStatus }> = {
  em_uso: { label: "Em uso", tom: "sucesso" },
  disponivel: { label: "Disponível", tom: "neutro" },
  cedido: { label: "Cedido", tom: "neutro" },
  em_manutencao: { label: "Em manutenção", tom: "pendente" },
  baixado: { label: "Baixado", tom: "erro" },
};

export default function PatrimonioPublicoPage() {
  const [filtroSituacao, setFiltroSituacao] = useState<string>("todos");
  const { sigla } = useIdentidade();

  // LGPD-Safe: Busca SEM dados de responsável pessoal
  const { data: bens, isLoading, isError, refetch } = useQuery({
    queryKey: ['transparencia-patrimonio'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bens_patrimoniais')
        .select(`
          id,
          numero_patrimonio,
          descricao,
          marca,
          modelo,
          situacao,
          estado_conservacao,
          valor_aquisicao,
          data_aquisicao,
          unidades_locais!bens_patrimoniais_unidade_local_id_fkey(nome, municipio),
          estrutura_organizacional!bens_patrimoniais_unidade_id_fkey(nome)
        `)
        .order('numero_patrimonio', { ascending: true });
      
      if (error) throw error;
      
      // LGPD-Safe: SEM responsavel_id, responsavel_nome, responsavel_matricula
      return (data || []).map((item: any) => ({
        id: item.id,
        numero_patrimonio: item.numero_patrimonio,
        descricao: item.descricao,
        marca: item.marca,
        modelo: item.modelo,
        situacao: item.situacao,
        estado_conservacao: item.estado_conservacao,
        valor_aquisicao: item.valor_aquisicao,
        data_aquisicao: item.data_aquisicao,
        // Apenas dados institucionais
        localizacao: item.unidades_locais?.nome,
        municipio: item.unidades_locais?.municipio,
        unidade_administrativa: item.estrutura_organizacional?.nome
      }));
    }
  });

  // A busca por texto fica com a DataTable; aqui só o filtro de situação.
  const bensFiltrados = (bens || []).filter(bem =>
    filtroSituacao === "todos" || bem.situacao === filtroSituacao
  );
  type BemPublico = (typeof bensFiltrados)[number];

  const formatCurrency = (value: number | null) => {
    if (!value) return "-";
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString('pt-BR');
  };

  const getSituacaoBadge = (situacao: string | null) => {
    const s = (situacao && SITUACAO_BEM[situacao]) ?? { label: situacao ?? "Sem situação", tom: "neutro" as const };
    return <StatusBadge tom={s.tom}>{s.label}</StatusBadge>;
  };

  const getEstadoBadge = (estado: string | null) => {
    const labels: Record<string, string> = {
      'otimo': 'Ótimo',
      'bom': 'Bom',
      'regular': 'Regular',
      'ruim': 'Ruim',
      'inservivel': 'Inservível',
    };
    if (!estado) return <span className="text-muted-foreground">-</span>;
    return (
      <span className="px-2 py-0.5 rounded text-sm font-medium bg-muted">
        {labels[estado] || estado}
      </span>
    );
  };

  const colunas: ColunaTabela<BemPublico>[] = [
    {
      id: "patrimonio",
      cabecalho: "Patrimônio",
      celula: (bem) => <span className="font-medium whitespace-nowrap">{bem.numero_patrimonio}</span>,
      ordenarPor: (bem) => bem.numero_patrimonio,
      buscarPor: (bem) => bem.numero_patrimonio,
    },
    {
      id: "descricao",
      cabecalho: "Descrição",
      celula: (bem) => (
        <span className="block max-w-xs truncate" title={bem.descricao}>
          {bem.descricao}
        </span>
      ),
      ordenarPor: (bem) => bem.descricao,
      buscarPor: (bem) => bem.descricao,
      mobile: "titulo",
    },
    {
      id: "marca",
      cabecalho: "Marca/Modelo",
      celula: (bem) => (
        <span className="whitespace-nowrap">
          {bem.marca} {bem.modelo && `/ ${bem.modelo}`}
        </span>
      ),
    },
    {
      id: "valor",
      cabecalho: "Valor",
      celula: (bem) => <span className="whitespace-nowrap tabular-nums">{formatCurrency(bem.valor_aquisicao)}</span>,
      ordenarPor: (bem) => bem.valor_aquisicao,
      alinhamento: "direita",
    },
    {
      id: "aquisicao",
      cabecalho: "Aquisição",
      celula: (bem) => <span className="whitespace-nowrap">{formatDate(bem.data_aquisicao)}</span>,
      ordenarPor: (bem) => bem.data_aquisicao,
    },
    {
      id: "estado",
      cabecalho: "Estado",
      celula: (bem) => getEstadoBadge(bem.estado_conservacao),
    },
    {
      id: "situacao",
      cabecalho: "Situação",
      celula: (bem) => getSituacaoBadge(bem.situacao),
      ordenarPor: (bem) => bem.situacao,
    },
    {
      id: "localizacao",
      cabecalho: "Localização",
      celula: (bem) =>
        bem.localizacao ? (
          <div className="flex items-center gap-1">
            <MapPin className="w-3 h-3 text-muted-foreground" aria-hidden="true" />
            <span className="truncate max-w-[120px]">{bem.localizacao}</span>
          </div>
        ) : bem.unidade_administrativa ? (
          <div className="flex items-center gap-1">
            <Building2 className="w-3 h-3 text-muted-foreground" aria-hidden="true" />
            <span className="truncate max-w-[120px]">{bem.unidade_administrativa}</span>
          </div>
        ) : (
          <span className="text-muted-foreground">-</span>
        ),
      buscarPor: (bem) => bem.localizacao ?? bem.unidade_administrativa,
    },
  ];

  // Estatísticas agregadas (sem identificação pessoal)
  const totalBens = bensFiltrados.length;
  const valorTotal = bensFiltrados.reduce((acc, b) => acc + (b.valor_aquisicao || 0), 0);

  return (
    <MainLayout>
      {/* Cabeçalho */}
      <section className="bg-secondary text-secondary-foreground py-12">
        <div className="container mx-auto px-4">
          <nav aria-label="Trilha de navegação" className="flex items-center gap-3 text-sm mb-4 opacity-90">
            <Link to="/" className="inline-flex min-h-11 items-center hover:underline">Início</Link>
            <span aria-hidden="true">/</span>
            <Link to="/transparencia" className="inline-flex min-h-11 items-center hover:underline">Transparência</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">Patrimônio</span>
          </nav>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-accent rounded-xl flex items-center justify-center" aria-hidden="true">
              <Package className="w-8 h-8 text-accent-foreground" />
            </div>
            <div>
              <h1 className="font-serif text-3xl lg:text-4xl font-bold">
                Patrimônio Público
              </h1>
              <p className="text-base opacity-90 mt-1">
                Bens patrimoniais do {sigla}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Estatísticas agregadas */}
      <section className="py-6 bg-muted/30 border-b">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KpiCard rotulo="Total de bens" valor={totalBens} icone={Package} carregando={isLoading} />
            <KpiCard rotulo="Valor total" valor={formatCurrency(valorTotal)} carregando={isLoading} />
          </div>
        </div>
      </section>

      {/* Tabela */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          <h2 className="font-serif text-2xl font-bold mb-4">Bens patrimoniais</h2>
          <DataTable
            rotulo="Bens patrimoniais"
            dados={bensFiltrados}
            colunas={colunas}
            chaveLinha={(bem) => bem.id}
            carregando={isLoading}
            erro={isError ? "Não foi possível carregar os bens patrimoniais." : null}
            aoTentarNovamente={() => refetch()}
            busca={{ placeholder: "Buscar por descrição ou número de patrimônio…" }}
            filtros={
              <Select value={filtroSituacao} onValueChange={setFiltroSituacao}>
                <SelectTrigger className="w-full sm:w-48" aria-label="Situação">
                  <SelectValue placeholder="Todas as situações" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas as situações</SelectItem>
                  {Object.entries(SITUACAO_BEM).map(([valor, { label }]) => (
                    <SelectItem key={valor} value={valor}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            }
            vazio={{
              icone: Package,
              titulo: "Nenhum bem encontrado",
              descricao: "Troque a situação para ver outros bens.",
            }}
          />

          {/* Nota LGPD */}
          <div className="mt-8 bg-muted/50 rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Package className="w-5 h-5 text-secondary" aria-hidden="true" />
              Nota sobre os dados
            </h2>
            <p className="text-base text-muted-foreground">
              Em conformidade com a LGPD (Art. 6º, III - princípio da minimização), 
              esta listagem exibe apenas dados institucionais do patrimônio. 
              Dados de responsáveis são de uso interno administrativo.
            </p>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}
