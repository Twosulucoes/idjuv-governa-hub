# MIGRAÇÃO DO MÓDULO DE FREQUÊNCIA - CAMADA DE CONFIGURAÇÃO
## Status: ✅ IMPLEMENTADO
### Data: 02/02/2026 | Versão 1.0.0

---

## 📋 RESUMO DA IMPLEMENTAÇÃO

Esta etapa implementou a **camada de configuração do módulo de Frequência**, adicionando suporte multi-institucional (`instituicao_id`) a todas as tabelas de configuração existentes e populando os seeds iniciais para o IDJUV.

---

## ✅ O QUE FOI IMPLEMENTADO

### 1. Estrutura Multi-Institucional

Todas as tabelas de configuração de frequência agora possuem:
- Coluna `instituicao_id` referenciando `config_institucional`
- Índices otimizados para consultas por instituição
- Registros existentes migrados para IDJUV

| Tabela | Descrição | instituicao_id |
|--------|-----------|----------------|
| `config_jornada_padrao` | Configurações de jornada de trabalho | ✅ Adicionado |
| `regimes_trabalho` | Regimes (presencial, teletrabalho, etc.) | ✅ Adicionado |
| `tipos_abono` | Tipos de abono permitidos | ✅ Adicionado |
| `config_compensacao` | Regras de banco de horas | ✅ Adicionado |
| `config_fechamento_frequencia` | Configurações de fechamento mensal | ✅ Adicionado |
| `config_assinatura_frequencia` | Configurações de assinatura | ✅ Adicionado |
| `dias_nao_uteis` | Calendário de feriados | ✅ Adicionado |

### 2. Políticas RLS Atualizadas

Todas as tabelas de configuração possuem RLS com permissões:

| Operação | Permissões Necessárias |
|----------|------------------------|
| **SELECT** | Registros ativos OU `rh.frequencia.configurar` OU super_admin |
| **INSERT** | `admin.config` OU `rh.frequencia.configurar` OU super_admin |
| **UPDATE** | `admin.config` OU `rh.frequencia.configurar` OU super_admin |
| **DELETE** | super_admin apenas |

### 3. Seeds Iniciais (IDJUV)

#### Jornadas de Trabalho
| Código | Nome | Carga Diária | Turnos | Padrão |
|--------|------|--------------|--------|--------|
| - | Jornada 6 horas | 6h | 1 turno (08:00-14:00) | ✅ Sim |
| - | Jornada 8 horas | 8h | 2 turnos (08:00-12:00, 14:00-18:00) | Não |

#### Regimes de Trabalho
| Código | Nome | Tipo | Dias | Exige Ponto |
|--------|------|------|------|-------------|
| PRESENCIAL | Presencial | presencial | Seg-Sex | ✅ Sim |
| TELETRABALHO | Teletrabalho | teletrabalho | Seg-Sex | Não |
| HIBRIDO | Híbrido | hibrido | Seg-Sex | ✅ Sim |

#### Tipos de Abono
| Código | Nome | Conta Presença | Exige Doc. | Aprovação |
|--------|------|----------------|------------|-----------|
| ATESTADO | Atestado Médico | ✅ | ✅ | RH |
| LICENCA_MEDICA | Licença Médica | ✅ | ✅ | RH |
| SERVICO_EXTERNO | Serviço Externo | ✅ | ❌ | Chefia |
| CAPACITACAO | Capacitação | ✅ | ✅ | Chefia |
| DISPENSA_HORARIO | Dispensa de Horário | ✅ | ❌ | Chefia |
| LUTO | Luto | ✅ | ✅ | RH |
| CASAMENTO | Casamento | ✅ | ✅ | RH |
| DOACAO_SANGUE | Doação de Sangue | ✅ | ✅ | Auto |

#### Configuração de Compensação
| Código | Banco Horas | Prazo | Limite Acúmulo | Limite Dia |
|--------|-------------|-------|----------------|------------|
| PADRAO | ✅ Permitido | 60 dias | 40h | 2h extras |

#### Configuração de Assinatura
| Código | Servidor | Chefia | RH | Tipo |
|--------|----------|--------|-----|------|
| PADRAO | ✅ Obrigatória | ✅ Obrigatória | Opcional | Manual |

---

## 🔌 INTEGRAÇÃO COM HOOKS EXISTENTES

O hook `useParametrizacoesFrequencia.ts` já consome estas tabelas e não requer alterações:

```typescript
// Consumo atual (já funcional)
import { 
  useConfigJornadas,
  useRegimesTrabalho,
  useTiposAbono,
  useConfigCompensacao,
  useConfigFechamento,
  useConfigAssinatura
} from '@/hooks/useParametrizacoesFrequencia';
```

---

## ⚠️ O QUE NÃO FOI ALTERADO (ESCOPO CONTROLADO)

- ❌ Motor de cálculo de frequência
- ❌ `pdfFrequenciaMensalGenerator.ts`
- ❌ `pdfFrequenciaLote.ts`
- ❌ Integração com folha de pagamento
- ❌ Tabela `frequencia_mensal`
- ❌ Cálculos de horas trabalhadas

---

## 📊 VERIFICAÇÃO PÓS-IMPLEMENTAÇÃO

```sql
-- Verificar registros por tabela
SELECT 
  'config_jornada_padrao' as tabela, COUNT(*) as registros 
FROM config_jornada_padrao WHERE instituicao_id IS NOT NULL
UNION ALL
SELECT 'regimes_trabalho', COUNT(*) FROM regimes_trabalho WHERE instituicao_id IS NOT NULL
UNION ALL
SELECT 'tipos_abono', COUNT(*) FROM tipos_abono WHERE instituicao_id IS NOT NULL
UNION ALL
SELECT 'config_compensacao', COUNT(*) FROM config_compensacao WHERE instituicao_id IS NOT NULL
UNION ALL
SELECT 'config_assinatura_frequencia', COUNT(*) FROM config_assinatura_frequencia WHERE instituicao_id IS NOT NULL;

-- Verificar jornadas
SELECT nome, carga_horaria_diaria, padrao FROM config_jornada_padrao WHERE ativo = true;

-- Verificar tipos de abono
SELECT codigo, nome, conta_como_presenca, exige_documento FROM tipos_abono WHERE ativo = true ORDER BY ordem;
```

---

## 🚀 PRÓXIMAS ETAPAS

### Fase 2: Integração com Motor de Cálculo
1. Refatorar `pdfFrequenciaMensalGenerator.ts` para consumir `config_jornada_padrao`
2. Implementar resolução hierárquica (servidor → cargo → unidade → órgão)
3. Criar função SQL `obter_jornada_servidor(servidor_id, data_referencia)`

### Fase 3: Calendário Oficial
1. Popular `dias_nao_uteis` com feriados nacionais e estaduais
2. Implementar cálculo de dias úteis baseado no calendário
3. Integrar com fechamento de frequência

### Fase 4: Banco de Horas
1. Implementar acumulação automática baseada em `config_compensacao`
2. Criar relatórios de saldo de banco de horas
3. Integrar com folha de pagamento

---

## 📁 ARQUIVOS RELACIONADOS

| Arquivo | Função |
|---------|--------|
| `src/hooks/useParametrizacoesFrequencia.ts` | Hook de consumo das configurações |
| `src/types/frequencia.ts` | Tipos TypeScript das entidades |
| `src/components/rh/ServidorFrequenciaConfigCard.tsx` | Card de configuração por servidor |
| `src/components/frequencia/config/*.tsx` | Componentes de configuração |

---

*Documento de implementação - Versão 1.0.0*
*Ver também: `.lovable/IMPLEMENTACAO_PARAMETRIZACAO_BASE.md`, `.lovable/MIGRACAO_VIDA_FUNCIONAL.md`*
