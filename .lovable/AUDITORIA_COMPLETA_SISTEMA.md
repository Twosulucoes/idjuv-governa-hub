# AUDITORIA TÉCNICA COMPLETA - SISTEMA IDJUV
> Gerada em: 2026-02-02 | Engenheiro Líder

---

## A) TABELA: FASE × STATUS (BANCO / BACKEND / FRONTEND / USO)

| FASE | DESCRIÇÃO | BANCO | BACKEND | FRONTEND | USO REAL |
|------|-----------|-------|---------|----------|----------|
| **1-2** | Sistema/RBAC + Governança | ✅ 100% | ✅ 100% | ✅ 100% | ✅ Em uso |
| **3** | RH (Servidores, Frequência) | ✅ 100% | ✅ 100% | ✅ 100% | ✅ 83 servidores |
| **4** | Folha de Pagamento | ✅ 100% | ✅ 100% | ⚠️ Bloqueado | ⚠️ 4 folhas (teste) |
| **5a** | Licitações/Orçamento | ✅ 100% | ⚠️ 70% | ⚠️ Placeholders | ❌ 0 registros |
| **5b** | LAI/Transparência | ✅ 100% | ⚠️ 80% | ✅ Público | ❌ 0 solicitações |
| **5c** | ASCOM | ✅ 100% | ✅ 100% | ✅ 100% | ✅ Em uso |
| **5d** | Federações | ✅ 100% | ✅ 100% | ✅ 100% | ✅ 16 federações |
| **6** | Workflow (SEI-like) | ✅ 100% | ✅ 95% | ✅ 95% | ❌ 0 processos |

---

## B) DETALHAMENTO POR FASE

### FASE 1-2: SISTEMA/RBAC + GOVERNANÇA

#### Tabelas (17 tabelas principais)
| Tabela | RLS | FORCE | Policies | Registros |
|--------|-----|-------|----------|-----------|
| `perfis` | ✅ | ✅ | 4 | 7 |
| `funcoes_sistema` | ✅ | ✅ | 3 | 141 |
| `perfil_funcoes` | ✅ | ✅ | 4 | 141 |
| `usuario_perfis` | ✅ | ✅ | 4 | 7 |
| `profiles` | ✅ | ✅ | 4 | 7 |
| `user_roles` | ✅ | ✅ | 3 | 0 |
| `estrutura_organizacional` | ✅ | ❌ | 2 | 43 |
| `cargos` | ✅ | ❌ | 2 | 16 |
| `composicao_cargos` | ✅ | ❌ | 2 | 50 |
| `documentos` | ✅ | ✅ | 4 | 5 |

#### Funções RBAC
- `usuario_tem_permissao(uuid, varchar)` → ✅ Validação hierárquica
- `usuario_eh_admin(uuid)` → ✅ Verificação de admin
- `usuario_eh_super_admin(uuid)` → ✅ Verificação de super_admin
- `listar_permissoes_usuario(uuid)` → ✅ Lista permissões

#### Backend (Hooks)
- ✅ `usePerfis.ts` - CRUD de perfis
- ✅ `useFuncoesSistema.ts` - CRUD de funções
- ✅ `usePerfilFuncoes.ts` - Gestão de permissões
- ✅ `useUsuarioPerfis.ts` - Associação usuário-perfil
- ✅ `usePermissions.ts` - Verificação de permissões
- ✅ `useMenuDinamico.ts` - Menu baseado em permissões

#### Frontend (Páginas)
- ✅ `/admin/perfis` → GestaoPerfilPage.tsx
- ✅ `/admin/usuarios` → GerenciamentoUsuariosPage.tsx
- ✅ `/governanca/*` → 6 rotas mapeadas

---

### FASE 3: RH (SERVIDORES, FREQUÊNCIA)

#### Tabelas (12 tabelas principais)
| Tabela | RLS | FORCE | Policies | Registros |
|--------|-----|-------|----------|-----------|
| `servidores` | ✅ | ✅ | 4 | 83 |
| `provimentos` | ✅ | ✅ | 4 | 82 |
| `cessoes` | ✅ | ✅ | 4 | 0 |
| `ferias_servidor` | ✅ | ✅ | 4 | 0 |
| `licencas_afastamentos` | ✅ | ✅ | 4 | 0 |
| `lotacoes` | ✅ | ✅ | 4 | 0 |
| `frequencia_mensal` | ✅ | ❌ | 3 | 163 |
| `frequencia_arquivos` | ✅ | ❌ | 2 | 247 |
| `frequencia_pacotes` | ✅ | ❌ | 3 | 3 |
| `designacoes` | ✅ | ❌ | 2 | 0 |
| `dependentes_irrf` | ✅ | ✅ | 4 | 0 |

#### Backend (Hooks)
- ✅ `useServidorCompleto.ts` - CRUD completo
- ✅ `useFrequencia.ts` - Gestão de frequência
- ✅ `useFrequenciaPacotes.ts` - Pacotes SEI
- ✅ `useDesignacoes.ts` - Designações
- ✅ `usePortarias.ts` - Central de portarias

#### Frontend (Páginas)
- ✅ `/rh/servidores` → GestaoServidoresPage.tsx
- ✅ `/rh/servidores/:id` → ServidorDetalhePage.tsx
- ✅ `/rh/frequencia` → GestaoFrequenciaPage.tsx
- ✅ `/rh/frequencia/pacotes` → ControlePacotesFrequenciaPage.tsx
- ✅ `/rh/portarias` → CentralPortariasPage.tsx

---

### FASE 4: FOLHA DE PAGAMENTO

#### Tabelas (9 tabelas principais)
| Tabela | RLS | FORCE | Policies | Registros |
|--------|-----|-------|----------|-----------|
| `folhas_pagamento` | ✅ | ✅ | 4 | 4 |
| `fichas_financeiras` | ✅ | ✅ | 4 | 82 |
| `rubricas` | ✅ | ❌ | 3 | 14 |
| `lancamentos_folha` | ✅ | ✅ | 4 | 0 |
| `consignacoes` | ✅ | ✅ | 4 | 0 |
| `eventos_esocial` | ✅ | ❌ | 2 | 0 |
| `tabela_inss` | ✅ | ❌ | 2 | 0 |
| `tabela_irrf` | ✅ | ❌ | 2 | 5 |
| `parametros_folha` | ✅ | ❌ | 2 | 7 |

#### Funções de Cálculo
- ✅ `calcular_inss_servidor(numeric, date)` - Cálculo progressivo
- ✅ `calcular_irrf(numeric, date)` - Cálculo com faixas
- ✅ `processar_folha_pagamento(uuid)` - Processamento completo
- ✅ `get_parametro_vigente(varchar, date)` - Busca parâmetros

#### Backend (Hooks)
- ✅ `useFolhaPagamento.ts` - CRUD + processamento

#### Frontend (Páginas)
- ⚠️ `/folha/*` → FolhaBloqueadaPage.tsx (BLOQUEADO)

**Status**: Implementação técnica 100% concluída, bloqueado por decisão institucional para validação jurídica.

---

### FASE 5: LICITAÇÕES / LAI / ASCOM / FEDERAÇÕES

#### 5a) Licitações e Orçamento
| Tabela | RLS | FORCE | Registros | Status |
|--------|-----|-------|-----------|--------|
| `processos_licitatorios` | ✅ | ✅ | 0 | Estrutura pronta |
| `contratos` | ✅ | ❌ | 0 | Estrutura pronta |
| `empenhos` | ✅ | ❌ | 0 | Estrutura pronta |
| `dotacoes_orcamentarias` | ✅ | ❌ | 0 | Estrutura pronta |
| `fornecedores` | ✅ | ❌ | 0 | Estrutura pronta |

**Pendências**:
- ❌ Hook `useLicitacoes.ts` não existe
- ❌ Hook `useContratos.ts` não existe
- ⚠️ Páginas são placeholders

#### 5b) LAI/Transparência
| Tabela | RLS | FORCE | Registros | Status |
|--------|-----|-------|-----------|--------|
| `solicitacoes_sic` | ✅ | ✅ | 0 | Funcional |
| `historico_lai` | ✅ | ❌ | 0 | ⚠️ SEM POLICIES |
| `prazos_lai` | ✅ | ❌ | 5 | ⚠️ SEM POLICIES |
| `recursos_lai` | ✅ | ❌ | 0 | ⚠️ SEM POLICIES |

**Pendências**:
- ⚠️ 3 tabelas LAI SEM policies (RLS habilitado mas sem regras)

#### 5c) ASCOM
| Tabela | RLS | FORCE | Registros | Status |
|--------|-----|-------|-----------|--------|
| `demandas_ascom` | ✅ | ✅ | 1 | ✅ Funcional |
| `demandas_ascom_anexos` | ✅ | ❌ | 1 | ✅ Funcional |
| `demandas_ascom_comentarios` | ✅ | ❌ | 4 | ✅ Funcional |
| `demandas_ascom_entregaveis` | ✅ | ❌ | 1 | ✅ Funcional |

#### 5d) Federações
| Tabela | RLS | FORCE | Registros | Status |
|--------|-----|-------|-----------|--------|
| `federacoes_esportivas` | ✅ | ✅ | 16 | ✅ Funcional |
| `calendario_federacao` | ✅ | ✅ | 0 | ✅ Funcional |

---

### FASE 6: WORKFLOW (SEI-LIKE)

#### Tabelas (6 tabelas)
| Tabela | RLS | FORCE | Policies | Status |
|--------|-----|-------|----------|--------|
| `processos_administrativos` | ✅ | ✅ | 4 | ✅ Funcional |
| `movimentacoes_processo` | ✅ | ✅ | 4 | ✅ Funcional |
| `despachos` | ✅ | ✅ | 4 | ✅ Funcional |
| `documentos_processo` | ✅ | ✅ | 4 | ✅ Funcional |
| `prazos_processo` | ✅ | ✅ | 4 | ✅ Funcional |
| `acesso_processo_sigiloso` | ✅ | ✅ | 2 | ✅ Funcional |

#### Permissões Workflow (100% vinculadas ao super_admin)
| Código | Concedido |
|--------|-----------|
| `workflow.visualizar` | ✅ |
| `workflow.criar` | ✅ |
| `workflow.tramitar` | ✅ |
| `workflow.despachar` | ✅ |
| `workflow.concluir` | ✅ |
| `workflow.arquivar` | ✅ |
| `workflow.admin` | ✅ |

#### Backend (Hooks)
- ✅ `useWorkflow.ts` - CRUD + tramitação + despachos

#### Frontend (Páginas)
- ✅ `/workflow/processos` → GestaoProcessosPage.tsx
- ✅ `/workflow/processos/:id` → ProcessoDetalhePage.tsx

#### Rotas em App.tsx
```tsx
// ✅ ROTAS JÁ CONFIGURADAS (linhas 472-481)
<Route path="/workflow/processos" element={
  <ProtectedRoute requiredPermissions="workflow.visualizar">
    <GestaoProcessosPage />
  </ProtectedRoute>
} />
<Route path="/workflow/processos/:id" element={
  <ProtectedRoute requiredPermissions="workflow.visualizar">
    <ProcessoDetalhePage />
  </ProtectedRoute>
} />
```

---

## C) VULNERABILIDADES DE SEGURANÇA

### C.1) Tabelas com RLS SEM POLICIES (4 tabelas)

| Tabela | Impacto | Solução |
|--------|---------|---------|
| `debitos_tecnicos` | Baixo | Criar policy admin-only |
| `historico_lai` | Alto | Criar policies CRUD |
| `prazos_lai` | Médio | Criar policies SELECT |
| `recursos_lai` | Alto | Criar policies CRUD |

### C.2) Policies "Sempre TRUE" (SELECT público)

Existem **47 policies** com `USING (true)` para SELECT. Isso é **INTENCIONAL** para:
- Dados públicos (transparência, cargos, estrutura)
- Leitura permitida para autenticados

**⚠️ ATENÇÃO**: As seguintes têm `true` para operações WRITE (problema):

| Tabela | Policy | Operação | Risco |
|--------|--------|----------|-------|
| `calendario_federacao` | Autenticados podem gerenciar | ALL | ⚠️ Alto |
| `federacoes_esportivas` | Autenticados podem atualizar | UPDATE | ⚠️ Alto |
| `federacoes_esportivas` | Autenticados podem excluir | DELETE | ⚠️ Alto |

### C.3) Views com SECURITY DEFINER

Nenhuma view usa SECURITY DEFINER (todas são INVOKER). ✅

### C.4) Funções sem search_path

| Função | Status |
|--------|--------|
| `gerar_codigo_pre_cadastro` | ⚠️ Sem search_path |
| `gerar_link_frequencia` | ⚠️ Sem search_path |
| `count_dependentes_irrf` | ⚠️ Sem search_path |
| `get_parametro_vigente(text, date)` | ⚠️ Sem search_path |

---

## D) LISTA DE PENDÊNCIAS PRIORIZADAS

### PRIORIDADE ALTA (Segurança)

| # | Tarefa | Arquivos | Critério de Aceite |
|---|--------|----------|-------------------|
| 1 | Criar policies para tabelas LAI | SQL Migration | historico_lai, prazos_lai, recursos_lai com policies deny-by-default |
| 2 | Criar policy para debitos_tecnicos | SQL Migration | Apenas admin pode CRUD |
| 3 | Corrigir policies federacoes_esportivas | SQL Migration | UPDATE/DELETE apenas com permissão |
| 4 | Adicionar search_path às 4 funções | SQL Migration | Todas funções com SET search_path = public |

### PRIORIDADE MÉDIA (Funcionalidade)

| # | Tarefa | Arquivos | Critério de Aceite |
|---|--------|----------|-------------------|
| 5 | Criar hook useLicitacoes.ts | src/hooks/useLicitacoes.ts | CRUD processos_licitatorios |
| 6 | Criar hook useContratos.ts | src/hooks/useContratos.ts | CRUD contratos |
| 7 | Implementar tela Licitações | src/pages/licitacoes/ | Listagem + filtros + CRUD |
| 8 | Implementar tela Contratos | src/pages/contratos/ | Listagem + filtros + CRUD |

### PRIORIDADE BAIXA (Melhorias)

| # | Tarefa | Arquivos | Critério de Aceite |
|---|--------|----------|-------------------|
| 9 | Adicionar rotas Matriz RACI completa | src/pages/governanca/ | Edição + histórico |
| 10 | Adicionar rotas Riscos | src/pages/governanca/ | Cadastro + avaliações |
| 11 | Testes smoke RLS | supabase/tests/ | SELECT/INSERT/UPDATE/DELETE por perfil |
| 12 | Testes workflow | supabase/tests/ | criar→tramitar→despachar→arquivar |

---

## E) PATCHES SQL IDEMPOTENTES

### E.1) Policies para tabelas LAI

```sql
-- =============================================
-- PATCH: Policies para tabelas LAI (idempotente)
-- =============================================

-- historico_lai
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'historico_lai' AND policyname = 'historico_lai_select') THEN
    CREATE POLICY historico_lai_select ON public.historico_lai FOR SELECT USING (
      usuario_tem_permissao(auth.uid(), 'transparencia.lai.visualizar')
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'historico_lai' AND policyname = 'historico_lai_insert') THEN
    CREATE POLICY historico_lai_insert ON public.historico_lai FOR INSERT WITH CHECK (
      usuario_tem_permissao(auth.uid(), 'transparencia.lai.responder')
    );
  END IF;
END $$;

-- prazos_lai
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'prazos_lai' AND policyname = 'prazos_lai_select') THEN
    CREATE POLICY prazos_lai_select ON public.prazos_lai FOR SELECT USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'prazos_lai' AND policyname = 'prazos_lai_all') THEN
    CREATE POLICY prazos_lai_all ON public.prazos_lai FOR ALL USING (
      usuario_eh_admin(auth.uid())
    );
  END IF;
END $$;

-- recursos_lai
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'recursos_lai' AND policyname = 'recursos_lai_select') THEN
    CREATE POLICY recursos_lai_select ON public.recursos_lai FOR SELECT USING (
      usuario_tem_permissao(auth.uid(), 'transparencia.lai.visualizar')
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'recursos_lai' AND policyname = 'recursos_lai_insert') THEN
    CREATE POLICY recursos_lai_insert ON public.recursos_lai FOR INSERT WITH CHECK (
      usuario_tem_permissao(auth.uid(), 'transparencia.lai.recurso')
    );
  END IF;
END $$;
```

### E.2) Policy para debitos_tecnicos

```sql
-- =============================================
-- PATCH: Policy para debitos_tecnicos (idempotente)
-- =============================================

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'debitos_tecnicos' AND policyname = 'debitos_tecnicos_admin') THEN
    CREATE POLICY debitos_tecnicos_admin ON public.debitos_tecnicos FOR ALL USING (
      usuario_eh_admin(auth.uid())
    );
  END IF;
END $$;
```

### E.3) Corrigir policies federacoes_esportivas

```sql
-- =============================================
-- PATCH: Corrigir policies federacoes (idempotente)
-- =============================================

-- Remover policies permissivas
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar federações" ON public.federacoes_esportivas;
DROP POLICY IF EXISTS "Usuários autenticados podem excluir federações" ON public.federacoes_esportivas;

-- Criar policies seguras
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'federacoes_esportivas' AND policyname = 'federacoes_update_seguro') THEN
    CREATE POLICY federacoes_update_seguro ON public.federacoes_esportivas FOR UPDATE USING (
      usuario_tem_permissao(auth.uid(), 'federacoes.editar')
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'federacoes_esportivas' AND policyname = 'federacoes_delete_seguro') THEN
    CREATE POLICY federacoes_delete_seguro ON public.federacoes_esportivas FOR DELETE USING (
      usuario_eh_admin(auth.uid())
    );
  END IF;
END $$;
```

### E.4) Adicionar search_path às funções

```sql
-- =============================================
-- PATCH: Adicionar search_path às funções (idempotente)
-- =============================================

CREATE OR REPLACE FUNCTION public.gerar_codigo_pre_cadastro()
RETURNS text
LANGUAGE plpgsql
SET search_path = public
AS $function$
DECLARE
  ano TEXT;
  sequencia INTEGER;
  codigo TEXT;
BEGIN
  ano := EXTRACT(YEAR FROM NOW())::TEXT;
  
  SELECT COALESCE(MAX(
    CASE 
      WHEN codigo_acesso LIKE 'PC-' || ano || '-%' 
      THEN NULLIF(SPLIT_PART(codigo_acesso, '-', 3), '')::INTEGER 
      ELSE 0 
    END
  ), 0) + 1
  INTO sequencia
  FROM public.pre_cadastros
  WHERE codigo_acesso LIKE 'PC-' || ano || '-%';
  
  codigo := 'PC-' || ano || '-' || LPAD(sequencia::TEXT, 4, '0');
  
  RETURN codigo;
END;
$function$;

CREATE OR REPLACE FUNCTION public.gerar_link_frequencia()
RETURNS text
LANGUAGE plpgsql
SET search_path = public
AS $function$
DECLARE
  novo_link TEXT;
BEGIN
  novo_link := encode(gen_random_bytes(16), 'hex');
  RETURN novo_link;
END;
$function$;

CREATE OR REPLACE FUNCTION public.count_dependentes_irrf(p_servidor_id uuid, p_data date DEFAULT CURRENT_DATE)
RETURNS integer
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $function$
BEGIN
  RETURN COALESCE((
    SELECT COUNT(*)::INTEGER
    FROM dependentes_irrf
    WHERE servidor_id = p_servidor_id
      AND ativo = true
      AND deduz_irrf = true
      AND data_inicio_deducao <= p_data
      AND (data_fim_deducao IS NULL OR data_fim_deducao >= p_data)
  ), 0);
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_parametro_vigente(p_tipo text, p_data date DEFAULT CURRENT_DATE)
RETURNS numeric
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $function$
BEGIN
  RETURN COALESCE((
    SELECT valor
    FROM parametros_folha
    WHERE tipo_parametro = p_tipo
      AND ativo = true
      AND vigencia_inicio <= p_data
      AND (vigencia_fim IS NULL OR vigencia_fim >= p_data)
    ORDER BY vigencia_inicio DESC
    LIMIT 1
  ), 0);
END;
$function$;
```

### E.5) Vincular permissões workflow ao super_admin (já vinculadas - verificação)

```sql
-- =============================================
-- VERIFICAÇÃO: Permissões workflow já vinculadas
-- =============================================

-- As 7 permissões workflow.* JÁ ESTÃO vinculadas ao super_admin:
-- workflow.visualizar ✅
-- workflow.criar ✅
-- workflow.tramitar ✅
-- workflow.despachar ✅
-- workflow.concluir ✅
-- workflow.arquivar ✅
-- workflow.admin ✅

-- NENHUMA AÇÃO NECESSÁRIA
```

---

## F) RESUMO EXECUTIVO

### Status Geral: 87% FUNCIONAL

| Métrica | Valor |
|---------|-------|
| Tabelas com RLS | 142/142 (100%) |
| Tabelas com FORCE RLS | 32/142 (23%) |
| Tabelas com policies | 138/142 (97%) |
| Funções com search_path | 58/62 (94%) |
| Views SECURITY INVOKER | 8/8 (100%) |
| Hooks implementados | 33/35 (94%) |
| Rotas protegidas | 95% |

### Próximos Passos
1. Executar patches SQL de segurança (15 min)
2. Implementar hooks Licitações/Contratos (2h)
3. Criar páginas funcionais Licitações (4h)
4. Testes de RLS por perfil (1h)
5. Ativar módulo Folha após validação jurídica

---

*Documento gerado automaticamente pelo sistema de auditoria IDJUV*
