# IMPLEMENTAÇÃO DA CAMADA BASE DE PARAMETRIZAÇÃO
## Status: ✅ IMPLEMENTADO E CORRIGIDO
### Data: 02/02/2026 | Versão 1.0.1

---

## 📋 RESUMO DA IMPLEMENTAÇÃO

Esta etapa implementou a **infraestrutura mínima de parametrização** do sistema, conforme definido no Modelo de Parametrização do RH aprovado. A implementação foi **incremental e segura**, sem impactar módulos existentes.

---

## 🔧 PATCH DE CORREÇÃO v1.0.1 (02/02/2026)

### 1️⃣ Constraint UNIQUE para ON CONFLICT
- **Criado:** `idx_config_parametros_valores_unicidade`
- **Composição:** `instituicao_id`, `parametro_codigo`, `unidade_id`, `tipo_servidor`, `servidor_id`, `vigencia_inicio`
- **Técnica:** Usa `COALESCE` para campos nulos, permitindo upserts seguros

### 2️⃣ Políticas RLS Endurecidas
| Tabela | SELECT | INSERT/UPDATE | DELETE |
|--------|--------|---------------|--------|
| `config_institucional` | admin OU admin.config | admin | admin |
| `config_parametros_meta` | admin OU admin.config | admin | admin |
| `config_parametros_valores` | admin OU admin.config | admin.config OU admin | super_admin |

### 3️⃣ WITH CHECK em todas as policies FOR ALL
- `config_institucional_admin_write`: USING + WITH CHECK ✅
- `config_parametros_meta_admin_write`: USING + WITH CHECK ✅
- `config_parametros_valores_update`: USING + WITH CHECK ✅

### 4️⃣ CHECK Constraint de Vigência
- **Criado:** `chk_vigencia_valida`
- **Regra:** `vigencia_fim IS NULL OR vigencia_fim >= vigencia_inicio`

### 5️⃣ Compatibilidade com Auditoria
- **Verificado:** `audit_logs` e `audit_action` já existem ✅
- **Trigger:** `fn_audit_parametros()` usa enum existente
- **Padrão:** Segue `SET search_path = public`

---

## ✅ O QUE FOI IMPLEMENTADO

### 1. Estruturas de Banco de Dados

#### Tabela: `config_institucional`
- **Propósito:** Cadastro de instituições para suporte multi-institucional
- **Campos principais:** código, nome, CNPJ, endereço (JSONB), contato (JSONB), expediente (JSONB)
- **RLS:** SELECT público, escrita apenas para admins

#### Tabela: `config_parametros_meta`
- **Propósito:** Catálogo de metadados dos parâmetros disponíveis
- **Campos principais:** código, domínio, tipo_dado, tipo_valor, níveis permitidos, valor_padrao
- **Domínios:** INST, CAL, VF, FREQ, FOLHA, DOC
- **RLS:** SELECT para autenticados, escrita apenas para admins

#### Tabela: `config_parametros_valores`
- **Propósito:** Valores dos parâmetros com hierarquia e vigência
- **Campos principais:** instituicao_id, parametro_codigo, unidade_id, tipo_servidor, servidor_id, valor (JSONB), vigencia_inicio/fim
- **Índices:** instituicao, codigo, vigencia, nivel
- **RLS:** SELECT para autenticados, INSERT/UPDATE com permissão `admin.config`

### 2. Funções de Resolução

#### `obter_parametro_vigente()`
```sql
obter_parametro_vigente(
    p_instituicao_id uuid,
    p_parametro_codigo varchar,
    p_data_referencia date,
    p_servidor_id uuid,
    p_tipo_servidor varchar,
    p_unidade_id uuid
) RETURNS jsonb
```
- Resolve parâmetro por hierarquia: Servidor → TipoServidor → Unidade → Instituição → Fallback
- Considera vigência temporal (data de referência)
- Retorna JSONB com o valor do parâmetro

#### `obter_parametro_simples()`
- Wrapper que extrai valor simples do campo `{"v": valor}`
- Retorna TEXT diretamente

#### `fn_calcular_nivel_parametro()`
- Calcula o nível hierárquico: 1=Instituição, 2=Unidade, 3=TipoServidor, 4=Servidor

### 3. Triggers de Governança

| Trigger | Função | Comportamento |
|---------|--------|---------------|
| `trg_validar_vigencia_parametro` | `fn_validar_vigencia_parametro()` | Impede sobreposição de vigência |
| `trg_impedir_delecao_parametro` | `fn_impedir_delecao_parametro()` | Bloqueia DELETE físico |
| `trg_audit_parametros` | `fn_audit_parametros()` | Registra alterações em `audit_logs` |
| `trg_update_timestamp_*` | `fn_update_timestamp_parametros()` | Atualiza `updated_at` automaticamente |

### 4. Seeds Iniciais

#### Instituição
- **IDJUV** - Instituto de Desporto, Juventude e Lazer de Roraima

#### Metadados de Parâmetros
| Código | Domínio | Tipo | Descrição |
|--------|---------|------|-----------|
| `INST.NOME` | INST | simples/text | Nome da Instituição |
| `INST.CNPJ` | INST | simples/text | CNPJ |
| `INST.EXPEDIENTE` | INST | json | Expediente Padrão |
| `FREQ.JORNADA_PADRAO` | FREQ | simples/numeric | Jornada Padrão (minutos) |
| `FREQ.TOLERANCIA_ATRASO` | FREQ | simples/numeric | Tolerância de Atraso |
| `FOLHA.MARGEM_CONSIGNAVEL` | FOLHA | simples/numeric | Margem Consignável (%) |

#### Valores Configurados
| Parâmetro | Valor | Vigência |
|-----------|-------|----------|
| `INST.NOME` | "Instituto de Desporto, Juventude e Lazer de Roraima" | 01/01/2025 |
| `FREQ.JORNADA_PADRAO` | 360 (6 horas) | 01/01/2025 |
| `FOLHA.MARGEM_CONSIGNAVEL` | 35% | 01/01/2025 |

### 5. Hook TypeScript

#### `useConfigParametros.ts`
```typescript
const { 
  obterParametro,      // Busca parâmetro com hierarquia
  obterParametroSimples, // Busca valor simples
  obterInstituicao,    // Busca dados da instituição
  listarParametrosMeta, // Lista metadados disponíveis
  loading,
  error 
} = useConfigParametros();
```

#### Constantes de Códigos
```typescript
import { PARAM_CODES } from '@/hooks/useConfigParametros';

// Uso tipado
const jornada = await obterParametro(PARAM_CODES.FREQ_JORNADA_PADRAO);
```

---

## 🔌 PONTOS DE INTEGRAÇÃO FUTURA

### Módulo: Frequência (`pdfFrequenciaMensalGenerator.ts`)
```typescript
// ANTES (hardcoded)
const jornada = servidor.carga_horaria === 480 ? 8 : 6;

// DEPOIS (parametrizado)
const jornada = await obterParametroSimples('FREQ.JORNADA_PADRAO', {
  instituicaoId: '...',
  tipoServidor: servidor.tipo_servidor,
  servidorId: servidor.id
});
```

### Módulo: Vida Funcional
- Migrar `TIPO_SERVIDOR_LABELS` → tabela `config_tipos_servidor`
- Migrar `REGRAS_TIPO_SERVIDOR` → colunas em `config_tipos_servidor`
- Hook `useConfigVidaFuncional()` → consumir `obter_parametro_vigente()`

### Módulo: Folha de Pagamento
- Manter tabelas existentes (`parametros_folha`, `tabela_inss`, `tabela_irrf`)
- Integrar novos parâmetros via `obter_parametro_vigente()`
- Criar `config_incidencias_rubrica` na Fase 2

---

## ⚠️ O QUE NÃO FOI ALTERADO (ESCOPO CONTROLADO)

- ❌ Enums TypeScript em `types/servidor.ts`
- ❌ Cálculos de frequência em `pdfFrequenciaMensalGenerator.ts`
- ❌ Cálculos de folha em `folhaCalculos.ts`
- ❌ Fluxos em produção
- ❌ Interfaces administrativas de configuração

---

## 📊 VERIFICAÇÃO PÓS-IMPLEMENTAÇÃO

```sql
-- Verificar tabelas criadas
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'config_%';

-- Verificar funções criadas
SELECT proname FROM pg_proc 
WHERE pronamespace = 'public'::regnamespace 
AND proname LIKE '%parametro%';

-- Verificar dados da instituição
SELECT * FROM config_institucional WHERE codigo = 'IDJUV';

-- Verificar metadados de parâmetros
SELECT codigo, dominio, nome FROM config_parametros_meta ORDER BY dominio;

-- Testar resolução de parâmetro
SELECT obter_parametro_simples(
    (SELECT id FROM config_institucional WHERE codigo = 'IDJUV'),
    'FREQ.JORNADA_PADRAO',
    CURRENT_DATE
);
```

---

## 🚀 PRÓXIMAS ETAPAS (FASE 2) - ✅ CONCLUÍDA

### Tabelas de Configuração de RH - ✅ CRIADAS
- `config_tipos_servidor` ✅
- `config_situacoes_funcionais` ✅
- `config_motivos_desligamento` ✅
- `config_tipos_ato` ✅
- `config_tipos_onus` ✅

### Hook de Consumo - ✅ CRIADO
- `useConfigVidaFuncional()` ✅
- Fallback seguro para valores locais ✅
- Compatibilidade com código existente ✅

### Pendente (Fase 3)
1. **Integrar Frequência**
   - Conectar `pdfFrequenciaMensalGenerator.ts` ao parâmetro `FREQ.JORNADA_PADRAO`
   - Criar `config_jornadas` com turnos, horários, intervalos

2. **Interface Administrativa**
   - Criar tela de gestão de parâmetros (somente admin)

3. **Migrar Componentes**
   - Substituir imports de `types/servidor.ts` pelo hook

---

*Documento de implementação - Versão 1.0.1*
*Ver também: `.lovable/MIGRACAO_VIDA_FUNCIONAL.md`*
