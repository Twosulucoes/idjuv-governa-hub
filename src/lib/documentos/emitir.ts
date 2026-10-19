import type jsPDF from 'jspdf';
import { getTenantSnapshot, logoEntidadeSuperior, logoOrgao, nomeDoSistema, type TenantConfig } from '@/core/tenant';
import { renderizarDocumento } from './core/renderizar';
import { carregarLogo } from './logos';
import { estiloDoTenant, marcaDoTenant } from './marca';
import { REGISTRO, type DadosDe, type TipoDocumento } from './registro';
import type { DocumentoModelo } from './tipos';

export interface DocumentoEmitido {
  doc: jsPDF;
  blob: Blob;
  nomeArquivo: string;
}

/**
 * Ponto único de entrada das telas: tipo + dados → PDF com a identidade e a padronização do tenant.
 * `tenant` só para pré-visualizar uma configuração ainda não salva; o normal é o perfil efetivo.
 */
export async function emitirDocumento<T extends TipoDocumento>(
  tipo: T,
  dados: DadosDe<T>,
  opcoes: { emitidoPor?: string; tenant?: TenantConfig } = {},
): Promise<DocumentoEmitido> {
  const tenant = opcoes.tenant ?? getTenantSnapshot();
  // Logos ainda vêm dos arquivos da instalação (não são configuráveis no banco), mesmo com `opcoes.tenant`.
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
  const { doc, nomeArquivo } = renderizarDocumento(
    modelo,
    dados,
    marca,
    { emitidoPor: opcoes.emitidoPor, emitidoEm: new Date() },
    estiloDoTenant(tenant),
  );
  return { doc, blob: doc.output('blob'), nomeArquivo };
}

export function baixarDocumento(d: DocumentoEmitido): void {
  d.doc.save(d.nomeArquivo);
}
