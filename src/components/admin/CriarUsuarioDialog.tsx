// ============================================
// DIALOG PARA CRIAR USUÁRIO A PARTIR DE SERVIDOR
// ============================================

import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useUsuarios } from '@/hooks/useUsuarios';
import { 
  UserPlus, 
  Search, 
  Loader2, 
  User,
  Mail,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { AppRole, ROLE_LABELS } from '@/types/auth';

interface CriarUsuarioDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface ServidorOption {
  id: string;
  nome_completo: string;
  cpf: string | null;
  matricula: string | null;
  cargo_nome: string | null;
  unidade_nome: string | null;
  email_pessoal: string | null;
  email_institucional: string | null;
  situacao: string;
  jaTemUsuario: boolean;
}

export const CriarUsuarioDialog: React.FC<CriarUsuarioDialogProps> = ({
  open,
  onOpenChange,
  onSuccess
}) => {
  const { toast } = useToast();
  const { criarUsuarioParaServidor } = useUsuarios();
  
  // Estados
  const [servidores, setServidores] = useState<ServidorOption[]>([]);
  const [isLoadingServidores, setIsLoadingServidores] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [selectedServidor, setSelectedServidor] = useState<ServidorOption | null>(null);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<AppRole>('user');
  const [isCreating, setIsCreating] = useState(false);

  // Carregar servidores
  const loadServidores = async () => {
    setIsLoadingServidores(true);
    try {
      // Buscar servidores ativos
      const { data: servidoresData, error: servidoresError } = await supabase
        .from('servidores')
        .select(`
          id,
          nome_completo,
          cpf,
          matricula,
          email_pessoal,
          email_institucional,
          situacao,
          cargo_atual_id,
          unidade_atual_id
        `)
        .eq('situacao', 'ativo')
        .order('nome_completo');

      if (servidoresError) throw servidoresError;

      // Buscar IDs de servidores que já têm usuário
      const { data: profiles } = await supabase
        .from('profiles')
        .select('servidor_id')
        .not('servidor_id', 'is', null);

      const servidoresComUsuario = new Set(profiles?.map(p => p.servidor_id) || []);

      // Buscar nomes de cargos e unidades
      const cargoIds = servidoresData?.filter(s => s.cargo_atual_id).map(s => s.cargo_atual_id) || [];
      const unidadeIds = servidoresData?.filter(s => s.unidade_atual_id).map(s => s.unidade_atual_id) || [];

      let cargosMap: Record<string, string> = {};
      let unidadesMap: Record<string, string> = {};

      if (cargoIds.length > 0) {
        const { data: cargos } = await supabase
          .from('cargos')
          .select('id, nome')
          .in('id', cargoIds);
        cargos?.forEach(c => { cargosMap[c.id] = c.nome; });
      }

      if (unidadeIds.length > 0) {
        const { data: unidades } = await supabase
          .from('estrutura_organizacional')
          .select('id, nome')
          .in('id', unidadeIds);
        unidades?.forEach(u => { unidadesMap[u.id] = u.nome; });
      }

      const opcoes: ServidorOption[] = (servidoresData || []).map(s => ({
        id: s.id,
        nome_completo: s.nome_completo,
        cpf: s.cpf,
        matricula: s.matricula,
        cargo_nome: s.cargo_atual_id ? cargosMap[s.cargo_atual_id] || null : null,
        unidade_nome: s.unidade_atual_id ? unidadesMap[s.unidade_atual_id] || null : null,
        email_pessoal: s.email_pessoal,
        email_institucional: s.email_institucional,
        situacao: s.situacao,
        jaTemUsuario: servidoresComUsuario.has(s.id)
      }));

      setServidores(opcoes);
    } catch (error) {
      console.error('Erro ao carregar servidores:', error);
      toast({
        variant: "destructive",
        title: "Erro ao carregar servidores",
        description: "Não foi possível carregar a lista de servidores."
      });
    } finally {
      setIsLoadingServidores(false);
    }
  };

  useEffect(() => {
    if (open) {
      loadServidores();
      setSelectedServidor(null);
      setEmail('');
      setRole('user');
      setSearchTerm('');
    }
  }, [open]);

  // Quando selecionar servidor, preencher email
  const handleSelectServidor = (servidor: ServidorOption) => {
    setSelectedServidor(servidor);
    setEmail(servidor.email_institucional || servidor.email_pessoal || '');
  };

  // Criar usuário
  const handleCriar = async () => {
    if (!selectedServidor) {
      toast({
        variant: "destructive",
        title: "Selecione um servidor",
        description: "É necessário selecionar um servidor para criar o usuário."
      });
      return;
    }

    if (!email) {
      toast({
        variant: "destructive",
        title: "Informe o email",
        description: "É necessário informar um email para o usuário."
      });
      return;
    }

    setIsCreating(true);
    try {
      await criarUsuarioParaServidor.mutateAsync({
        servidorId: selectedServidor.id,
        email,
        role
      });

      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      // Erro já tratado no hook
    } finally {
      setIsCreating(false);
    }
  };

  // Filtrar servidores
  const servidoresFiltrados = servidores.filter(s => {
    if (!searchTerm) return true;
    const termo = searchTerm.toLowerCase();
    return (
      s.nome_completo.toLowerCase().includes(termo) ||
      s.cpf?.includes(termo) ||
      s.matricula?.toLowerCase().includes(termo)
    );
  });

  // Servidores disponíveis (sem usuário)
  const servidoresDisponiveis = servidoresFiltrados.filter(s => !s.jaTemUsuario);
  const servidoresComUsuario = servidoresFiltrados.filter(s => s.jaTemUsuario);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            Criar Usuário para Servidor
          </DialogTitle>
          <DialogDescription>
            Selecione um servidor ativo para criar acesso ao sistema
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Busca */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, CPF ou matrícula..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Lista de servidores */}
          {isLoadingServidores ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : servidoresDisponiveis.length === 0 ? (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {searchTerm 
                  ? 'Nenhum servidor encontrado com os termos de busca.'
                  : 'Todos os servidores ativos já possuem usuário no sistema.'}
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto border rounded-md p-2">
              {servidoresDisponiveis.map((servidor) => (
                <div
                  key={servidor.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedServidor?.id === servidor.id
                      ? 'bg-primary/10 border-primary'
                      : 'hover:bg-accent/50'
                  }`}
                  onClick={() => handleSelectServidor(servidor)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="font-medium">{servidor.nome_completo}</div>
                        <div className="text-sm text-muted-foreground">
                          {servidor.matricula && `Mat: ${servidor.matricula}`}
                          {servidor.matricula && servidor.cargo_nome && ' • '}
                          {servidor.cargo_nome}
                        </div>
                      </div>
                    </div>
                    {selectedServidor?.id === servidor.id && (
                      <CheckCircle className="h-5 w-5 text-primary" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Servidor selecionado */}
          {selectedServidor && (
            <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <Badge variant="outline">Servidor selecionado</Badge>
                <span className="font-medium">{selectedServidor.nome_completo}</span>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email de acesso</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="email@exemplo.com"
                    className="pl-10"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  O servidor receberá um email para definir sua senha
                </p>
              </div>

              {/* Role */}
              <div className="space-y-2">
                <Label>Nível de acesso</Label>
                <Select value={role} onValueChange={(v) => setRole(v as AppRole)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">Usuário</SelectItem>
                    <SelectItem value="manager">Gerente</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleCriar} 
            disabled={!selectedServidor || !email || isCreating}
          >
            {isCreating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Criando...
              </>
            ) : (
              <>
                <UserPlus className="mr-2 h-4 w-4" />
                Criar Usuário
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
