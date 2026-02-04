
# Plano: Reestruturação do PDF de Frequência em 5 Blocos Modulares

## Resumo das Alterações Solicitadas

O usuário solicita uma reorganização visual e estrutural do gerador de PDF de frequência, dividindo-o em 5 blocos distintos com tamanhos proporcionais, além de melhorias visuais específicas.

---

## Estrutura Proposta em 5 Blocos

```text
+------------------------------------------+
|           BLOCO 1: CABEÇALHO             |  ~22mm
|    Logos Gov (30%) e IDJuv (60%)         |
|    Textos institucionais                 |
+------------------------------------------+
|        BLOCO 2: DADOS DO SERVIDOR        |  ~26mm
|    Nome, matrícula, cargo, unidade       |
|    Fontes maiores e mais legíveis        |
+------------------------------------------+
|                                          |
|      BLOCO 3: CORPO DA FREQUÊNCIA        |  ~165mm
|    Tabela com 31 linhas                  |
|    Linhas mais visíveis nas colunas      |
|    Campos de horário e assinatura        |
|                                          |
+------------------------------------------+
|    BLOCO 4: DATA E ASSINATURAS FINAIS    |  ~22mm
|    Local/Data + Servidor + Chefe         |
+------------------------------------------+
|         BLOCO 5: RODAPÉ SISTEMA          |  ~8mm
|    Metadados de geração                  |
+------------------------------------------+
```

---

## Detalhamento Técnico por Bloco

### Bloco 1: Cabeçalho Institucional (~22mm)

**Alterações nas Logos:**
| Logo | Proporção Atual | Nova Proporção | Altura Calculada |
|------|-----------------|----------------|------------------|
| Governo RR | ~50% | **30%** | 8mm |
| IDJuv | ~50% | **60%** | 14mm |

**Cálculo das dimensões:**
- Logo Governo: 8mm altura × 3.69 (proporção) = ~29.5mm largura
- Logo IDJuv: 14mm altura × 1.55 (proporção) = ~21.7mm largura

**Implementação:**
- Atualizar constantes `logoGovernoHeight` e `logoIdjuvHeight`
- Manter logos alinhadas verticalmente ao centro do bloco
- Textos institucionais centralizados entre as logos

---

### Bloco 2: Dados do Servidor (~26mm)

**Melhorias nas fontes:**
| Campo | Tamanho Atual | Novo Tamanho |
|-------|---------------|--------------|
| Nome do Servidor | 9pt | **11pt** |
| Labels (Matrícula, Cargo...) | 5pt | **6pt** |
| Valores dos campos | 6.5pt | **8pt** |
| Badge de jornada | 6pt | **7pt** |

**Estrutura visual:**
- Borda arredondada com barra lateral colorida (mantido)
- Espaçamento interno aumentado para comportar fontes maiores
- Grid de 3 colunas para dados administrativos

---

### Bloco 3: Corpo da Frequência (~165mm)

**Melhorias visuais nas linhas separadoras:**

| Elemento | Espessura Atual | Nova Espessura | Cor |
|----------|-----------------|----------------|-----|
| Borda externa da tabela | 0.3pt | **0.5pt** | Cinza escuro |
| Linhas horizontais (linhas) | 0.1pt | **0.25pt** | Cinza médio |
| Linhas verticais (colunas) | 0.1-0.15pt | **0.3pt** | Cinza médio |
| Divisória entre turnos | 0.5pt | **0.8pt** | Verde institucional |

**Header da tabela:**
- Borda inferior mais forte (0.4pt)
- Separadores verticais mais visíveis

**Colunas da tabela:**
- Linhas verticais contínuas do header até a última linha
- Cor consistente em todas as separações

---

### Bloco 4: Data e Assinaturas Finais (~22mm)

**Estrutura:**
- Linha 1: "Boa Vista - RR, _______ de ________________________ de ________."
- Linha 2: Duas áreas de assinatura lado a lado
  - Esquerda: Assinatura do(a) Servidor(a)
  - Direita: Visto do(a) Chefe Imediato

**Melhorias:**
- Espaçamento adequado entre a tabela e esta área
- Linhas de assinatura mais espessas (0.5pt)
- Fontes maiores nos labels (8pt)

---

### Bloco 5: Rodapé do Sistema (~8mm)

**Conteúdo:**
- Esquerda: Data/hora de geração + usuário
- Centro: "IDJuv • Sistema de Gestão de Pessoas"
- Direita: Texto personalizado (se houver)

**Posicionamento fixo:**
- Sempre a 6mm da borda inferior da página
- Independente do conteúdo acima

---

## Arquivos a Modificar

| Arquivo | Alterações |
|---------|------------|
| `src/lib/pdfFrequenciaMensalGenerator.ts` | Reestruturação completa em 5 funções modulares + ajustes visuais |

---

## Implementação Proposta

### Novas Funções Modulares

```text
renderizarBloco1Cabecalho(doc, params)    → Logos 30%/60% + textos
renderizarBloco2DadosServidor(doc, params) → Fontes aumentadas
renderizarBloco3CorpoFrequencia(doc, params) → Linhas mais visíveis
renderizarBloco4Assinaturas(doc, params)   → Data + assinaturas
renderizarBloco5Rodape(doc, params)        → Metadados
```

### Constantes de Layout

```text
BLOCO_ALTURAS = {
  cabecalho: 22,      // mm
  dadosServidor: 26,  // mm
  assinaturas: 22,    // mm
  rodape: 8,          // mm
  // corpo: calculado dinamicamente
}

LOGO_PROPORCOES = {
  governo: 0.30,  // 30% de destaque visual
  idjuv: 0.60,    // 60% de destaque visual
}

LINHAS_TABELA = {
  externa: 0.5,
  horizontal: 0.25,
  vertical: 0.3,
  divisoriaTurno: 0.8,
}
```

---

## Benefícios da Reestruturação

1. **Código modular** - Cada bloco em função separada, facilitando manutenção
2. **Proporções calculadas** - Logos com destaque adequado (IDJuv maior)
3. **Legibilidade** - Fontes maiores nos dados do servidor
4. **Visual profissional** - Linhas de separação mais visíveis na tabela
5. **Flexibilidade** - Fácil ajustar alturas de cada bloco independentemente

