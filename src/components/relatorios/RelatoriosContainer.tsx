/**
 * Container principal dos relatórios de Gestores Escolares
 * Componente isolado - não altera nenhum arquivo existente
 */

import { useState } from 'react';
import { BarChart3, Users, MapPin, Calendar } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import RelatorioGestores from './RelatorioGestores';
import RelatorioMunicipios from './RelatorioMunicipios';
import RelatorioPeriodo from './RelatorioPeriodo';

export default function RelatoriosContainer() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-amber-500" />
          Relatórios - Gestores Escolares
        </h1>
        <p className="text-muted-foreground">
          Jogos Escolares de Roraima — Módulo de relatórios isolado
        </p>
      </div>

      {/* Aviso de permissão */}
      <div className="rounded-md border border-yellow-300 bg-yellow-50 p-3 text-sm text-yellow-800">
        ⚠️ Permissão não validada automaticamente. Este módulo utiliza acesso direto via URL.
      </div>

      {/* Abas de relatórios */}
      <Tabs defaultValue="gestores" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="gestores" className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Lista de Gestores</span>
            <span className="sm:hidden">Gestores</span>
          </TabsTrigger>
          <TabsTrigger value="municipios" className="flex items-center gap-1">
            <MapPin className="h-4 w-4" />
            <span className="hidden sm:inline">Por Município</span>
            <span className="sm:hidden">Municípios</span>
          </TabsTrigger>
          <TabsTrigger value="periodo" className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Por Período</span>
            <span className="sm:hidden">Período</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="gestores">
          <RelatorioGestores />
        </TabsContent>

        <TabsContent value="municipios">
          <RelatorioMunicipios />
        </TabsContent>

        <TabsContent value="periodo">
          <RelatorioPeriodo />
        </TabsContent>
      </Tabs>
    </div>
  );
}
