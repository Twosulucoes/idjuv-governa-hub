import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  History, 
  ArrowRight, 
  Building2, 
  Briefcase, 
  Calendar,
  FileText,
  UserCheck,
  UserX
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface HistoricoFuncionalTabProps {
  servidorId: string;
}

const TIPO_MOVIMENTACAO_LABELS: Record<string, string> = {
  nomeacao: "Nomeação",
  exoneracao: "Exoneração",
  designacao: "Designação",
  dispensa: "Dispensa",
  transferencia: "Transferência",
  redistribuicao: "Redistribuição",
  cessao: "Cessão",
  requisicao: "Requisição",
  remocao: "Remoção",
  promocao: "Promoção",
  progressao: "Progressão",
};

const TIPO_MOVIMENTACAO_COLORS: Record<string, string> = {
  nomeacao: "bg-success/10 text-success border-success/20",
  exoneracao: "bg-destructive/10 text-destructive border-destructive/20",
  designacao: "bg-primary/10 text-primary border-primary/20",
  dispensa: "bg-warning/10 text-warning border-warning/20",
  transferencia: "bg-info/10 text-info border-info/20",
  redistribuicao: "bg-secondary/10 text-secondary-foreground border-secondary/20",
  cessao: "bg-orange-100 text-orange-700 border-orange-200",
  requisicao: "bg-purple-100 text-purple-700 border-purple-200",
  remocao: "bg-slate-100 text-slate-700 border-slate-200",
  promocao: "bg-emerald-100 text-emerald-700 border-emerald-200",
  progressao: "bg-cyan-100 text-cyan-700 border-cyan-200",
};

export function HistoricoFuncionalTab({ servidorId }: HistoricoFuncionalTabProps) {
  // Buscar histórico funcional
  const { data: historico = [], isLoading: loadingHistorico } = useQuery({
    queryKey: ["historico-funcional", servidorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("historico_funcional")
        .select(`
          *,
          cargo_anterior:cargos!historico_funcional_cargo_anterior_id_fkey(id, nome, sigla),
          cargo_novo:cargos!historico_funcional_cargo_novo_id_fkey(id, nome, sigla),
          unidade_anterior:estrutura_organizacional!historico_funcional_unidade_anterior_id_fkey(id, nome, sigla),
          unidade_nova:estrutura_organizacional!historico_funcional_unidade_nova_id_fkey(id, nome, sigla)
        `)
        .eq("servidor_id", servidorId)
        .order("data_evento", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  // Buscar lotações (ativas e inativas)
  const { data: lotacoes = [], isLoading: loadingLotacoes } = useQuery({
    queryKey: ["lotacoes-servidor", servidorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lotacoes")
        .select(`
          *,
          unidade:estrutura_organizacional!lotacoes_unidade_id_fkey(id, nome, sigla),
          cargo:cargos!lotacoes_cargo_id_fkey(id, nome, sigla)
        `)
        .eq("servidor_id", servidorId)
        .order("data_inicio", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  // Buscar férias
  const { data: ferias = [], isLoading: loadingFerias } = useQuery({
    queryKey: ["ferias-servidor", servidorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ferias_servidor")
        .select("*")
        .eq("servidor_id", servidorId)
        .order("data_inicio", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  // Buscar licenças/afastamentos
  const { data: licencas = [], isLoading: loadingLicencas } = useQuery({
    queryKey: ["licencas-servidor", servidorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("licencas_afastamentos")
        .select("*")
        .eq("servidor_id", servidorId)
        .order("data_inicio", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const isLoading = loadingHistorico || loadingLotacoes || loadingFerias || loadingLicencas;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Lotações */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Building2 className="h-5 w-5 text-primary" />
            Histórico de Lotações
          </CardTitle>
        </CardHeader>
        <CardContent>
          {lotacoes.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma lotação registrada.</p>
          ) : (
            <div className="relative space-y-4">
              {/* Timeline line */}
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
              
              {lotacoes.map((lot, index) => (
                <div key={lot.id} className="relative pl-10">
                  {/* Timeline dot */}
                  <div className={`absolute left-2 top-2 w-4 h-4 rounded-full border-2 ${
                    lot.ativo 
                      ? "bg-success border-success" 
                      : "bg-muted border-muted-foreground/30"
                  }`} />
                  
                  <div className={`p-4 rounded-lg border ${
                    lot.ativo ? "bg-success/5 border-success/20" : "bg-muted/30"
                  }`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">
                            {lot.unidade?.sigla || lot.unidade?.nome || "Unidade não informada"}
                          </span>
                          <Badge variant={lot.ativo ? "default" : "secondary"} className="text-xs">
                            {lot.ativo ? "Ativa" : "Encerrada"}
                          </Badge>
                        </div>
                        {lot.cargo && (
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Briefcase className="h-3 w-3" />
                            {lot.cargo.sigla || lot.cargo.nome}
                          </p>
                        )}
                        {lot.tipo_movimentacao && (
                          <Badge variant="outline" className="mt-2 text-xs">
                            {TIPO_MOVIMENTACAO_LABELS[lot.tipo_movimentacao] || lot.tipo_movimentacao}
                          </Badge>
                        )}
                      </div>
                      <div className="text-right text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(lot.data_inicio), "dd/MM/yyyy")}
                        </div>
                        {lot.data_fim && (
                          <div className="text-xs">
                            até {format(new Date(lot.data_fim), "dd/MM/yyyy")}
                          </div>
                        )}
                      </div>
                    </div>
                    {lot.documento_referencia && (
                      <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        {lot.documento_referencia}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Movimentações Funcionais */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <History className="h-5 w-5 text-primary" />
            Movimentações Funcionais
          </CardTitle>
        </CardHeader>
        <CardContent>
          {historico.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma movimentação registrada.</p>
          ) : (
            <div className="space-y-3">
              {historico.map((mov) => (
                <div key={mov.id} className="p-4 rounded-lg border bg-card">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge 
                          variant="outline" 
                          className={TIPO_MOVIMENTACAO_COLORS[mov.tipo] || ""}
                        >
                          {TIPO_MOVIMENTACAO_LABELS[mov.tipo] || mov.tipo}
                        </Badge>
                      </div>
                      
                      {/* Mudança de unidade */}
                      {(mov.unidade_anterior || mov.unidade_nova) && (
                        <div className="flex items-center gap-2 text-sm mb-1">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            {mov.unidade_anterior?.sigla || mov.unidade_anterior?.nome || "—"}
                          </span>
                          <ArrowRight className="h-3 w-3 text-muted-foreground" />
                          <span className="font-medium">
                            {mov.unidade_nova?.sigla || mov.unidade_nova?.nome || "—"}
                          </span>
                        </div>
                      )}
                      
                      {/* Mudança de cargo */}
                      {(mov.cargo_anterior || mov.cargo_novo) && (
                        <div className="flex items-center gap-2 text-sm">
                          <Briefcase className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            {mov.cargo_anterior?.sigla || mov.cargo_anterior?.nome || "—"}
                          </span>
                          <ArrowRight className="h-3 w-3 text-muted-foreground" />
                          <span className="font-medium">
                            {mov.cargo_novo?.sigla || mov.cargo_novo?.nome || "—"}
                          </span>
                        </div>
                      )}
                      
                      {mov.descricao && (
                        <p className="text-sm text-muted-foreground mt-2">{mov.descricao}</p>
                      )}
                      
                      {mov.portaria_numero && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Portaria nº {mov.portaria_numero}
                          {mov.portaria_data && ` de ${format(new Date(mov.portaria_data), "dd/MM/yyyy")}`}
                        </p>
                      )}
                    </div>
                    <div className="text-right text-sm text-muted-foreground">
                      <Calendar className="h-3 w-3 inline mr-1" />
                      {format(new Date(mov.data_evento), "dd/MM/yyyy")}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Férias */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <UserCheck className="h-5 w-5 text-success" />
            Histórico de Férias
          </CardTitle>
        </CardHeader>
        <CardContent>
          {ferias.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum registro de férias.</p>
          ) : (
            <div className="space-y-3">
              {ferias.map((f) => (
                <div key={f.id} className="p-3 rounded-lg border bg-success/5 border-success/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">
                        {format(new Date(f.data_inicio), "dd/MM/yyyy")} a {format(new Date(f.data_fim), "dd/MM/yyyy")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {f.dias_gozados} dias • Período aquisitivo: {format(new Date(f.periodo_aquisitivo_inicio), "dd/MM/yyyy")} a {format(new Date(f.periodo_aquisitivo_fim), "dd/MM/yyyy")}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {f.status || "Registrado"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Licenças e Afastamentos */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <UserX className="h-5 w-5 text-warning" />
            Licenças e Afastamentos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {licencas.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum registro de licença ou afastamento.</p>
          ) : (
            <div className="space-y-3">
              {licencas.map((l) => (
                <div key={l.id} className="p-3 rounded-lg border bg-warning/5 border-warning/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">
                          {l.tipo_afastamento}
                        </Badge>
                        {l.tipo_licenca && (
                          <Badge variant="secondary" className="text-xs">
                            {l.tipo_licenca}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm">
                        {format(new Date(l.data_inicio), "dd/MM/yyyy")}
                        {l.data_fim && ` a ${format(new Date(l.data_fim), "dd/MM/yyyy")}`}
                      </p>
                      {l.dias_afastamento && (
                        <p className="text-xs text-muted-foreground">{l.dias_afastamento} dias</p>
                      )}
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {l.status || "Registrado"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
