# RELATÓRIO FINAL DO SISTEMA DE RECURSOS HUMANOS
## Instituto de Desenvolvimento da Juventude e Esportes de Roraima (IDJuv)

**Versão:** 1.0  
**Data de Emissão:** 03 de Fevereiro de 2026  
**Classificação:** Documento Técnico-Executivo  

---

## SUMÁRIO EXECUTIVO

Este documento apresenta a descrição técnica e executiva do Sistema de Recursos Humanos do Instituto de Desenvolvimento da Juventude e Esportes de Roraima (IDJuv). O sistema foi desenvolvido para atender às necessidades de gestão de pessoal, controle de frequência, processamento de folha de pagamento e governança institucional.

A solução implementa uma arquitetura de três camadas (Banco de Dados, Backend e Frontend) com foco em:
- **Segurança**: Controle de acesso baseado em permissões (RBAC) e Row Level Security (RLS)
- **Governança**: Auditoria completa de operações e rastreabilidade
- **Parametrização**: Configurações dinâmicas via banco de dados
- **Conformidade Legal**: Aderência às normas trabalhistas e previdenciárias

---

## 1. VISÃO GERAL DA ARQUITETURA

### 1.1 Separação de Camadas

O sistema adota uma arquitetura moderna baseada em três camadas claramente definidas:

| Camada | Tecnologia | Responsabilidade |
|--------|------------|------------------|
| **Banco de Dados** | PostgreSQL (Supabase) | Persistência, RLS, triggers, funções RPC |
| **Backend** | Edge Functions (Deno) + RPC | Regras de negócio, cálculos, integrações |
| **Frontend** | React + TypeScript | Interface de usuário, consumo de APIs |

### 1.2 Princípio de Parametrização

O sistema foi projetado com foco em **configuração via banco de dados**, eliminando valores hardcoded para:
- Tipos de servidor e situações funcionais
- Regimes de trabalho e jornadas
- Rubricas e incidências da folha de pagamento
- Tabelas de INSS e IRRF
- Calendário oficial e dias não úteis

Cada módulo implementa mecanismos de **fallback** que garantem funcionamento mesmo na ausência de configurações específicas no banco.

### 1.3 Motores de Cálculo

Dois motores especializados processam regras complexas:

| Motor | Arquivo | Responsabilidade |
|-------|---------|------------------|
| **Frequência** | `frequenciaCalculoService.ts` | Cálculo de dias úteis, horas trabalhadas, faltas e abonos |
| **Folha** | `folhaCalculoService.ts` | Processamento de rubricas, INSS, IRRF, encargos patronais |

### 1.4 Governança e Rastreabilidade

Todas as operações sensíveis são registradas na tabela `audit_logs`, incluindo:
- Login/logout de usuários
- Criação, edição e exclusão de registros
- Aprovações e rejeições
- Fechamento e reabertura de folhas

---

## 2. BANCO DE DADOS (DATA LAYER)

### 2.1 Estrutura Geral

O banco de dados utiliza o seguinte padrão organizacional:

| Prefixo | Finalidade | Exemplo |
|---------|------------|---------|
| `config_*` | Tabelas de parametrização | `config_rubricas`, `config_jornada_padrao` |
| `*_mensal` / `*_diario` | Dados operacionais periódicos | `frequencia_mensal`, `registros_ponto` |
| `audit_*` | Logs e rastreabilidade | `audit_logs`, `audit_log_licitacoes` |
| `folha_*` | Dados de folha de pagamento | `folha_historico_status` |

#### Multi-institucionalidade

O sistema suporta múltiplas instituições através do campo `instituicao_id` presente nas tabelas de configuração, permitindo reutilização da infraestrutura para outros órgãos.

### 2.2 Principais Tabelas por Módulo

#### 2.2.1 Vida Funcional

| Tabela | Finalidade |
|--------|------------|
| `servidores` | Cadastro de servidores (dados pessoais, funcionais, bancários) |
| `provimentos` | Histórico de nomeações e provimentos |
| `cessoes` | Cessões de e para outros órgãos |
| `lotacoes` | Histórico de lotação por unidade organizacional |
| `licencas_afastamentos` | Licenças, férias e afastamentos |
| `designacoes` | Designações para funções de confiança |
| `config_tipos_servidor` | Parametrização de tipos de vínculo |
| `config_situacoes_funcionais` | Parametrização de situações (ativo, afastado, etc.) |
| `config_motivos_desligamento` | Motivos de encerramento de vínculo |

#### 2.2.2 Frequência

| Tabela | Finalidade |
|--------|------------|
| `frequencia_mensal` | Resumo mensal de frequência por servidor |
| `registros_ponto` | Registros diários de entrada/saída |
| `banco_horas` | Controle de banco de horas |
| `config_jornada_padrao` | Jornadas de trabalho configuráveis |
| `regimes_trabalho` | Regimes (presencial, híbrido, remoto) |
| `tipos_abono` | Tipos de justificativas de ausência |
| `dias_nao_uteis` | Feriados, recessos, pontos facultativos |
| `config_compensacao` | Regras de compensação de horas |

#### 2.2.3 Folha de Pagamento

| Tabela | Finalidade |
|--------|------------|
| `folhas_pagamento` | Competências de folha com status de fechamento |
| `fichas_financeiras` | Resultado do cálculo por servidor |
| `itens_ficha_financeira` | Detalhamento de rubricas calculadas |
| `config_rubricas` | Configuração de proventos e descontos |
| `config_incidencias` | Relações de composição de base |
| `config_regras_calculo` | Regras específicas de cálculo |
| `tabela_inss` | Faixas e alíquotas de INSS |
| `tabela_irrf` | Faixas, alíquotas e deduções de IRRF |
| `parametros_folha` | Parâmetros globais (salário mínimo, tetos) |
| `consignacoes` | Consignações ativas por servidor |
| `folha_historico_status` | Auditoria de transições de status |

### 2.3 Segurança no Banco de Dados

#### 2.3.1 Row Level Security (RLS)

Todas as tabelas sensíveis possuem RLS habilitado com o padrão **Deny-by-Default**:

```sql
ALTER TABLE public.servidores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.servidores FORCE ROW LEVEL SECURITY;
```

#### 2.3.2 Funções de Verificação de Permissão

| Função RPC | Finalidade |
|------------|------------|
| `usuario_tem_permissao(user_id, codigo)` | Verifica permissão específica |
| `usuario_eh_admin(user_id)` | Verifica se é administrador |
| `usuario_eh_super_admin(user_id)` | Verifica bypass total |
| `listar_permissoes_usuario(user_id)` | Retorna todas as permissões |

#### 2.3.3 Políticas RLS Implementadas

O sistema implementa políticas para as quatro operações básicas:

| Operação | Padrão de Política |
|----------|-------------------|
| **SELECT** | Permitido via permissão + self-access (servidor próprio) |
| **INSERT** | Restrito a usuários com permissão de escrita |
| **UPDATE** | Restrito a usuários com permissão + triggers de bloqueio |
| **DELETE** | Restrito a administradores + triggers de proteção |

#### 2.3.4 Triggers de Bloqueio (Folha Fechada)

Após o fechamento da folha, triggers impedem alterações:

| Trigger | Proteção |
|---------|----------|
| `trg_bloquear_alteracao_ficha_fechada` | Bloqueia UPDATE em fichas |
| `trg_bloquear_exclusao_ficha_fechada` | Bloqueia DELETE em fichas |
| `trg_bloquear_alteracao_item_ficha_fechada` | Bloqueia UPDATE em itens |

---

## 3. BACKEND (REGRAS E SERVIÇOS)

### 3.1 Serviços Implementados

#### 3.1.1 Motor de Cálculo de Frequência

**Arquivo:** `src/lib/frequenciaCalculoService.ts`

**Funcionalidades:**
- Busca configurações parametrizadas (jornada, regime, compensação)
- Cálculo de dias úteis considerando calendário oficial
- Processamento de registros de ponto
- Cálculo de horas trabalhadas, faltas e abonos
- Geração de resumo mensal

**Estratégia de Fallback:**
- Se configuração não existir no banco, utiliza valores legados
- Log técnico registra uso de fallback (não visível ao usuário)

#### 3.1.2 Motor de Cálculo da Folha

**Arquivo:** `src/lib/folhaCalculoService.ts`

**Funcionalidades:**
- Processamento de rubricas por ordem de cálculo
- Cálculo de INSS progressivo por faixas
- Cálculo de IRRF com deduções
- Encargos patronais (INSS patronal, RAT, outras entidades)
- Margem consignável
- Integração com dados de frequência

**Tipos de Cálculo Suportados:**
- `fixo`: Valor fixo configurado
- `referencia`: Baseado no vencimento do cargo
- `percentual`: Percentual sobre base de cálculo
- `formula`: Fórmulas específicas
- `tabela`: Rubricas calculadas por tabela (INSS, IRRF)
- `manual`: Valores inseridos manualmente

#### 3.1.3 Serviços de Contracheque

**Arquivos:**
- `src/hooks/useContracheque.ts` (hooks de dados)
- `src/lib/pdfContracheque.ts` (geração de PDF)

**Funcionalidades:**
- Busca de contracheques por servidor ou competência
- Geração de PDF individual com padrão institucional
- Geração em lote para múltiplos servidores
- Log de acesso para auditoria

#### 3.1.4 Serviços de Fechamento da Folha

**Arquivo:** `src/hooks/useFechamentoFolha.ts`

**Estados da Folha:**

```
previa → aberta → processando → fechada
                      ↑              ↓
                      └── reaberta ←┘
```

### 3.2 RPCs e Funções Críticas

#### 3.2.1 Fechamento e Reabertura

| Função | Permissão | Descrição |
|--------|-----------|-----------|
| `fechar_folha(folha_id, justificativa)` | `rh.admin` | Fecha folha, bloqueia edições |
| `reabrir_folha(folha_id, justificativa)` | `super_admin` | Reabre folha fechada |
| `enviar_folha_conferencia(folha_id)` | `rh.admin` | Envia para conferência |
| `folha_esta_bloqueada(folha_id)` | Público | Verifica se está bloqueada |

#### 3.2.2 Verificação de Permissões

| Função | Descrição |
|--------|-----------|
| `usuario_tem_permissao(user_id, codigo)` | Verifica permissão específica |
| `listar_permissoes_usuario(user_id)` | Lista todas as permissões |
| `usuario_eh_super_admin(user_id)` | Verifica bypass total |
| `usuario_pode_fechar_folha(user_id)` | Verifica permissão de fechamento |
| `usuario_pode_reabrir_folha(user_id)` | Verifica permissão de reabertura |

### 3.3 Auditoria e Logs

#### 3.3.1 Tabela `audit_logs`

Registra todas as operações sensíveis com os seguintes campos:

| Campo | Descrição |
|-------|-----------|
| `action` | Tipo da ação (create, update, delete, view, etc.) |
| `entity_type` | Tipo da entidade afetada |
| `entity_id` | ID do registro afetado |
| `before_data` | Dados antes da alteração (JSON) |
| `after_data` | Dados após a alteração (JSON) |
| `user_id` | ID do usuário que executou |
| `ip_address` | IP do cliente |
| `timestamp` | Data/hora da operação |

#### 3.3.2 Eventos Auditados

| Módulo | Eventos |
|--------|---------|
| **Autenticação** | login, logout, login_failed, password_change |
| **Folha** | cálculo, fechamento, reabertura |
| **Contracheque** | visualização, impressão |
| **Servidores** | criação, edição, exclusão |

---

## 4. FRONTEND (TELAS E MENUS)

### 4.1 Estrutura de Menus

O menu é organizado por seções funcionais, com controle de acesso via permissões:

#### 4.1.1 Menu do Servidor

| Item | Rota | Funcionalidade |
|------|------|----------------|
| Meus Dados | `/rh/meus-dados` | Visualização de dados pessoais |
| Meu Contracheque | `/rh/meu-contracheque` | Consulta de contracheques próprios |

#### 4.1.2 Menu de RH

| Item | Rota | Permissão |
|------|------|-----------|
| Servidores | `/rh/servidores` | `rh.visualizar` |
| Movimentações | `/rh/designacoes` | `rh.tramitar` |
| Portarias | `/rh/portarias` | `rh.aprovar` |
| Frequência | `/rh/frequencia` | `rh.visualizar` |
| Parametrização | `/rh/frequencia/configuracao` | `rh.aprovar` |
| Férias | `/rh/ferias` | `rh.visualizar` |
| Licenças | `/rh/licencas` | `rh.visualizar` |
| Viagens | `/rh/viagens` | `rh.visualizar` |
| Relatórios | `/rh/relatorios` | `rh.visualizar` |

#### 4.1.3 Menu Administrativo

| Item | Rota | Permissão |
|------|------|-----------|
| Dashboard | `/admin/dashboard` | `admin.dashboard` |
| Usuários | `/admin/usuarios` | `admin.usuarios` |
| Perfis | `/admin/perfis` | `admin.perfis` |
| Auditoria | `/admin/auditoria` | `admin.auditoria` |
| Backup | `/admin/backup` | `admin.backup` |

### 4.2 Telas Implementadas

#### 4.2.1 Vida Funcional

| Tela | Arquivo | Descrição |
|------|---------|-----------|
| Gestão de Servidores | `GestaoServidoresPage.tsx` | Listagem, filtros, exportação |
| Detalhe do Servidor | `ServidorDetalhePage.tsx` | Dados completos com abas |
| Formulário de Servidor | `ServidorFormPage.tsx` | Cadastro e edição |
| Pré-Cadastros | `GestaoPreCadastrosPage.tsx` | Currículos pendentes de conversão |
| Diagnóstico de Pendências | `DiagnosticoPendenciasPage.tsx` | Verificação de dados incompletos |

#### 4.2.2 Frequência

| Tela | Arquivo | Descrição |
|------|---------|-----------|
| Gestão de Frequência | `GestaoFrequenciaPage.tsx` | Lançamento e consulta |
| Configuração | `ConfiguracaoFrequenciaPage.tsx` | Parametrização de jornadas e regimes |
| Controle de Pacotes | `ControlePacotesFrequenciaPage.tsx` | Fechamento por período |

#### 4.2.3 Folha de Pagamento

| Tela | Arquivo | Descrição |
|------|---------|-----------|
| Gestão de Folhas | `GestaoFolhaPagamentoPage.tsx` | Listagem, processamento, fechamento |
| Detalhe da Folha | `FolhaDetalhePage.tsx` | Fichas financeiras por servidor |
| Configuração | `ConfiguracaoFolhaPage.tsx` | Rubricas, tabelas, parâmetros |
| Folha Bloqueada | `FolhaBloqueadaPage.tsx` | Visualização de folha fechada |

#### 4.2.4 Contracheques

| Tela | Arquivo | Descrição |
|------|---------|-----------|
| Meu Contracheque | `MeuContrachequePage.tsx` | Portal do servidor |
| Consulta de Contracheques | `ConsultaContrachequesPage.tsx` | Visão RH com filtros e lote |

---

## 5. MATRIZ DE ACESSO

### 5.1 Legenda

| Símbolo | Significado |
|---------|-------------|
| ✅ | Permitido |
| ❌ | Não permitido |
| 🔒 | Apenas próprio registro |

### 5.2 Módulo: Vida Funcional

| Funcionalidade | Servidor | RH | Admin | Super Admin |
|----------------|----------|-----|-------|-------------|
| Visualizar próprios dados | ✅ | ✅ | ✅ | ✅ |
| Visualizar todos os servidores | ❌ | ✅ | ✅ | ✅ |
| Criar servidor | ❌ | ✅ | ✅ | ✅ |
| Editar servidor | ❌ | ✅ | ✅ | ✅ |
| Excluir servidor | ❌ | ❌ | ✅ | ✅ |
| Converter pré-cadastro | ❌ | ✅ | ✅ | ✅ |

### 5.3 Módulo: Frequência

| Funcionalidade | Servidor | RH | Admin | Super Admin |
|----------------|----------|-----|-------|-------------|
| Visualizar própria frequência | ✅ | ✅ | ✅ | ✅ |
| Visualizar todas as frequências | ❌ | ✅ | ✅ | ✅ |
| Lançar frequência | ❌ | ✅ | ✅ | ✅ |
| Imprimir frequência | ✅ 🔒 | ✅ | ✅ | ✅ |
| Configurar jornadas | ❌ | ✅ | ✅ | ✅ |
| Configurar calendário | ❌ | ✅ | ✅ | ✅ |

### 5.4 Módulo: Folha de Pagamento

| Funcionalidade | Servidor | RH | Admin | Super Admin |
|----------------|----------|-----|-------|-------------|
| Visualizar próprio contracheque | ✅ | ✅ | ✅ | ✅ |
| Visualizar todos os contracheques | ❌ | ✅ | ✅ | ✅ |
| Processar folha | ❌ | ✅ | ✅ | ✅ |
| Fechar folha | ❌ | ✅ | ❌ | ✅ |
| Reabrir folha | ❌ | ❌ | ❌ | ✅ |
| Configurar rubricas | ❌ | ✅ | ✅ | ✅ |
| Configurar tabelas (INSS/IRRF) | ❌ | ✅ | ✅ | ✅ |
| Gerar PDF em lote | ❌ | ✅ | ✅ | ✅ |

### 5.5 Módulo: Administração

| Funcionalidade | Servidor | RH | Admin | Super Admin |
|----------------|----------|-----|-------|-------------|
| Visualizar dashboard | ❌ | ❌ | ✅ | ✅ |
| Gerenciar usuários | ❌ | ❌ | ✅ | ✅ |
| Gerenciar perfis | ❌ | ❌ | ✅ | ✅ |
| Vincular perfis a usuários | ❌ | ❌ | ✅ | ✅ |
| Visualizar auditoria | ❌ | ❌ | ✅ | ✅ |
| Executar backup | ❌ | ❌ | ❌ | ✅ |

---

## 6. FLUXOS OPERACIONAIS

### 6.1 Fluxo da Vida Funcional

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Pré-Cadastro  │ ──▶ │    Conversão    │ ──▶ │    Servidor     │
│   (Currículo)   │     │   para Servidor │     │      Ativo      │
└─────────────────┘     └─────────────────┘     └────────┬────────┘
                                                         │
                                                         ▼
                        ┌─────────────────┐     ┌─────────────────┐
                        │   Movimentações │ ◀── │    Provimento   │
                        │ (Lotação, etc.) │     │   (Nomeação)    │
                        └────────┬────────┘     └─────────────────┘
                                 │
                                 ▼
                        ┌─────────────────┐
                        │  Desligamento   │
                        │ (Exoneração)    │
                        └─────────────────┘
```

### 6.2 Fluxo da Frequência Mensal

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Configuração   │ ──▶ │   Lançamento    │ ──▶ │    Cálculo      │
│ (Jornada, Dias) │     │    de Ponto     │     │    Mensal       │
└─────────────────┘     └─────────────────┘     └────────┬────────┘
                                                         │
                                                         ▼
                        ┌─────────────────┐     ┌─────────────────┐
                        │    Relatório    │ ◀── │   Fechamento    │
                        │   Impresso      │     │    do Período   │
                        └─────────────────┘     └─────────────────┘
```

### 6.3 Fluxo da Folha de Pagamento

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Nova Folha    │ ──▶ │  Processamento  │ ──▶ │   Conferência   │
│  (Competência)  │     │  (Motor Calc.)  │     │    (Review)     │
└─────────────────┘     └─────────────────┘     └────────┬────────┘
                                                         │
                                                         ▼
                        ┌─────────────────┐     ┌─────────────────┐
                        │   Contracheque  │ ◀── │   Fechamento    │
                        │      (PDF)      │     │   (Imutável)    │
                        └─────────────────┘     └─────────────────┘
```

### 6.4 Fluxo de Fechamento e Reabertura

```
┌────────────────────────────────────────────────────────────────┐
│                    ESTADOS DA FOLHA                            │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│   PREVIA ──▶ ABERTA ──▶ PROCESSANDO ──▶ FECHADA               │
│                              ▲               │                 │
│                              │               │                 │
│                              └── REABERTA ◀──┘                 │
│                              (super_admin)                     │
│                                                                │
└────────────────────────────────────────────────────────────────┘

Regras:
• Fechamento: Requer permissão rh.admin ou super_admin
• Reabertura: APENAS super_admin + justificativa obrigatória
• Após fechamento: Fichas e itens são imutáveis (protegidos por triggers)
```

---

## 7. CONCLUSÃO

### 7.1 Nível de Maturidade

O Sistema de Recursos Humanos do IDJuv apresenta **alto nível de maturidade técnica**, caracterizado por:

| Aspecto | Avaliação |
|---------|-----------|
| **Arquitetura** | Bem definida, com separação clara de responsabilidades |
| **Segurança** | Múltiplas camadas (RLS, permissões, triggers) |
| **Parametrização** | Flexível, via banco de dados |
| **Auditoria** | Completa, com rastreabilidade de operações |
| **Documentação** | Técnica e executiva disponíveis |

### 7.2 Aderência a Princípios de Governança

O sistema implementa controles alinhados às boas práticas de governança pública:

- **Transparência**: Logs de auditoria completos e acessíveis
- **Accountability**: Rastreabilidade de responsáveis por cada operação
- **Integridade**: Proteções contra alterações indevidas (triggers, RLS)
- **Segregação de Funções**: Perfis distintos para operação, aprovação e administração

### 7.3 Segurança Jurídica

O sistema oferece garantias de segurança jurídica através de:

- **Imutabilidade de Folhas Fechadas**: Registros oficiais não podem ser alterados
- **Histórico de Transições**: Todas as mudanças de status são registradas
- **Justificativas Obrigatórias**: Operações sensíveis exigem fundamentação
- **Contracheques Auditáveis**: Geração baseada em dados oficiais com log de acesso

### 7.4 Reutilização Institucional

A arquitetura do sistema permite reutilização em outras instituições através de:

- Campo `instituicao_id` nas tabelas de configuração
- Parametrização completa de regras de negócio
- Configurações específicas por entidade
- Estrutura de permissões replicável

---

## ANEXOS

### A. Tecnologias Utilizadas

| Componente | Tecnologia |
|------------|------------|
| Frontend | React 18, TypeScript, Vite |
| Estilização | Tailwind CSS, shadcn/ui |
| Estado | React Query, Context API |
| Backend | Supabase (PostgreSQL, Edge Functions) |
| Autenticação | Supabase Auth |
| PDF | jsPDF |
| Relatórios | Recharts |

### B. Glossário

| Termo | Definição |
|-------|-----------|
| **RLS** | Row Level Security - Segurança em nível de linha no PostgreSQL |
| **RBAC** | Role-Based Access Control - Controle de acesso baseado em papéis |
| **RPC** | Remote Procedure Call - Chamada de procedimento remoto |
| **Rubrica** | Item de provento ou desconto na folha de pagamento |
| **Ficha Financeira** | Resultado do cálculo da folha para um servidor |
| **Competência** | Mês/ano de referência para cálculo |

### C. Referências Normativas

- Lei nº 2.301/2025 (Lei de Criação do IDJuv)
- Decreto Estadual nº 39.840-E/2026
- Constituição Federal (Art. 37 - Princípios da Administração Pública)
- Lei nº 13.709/2018 (LGPD)

---

**Documento elaborado pelo Sistema IDJUV**  
**Gerado automaticamente em 03/02/2026**
