# REFATORAÇÃO DO MOTOR DE CÁLCULO DE FREQUÊNCIA
## Status: ✅ FASE 1 E FASE 2 IMPLEMENTADAS
### Data: 03/02/2026 | Versão 2.0.0

---

## 📋 RESUMO DA REFATORAÇÃO

O motor de cálculo de frequência foi refatorado para consumir **exclusivamente configurações do banco de dados**, eliminando regras hardcoded e preparando o sistema para parametrização total.

A refatoração mantém **compatibilidade total** com o comportamento anterior através de um sistema de fallback seguro.

---

## ✅ O QUE FOI IMPLEMENTADO

### 1. Hook de Configuração (`useConfigFrequencia.ts`)

Hook centralizado para obter configurações de frequência com fallback automático.

```typescript
import {
  useJornadaServidor,
  useRegimeServidor,
  useTiposAbonoConfig,
  useConfigCompensacaoAtiva,
  useDiasNaoUteisPeriodo,
} from '@/hooks/useConfigFrequencia';

// Exemplo de uso
const { data: jornada } = useJornadaServidor(servidorId, cargaHorariaPadrao);
const { data: regime } = useRegimeServidor(servidorId);
```

**Hierarquia de Resolução:**
1. Configuração específica do servidor
2. Configuração da unidade
3. Configuração padrão do órgão
4. Fallback hardcoded (com warning técnico)

### 2. Serviço de Cálculo (`frequenciaCalculoService.ts`)

Funções de cálculo parametrizadas que consomem configurações do banco.

| Função | Descrição |
|--------|-----------|
| `buscarConfigFrequenciaServidor()` | Busca todas as configurações para um servidor |
| `calcularResumoMensalParametrizado()` | Calcula resumo mensal usando configs do banco |
| `gerarRegistrosDiariosParametrizado()` | Gera registros diários para impressão |
| `calcularDiasUteisParametrizado()` | Calcula dias úteis considerando feriados |
| `calcularHorasDia()` | Calcula horas trabalhadas em um dia |
| `verificarDoisTurnos()` | Determina se usa 1 ou 2 turnos |

### 3. Hook Refatorado (`useFrequencia.ts`)

O hook principal foi refatorado para usar o serviço parametrizado:

**Antes (hardcoded):**
```typescript
const diasUteis = calcularDiasUteis(ano, mes); // Ignora feriados

(registros || []).forEach((r) => {
  switch (r.tipo) {
    case "normal":
      diasTrabalhados++;
      break;
    // ... tipos fixos
  }
});
```

**Depois (parametrizado):**
```typescript
// Busca dias não úteis do banco
const { data: diasNaoUteis } = await supabase
  .from("dias_nao_uteis")
  .select("*")
  .gte("data", dataInicio)
  .lte("data", dataFim);

// Calcula com configurações
const diasUteis = calcularDiasUteisParametrizado(ano, mes, diasNaoUteis, diasTrabalho);

// Recálculo usa serviço parametrizado
const resultado = await calcularResumoMensalParametrizado(servidor_id, ano, mes, registros);
```

---

## 🔧 SISTEMA DE FALLBACK

### Constantes de Fallback

```typescript
// src/hooks/useConfigFrequencia.ts

export const FALLBACK_JORNADA: ConfigJornadaPadrao = {
  carga_horaria_diaria: 6,
  carga_horaria_semanal: 30,
  tolerancia_atraso: 10,
  // ...
};

export const FALLBACK_REGIME: RegimeTrabalho = {
  codigo: 'PRESENCIAL',
  dias_trabalho: [1, 2, 3, 4, 5],
  // ...
};
```

### Logging Técnico

Quando fallback é usado, um warning técnico é logado (não visível ao usuário):

```
[FREQUENCIA-CONFIG] Usando fallback para jornada. Contexto: servidor abc123
Configure os parâmetros no banco de dados.
```

```
[FREQUENCIA] Cálculo usou fallback para: jornada, regime
```

---

## 📊 TABELAS CONSUMIDAS

| Tabela | Uso |
|--------|-----|
| `config_jornada_padrao` | Carga horária, turnos, tolerâncias |
| `regimes_trabalho` | Dias de trabalho, exigências de registro |
| `tipos_abono` | Tipos permitidos e regras (conta presença, exige doc) |
| `config_compensacao` | Banco de horas, limites |
| `dias_nao_uteis` | Feriados, recessos, pontos facultativos |
| `servidor_regime` | Vínculo servidor → regime/jornada |

---

## ✅ FASE 2: INTEGRAÇÃO COM PDF (IMPLEMENTADO)

O `pdfFrequenciaMensalGenerator.ts` foi refatorado para consumir o motor parametrizado:

### Alterações Realizadas

| Arquivo | Descrição |
|---------|-----------|
| `src/lib/pdfFrequenciaMensalGenerator.ts` | Importa `verificarDoisTurnos` do motor |
| `src/lib/pdfFrequenciaLote.ts` | Documentação de consumo do motor |
| `src/hooks/useGerarFrequenciaPDF.ts` | Refatorado para usar `buscarConfigFrequenciaServidor` |

### Fluxo de Dados

```text
useGerarFrequenciaPDF
    ↓
buscarConfigFrequenciaServidor (motor)
    ↓
    ├── jornada (banco ou fallback)
    ├── regime (banco ou fallback)
    ├── diasNaoUteis (banco)
    └── compensação (banco ou fallback)
    ↓
generateFrequenciaMensalPDF
    ↓
renderizarPaginaFrequencia
    ↓
verificarDoisTurnos (motor) → Layout 1 ou 2 turnos
```

### Regra de Turnos

A função `verificarDoisTurnos()` do motor define o layout:
- `carga_horaria_diaria >= 8` → 2 turnos, 2 campos de assinatura
- `carga_horaria_diaria <= 6` → 1 turno, 1 campo de assinatura

---

## 🔌 INTEGRAÇÃO FUTURA

### Fase 3: Integração com Folha

O cálculo de descontos pode consumir:

```typescript
// Faltas não justificadas impactam folha
const faltasSemAbono = resultado.faltas;
const valorDesconto = faltasSemAbono * (salarioBase / resultado.diasUteis);
```

---

## 📁 ARQUIVOS CRIADOS/MODIFICADOS

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `src/hooks/useConfigFrequencia.ts` | ✨ Criado | Hook de configurações com fallback |
| `src/lib/frequenciaCalculoService.ts` | ✨ Criado | Serviço de cálculo parametrizado |
| `src/hooks/useFrequencia.ts` | 🔧 Modificado | Refatorado para usar serviço |
| `src/lib/pdfFrequenciaMensalGenerator.ts` | 🔧 Modificado | Consome motor via `verificarDoisTurnos` |
| `src/lib/pdfFrequenciaLote.ts` | 🔧 Modificado | Documentação de consumo do motor |
| `src/hooks/useGerarFrequenciaPDF.ts` | 🔧 Modificado | Usa `buscarConfigFrequenciaServidor` |

---

## 📊 VERIFICAÇÃO

### Teste de Fallback

```sql
-- Verificar se existem configurações no banco
SELECT COUNT(*) FROM config_jornada_padrao WHERE ativo = true;
SELECT COUNT(*) FROM regimes_trabalho WHERE ativo = true;
SELECT COUNT(*) FROM tipos_abono WHERE ativo = true;

-- Se COUNT > 0, o sistema usa configurações do banco
-- Se COUNT = 0, o sistema usa fallback (com warning no console)
```

### Teste de Cálculo

```typescript
// No console do navegador (após login)
import { calcularResumoMensalParametrizado } from '@/lib/frequenciaCalculoService';

const resultado = await calcularResumoMensalParametrizado(
  'servidor-id',
  2026,
  2,
  [] // sem registros = apenas calcula dias úteis
);

console.log('Dias úteis:', resultado.diasUteis);
console.log('Usou fallback:', resultado.config.usouFallback);
```

---

*Documento de implementação - Versão 1.0.0*
*Ver também: `.lovable/MIGRACAO_FREQUENCIA_CONFIG.md`*
