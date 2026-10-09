/**
 * TIPOS: INVENTÁRIO DE CAMPO (fase 1)
 * Vistoria de unidades, fotos de evidência georreferenciadas e mapa.
 *
 * As tabelas `campanhas_inventario_unidades` e `fotos_vistoria_inventario`
 * (e as colunas de geometria de `unidades_locais`) ainda não estão em
 * `src/integrations/supabase/types.ts` (gerado); por isso os tipos ficam aqui.
 */

// ========== SITUAÇÃO DA UNIDADE NA CAMPANHA ==========

export type SituacaoUnidadeCampanha =
  | "a_visitar"
  | "em_vistoria"
  | "concluida"
  | "com_pendencia"
  | "excluida";

export const SITUACOES_UNIDADE: SituacaoUnidadeCampanha[] = [
  "a_visitar",
  "em_vistoria",
  "concluida",
  "com_pendencia",
  "excluida",
];

interface SituacaoConfig {
  label: string;
  /** Classes do Badge (tokens do tema) */
  badge: string;
  /** Classes de texto para contadores */
  texto: string;
  /** Classes aplicadas ao caminho SVG do marcador no mapa (sobrepõem a cor padrão) */
  classeMapa: string;
  /** Cor de reserva do marcador (usada se as classes não forem aplicadas) */
  corMapa: string;
}

export const SITUACAO_UNIDADE_CONFIG: Record<SituacaoUnidadeCampanha, SituacaoConfig> = {
  a_visitar: {
    label: "A visitar",
    badge: "bg-muted text-muted-foreground",
    texto: "text-muted-foreground",
    classeMapa: "stroke-muted-foreground fill-muted-foreground",
    corMapa: "#64748b",
  },
  em_vistoria: {
    label: "Em vistoria",
    badge: "bg-info/10 text-info",
    texto: "text-info",
    classeMapa: "stroke-info fill-info",
    corMapa: "#0ea5e9",
  },
  concluida: {
    label: "Concluída",
    badge: "bg-success/10 text-success",
    texto: "text-success",
    classeMapa: "stroke-success fill-success",
    corMapa: "#16a34a",
  },
  com_pendencia: {
    label: "Com pendência",
    badge: "bg-warning/10 text-warning",
    texto: "text-warning",
    classeMapa: "stroke-warning fill-warning",
    corMapa: "#f59e0b",
  },
  excluida: {
    label: "Excluída",
    badge: "bg-destructive/10 text-destructive",
    texto: "text-destructive",
    classeMapa: "stroke-destructive fill-destructive",
    corMapa: "#dc2626",
  },
};

// ========== GEOMETRIA ==========

export type FonteGeometria = "manual" | "gps" | "kml";

/** Posição GeoJSON: [longitude, latitude] */
export type PosicaoGeoJson = [number, number];

export interface GeoJsonPolygon {
  type: "Polygon";
  coordinates: PosicaoGeoJson[][];
}

export interface GeoJsonMultiPolygon {
  type: "MultiPolygon";
  coordinates: PosicaoGeoJson[][][];
}

export type PoligonoGeoJson = GeoJsonPolygon | GeoJsonMultiPolygon;

export interface PontoGeo {
  lat: number;
  lon: number;
}

// ========== UNIDADES DA CAMPANHA ==========

export interface UnidadeLocalGeo {
  id: string;
  codigo_unidade: string | null;
  nome_unidade: string;
  municipio: string | null;
  tipo_unidade: string | null;
  endereco_completo: string | null;
  latitude: number | null;
  longitude: number | null;
  poligono_geojson: PoligonoGeoJson | null;
  area_construida_m2: number | null;
}

export interface UnidadeCampanha {
  id: string;
  campanha_id: string;
  unidade_local_id: string;
  situacao: SituacaoUnidadeCampanha;
  equipe: string | null;
  data_prevista: string | null;
  iniciada_em: string | null;
  concluida_em: string | null;
  observacao: string | null;
  created_at: string;
  updated_at: string | null;
  unidade: UnidadeLocalGeo | null;
}

// ========== FOTOS DE VISTORIA ==========

export type MimeFotoVistoria = "image/jpeg" | "image/webp";

export interface FotoVistoria {
  id: string;
  campanha_id: string;
  unidade_local_id: string;
  bem_id: string | null;
  codigo_objeto: string | null;
  legenda: string | null;
  storage_path: string;
  hash_sha256: string;
  latitude: number | null;
  longitude: number | null;
  precisao_m: number | null;
  capturada_em: string;
  enviada_em: string | null;
  mime_type: MimeFotoVistoria;
  tamanho_bytes: number | null;
  tem_pessoa: boolean;
  usuario_id: string | null;
  /** URL assinada de curta duração (bucket privado) */
  url_assinada: string | null;
}

/** Foto guardada no IndexedDB aguardando envio */
export interface FotoPendente {
  id: string;
  campanha_id: string;
  unidade_local_id: string;
  codigo_objeto: string | null;
  legenda: string | null;
  hash_sha256: string;
  latitude: number | null;
  longitude: number | null;
  precisao_m: number | null;
  capturada_em: string;
  mime_type: MimeFotoVistoria;
  tamanho_bytes: number;
  tem_pessoa: boolean;
  dispositivo_info: Record<string, string | number | boolean | null>;
  /** Usuário logado no momento da captura; só ele envia a foto */
  usuario_id: string | null;
  blob: Blob;
  tentativas: number;
  ultimo_erro: string | null;
}

// ========== GPS ==========

export interface PosicaoGps {
  lat: number;
  lon: number;
  /** Precisão em metros */
  precisao: number;
  /** ISO 8601 do momento da leitura */
  em: string;
}

/** Precisão (m) acima da qual a leitura do GPS é considerada ruim */
export const PRECISAO_GPS_LIMITE_M = 30;

/** Idade (s) acima da qual a leitura do GPS é considerada desatualizada */
export const IDADE_MAXIMA_GPS_S = 60;

// ========== KML ==========

export interface PlacemarkKml {
  nome: string;
  ponto: PontoGeo | null;
  /** Polygon, ou MultiPolygon quando o placemark tem vários polígonos */
  poligono: PoligonoGeoJson | null;
}

// ========== STORAGE ==========

export const BUCKET_EVIDENCIAS_INVENTARIO = "inventario-evidencias";

export function caminhoFotoVistoria(campanhaId: string, unidadeLocalId: string, fotoId: string): string {
  return `${campanhaId}/${unidadeLocalId}/${fotoId}.jpg`;
}
