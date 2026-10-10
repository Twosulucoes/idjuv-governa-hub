import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/MainLayout";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DataTable, StatusBadge, type ColunaTabela, type TomStatus } from "@/components/design-system";
import { 
  FileText, 
  Building2,
  ExternalLink,
  Gavel
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

import { useTenant } from "@/core/tenant";

/** Fase do processo → rótulo e tom. Fase desconhecida cai em neutro com o próprio texto. */
const SITUACAO_LICITACAO: Record<string, { label: string; tom: TomStatus }> = {
  em_andamento: { label: "Em andamento", tom: "andamento" },
  publicado: { label: "Publicado", tom: "andamento" },
  julgamento: { label: "Em julgamento", tom: "andamento" },
  homologado: { label: "Homologado", tom: "sucesso" },
  revogado: { label: "Revogado", tom: "erro" },
  fracassado: { label: "Fracassado", tom: "erro" },
  deserto: { label: "Deserto", tom: "neutro" },
};

interface LicitacaoPublica {
  id: string;
  numero_processo: string;
  ano: number;
  modalidade: string;
  objeto: string;
  situacao: string;
  valor_estimado: number | null;
  data_abertura: string | null;
  data_homologacao: string | null;
  unidade_requisitante: string | null;
  vencedor_nome: string | null;
  vencedor_documento_parcial: string | null;
}

export default function LicitacoesPublicasPage() {
  const { integracoes, identidade } = useTenant();
  const [filtroAno, setFiltroAno] = useState<string>("todos");
  const [filtroModalidade, setFiltroModalidade] = useState<string>("todos");

  // LGPD-Safe: Busca apenas fornecedores pessoa jurídica
  const { data: licitacoes, isLoading, isError, refetch } = useQuery({
    queryKey: ['transparencia-licitacoes', filtroAno, filtroModalidade],
    queryFn: async () => {
      let query = supabase
        .from('processos_licitatorios')
        .select(`
          id,
          numero_processo,
          ano,
          modalidade,
          objeto,
          fase_atual,
          valor_estimado,
          data_abertura,
          data_homologacao,
          unidade_requisitante_id,
          estrutura_organizacional!processos_licitatorios_unidade_requisitante_id_fkey(nome),
          fornecedores!processos_licitatorios_fornecedor_id_fkey(razao_social, tipo_pessoa, cnpj)
        `)
        .order('ano', { ascending: false })
        .order('numero_processo', { ascending: false });

      if (filtroAno !== "todos") {
        query = query.eq('ano', parseInt(filtroAno));
      }
      if (filtroModalidade !== "todos") {
        query = query.eq('modalidade', filtroModalidade as any);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      
      // LGPD-Safe: Exclui pessoa física, mascara CNPJ
      return (data || [])
        .filter((item: any) => 
          !item.fornecedores || item.fornecedores.tipo_pessoa !== 'fisica'
        )
        .map((item: any) => ({
          id: item.id,
          numero_processo: item.numero_processo,
          ano: item.ano,
          modalidade: item.modalidade,
          objeto: item.objeto,
          situacao: item.fase_atual,
          valor_estimado: item.valor_estimado,
          data_abertura: item.data_abertura,
          data_homologacao: item.data_homologacao,
          unidade_requisitante: item.estrutura_organizacional?.nome,
          // Apenas razão social de PJ (nunca nome de pessoa física)
          vencedor_nome: item.fornecedores?.tipo_pessoa === 'juridica' 
            ? item.fornecedores?.razao_social 
            : null,
          // CNPJ mascarado (nunca CPF)
          vencedor_documento_parcial: item.fornecedores?.cnpj 
            ? `${item.fornecedores.cnpj.substring(0, 8)}****${item.fornecedores.cnpj.substring(12)}`
            : null
        })) as LicitacaoPublica[];
    }
  });

  const formatCurrency = (value: number | null) => {
    if (!value) return "-";
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString('pt-BR');
  };

  const getSituacaoBadge = (situacao: string | null) => {
    const s = (situacao && SITUACAO_LICITACAO[situacao]) ?? { label: situacao ?? "Sem situação", tom: "neutro" as const };
    return <StatusBadge tom={s.tom}>{s.label}</StatusBadge>;
  };

  const colunas: ColunaTabela<LicitacaoPublica>[] = [
    {
      id: "processo",
      cabecalho: "Processo",
      celula: (lic) => (
        <span className="font-medium whitespace-nowrap">
          {lic.numero_processo}/{lic.ano}
        </span>
      ),
      ordenarPor: (lic) => `${lic.ano}-${lic.numero_processo}`,
      buscarPor: (lic) => `${lic.numero_processo}/${lic.ano}`,
    },
    {
      id: "modalidade",
      cabecalho: "Modalidade",
      celula: (lic) => <span className="whitespace-nowrap">{lic.modalidade?.replace(/_/g, " ")}</span>,
      ordenarPor: (lic) => lic.modalidade,
    },
    {
      id: "objeto",
      cabecalho: "Objeto",
      celula: (lic) => (
        <span className="block max-w-xs truncate" title={lic.objeto}>
          {lic.objeto}
        </span>
      ),
      buscarPor: (lic) => lic.objeto,
      mobile: "titulo",
    },
    {
      id: "valor",
      cabecalho: "Valor estimado",
      celula: (lic) => <span className="whitespace-nowrap tabular-nums">{formatCurrency(lic.valor_estimado)}</span>,
      ordenarPor: (lic) => lic.valor_estimado,
      alinhamento: "direita",
    },
    {
      id: "abertura",
      cabecalho: "Abertura",
      celula: (lic) => <span className="whitespace-nowrap">{formatDate(lic.data_abertura)}</span>,
      ordenarPor: (lic) => lic.data_abertura,
    },
    {
      id: "situacao",
      cabecalho: "Situação",
      celula: (lic) => getSituacaoBadge(lic.situacao),
      ordenarPor: (lic) => lic.situacao,
    },
    {
      id: "vencedor",
      cabecalho: "Vencedor (PJ)",
      celula: (lic) =>
        lic.vencedor_nome ? (
          <div>
            <p className="font-medium truncate max-w-[150px]">{lic.vencedor_nome}</p>
            <p className="text-muted-foreground text-sm">{lic.vencedor_documento_parcial}</p>
          </div>
        ) : (
          <span className="text-muted-foreground">-</span>
        ),
      buscarPor: (lic) => lic.vencedor_nome,
    },
  ];

  const anos = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  return (
    <MainLayout>
      {/* Cabeçalho */}
      <section className="bg-primary text-primary-foreground py-12">
        <div className="container mx-auto px-4">
          <nav aria-label="Trilha de navegação" className="flex items-center gap-3 text-sm mb-4 opacity-90">
            <Link to="/" className="inline-flex min-h-11 items-center hover:underline">Início</Link>
            <span aria-hidden="true">/</span>
            <Link to="/transparencia" className="inline-flex min-h-11 items-center hover:underline">Transparência</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">Licitações e contratos</span>
          </nav>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-accent rounded-xl flex items-center justify-center" aria-hidden="true">
              <Gavel className="w-8 h-8 text-accent-foreground" />
            </div>
            <div>
              <h1 className="font-serif text-3xl lg:text-4xl font-bold">
                Licitações e Contratos
              </h1>
              <p className="text-base opacity-90 mt-1">
                Processos licitatórios públicos do {identidade.sigla}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Tabela */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          <h2 className="font-serif text-2xl font-bold mb-4">Processos licitatórios</h2>
          <DataTable
            key={`${filtroAno}-${filtroModalidade}`}
            rotulo="Processos licitatórios"
            dados={licitacoes ?? []}
            colunas={colunas}
            chaveLinha={(lic) => lic.id}
            carregando={isLoading}
            erro={isError ? "Não foi possível carregar os processos licitatórios." : null}
            aoTentarNovamente={() => refetch()}
            busca={{ placeholder: "Buscar por objeto ou número do processo…" }}
            filtros={
              <>
                <Select value={filtroAno} onValueChange={setFiltroAno}>
                  <SelectTrigger className="w-full sm:w-40" aria-label="Ano">
                    <SelectValue placeholder="Todos os anos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os anos</SelectItem>
                    {anos.map(ano => (
                      <SelectItem key={ano} value={ano.toString()}>{ano}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filtroModalidade} onValueChange={setFiltroModalidade}>
                  <SelectTrigger className="w-full sm:w-48" aria-label="Modalidade">
                    <SelectValue placeholder="Todas as modalidades" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todas as modalidades</SelectItem>
                    <SelectItem value="pregao_eletronico">Pregão eletrônico</SelectItem>
                    <SelectItem value="pregao_presencial">Pregão presencial</SelectItem>
                    <SelectItem value="concorrencia">Concorrência</SelectItem>
                    <SelectItem value="dispensa">Dispensa</SelectItem>
                    <SelectItem value="inexigibilidade">Inexigibilidade</SelectItem>
                  </SelectContent>
                </Select>
              </>
            }
            vazio={{
              icone: FileText,
              titulo: "Nenhum processo encontrado",
              descricao: "Troque o ano ou a modalidade para ver outros processos.",
            }}
          />

          {/* Informações adicionais */}
          <div className="mt-8 bg-muted/50 rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" aria-hidden="true" />
              Informações complementares
            </h2>
            <p className="text-base text-muted-foreground mb-4">
              Os dados exibidos seguem a Lei nº 14.133/2021 (Nova Lei de Licitações) e a LGPD. 
              Contratos com pessoa física não são exibidos para proteção de dados pessoais.
            </p>
            {integracoes?.portalTransparenciaUrl && (
              <a
                href={integracoes.portalTransparenciaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center gap-2 text-primary hover:underline text-base font-medium"
              >
                Portal da Transparência do Estado
                <span className="sr-only"> (abre em nova aba)</span>
                <ExternalLink className="w-4 h-4" aria-hidden="true" />
              </a>
            )}
          </div>
        </div>
      </section>
    </MainLayout>
  );
}
