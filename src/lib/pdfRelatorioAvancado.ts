import { format } from 'date-fns';
import type {
  ConfiguracaoRelatorio,
  CampoRelatorio,
  NivelAgrupamento,
} from '@/types/relatorios';
import { CAMPOS_POR_TIPO, TIPO_RELATORIO_LABELS } from '@/types/relatorios';
import { STATUS_PORTARIA_LABELS } from '@/types/portaria';
import { baixarDocumento, emitirDocumento, type ColunaTabela } from '@/lib/documentos';
import type { GrupoRelatorioDinamico } from '@/lib/documentos/modelos/relatorios/colunasDinamicas';

// ================================================================
// RELATÓRIO DE COLUNAS DINÂMICAS (Central de relatórios) — pelo motor único
// (`relatorios-colunas-dinamicas`, ou `-paisagem` quando a tela pede paisagem).
// Aqui só se formatam os valores e se montam os grupos; o desenho é do motor.
// ================================================================

// Formatar valor para exibição
function formatarValor(valor: unknown, campo: CampoRelatorio): string {
  if (valor === null || valor === undefined) return '';

  switch (campo.tipo) {
    case 'data':
      try {
        return format(new Date(String(valor)), 'dd/MM/yyyy');
      } catch {
        return String(valor);
      }
    case 'numero':
      if (campo.id.includes('percentual')) {
        return `${valor}%`;
      }
      if (campo.id.includes('vencimento')) {
        return `R$ ${Number(valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
      }
      return String(valor);
    case 'badge':
      // Traduzir status se for portaria
      if (campo.id === 'status' && STATUS_PORTARIA_LABELS[valor as keyof typeof STATUS_PORTARIA_LABELS]) {
        return STATUS_PORTARIA_LABELS[valor as keyof typeof STATUS_PORTARIA_LABELS];
      }
      // Capitalizar
      return String(valor).charAt(0).toUpperCase() + String(valor).slice(1).replace(/_/g, ' ');
    default:
      return String(valor);
  }
}

// Obter valor de um campo (suporta campos aninhados)
function obterValor(item: Record<string, unknown>, campoId: string): unknown {
  if (campoId in item) {
    return item[campoId];
  }

  // Tentar campos aninhados (ex: cargo.nome -> cargo_nome)
  const partes = campoId.split('_');
  if (partes.length > 1) {
    const obj = item[partes[0]];
    if (obj && typeof obj === 'object') {
      return (obj as Record<string, unknown>)[partes.slice(1).join('_')];
    }
  }

  return null;
}

/** Largura relativa da coluna, na mesma proporção das larguras fixas (mm) do gerador antigo. */
const PESO_LARGURA: Record<NonNullable<CampoRelatorio['largura']>, number> = {
  pequena: 1,
  media: 1.5,
  grande: 2.2,
  auto: 2.5,
};

function agruparDados(
  dados: Record<string, unknown>[],
  agrupamentos: NivelAgrupamento[],
  campos: CampoRelatorio[],
  linhaDe: (item: Record<string, unknown>) => Record<string, string>,
  nivel = 0
): GrupoRelatorioDinamico[] {
  const agrupamento = agrupamentos[nivel];
  const campo = campos.find((c) => c.id === agrupamento.campo);
  const grupos: Record<string, Record<string, unknown>[]> = {};

  dados.forEach((item) => {
    const chave = String(obterValor(item, agrupamento.campo) || 'Não definido');
    if (!grupos[chave]) grupos[chave] = [];
    grupos[chave].push(item);
  });

  return Object.keys(grupos)
    .sort((a, b) => (agrupamento.ordem === 'asc' ? a.localeCompare(b) : b.localeCompare(a)))
    .map((chave) => {
      const itens = grupos[chave];
      const folha = nivel + 1 >= agrupamentos.length;
      return {
        rotulo: (campo ? formatarValor(chave, campo) : chave) || chave,
        contagem: itens.length,
        subgrupos: folha ? [] : agruparDados(itens, agrupamentos, campos, linhaDe, nivel + 1),
        linhas: folha ? itens.map(linhaDe) : [],
      };
    });
}

export async function gerarRelatorioPDF(
  config: ConfiguracaoRelatorio,
  dados: Record<string, unknown>[]
): Promise<void> {
  const camposDisponiveis = CAMPOS_POR_TIPO[config.tipo];
  const camposSelecionados = camposDisponiveis.filter((c) => config.camposSelecionados.includes(c.id));

  const colunas: ColunaTabela[] = camposSelecionados.map((c) => ({
    chave: c.id,
    titulo: c.label.toUpperCase(),
    peso: PESO_LARGURA[c.largura ?? 'auto'],
  }));
  const linhaDe = (item: Record<string, unknown>): Record<string, string> =>
    Object.fromEntries(camposSelecionados.map((c) => [c.id, formatarValor(obterValor(item, c.id), c)]));

  // Resumo: contagem por valor do 1º agrupamento (até 8, como no relatório antigo).
  let resumo: { rotulo: string; valor: number }[] | undefined;
  if (config.mostrarResumo && dados.length > 0 && config.agrupamentos.length > 0) {
    const campoAgrup = config.agrupamentos[0].campo;
    const campo = camposDisponiveis.find((c) => c.id === campoAgrup);
    const contagens: Record<string, number> = {};
    dados.forEach((item) => {
      const valor = String(obterValor(item, campoAgrup) || 'Não definido');
      contagens[valor] = (contagens[valor] || 0) + 1;
    });
    resumo = Object.entries(contagens)
      .slice(0, 8)
      .map(([chave, valor]) => ({ rotulo: (campo ? formatarValor(chave, campo) : chave) || chave, valor }));
  }

  const comAgrupamento = config.agrupamentos.length > 0;
  const tipo = config.orientacao === 'paisagem' ? 'relatorios-colunas-dinamicas-paisagem' : 'relatorios-colunas-dinamicas';
  const d = await emitirDocumento(tipo, {
    titulo: config.titulo,
    subtitulo: config.subtitulo,
    tipoRotulo: TIPO_RELATORIO_LABELS[config.tipo],
    colunas,
    totalRegistros: dados.length,
    resumo,
    grupos: comAgrupamento ? agruparDados(dados, config.agrupamentos, camposDisponiveis, linhaDe) : undefined,
    linhas: comAgrupamento ? undefined : dados.map(linhaDe),
    mostrarTotais: config.mostrarTotais,
    nomeArquivo: `${config.nome.replace(/\s+/g, '_')}_${format(new Date(), 'yyyy-MM-dd_HHmm')}.pdf`,
  });
  baixarDocumento(d);
}
