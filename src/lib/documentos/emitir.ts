import type jsPDF from 'jspdf';
import { getTenantSnapshot, logoEntidadeSuperior, logoOrgao, nomeDoSistema } from '@/core/tenant';
import { renderizarDocumento } from './core/renderizar';
import { carregarLogo } from './logos';
import { marcaDoTenant } from './marca';
import { REGISTRO, type DadosDe, type TipoDocumento } from './registro';
import type { DocumentoModelo } from './tipos';

export interface DocumentoEmitido {
  doc: jsPDF;
  blob: Blob;
  nomeArquivo: string;
}

/** Ponto único de entrada das telas: tipo + dados → PDF com a identidade do tenant. */
export async function emitirDocumento<T extends TipoDocumento>(
  tipo: T,
  dados: DadosDe<T>,
  opcoes: { emitidoPor?: string } = {},
): Promise<DocumentoEmitido> {
  const tenant = getTenantSnapshot();
  const [logoDoOrgao, logoDaEntidade] = await Promise.all([
    carregarLogo(logoOrgao('claro')),
    carregarLogo(logoEntidadeSuperior('claro')),
  ]);
  const marca = marcaDoTenant(tenant, {
    nomeSistema: nomeDoSistema(tenant),
    logoOrgao: logoDoOrgao,
    logoEntidadeSuperior: logoDaEntidade,
  });
  const modelo = REGISTRO[tipo] as unknown as DocumentoModelo<DadosDe<T>>;
  const { doc, nomeArquivo } = renderizarDocumento(modelo, dados, marca, { emitidoPor: opcoes.emitidoPor, emitidoEm: new Date() });
  return { doc, blob: doc.output('blob'), nomeArquivo };
}

export function baixarDocumento(d: DocumentoEmitido): void {
  d.doc.save(d.nomeArquivo);
}
