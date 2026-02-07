// ============================================
// HOOK PARA GERENCIAMENTO DE USUÁRIOS
// ============================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { UsuarioSistema, TipoUsuario } from '@/types/usuario';
import { Modulo, AppRole } from '@/types/rbac';
import { toast } from 'sonner';

export function useUsuarios() {
  const queryClient = useQueryClient();

  // Buscar todos os usuários
  const { data: usuarios = [], isLoading, refetch } = useQuery({
    queryKey: ['usuarios-sistema'],
    queryFn: async (): Promise<UsuarioSistema[]> => {
      // Buscar profiles com dados relacionados
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          id,
          email,
          full_name,
          avatar_url,
          tipo_usuario,
          is_active,
          blocked_at,
          blocked_reason,
          cpf,
          servidor_id,
          requires_password_change,
          created_at,
          updated_at
        `)
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Buscar dados dos servidores vinculados
      const servidorIds = profiles
        ?.filter(p => p.servidor_id)
        .map(p => p.servidor_id) || [];

      let servidoresMap: Record<string, any> = {};
      if (servidorIds.length > 0) {
        const { data: servidores } = await supabase
          .from('servidores')
          .select(`
            id,
            nome_completo,
            matricula,
            situacao,
            vinculo,
            cargo_atual_id,
            unidade_atual_id
          `)
          .in('id', servidorIds);

        // Buscar nomes de cargos e unidades
        const cargoIds = servidores?.filter(s => s.cargo_atual_id).map(s => s.cargo_atual_id) || [];
        const unidadeIds = servidores?.filter(s => s.unidade_atual_id).map(s => s.unidade_atual_id) || [];

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

        servidores?.forEach(s => {
          servidoresMap[s.id] = {
            nome_completo: s.nome_completo,
            matricula: s.matricula,
            situacao: s.situacao,
            vinculo: s.vinculo,
            cargo_nome: cargosMap[s.cargo_atual_id] || null,
            unidade_nome: unidadesMap[s.unidade_atual_id] || null
          };
        });
      }

      // Buscar roles
      const { data: roles } = await supabase
        .from('user_roles')
        .select('user_id, role');

      const rolesMap: Record<string, string> = {};
      roles?.forEach(r => { rolesMap[r.user_id] = r.role; });

      // Montar resultado
      return (profiles || []).map(p => ({
        ...p,
        servidor: p.servidor_id ? servidoresMap[p.servidor_id] : undefined,
        role: rolesMap[p.id]
      })) as UsuarioSistema[];
    }
  });

  // Criar usuário para servidor (integrado com RBAC)
  const criarUsuarioParaServidor = useMutation({
    mutationFn: async ({ 
      servidorId, 
      email, 
      role = 'user',
      modulos = []
    }: { 
      servidorId: string; 
      email: string; 
      role?: AppRole;
      modulos?: Modulo[];
    }): Promise<{ authData: any; senhaTemporaria: string }> => {
      // Buscar dados do servidor
      const { data: servidor, error: servidorError } = await supabase
        .from('servidores')
        .select('nome_completo, cpf')
        .eq('id', servidorId)
        .single();

      if (servidorError) throw new Error('Servidor não encontrado');

      // Gerar senha temporária
      const senhaTemporaria = generateTempPassword();

      // Criar usuário no Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password: senhaTemporaria,
        options: {
          emailRedirectTo: `${window.location.origin}/auth`,
          data: {
            full_name: servidor.nome_completo,
            servidor_id: servidorId,
            cpf: servidor.cpf,
            tipo_usuario: 'servidor',
          }
        }
      });

      if (authError) throw authError;
      
      const userId = authData.user?.id;
      if (!userId) throw new Error('Erro ao obter ID do usuário criado');

      // Atribuir role na tabela user_roles
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role });

      if (roleError) {
        console.warn('Erro ao atribuir role:', roleError);
      }

      // Atribuir módulos na tabela user_modules
      if (modulos.length > 0) {
        const modulosInsert = modulos.map(m => ({
          user_id: userId,
          module: m
        }));
        
        const { error: modulosError } = await supabase
          .from('user_modules')
          .insert(modulosInsert);

        if (modulosError) {
          console.warn('Erro ao atribuir módulos:', modulosError);
        }
      }

      return { authData, senhaTemporaria };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios-sistema'] });
      toast.success('Usuário criado com sucesso!');
    },
    onError: (error: any) => {
      toast.error(`Erro ao criar usuário: ${error.message}`);
    }
  });

  // Criar usuário técnico
  const criarUsuarioTecnico = useMutation({
    mutationFn: async ({ 
      email, 
      fullName,
      role = 'ti_admin' 
    }: { 
      email: string; 
      fullName: string;
      role?: string;
    }) => {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password: generateTempPassword(),
        options: {
          emailRedirectTo: `${window.location.origin}/auth`,
          data: {
            full_name: fullName,
            tipo_usuario: 'tecnico',
            role: role
          }
        }
      });

      if (authError) throw authError;

      return authData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios-sistema'] });
      toast.success('Usuário técnico criado! Email de confirmação enviado.');
    },
    onError: (error: any) => {
      toast.error(`Erro ao criar usuário: ${error.message}`);
    }
  });

  // Bloquear/desbloquear usuário
  const toggleUsuarioAtivo = useMutation({
    mutationFn: async ({ userId, isActive, reason }: { userId: string; isActive: boolean; reason?: string }) => {
      const { error } = await supabase
        .from('profiles')
        .update({
          is_active: isActive,
          blocked_at: isActive ? null : new Date().toISOString(),
          blocked_reason: isActive ? null : reason
        })
        .eq('id', userId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['usuarios-sistema'] });
      toast.success(variables.isActive ? 'Usuário desbloqueado' : 'Usuário bloqueado');
    },
    onError: (error: any) => {
      toast.error(`Erro: ${error.message}`);
    }
  });

  return {
    usuarios,
    isLoading,
    refetch,
    criarUsuarioParaServidor,
    criarUsuarioTecnico,
    toggleUsuarioAtivo,
    usuariosServidores: usuarios.filter(u => u.tipo_usuario === 'servidor'),
    usuariosTecnicos: usuarios.filter(u => u.tipo_usuario === 'tecnico')
  };
}

// Gerar senha temporária
function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}
