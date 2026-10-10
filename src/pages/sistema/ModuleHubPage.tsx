/**
 * MODULE HUB PAGE
 * 
 * Dashboard para usuários com múltiplos módulos.
 * Mostra cards clicáveis para cada módulo autorizado.
 * Padrões do design system: PageHeader; cartão inteiro clicável via link com
 * `after:absolute after:inset-0` (sem Card dentro de link).
 * 
 * @version 1.0.0
 */

import { Link } from "react-router-dom";
import { useModuleRouter, getModuleHomeRoute, MODULE_PRIORITY } from "@/hooks/useModuleRouter";
import { MODULES_CONFIG, MODULO_COR_CLASSES, type Modulo } from "@/shared/config/modules.config";
import { ModuleLayout } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/design-system";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, Star, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useMemo, useState } from "react";

const RECENT_MODULES_KEY = "recent-modules-v1";
const MAX_RECENT = 3;

export default function ModuleHubPage() {
  const { isLoading, authorizedModules, isAdmin } = useModuleRouter();
  const [recentModules, setRecentModules] = useState<Modulo[]>([]);

  // Carregar módulos recentes
  useEffect(() => {
    try {
      const saved = localStorage.getItem(RECENT_MODULES_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Modulo[];
        setRecentModules(parsed.filter(m => authorizedModules.includes(m)));
      }
    } catch {
      // Ignora
    }
  }, [authorizedModules]);

  // Ordenar módulos por prioridade
  const sortedModules = useMemo(() => {
    return [...authorizedModules].sort((a, b) => {
      const indexA = MODULE_PRIORITY.indexOf(a);
      const indexB = MODULE_PRIORITY.indexOf(b);
      return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
    });
  }, [authorizedModules]);

  // Registrar acesso a módulo
  const registerModuleAccess = (modulo: Modulo) => {
    try {
      const current = JSON.parse(localStorage.getItem(RECENT_MODULES_KEY) || '[]');
      const updated = [modulo, ...current.filter((m: Modulo) => m !== modulo)].slice(0, MAX_RECENT);
      localStorage.setItem(RECENT_MODULES_KEY, JSON.stringify(updated));
    } catch {
      // Ignora
    }
  };

  const cabecalho = <PageHeader titulo="Bem-vindo ao sistema" descricao="Selecione um módulo para começar" />;

  if (isLoading) {
    return (
      <ModuleLayout module="admin">
        <div className="space-y-6" aria-busy="true">
          {cabecalho}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-40 rounded-xl" />
            ))}
          </div>
        </div>
      </ModuleLayout>
    );
  }

  return (
    <ModuleLayout module="admin">
      <div className="space-y-8">
        {cabecalho}

        {/* Módulos recentes */}
        {recentModules.length > 0 && (
          <section aria-labelledby="hub-recentes">
            <div className="mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
              <h2 id="hub-recentes" className="text-h2 text-foreground">Acessos recentes</h2>
            </div>
            <ul className="grid gap-4 md:grid-cols-3">
              {recentModules.map((modulo) => {
                const config = MODULES_CONFIG.find(m => m.codigo === modulo);
                if (!config) return null;
                const Icon = config.icone;

                return (
                  <li key={`recent-${modulo}`}>
                    <Card className="relative h-full border-l-4 border-l-primary/50 transition-all hover:-translate-y-0.5 hover:shadow-md focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 motion-reduce:transition-none motion-reduce:hover:translate-y-0">
                      <CardContent className="flex items-center gap-4 p-4">
                        <div
                          className={cn(
                            "flex h-12 w-12 shrink-0 items-center justify-center rounded-lg",
                            MODULO_COR_CLASSES[config.cor]
                          )}
                          aria-hidden="true"
                        >
                          <Icon className="h-6 w-6" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <Link
                            to={getModuleHomeRoute(modulo)}
                            onClick={() => registerModuleAccess(modulo)}
                            className="block truncate font-medium text-foreground after:absolute after:inset-0 focus-visible:outline-none"
                          >
                            {config.nome}
                          </Link>
                          <p className="truncate text-caption text-muted-foreground">{config.descricao}</p>
                        </div>
                        <ArrowRight className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
                      </CardContent>
                    </Card>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {/* Grade de módulos */}
        <section aria-labelledby="hub-modulos">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-primary" aria-hidden="true" />
              <h2 id="hub-modulos" className="text-h2 text-foreground">Seus módulos</h2>
            </div>
            {isAdmin && (
              <Badge variant="outline" className="text-caption">
                Acesso administrativo
              </Badge>
            )}
          </div>

          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {sortedModules.map((modulo, index) => {
              const config = MODULES_CONFIG.find(m => m.codigo === modulo);
              if (!config) return null;

              const Icon = config.icone;

              return (
                <li key={modulo}>
                  <Card
                    className="group relative h-full animate-fade-in transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-lg focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 motion-reduce:animate-none motion-reduce:transition-none motion-reduce:hover:translate-y-0"
                    style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'both' }}
                  >
                    <CardHeader className="pb-2">
                      <div
                        className={cn(
                          "mb-3 flex h-14 w-14 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110 motion-reduce:transition-none motion-reduce:group-hover:scale-100",
                          MODULO_COR_CLASSES[config.cor]
                        )}
                        aria-hidden="true"
                      >
                        <Icon className="h-7 w-7" />
                      </div>
                      <h3 className="text-h3 text-foreground transition-colors group-hover:text-primary">
                        <Link
                          to={getModuleHomeRoute(modulo)}
                          onClick={() => registerModuleAccess(modulo)}
                          className="after:absolute after:inset-0 focus-visible:outline-none"
                        >
                          {config.nome}
                        </Link>
                      </h3>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <CardDescription className="line-clamp-2">
                        {config.descricao}
                      </CardDescription>
                      <div
                        className="mt-4 flex items-center text-body text-primary opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
                        aria-hidden="true"
                      >
                        <span>Acessar</span>
                        <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </div>
                    </CardContent>
                  </Card>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Visão administrativa */}
        {isAdmin && (
          <section aria-labelledby="hub-admin" className="rounded-xl border bg-muted/50 p-6">
            <h2 id="hub-admin" className="mb-2 text-h3 text-foreground">Visão administrativa</h2>
            <p className="text-body text-muted-foreground">
              Você tem acesso total a todos os {sortedModules.length} módulos do sistema como administrador.
            </p>
          </section>
        )}
      </div>
    </ModuleLayout>
  );
}
