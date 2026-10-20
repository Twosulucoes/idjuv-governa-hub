/**
 * Créditos da remessa de pensão alimentícia: um por desconto de pensão da folha, pago ao beneficiário com o banco do
 * cadastro da pensão. O desconto é o item "Pensão alimentícia — <beneficiário>" que `folha_montar_ficha` lança na
 * ficha do servidor; o banco soma a remessa pela mesma regra (trigger `remessa_integridade`, migração
 * 20261020090000), e a tela confere os dois totais antes de entregar o arquivo.
 */

import { separarDigito, type DadosFavorecido } from "@/lib/cnabGenerator";

export const PREFIXO_ITEM_PENSAO = "Pensão alimentícia — ";

export interface FichaComPensao {
  id: string;
  servidor_id: string | null;
  itens: { id: string; descricao: string | null; tipo: string | null; valor: number | string | null }[] | null;
}

export interface PensaoCadastro {
  id: string;
  servidor_id: string | null;
  beneficiario_nome: string;
  beneficiario_cpf: string | null;
  banco_codigo: string | null;
  banco_agencia: string | null;
  banco_conta: string | null;
  banco_tipo_conta: string | null;
}

export interface CreditosPensao {
  favorecidos: DadosFavorecido[];
  /** Beneficiários com desconto na folha e sem banco, agência e conta no cadastro da pensão (ficam fora). */
  semBanco: string[];
  /** Descontos de pensão que não acham o cadastro (beneficiário renomeado ou pensão excluída): ficam fora. */
  semCadastro: string[];
  /** Mais de um cadastro do mesmo beneficiário no mesmo servidor: o banco somaria em dobro, então não gera. */
  duplicados: string[];
}

const temBanco = (p: PensaoCadastro) => !!(p.banco_codigo?.trim() && p.banco_agencia?.trim() && p.banco_conta?.trim());

export function creditosPensao(fichas: FichaComPensao[], pensoes: PensaoCadastro[], dataCredito: Date): CreditosPensao {
  const porChave = new Map<string, PensaoCadastro[]>();
  for (const p of pensoes) {
    if (!p.servidor_id) continue;
    const chave = `${p.servidor_id}|${PREFIXO_ITEM_PENSAO}${p.beneficiario_nome}`;
    porChave.set(chave, [...(porChave.get(chave) ?? []), p]);
  }

  const r: CreditosPensao = { favorecidos: [], semBanco: [], semCadastro: [], duplicados: [] };
  for (const f of fichas) {
    for (const i of f.itens ?? []) {
      const valor = Number(i.valor ?? 0);
      if (i.tipo !== "desconto" || !(valor > 0) || !i.descricao?.startsWith(PREFIXO_ITEM_PENSAO)) continue;
      const nome = i.descricao.slice(PREFIXO_ITEM_PENSAO.length);
      const cadastros = (porChave.get(`${f.servidor_id}|${i.descricao}`) ?? []).filter(temBanco);
      if (cadastros.length > 1) {
        r.duplicados.push(nome);
        continue;
      }
      const p = cadastros[0];
      if (!p) {
        (porChave.has(`${f.servidor_id}|${i.descricao}`) ? r.semBanco : r.semCadastro).push(nome);
        continue;
      }
      const ag = separarDigito(p.banco_agencia);
      const cc = separarDigito(p.banco_conta);
      r.favorecidos.push({
        nome: p.beneficiario_nome,
        cpf: p.beneficiario_cpf ?? "",
        banco: p.banco_codigo ?? "",
        agencia: ag.numero,
        agenciaDigito: ag.digito,
        conta: cc.numero,
        contaDigito: cc.digito,
        tipoConta: p.banco_tipo_conta === "poupanca" ? "CP" : "CC",
        valor,
        dataCredito,
        identificador: i.id.substring(0, 20),
      });
    }
  }
  return r;
}
