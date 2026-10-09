/**
 * COMPONENTE: MAPA DAS UNIDADES DA CAMPANHA
 * Fundo de satélite (Esri World Imagery) ou ruas (OpenStreetMap), marcador por
 * unidade colorido pela situação e polígono quando houver.
 */

import { useEffect, useMemo } from "react";
import { CircleMarker, LayersControl, MapContainer, Polygon, TileLayer, Tooltip, useMap } from "react-leaflet";
import { latLngBounds, type LatLngExpression, type LatLngTuple } from "leaflet";
import "leaflet/dist/leaflet.css";
import { cn } from "@/lib/utils";
import {
  SITUACAO_UNIDADE_CONFIG,
  type PoligonoGeoJson,
  type UnidadeCampanha,
} from "@/types/inventarioCampo";

interface MapaUnidadesCampanhaProps {
  unidades: UnidadeCampanha[];
  selecionadaId: string | null;
  onSelecionar: (id: string) => void;
  className?: string;
}

/** Centro neutro (sem unidade com coordenada): visão ampla do país. */
const CENTRO_PADRAO: LatLngTuple = [-14.235, -51.925];
const ZOOM_PADRAO = 4;

function poligonoParaPosicoes(poligono: PoligonoGeoJson): LatLngExpression[][] | LatLngExpression[][][] {
  const anel = (a: [number, number][]): LatLngExpression[] => a.map(([lon, lat]) => [lat, lon] as LatLngTuple);
  if (poligono.type === "Polygon") return poligono.coordinates.map(anel);
  return poligono.coordinates.map((p) => p.map(anel));
}

/** Ajusta o enquadramento quando muda o conjunto de pontos (não a cada seleção). */
function AjustarEnquadramento({ pontos }: { pontos: LatLngTuple[] }) {
  const map = useMap();
  const chave = pontos.map((p) => `${p[0].toFixed(5)},${p[1].toFixed(5)}`).join("|");
  useEffect(() => {
    if (pontos.length === 0) return;
    if (pontos.length === 1) {
      map.setView(pontos[0], 16);
      return;
    }
    map.fitBounds(latLngBounds(pontos), { padding: [30, 30], maxZoom: 17 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chave, map]);
  return null;
}

export function MapaUnidadesCampanha({ unidades, selecionadaId, onSelecionar, className }: MapaUnidadesCampanhaProps) {
  const comCoordenada = useMemo(
    () =>
      unidades.filter(
        (u) => u.unidade && u.unidade.latitude !== null && u.unidade.longitude !== null,
      ),
    [unidades],
  );
  const pontos = useMemo<LatLngTuple[]>(
    () => comCoordenada.map((u) => [u.unidade!.latitude as number, u.unidade!.longitude as number]),
    [comCoordenada],
  );

  return (
    // `isolate` contém o z-index alto dos painéis do Leaflet (não cobre diálogos)
    <div className={cn("relative isolate overflow-hidden rounded-md border", className)}>
      <MapContainer center={CENTRO_PADRAO} zoom={ZOOM_PADRAO} scrollWheelZoom className="h-full w-full">
        <LayersControl position="topright">
          <LayersControl.BaseLayer checked name="Satélite">
            <TileLayer
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              attribution="Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community"
              maxZoom={19}
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Ruas">
            <TileLayer
              url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="&copy; OpenStreetMap contributors"
              maxZoom={19}
            />
          </LayersControl.BaseLayer>
        </LayersControl>

        {unidades.map((u) =>
          u.unidade?.poligono_geojson ? (
            <Polygon
              key={`pol-${u.id}-${u.situacao}`}
              positions={poligonoParaPosicoes(u.unidade.poligono_geojson)}
              pathOptions={{
                color: SITUACAO_UNIDADE_CONFIG[u.situacao]?.corMapa,
                className: SITUACAO_UNIDADE_CONFIG[u.situacao]?.classeMapa,
                weight: u.id === selecionadaId ? 3 : 1.5,
                fillOpacity: 0.15,
              }}
              eventHandlers={{ click: () => onSelecionar(u.id) }}
            />
          ) : null,
        )}

        {comCoordenada.map((u) => {
          const cfg = SITUACAO_UNIDADE_CONFIG[u.situacao] ?? SITUACAO_UNIDADE_CONFIG.a_visitar;
          const selecionada = u.id === selecionadaId;
          return (
            <CircleMarker
              // a situação entra na chave porque a classe do caminho SVG só é aplicada na criação
              key={`pt-${u.id}-${u.situacao}`}
              center={[u.unidade!.latitude as number, u.unidade!.longitude as number]}
              radius={selecionada ? 11 : 7}
              pathOptions={{
                color: cfg.corMapa,
                className: cfg.classeMapa,
                weight: selecionada ? 4 : 2,
                fillOpacity: 0.85,
              }}
              eventHandlers={{ click: () => onSelecionar(u.id) }}
            >
              <Tooltip direction="top" offset={[0, -6]}>
                {u.unidade!.nome_unidade} — {cfg.label}
              </Tooltip>
            </CircleMarker>
          );
        })}

        <AjustarEnquadramento pontos={pontos} />
      </MapContainer>
    </div>
  );
}
