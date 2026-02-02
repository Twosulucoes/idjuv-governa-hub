// ============================================
// PÁGINA DE PERMISSÕES DO PERFIL (NOVO RBAC)
// ============================================

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { useAdminPerfis } from '@/hooks/useAdminPerfis';
import { useAdminPermissoes } from '@/hooks/useAdminPermissoes';
import { DOMINIO_LABELS } from '@/types/rbac';
import type { Perfil, Dominio } from '@/types/rbac';
import { 
  ArrowLeft, 
  Key, 
  Lock,
  Info,
  Loader2,
  Shield,
  Workflow,
  ShoppingCart,
  FileCheck,
  Users,
  Wallet,
  Package,
  Scale,
  Eye,
  Settings,
} from 'lucide-react';

// Ícones por domínio
const DOMINIO_ICONES: Record<Dominio, React.ElementType> = {
  admin: Settings,
  workflow: Workflow,
  compras: ShoppingCart,
  contratos: FileCheck,
  rh: Users,
  orcamento: Wallet,
  patrimonio: Package,
  governanca: Scale,
  transparencia: Eye,
};

export default function PerfilPermissoesPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const { perfis, buscarPermissoesDoPerfil, alternarPermissaoPerfil, saving } = useAdminPerfis();
  const { permissoes, loading: loadingPermissoes, agruparPorDominio } = useAdminPermissoes();
  
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [permissoesAtivas, setPermissoesAtivas] = useState<Set<string>>(new Set());
  const [loadingPermissoesPerfil, setLoadingPermissoesPerfil] = useState(true);

  // Buscar perfil
  useEffect(() => {
    if (id && perfis.length > 0) {
      const found = perfis.find(p => p.id === id);
      setPerfil(found || null);
    }
  }, [id, perfis]);

  // Buscar permissões do perfil
  useEffect(() => {
    if (id) {
      setLoadingPermissoesPerfil(true);
      buscarPermissoesDoPerfil(id).then(ids => {
        setPermissoesAtivas(new Set(ids));
        setLoadingPermissoesPerfil(false);
      });
    }
  }, [id, buscarPermissoesDoPerfil]);

  const handleTogglePermissao = async (permissaoId: string) => {
    if (!id) return;
    
    const tem = permissoesAtivas.has(permissaoId);
    
    // Atualizar estado otimista
    setPermissoesAtivas(prev => {
      const next = new Set(prev);
      if (tem) {
        next.delete(permissaoId);
      } else {
        next.add(permissaoId);
      }
      return next;
    });

    try {
      await alternarPermissaoPerfil(id, permissaoId, !tem);
    } catch {
      // Reverter em caso de erro
      setPermissoesAtivas(prev => {
        const next = new Set(prev);
        if (tem) {
          next.add(permissaoId);
        } else {
          next.delete(permissaoId);
        }
        return next;
      });
    }
  };

  const grupos = agruparPorDominio();
  const loading = loadingPermissoes || loadingPermissoesPerfil;

  if (!perfil && !loading) {
    return (
      <AdminLayout title="Perfil não encontrado">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">O perfil solicitado não foi encontrado.</p>
            <Button onClick={() => navigate('/admin/perfis')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para Perfis
            </Button>
          </CardContent>
        </Card>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout 
      title={`Permissões: ${perfil?.nome || 'Carregando...'}`}
      description="Gerencie as permissões deste perfil institucional"
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin/perfis')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div 
              className="w-5 h-5 rounded-full" 
              style={{ backgroundColor: perfil?.cor || '#6b7280' }}
            />
            <div>
              <h2 className="text-xl font-semibold flex items-center gap-2">
                {perfil?.nome}
                {perfil?.is_sistema && <Lock className="h-4 w-4 text-muted-foreground" />}
              </h2>
              <p className="text-sm text-muted-foreground">{perfil?.descricao}</p>
            </div>
          </div>
        </div>

        {/* Aviso institucional */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            As permissões abaixo são <strong>institucionais e finitas</strong>. 
            Ative ou desative cada permissão para este perfil. 
            Usuários associados a este perfil herdarão automaticamente as permissões ativas.
          </AlertDescription>
        </Alert>

        {/* Permissões agrupadas por domínio */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Card>
            <CardContent className="p-0">
              <Accordion type="multiple" defaultValue={Object.keys(grupos)} className="w-full">
                {Object.entries(grupos).map(([dominio, perms]) => {
                  const Icon = DOMINIO_ICONES[dominio as Dominio] || Shield;
                  const ativasNoDominio = perms.filter(p => permissoesAtivas.has(p.id)).length;
                  
                  return (
                    <AccordionItem key={dominio} value={dominio} className="border-b last:border-0">
                      <AccordionTrigger className="px-6 hover:no-underline">
                        <div className="flex items-center gap-3 w-full">
                          <Icon className="h-5 w-5 text-primary" />
                          <span className="font-semibold">
                            {DOMINIO_LABELS[dominio as Dominio] || dominio}
                          </span>
                          <Badge variant="secondary" className="ml-auto mr-4">
                            {ativasNoDominio} / {perms.length}
                          </Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-6 pb-6">
                        <div className="space-y-3">
                          {perms.map(perm => {
                            const isAtiva = permissoesAtivas.has(perm.id);
                            
                            return (
                              <div
                                key={perm.id}
                                className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
                                  isAtiva 
                                    ? 'bg-primary/5 border-primary/30' 
                                    : 'bg-card hover:bg-accent/50'
                                }`}
                              >
                                <div className="flex-1 min-w-0 pr-4">
                                  <div className="font-medium text-sm">{perm.nome}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {perm.descricao || `Código: ${perm.codigo}`}
                                  </div>
                                </div>
                                <Switch
                                  checked={isAtiva}
                                  onCheckedChange={() => handleTogglePermissao(perm.id)}
                                  disabled={saving}
                                />
                              </div>
                            );
                          })}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}
