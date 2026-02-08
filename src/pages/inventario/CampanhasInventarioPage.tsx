/**
 * CAMPANHAS DE INVENTÁRIO
 * Gestão de campanhas de levantamento patrimonial
 */

import { useState } from "react";
import { Link } from "react-router-dom";
import { 
  ClipboardCheck, Plus, Search, Eye, Play, Pause, CheckCircle2,
  Calendar, Users, BarChart3, AlertTriangle, QrCode
} from "lucide-react";
import { ModuleLayout } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useCampanhasInventario } from "@/hooks/usePatrimonio";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const STATUS_CAMPANHA = [
  { value: 'planejada', label: 'Planejada', color: 'bg-muted', icon: Calendar },
  { value: 'em_andamento', label: 'Em Andamento', color: 'bg-primary', icon: Play },
  { value: 'pausada', label: 'Pausada', color: 'bg-warning', icon: Pause },
  { value: 'concluida', label: 'Concluída', color: 'bg-success', icon: CheckCircle2 },
];

const TIPOS_CAMPANHA = [
  { value: 'geral', label: 'Geral' },
  { value: 'setorial', label: 'Setorial' },
  { value: 'rotativo', label: 'Rotativo' },
];

export default function CampanhasInventarioPage() {
  const [filtroAno, setFiltroAno] = useState<string>(new Date().getFullYear().toString());
  const [filtroStatus, setFiltroStatus] = useState<string>("");

  const { data: campanhas, isLoading } = useCampanhasInventario(
    filtroAno ? parseInt(filtroAno) : undefined
  );

  const campanhasFiltradas = campanhas?.filter(camp => {
    if (filtroStatus && camp.status !== filtroStatus) return false;
    return true;
  });

  const getStatusBadge = (status: string | null) => {
    const st = STATUS_CAMPANHA.find(s => s.value === status);
    if (!st) return <Badge variant="secondary">-</Badge>;
    const Icon = st.icon;
    return (
      <Badge variant="outline" className={`${st.color} text-white border-0`}>
        <Icon className="w-3 h-3 mr-1" />
        {st.label}
      </Badge>
    );
  };

  const anos = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  return (
    <ModuleLayout module="patrimonio">
      {/* Header */}
      <section className="bg-secondary text-secondary-foreground py-6">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-2 text-sm mb-3 opacity-80">
            <Link to="/inventario" className="hover:underline">Inventário</Link>
            <span>/</span>
            <span>Campanhas</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ClipboardCheck className="w-8 h-8" />
              <div>
                <h1 className="font-serif text-2xl font-bold">Campanhas de Inventário</h1>
                <p className="opacity-90 text-sm">Levantamento e conferência de bens</p>
              </div>
            </div>
            <Button asChild>
              <Link to="/inventario/campanhas?acao=nova">
                <Plus className="w-4 h-4 mr-2" />
                Nova Campanha
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Filtros */}
      <section className="py-4 border-b">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap gap-3">
            <Select value={filtroAno} onValueChange={setFiltroAno}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Ano" />
              </SelectTrigger>
              <SelectContent>
                {anos.map(ano => (
                  <SelectItem key={ano} value={ano.toString()}>{ano}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filtroStatus || "all"} onValueChange={v => setFiltroStatus(v === "all" ? "" : v)}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {STATUS_CAMPANHA.map(s => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      {/* Lista de Campanhas */}
      <section className="py-6">
        <div className="container mx-auto px-4">
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">
              Carregando campanhas...
            </div>
          ) : campanhasFiltradas?.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <ClipboardCheck className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma campanha encontrada para este período</p>
                <Button asChild className="mt-4">
                  <Link to="/inventario/campanhas?acao=nova">
                    <Plus className="w-4 h-4 mr-2" />
                    Criar Nova Campanha
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {campanhasFiltradas?.map(campanha => (
                <Card key={campanha.id} className="hover:border-primary/50 transition-colors">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          campanha.status === 'em_andamento' ? 'bg-primary/10 text-primary' :
                          campanha.status === 'concluida' ? 'bg-success/10 text-success' :
                          'bg-muted text-muted-foreground'
                        }`}>
                          <QrCode className="w-5 h-5" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{campanha.nome}</CardTitle>
                          <CardDescription className="flex items-center gap-3 mt-1">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {format(new Date(campanha.data_inicio), 'dd/MM/yyyy', { locale: ptBR })}
                              {' - '}
                              {format(new Date(campanha.data_fim), 'dd/MM/yyyy', { locale: ptBR })}
                            </span>
                            <Badge variant="outline" className="capitalize">
                              {campanha.tipo}
                            </Badge>
                          </CardDescription>
                        </div>
                      </div>
                      {getStatusBadge(campanha.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Progresso */}
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-muted-foreground">
                            Progresso: {campanha.total_conferidos || 0} de {campanha.total_bens_esperados || 0} bens
                          </span>
                          <span className="font-medium">
                            {campanha.percentual_conclusao?.toFixed(1) || 0}%
                          </span>
                        </div>
                        <Progress value={campanha.percentual_conclusao || 0} />
                      </div>

                      {/* Métricas */}
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center p-3 bg-muted/50 rounded-lg">
                          <BarChart3 className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                          <div className="text-lg font-bold">{campanha.total_bens_esperados || 0}</div>
                          <div className="text-xs text-muted-foreground">Bens Esperados</div>
                        </div>
                        <div className="text-center p-3 bg-success/10 rounded-lg">
                          <CheckCircle2 className="w-4 h-4 mx-auto mb-1 text-success" />
                          <div className="text-lg font-bold text-success">{campanha.total_conferidos || 0}</div>
                          <div className="text-xs text-muted-foreground">Conferidos</div>
                        </div>
                        <div className="text-center p-3 bg-warning/10 rounded-lg">
                          <AlertTriangle className="w-4 h-4 mx-auto mb-1 text-warning" />
                          <div className="text-lg font-bold text-warning">{campanha.total_divergencias || 0}</div>
                          <div className="text-xs text-muted-foreground">Divergências</div>
                        </div>
                      </div>

                      {/* Responsável */}
                      {(campanha as any).responsavel && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Users className="w-4 h-4" />
                          Responsável: {(campanha as any).responsavel.nome_completo}
                        </div>
                      )}

                      {/* Ações */}
                      <div className="flex gap-2 pt-2">
                        <Button asChild variant="outline" size="sm">
                          <Link to={`/inventario/campanhas/${campanha.id}`}>
                            <Eye className="w-4 h-4 mr-2" />
                            Detalhes
                          </Link>
                        </Button>
                        {campanha.status === 'em_andamento' && (
                          <Button asChild size="sm">
                            <Link to={`/inventario/campanhas/${campanha.id}/coleta`}>
                              <QrCode className="w-4 h-4 mr-2" />
                              Continuar Coleta
                            </Link>
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>
    </ModuleLayout>
  );
}
