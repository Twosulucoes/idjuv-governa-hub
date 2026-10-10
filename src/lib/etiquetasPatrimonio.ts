/**
 * Etiquetas de patrimônio com QR Code.
 *
 * O QR carrega `codigo_qr` (igual ao número de tombamento gerado pelo banco) ou,
 * na falta dele, o próprio número. A leitura no app de campo resolve o código no
 * servidor (RPC `patrimonio_buscar_bem_por_codigo`).
 *
 * O nome da instituição vem do tenant ativo — nunca escrito aqui.
 */

import QRCode from "qrcode";
import { getTenantSnapshotOuNulo } from "@/core/tenant";

export interface BemEtiqueta {
  numero_patrimonio: string;
  descricao: string;
  codigo_qr?: string | null;
}

/** Escapa texto para inserção segura em HTML (conteúdo e atributos). */
function escaparHtml(valor: string | null | undefined): string {
  return String(valor ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Gera o QR Code (PNG em data URL) para exibir em tela ou imprimir. */
export async function gerarQrDataUrl(conteudo: string): Promise<string> {
  return QRCode.toDataURL(conteudo, {
    errorCorrectionLevel: "M",
    margin: 1,
    width: 256,
  });
}

/** Nome curto da instituição para o cabeçalho da etiqueta. */
function nomeInstituicao(): string {
  const tenant = getTenantSnapshotOuNulo();
  return tenant?.identidade.sigla || tenant?.identidade.nomeCurto || "";
}

/**
 * Abre uma janela de impressão com uma etiqueta por bem (QR + número + descrição).
 * Lança erro se o navegador bloquear a janela (pop-up).
 */
export async function imprimirEtiquetas(bens: BemEtiqueta[]): Promise<void> {
  if (bens.length === 0) return;

  // Abre a janela antes do trabalho assíncrono para não perder o gesto do usuário
  // (bloqueadores de pop-up recusam janelas abertas depois de um await).
  const janela = window.open("", "_blank", "width=480,height=640");
  if (!janela) {
    throw new Error("O navegador bloqueou a janela de impressão. Permita pop-ups para este site.");
  }

  const instituicao = escaparHtml(nomeInstituicao());
  const etiquetas = await Promise.all(
    bens.map(async (bem) => {
      const conteudo = (bem.codigo_qr || bem.numero_patrimonio || "").trim();
      const qr = conteudo ? await gerarQrDataUrl(conteudo) : "";
      return `
        <div class="etiqueta">
          ${instituicao ? `<div class="instituicao">${instituicao} - PATRIMÔNIO</div>` : `<div class="instituicao">PATRIMÔNIO</div>`}
          ${qr ? `<img class="qr" src="${escaparHtml(qr)}" alt="QR Code" />` : ""}
          <div class="numero">${escaparHtml(bem.numero_patrimonio)}</div>
          <div class="descricao">${escaparHtml(bem.descricao)}</div>
        </div>`;
    }),
  );

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<title>Etiquetas de patrimônio</title>
<style>
  * { box-sizing: border-box; }
  body { margin: 0; padding: 8px; font-family: Arial, Helvetica, sans-serif; color: #000; background: #fff; }
  .etiqueta {
    width: 62mm; padding: 3mm; margin: 0 auto 4mm; border: 1px solid #000;
    text-align: center; page-break-inside: avoid; break-inside: avoid;
  }
  .instituicao { font-size: 8pt; font-weight: bold; margin-bottom: 1mm; }
  .qr { width: 30mm; height: 30mm; display: block; margin: 0 auto; }
  .numero { font-size: 13pt; font-weight: bold; font-family: "Courier New", monospace; margin-top: 1mm; }
  .descricao { font-size: 7pt; margin-top: 1mm; overflow: hidden; max-height: 3em; }
  @media print {
    body { padding: 0; }
    .etiqueta { margin: 0 auto 2mm; }
  }
</style>
</head>
<body>
${etiquetas.join("\n")}
<script>
  window.onload = function () { window.focus(); window.print(); };
</script>
</body>
</html>`;

  janela.document.open();
  janela.document.write(html);
  janela.document.close();
}
