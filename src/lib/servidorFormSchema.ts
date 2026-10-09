import { z } from "zod";
import { isValidCPF } from "@/lib/formatters";
import { validarPIS } from "@/lib/folhaCalculos";
import { REGRAS_TIPO_SERVIDOR, type TipoServidor } from "@/types/servidor";

/**
 * Validação do formulário de servidor (ServidorFormPage).
 *
 * O formulário tem ~100 campos em `useState`; em vez de migrar tudo para
 * react-hook-form, o schema cobre só os campos com regra de negócio e deixa
 * os demais passarem (`passthrough`). A página chama `validarServidorForm`
 * no submit e mostra a primeira mensagem de cada campo.
 */

const somenteDigitos = (valor: string) => valor.replace(/\D/g, "");

/** Texto opcional: vazio passa; preenchido precisa satisfazer `teste`. */
const opcional = (teste: (valor: string) => boolean, mensagem: string) =>
  z.string().refine((v) => v.trim() === "" || teste(v), mensagem);

const emailValido = (v: string) => z.string().email().safeParse(v.trim()).success;

const dataNaoFutura = (v: string) => /^\d{4}-\d{2}-\d{2}$/.test(v) && v <= new Date().toISOString().slice(0, 10);

const anoRazoavel = (v: string) => {
  const ano = Number(v);
  return Number.isInteger(ano) && ano >= 1900 && ano <= new Date().getFullYear() + 1;
};

const campos = {
  nome_completo: z.string().trim().min(3, "Informe o nome completo"),
    cpf: z.string().refine((v) => isValidCPF(v), "CPF inválido"),
    pis_pasep: opcional((v) => validarPIS(v), "PIS/PASEP inválido"),
    email_pessoal: opcional(emailValido, "E-mail pessoal inválido"),
    email_institucional: opcional(emailValido, "E-mail institucional inválido"),
    data_nascimento: opcional(dataNaoFutura, "Data de nascimento não pode ser futura"),
    endereco_cep: opcional((v) => somenteDigitos(v).length === 8, "CEP deve ter 8 dígitos"),
    carga_horaria: opcional((v) => {
      const horas = Number(v);
      return Number.isInteger(horas) && horas > 0 && horas <= 60;
    }, "Carga horária deve ser um número inteiro entre 1 e 60"),
    ano_conclusao: opcional(anoRazoavel, "Ano de conclusão inválido"),
    // Vínculo funcional (regras em superRefine, pois dependem do tipo)
    tipo_servidor: z.string(),
    cargo_atual_id: z.string(),
    unidade_atual_id: z.string(),
    data_admissao: z.string(),
};

// `passthrough` deixa passar os demais campos do formulário sem validá-los.
const camposServidorSchema = z.object(campos).passthrough();

export type CampoServidorForm = keyof typeof campos;
export type ServidorFormCampos = Record<CampoServidorForm, string>;
export type ErrosServidorForm = Partial<Record<CampoServidorForm, string>>;

/** Aba do formulário em que cada campo validado aparece (para focar a aba do erro); `null` = fora das abas. */
export const ABA_DO_CAMPO: Record<CampoServidorForm, string | null> = {
  nome_completo: "pessoal",
  data_nascimento: "pessoal",
  email_pessoal: "pessoal",
  email_institucional: "pessoal",
  tipo_servidor: "vinculo",
  cargo_atual_id: "vinculo",
  unidade_atual_id: "vinculo",
  data_admissao: "vinculo",
  cpf: "documentos",
  pis_pasep: "documentos",
  endereco_cep: "endereco",
  ano_conclusao: "formacao",
  carga_horaria: null,
};

/**
 * Valida os campos do formulário. `exigirVinculo` liga as regras do vínculo
 * funcional (tipo, unidade, data e cargo quando o tipo permite cargo) — usado no
 * cadastro novo, que cria o vínculo inicial; na edição o vínculo é gerido à parte.
 */
export function validarServidorForm(
  dados: ServidorFormCampos,
  { exigirVinculo }: { exigirVinculo: boolean },
): { ok: boolean; erros: ErrosServidorForm; primeiroCampo: CampoServidorForm | null } {
  const schema = camposServidorSchema.superRefine((d, ctx) => {
    if (!exigirVinculo) return;
    if (!d.tipo_servidor) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["tipo_servidor"], message: "Selecione o tipo de servidor" });
    }
    if (!d.unidade_atual_id) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["unidade_atual_id"], message: "Selecione a unidade de lotação" });
    }
    if (!d.data_admissao) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["data_admissao"], message: "Informe a data de admissão" });
    }
    const regras = d.tipo_servidor ? REGRAS_TIPO_SERVIDOR[d.tipo_servidor as TipoServidor] : undefined;
    if (regras?.permiteCargo && !d.cargo_atual_id) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["cargo_atual_id"], message: "Selecione o cargo" });
    }
  });

  const resultado = schema.safeParse(dados);
  if (resultado.success) return { ok: true, erros: {}, primeiroCampo: null };

  const erros: ErrosServidorForm = {};
  for (const issue of resultado.error.issues) {
    const campo = issue.path[0] as CampoServidorForm | undefined;
    if (campo && !erros[campo]) erros[campo] = issue.message;
  }
  const primeiroCampo = resultado.error.issues[0].path[0] as CampoServidorForm;
  return { ok: false, erros, primeiroCampo };
}
