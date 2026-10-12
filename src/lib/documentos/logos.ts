import type { LogoImpressao } from './tipos';

const cache = new Map<string, LogoImpressao>();

/** Carrega a imagem como PNG em data URL. Nunca lança: sem logo o documento sai sem logo (e avisa no console). */
export async function carregarLogo(src: string | undefined): Promise<LogoImpressao | undefined> {
  if (!src) return undefined;
  const guardado = cache.get(src);
  if (guardado) return guardado;
  try {
    const logo = await new Promise<LogoImpressao>((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const c2d = canvas.getContext('2d');
        if (!c2d) return reject(new Error('canvas indisponível'));
        c2d.drawImage(img, 0, 0);
        resolve({ dataUrl: canvas.toDataURL('image/png'), largura: img.naturalWidth, altura: img.naturalHeight, formato: 'PNG' });
      };
      img.onerror = () => reject(new Error('imagem não carregou'));
      img.src = src;
    });
    cache.set(src, logo);
    return logo;
  } catch (e) {
    console.warn('[documentos] logo não carregado; o documento sai sem ele', e);
    return undefined;
  }
}
