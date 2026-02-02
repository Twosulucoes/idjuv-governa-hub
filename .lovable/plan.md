
# Plano: Limitação da Tabela para Não Invadir o Rodapé

## Diagnóstico

O problema identificado é que a tabela de frequência está sendo renderizada com **31 linhas fixas**, sem considerar o espaço disponível na página. Atualmente:

- O **rodapé do sistema** está fixo em `pageHeight - 6` (linha 700)
- A **área de assinaturas finais** e a **linha de data** são renderizadas após a tabela
- Não há cálculo prévio para garantir que todo o conteúdo caiba antes do rodapé

## Cálculo do Espaço Disponível

Estrutura atual da página A4 (297mm altura):

| Elemento | Altura Atual |
|----------|-------------|
| Margem superior | 8mm |
| Cabeçalho institucional | 20mm |
| Espaço após cabeçalho | 2mm |
| Card de identificação | 24mm |
| Espaço após card | 2mm |
| Header da tabela | 10-12mm |
| **31 linhas × 6.8mm** | **~211mm** |
| Espaço após tabela | 2mm |
| Linha de data | 8mm |
| Área de assinaturas | ~10mm |
| Rodapé do sistema | 6mm |

**Total estimado: ~303mm** — ultrapassa os 297mm disponíveis!

## Solução Proposta

Implementar um **cálculo dinâmico** que determine a altura máxima disponível para a tabela, ajustando automaticamente o `rowHeight` para que o conteúdo sempre caiba em uma página.

### Ajustes Técnicos

1. **Definir zona de proteção do rodapé**
   - Reservar espaço fixo para: linha de data (8mm) + assinaturas (12mm) + rodapé do sistema (8mm) = **28mm**

2. **Calcular altura disponível para tabela**
   ```text
   alturaDisponivel = pageHeight - margemSuperior - cabeçalho - card - headerTabela - zonaRodape
   ```

3. **Ajustar `rowHeight` dinamicamente**
   ```text
   rowHeight = alturaDisponivel / 31 (linhas fixas)
   ```

4. **Validar altura mínima**
   - Se `rowHeight` calculado for menor que 5.5mm (mínimo legível), manter 5.5mm e aceitar que algumas folhas podem ter layout mais apertado

### Arquivos a Modificar

- `src/lib/pdfFrequenciaMensalGenerator.ts`
  - Adicionar constante `ZONA_RODAPE` (~28mm)
  - Calcular `alturaDisponivelTabela` antes de iniciar a renderização das linhas
  - Ajustar `rowHeight` proporcionalmente

### Benefícios

- Garante que o documento nunca ultrapasse uma página
- Protege a área do rodapé e assinaturas
- Mantém layout institucional e profissional
- Funciona automaticamente para jornadas de 6h e 8h
