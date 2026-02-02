# FASE 4 - Portal de Transparência e LAI

## Status: 📋 PLANEJAMENTO

---

## 1. CHECKLIST DE DEPENDÊNCIAS

### ✅ Estruturas Existentes (Aproveitáveis)

| Componente | Tabela/Função | Status |
|------------|---------------|--------|
| e-SIC Base | `solicitacoes_sic` | ✅ Existe |
| Publicações LAI | `publicacoes_lai` | ✅ Existe |
| View Consulta Pública | `v_sic_consulta_publica` | ✅ Existe |
| Função Consulta Protocolo | `consultar_protocolo_sic()` | ✅ Existe |
| Hash de Solicitante | `gerar_hash_solicitante_sic()` | ✅ Existe |
| Geração de Protocolo | `gerar_protocolo_sic()` | ✅ Existe |
| Prazo 30 dias | Trigger automático | ✅ Existe |

### 🔧 Estruturas a Criar (FASE 4)

| Componente | Descrição | Prioridade |
|------------|-----------|------------|
| `historico_lai` | Registro de alterações em pedidos LAI | Alta |
| `recursos_lai` | Tabela dedicada para recursos (1ª e 2ª instância) | Alta |
| `prazos_lai` | Configuração de prazos legais por tipo | Média |
| `v_transparencia_licitacoes` | View pública de licitações | Alta |
| `v_transparencia_contratos` | View pública de contratos | Alta |
| `v_transparencia_execucao` | View pública de execução orçamentária | Alta |
| `v_transparencia_patrimonio` | View pública de bens patrimoniais | Média |
| `matriz_raci` | Matriz de responsabilidades | Média |
| `riscos_institucionais` | Mapa de riscos | Média |
| `catalogo_dados_publicos` | Catálogo LAI | Baixa |
| `debitos_tecnicos` | Registro formal de débitos | Baixa |

### 🔐 Permissões RBAC a Criar

| Código | Descrição |
|--------|-----------|
| `transparencia.visualizar` | Visualizar portal público |
| `transparencia.publicar` | Publicar dados no portal |
| `transparencia.gerenciar` | Gerenciar categorias e configurações |
| `lai.receber` | Receber pedidos de informação |
| `lai.responder` | Responder pedidos LAI |
| `lai.aprovar` | Aprovar respostas LAI |
| `lai.recurso` | Tratar recursos LAI |
| `governanca.raci` | Gerenciar matriz RACI |
| `governanca.riscos` | Gerenciar mapa de riscos |

---

## 2. PLANO DE MIGRAÇÃO

### Fase 4.1 - Estruturas Base (Migração 1)

```sql
-- 1. Tabela de histórico de pedidos LAI
CREATE TABLE public.historico_lai (...)

-- 2. Tabela de recursos LAI (1ª e 2ª instância)  
CREATE TABLE public.recursos_lai (...)

-- 3. Tabela de configuração de prazos
CREATE TABLE public.prazos_lai (...)

-- 4. Triggers de auditoria
CREATE TRIGGER trg_audit_solicitacoes_sic...
```

### Fase 4.2 - Views Públicas de Transparência (Migração 2)

```sql
-- Views públicas com filtro LGPD (sem dados pessoais)
CREATE VIEW v_transparencia_licitacoes AS ...
CREATE VIEW v_transparencia_contratos AS ...
CREATE VIEW v_transparencia_execucao AS ...
CREATE VIEW v_transparencia_patrimonio AS ...
```

### Fase 4.3 - Governança e Compliance (Migração 3)

```sql
-- Matriz RACI
CREATE TABLE public.matriz_raci (...)

-- Mapa de riscos
CREATE TABLE public.riscos_institucionais (...)

-- Catálogo de dados públicos
CREATE TABLE public.catalogo_dados_publicos (...)

-- Débitos técnicos
CREATE TABLE public.debitos_tecnicos (...)
```

### Fase 4.4 - RBAC e RLS (Migração 4)

```sql
-- Inserir novas funções no sistema
INSERT INTO public.funcoes_sistema (...)

-- Políticas RLS para views públicas
-- Políticas RLS para tabelas LAI
```

### Fase 4.5 - Frontend (Código)

| Rota | Página | Acesso |
|------|--------|--------|
| `/transparencia` | Portal principal | Público |
| `/transparencia/licitacoes` | Licitações e contratos | Público |
| `/transparencia/execucao` | Execução orçamentária | Público |
| `/transparencia/patrimonio` | Patrimônio | Público |
| `/transparencia/lai` | Portal e-SIC | Público |
| `/transparencia/lai/consulta` | Consulta de protocolo | Público |
| `/admin/lai` | Gestão de pedidos | Autenticado |
| `/admin/lai/:id` | Detalhe do pedido | Autenticado |
| `/admin/transparencia` | Gestão de publicações | Autenticado |
| `/admin/governanca/raci` | Matriz RACI | Autenticado |
| `/admin/governanca/riscos` | Mapa de riscos | Autenticado |

---

## 3. ANÁLISE DE RISCOS TÉCNICOS

### 🔴 Riscos Altos

| Risco | Descrição | Mitigação |
|-------|-----------|-----------|
| **Exposição LGPD** | Views públicas podem expor dados pessoais | Filtrar CPF, email, telefone, endereço em todas as views |
| **Views SECURITY DEFINER** | 5 views existentes com problema de segurança | Recriar como SECURITY INVOKER |
| **RLS sempre true** | Políticas permissivas em tabelas sensíveis | Revisar após migração |

### 🟡 Riscos Médios

| Risco | Descrição | Mitigação |
|-------|-----------|-----------|
| **Prazos legais** | Contagem incorreta de dias úteis | Usar função de dias úteis do PostgreSQL com feriados |
| **Conflito de schema** | Tabelas existentes podem conflitar | Usar ALTER TABLE para extensões, não DROP |
| **Performance views** | Views públicas com JOINs pesados | Criar índices apropriados |

### 🟢 Riscos Baixos

| Risco | Descrição | Mitigação |
|-------|-----------|-----------|
| **Compatibilidade** | Código existente pode quebrar | Manter nomes de colunas originais |
| **Migração de dados** | Dados existentes de LAI | Não há dados em produção ainda |

---

## 4. CONFORMIDADE LEGAL

### Lei de Acesso à Informação (LAI - Lei 12.527/2011)

- [x] Prazo de resposta: 20 dias (prorrogável por +10)
- [x] Recurso 1ª instância: 10 dias
- [x] Recurso 2ª instância: 10 dias
- [x] Classificação de sigilo
- [x] Protocolo único

### Lei de Responsabilidade Fiscal (LRF)

- [ ] Publicação de execução orçamentária
- [ ] Relatório de gestão fiscal
- [ ] Prestação de contas

### Lei 14.133/2021 (Licitações)

- [ ] Publicação de editais
- [ ] Atas de registro de preço
- [ ] Contratos e aditivos
- [ ] Medições e pagamentos

### LGPD (Lei 13.709/2018)

- [x] Anonimização de dados pessoais
- [x] Hash de documentos
- [x] Token de consulta seguro
- [ ] Termo de consentimento no formulário público

---

## 5. ORDEM DE EXECUÇÃO

1. **Migração 1**: Estruturas base LAI (historico, recursos, prazos)
2. **Migração 2**: Views públicas de transparência
3. **Migração 3**: Tabelas de governança (RACI, riscos)
4. **Migração 4**: RBAC e RLS
5. **Frontend**: Páginas públicas e administrativas

---

## 6. ESTIMATIVA

| Fase | Complexidade | Estimativa |
|------|--------------|------------|
| Migração 1 | Média | 1 iteração |
| Migração 2 | Alta | 1 iteração |
| Migração 3 | Baixa | 1 iteração |
| Migração 4 | Média | 1 iteração |
| Frontend | Alta | 2-3 iterações |

---

*Documento gerado em: Fevereiro/2026*
*Fase: PLANEJAMENTO - Aguardando aprovação*
