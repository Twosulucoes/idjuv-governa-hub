import { ModuleLayout } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";
import { PageHeader } from "@/components/design-system";
import { ComponentesDemo } from "./design-system/ComponentesDemo";

/**
 * Vitrine do design system: mostra os tokens e componentes base com o tema do
 * tenant ativo, em claro e escuro. Serve de referência visual para a
 * reformulação (docs/superpowers/specs/2026-10-09-design-system-design.md).
 * Página estática: não lê dados.
 */

const CORES_MARCA = [
  { token: "primary", nome: "Primária" },
  { token: "secondary", nome: "Secundária" },
  { token: "accent", nome: "Accent" },
  { token: "highlight", nome: "Destaque" },
] as const;

const CORES_ESTADO = [
  { token: "success", nome: "Sucesso", Icone: CheckCircle2 },
  { token: "warning", nome: "Alerta", Icone: AlertTriangle },
  { token: "info", nome: "Informação", Icone: Info },
  { token: "destructive", nome: "Erro", Icone: XCircle },
] as const;

const NEUTROS = ["background", "card", "muted", "border", "input"] as const;

const GRAFICOS = [1, 2, 3, 4, 5, 6, 7, 8] as const;

const ESCALA = [
  { classe: "text-display", uso: "Título do portal" },
  { classe: "text-h1", uso: "Título de página" },
  { classe: "text-h2", uso: "Seção" },
  { classe: "text-h3", uso: "Card, grupo de formulário" },
  { classe: "text-body-lg", uso: "Portal, textos longos" },
  { classe: "text-body", uso: "Corpo do sistema" },
  { classe: "text-caption", uso: "Metadado e legenda" },
] as const;

function Amostra({ token, nome }: { token: string; nome: string }) {
  return (
    <div className="space-y-2">
      <div
        className="h-16 rounded-md border border-border flex items-end p-2 text-caption font-medium"
        style={{
          backgroundColor: `hsl(var(--${token}))`,
          color: `hsl(var(--${token}-foreground, var(--foreground)))`,
        }}
      >
        Aa
      </div>
      <div>
        <p className="text-body font-medium">{nome}</p>
        <p className="text-caption text-muted-foreground font-mono">--{token}</p>
      </div>
    </div>
  );
}

export default function DesignSystemPage() {
  return (
    <ModuleLayout module="admin">
      <div className="max-w-6xl mx-auto space-y-8">
        <PageHeader
          migalhas={[{ rotulo: "Administração", href: "/admin" }, { rotulo: "Design System" }]}
          titulo="Design System"
          descricao="Tokens e componentes de padrão com o tema da instituição ativa. Alterne claro/escuro para conferir os dois modos."
        />

        <Card>
          <CardHeader>
            <CardTitle className="text-h2">Cores da marca</CardTitle>
            <CardDescription>Vêm do perfil do tenant; o texto sobre cada cor tem contraste mínimo de 4,5:1.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {CORES_MARCA.map((c) => (
              <Amostra key={c.token} token={c.token} nome={c.nome} />
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-h2">Estados</CardTitle>
            <CardDescription>
              Preenchimento (<code className="font-mono">bg-*</code>), texto (<code className="font-mono">text-*</code>) e
              badge suave. Status sempre com texto e ícone, nunca só cor.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {CORES_ESTADO.map((c) => (
                <Amostra key={c.token} token={c.token} nome={c.nome} />
              ))}
            </div>
            <div className="flex flex-wrap gap-4">
              <span className="text-success font-medium">text-success</span>
              <span className="text-warning font-medium">text-warning</span>
              <span className="text-info font-medium">text-info</span>
              <span className="text-destructive font-medium">text-destructive</span>
              <span className="text-accent font-medium">text-accent</span>
              <span className="text-secondary font-medium">text-secondary</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="badge-concluido inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-caption font-medium">
                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" /> Concluído
              </span>
              <span className="badge-pendente inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-caption font-medium">
                <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" /> Pendente
              </span>
              <span className="badge-andamento inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-caption font-medium">
                <Info className="h-3.5 w-3.5" aria-hidden="true" /> Em andamento
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-h2">Neutros e gráficos</CardTitle>
            <CardDescription>Neutros são do produto (não variam por tenant). Gráficos usam a série --chart-1 a --chart-8.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {NEUTROS.map((t) => (
                <Amostra key={t} token={t} nome={t} />
              ))}
            </div>
            <div className="flex flex-wrap gap-2" role="list" aria-label="Série de cores de gráfico">
              {GRAFICOS.map((n) => (
                <div key={n} role="listitem" className="flex items-center gap-2 rounded-md border border-border px-2 py-1">
                  <span className="h-4 w-4 rounded-sm" style={{ backgroundColor: `hsl(var(--chart-${n}))` }} />
                  <span className="text-caption font-mono">--chart-{n}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-h2">Tipografia</CardTitle>
            <CardDescription>IBM Plex Sans; corpo do sistema em 14px, nada abaixo de 12px.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {ESCALA.map((e) => (
              <div key={e.classe} className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-6 border-b border-border pb-3 last:border-0">
                <span className="text-caption text-muted-foreground font-mono sm:w-32 shrink-0">{e.classe}</span>
                <span className={e.classe}>{e.uso}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <ComponentesDemo />
      </div>
    </ModuleLayout>
  );
}
