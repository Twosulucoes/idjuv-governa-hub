import type { CategoriaPortaria, Portaria, StatusPortaria } from '@/types/portaria';

/** Portarias fictícias (nada real) para os testes e amostras do relatório de portarias. */
const STATUS: StatusPortaria[] = ['publicado', 'vigente', 'minuta', 'aguardando_publicacao', 'revogado'];
const CATEGORIAS: CategoriaPortaria[] = ['nomeacao', 'exoneracao', 'designacao', 'ferias', 'licenca'];

export function portariasFicticias(n: number): Portaria[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `p${i + 1}`,
    numero: `${String(i + 1).padStart(3, '0')}/2026`,
    titulo: `Portaria de exemplo número ${i + 1} com título comprido para testar a quebra de linha`,
    tipo: 'portaria' as const,
    status: STATUS[i % STATUS.length],
    categoria: i % 7 === 6 ? undefined : CATEGORIAS[i % CATEGORIAS.length],
    data_documento: `2026-${String((i % 3) + 8).padStart(2, '0')}-${String((i % 27) + 1).padStart(2, '0')}`,
    ementa: `Ementa fictícia ${i + 1}: dispõe sobre assunto administrativo de exemplo, sem relação com dados reais.`,
    servidores_ids: Array.from({ length: (i % 3) + 1 }, (_, k) => `s${k}`),
    unidade:
      i % 4 === 3
        ? undefined
        : { id: `u${i % 2}`, nome: i % 2 ? 'Diretoria de Exemplo' : 'Coordenação Fictícia', sigla: i % 2 ? 'DIREX' : 'COFIC' },
    cargo: { id: 'c1', nome: 'Cargo de Exemplo', sigla: 'CEX-1' },
    doe_numero: i % 2 ? `DOE ${4000 + i}` : undefined,
    doe_data: i % 2 ? '2026-10-05' : undefined,
  }));
}
