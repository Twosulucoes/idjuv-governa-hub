/**
 * LEITURA DE KML NO NAVEGADOR (DOMParser, sem dependências)
 *
 * Converte cada Placemark em { nome, ponto, poligono } com coordenadas
 * GeoJSON ([lon, lat]). Também oferece centróide de polígono e normalização
 * de nomes para casar placemarks com unidades cadastradas.
 */

import { semAcento } from "@/lib/texto";
import type {
  GeoJsonPolygon,
  PlacemarkKml,
  PoligonoGeoJson,
  PontoGeo,
  PosicaoGeoJson,
} from "@/types/inventarioCampo";

/** Descendentes por nome local, ignorando o namespace do KML. */
function descendentes(el: Element | Document, tag: string): Element[] {
  return Array.from(el.getElementsByTagNameNS("*", tag));
}

/** Primeiro filho direto com o nome local informado. */
function filhoDireto(el: Element, tag: string): Element | null {
  for (const filho of Array.from(el.children)) {
    if (filho.localName === tag) return filho;
  }
  return null;
}

/** "lon,lat[,alt] lon,lat[,alt] ..." → posições válidas (descarta 0,0 e fora de faixa). */
export function parseCoordenadas(texto: string | null | undefined): PosicaoGeoJson[] {
  if (!texto) return [];
  const posicoes: PosicaoGeoJson[] = [];
  for (const tupla of texto.trim().split(/\s+/)) {
    if (!tupla) continue;
    const [lonTxt, latTxt] = tupla.split(",");
    const lon = Number(lonTxt);
    const lat = Number(latTxt);
    if (!Number.isFinite(lon) || !Number.isFinite(lat)) continue;
    if (lon === 0 && lat === 0) continue;
    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) continue;
    posicoes.push([lon, lat]);
  }
  return posicoes;
}

function fecharAnel(anel: PosicaoGeoJson[]): PosicaoGeoJson[] {
  if (anel.length === 0) return anel;
  const [primeiro, ultimo] = [anel[0], anel[anel.length - 1]];
  if (primeiro[0] !== ultimo[0] || primeiro[1] !== ultimo[1]) {
    return [...anel, [primeiro[0], primeiro[1]]];
  }
  return anel;
}

function lerAnel(boundary: Element | null): PosicaoGeoJson[] | null {
  if (!boundary) return null;
  const coords = descendentes(boundary, "coordinates")[0];
  const anel = fecharAnel(parseCoordenadas(coords?.textContent));
  // Anel linear válido: no mínimo 4 posições (3 vértices + fechamento)
  return anel.length >= 4 ? anel : null;
}

function lerPoligono(poligono: Element): GeoJsonPolygon | null {
  const externo = lerAnel(filhoDireto(poligono, "outerBoundaryIs"));
  if (!externo) return null;
  const internos = Array.from(poligono.children)
    .filter((c) => c.localName === "innerBoundaryIs")
    .map((c) => lerAnel(c))
    .filter((a): a is PosicaoGeoJson[] => !!a);
  return { type: "Polygon", coordinates: [externo, ...internos] };
}

/**
 * Lê o texto de um arquivo KML. Lança erro se o XML for inválido.
 * Placemarks sem ponto nem polígono válidos são descartados.
 */
export function parseKml(texto: string): PlacemarkKml[] {
  const doc = new DOMParser().parseFromString(texto, "application/xml");
  if (doc.getElementsByTagName("parsererror").length > 0) {
    throw new Error("Arquivo KML inválido.");
  }

  const resultado: PlacemarkKml[] = [];
  descendentes(doc, "Placemark").forEach((pm, indice) => {
    const nome = (filhoDireto(pm, "name")?.textContent || "").trim() || `Sem nome ${indice + 1}`;

    // Ponto: pode estar direto no Placemark ou dentro de MultiGeometry
    let ponto: PontoGeo | null = null;
    for (const p of descendentes(pm, "Point")) {
      const [pos] = parseCoordenadas(descendentes(p, "coordinates")[0]?.textContent);
      if (pos) {
        ponto = { lon: pos[0], lat: pos[1] };
        break;
      }
    }

    const poligonos = descendentes(pm, "Polygon")
      .map(lerPoligono)
      .filter((p): p is GeoJsonPolygon => !!p);
    const poligono: PoligonoGeoJson | null =
      poligonos.length === 0
        ? null
        : poligonos.length === 1
          ? poligonos[0]
          : { type: "MultiPolygon", coordinates: poligonos.map((p) => p.coordinates) };

    if (ponto || poligono) resultado.push({ nome, ponto, poligono });
  });
  return resultado;
}

// ========== CENTRÓIDE ==========

/** Centróide ponderado por área (fórmula do polígono); usa a média dos vértices se a área for nula. */
function centroideAnel(anel: PosicaoGeoJson[]): { x: number; y: number; area: number } {
  let area2 = 0;
  let cx = 0;
  let cy = 0;
  for (let i = 0; i < anel.length - 1; i++) {
    const [x0, y0] = anel[i];
    const [x1, y1] = anel[i + 1];
    const f = x0 * y1 - x1 * y0;
    area2 += f;
    cx += (x0 + x1) * f;
    cy += (y0 + y1) * f;
  }
  if (Math.abs(area2) < 1e-14) {
    const n = Math.max(anel.length, 1);
    return {
      x: anel.reduce((s, p) => s + p[0], 0) / n,
      y: anel.reduce((s, p) => s + p[1], 0) / n,
      area: 0,
    };
  }
  return { x: cx / (3 * area2), y: cy / (3 * area2), area: Math.abs(area2 / 2) };
}

/** Centróide (lat/lon) do anel externo de um Polygon ou MultiPolygon. */
export function centroide(poligono: PoligonoGeoJson): PontoGeo | null {
  const aneis: PosicaoGeoJson[][] =
    poligono.type === "Polygon"
      ? [poligono.coordinates[0]]
      : poligono.coordinates.map((p) => p[0]);
  const partes = aneis.filter((a) => a && a.length > 0).map(centroideAnel);
  if (partes.length === 0) return null;
  const areaTotal = partes.reduce((s, p) => s + p.area, 0);
  if (areaTotal === 0) {
    return {
      lon: partes.reduce((s, p) => s + p.x, 0) / partes.length,
      lat: partes.reduce((s, p) => s + p.y, 0) / partes.length,
    };
  }
  return {
    lon: partes.reduce((s, p) => s + p.x * p.area, 0) / areaTotal,
    lat: partes.reduce((s, p) => s + p.y * p.area, 0) / areaTotal,
  };
}

// ========== CASAMENTO DE NOMES ==========

/** Palavras genéricas que não ajudam a distinguir uma unidade de outra. */
const PALAVRAS_COMUNS = new Set([
  "a", "o", "as", "os", "de", "da", "do", "das", "dos", "e", "em", "na", "no",
  "ginasio", "poliesportivo", "poliesportiva", "estadio", "quadra", "complexo",
  "esportivo", "esportiva", "centro", "praca", "parque", "vila", "olimpica", "olimpico",
  "municipal", "estadual", "unidade",
]);

/** Remove acentos, caixa, pontuação e palavras genéricas. */
export function normalizarNome(nome: string | null | undefined): string {
  if (!nome) return "";
  const base = semAcento(nome)
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
  const tokens = base.split(" ").filter((t) => t && !PALAVRAS_COMUNS.has(t));
  // Se só sobrarem palavras genéricas, mantém o nome base para não perder a informação
  return (tokens.length > 0 ? tokens.join(" ") : base).trim();
}

/**
 * Sugere o item cujo nome mais se parece com `nome`: igualdade após
 * normalização, depois inclusão, depois sobreposição de palavras (≥ 60%).
 */
export function sugerirCorrespondencia<T>(
  nome: string,
  itens: T[],
  obterNome: (item: T) => string | null | undefined,
): T | null {
  const alvo = normalizarNome(nome);
  if (!alvo) return null;
  const normalizados = itens.map((item) => ({ item, n: normalizarNome(obterNome(item)) }));

  const igual = normalizados.find((x) => x.n && x.n === alvo);
  if (igual) return igual.item;

  const contem = normalizados.find((x) => x.n && x.n.length >= 4 && (x.n.includes(alvo) || alvo.includes(x.n)));
  if (contem) return contem.item;

  const tokensAlvo = new Set(alvo.split(" "));
  let melhor: { item: T; pontuacao: number } | null = null;
  for (const x of normalizados) {
    if (!x.n) continue;
    const tokens = new Set(x.n.split(" "));
    const comuns = [...tokens].filter((t) => tokensAlvo.has(t)).length;
    const pontuacao = comuns / Math.max(tokens.size, tokensAlvo.size);
    if (pontuacao >= 0.6 && (!melhor || pontuacao > melhor.pontuacao)) {
      melhor = { item: x.item, pontuacao };
    }
  }
  return melhor?.item ?? null;
}
