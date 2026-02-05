// ============================================
// TAB DE DOMÍNIOS ACESSÍVEIS (BASEADO EM PERFIS)
// ============================================
// Versão simplificada: mostra quais domínios o usuário 
// tem acesso baseado nos perfis associados (RBAC)

import { useState, useEffect, useMemo } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Info, Check, X, Shield, Loader2 } from 'lucide-react';
import { useAdminPerfis } from '@/hooks/useAdminPerfis';
import { useAdminUsuarios } from '@/hooks/useAdminUsuarios';
import { supabase } from '@/integrations/supabase/client';
import { DOMINIOS, DOMINIO_LABELS, type Dominio } from '@/types/rbac';

interface UsuarioModulosTabProps {
  userId: string;
  userName?: string;
}

// Ícones para domínios
const DOMINIO_ICONES: Record<string, string> = {
  admin: '⚙️',
  workflow: '🔄',
  compras: '🛒',
  contratos: '📝',
  rh: '👥',
  orcamento: '💰',
  patrimonio: '📦',
  governanca: '⚖️',
  transparencia: '👁️',
};

// Cores do Tailwind para domínios
const DOMINIO_CORES: Record<string, string> = {
  admin: 'bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200',
  workflow: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  compras: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  contratos: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  rh: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
  orcamento: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
  patrimonio: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  governanca: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
  transparencia: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
};

export function UsuarioModulosTab({ userId, userName }: UsuarioModulosTabProps) {
  const { usuarios } = useAdminUsuarios();
  const { perfisAtivos } = useAdminPerfis();
  const [dominiosAcessiveis, setDominiosAcessiveis] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  
  const usuario = usuarios.find(u => u.id === userId);

  // Buscar permissões via RPC para determinar domínios acessíveis
  useEffect(() => {
    const fetchDominios = async () => {
      if (!usuario) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // Buscar todas as permissões concedidas ao usuário via perfis
        const perfilIds = usuario.perfis.map(p => p.perfil_id);
        
        if (perfilIds.length === 0) {
          setDominiosAcessiveis(new Set());
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('perfil_permissoes')
          .select(`
            permissao:permissoes(codigo, dominio)
          `)
          .in('perfil_id', perfilIds)
          .eq('concedido', true);

        if (error) {
          console.error('Erro ao buscar permissões:', error);
          setLoading(false);
          return;
        }

        // Extrair domínios únicos
        const dominios = new Set<string>();
        (data || []).forEach(item => {
          const permissao = item.permissao as { codigo: string; dominio: string } | null;
          if (permissao?.dominio) {
            dominios.add(permissao.dominio);
          }
        });

        setDominiosAcessiveis(dominios);
      } catch (err) {
        console.error('Erro ao buscar domínios:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDominios();
  }, [usuario]);

  // Listar perfis do usuário
  const perfisUsuario = useMemo(() => {
    if (!usuario) return [];
    return usuario.perfis
      .map(up => perfisAtivos.find(p => p.id === up.perfil_id))
      .filter(Boolean);
  }, [usuario, perfisAtivos]);

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

  const temPerfis = perfisUsuario.length > 0;

  return (
    <div className="space-y-6">
      {/* Explicação do sistema simplificado */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          O acesso a módulos é definido pelos <strong>Perfis</strong> do usuário.
          Configure os perfis na aba "Perfis" para conceder ou revogar acessos.
        </AlertDescription>
      </Alert>

      {/* Perfis associados */}
      <div>
        <h4 className="font-medium mb-3 flex items-center gap-2">
          <Shield className="h-4 w-4" />
          Perfis de {userName || 'este usuário'}
        </h4>
        
        {temPerfis ? (
          <div className="flex flex-wrap gap-2">
            {perfisUsuario.map(perfil => (
              <Badge 
                key={perfil!.id}
                variant="secondary"
                className="py-1 px-3"
                style={{ 
                  borderColor: perfil!.cor || undefined,
                  borderWidth: perfil!.cor ? 2 : 0
                }}
              >
                {perfil!.nome}
              </Badge>
            ))}
          </div>
        ) : (
          <Alert variant="destructive" className="mt-2">
            <X className="h-4 w-4" />
            <AlertDescription>
              Nenhum perfil associado. O usuário não tem acesso a nenhum módulo do sistema.
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Domínios acessíveis */}
      <div>
        <h4 className="font-medium mb-3">Domínios Acessíveis</h4>
        
        <ScrollArea className="h-[300px] pr-4">
          <div className="space-y-2">
            {DOMINIOS.map((dominio: Dominio) => {
              const temAcesso = dominiosAcessiveis.has(dominio);
              const cor = DOMINIO_CORES[dominio] || 'bg-muted text-muted-foreground';
              const icone = DOMINIO_ICONES[dominio] || '📁';
              const label = DOMINIO_LABELS[dominio] || dominio;
              
              return (
                <div
                  key={dominio}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                    temAcesso 
                      ? 'bg-primary/5 border-primary/20' 
                      : 'bg-muted/20 opacity-50'
                  }`}
                >
                  <div className="text-xl">{icone}</div>
                  
                  <div className={`px-2 py-0.5 rounded text-xs font-medium uppercase ${cor}`}>
                    {dominio}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{label}</div>
                  </div>
                  
                  {temAcesso ? (
                    <Check className="h-5 w-5 text-primary shrink-0" />
                  ) : (
                    <X className="h-5 w-5 text-muted-foreground shrink-0" />
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </div>

      {/* Nota informativa */}
      <p className="text-xs text-muted-foreground text-center">
        Para alterar os acessos, associe ou remova perfis na aba "Perfis".
      </p>
    </div>
  );
}
