import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Calendar, Download, ChevronLeft, ChevronRight, Flag } from "lucide-react";
import { useDiasNaoUteis } from "@/hooks/useParametrizacoesFrequencia";
import type { DiaNaoUtil } from "@/types/frequencia";
import { TIPO_DIA_NAO_UTIL_LABELS, ESFERA_DIA_NAO_UTIL_LABELS } from "@/types/frequencia";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, getDay, addMonths, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export function CalendarioOficialTab() {
  const anoAtual = new Date().getFullYear();
  const [ano, setAno] = useState(anoAtual);
  const [mesAtual, setMesAtual] = useState(new Date());
  const [visualizacao, setVisualizacao] = useState<'mensal' | 'anual'>('mensal');
  
  const { data: dias, isLoading } = useDiasNaoUteis(ano);
  
  const anos = Array.from({ length: 5 }, (_, i) => anoAtual + 2 - i);

  const getDiaEvento = (data: Date): DiaNaoUtil | undefined => {
    const dataStr = format(data, 'yyyy-MM-dd');
    return dias?.find(d => d.data === dataStr && d.ativo);
  };

  const getTipoCor = (tipo: string) => {
    switch (tipo) {
      case 'feriado_nacional':
        return 'bg-red-500 text-white';
      case 'feriado_estadual':
        return 'bg-orange-500 text-white';
      case 'feriado_municipal':
        return 'bg-amber-500 text-white';
      case 'ponto_facultativo':
        return 'bg-blue-500 text-white';
      case 'recesso':
        return 'bg-purple-500 text-white';
      case 'suspensao_expediente':
        return 'bg-gray-500 text-white';
      case 'expediente_reduzido':
        return 'bg-yellow-500 text-black';
      default:
        return 'bg-gray-300';
    }
  };

  const handleMesAnterior = () => {
    const novaData = subMonths(mesAtual, 1);
    setMesAtual(novaData);
    setAno(novaData.getFullYear());
  };

  const handleProximoMes = () => {
    const novaData = addMonths(mesAtual, 1);
    setMesAtual(novaData);
    setAno(novaData.getFullYear());
  };

  const renderCalendarioMensal = () => {
    const inicio = startOfMonth(mesAtual);
    const fim = endOfMonth(mesAtual);
    const diasDoMes = eachDayOfInterval({ start: inicio, end: fim });
    
    // Preencher dias vazios no início
    const primeiroDiaSemana = getDay(inicio);
    const diasVaziosInicio = Array(primeiroDiaSemana).fill(null);
    
    const todosDias = [...diasVaziosInicio, ...diasDoMes];

    return (
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={handleMesAnterior}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <CardTitle className="text-lg">
              {MESES[mesAtual.getMonth()]} {mesAtual.getFullYear()}
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={handleProximoMes}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Cabeçalho dos dias da semana */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {DIAS_SEMANA.map((dia, i) => (
              <div 
                key={dia} 
                className={`text-center text-sm font-medium p-2 ${
                  i === 0 || i === 6 ? 'text-red-500' : 'text-muted-foreground'
                }`}
              >
                {dia}
              </div>
            ))}
          </div>
          
          {/* Grid dos dias */}
          <div className="grid grid-cols-7 gap-1">
            {todosDias.map((dia, index) => {
              if (!dia) {
                return <div key={`empty-${index}`} className="p-2 min-h-[80px]" />;
              }
              
              const evento = getDiaEvento(dia);
              const ehHoje = isToday(dia);
              const diaSemana = getDay(dia);
              const ehFimDeSemana = diaSemana === 0 || diaSemana === 6;
              
              return (
                <div
                  key={dia.toISOString()}
                  className={`
                    p-2 min-h-[80px] border rounded-lg relative
                    ${ehHoje ? 'ring-2 ring-primary border-primary' : 'border-border'}
                    ${ehFimDeSemana && !evento ? 'bg-muted/30' : ''}
                    ${evento ? 'bg-muted/50' : ''}
                  `}
                >
                  <div className={`text-sm font-medium ${
                    ehHoje ? 'text-primary' : ehFimDeSemana ? 'text-red-500' : ''
                  }`}>
                    {format(dia, 'd')}
                  </div>
                  
                  {evento && (
                    <div className="mt-1">
                      <div className={`text-xs px-1 py-0.5 rounded ${getTipoCor(evento.tipo)} truncate`}>
                        {evento.nome}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderCalendarioAnual = () => {
    const meses = Array.from({ length: 12 }, (_, i) => i);
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {meses.map((mes) => {
          const dataMes = new Date(ano, mes, 1);
          const diasDoMes = dias?.filter(d => {
            const dataEvento = new Date(d.data + 'T12:00:00');
            return dataEvento.getMonth() === mes && d.ativo;
          }) || [];
          
          return (
            <Card key={mes} className="overflow-hidden">
              <CardHeader className="py-2 px-4 bg-muted/30">
                <CardTitle className="text-sm">{MESES[mes]}</CardTitle>
              </CardHeader>
              <CardContent className="p-3">
                {diasDoMes.length > 0 ? (
                  <div className="space-y-1">
                    {diasDoMes.map((d) => (
                      <div key={d.id} className="flex items-start gap-2 text-xs">
                        <span className="font-mono text-muted-foreground w-5">
                          {format(new Date(d.data + 'T12:00:00'), 'dd')}
                        </span>
                        <Badge variant="outline" className={`${getTipoCor(d.tipo)} text-xs px-1`}>
                          {d.nome}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-2">
                    Sem eventos
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Calendário Oficial {ano}
          </h3>
          <p className="text-sm text-muted-foreground">
            Visualização completa de feriados, pontos facultativos e dias não úteis
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={String(ano)} onValueChange={(v) => {
            setAno(Number(v));
            setMesAtual(new Date(Number(v), mesAtual.getMonth(), 1));
          }}>
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {anos.map((a) => (
                <SelectItem key={a} value={String(a)}>{a}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={visualizacao} onValueChange={(v: 'mensal' | 'anual') => setVisualizacao(v)}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mensal">Mensal</SelectItem>
              <SelectItem value="anual">Anual</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Legenda */}
      <Card className="bg-muted/30">
        <CardContent className="py-3">
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: 'hsl(var(--destructive))' }} />
              <span className="text-xs">Feriado Nacional</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-orange-500" />
              <span className="text-xs">Feriado Estadual</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-amber-500" />
              <span className="text-xs">Feriado Municipal</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: 'hsl(var(--primary))' }} />
              <span className="text-xs">Ponto Facultativo</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-purple-500" />
              <span className="text-xs">Recesso</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: 'hsl(var(--accent))' }} />
              <span className="text-xs">Exp. Reduzido</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calendário */}
      {visualizacao === 'mensal' ? renderCalendarioMensal() : renderCalendarioAnual()}

      {/* Resumo */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Flag className="h-4 w-4" />
            Resumo de {ano}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Feriados Nacionais:</span>
              <span className="ml-2 font-semibold">{dias?.filter(d => d.ativo && d.tipo === 'feriado_nacional').length || 0}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Feriados Estaduais:</span>
              <span className="ml-2 font-semibold">{dias?.filter(d => d.ativo && d.tipo === 'feriado_estadual').length || 0}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Pontos Facultativos:</span>
              <span className="ml-2 font-semibold">{dias?.filter(d => d.ativo && d.tipo === 'ponto_facultativo').length || 0}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Total de Dias:</span>
              <span className="ml-2 font-semibold">{dias?.filter(d => d.ativo).length || 0}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
