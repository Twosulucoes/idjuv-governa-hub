// ============================================
// HOOK DE PERFIS (SISTEMA RBAC)
// Mapeia para as roles do novo sistema
// ============================================

import { useState, useEffect, useCallback } from 'react';
import type { Perfil, PerfilCodigo, AppRole, ROLE_LABELS } from '@/types/rbac';

// Perfis estáticos baseados nas roles do sistema
const PERFIS_ESTATICOS: Perfil[] = [
  {
    id: 'admin',
    nome: 'Super Administrador',
    codigo: 'super_admin',
    descricao: 'Acesso total ao sistema',
    pode_aprovar: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'manager',
    nome: 'Gestor',
    codigo: 'gestor',
    descricao: 'Pode aprovar processos e acessar módulos selecionados',
    pode_aprovar: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'user',
    nome: 'Servidor',
    codigo: 'servidor',
    descricao: 'Acesso aos módulos selecionados',
    pode_aprovar: false,
    created_at: new Date().toISOString(),
  },
];

export function useAdminPerfis() {
  const [perfis, setPerfis] = useState<Perfil[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // "Buscar" perfis (agora são estáticos)
  const fetchPerfis = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Perfis são agora baseados nas roles do enum
      setPerfis(PERFIS_ESTATICOS);
    } catch (err: any) {
      setError(err.message);
      console.error('Erro ao buscar perfis:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPerfis();
  }, [fetchPerfis]);

  return {
    perfis,
    perfisAtivos: perfis,
    loading,
    error,
    fetchPerfis,
  };
}
