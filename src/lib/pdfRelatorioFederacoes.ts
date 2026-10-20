import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type {
  ConfiguracaoRelatorioFederacao,
  CampoRelatorioFederacao,
} from '@/types/federacoesRelatorio';
import { baixarDocumento, emitirDocumento, type ColunaTabela } from '@/lib/documentos';

// ================================================================
// RELATÓRIO DE FEDERAÇÕES — pelo motor único (`federacoes-relatorio`, ou `-paisagem` quando a tela
// pede paisagem). Aqui só se formatam os valores; o desenho é do motor. `config.incluirLogos` é
// ignorado: os logos seguem a configuração de impressão do cliente.
// ================================================================

function formatarValor(valor: unknown, campo: CampoRelatorioFederacao): string {
  if (valor === null || valor === undefined || valor === '') return '-';

  switch (campo.tipo) {
    case 'data':
      try {
        return format(new Date(valor as string), 'dd/MM/yyyy', { locale: ptBR });
      } catch {
        return String(valor);
      }
    case 'badge':
      if (campo.id === 'status') {
        // Verifica se é status de federação ou de evento
        const federacaoLabels: Record<string, string> = {
          em_analise: 'Em Análise',
          ativo: 'Ativa',
          inativo: 'Inativa',
          rejeitado: 'Rejeitada',
        };
        const eventoLabels: Record<string, string> = {
          planejado: 'Planejado',
          confirmado: 'Confirmado',
          em_andamento: 'Em Andamento',
          concluido: 'Concluído',
          cancelado: 'Cancelado',
        };
        return federacaoLabels[String(valor)] || eventoLabels[String(valor)] || String(valor);
      }
      return String(valor);
    case 'numero': {
      const num = Number(valor);
      return isNaN(num) ? String(valor) : num.toLocaleString('pt-BR');
    }
    default:
      return String(valor);
  }
}

/** Largura relativa da coluna conforme a largura declarada do campo. */
const PESO_LARGURA: Record<NonNullable<CampoRelatorioFederacao['largura']>, number> = {
  pequena: 1,
  media: 1.5,
  grande: 2.2,
  auto: 1.5,
};

export async function gerarRelatorioFederacoesPDF(
  config: ConfiguracaoRelatorioFederacao,
  dados: Record<string, unknown>[],
  camposDisponiveis: CampoRelatorioFederacao[]
): Promise<void> {
  const camposSelecionados = camposDisponiveis.filter((c) => config.camposSelecionados.includes(c.id));
  const colunas: ColunaTabela[] = camposSelecionados.map((c) => ({
    chave: c.id,
    titulo: c.label,
    peso: PESO_LARGURA[c.largura ?? 'auto'],
  }));

  const tipo = config.orientacao === 'paisagem' ? 'federacoes-relatorio-paisagem' : 'federacoes-relatorio';
  const d = await emitirDocumento(tipo, {
    titulo: config.titulo,
    subtitulo: config.subtitulo,
    colunas,
    linhas: dados.map((item) => Object.fromEntries(camposSelecionados.map((c) => [c.id, formatarValor(item[c.id], c)]))),
    carimboArquivo: format(new Date(), 'yyyy-MM-dd-HHmm'),
  });
  baixarDocumento(d);
}
