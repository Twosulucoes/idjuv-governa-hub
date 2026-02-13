// ============================================
// HOOK PARA GERENCIAMENTO DE USUÁRIOS
// ============================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { UsuarioSistema, TipoUsuario } from '@/types/usuario';
import { Modulo, AppRole } from '@/types/rbac';
import { toast } from 'sonner';

// Helper: busca todas as permissões do catálogo para os módulos e retorna inserts com permissions preenchidas
async function buildModuleInserts(userId: string, modulos: Modulo[]) {
  if (modulos.length === 0) return [];

  const { data: catalog } = await supabase
    .from('module_permissions_catalog')
    .select('module_code, permission_code')
    .in('module_code', modulos as string[]);

  const permsByModule = (catalog || []).reduce<Record<string, string[]>>((acc, c: any) => {
    if (!acc[c.module_code]) acc[c.module_code] = [];
    acc[c.module_code].push(c.permission_code);
    return acc;
  }, {});

  return modulos.map(m => ({
    user_id: userId,
    module: m,
    permissions: permsByModule[m] || [],
  }));
}

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
    }): Promise<{ authData: any; senhaTemporaria: string | null; usuarioAtualizado?: boolean }> => {
      // Buscar dados do servidor
      const { data: servidor, error: servidorError } = await supabase
        .from('servidores')
        .select('nome_completo, cpf')
        .eq('id', servidorId)
        .single();

      if (servidorError) throw new Error('Servidor não encontrado');

      // Verificar se já existe um profile com este email
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .maybeSingle();

      // Se já existe profile, atualizar permissões
      if (existingProfile) {
        const userId = existingProfile.id;

        // Atualizar o profile com servidor_id
        await supabase
          .from('profiles')
          .update({ 
            servidor_id: servidorId,
            full_name: servidor.nome_completo,
            cpf: servidor.cpf,
            tipo_usuario: 'servidor'
          })
          .eq('id', userId);

        // Upsert role
        await supabase
          .from('user_roles')
          .upsert({ user_id: userId, role }, { onConflict: 'user_id' });

        // Limpar módulos antigos e inserir novos
        await supabase
          .from('user_modules')
          .delete()
          .eq('user_id', userId);

        if (modulos.length > 0) {
          const modulosInsert = await buildModuleInserts(userId, modulos);
          await supabase.from('user_modules').insert(modulosInsert as any);
        }

        return { authData: { user: { id: userId } }, senhaTemporaria: null, usuarioAtualizado: true };
      }

      // Se não existe, tentar criar novo usuário no auth
      const senhaTemporaria = generateTempPassword();

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

      // Se auth.signUp retornar erro de "already registered", buscar pelo auth.users via RPC ou tratar
      if (authError) {
        const isAlreadyRegistered = 
          authError.message?.includes('already registered') || 
          (authError as any)?.code === 'user_already_exists';

        if (isAlreadyRegistered) {
          // Usuário existe no auth mas não tinha profile visível (RLS). Agora que RLS foi corrigido, tentar novamente.
          // Pode ser que o trigger on_auth_user_created criou o profile. Buscar novamente.
          const { data: retryProfile } = await supabase
            .from('profiles')
            .select('id')
            .eq('email', email)
            .maybeSingle();

          if (retryProfile) {
            const userId = retryProfile.id;

            await supabase
              .from('profiles')
              .update({ 
                servidor_id: servidorId,
                full_name: servidor.nome_completo,
                cpf: servidor.cpf,
                tipo_usuario: 'servidor'
              })
              .eq('id', userId);

            await supabase
              .from('user_roles')
              .upsert({ user_id: userId, role }, { onConflict: 'user_id' });

            await supabase
              .from('user_modules')
              .delete()
              .eq('user_id', userId);

            if (modulos.length > 0) {
              const modulosInsert = await buildModuleInserts(userId, modulos);
              await supabase.from('user_modules').insert(modulosInsert as any);
            }

            return { authData: { user: { id: userId } }, senhaTemporaria: null, usuarioAtualizado: true };
          }
        }
        throw authError;
      }
      
      const userId = authData.user?.id;
      if (!userId) throw new Error('Erro ao obter ID do usuário criado');

      // Atribuir role
      await supabase
        .from('user_roles')
        .insert({ user_id: userId, role });

      // Atribuir módulos com todas as permissões do catálogo
      if (modulos.length > 0) {
        const modulosInsert = await buildModuleInserts(userId, modulos);
        await supabase.from('user_modules').insert(modulosInsert as any);
      }

      return { authData, senhaTemporaria, usuarioAtualizado: false };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['usuarios-sistema'] });
      if (data.usuarioAtualizado) {
        toast.info('Usuário já existia. Permissões atualizadas com sucesso!');
      } else {
        toast.success('Usuário criado com sucesso!');
      }
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
