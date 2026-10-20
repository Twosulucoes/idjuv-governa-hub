import { paragrafo } from '../../blocos';
import { usarPreenchimento, usarTexto, usarTraco } from '../../core/pintura';
import { cortarEmUmaLinha, quebrarEmLinhas } from '../../core/texto';
import { ALTURA_CABECALHO, ESPACO, NEUTROS, PAGINA, alturaLinha, corLegivel, ptParaMm } from '../../core/tokens';
import type { Bloco, ContextoDocumento, DocumentoModelo } from '../../tipos';
import {
  arvoreOrganograma,
  dataDoArquivo,
  rotuloUnidade,
  totalServidores,
  type NoOrganograma,
  type UnidadeOrganograma,
} from './comum';

export interface UnidadeOrganogramaDesenho extends UnidadeOrganograma {
  /** Responsável da unidade, ou o primeiro lotado com "+N" quando há outros. */
  responsavel?: string | null;
}

export interface DadosOrganogramaDesenho {
  titulo?: string;
  subtitulo?: string;
  unidades: UnidadeOrganogramaDesenho[];
  exibirNomesServidores: boolean;
  exibirQuantidadeServidores: boolean;
  exibirLegenda: boolean;
}

// Medidas do diagrama (mm).
const LARGURA_MINIMA_COLUNA = 45;
const ENTRE_COLUNAS = 5;
/** Recuo de cada nível dentro da coluna. */
const RECUO = 4;
/** O recuo para no 4º nível: hierarquia mais funda (ou cadastro errado) não espreme a caixa até sumir. */
const recuo = (prof: number): number => Math.min(prof, 4) * RECUO;
/** Linhas no máximo por parte da caixa (nome, tipo, responsável); o resto vira "…" e a caixa nunca passa da página. */
const MAX_LINHAS = 4;
/** Espaço à esquerda da coluna para a linha que desce do topo. */
const ESPINHA = 3;
const ENTRE_CAIXAS = 2.2;
const PAD = 1;
const BARRA = 1.2;
/** Distância do topo ao barramento e do barramento às colunas. */
const BARRAMENTO = 4;

type No = NoOrganograma<UnidadeOrganogramaDesenho>;

interface Caixa {
  partes: { linhas: string[]; tamanho: number; estilo: 'bold' | 'normal' | 'italic' }[];
  altura: number;
}

interface Linha {
  id: number;
  no: No;
  /** Profundidade dentro da coluna (0 = unidade que pendura no topo). */
  prof: number;
  pai: number | null;
  caixa: Caixa;
}

interface Coluna {
  itens: { linha: Linha; y: number }[];
  /** Rótulo da unidade cuja subárvore continua de outra coluna. */
  continuacao?: string;
}

function medirCaixa(ctx: ContextoDocumento, u: UnidadeOrganogramaDesenho, largura: number, d: DadosOrganogramaDesenho): Caixa {
  const { doc } = ctx;
  const tamTitulo = ctx.fonte.tabela;
  const tamDetalhe = ctx.fonte.rotulo - 1;
  const util = largura - 2 * PAD;
  const partes: Caixa['partes'] = [];
  const parte = (texto: string, tamanho: number, estilo: 'bold' | 'normal' | 'italic'): void => {
    doc.setFont('helvetica', estilo);
    doc.setFontSize(tamanho);
    const linhas = quebrarEmLinhas(doc, texto, util);
    if (linhas.length > MAX_LINHAS) linhas.splice(MAX_LINHAS - 1, Infinity, cortarEmUmaLinha(doc, `${linhas.slice(MAX_LINHAS - 1).join(' ')} …`, util));
    partes.push({ linhas, tamanho, estilo });
  };
  parte(rotuloUnidade(u), tamTitulo, 'bold');
  parte([u.tipo, d.exibirQuantidadeServidores ? `${u.quantidadeServidores} serv.` : ''].filter(Boolean).join(' · '), tamDetalhe, 'normal');
  if (d.exibirNomesServidores && u.responsavel) parte(u.responsavel, tamDetalhe, 'italic');
  const altura = BARRA + 2 * PAD + partes.reduce((s, p) => s + p.linhas.length * alturaLinha(p.tamanho), 0);
  return { partes, altura };
}

function desenharCaixa(ctx: ContextoDocumento, c: Caixa, x: number, y: number, largura: number, topo: boolean): void {
  const { doc } = ctx;
  const cor = corLegivel(ctx.marca.corPrimaria);
  usarPreenchimento(doc, NEUTROS.branco);
  usarTraco(doc, topo ? cor : NEUTROS.linha);
  doc.setLineWidth(topo ? 0.5 : 0.3);
  doc.rect(x, y, largura, c.altura, 'FD');
  usarPreenchimento(doc, cor);
  doc.rect(x, y, largura, BARRA, 'F');
  let cursor = y + BARRA + PAD;
  for (const p of c.partes) {
    doc.setFont('helvetica', p.estilo);
    doc.setFontSize(p.tamanho);
    usarTexto(doc, p.estilo === 'normal' ? NEUTROS.textoSuave : NEUTROS.texto);
    for (const l of p.linhas) {
      doc.text(l, x + largura / 2, cursor + ptParaMm(p.tamanho), { align: 'center' });
      cursor += alturaLinha(p.tamanho);
    }
  }
}

function linha(ctx: ContextoDocumento, x1: number, y1: number, x2: number, y2: number): void {
  usarTraco(ctx.doc, NEUTROS.linha);
  ctx.doc.setLineWidth(0.25);
  ctx.doc.line(x1, y1, x2, y2);
}

function textoLegenda(d: DadosOrganogramaDesenho): string {
  const conteudo = [
    'a sigla (ou o nome) da unidade',
    'o tipo',
    ...(d.exibirQuantidadeServidores ? ['a quantidade de servidores lotados na própria unidade'] : []),
    ...(d.exibirNomesServidores ? ['em itálico, o responsável ou, sem responsável, o primeiro lotado (+N: demais lotados)'] : []),
  ];
  const ultimo = conteudo.pop();
  const porTipo = new Map<string, number>();
  for (const u of d.unidades) porTipo.set(u.tipo, (porTipo.get(u.tipo) ?? 0) + 1);
  const tipos = [...porTipo].map(([t, q]) => `${t} (${q})`).join(', ');
  return `Legenda: cada caixa traz ${conteudo.length ? `${conteudo.join(', ')} e ${ultimo}` : ultimo}. Tipos: ${tipos}.`;
}

/**
 * Organograma desenhado. A unidade do topo fica centralizada; cada unidade subordinada a ela abre uma
 * pilha em coluna com as suas subordinadas recuadas por nível (linhas ligando cada uma à superior).
 * Pilha que não cabe continua na coluna seguinte, com "(continuação de …)"; colunas que não cabem na
 * largura vão para a página seguinte, repetindo o topo. Cores: só a da marca e os neutros do motor.
 */
const diagrama =
  (d: DadosOrganogramaDesenho): Bloco =>
  (ctx) => {
    const { doc } = ctx;
    const tamDetalhe = ctx.fonte.rotulo - 1;
    if (d.unidades.length === 0) {
      paragrafo({ texto: 'Nenhuma unidade cadastrada.' })(ctx);
      return;
    }

    const n = Math.max(1, Math.floor((ctx.largura + ENTRE_COLUNAS) / (LARGURA_MINIMA_COLUNA + ENTRE_COLUNAS)));
    const wCol = (ctx.largura - ENTRE_COLUNAS * (n - 1)) / n;
    const arvore = arvoreOrganograma(d.unidades);
    // Um topo só: ele fica em cima e as subordinadas dele viram as colunas. Vários topos: cada um é uma coluna.
    const raiz = arvore.length === 1 && arvore[0].filhos.length > 0 ? arvore[0] : null;
    const itens = raiz ? raiz.filhos : arvore;
    const caixaRaiz = raiz ? medirCaixa(ctx, raiz.unidade, wCol, d) : null;
    const alturaTopo = caixaRaiz ? caixaRaiz.altura + 2 * BARRAMENTO : 0;
    const hContinuacao = alturaLinha(tamDetalhe) + 1;

    // Legenda em letra miúda logo acima do desenho (no fim, iria sozinha para outra página).
    if (d.exibirLegenda) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(tamDetalhe);
      usarTexto(doc, NEUTROS.textoSuave);
      for (const l of quebrarEmLinhas(doc, textoLegenda(d), ctx.largura)) {
        ctx.garantirEspaco(alturaLinha(tamDetalhe));
        doc.text(l, ctx.esquerda, ctx.y + ptParaMm(tamDetalhe));
        ctx.y += alturaLinha(tamDetalhe);
      }
      ctx.y += ESPACO.sm;
    }
    ctx.garantirEspaco(alturaTopo + 30);
    const y0 = ctx.y;
    const topoDemais = PAGINA.margemTopo + ALTURA_CABECALHO.demais;
    const topoColunas = (p: number): number => (p === 0 ? y0 : topoDemais) + alturaTopo;
    const capacidade = (p: number): number => ctx.limiteInferior - topoColunas(p);

    // 1) Linhas de cada pilha, já medidas na largura do seu nível.
    const linhas: Linha[] = [];
    const achatar = (no: No, prof: number, pai: number | null): Linha[] => {
      const l: Linha = { id: linhas.length, no, prof, pai, caixa: medirCaixa(ctx, no.unidade, wCol - ESPINHA - recuo(prof), d) };
      linhas.push(l);
      return [l, ...no.filhos.flatMap((f) => achatar(f, prof + 1, l.id))];
    };

    // 2) Distribui em colunas e páginas.
    const paginas: Coluna[][] = [[]];
    let coluna: Coluna = { itens: [] };
    let usado = 0;
    const fechar = (): void => {
      paginas[paginas.length - 1].push(coluna);
      if (paginas[paginas.length - 1].length === n) paginas.push([]);
      coluna = { itens: [] };
      usado = 0;
    };
    for (const item of itens) {
      const pilha = achatar(item, 0, null);
      const alturaPilha = pilha.reduce((s, l) => s + l.caixa.altura + ENTRE_CAIXAS, 0);
      // Pilha que cabe inteira numa coluna nova não é partida.
      if (usado > 0 && usado + alturaPilha > capacidade(paginas.length - 1) && alturaPilha <= capacidade(1)) fechar();
      let colocados = 0;
      for (const l of pilha) {
        if (usado > 0 && usado + l.caixa.altura > capacidade(paginas.length - 1)) {
          fechar();
          // Só é continuação se parte da pilha já ficou na coluna anterior.
          if (colocados > 0) {
            coluna.continuacao = rotuloUnidade(item.unidade);
            usado = hContinuacao;
          }
        }
        coluna.itens.push({ linha: l, y: usado });
        usado += l.caixa.altura + ENTRE_CAIXAS;
        colocados++;
      }
    }
    if (coluna.itens.length) fechar();
    if (paginas[paginas.length - 1].length === 0) paginas.pop();

    // 3) Desenha.
    const posicao = new Map<number, { pagina: number; coluna: number; y: number; altura: number }>();
    let fundo = y0;
    paginas.forEach((colunas, p) => {
      if (p > 0) ctx.novaPagina();
      const yTopo = p === 0 ? y0 : ctx.y;
      const yColunas = yTopo + alturaTopo;
      const larguraTotal = colunas.length * wCol + (colunas.length - 1) * ENTRE_COLUNAS;
      const xCol = (i: number): number => ctx.esquerda + (ctx.largura - larguraTotal) / 2 + i * (wCol + ENTRE_COLUNAS);
      fundo = yColunas;

      if (raiz && caixaRaiz) {
        const xRaiz = ctx.esquerda + (ctx.largura - wCol) / 2;
        desenharCaixa(ctx, caixaRaiz, xRaiz, yTopo, wCol, true);
        const yBarra = yTopo + caixaRaiz.altura + BARRAMENTO;
        const centro = xRaiz + wCol / 2;
        linha(ctx, centro, yTopo + caixaRaiz.altura, centro, yBarra);
        const espinhas = colunas.map((_, i) => xCol(i) + 1);
        linha(ctx, Math.min(centro, ...espinhas), yBarra, Math.max(centro, ...espinhas), yBarra);
        colunas.forEach((c, i) => {
          const topos = c.itens.filter((it) => it.linha.prof === 0);
          const ultimo = topos[topos.length - 1];
          const ate = ultimo ? yColunas + ultimo.y + ultimo.linha.caixa.altura / 2 : yColunas;
          linha(ctx, espinhas[i], yBarra, espinhas[i], ate);
        });
      }

      colunas.forEach((c, i) => {
        if (c.continuacao) {
          doc.setFont('helvetica', 'italic');
          doc.setFontSize(tamDetalhe);
          usarTexto(doc, NEUTROS.textoSuave);
          doc.text(cortarEmUmaLinha(doc, `(continuação de ${c.continuacao})`, wCol), xCol(i), yColunas + ptParaMm(tamDetalhe));
        }
        for (const { linha: l, y } of c.itens) {
          const x = xCol(i) + ESPINHA + recuo(l.prof);
          const yAbs = yColunas + y;
          desenharCaixa(ctx, l.caixa, x, yAbs, wCol - ESPINHA - recuo(l.prof), false);
          posicao.set(l.id, { pagina: p, coluna: i, y: yAbs, altura: l.caixa.altura });
          const meio = yAbs + l.caixa.altura / 2;
          if (l.pai === null) {
            if (raiz) linha(ctx, xCol(i) + 1, meio, x, meio);
          } else {
            const pai = posicao.get(l.pai);
            const espinha = xCol(i) + ESPINHA + recuo(l.prof - 1) + 1.5;
            const desde = pai && pai.pagina === p && pai.coluna === i ? pai.y + pai.altura : yColunas + (c.continuacao ? hContinuacao - 0.5 : 0);
            linha(ctx, espinha, desde, espinha, meio);
            linha(ctx, espinha, meio, x, meio);
          }
          fundo = Math.max(fundo, yAbs + l.caixa.altura);
        }
      });
    });
    ctx.y = fundo + ESPACO.md;
  };

/** Organograma desenhado (caixas e ligações), em paisagem. */
export const organogramaDesenho: DocumentoModelo<DadosOrganogramaDesenho> = {
  tipo: 'organograma-desenho',
  familia: 'relatorio',
  orientacao: 'paisagem',
  titulo: (d) => d.titulo || 'Organograma institucional',
  // Totais logo abaixo do título: o desenho ocupa a página inteira.
  subtitulo: (d) => [d.subtitulo, `Total: ${d.unidades.length} unidades | ${totalServidores(d.unidades)} servidores`].filter(Boolean).join(' · '),
  nomeArquivo: () => `organograma-${dataDoArquivo()}.pdf`,
  blocos: (d) => [diagrama(d)],
};
