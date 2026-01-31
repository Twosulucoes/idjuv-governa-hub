

# Plano de Correção: PDF de Frequência Mensal

## Problemas Identificados

| # | Problema | Severidade | Localização |
|---|----------|------------|-------------|
| 1 | Logo IDJuv com proporção errada (esticado/comprimido) | Alta | `pdfLogos.ts` |
| 2 | Texto do Cargo sobrepondo Unidade no cabeçalho | Alta | `pdfFrequenciaMensal.ts` |
| 3 | Falta de truncamento em campos longos | Média | `pdfFrequenciaMensal.ts` |
| 4 | Grid de dados com espaçamento inadequado | Média | `pdfFrequenciaMensal.ts` |

---

## Correções Propostas

### 1. Corrigir Proporção do Logo IDJuv

**Arquivo:** `src/lib/pdfLogos.ts`

A imagem `logo-idjuv-oficial.png` **não é quadrada** - ela é horizontal (aproximadamente 1400x900px, proporção ~1.55:1).

```typescript
// ANTES (ERRADO)
export const LOGO_ASPECTOS = {
  governo: 3.69,  // OK
  idjuv: 1.0,     // ERRADO - o logo não é quadrado!
};

// DEPOIS (CORRETO)
export const LOGO_ASPECTOS = {
  governo: 3.69,  // 1063 / 288 px
  idjuv: 1.55,    // ~1400 / 900 px (horizontal, não quadrado)
};
```

---

### 2. Corrigir Sobreposição de Texto no Cabeçalho

**Arquivo:** `src/lib/pdfFrequenciaMensal.ts` (linhas 274-309)

**Problemas atuais:**
- Campo "Cargo:" começa muito perto de "Matrícula:"
- Não há truncamento para cargos longos
- "Unidade:" fica colada no texto anterior

**Solução:**
- Reorganizar layout em linhas dedicadas
- Adicionar função de truncamento
- Usar `maxWidth` do jsPDF para evitar vazamento

```typescript
// Função auxiliar para truncar texto
function truncarTexto(doc: jsPDF, texto: string, maxWidth: number): string {
  if (doc.getTextWidth(texto) <= maxWidth) return texto;
  while (doc.getTextWidth(texto + '...') > maxWidth && texto.length > 0) {
    texto = texto.slice(0, -1);
  }
  return texto + '...';
}

// Layout reorganizado (4 linhas em vez de 3):
// Linha 1: SERVIDOR: [nome] | COMPETÊNCIA: [mês/ano]
// Linha 2: Matrícula: [mat] | Cargo: [cargo truncado]
// Linha 3: Unidade: [unidade] | Local: [local]
// Linha 4: Regime: [regime] | Jornada: [jornada]
```

---

### 3. Ajustar Grid do Cabeçalho

Aumentar altura do box de identificação de 18mm para 22mm e redistribuir os campos:

```text
┌──────────────────────────────────────────────────────────────┐
│ SERVIDOR: Crislane Penhalosa...        COMPETÊNCIA: Fev/2026│
│ Matrícula: 0012                                              │
│ Cargo: Membro da Comissão de Contratação                     │
│ Unidade: CPL - Comissão de Contratação                       │
│ Regime: Presencial    Jornada: 8h/dia | 40h/sem              │
└──────────────────────────────────────────────────────────────┘
```

---

## Resumo das Alterações

| Arquivo | Alteração |
|---------|-----------|
| `src/lib/pdfLogos.ts` | Corrigir proporção do IDJuv de 1.0 para ~1.55 |
| `src/lib/pdfFrequenciaMensal.ts` | Reorganizar grid do cabeçalho, adicionar truncamento |

---

## Detalhes Técnicos

### Proporções Corretas dos Logos

Para verificação, as dimensões reais são:

| Logo | Arquivo | Proporção (L:A) |
|------|---------|-----------------|
| Governo RR | `logo-governo-roraima.jpg` | 3.69:1 (horizontal amplo) |
| IDJuv | `logo-idjuv-oficial.png` | ~1.55:1 (horizontal moderado) |

### Cálculo de Dimensões no PDF

Com altura padrão de **14mm**:

| Logo | Largura | Altura |
|------|---------|--------|
| Governo | 51.7mm | 14mm |
| IDJuv | 21.7mm | 14mm |

---

## Resultado Esperado

Após as correções:
- Logos proporcionais e profissionais (mesma altura, larguras diferentes)
- Campos de texto sem sobreposição
- Layout limpo e oficial para uso em processos administrativos

