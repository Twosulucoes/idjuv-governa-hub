import type jsPDF from "jspdf";

import {
  generatePortariaNomeacao,
  generatePortariaExoneracao,
  generatePortariaDesignacao,
} from "@/lib/pdfPortarias";

type MinimalPortaria = {
  numero: string;
  data_documento: string;
  ementa?: string | null;
  categoria?: string | null;
};

type MinimalServidor = {
  nome_completo: string;
  cpf: string;
  matricula?: string | null;
};

type MinimalCargo = {
  nome: string;
  sigla?: string | null;
  simbolo?: string | null;
};

type MinimalUnidade = {
  nome: string;
  sigla?: string | null;
};

function sanitizeFilename(input: string) {
  return input
    .replace(/[\\/:*?\"<>|]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

export function buildPortariaPdfDoc(params: {
  portaria: MinimalPortaria;
  servidor: MinimalServidor;
  cargo: MinimalCargo;
  unidade: MinimalUnidade;
  // Campos extras para designação (opcional)
  unidadeOrigem?: MinimalUnidade;
  unidadeDestino?: MinimalUnidade;
  dataInicio?: string;
  dataFim?: string;
}): jsPDF {
  const { portaria, servidor, cargo, unidade } = params;

  switch (portaria.categoria) {
    case "nomeacao":
      return generatePortariaNomeacao(
        {
          numero: portaria.numero,
          data_documento: portaria.data_documento,
          ementa: portaria.ementa ?? undefined,
        },
        {
          nome_completo: servidor.nome_completo,
          cpf: servidor.cpf,
          matricula: servidor.matricula ?? undefined,
        },
        {
          nome: cargo.nome,
          sigla: cargo.sigla ?? undefined,
          simbolo: cargo.simbolo ?? undefined,
        },
        {
          nome: unidade.nome,
          sigla: unidade.sigla ?? undefined,
        }
      );

    case "exoneracao":
      return generatePortariaExoneracao(
        {
          numero: portaria.numero,
          data_documento: portaria.data_documento,
          ementa: portaria.ementa ?? undefined,
        },
        {
          nome_completo: servidor.nome_completo,
          cpf: servidor.cpf,
          matricula: servidor.matricula ?? undefined,
        },
        {
          nome: cargo.nome,
          sigla: cargo.sigla ?? undefined,
          simbolo: cargo.simbolo ?? undefined,
        },
        {
          nome: unidade.nome,
          sigla: unidade.sigla ?? undefined,
        }
      );

    case "designacao":
      if (
        params.unidadeOrigem &&
        params.unidadeDestino &&
        params.dataInicio
      ) {
        return generatePortariaDesignacao(
          {
            numero: portaria.numero,
            data_documento: portaria.data_documento,
            ementa: portaria.ementa ?? undefined,
          },
          {
            nome_completo: servidor.nome_completo,
            cpf: servidor.cpf,
            matricula: servidor.matricula ?? undefined,
          },
          {
            nome: cargo.nome,
            sigla: cargo.sigla ?? undefined,
            simbolo: cargo.simbolo ?? undefined,
          },
          {
            nome: params.unidadeOrigem.nome,
            sigla: params.unidadeOrigem.sigla ?? undefined,
          },
          {
            nome: params.unidadeDestino.nome,
            sigla: params.unidadeDestino.sigla ?? undefined,
          },
          params.dataInicio,
          params.dataFim
        );
      }
      throw new Error("Dados insuficientes para gerar PDF de designação.");

    default:
      throw new Error("Categoria de portaria não suportada para PDF.");
  }
}

export function savePortariaPdf(doc: jsPDF, params: { numero: string; servidorNome?: string }) {
  const parts = [
    "Portaria",
    params.numero?.split("/").join("-") || "sem-numero",
    params.servidorNome ? sanitizeFilename(params.servidorNome) : null,
  ].filter(Boolean);

  doc.save(`${parts.join("_")}.pdf`);
}
