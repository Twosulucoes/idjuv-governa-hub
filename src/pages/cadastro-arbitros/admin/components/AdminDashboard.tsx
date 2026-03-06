import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Clock, CheckCircle2, XCircle, Trophy, Medal } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { EstatisticasArbitros } from "../arbitrosAdminService";

interface Props {
  stats?: EstatisticasArbitros;
  loading: boolean;
}

export function AdminDashboard({ stats, loading }: Props) {
  if (loading || !stats) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}><CardContent className="pt-6"><Skeleton className="h-20" /></CardContent></Card>
        ))}
      </div>
    );
  }

  const cards = [
    { title: "Total de Cadastros", value: stats.total, icon: Users, color: "text-primary", bg: "bg-primary/10" },
    { title: "Pendentes", value: stats.pendentes, icon: Clock, color: "text-amber-600", bg: "bg-amber-100" },
    { title: "Aprovados", value: stats.aprovados, icon: CheckCircle2, color: "text-green-600", bg: "bg-green-100" },
    { title: "Rejeitados", value: stats.rejeitados, icon: XCircle, color: "text-destructive", bg: "bg-destructive/10" },
  ];

  const estadual = stats.porCategoria.find(c => c.categoria === "estadual")?.count || 0;
  const nacional = stats.porCategoria.find(c => c.categoria === "nacional")?.count || 0;

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Card key={c.title}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{c.title}</p>
                    <p className="text-3xl font-bold">{c.value}</p>
                  </div>
                  <div className={`p-3 rounded-full ${c.bg}`}>
                    <Icon className={`h-6 w-6 ${c.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Categorias */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Medal className="h-4 w-4" /> Árbitros Estaduais</CardTitle></CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-primary">{estadual}</p>
            <p className="text-sm text-muted-foreground mt-1">{stats.total > 0 ? ((estadual / stats.total) * 100).toFixed(1) : 0}% do total</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Trophy className="h-4 w-4" /> Árbitros Nacionais</CardTitle></CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-primary">{nacional}</p>
            <p className="text-sm text-muted-foreground mt-1">{stats.total > 0 ? ((nacional / stats.total) * 100).toFixed(1) : 0}% do total</p>
          </CardContent>
        </Card>
      </div>

      {/* Top modalidades */}
      <Card>
        <CardHeader><CardTitle className="text-base">Top Modalidades</CardTitle></CardHeader>
        <CardContent>
          {stats.porModalidade.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem dados</p>
          ) : (
            <div className="space-y-3">
              {stats.porModalidade.map((m) => {
                const pct = stats.total > 0 ? (m.count / stats.total) * 100 : 0;
                return (
                  <div key={m.modalidade} className="flex items-center gap-3">
                    <span className="text-sm font-medium w-32 truncate">{m.modalidade}</span>
                    <div className="flex-1 bg-muted rounded-full h-2.5">
                      <div className="bg-primary h-2.5 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-sm text-muted-foreground w-10 text-right">{m.count}</span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Distribuição por sexo */}
      <Card>
        <CardHeader><CardTitle className="text-base">Distribuição por Sexo</CardTitle></CardHeader>
        <CardContent>
          <div className="flex gap-6">
            {stats.porSexo.map((s) => (
              <div key={s.sexo} className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${s.sexo === "Masculino" ? "bg-blue-500" : "bg-pink-500"}`} />
                <span className="text-sm">{s.sexo}: <strong>{s.count}</strong></span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
