/**
 * Sino do cabeçalho dos módulos: avisos não lidos, contratos vencendo (C2: os do gestor e dos fiscais; com
 * contratos.editar, todos) e próximas datas importantes. Vencidos e os que vencem em até 30 dias contam no número.
 */

import { useState } from "react";
import { Link } from "react-router-dom";
import { Bell, CalendarDays, FileWarning } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useAvisosVigentes, useMarcarAvisoLido } from "@/hooks/useAvisos";
import { useMeusVencimentos } from "@/hooks/useContratosVencimentos";
import { useProximasDatas } from "@/hooks/useDatasImportantes";
import { FAIXAS_VENCIMENTO, textoDias } from "@/lib/contratos/vigencia";
import { TIPO_DATA_LABEL } from "@/types/avisos";
import { rotuloPapel } from "@/types/contratos";
import { PRIORIDADE_AVISO_ESTILO, diaMes } from "./avisosVisual";
import { AvisoLink } from "./AvisoLink";

const MAX_DATAS = 5;
const MAX_CONTRATOS = 5;
/** Vencido ou vencendo em até 30 dias: conta no número vermelho do sino. */
const URGENTE_DIAS = FAIXAS_VENCIMENTO[0].dias;

export function AvisosSino() {
  const [aberto, setAberto] = useState(false);
  const { data: avisos = [] } = useAvisosVigentes();
  // As datas só são buscadas quando o sino é aberto (ele está em todas as telas de módulo).
  const { data: datas = [], isLoading: carregandoDatas } = useProximasDatas(30, aberto);
  const { data: contratos = [] } = useMeusVencimentos();
  const marcarLido = useMarcarAvisoLido();

  const naoLidos = avisos.filter((a) => !a.lido);
  const contratosUrgentes = contratos.filter((c) => c.dias <= URGENTE_DIAS).length;
  const urgente = contratosUrgentes > 0 || naoLidos.some((a) => a.prioridade === "urgente");
  const contagem = naoLidos.length + contratosUrgentes;
  const proximas = datas.slice(0, MAX_DATAS);
  const abreVencimentos = contratos.some((c) => c.abre_ficha);

  return (
    <Popover open={aberto} onOpenChange={setAberto}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9"
          aria-label={`Avisos (${naoLidos.length} não lidos${contratosUrgentes ? `, ${contratosUrgentes} contratos vencendo` : ""})`}
        >
          <Bell className={cn("h-5 w-5", urgente && "text-destructive")} />
          {contagem > 0 && (
            <span
              className={cn(
                "absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-medium",
                urgente ? "bg-destructive text-destructive-foreground" : "bg-primary text-primary-foreground",
              )}
            >
              {contagem > 9 ? "9+" : contagem}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[calc(100vw-2rem)] max-w-sm p-0" align="end">
        <div className="flex items-center justify-between px-4 py-3">
          <h4 className="text-sm font-semibold">Avisos</h4>
          {naoLidos.length > 0 && (
            <Button
              variant="link"
              size="sm"
              className="h-auto p-0 text-xs"
              disabled={marcarLido.isPending}
              onClick={() => marcarLido.mutate(naoLidos.map((a) => a.id))}
            >
              Marcar todos como lidos
            </Button>
          )}
        </div>
        <div className="max-h-72 space-y-2 overflow-y-auto px-4 pb-3">
          {naoLidos.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum aviso novo.</p>
          ) : (
            naoLidos.slice(0, 10).map((aviso) => {
              const { classe, icone: Icone } = PRIORIDADE_AVISO_ESTILO[aviso.prioridade];
              return (
                <div key={aviso.id} className={cn("flex gap-2 rounded-md border p-2 text-sm", classe)}>
                  <Icone className="mt-0.5 h-4 w-4 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{aviso.titulo}</p>
                    <p className="line-clamp-2 text-xs text-foreground/80">{aviso.conteudo}</p>
                    {aviso.link && <AvisoLink href={aviso.link} />}
                  </div>
                </div>
              );
            })
          )}
        </div>
        {contratos.length > 0 && (
          <>
            <Separator />
            <div className="space-y-2 px-4 py-3">
              <h4 className="flex items-center gap-1 text-sm font-semibold">
                <FileWarning className="h-4 w-4" aria-hidden="true" /> Contratos vencendo
              </h4>
              <ul className="space-y-1.5">
                {contratos.slice(0, MAX_CONTRATOS).map((c) => {
                  const texto = (
                    <>
                      <span className="block truncate font-medium">{c.numero} · {c.objeto}</span>
                      <span className={cn("block text-xs", c.dias <= URGENTE_DIAS ? "font-medium text-destructive" : "text-muted-foreground")}>
                        {textoDias(c.dias)}
                        {c.papeis.length > 0 && <span className="font-normal text-muted-foreground"> · você é {c.papeis.map((p) => rotuloPapel(p).toLowerCase()).join(" e ")}</span>}
                      </span>
                    </>
                  );
                  return (
                    <li key={c.contrato_id} className="text-sm">
                      {c.abre_ficha ? (
                        <Link to={`/contratos/${c.contrato_id}?aba=alteracoes`} className="block rounded-sm hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" onClick={() => setAberto(false)}>
                          {texto}
                        </Link>
                      ) : (
                        texto
                      )}
                    </li>
                  );
                })}
              </ul>
              {abreVencimentos && (
                <Button asChild variant="link" size="sm" className="h-auto p-0 text-xs">
                  <Link to="/contratos/vencimentos" onClick={() => setAberto(false)}>
                    {contratos.length > MAX_CONTRATOS ? `Ver todos (${contratos.length}) em Vencimentos` : "Abrir Vencimentos"}
                  </Link>
                </Button>
              )}
            </div>
          </>
        )}
        <Separator />
        <div className="space-y-2 px-4 py-3">
          <h4 className="flex items-center gap-1 text-sm font-semibold">
            <CalendarDays className="h-4 w-4" /> Próximos 30 dias
          </h4>
          {carregandoDatas ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : proximas.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma data importante.</p>
          ) : (
            <ul className="space-y-1">
              {proximas.map((d) => (
                <li key={d.id} className="flex items-center gap-2 text-sm">
                  <span className="w-11 shrink-0 font-mono text-xs text-muted-foreground">{diaMes(d.data)}</span>
                  <span className="min-w-0 flex-1 truncate">{d.titulo}</span>
                  <Badge variant="outline" className="shrink-0 text-[10px]">
                    {TIPO_DATA_LABEL[d.tipo]}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </div>
        <Separator />
        <div className="px-4 py-2">
          <Button asChild variant="ghost" size="sm" className="w-full">
            <Link to="/avisos">Ver mural e calendário</Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
