/**
 * MODULE HUB PAGE
 * 
 * Dashboard para usuários com múltiplos módulos.
 * Mostra cards clicáveis para cada módulo autorizado.
 * 
 * @version 1.0.0
 */

import { Link } from "react-router-dom";
import { useModuleRouter, getModuleHomeRoute, MODULE_PRIORITY } from "@/hooks/useModuleRouter";
import { MODULES_CONFIG, MODULO_COR_CLASSES, type Modulo } from "@/shared/config/modules.config";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

  if (isLoading) {
    return (
      <AdminLayout title="Carregando...">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Bem-vindo ao Sistema
          </h1>
          <p className="text-muted-foreground">
            Selecione um módulo para começar
          </p>
        </div>

        {/* Módulos Recentes */}
        {recentModules.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-lg font-semibold">Acessos Recentes</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {recentModules.map((modulo) => {
                const config = MODULES_CONFIG.find(m => m.codigo === modulo);
                if (!config) return null;
                const Icon = config.icone;
                
                return (
                  <Link 
                    key={`recent-${modulo}`} 
                    to={getModuleHomeRoute(modulo)}
                    onClick={() => registerModuleAccess(modulo)}
                  >
                    <Card className="hover:shadow-md transition-all hover:-translate-y-0.5 border-l-4 border-l-primary/50">
                      <CardContent className="flex items-center gap-4 p-4">
                        <div className={cn(
                          "h-12 w-12 rounded-lg flex items-center justify-center",
                          MODULO_COR_CLASSES[config.cor]
                        )}>
                          <Icon className="h-6 w-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{config.nome}</p>
                          <p className="text-xs text-muted-foreground truncate">{config.descricao}</p>
                        </div>
                        <ArrowRight className="h-5 w-5 text-muted-foreground shrink-0" />
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* Grid de Módulos */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Seus Módulos</h2>
            </div>
            {isAdmin && (
              <Badge variant="outline" className="text-xs">
                Acesso Administrativo
              </Badge>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {sortedModules.map((modulo, index) => {
              const config = MODULES_CONFIG.find(m => m.codigo === modulo);
              if (!config) return null;
              
              const Icon = config.icone;
              
              return (
                <Link 
                  key={modulo} 
                  to={getModuleHomeRoute(modulo)}
                  onClick={() => registerModuleAccess(modulo)}
                  className="group"
                >
                  <Card 
                    className="h-full hover:shadow-lg transition-all duration-300 hover:-translate-y-1 animate-fade-in group-hover:border-primary/50"
                    style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'both' }}
                  >
                    <CardHeader className="pb-2">
                      <div className={cn(
                        "h-14 w-14 rounded-xl flex items-center justify-center mb-3 transition-transform duration-300 group-hover:scale-110",
                        MODULO_COR_CLASSES[config.cor]
                      )}>
                        <Icon className="h-7 w-7" />
                      </div>
                      <CardTitle className="text-lg group-hover:text-primary transition-colors">
                        {config.nome}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <CardDescription className="line-clamp-2">
                        {config.descricao}
                      </CardDescription>
                      <div className="mt-4 flex items-center text-sm text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                        <span>Acessar</span>
                        <ArrowRight className="h-4 w-4 ml-1 transition-transform group-hover:translate-x-1" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Estatísticas rápidas (opcional) */}
        {isAdmin && (
          <section className="mt-8 p-6 rounded-xl bg-muted/50 border">
            <h3 className="font-semibold mb-2">Visão Administrativa</h3>
            <p className="text-sm text-muted-foreground">
              Você tem acesso total a todos os {sortedModules.length} módulos do sistema como administrador.
            </p>
          </section>
        )}
      </div>
    </AdminLayout>
  );
}
