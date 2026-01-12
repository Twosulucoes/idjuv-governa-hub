/**
 * Gerador de Eventos eSocial
 * Eventos Periódicos de Folha de Pagamento
 */

export interface DadosEmpregador {
  cnpj: string;
  razaoSocial: string;
  tpInsc: number; // 1 = CNPJ
  nrInsc: string;
}

export interface DadosTrabalhador {
  cpf: string;
  pis: string;
  nome: string;
  matricula: string;
  categoria: number; // 101 = Empregado Geral
}

export interface ItemRemuneracao {
  codigoRubrica: string;
  descricao: string;
  tipo: "provento" | "desconto" | "informativa";
  valor: number;
  tabela?: string;
}

export interface EventoS1200 {
  ideEvento: {
    indRetif: number; // 1 = Original, 2 = Retificação
    nrRecibo?: string; // Número recibo evento anterior (se retificação)
    perApur: string; // Período apuração (YYYY-MM)
    tpAmb: number; // 1 = Produção, 2 = Homologação
    procEmi: number; // 1 = Aplicativo do empregador
    verProc: string; // Versão do processo
  };
  ideEmpregador: DadosEmpregador;
  ideTrabalhador: {
    cpfTrab: string;
    nisTrab: string; // PIS/PASEP
  };
  dmDev: Array<{
    ideDmDev: string; // Identificador único do demonstrativo
    codCateg: number; // Categoria do trabalhador
    infoPerApur: {
      ideEstabLot: {
        tpInsc: number;
        nrInsc: string;
        codLotacao: string;
      };
      detVerbas: ItemRemuneracao[];
    };
  }>;
}

export interface EventoS1210 {
  ideEvento: {
    indRetif: number;
    nrRecibo?: string;
    perApur: string;
    tpAmb: number;
    procEmi: number;
    verProc: string;
  };
  ideEmpregador: DadosEmpregador;
  ideBenef: {
    cpfBenef: string;
    deps: {
      vrDedDep?: number; // Valor dedução dependentes
    };
  };
  infoPgto: Array<{
    dtPgto: string; // Data do pagamento (YYYY-MM-DD)
    tpPgto: number; // 1 = Pagamento de remuneração
    perRef: string; // Período de referência
    ideDmDev: string;
    vrLiq: number; // Valor líquido
  }>;
}

export interface EventoS1299 {
  ideEvento: {
    perApur: string;
    tpAmb: number;
    procEmi: number;
    verProc: string;
  };
  ideEmpregador: DadosEmpregador;
  infoFech: {
    evtRemun: "S" | "N"; // Possui eventos de remuneração
    evtPgtos: "S" | "N"; // Possui eventos de pagamentos
    evtAqProd: "S" | "N"; // Aquisição de produção rural
    evtComProd: "S" | "N"; // Comercialização de produção
    evtContratAvNP: "S" | "N"; // Contratação de avulsos não portuários
    evtInfoComplPer: "S" | "N"; // Informações complementares
    compSemMovto?: string; // Competência sem movimento
  };
}

// Mapear tipos de rubrica para eSocial
export function mapTipoRubricaESocial(tipo: string): number {
  switch (tipo) {
    case "provento":
      return 1; // Provento/Vencimento
    case "desconto":
      return 2; // Desconto
    case "informativa":
      return 3; // Informativa
    default:
      return 1;
  }
}

// Gerar ID único para evento
export function gerarIdEvento(
  tpInsc: number,
  nrInsc: string,
  anoMes: string,
  sequencial: number
): string {
  const timestamp = Date.now().toString().slice(-8);
  return `ID${tpInsc}${nrInsc.padStart(14, "0")}${anoMes.replace("-", "")}${sequencial.toString().padStart(5, "0")}${timestamp}`;
}

// Validar dados do trabalhador para eSocial
export function validarTrabalhadorESocial(trabalhador: DadosTrabalhador): string[] {
  const erros: string[] = [];

  if (!trabalhador.cpf || trabalhador.cpf.replace(/\D/g, "").length !== 11) {
    erros.push("CPF inválido");
  }

  if (!trabalhador.pis || trabalhador.pis.replace(/\D/g, "").length < 10) {
    erros.push("PIS/PASEP inválido ou ausente");
  }

  if (!trabalhador.nome || trabalhador.nome.length < 2) {
    erros.push("Nome inválido");
  }

  return erros;
}

// Gerar evento S-1200 (Remuneração do Trabalhador)
export function gerarEventoS1200(
  empregador: DadosEmpregador,
  trabalhador: DadosTrabalhador,
  itens: ItemRemuneracao[],
  competencia: string, // YYYY-MM
  sequencial: number,
  ambiente: "producao" | "homologacao" = "homologacao"
): EventoS1200 {
  const cpfLimpo = trabalhador.cpf.replace(/\D/g, "");
  const pisLimpo = trabalhador.pis.replace(/\D/g, "");
  const cnpjLimpo = empregador.cnpj.replace(/\D/g, "");

  return {
    ideEvento: {
      indRetif: 1,
      perApur: competencia,
      tpAmb: ambiente === "producao" ? 1 : 2,
      procEmi: 1,
      verProc: "1.0.0",
    },
    ideEmpregador: {
      cnpj: cnpjLimpo,
      razaoSocial: empregador.razaoSocial,
      tpInsc: 1,
      nrInsc: cnpjLimpo.substring(0, 8), // Raiz CNPJ
    },
    ideTrabalhador: {
      cpfTrab: cpfLimpo,
      nisTrab: pisLimpo,
    },
    dmDev: [
      {
        ideDmDev: sequencial.toString().padStart(3, "0"),
        codCateg: trabalhador.categoria || 101,
        infoPerApur: {
          ideEstabLot: {
            tpInsc: 1,
            nrInsc: cnpjLimpo,
            codLotacao: "001",
          },
          detVerbas: itens.map((item) => ({
            ...item,
          })),
        },
      },
    ],
  };
}

// Gerar evento S-1210 (Pagamentos)
export function gerarEventoS1210(
  empregador: DadosEmpregador,
  cpfBeneficiario: string,
  valorLiquido: number,
  dataPagamento: string, // YYYY-MM-DD
  competencia: string, // YYYY-MM
  idDemonstrativo: string,
  valorDeducaoDependentes?: number,
  ambiente: "producao" | "homologacao" = "homologacao"
): EventoS1210 {
  const cpfLimpo = cpfBeneficiario.replace(/\D/g, "");
  const cnpjLimpo = empregador.cnpj.replace(/\D/g, "");

  return {
    ideEvento: {
      indRetif: 1,
      perApur: competencia,
      tpAmb: ambiente === "producao" ? 1 : 2,
      procEmi: 1,
      verProc: "1.0.0",
    },
    ideEmpregador: {
      cnpj: cnpjLimpo,
      razaoSocial: empregador.razaoSocial,
      tpInsc: 1,
      nrInsc: cnpjLimpo.substring(0, 8),
    },
    ideBenef: {
      cpfBenef: cpfLimpo,
      deps: {
        vrDedDep: valorDeducaoDependentes,
      },
    },
    infoPgto: [
      {
        dtPgto: dataPagamento,
        tpPgto: 1,
        perRef: competencia,
        ideDmDev: idDemonstrativo,
        vrLiq: valorLiquido,
      },
    ],
  };
}

// Gerar evento S-1299 (Fechamento)
export function gerarEventoS1299(
  empregador: DadosEmpregador,
  competencia: string,
  temRemuneracao: boolean,
  temPagamentos: boolean,
  ambiente: "producao" | "homologacao" = "homologacao"
): EventoS1299 {
  const cnpjLimpo = empregador.cnpj.replace(/\D/g, "");

  return {
    ideEvento: {
      perApur: competencia,
      tpAmb: ambiente === "producao" ? 1 : 2,
      procEmi: 1,
      verProc: "1.0.0",
    },
    ideEmpregador: {
      cnpj: cnpjLimpo,
      razaoSocial: empregador.razaoSocial,
      tpInsc: 1,
      nrInsc: cnpjLimpo.substring(0, 8),
    },
    infoFech: {
      evtRemun: temRemuneracao ? "S" : "N",
      evtPgtos: temPagamentos ? "S" : "N",
      evtAqProd: "N",
      evtComProd: "N",
      evtContratAvNP: "N",
      evtInfoComplPer: "N",
    },
  };
}

// Converter evento para JSON formatado
export function eventoParaJSON(evento: any): string {
  return JSON.stringify(evento, null, 2);
}

// Converter evento para XML (estrutura básica)
export function eventoParaXML(evento: any, tipoEvento: string): string {
  const toXML = (obj: any, rootName: string): string => {
    let xml = `<${rootName}>`;

    for (const [key, value] of Object.entries(obj)) {
      if (value === null || value === undefined) continue;

      if (Array.isArray(value)) {
        for (const item of value) {
          xml += toXML(item, key);
        }
      } else if (typeof value === "object") {
        xml += toXML(value, key);
      } else {
        xml += `<${key}>${value}</${key}>`;
      }
    }

    xml += `</${rootName}>`;
    return xml;
  };

  const header = '<?xml version="1.0" encoding="UTF-8"?>';
  return header + toXML(evento, tipoEvento);
}
