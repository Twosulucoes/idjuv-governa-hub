# RELATÓRIO TÉCNICO FINAL - SISTEMA DE GESTÃO INSTITUCIONAL
## Instituto de Desporto, Juventude e Lazer do Estado de Roraima - IDJUV
### Versão 1.0 | Data: 03/02/2026

---

## SUMÁRIO EXECUTIVO

Este documento apresenta a documentação técnica completa do Sistema de Gestão Institucional do IDJUV, abrangendo todas as camadas da aplicação: Banco de Dados, Backend (Regras de Negócio) e Frontend (Interface).

| Métrica | Valor |
|---------|-------|
| **Total de Tabelas** | 142 |
| **Views Materializadas** | 8 |
| **Funções/Triggers** | 50+ |
| **Perfis de Acesso** | 7 |
| **Códigos de Permissão** | 141 |
| **Páginas Frontend** | 90+ |
| **Edge Functions** | 5 |

---

# PARTE I - ARQUITETURA GERAL

## 1.1 Visão Arquitetural

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React/TS)                       │
│  • 90+ páginas organizadas por módulo                            │
│  • Componentes reutilizáveis (shadcn/ui)                         │
│  • Hooks customizados para cada domínio                          │
│  • Sistema de rotas protegidas (RBAC)                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      BACKEND (Supabase)                          │
│  • Edge Functions (Deno) para lógica complexa                    │
│  • RPC Functions para operações atômicas                         │
│  • Triggers para automação e auditoria                           │
│  • Row Level Security em 100% das tabelas                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   BANCO DE DADOS (PostgreSQL)                    │
│  • 142 tabelas organizadas por módulo                            │
│  • Integridade referencial explícita                             │
│  • Vigência temporal em configurações                            │
│  • Auditoria imutável                                            │
└─────────────────────────────────────────────────────────────────┘
```

## 1.2 Princípios Arquiteturais

1. **Parametrização via Banco**: Regras de negócio em tabelas `config_*`, não em código
2. **Multi-Institucional**: Suporte a `instituicao_id` para expansão futura
3. **Deny-by-Default**: RLS bloqueia tudo; políticas liberam explicitamente
4. **Imutabilidade de Atos**: Registros oficiais não podem ser excluídos
5. **Rastreabilidade Total**: Auditoria em todas as operações sensíveis

---

# PARTE II - MÓDULOS DO SISTEMA

## 2.1 FASE 1 - LICITAÇÕES E CONTRATOS

### Tabelas Principais

| Tabela | Finalidade | Registros |
|--------|------------|-----------|
| `processos_licitatorios` | Processos de compra/contratação | 0 |
| `contratos` | Contratos firmados | 0 |
| `aditivos_contrato` | Aditivos contratuais | - |
| `atas_registro_preco` | Atas de registro de preço | - |
| `medicoes_contrato` | Medições de execução | - |
| `fornecedores` | Cadastro de fornecedores | - |
| `documentos_preparatorios_licitacao` | Documentos do processo | - |
| `audit_log_licitacoes` | Auditoria específica | - |

### Triggers e Automações

| Trigger | Tabela | Função |
|---------|--------|--------|
| `trg_audit_processos` | processos_licitatorios | Registra alterações em audit_log_licitacoes |
| `trg_audit_contratos` | contratos | Registra alterações em audit_log_licitacoes |
| `trg_atualizar_saldo_contrato` | medicoes_contrato | Atualiza saldo_contrato e valor_executado |
| `trg_registrar_mudanca_fase` | processos_licitatorios | Registra histórico de fases em JSONB |

### Integrações Backend

- **Função**: `fn_audit_log_licitacoes()` - Registra todas as operações
- **Função**: `registrar_mudanca_fase_licitacao()` - Histórico de fases
- **Função**: `atualizar_saldo_contrato()` - Atualiza valores de contrato

### Frontend

| Página | Rota | Funcionalidade |
|--------|------|----------------|
| ComprasProcessoPage | /processos/compras | Gestão de processos |
| PagamentosProcessoPage | /processos/pagamentos | Pagamentos |
| ConveniosProcessoPage | /processos/convenios | Convênios |

---

## 2.2 FASE 2 - ORÇAMENTO E PATRIMÔNIO

### Tabelas de Orçamento

| Tabela | Finalidade |
|--------|------------|
| `dotacoes_orcamentarias` | Dotações do exercício |
| `empenhos` | Empenhos orçamentários |
| `creditos_adicionais` | Créditos suplementares/especiais |
| `centros_custo` | Centros de custo |
| `programas` | Programas governamentais |
| `acoes` | Ações vinculadas a programas |

### Tabelas de Patrimônio

| Tabela | Finalidade |
|--------|------------|
| `bens_patrimoniais` | Cadastro de bens |
| `itens_material` | Catálogo de materiais |
| `almoxarifados` | Almoxarifados físicos |
| `estoque` | Posição de estoque |
| `movimentacoes_estoque` | Entrada/saída/transferência |

### Triggers e Automações

| Trigger | Função |
|---------|--------|
| `trg_atualizar_saldo_dotacao` | Atualiza valor_empenhado na dotação |
| `trg_atualizar_estoque` | Atualiza quantidade em estoque |
| `trg_gerar_numero_tombo` | Gera número de patrimônio automático |

### Integrações Backend

```sql
-- Função: fn_atualizar_saldo_dotacao()
-- Atualiza automaticamente o saldo empenhado nas dotações

-- Função: fn_atualizar_estoque()
-- Gerencia movimentações de estoque (entrada, saída, transferência)

-- Função: gerar_numero_tombo_patrimonio()
-- Gera número de tombamento: PAT-[TIPO]-[ANO]-[SEQ]
```

### Frontend

| Página | Rota | Funcionalidade |
|--------|------|----------------|
| ExecucaoOrcamentariaPage | /transparencia/orcamento | Consulta orçamentária |
| PatrimonioPublicoPage | /transparencia/patrimonio | Patrimônio público |
| AlmoxarifadoProcessoPage | /processos/almoxarifado | Gestão de almoxarifado |
| PatrimonioProcessoPage | /processos/patrimonio | Gestão de patrimônio |

---

## 2.3 FASE 3 - RECURSOS HUMANOS

### 2.3.1 Vida Funcional

#### Tabelas Principais

| Tabela | Finalidade | Registros |
|--------|------------|-----------|
| `servidores` | Cadastro de servidores | 82 |
| `cargos` | Cargos da estrutura | 16 |
| `estrutura_organizacional` | Organograma | 43 |
| `provimentos` | Nomeações/exonerações | 82 |
| `lotacoes` | Lotações funcionais | - |
| `designacoes` | Designações de função | - |
| `cessoes` | Cessões entrada/saída | - |
| `ferias_servidor` | Férias programadas | - |
| `licencas_afastamentos` | Licenças e afastamentos | - |

#### Tabelas de Configuração

| Tabela | Finalidade |
|--------|------------|
| `config_tipos_servidor` | Tipos de servidor (comissionado, efetivo, cedido) |
| `config_situacoes_funcionais` | Situações (ativo, férias, licença, etc.) |
| `config_vinculos_funcionais` | Vínculos (efetivo, comissionado, temporário) |

#### Triggers e Automações

| Trigger | Tabela | Função |
|---------|--------|--------|
| `trg_provimento_atualiza_situacao` | provimentos | Atualiza situação do servidor |
| `trg_cessao_atualiza_situacao` | cessoes | Atualiza situação do servidor |
| `trg_ferias_atualiza_situacao` | ferias_servidor | Atualiza situação do servidor |
| `trg_licenca_atualiza_situacao` | licencas_afastamentos | Atualiza situação do servidor |

#### Função Central: `fn_atualizar_situacao_servidor()`

```
Prioridade de Situação:
1. Falecido (permanente)
2. Exonerado/Desligado
3. Férias em gozo
4. Licença/Afastamento ativo
5. Cedido (saída ativa)
6. Ativo (provimento ou cessão entrada)
7. Inativo (nenhuma das anteriores)
```

### 2.3.2 Frequência

#### Tabelas

| Tabela | Finalidade |
|--------|------------|
| `frequencia_mensal` | Resumo mensal por servidor |
| `frequencia_lancamentos` | Lançamentos individuais (faltas, abonos) |
| `registros_ponto` | Registros de ponto eletrônico |
| `banco_horas` | Saldo de banco de horas |

#### Tabelas de Configuração

| Tabela | Finalidade |
|--------|------------|
| `config_jornadas` | Jornadas de trabalho (6h, 8h) |
| `config_regimes_trabalho` | Regimes (presencial, híbrido) |
| `config_tipos_abono` | Tipos de abono aceitos |
| `dias_nao_uteis` | Feriados e pontos facultativos |
| `config_agrupamento_unidades` | Agrupamentos para relatórios |

#### Motor de Cálculo

Arquivo: `src/lib/frequenciaCalculoService.ts`

```typescript
// Funcionalidades:
- Cálculo de dias úteis considerando feriados
- Cálculo de faltas e atrasos
- Geração de resumo mensal
- Integração com banco de horas
- Respeito à vigência temporal de configurações
```

### 2.3.3 Folha de Pagamento

#### Tabelas Operacionais

| Tabela | Finalidade |
|--------|------------|
| `folhas_pagamento` | Folhas por competência |
| `fichas_financeiras` | Ficha individual do servidor |
| `itens_ficha_financeira` | Rubricas da ficha |
| `consignacoes` | Consignações ativas |
| `dependentes_irrf` | Dependentes para dedução |

#### Tabelas Fiscais

| Tabela | Finalidade |
|--------|------------|
| `tabela_inss` | Faixas progressivas INSS |
| `tabela_irrf` | Faixas de IRRF |
| `parametros_folha` | Parâmetros (teto, salário mínimo) |

#### Tabelas de Configuração

| Tabela | Finalidade |
|--------|------------|
| `config_rubricas` | Rubricas parametrizadas |
| `config_incidencias` | Incidências de rubricas |

#### Tabelas Bancárias

| Tabela | Finalidade |
|--------|------------|
| `bancos_cnab` | Bancos homologados |
| `contas_autarquia` | Contas da autarquia |
| `remessas_bancarias` | Remessas geradas |
| `eventos_esocial` | Eventos e-Social |

#### Motor de Cálculo

Arquivo: `src/lib/folhaCalculoService.ts`

```typescript
// Funcionalidades:
- Processamento por servidor
- Cálculo progressivo de INSS
- Cálculo de IRRF com deduções
- Aplicação de rubricas parametrizadas
- Integração com frequência (faltas/atrasos)
- Geração de alertas e logs
```

#### Funções de Cálculo (Banco)

| Função | Finalidade |
|--------|------------|
| `calcular_inss_servidor()` | Cálculo progressivo por faixas |
| `calcular_irrf()` | Cálculo com dedução dependentes |
| `processar_folha_pagamento()` | Processamento completo |
| `get_parametro_vigente()` | Busca parâmetros vigentes |
| `count_dependentes_irrf()` | Conta dependentes ativos |

#### Workflow de Fechamento

| Estado | Descrição | Ações Permitidas |
|--------|-----------|------------------|
| `previa` | Folha em simulação | Processar, Editar |
| `aberta` | Folha processada | Editar, Enviar Conferência |
| `processando` | Em conferência | Aprovar, Rejeitar |
| `fechada` | **IMUTÁVEL** | Apenas visualização |
| `reaberta` | Reaberta por super_admin | Editar, Reprocessar |

**Trigger de Bloqueio**: `bloquear_alteracao_ficha_fechada()`
- Impede UPDATE/DELETE em fichas de folhas fechadas
- Exceção apenas para super_admin com justificativa

#### Frontend - Páginas

| Página | Rota | Funcionalidade |
|--------|------|----------------|
| GestaoServidoresPage | /rh/servidores | CRUD de servidores |
| ServidorDetalhePage | /rh/servidores/:id | Detalhe completo |
| ServidorFormPage | /rh/servidores/novo | Cadastro de servidor |
| GestaoFrequenciaPage | /rh/frequencia | Frequência mensal |
| ConfiguracaoFrequenciaPage | /rh/configuracao-frequencia | Configurações |
| GestaoFolhaPagamentoPage | /folha | Gestão de folhas |
| FolhaDetalhePage | /folha/:id | Detalhe da folha |
| ConfiguracaoFolhaPage | /folha/configuracao | Rubricas e tabelas |
| ConsultaContrachequesPage | /rh/contracheques | Consulta RH |
| MeuContrachequePage | /rh/meu-contracheque | Portal servidor |
| CentralPortariasPage | /rh/portarias | Portarias de RH |
| GestaoDesignacoesPage | /rh/designacoes | Designações |
| GestaoFeriasPage | /rh/ferias | Férias |
| GestaoLicencasPage | /rh/licencas | Licenças |
| AniversariantesPage | /rh/aniversariantes | Aniversariantes |
| DiagnosticoPendenciasPage | /rh/pendencias | Pendências |

---

## 2.4 FASE 4 - TRANSPARÊNCIA E LAI

### Tabelas

| Tabela | Finalidade |
|--------|------------|
| `solicitacoes_sic` | Pedidos e-SIC |
| `publicacoes_lai` | Publicações proativas |
| `historico_lai` | Histórico de tramitação |
| `recursos_lai` | Recursos de LAI |
| `prazos_lai` | Configuração de prazos |

### Automações

| Função | Finalidade |
|--------|------------|
| `gerar_protocolo_sic()` | Gera protocolo SIC-YYYY-NNNN |
| `gerar_hash_solicitante_sic()` | Hash do documento (LGPD) |
| `calcular_prazo_lai()` | Calcula prazo em dias úteis |
| `definir_prazo_lai_correto()` | Define prazo inicial |
| `registrar_historico_lai()` | Registra eventos |
| `consultar_protocolo_sic()` | Consulta pública com token |

### Frontend

| Página | Rota | Funcionalidade |
|--------|------|----------------|
| TransparenciaPage | /transparencia | Portal principal |
| PortalLAIPage | /transparencia/lai | e-SIC público |
| CargosRemuneracaoPage | /transparencia/cargos | Cargos e salários |
| LicitacoesPublicasPage | /transparencia/licitacoes | Licitações |
| ExecucaoOrcamentariaPage | /transparencia/orcamento | Orçamento |
| PatrimonioPublicoPage | /transparencia/patrimonio | Patrimônio |

---

## 2.5 FASE 5 - GOVERNANÇA E COMPLIANCE

### Tabelas

| Tabela | Finalidade |
|--------|------------|
| `riscos_institucionais` | Mapa de riscos |
| `controles_internos` | Controles implementados |
| `avaliacoes_risco` | Avaliações periódicas |
| `avaliacoes_controle` | Avaliações de controle |
| `checklists_conformidade` | Checklists legais |
| `decisoes_administrativas` | Decisões e pareceres |
| `matriz_raci` | Matriz de responsabilidades |

### Frontend

| Página | Rota | Funcionalidade |
|--------|------|----------------|
| GovernancaPage | /governanca | Portal governança |
| EstruturaOrganizacionalPage | /governanca/estrutura | Estrutura org. |
| OrganogramaPage | /governanca/organograma | Organograma visual |
| PortariasPage | /governanca/portarias | Portarias institucionais |
| LeiCriacaoPage | /governanca/lei-criacao | Lei de criação |
| DecretoPage | /governanca/decreto | Decreto regulamentar |
| RegimentoInternoPage | /governanca/regimento | Regimento interno |
| MatrizRaciPage | /governanca/matriz-raci | Matriz RACI |

---

## 2.6 FASE 5B - PROGRAMAS, FEDERAÇÕES E ASCOM

### Federações Esportivas

| Tabela | Finalidade | Registros |
|--------|------------|-----------|
| `federacoes_esportivas` | Cadastro de federações | 16 |
| `calendario_federacao` | Eventos e competições | - |

### ASCOM (Comunicação)

| Tabela | Finalidade |
|--------|------------|
| `demandas_ascom` | Demandas de comunicação |
| `demandas_ascom_anexos` | Anexos das demandas |
| `demandas_ascom_comentarios` | Comentários |
| `demandas_ascom_entregaveis` | Entregáveis |

### Automações ASCOM

| Função | Finalidade |
|--------|------------|
| `gerar_numero_demanda_ascom()` | Gera NNNN/YYYY-ASCOM |
| `verificar_autorizacao_presidencia_ascom()` | Define se requer aprovação |
| `registrar_historico_demanda_ascom()` | Histórico de status |

### Frontend

| Página | Rota | Funcionalidade |
|--------|------|----------------|
| GestaoFederacoesPage | /federacoes | Gestão de federações |
| CadastroFederacaoPage | /federacoes/cadastro | Cadastro |
| GestaoDemandasAscomPage | /ascom | Demandas ASCOM |
| NovaDemandaAscomPage | /ascom/nova | Nova demanda |
| SolicitacaoPublicaAscomPage | /ascom/solicitar | Formulário público |

---

## 2.7 FASE 6 - WORKFLOW (SEI-LIKE)

### Tabelas

| Tabela | Finalidade |
|--------|------------|
| `processos_administrativos` | Processos administrativos |
| `movimentacoes_processo` | Tramitações |
| `despachos` | Despachos e decisões |
| `documentos_processo` | Documentos anexados |
| `prazos_processo` | Prazos e alertas |
| `acesso_processo_sigiloso` | Controle de sigilo |

### Views

| View | Finalidade |
|------|------------|
| `v_processos_resumo` | Resumo com contadores |

### Frontend

| Página | Rota | Funcionalidade |
|--------|------|----------------|
| GestaoProcessosPage | /workflow/processos | Lista de processos |
| ProcessoDetalhePage | /workflow/processos/:id | Detalhe e tramitação |

---

## 2.8 MÓDULOS COMPLEMENTARES

### Unidades Locais (Espaços Esportivos)

| Tabela | Finalidade | Registros |
|--------|------------|-----------|
| `unidades_locais` | Ginásios, estádios, etc. | 32 |
| `agenda_unidade` | Reservas de espaços | - |
| `patrimonio_unidade` | Patrimônio por unidade | - |
| `termos_cessao_unidade` | Termos de cessão | - |

### Documentos e Portarias

| Tabela | Finalidade |
|--------|------------|
| `documentos` | Documentos oficiais |
| `portarias_servidor` | Portarias vinculadas a servidores |

### Reuniões

| Tabela | Finalidade |
|--------|------------|
| `reunioes` | Cadastro de reuniões |
| `participantes_reuniao` | Participantes |
| `atas_reuniao` | Atas de reunião |

### Pré-Cadastros (Mini-Currículo)

| Tabela | Finalidade |
|--------|------------|
| `pre_cadastros` | Candidatos pré-cadastrados |

---

# PARTE III - SISTEMA DE SEGURANÇA

## 3.1 Arquitetura RBAC

```
┌─────────────────────────────────────────────────────────────────┐
│                         PERFIS (7)                               │
├─────────────────────────────────────────────────────────────────┤
│ super_admin     │ Nível 100 │ Acesso total, reabertura folha    │
│ admin           │ Nível 90  │ Administração geral                │
│ gerente         │ Nível 50  │ Gestão de equipes                  │
│ gestor_federacoes│ Nível 30 │ Gestão de federações               │
│ operador        │ Nível 20  │ Operações básicas                  │
│ gestor_ascom    │ Nível 10  │ Demandas ASCOM                     │
│ consulta        │ Nível 10  │ Apenas visualização                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    FUNCOES_SISTEMA (141)                         │
├─────────────────────────────────────────────────────────────────┤
│ Formato: [modulo].[acao]                                         │
│ Exemplos: rh.visualizar, rh.admin, folha.fechar                  │
└─────────────────────────────────────────────────────────────────┘
```

## 3.2 Funções de Verificação

| Função | Finalidade |
|--------|------------|
| `usuario_tem_permissao(user_id, codigo)` | Verifica permissão específica |
| `usuario_eh_super_admin(user_id)` | Verifica se é super admin |
| `usuario_eh_admin(user_id)` | Verifica se é admin |
| `listar_permissoes_usuario(user_id)` | Lista todas as permissões |

## 3.3 Políticas RLS

### Padrão Geral

```sql
-- SELECT: Autenticado ou função específica
CREATE POLICY "select_policy" ON tabela
FOR SELECT USING (
  auth.uid() IS NOT NULL
  AND (
    usuario_eh_admin(auth.uid())
    OR usuario_tem_permissao(auth.uid(), 'modulo.visualizar')
  )
);

-- INSERT/UPDATE: Apenas admin ou permissão específica
CREATE POLICY "write_policy" ON tabela
FOR INSERT WITH CHECK (
  usuario_eh_admin(auth.uid())
  OR usuario_tem_permissao(auth.uid(), 'modulo.admin')
);

-- DELETE: Bloqueado ou restrito a super_admin
CREATE POLICY "delete_policy" ON tabela
FOR DELETE USING (
  usuario_eh_super_admin(auth.uid())
);
```

### Tabelas com Self-Access

Servidores podem ver seus próprios dados:
- `servidores` (próprio registro)
- `provimentos` (próprios provimentos)
- `fichas_financeiras` (próprios contracheques)
- `frequencia_mensal` (própria frequência)

## 3.4 Imutabilidade de Registros

### Tabelas Protegidas contra DELETE

| Tabela | Motivo |
|--------|--------|
| `portarias_servidor` | Ato administrativo oficial |
| `documentos` | Memória institucional |
| `demandas_ascom` | Histórico de demandas |
| `calendario_federacao` | Calendário oficial |
| `viagens_diarias` | Registros de diárias |
| `audit_logs` | Trilha de auditoria |

### Triggers de Bloqueio

| Trigger | Tabela | Função |
|---------|--------|--------|
| `bloquear_alteracao_ficha_fechada` | fichas_financeiras | Bloqueia folha fechada |
| `bloquear_alteracao_item_ficha_fechada` | itens_ficha_financeira | Bloqueia itens |

---

# PARTE IV - AUDITORIA E RASTREABILIDADE

## 4.1 Sistema de Auditoria

### Tabela Principal: `audit_logs`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID | Identificador único |
| `action` | ENUM | create, update, delete, view, export |
| `entity_type` | VARCHAR | Tipo da entidade |
| `entity_id` | VARCHAR | ID da entidade |
| `before_data` | JSONB | Dados anteriores |
| `after_data` | JSONB | Dados posteriores |
| `user_id` | UUID | Usuário da ação |
| `timestamp` | TIMESTAMPTZ | Data/hora |
| `ip_address` | INET | Endereço IP |
| `module_name` | VARCHAR | Módulo do sistema |

### Auditoria Específica de Licitações

Tabela: `audit_log_licitacoes`
- Campos alterados detalhados
- Nome e perfil do usuário
- Histórico completo de mudanças

## 4.2 Históricos em JSONB

Várias tabelas mantêm histórico interno:
- `processos_licitatorios.historico_fases`
- `demandas_ascom.historico_status`
- `solicitacoes_sic.historico_status`
- `agenda_unidade.historico_status`

## 4.3 Tabela de Histórico de Fechamento

Tabela: `folha_historico_status`

| Coluna | Descrição |
|--------|-----------|
| `folha_id` | Referência à folha |
| `status_anterior` | Status antes da mudança |
| `status_novo` | Novo status |
| `usuario_id` | Quem alterou |
| `ip_address` | IP do usuário |
| `justificativa` | Justificativa (reabertura) |
| `created_at` | Data/hora da mudança |

---

# PARTE V - EDGE FUNCTIONS

## 5.1 Funções Implementadas

| Função | Endpoint | Finalidade |
|--------|----------|------------|
| `admin-reset-password` | POST | Reset de senha administrativo |
| `backup-offsite` | POST | Backup para storage externo |
| `database-schema` | GET | Schema do banco para diagnóstico |
| `download-frequencia` | GET | Download de frequência em PDF |
| `enviar-convite-reuniao` | POST | Envio de convites por email |

---

# PARTE VI - FRONTEND

## 6.1 Estrutura de Páginas

```
src/pages/
├── admin/              # 15 páginas administrativas
├── ascom/              # 5 páginas de comunicação
├── cargos/             # 1 página
├── curriculo/          # 4 páginas
├── federacoes/         # 2 páginas
├── folha/              # 4 páginas
├── formularios/        # 5 páginas
├── governanca/         # 8 páginas
├── integridade/        # 2 páginas
├── lotacoes/           # 1 página
├── organograma/        # 2 páginas
├── processos/          # 7 páginas
├── programas/          # 5 páginas
├── rh/                 # 17 páginas
├── transparencia/      # 6 páginas
├── unidades/           # 4 páginas
├── workflow/           # 2 páginas
└── [raiz]/             # 11 páginas gerais
```

## 6.2 Hooks Principais

| Hook | Módulo | Finalidade |
|------|--------|------------|
| `usePermissions` | Auth | Verificação de permissões |
| `useServidorCompleto` | RH | Dados completos do servidor |
| `useFrequencia` | RH | Gestão de frequência |
| `useFolhaPagamento` | Folha | Operações de folha |
| `useFechamentoFolha` | Folha | Workflow de fechamento |
| `useContracheque` | Folha | Geração de contracheques |
| `usePortarias` | RH | Gestão de portarias |
| `useOrganograma` | Governança | Organograma interativo |
| `useWorkflow` | Workflow | Processos administrativos |
| `useDadosOficiais` | Institucional | Dados oficiais |

## 6.3 Componentes de Proteção

| Componente | Finalidade |
|------------|------------|
| `ProtectedRoute` | Protege rotas por permissão |
| `PermissionGate` | Oculta elementos sem permissão |
| `DisabledWithPermission` | Desabilita com tooltip |

---

# PARTE VII - MATRIZ DE ACESSO CONSOLIDADA

## 7.1 Módulo de RH

| Funcionalidade | Servidor | RH | Admin | Super |
|----------------|----------|-----|-------|-------|
| Ver próprio contracheque | ✔️ | ✔️ | ✔️ | ✔️ |
| Ver todos os contracheques | ❌ | ✔️ | ✔️ | ✔️ |
| Cadastrar servidor | ❌ | ✔️ | ✔️ | ✔️ |
| Editar servidor | ❌ | ✔️ | ✔️ | ✔️ |
| Processar folha | ❌ | ✔️ | ✔️ | ✔️ |
| Fechar folha | ❌ | ✔️ | ✔️ | ✔️ |
| Reabrir folha | ❌ | ❌ | ❌ | ✔️ |
| Configurar rubricas | ❌ | ❌ | ✔️ | ✔️ |
| Configurar frequência | ❌ | ❌ | ✔️ | ✔️ |

## 7.2 Módulo de Licitações

| Funcionalidade | Consulta | Operador | Admin | Super |
|----------------|----------|----------|-------|-------|
| Ver processos | ✔️ | ✔️ | ✔️ | ✔️ |
| Criar processo | ❌ | ✔️ | ✔️ | ✔️ |
| Editar processo | ❌ | ✔️ | ✔️ | ✔️ |
| Excluir processo | ❌ | ❌ | ❌ | ✔️ |
| Ver auditoria | ❌ | ❌ | ✔️ | ✔️ |

## 7.3 Módulo de Transparência

| Funcionalidade | Público | Auth | Admin | Super |
|----------------|---------|------|-------|-------|
| Consultar e-SIC | ✔️ | ✔️ | ✔️ | ✔️ |
| Abrir solicitação | ✔️ | ✔️ | ✔️ | ✔️ |
| Responder solicitação | ❌ | ❌ | ✔️ | ✔️ |
| Ver relatórios internos | ❌ | ❌ | ✔️ | ✔️ |

## 7.4 Módulo Administrativo

| Funcionalidade | Consulta | Gerente | Admin | Super |
|----------------|----------|---------|-------|-------|
| Ver usuários | ❌ | ❌ | ✔️ | ✔️ |
| Criar usuários | ❌ | ❌ | ✔️ | ✔️ |
| Editar perfis | ❌ | ❌ | ✔️ | ✔️ |
| Ver auditoria completa | ❌ | ❌ | ✔️ | ✔️ |
| Configurar sistema | ❌ | ❌ | ❌ | ✔️ |

---

# PARTE VIII - FLUXOS OPERACIONAIS

## 8.1 Fluxo de Vida Funcional

```
Pré-Cadastro → Conversão → Servidor → Provimento → Lotação
                                         ↓
                              ┌──────────┴──────────┐
                              ▼                     ▼
                           Ativo              Designação
                              │                     │
              ┌───────────────┼───────────────┐     │
              ▼               ▼               ▼     ▼
           Férias         Licença         Cessão   Função
              │               │               │     │
              └───────────────┴───────────────┴─────┘
                              ▼
                          Exoneração
```

## 8.2 Fluxo de Frequência Mensal

```
Config. Jornada → Dias Úteis → Lançamentos → Resumo Mensal
        │               │            │              │
        │               ▼            ▼              ▼
        │         Feriados      Faltas/Abonos   Integração
        │               │            │           Folha
        └───────────────┴────────────┴──────────────┘
```

## 8.3 Fluxo de Folha de Pagamento

```
Criar Folha → Processar → Conferência → Fechamento
     │            │            │             │
     ▼            ▼            ▼             ▼
  Prévia    Fichas Fin.   Ajustes      IMUTÁVEL
     │            │            │             │
     │            ▼            │             ▼
     │      Contracheques      │      Remessa Bancária
     │            │            │             │
     └────────────┴────────────┴─────────────┘
```

## 8.4 Fluxo de Processo Administrativo

```
Abertura → Distribuição → Despachos → Decisão → Arquivamento
    │            │             │          │           │
    ▼            ▼             ▼          ▼           ▼
Protocolo   Unidade      Parecer    Deferido      Encerrado
    │       Destino      Técnico    Indeferido        │
    │            │             │          │           │
    └────────────┴─────────────┴──────────┴───────────┘
                              │
                              ▼
                        Histórico
                        Completo
```

---

# PARTE IX - DADOS OFICIAIS E IDENTIDADE

## 9.1 Tabela `dados_oficiais`

| Chave | Valor |
|-------|-------|
| `nome_orgao` | Instituto de Desporto, Juventude e Lazer do Estado de Roraima |
| `sigla` | IDJUV |
| `cnpj` | 64.689.510/0001-09 |
| `lei_criacao` | Lei nº 2.301, de 29 de dezembro de 2025 |
| `decreto_regulamentar` | Decreto nº 39.840-E, de 23 de janeiro de 2026 |
| `endereco` | Av. Brigadeiro Eduardo Gomes, s/n, Aeroporto, Boa Vista/RR |
| `natureza_juridica` | Autarquia Estadual |

## 9.2 Hook `useDadosOficiais`

Centraliza acesso aos dados oficiais para uso em:
- Cabeçalhos de documentos
- Rodapé do site
- Relatórios institucionais
- Portarias e atos oficiais

---

# PARTE X - CONCLUSÃO

## 10.1 Nível de Maturidade

O sistema atingiu **maturidade avançada** com:
- ✅ 142 tabelas estruturadas
- ✅ 100% de cobertura RLS
- ✅ Auditoria completa
- ✅ Módulos operacionais funcionando
- ✅ Workflow de fechamento com imutabilidade

## 10.2 Aderência a Princípios

| Princípio | Status |
|-----------|--------|
| Governança | ✅ Implementada |
| Transparência (LAI) | ✅ Portal funcional |
| Segurança Jurídica | ✅ Imutabilidade garantida |
| Rastreabilidade | ✅ Auditoria completa |
| LGPD | ✅ Hash de dados sensíveis |
| Multi-institucional | ✅ Preparado |

## 10.3 Módulos Operacionais

| Módulo | Status | Uso |
|--------|--------|-----|
| RH/Vida Funcional | ✅ Funcional | 100% |
| Frequência | ✅ Funcional | 80% |
| Folha de Pagamento | ⏸️ Bloqueado | Aguardando validação |
| Transparência | ✅ Funcional | 50% |
| Federações | ✅ Funcional | 80% |
| ASCOM | ✅ Funcional | 50% |
| Workflow | ✅ Funcional | Novo |
| Licitações | ⚠️ Estrutura | 0% dados |
| Orçamento | ⚠️ Estrutura | 0% dados |

## 10.4 Recomendações

1. **Validação Jurídica**: Homologar módulo de Folha
2. **Dados**: Popular Licitações e Orçamento
3. **Capacitação**: Treinar usuários por módulo
4. **Monitoramento**: Implementar alertas de auditoria

---

*Documento gerado em 03/02/2026*
*Sistema: Lovable Cloud + Supabase*
*Versão: 1.0*
