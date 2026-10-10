/**
 * HOOK: GEOLOCALIZAÇÃO CONTÍNUA (GPS)
 * Acompanha a posição do aparelho com alta precisão (watchPosition).
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { IDADE_MAXIMA_GPS_S, type PosicaoGps } from "@/types/inventarioCampo";

function mensagemErro(erro: GeolocationPositionError): string {
  switch (erro.code) {
    case erro.PERMISSION_DENIED:
      return "Permissão de localização negada. Autorize o GPS nas configurações do navegador.";
    case erro.POSITION_UNAVAILABLE:
      return "Localização indisponível. Verifique se o GPS está ligado.";
    case erro.TIMEOUT:
      return "O GPS demorou a responder. Tente novamente em área aberta.";
    default:
      return "Não foi possível obter a localização.";
  }
}

/** Leitura ainda válida (não mais velha que IDADE_MAXIMA_GPS_S)? */
export function posicaoAtual(posicao: PosicaoGps | null): PosicaoGps | null {
  if (!posicao) return null;
  return Date.now() - Date.parse(posicao.em) <= IDADE_MAXIMA_GPS_S * 1000 ? posicao : null;
}

export function useGeolocalizacao(ativo = true) {
  const [posicao, setPosicao] = useState<PosicaoGps | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [agora, setAgora] = useState(() => Date.now());
  const watchId = useRef<number | null>(null);

  const parar = useCallback(() => {
    if (watchId.current !== null && typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchId.current);
    }
    watchId.current = null;
  }, []);

  const atualizar = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setErro("Este dispositivo não oferece localização por GPS.");
      return;
    }
    parar();
    setCarregando(true);
    setErro(null);
    watchId.current = navigator.geolocation.watchPosition(
      (p) => {
        setPosicao({
          lat: p.coords.latitude,
          lon: p.coords.longitude,
          precisao: p.coords.accuracy,
          em: new Date(p.timestamp).toISOString(),
        });
        setErro(null);
        setCarregando(false);
      },
      (e) => {
        setErro(mensagemErro(e));
        setCarregando(false);
      },
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 30000 },
    );
  }, [parar]);

  useEffect(() => {
    if (!ativo) return;
    atualizar();
    return parar;
  }, [ativo, atualizar, parar]);

  // Relógio para reavaliar a idade da leitura mesmo sem nova posição
  useEffect(() => {
    if (!posicao) return;
    setAgora(Date.now());
    const id = window.setInterval(() => setAgora(Date.now()), 5000);
    return () => window.clearInterval(id);
  }, [posicao]);

  const idadeSegundos = posicao ? Math.max(0, Math.round((agora - Date.parse(posicao.em)) / 1000)) : null;
  const desatualizada = idadeSegundos !== null && idadeSegundos > IDADE_MAXIMA_GPS_S;

  return { posicao, erro, carregando, atualizar, idadeSegundos, desatualizada };
}
