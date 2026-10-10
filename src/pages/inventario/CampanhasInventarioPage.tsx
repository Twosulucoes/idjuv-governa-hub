/**
 * CAMPANHAS DE INVENTÁRIO
 * Gestão de campanhas de levantamento patrimonial
 */

import { useState } from "react";
import { Link } from "react-router-dom";
import { 
  ClipboardCheck, Plus, Eye, CheckCircle2,
  Calendar, Users, BarChart3, AlertTriangle, QrCode
} from "lucide-react";
import { ModuleLayout } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { EmptyState, PageHeader, StatusBadge, type TomStatus } from "@/components/design-system";
import { useCampanhasInventario } from "@/hooks/usePatrimonio";
import { NovaCampanhaDialog } from "@/components/inventario/NovaCampanhaDialog";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const STATUS_CAMPANHA: { value: string; label: string; tom: TomStatus }[] = [
  { value: 'planejada', label: 'Planejada', tom: 'neutro' },
  { value: 'em_andamento', label: 'Em andamento', tom: 'andamento' },
  { value: 'pausada', label: 'Pausada', tom: 'pendente' },
  { value: 'concluida', label: 'Concluída', tom: 'sucesso' },
];

function StatusCampanhaBadge({ status }: { status: string | null }) {
  const st = STATUS_CAMPANHA.find(s => s.value === status);
  return st ? <StatusBadge tom={st.tom}>{st.label}</StatusBadge> : <StatusBadge tom="neutro">Sem status</StatusBadge>;
}

export default function CampanhasInventarioPage() {
  const [filtroAno, setFiltroAno] = useState<string>(new Date().getFullYear().toString());
  const [filtroStatus, setFiltroStatus] = useState<string>("");

  const { data: campanhas, isLoading, isError, refetch } = useCampanhasInventario(
    filtroAno ? parseInt(filtroAno) : undefined
  );

  const campanhasFiltradas = campanhas?.filter(camp => {
    if (filtroStatus && camp.status !== filtroStatus) return false;
    return true;
  });

  const anos = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  return (
    <ModuleLayout module="patrimonio">
      <div className="space-y-6">
        <PageHeader
          migalhas={[{ rotulo: "Inventário", href: "/inventario" }, { rotulo: "Campanhas" }]}
          titulo="Campanhas de inventário"
          descricao="Levantamento e conferência de bens"
          acoes={
            <Button asChild>
              <Link to="/inventario/campanhas?acao=nova">
                <Plus className="h-4 w-4" aria-hidden="true" />
                Nova campanha
              </Link>
            </Button>
          }
        />

        {/* Filtros */}
        <div className="flex flex-wrap gap-3">
          <Select value={filtroAno} onValueChange={setFiltroAno}>
            <SelectTrigger className="w-[120px]" aria-label="Ano">
              <SelectValue placeholder="Ano" />
            </SelectTrigger>
            <SelectContent>
              {anos.map(ano => (
                <SelectItem key={ano} value={ano.toString()}>{ano}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filtroStatus || "all"} onValueChange={v => setFiltroStatus(v === "all" ? "" : v)}>
            <SelectTrigger className="w-[160px]" aria-label="Status">
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

        {/* Lista de Campanhas */}
        {isLoading ? (
          <div className="py-12 text-center text-muted-foreground" role="status">
            Carregando campanhas...
          </div>
        ) : isError ? (
          <Card>
            <EmptyState
              icone={AlertTriangle}
              titulo="Não foi possível carregar as campanhas"
              descricao="Verifique a conexão e tente novamente."
              acao={<Button variant="outline" onClick={() => refetch()}>Tentar novamente</Button>}
            />
          </Card>
        ) : !campanhasFiltradas?.length ? (
          <Card>
            <EmptyState
              icone={ClipboardCheck}
              titulo="Nenhuma campanha encontrada"
              descricao="Não há campanhas para este período e status."
              acao={
                <Button asChild>
                  <Link to="/inventario/campanhas?acao=nova">
                    <Plus className="h-4 w-4" aria-hidden="true" />
                    Criar nova campanha
                  </Link>
                </Button>
              }
            />
          </Card>
        ) : (
          <div className="grid gap-4">
            {campanhasFiltradas.map(campanha => (
              <Card key={campanha.id} className="hover:border-primary/50 transition-colors">
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        campanha.status === 'em_andamento' ? 'bg-primary/10 text-primary' :
                        campanha.status === 'concluida' ? 'bg-success/10 text-success' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        <QrCode className="w-5 h-5" aria-hidden="true" />
                      </div>
                      <div>
                        <CardTitle className="text-h3">{campanha.nome}</CardTitle>
                        <CardDescription className="flex flex-wrap items-center gap-3 mt-1">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" aria-hidden="true" />
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
                    <StatusCampanhaBadge status={campanha.status} />
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
                        <span className="font-medium tabular-nums">
                          {campanha.percentual_conclusao?.toFixed(1) || 0}%
                        </span>
                      </div>
                      <Progress
                        value={campanha.percentual_conclusao || 0}
                        aria-label={`Progresso da campanha ${campanha.nome}`}
                      />
                    </div>

                    {/* Métricas */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <BarChart3 className="w-4 h-4 mx-auto mb-1 text-muted-foreground" aria-hidden="true" />
                        <div className="text-lg font-bold tabular-nums">{campanha.total_bens_esperados || 0}</div>
                        <div className="text-xs text-muted-foreground">Bens esperados</div>
                      </div>
                      <div className="text-center p-3 bg-success/10 rounded-lg">
                        <CheckCircle2 className="w-4 h-4 mx-auto mb-1 text-success" aria-hidden="true" />
                        <div className="text-lg font-bold tabular-nums text-success">{campanha.total_conferidos || 0}</div>
                        <div className="text-xs text-muted-foreground">Conferidos</div>
                      </div>
                      <div className="text-center p-3 bg-warning/10 rounded-lg">
                        <AlertTriangle className="w-4 h-4 mx-auto mb-1 text-warning" aria-hidden="true" />
                        <div className="text-lg font-bold tabular-nums text-warning">{campanha.total_divergencias || 0}</div>
                        <div className="text-xs text-muted-foreground">Divergências</div>
                      </div>
                    </div>

                    {/* Responsável */}
                    {(campanha as any).responsavel && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="w-4 h-4" aria-hidden="true" />
                        Responsável: {(campanha as any).responsavel.nome_completo}
                      </div>
                    )}

                    {/* Ações */}
                    <div className="flex gap-2 pt-2">
                      <Button asChild variant="outline" size="sm">
                        <Link to={`/inventario/campanhas/${campanha.id}`} aria-label={`Detalhes da campanha ${campanha.nome}`}>
                          <Eye className="h-4 w-4" aria-hidden="true" />
                          Detalhes
                        </Link>
                      </Button>
                      {campanha.status === 'em_andamento' && (
                        <Button asChild size="sm">
                          <Link to={`/inventario/campanhas/${campanha.id}/coleta`}>
                            <QrCode className="h-4 w-4" aria-hidden="true" />
                            Continuar coleta
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

      {/* Dialog Nova Campanha */}
      <NovaCampanhaDialog />
    </ModuleLayout>
  );
}
