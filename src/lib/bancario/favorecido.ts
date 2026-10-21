/**
 * Cadastro do favorecido (tabela `fornecedores`) usado pela remessa OBN600.
 *
 * As regras de agência e conta são as mesmas que `registrar_remessa_obn600` aplica no servidor: agência com até 4
 * dígitos e conta com até 9, o dígito verificador depois do hífen ("1234-5", "1111-X"). Validar aqui evita
 * descobrir o erro só na hora de gerar a remessa.
 */

import { isValidCNPJ, isValidCPF } from "@/lib/formatters";

const digitos = (v: string) => v.replace(/\D/g, "");

/** PF para 11 dígitos, PJ para 14; outro tamanho, null. */
export function tipoPessoaDoDocumento(documento: string): "PF" | "PJ" | null {
  const d = digitos(documento);
  if (d.length === 11) return "PF";
  if (d.length === 14) return "PJ";
  return null;
}

export function documentoValido(documento: string): boolean {
  const tipo = tipoPessoaDoDocumento(documento);
  if (tipo === "PF") return isValidCPF(documento);
  if (tipo === "PJ") return isValidCNPJ(documento);
  return false;
}

/** CPF "000.000.000-00" ou CNPJ "00.000.000/0000-00"; o resto volta só com os dígitos. */
export function formatarDocumento(documento: string): string {
  const d = digitos(documento);
  if (d.length === 11) return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  if (d.length === 14) return d.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
  return d;
}

/** Máscara enquanto digita: até 11 dígitos como CPF, acima disso como CNPJ. */
export function mascararDocumento(valor: string): string {
  const d = digitos(valor).slice(0, 14);
  if (d.length <= 11) {
    return d
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  }
  return d
    .replace(/(\d{2})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1/$2")
    .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
}

const limpar = (v: string) => v.replace(/[\s.]/g, "");

/** Agência como o servidor aceita: "1234" ou "1234-5" (ou "-X"). */
export const agenciaValida = (agencia: string) => /^\d{1,4}(-[0-9Xx])?$/.test(limpar(agencia));

/** Conta como o servidor aceita: até 9 dígitos, DV depois do hífen; só zeros não vale. */
export const contaValida = (conta: string) => {
  const c = limpar(conta);
  return /^\d{1,9}(-[0-9Xx])?$/.test(c) && !/^0+(-|$)/.test(c);
};

/** Agência e conta gravadas sem espaço nem ponto e com o DV em maiúscula. */
export const normalizarAgenciaConta = (v: string) => limpar(v).toUpperCase();
