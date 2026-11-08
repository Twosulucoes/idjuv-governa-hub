/**
 * PARSER: "Consultar Credor" do FIPLAN → pares código do credor × CPF, para a RPC `importar_credores_fiplan`
 *
 * Função pura (sem arquivo nem banco), testada em credoresFiplanParser.test.ts. O relatório traz o título
 * ("Consulta Credor"), os critérios e o cabeçalho ("Código do credor", "Nome do credor", "Tipo de cadastro",
 * "CPF/CNPJ"…). O Excel tem limite de linhas por aba, então o cadastro vem em mais de uma aba, cada uma com o próprio
 * cabeçalho: o parser reconhece o cabeçalho de novo a cada aba. Só interessam as pessoas físicas com CPF válido; o
 * resto (empresas, inscrições genéricas) é contado e deixado de fora.
 *
 * Por que existe: o FIP 002 (diárias) traz só o código do credor (2026017934) e o nome; o CPF deste relatório é que
 * liga o código ao servidor do RH (achado F9 do teste do Financeiro de 06/11/2026).
 */

import { isValidCPF } from "@/lib/formatters";
import { normalizarCabecalho, paraTexto } from "../planilha";
import type { ProblemaLeitura, ResultadoLeitura } from "../types";

/** Linha no formato do contrato front ↔ RPC (mais a linha da planilha, para as mensagens). */
export interface LinhaCredorFiplan {
  indice: number;
  /** Só dígitos: 2026.01793-4 → 2026017934 (o FIP 002 traz assim) */
  credor_codigo: string;
  credor_nome: string;
  /** Só dígitos */
  cpf: string;
  linhaPlanilha: number;
}

const PESSOA_FISICA = "pessoa_fisica";

/** CPF para mostrar na conferência sem expor o número inteiro: ***.444.777-** */
export function mascararCpf(cpf: string): string {
  const d = cpf.replace(/\D/g, "");
  return d.length === 11 ? `***.${d.slice(3, 6)}.${d.slice(6, 9)}-**` : "***";
}

export function interpretarCredoresFiplan(linhas: unknown[][]): ResultadoLeitura<LinhaCredorFiplan> {
  const problemas: ProblemaLeitura[] = [];
  const saida: LinhaCredorFiplan[] = [];
  const vistos = new Set<string>();
  let colunas: { codigo: number; nome: number; tipo: number; cpf: number } | null = null;
  let achouCabecalho = false;
  let credores = 0;
  let outros = 0;
  let semCpf = 0;

  linhas.forEach((celulas, i) => {
    const t = celulas.map(paraTexto);
    const n = t.map(normalizarCabecalho);
    // Cabeçalho (repete a cada aba)
    if (n.includes("codigo_do_credor") && n.includes("cpf_cnpj")) {
      colunas = {
        codigo: n.indexOf("codigo_do_credor"),
        nome: n.indexOf("nome_do_credor"),
        tipo: n.indexOf("tipo_de_cadastro"),
        cpf: n.indexOf("cpf_cnpj"),
      };
      achouCabecalho = true;
      return;
    }
    if (!colunas) return;
    const c = colunas as { codigo: number; nome: number; tipo: number; cpf: number };
    const codigo = (t[c.codigo] ?? "").replace(/\D/g, "");
    if (!codigo) return;  // título da aba seguinte, critérios, linha vazia
    credores++;
    if (c.tipo >= 0 && normalizarCabecalho(t[c.tipo] ?? "") !== PESSOA_FISICA) {
      outros++;
      return;
    }
    const linhaPlanilha = i + 1;
    if (codigo.length !== 10) {
      problemas.push({ gravidade: "aviso", mensagem: `Linha ${linhaPlanilha}: código do credor "${t[c.codigo]}" fora do padrão, ignorado.` });
      return;
    }
    const cpf = (t[c.cpf] ?? "").replace(/\D/g, "");
    if (cpf.length !== 11 || !isValidCPF(cpf)) {
      semCpf++;
      return;
    }
    if (vistos.has(codigo)) {
      problemas.push({ gravidade: "aviso", mensagem: `Linha ${linhaPlanilha}: credor ${t[c.codigo]} repetido no arquivo, fica o primeiro.` });
      return;
    }
    vistos.add(codigo);
    saida.push({
      indice: saida.length,
      credor_codigo: codigo,
      credor_nome: (c.nome >= 0 ? t[c.nome] : "") || "",
      cpf,
      linhaPlanilha,
    });
  });

  if (!achouCabecalho) {
    return {
      linhas: [],
      problemas: [
        {
          gravidade: "erro",
          mensagem: 'Este arquivo não é o "Consultar Credor" do FIPLAN (não achei o cabeçalho com "Código do credor" e "CPF/CNPJ").',
        },
      ],
      cabecalho: {},
      parametros: {},
    };
  }
  if (saida.length === 0) {
    problemas.push({ gravidade: "erro", mensagem: "O relatório não tem nenhuma pessoa física com CPF válido." });
  }

  return {
    linhas: saida,
    problemas,
    cabecalho: {
      "Credores no arquivo": String(credores),
      "Pessoas físicas com CPF": String(saida.length),
      ...(outros + semCpf > 0 ? { "Fora (empresas, inscrições genéricas ou sem CPF)": String(outros + semCpf) } : {}),
    },
    parametros: {},
  };
}

/** Linha no formato que a RPC recebe (sem a linha da planilha). */
export function paraContratoCredor({ linhaPlanilha: _linha, ...resto }: LinhaCredorFiplan) {
  return resto;
}
