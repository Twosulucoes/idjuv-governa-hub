// Entradas no formato dos geradores antigos (src/lib/pdfPortarias.ts). Dados fictícios.
const servidor = { nome_completo: 'Maria de Souza Lima', cpf: '12345678901', matricula: '000123' };
const cargo = { nome: 'Assessor Técnico', sigla: 'AT', simbolo: 'CC-3' };
const unidade = { nome: 'Divisão de Projetos', sigla: 'DIPRO' };
const portaria = { numero: '12/2026', data_documento: '2026-10-05' };

const listaServidores = Array.from({ length: 40 }, (_, i) => ({
  nome_completo: `Servidor de Teste ${i + 1}`,
  cpf: String(10000000000 + i),
  matricula: `M${i + 1}`,
  cargo: i % 3 === 0 ? 'Assessor Técnico' : 'Coordenador de Área',
  codigo: `CC-${(i % 5) + 1}`,
  unidade_nome: i % 7 === 0 ? undefined : `Unidade ${(i % 4) + 1}`,
}));

export const entradasLegado = {
  nomeacao: { portaria, servidor, cargo, unidade },
  exoneracao: { portaria, servidor, cargo, unidade, motivo: 'pedido' as const },
  designacao: {
    portaria, servidor, cargo,
    unidadeOrigem: { nome: 'Divisão de Projetos' },
    unidadeDestino: { nome: 'Gabinete da Presidência' },
    dataInicio: '2026-10-06', dataFim: '2026-12-31',
  },
  coletiva: {
    portaria,
    cabecalho: 'O PRESIDENTE DO ÓRGÃO DE TESTE, no uso das atribuições legais que lhe são conferidas, RESOLVE:',
    servidores: listaServidores,
    tipoAcao: 'nomeacao' as const,
  },
  unificada: {
    portaria,
    preambulo: 'O PRESIDENTE DO ÓRGÃO DE TESTE, no uso das atribuições legais que lhe são conferidas, e demais normas aplicáveis,',
    artigos: [
      { id: 'a1', numero: '1º', conteudo: 'DESIGNAR os servidores abaixo relacionados para compor a comissão de teste:' },
      { id: 'a2', numero: '2º', conteudo: 'A comissão funcionará pelo prazo de 90 (noventa) dias.' },
      { id: 'a3', numero: '3º', conteudo: 'Esta Portaria entra em vigor na data de sua publicação.' },
    ],
    servidores: listaServidores.slice(0, 12).map((s) => ({ ...s, observacao: 'ver ofício' })),
    configTabela: {
      habilitada: true,
      colunas: ['numero', 'nome_completo', 'cpf', 'cargo', 'unidade_setor'] as const,
      colunasPersonalizadas: [{ id: 'observacao', titulo: 'Observação', tipo: 'texto' as const }],
    },
    assinatura: { nome: 'FULANO DE TESTE', cargo: 'Presidente\ndo Órgão de Teste', local: 'Cidade de Teste' },
  },
};
