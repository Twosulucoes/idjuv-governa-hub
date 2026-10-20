import type { FichaContracheque, RubricaContracheque } from '../modelos/folha/contracheque';

/** Contracheque com muitas rubricas típicas (8 proventos + 7 descontos). Dados fictícios. */
const PROVENTOS: RubricaContracheque[] = [
  { codigo: '001', descricao: 'Vencimento Base', tipo: 'provento', referencia: 30, valor: 6500 },
  { codigo: '010', descricao: 'Gratificação de Representação de Gabinete', tipo: 'provento', referencia: 100, valor: 2600 },
  { codigo: '012', descricao: 'Adicional por Tempo de Serviço', tipo: 'provento', referencia: 10, valor: 650 },
  { codigo: '015', descricao: 'Gratificação de Função', tipo: 'provento', valor: 1200 },
  { codigo: '020', descricao: 'Auxílio Alimentação', tipo: 'provento', valor: 800 },
  { codigo: '021', descricao: 'Auxílio Transporte', tipo: 'provento', valor: 220.5 },
  { codigo: '030', descricao: 'Horas Extras 50%', tipo: 'provento', referencia: 8.5, valor: 375.12 },
  { codigo: '031', descricao: 'Adicional Noturno', tipo: 'provento', referencia: 20, valor: 180 },
];
const DESCONTOS: RubricaContracheque[] = [
  { codigo: '101', descricao: 'INSS', tipo: 'desconto', referencia: 14, valor: 908.86 },
  { codigo: '102', descricao: 'IRRF', tipo: 'desconto', referencia: 27.5, valor: 1702.33 },
  { codigo: '110', descricao: 'Pensão Alimentícia', tipo: 'desconto', referencia: 15, valor: 975 },
  { codigo: '120', descricao: 'Empréstimo Consignado Banco Exemplo', tipo: 'desconto', valor: 640.4 },
  { codigo: '130', descricao: 'Plano de Saúde', tipo: 'desconto', valor: 310 },
  { codigo: '140', descricao: 'Contribuição Associativa', tipo: 'desconto', valor: 45 },
  { codigo: '150', descricao: 'Faltas Injustificadas', tipo: 'desconto', referencia: 1, valor: 216.67 },
];

const soma = (rs: RubricaContracheque[]) => Math.round(rs.reduce((s, r) => s + r.valor, 0) * 100) / 100;

export function fichaCompleta(n = 1): FichaContracheque {
  const total_proventos = soma(PROVENTOS);
  const total_descontos = soma(DESCONTOS);
  return {
    id: `ficha-${n}`,
    servidor_id: `servidor-${n}`,
    cargo_nome: 'Assessor Técnico de Planejamento',
    unidade_nome: 'Divisão de Gestão de Pessoas',
    total_proventos,
    total_descontos,
    valor_liquido: Math.round((total_proventos - total_descontos) * 100) / 100,
    base_inss: 7835.45,
    valor_inss: 908.86,
    base_irrf: 9000.13,
    valor_irrf: 1702.33,
    quantidade_dependentes: 2,
    rubricas: [...PROVENTOS, ...DESCONTOS],
    servidor: {
      nome_completo: n === 1 ? 'Maria de Exemplo Souza' : `Servidor Exemplo ${n}`,
      cpf: '12345678901',
      matricula: `MAT-00${n}`,
      pis_pasep: '123.45678.90-1',
    },
  };
}

/** Ficha sem rubricas detalhadas nem servidor: força o caminho de "vencimento base / INSS / IRRF" e os vazios. */
export const fichaMinima: FichaContracheque = {
  id: 'ficha-min',
  servidor_id: '',
  total_proventos: 3000,
  total_descontos: 420,
  valor_liquido: 2580,
  valor_inss: 330,
  valor_irrf: 90,
};
