/**
 * GUARD DE MÓDULO CONTRATADO (White Label — Fase 6)
 *
 * Diferença em relação ao RBAC: `ProtectedRoute` responde "você pode acessar
 * este módulo?"; este responde "esta instituição contratou este módulo?".
 *
 * São perguntas distintas e o efeito é distinto: falta de permissão manda para
 * /acesso-negado, que explica ao usuário que ele pode pedir acesso. Módulo não
 * contratado devolve 404 — para quem não contratou, a funcionalidade não
 * existe, e sugerir que existe seria vazar o catálogo do produto.
 */

import type { ReactNode } from 'react';
import { moduloHabilitado } from '@/shared/config/modules.config';
import NotFound from '@/pages/NotFound';

interface ModuloHabilitadoProps {
  codigo: string;
  children: ReactNode;
}

export function ModuloHabilitado({ codigo, children }: ModuloHabilitadoProps) {
  if (!moduloHabilitado(codigo)) {
    return <NotFound />;
  }
  return <>{children}</>;
}
