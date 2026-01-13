/**
 * Gerador de XML eSocial - Versão S-1.3 (v_S_01_03_00)
 * Conforme schemas XSD oficiais
 */

// Constantes de versão e namespaces
export const ESOCIAL_VERSION = "S_01_03_00";
export const ESOCIAL_PROC_VERSION = "IDJUV_1.0.0";

export const ESOCIAL_NAMESPACES = {
  S1200: "http://www.esocial.gov.br/schema/evt/evtRemun/v_S_01_03_00",
  S1210: "http://www.esocial.gov.br/schema/evt/evtPgtos/v_S_01_03_00",
  S1299: "http://www.esocial.gov.br/schema/evt/evtFechaEvPer/v_S_01_03_00",
};

// Interfaces oficiais conforme XSD
export interface IdeEvento {
  indRetif: 1 | 2; // 1-Original, 2-Retificação
  nrRecibo?: string; // Obrigatório se retificação
  perApur: string; // YYYY-MM
  tpAmb: 1 | 2; // 1-Produção, 2-Homologação
  procEmi: 1 | 2 | 3; // 1-App empregador, 2-App gov, 3-App web
  verProc: string; // Versão do processo
}

export interface IdeEmpregador {
  tpInsc: 1 | 2; // 1-CNPJ, 2-CPF
  nrInsc: string; // 8 dígitos (raiz CNPJ) ou 11 (CPF)
}

export interface IdeTrabalhador {
  cpfTrab: string; // 11 dígitos
}

export interface DetVerbas {
  codRubr: string; // Código rubrica (até 30 chars)
  ideTabRubr: string; // ID tabela rubrica (até 8 chars)
  qtdRubr?: number; // Quantidade
  fatorRubr?: number; // Fator multiplicador
  vrUnit?: number; // Valor unitário
  vrRubr: number; // Valor da rubrica
  indApurIR?: 0 | 1; // 0-Normal, 1-Isentada
}

export interface IdeEstabLot {
  tpInsc: 1 | 2;
  nrInsc: string; // CNPJ completo 14 dígitos
  codLotacao: string; // Código lotação (até 30 chars)
  detVerbas: DetVerbas[];
}

export interface InfoPerApur {
  ideEstabLot: IdeEstabLot[];
}

export interface DmDev {
  ideDmDev: string; // ID demonstrativo (até 30 chars)
  codCateg: number; // Categoria do trabalhador
  infoPerApur?: InfoPerApur;
}

export interface EventoS1200Xml {
  ideEvento: IdeEvento;
  ideEmpregador: IdeEmpregador;
  ideTrabalhador: IdeTrabalhador;
  dmDev: DmDev[];
}

export interface InfoPgto {
  dtPgto: string; // YYYY-MM-DD
  tpPgto: 1 | 2 | 3 | 4 | 5 | 6; // Tipo pagamento
  perRef?: string; // Período referência YYYY-MM
  ideDmDev: string;
  vrLiq: number;
}

export interface IdeBenef {
  cpfBenef: string;
  infoPgto: InfoPgto[];
}

export interface EventoS1210Xml {
  ideEvento: IdeEvento;
  ideEmpregador: IdeEmpregador;
  ideBenef: IdeBenef;
}

export interface InfoFech {
  evtRemun: "S" | "N";
  evtPgtos: "S" | "N";
  evtAqProd: "S" | "N";
  evtComProd: "S" | "N";
  evtContratAvNP: "S" | "N";
  evtInfoComplPer: "S" | "N";
  compSemMovto?: string; // YYYY-MM (primeira competência sem movimento)
}

export interface EventoS1299Xml {
  ideEvento: Omit<IdeEvento, "indRetif" | "nrRecibo">;
  ideEmpregador: IdeEmpregador;
  infoFech: InfoFech;
}

// Utilitários de formatação
export function formatarDataXml(data: Date | string): string {
  const d = typeof data === "string" ? new Date(data) : data;
  return d.toISOString().split("T")[0]; // YYYY-MM-DD
}

export function formatarValorXml(valor: number): string {
  return valor.toFixed(2);
}

export function formatarPeriodo(ano: number, mes: number): string {
  return `${ano}-${mes.toString().padStart(2, "0")}`;
}

/**
 * Gerar ID do evento conforme padrão oficial (36 caracteres)
 * Formato: ID + tpInsc(1) + nrInsc(8-14) + AAAAMMDDHHMMSS + sequencial(5)
 */
export function gerarIdEventoOficial(
  tpInsc: 1 | 2,
  nrInsc: string,
  sequencial: number
): string {
  const now = new Date();
  const timestamp =
    now.getFullYear().toString() +
    (now.getMonth() + 1).toString().padStart(2, "0") +
    now.getDate().toString().padStart(2, "0") +
    now.getHours().toString().padStart(2, "0") +
    now.getMinutes().toString().padStart(2, "0") +
    now.getSeconds().toString().padStart(2, "0");

  const nrInscFormatado = nrInsc.replace(/\D/g, "").padStart(14, "0");
  const seqFormatado = sequencial.toString().padStart(5, "0");

  return `ID${tpInsc}${nrInscFormatado}${timestamp}${seqFormatado}`;
}

// Escape XML special characters
function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// Builder XML genérico
function buildXmlElement(name: string, value: any, indent: number = 0): string {
  const spaces = "  ".repeat(indent);

  if (value === null || value === undefined) {
    return "";
  }

  if (Array.isArray(value)) {
    return value.map((item) => buildXmlElement(name, item, indent)).join("\n");
  }

  if (typeof value === "object") {
    const children = Object.entries(value)
      .map(([key, val]) => buildXmlElement(key, val, indent + 1))
      .filter((x) => x)
      .join("\n");

    if (!children) return "";

    return `${spaces}<${name}>\n${children}\n${spaces}</${name}>`;
  }

  // Valor primitivo
  const strValue =
    typeof value === "number"
      ? Number.isInteger(value)
        ? value.toString()
        : value.toFixed(2)
      : escapeXml(String(value));

  return `${spaces}<${name}>${strValue}</${name}>`;
}

/**
 * Gerar XML do evento S-1200 (Remuneração do Trabalhador)
 */
export function gerarXmlS1200(
  evento: EventoS1200Xml,
  idEvento: string
): string {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<eSocial xmlns="${ESOCIAL_NAMESPACES.S1200}">
  <evtRemun Id="${idEvento}">
    <ideEvento>
      <indRetif>${evento.ideEvento.indRetif}</indRetif>${evento.ideEvento.nrRecibo ? `\n      <nrRecibo>${evento.ideEvento.nrRecibo}</nrRecibo>` : ""}
      <perApur>${evento.ideEvento.perApur}</perApur>
      <tpAmb>${evento.ideEvento.tpAmb}</tpAmb>
      <procEmi>${evento.ideEvento.procEmi}</procEmi>
      <verProc>${escapeXml(evento.ideEvento.verProc)}</verProc>
    </ideEvento>
    <ideEmpregador>
      <tpInsc>${evento.ideEmpregador.tpInsc}</tpInsc>
      <nrInsc>${evento.ideEmpregador.nrInsc}</nrInsc>
    </ideEmpregador>
    <ideTrabalhador>
      <cpfTrab>${evento.ideTrabalhador.cpfTrab}</cpfTrab>
    </ideTrabalhador>
${evento.dmDev.map((dm) => gerarDmDevXml(dm, 2)).join("\n")}
  </evtRemun>
</eSocial>`;

  return xml;
}

function gerarDmDevXml(dmDev: DmDev, indent: number): string {
  const spaces = "  ".repeat(indent);
  let xml = `${spaces}<dmDev>
${spaces}  <ideDmDev>${dmDev.ideDmDev}</ideDmDev>
${spaces}  <codCateg>${dmDev.codCateg}</codCateg>`;

  if (dmDev.infoPerApur) {
    xml += `\n${spaces}  <infoPerApur>`;
    for (const estabLot of dmDev.infoPerApur.ideEstabLot) {
      xml += `\n${spaces}    <ideEstabLot>
${spaces}      <tpInsc>${estabLot.tpInsc}</tpInsc>
${spaces}      <nrInsc>${estabLot.nrInsc}</nrInsc>
${spaces}      <codLotacao>${escapeXml(estabLot.codLotacao)}</codLotacao>`;

      for (const verba of estabLot.detVerbas) {
        xml += `\n${spaces}      <detVerbas>
${spaces}        <codRubr>${escapeXml(verba.codRubr)}</codRubr>
${spaces}        <ideTabRubr>${escapeXml(verba.ideTabRubr)}</ideTabRubr>`;

        if (verba.qtdRubr !== undefined) {
          xml += `\n${spaces}        <qtdRubr>${verba.qtdRubr.toFixed(2)}</qtdRubr>`;
        }
        if (verba.fatorRubr !== undefined) {
          xml += `\n${spaces}        <fatorRubr>${verba.fatorRubr.toFixed(2)}</fatorRubr>`;
        }
        if (verba.vrUnit !== undefined) {
          xml += `\n${spaces}        <vrUnit>${verba.vrUnit.toFixed(2)}</vrUnit>`;
        }

        xml += `\n${spaces}        <vrRubr>${verba.vrRubr.toFixed(2)}</vrRubr>`;

        if (verba.indApurIR !== undefined) {
          xml += `\n${spaces}        <indApurIR>${verba.indApurIR}</indApurIR>`;
        }

        xml += `\n${spaces}      </detVerbas>`;
      }

      xml += `\n${spaces}    </ideEstabLot>`;
    }
    xml += `\n${spaces}  </infoPerApur>`;
  }

  xml += `\n${spaces}</dmDev>`;
  return xml;
}

/**
 * Gerar XML do evento S-1210 (Pagamentos de Rendimentos)
 */
export function gerarXmlS1210(
  evento: EventoS1210Xml,
  idEvento: string
): string {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<eSocial xmlns="${ESOCIAL_NAMESPACES.S1210}">
  <evtPgtos Id="${idEvento}">
    <ideEvento>
      <indRetif>${evento.ideEvento.indRetif}</indRetif>${evento.ideEvento.nrRecibo ? `\n      <nrRecibo>${evento.ideEvento.nrRecibo}</nrRecibo>` : ""}
      <perApur>${evento.ideEvento.perApur}</perApur>
      <tpAmb>${evento.ideEvento.tpAmb}</tpAmb>
      <procEmi>${evento.ideEvento.procEmi}</procEmi>
      <verProc>${escapeXml(evento.ideEvento.verProc)}</verProc>
    </ideEvento>
    <ideEmpregador>
      <tpInsc>${evento.ideEmpregador.tpInsc}</tpInsc>
      <nrInsc>${evento.ideEmpregador.nrInsc}</nrInsc>
    </ideEmpregador>
    <ideBenef>
      <cpfBenef>${evento.ideBenef.cpfBenef}</cpfBenef>
${evento.ideBenef.infoPgto.map((pgto) => gerarInfoPgtoXml(pgto, 3)).join("\n")}
    </ideBenef>
  </evtPgtos>
</eSocial>`;

  return xml;
}

function gerarInfoPgtoXml(infoPgto: InfoPgto, indent: number): string {
  const spaces = "  ".repeat(indent);
  let xml = `${spaces}<infoPgto>
${spaces}  <dtPgto>${infoPgto.dtPgto}</dtPgto>
${spaces}  <tpPgto>${infoPgto.tpPgto}</tpPgto>`;

  if (infoPgto.perRef) {
    xml += `\n${spaces}  <perRef>${infoPgto.perRef}</perRef>`;
  }

  xml += `\n${spaces}  <ideDmDev>${infoPgto.ideDmDev}</ideDmDev>
${spaces}  <vrLiq>${infoPgto.vrLiq.toFixed(2)}</vrLiq>
${spaces}</infoPgto>`;

  return xml;
}

/**
 * Gerar XML do evento S-1299 (Fechamento de Eventos Periódicos)
 */
export function gerarXmlS1299(
  evento: EventoS1299Xml,
  idEvento: string
): string {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<eSocial xmlns="${ESOCIAL_NAMESPACES.S1299}">
  <evtFechaEvPer Id="${idEvento}">
    <ideEvento>
      <perApur>${evento.ideEvento.perApur}</perApur>
      <tpAmb>${evento.ideEvento.tpAmb}</tpAmb>
      <procEmi>${evento.ideEvento.procEmi}</procEmi>
      <verProc>${escapeXml(evento.ideEvento.verProc)}</verProc>
    </ideEvento>
    <ideEmpregador>
      <tpInsc>${evento.ideEmpregador.tpInsc}</tpInsc>
      <nrInsc>${evento.ideEmpregador.nrInsc}</nrInsc>
    </ideEmpregador>
    <infoFech>
      <evtRemun>${evento.infoFech.evtRemun}</evtRemun>
      <evtPgtos>${evento.infoFech.evtPgtos}</evtPgtos>
      <evtAqProd>${evento.infoFech.evtAqProd}</evtAqProd>
      <evtComProd>${evento.infoFech.evtComProd}</evtComProd>
      <evtContratAvNP>${evento.infoFech.evtContratAvNP}</evtContratAvNP>
      <evtInfoComplPer>${evento.infoFech.evtInfoComplPer}</evtInfoComplPer>${evento.infoFech.compSemMovto ? `\n      <compSemMovto>${evento.infoFech.compSemMovto}</compSemMovto>` : ""}
    </infoFech>
  </evtFechaEvPer>
</eSocial>`;

  return xml;
}

/**
 * Mapear tipo de rubrica interno para código eSocial
 */
export function mapearTipoRubrica(
  tipo: string
): { tpRubr: 1 | 2 | 3; natRubr?: number } {
  switch (tipo.toLowerCase()) {
    case "provento":
    case "vencimento":
      return { tpRubr: 1 }; // Vencimento, provento ou pensão
    case "desconto":
      return { tpRubr: 2 }; // Desconto
    case "informativa":
    case "informativo":
      return { tpRubr: 3 }; // Informativa
    default:
      return { tpRubr: 1 };
  }
}

/**
 * Códigos de rubrica padrão eSocial
 */
export const RUBRICAS_ESOCIAL = {
  VENCIMENTO_BASE: { codRubr: "VENC001", ideTabRubr: "01", natRubr: 1000 },
  ADICIONAL_TEMPO_SERVICO: { codRubr: "ATS001", ideTabRubr: "01", natRubr: 1002 },
  GRATIFICACAO: { codRubr: "GRAT001", ideTabRubr: "01", natRubr: 1010 },
  FERIAS: { codRubr: "FER001", ideTabRubr: "01", natRubr: 1020 },
  DECIMO_TERCEIRO: { codRubr: "13SAL01", ideTabRubr: "01", natRubr: 1030 },
  INSS: { codRubr: "INSS001", ideTabRubr: "01", natRubr: 9201 },
  IRRF: { codRubr: "IRRF001", ideTabRubr: "01", natRubr: 9301 },
  PENSAO_ALIMENTICIA: { codRubr: "PENS001", ideTabRubr: "01", natRubr: 9205 },
  CONSIGNACAO: { codRubr: "CONS001", ideTabRubr: "01", natRubr: 9220 },
};

/**
 * Função auxiliar para criar DetVerbas a partir de item da ficha financeira
 */
export function criarDetVerbas(
  codigoRubrica: string,
  descricao: string,
  tipo: string,
  valor: number,
  idTabela: string = "01"
): DetVerbas {
  // Tentar identificar rubrica padrão
  const descricaoUpper = descricao.toUpperCase();
  let codRubr = codigoRubrica || "RBR001";
  let ideTabRubr = idTabela;

  if (descricaoUpper.includes("INSS") || descricaoUpper.includes("PREVIDENCIA")) {
    codRubr = RUBRICAS_ESOCIAL.INSS.codRubr;
  } else if (descricaoUpper.includes("IRRF") || descricaoUpper.includes("IMPOSTO DE RENDA")) {
    codRubr = RUBRICAS_ESOCIAL.IRRF.codRubr;
  } else if (descricaoUpper.includes("VENCIMENTO") || descricaoUpper.includes("SALARIO BASE")) {
    codRubr = RUBRICAS_ESOCIAL.VENCIMENTO_BASE.codRubr;
  } else if (descricaoUpper.includes("GRATIFICA")) {
    codRubr = RUBRICAS_ESOCIAL.GRATIFICACAO.codRubr;
  } else if (descricaoUpper.includes("FERIAS")) {
    codRubr = RUBRICAS_ESOCIAL.FERIAS.codRubr;
  } else if (descricaoUpper.includes("13") || descricaoUpper.includes("DECIMO")) {
    codRubr = RUBRICAS_ESOCIAL.DECIMO_TERCEIRO.codRubr;
  }

  return {
    codRubr: codRubr.substring(0, 30), // Máximo 30 caracteres
    ideTabRubr: ideTabRubr.substring(0, 8), // Máximo 8 caracteres
    vrRubr: Math.abs(valor),
  };
}

/**
 * Download de arquivo XML
 */
export function downloadXml(xml: string, nomeArquivo: string): void {
  const blob = new Blob([xml], { type: "application/xml" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nomeArquivo.endsWith(".xml") ? nomeArquivo : `${nomeArquivo}.xml`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Validar estrutura XML básica
 */
export function validarXmlBasico(xml: string): { valido: boolean; erros: string[] } {
  const erros: string[] = [];

  // Verificar declaração XML
  if (!xml.startsWith('<?xml version="1.0"')) {
    erros.push("Declaração XML ausente ou inválida");
  }

  // Verificar namespace eSocial
  if (!xml.includes("http://www.esocial.gov.br/schema/evt/")) {
    erros.push("Namespace eSocial não encontrado");
  }

  // Verificar tag raiz eSocial
  if (!xml.includes("<eSocial")) {
    erros.push("Tag raiz <eSocial> não encontrada");
  }

  // Verificar fechamento de tags básicas
  if (!xml.includes("</eSocial>")) {
    erros.push("Tag de fechamento </eSocial> não encontrada");
  }

  // Verificar atributo Id
  if (!xml.includes(' Id="ID')) {
    erros.push("Atributo Id do evento não encontrado");
  }

  return {
    valido: erros.length === 0,
    erros,
  };
}
