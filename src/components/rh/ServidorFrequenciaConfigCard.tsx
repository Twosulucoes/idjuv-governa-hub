import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

import {
  useConfigJornadas,
  useRegimesTrabalho,
  useSalvarServidorRegime,
  useServidorRegime,
} from "@/hooks/useParametrizacoesFrequencia";

type Props = {
  servidorId: string;
};

export function ServidorFrequenciaConfigCard({ servidorId }: Props) {
  const { data: servidorRegime, isLoading: loadingServidorRegime } = useServidorRegime(servidorId);
  const { data: regimes, isLoading: loadingRegimes } = useRegimesTrabalho();
  const { data: jornadas, isLoading: loadingJornadas } = useConfigJornadas();
  const salvar = useSalvarServidorRegime();

  const [regimeId, setRegimeId] = useState<string>("");
  const [jornadaId, setJornadaId] = useState<string>("");
  const [dataInicio, setDataInicio] = useState<string>(() => format(new Date(), "yyyy-MM-dd"));

  useEffect(() => {
    if (!servidorRegime) return;
    setRegimeId((servidorRegime as any).regime_id || "");
    setJornadaId((servidorRegime as any).jornada_id || "");
    const di = (servidorRegime as any).data_inicio;
    if (typeof di === "string" && di.length >= 10) {
      setDataInicio(di.slice(0, 10));
    }
  }, [servidorRegime]);

  const jornadaSelecionada = useMemo(() => {
    const lista = (jornadas || []).filter((j) => j.ativo !== false);
    return lista.find((j) => j.id === jornadaId) || null;
  }, [jornadas, jornadaId]);

  const cargaDiaria =
    (servidorRegime as any)?.carga_horaria_customizada ??
    jornadaSelecionada?.carga_horaria_diaria ??
    (servidorRegime as any)?.jornada?.carga_horaria_diaria ??
    8;

  const modoParametrizacao = cargaDiaria >= 8 ? "8h (2 turnos / 2 assinaturas)" : "≤ 6h (1 turno / 1 assinatura)";

  const handleSalvar = async () => {
    if (!regimeId) return;

    await salvar.mutateAsync({
      id: (servidorRegime as any)?.id,
      servidor_id: servidorId,
      regime_id: regimeId,
      jornada_id: jornadaId || null,
      data_inicio: dataInicio,
      ativo: true,
    } as any);
  };

  const carregando = loadingServidorRegime || loadingRegimes || loadingJornadas;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Frequência (Jornada / Regime)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={carregando ? "secondary" : "outline"}>
            {carregando ? "Carregando..." : "Configuração"}
          </Badge>
          <Badge variant="secondary">{modoParametrizacao}</Badge>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Regime de trabalho</Label>
            <Select value={regimeId} onValueChange={setRegimeId} disabled={carregando}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {(regimes || []).filter((r) => r.ativo !== false).map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Jornada (carga horária)</Label>
            <Select value={jornadaId} onValueChange={setJornadaId} disabled={carregando}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {(jornadas || [])
                  .filter((j) => j.ativo !== false)
                  .map((j) => (
                    <SelectItem key={j.id} value={j.id}>
                      {j.nome} ({j.carga_horaria_diaria}h/dia)
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Início de vigência</Label>
            <Input
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              disabled={carregando}
            />
          </div>

          <div className="flex items-end">
            <Button
              onClick={handleSalvar}
              disabled={carregando || salvar.isPending || !regimeId}
              className="w-full"
            >
              {salvar.isPending ? "Salvando..." : "Salvar configuração"}
            </Button>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          A impressão usa esta jornada como fonte única de verdade: ≤6h gera 1 turno/1 assinatura; 8h gera 2 turnos/2 assinaturas.
        </p>
      </CardContent>
    </Card>
  );
}
