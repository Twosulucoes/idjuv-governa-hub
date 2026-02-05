// ============================================
// TAB DE FUNÇÕES DO SISTEMA (VISUALIZAÇÃO CONSOLIDADA)
// ============================================
// Mostra todas as funções do sistema agrupadas por módulo
// indicando quais o usuário tem acesso e via qual perfil

import { useState, useEffect, useMemo } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Info, Check, X, Loader2, ChevronDown, Search, Shield } from 'lucide-react';
import { useAdminPerfis } from '@/hooks/useAdminPerfis';
import { useAdminUsuarios } from '@/hooks/useAdminUsuarios';
import { supabase } from '@/integrations/supabase/client';

interface UsuarioFuncoesTabProps {
  userId: string;
  userName?: string;
}

interface FuncaoUsuario {
  id: string;
  codigo: string;
  nome: string;
  modulo: string;
  submodulo: string | null;
  tipo_acao: string | null;
  concedida: boolean;
  perfilNome: string | null;
  perfilCor: string | null;
}

// Cores do Tailwind para módulos
const MODULO_CORES: Record<string, string> = {
  admin: 'bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200',
  workflow: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  rh: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
  contratos: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  licitacoes: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  processos: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  governanca: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
  transparencia: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
  estrutura: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  folha: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
  programas: 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200',
  unidades: 'bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200',
  auditoria: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  relatorios: 'bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-200',
  integridade: 'bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-900 dark:text-fuchsia-200',
  ascom: 'bg-lime-100 text-lime-800 dark:bg-lime-900 dark:text-lime-200',
};

// Ícones para módulos
const MODULO_ICONES: Record<string, string> = {
  admin: '⚙️',
  workflow: '🔄',
  rh: '👥',
  contratos: '📝',
  licitacoes: '🛒',
  processos: '📋',
  governanca: '⚖️',
  transparencia: '👁️',
  estrutura: '🏢',
  folha: '💵',
  programas: '📊',
  unidades: '📍',
  auditoria: '🔍',
  relatorios: '📈',
  integridade: '🛡️',
  ascom: '📰',
};

export function UsuarioFuncoesTab({ userId, userName }: UsuarioFuncoesTabProps) {
  const { usuarios } = useAdminUsuarios();
  const { perfisAtivos } = useAdminPerfis();
  const [funcoes, setFuncoes] = useState<FuncaoUsuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroModulo, setFiltroModulo] = useState<string>('todos');
  const [filtroBusca, setFiltroBusca] = useState('');
  const [apenasAtivas, setApenasAtivas] = useState(false);
  const [expandidos, setExpandidos] = useState<Set<string>>(new Set());

  const usuario = usuarios.find(u => u.id === userId);

  // Buscar todas as funções do sistema e verificar quais o usuário tem acesso
  useEffect(() => {
    const fetchFuncoes = async () => {
      if (!usuario) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const perfilIds = usuario.perfis.map(p => p.perfil_id);

        // Buscar todas as funções do sistema ativas
        const { data: todasFuncoes, error: funcError } = await supabase
          .from('funcoes_sistema')
          .select('id, codigo, nome, modulo, submodulo, tipo_acao')
          .eq('ativo', true)
          .order('modulo')
          .order('submodulo')
          .order('nome');

        if (funcError) throw funcError;

        // Buscar funções concedidas via perfis do usuário
        let funcoesConceidas: { funcao_id: string; perfil_id: string }[] = [];
        if (perfilIds.length > 0) {
          const { data: pf, error: pfError } = await supabase
            .from('perfil_funcoes')
            .select('funcao_id, perfil_id')
            .in('perfil_id', perfilIds)
            .eq('concedido', true);

          if (pfError) throw pfError;
          funcoesConceidas = pf || [];
        }

        // Mapear função_id -> perfil que concedeu
        const funcaoPerfilMap = new Map<string, { perfilId: string }>();
        funcoesConceidas.forEach(pf => {
          if (!funcaoPerfilMap.has(pf.funcao_id)) {
            funcaoPerfilMap.set(pf.funcao_id, { perfilId: pf.perfil_id });
          }
        });

        // Montar lista final com indicação de quem concedeu
        const resultado: FuncaoUsuario[] = (todasFuncoes || []).map(f => {
          const concessao = funcaoPerfilMap.get(f.id);
          const perfil = concessao 
            ? perfisAtivos.find(p => p.id === concessao.perfilId) 
            : null;

          return {
            id: f.id,
            codigo: f.codigo,
            nome: f.nome,
            modulo: f.modulo?.toLowerCase() || 'outros',
            submodulo: f.submodulo,
            tipo_acao: f.tipo_acao,
            concedida: !!concessao,
            perfilNome: perfil?.nome || null,
            perfilCor: perfil?.cor || null,
          };
        });

        setFuncoes(resultado);
        
        // Expandir módulos com funções ativas por padrão
        const modulosComAtivas = new Set(
          resultado.filter(f => f.concedida).map(f => f.modulo)
        );
        setExpandidos(modulosComAtivas);
      } catch (err) {
        console.error('Erro ao buscar funções:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchFuncoes();
  }, [usuario, perfisAtivos]);

  // Agrupar funções por módulo
  const funcoesAgrupadas = useMemo(() => {
    const grupos: Record<string, FuncaoUsuario[]> = {};

    funcoes.forEach(f => {
      // Aplicar filtros
      if (filtroModulo !== 'todos' && f.modulo !== filtroModulo) return;
      if (apenasAtivas && !f.concedida) return;
      if (filtroBusca) {
        const busca = filtroBusca.toLowerCase();
        if (!f.nome.toLowerCase().includes(busca) && 
            !f.codigo.toLowerCase().includes(busca)) return;
      }

      if (!grupos[f.modulo]) {
        grupos[f.modulo] = [];
      }
      grupos[f.modulo].push(f);
    });

    return grupos;
  }, [funcoes, filtroModulo, filtroBusca, apenasAtivas]);

  // Lista de módulos para o select
  const modulos = useMemo(() => {
    return [...new Set(funcoes.map(f => f.modulo))].sort();
  }, [funcoes]);

  // Contagem total
  const totais = useMemo(() => {
    const ativas = funcoes.filter(f => f.concedida).length;
    return { total: funcoes.length, ativas };
  }, [funcoes]);

  const toggleModulo = (modulo: string) => {
    setExpandidos(prev => {
      const novo = new Set(prev);
      if (novo.has(modulo)) {
        novo.delete(modulo);
      } else {
        novo.add(modulo);
      }
      return novo;
    });
  };

  if (!usuario) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Usuário não encontrado
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Resumo */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span className="flex items-center gap-1">
          <Shield className="h-4 w-4" />
          {totais.ativas} de {totais.total} funções ativas
        </span>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Select value={filtroModulo} onValueChange={setFiltroModulo}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Módulo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os módulos</SelectItem>
            {modulos.map(m => (
              <SelectItem key={m} value={m}>
                {MODULO_ICONES[m] || '📁'} {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar função..."
            value={filtroBusca}
            onChange={e => setFiltroBusca(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-2">
          <Checkbox
            id="apenasAtivas"
            checked={apenasAtivas}
            onCheckedChange={v => setApenasAtivas(!!v)}
          />
          <Label htmlFor="apenasAtivas" className="text-sm cursor-pointer">
            Apenas ativas
          </Label>
        </div>
      </div>

      {/* Lista agrupada por módulo */}
      <ScrollArea className="h-[400px] pr-4">
        <div className="space-y-2">
          {Object.entries(funcoesAgrupadas).sort().map(([modulo, funcoesModulo]) => {
            const ativasModulo = funcoesModulo.filter(f => f.concedida).length;
            const cor = MODULO_CORES[modulo] || 'bg-muted text-muted-foreground';
            const icone = MODULO_ICONES[modulo] || '📁';
            const isExpanded = expandidos.has(modulo);

            return (
              <Collapsible
                key={modulo}
                open={isExpanded}
                onOpenChange={() => toggleModulo(modulo)}
              >
                <CollapsibleTrigger className="w-full">
                  <div className={`flex items-center gap-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors ${
                    ativasModulo > 0 ? 'border-primary/20' : 'border-border'
                  }`}>
                    <div className="text-xl">{icone}</div>
                    <div className={`px-2 py-0.5 rounded text-xs font-medium uppercase ${cor}`}>
                      {modulo}
                    </div>
                    <div className="flex-1 text-left text-sm text-muted-foreground">
                      {ativasModulo} de {funcoesModulo.length} funções
                    </div>
                    <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  </div>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <div className="pl-4 py-2 space-y-1 border-l-2 border-muted ml-4">
                    {funcoesModulo.map(funcao => (
                      <div
                        key={funcao.id}
                        className={`flex items-center gap-2 p-2 rounded text-sm ${
                          funcao.concedida
                            ? 'bg-green-500/10 text-foreground'
                            : 'bg-muted/30 text-muted-foreground'
                        }`}
                      >
                        {funcao.concedida ? (
                          <Check className="h-4 w-4 text-green-600 shrink-0" />
                        ) : (
                          <X className="h-4 w-4 text-muted-foreground shrink-0" />
                        )}
                        
                        <div className="flex-1 min-w-0">
                          <span className="font-medium">{funcao.nome}</span>
                          {funcao.tipo_acao && (
                            <span className="text-xs text-muted-foreground ml-2">
                              ({funcao.tipo_acao})
                            </span>
                          )}
                        </div>

                        {funcao.concedida && funcao.perfilNome && (
                          <Badge
                            variant="outline"
                            className="shrink-0 text-xs"
                            style={{
                              borderColor: funcao.perfilCor || undefined,
                              color: funcao.perfilCor || undefined,
                            }}
                          >
                            {funcao.perfilNome}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            );
          })}

          {Object.keys(funcoesAgrupadas).length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma função encontrada com os filtros aplicados.
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Nota informativa */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          As funções são concedidas através dos <strong>Perfis</strong> do usuário.
          Para alterar os acessos, edite os perfis associados na aba "Perfis".
        </AlertDescription>
      </Alert>
    </div>
  );
}
