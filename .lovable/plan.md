# Plano de Desenvolvimento - Sistema IDJuv

## Status das Fases

| Fase | Escopo | Status |
|------|--------|--------|
| 1 | Licitações e Contratos (schema) | ✅ Concluída |
| 2 | Orçamento e Patrimônio (schema) | ✅ Concluída |
| 3 | RH Administrativo | 🚧 Em Andamento |
| Futura | Folha de Pagamento | 🔒 Bloqueada |

---

## FASE 3 - RH Administrativo (Atual)

### Escopo Definido

A Fase 3 contempla exclusivamente o **RH administrativo**:
- Gestão de servidores
- Atos de pessoal (portarias, nomeações, exonerações)
- Frequência e controle de ponto
- Designações e lotações
- Processos administrativos

### Exclusões Explícitas (FASE 3)

- ❌ Cálculo de remuneração ou tributos
- ❌ Geração de CNAB ou remessas bancárias
- ❌ Integração e-Social
- ❌ Efeitos financeiros automatizados
- ❌ Contracheques e fichas financeiras operacionais

---

## DÉBITO TÉCNICO - FOLHA DE PAGAMENTO

### Status: 🔒 BLOQUEADO (Fase Futura)

O módulo de Folha de Pagamento foi **implementado tecnicamente** mas está **desativado** para a operação atual do IDJuv.

### Implementações Existentes (Não Operacionais)

#### Arquivos de Código

| Arquivo | Descrição |
|---------|-----------|
| `src/lib/folhaCalculos.ts` | Motor de cálculo INSS/IRRF progressivo |
| `src/hooks/useFolhaPagamento.ts` | Hooks para fichas financeiras, rubricas, impostos |
| `src/components/folha/*` | Componentes de UI (formulários, tabelas, diálogos) |
| `src/lib/pdfContracheque.ts` | Geração de contracheques PDF |
| `src/lib/cnabGenerator.ts` | Geração de remessas bancárias CNAB240/400 |
| `src/lib/esocialGenerator.ts` | Geração de eventos e-Social XML |
| `src/types/folha.ts` | Tipos TypeScript para o módulo |

#### Páginas Bloqueadas

| Rota | Página Original | Status |
|------|-----------------|--------|
| `/folha/gestao` | GestaoFolhaPagamentoPage | Redireciona para FolhaBloqueadaPage |
| `/folha/configuracao` | ConfiguracaoFolhaPage | Redireciona para FolhaBloqueadaPage |
| `/folha/:id` | FolhaDetalhePage | Redireciona para FolhaBloqueadaPage |

#### Tabelas no Banco (Sem Dados Operacionais)

| Tabela | Descrição |
|--------|-----------|
| `folhas_pagamento` | Competências mensais |
| `fichas_financeiras` | Registros por servidor/competência |
| `itens_ficha_financeira` | Rubricas lançadas |
| `rubricas` | Catálogo de proventos/descontos |
| `consignacoes` | Empréstimos consignados |
| `dependentes_irrf` | Dependentes para dedução |
| `tabela_inss` | Faixas INSS progressivo |
| `tabela_irrf` | Faixas IRRF + parcela a deduzir |
| `bancos_cnab` | Configuração de bancos |
| `remessas_bancarias` | Histórico de remessas |
| `eventos_esocial` | Eventos gerados |
| `config_autarquia` | Dados do órgão pagador |
| `config_folha` | Parâmetros gerais |

### Como Reativar (Fase Futura)

1. **App.tsx**: Restaurar imports das páginas originais
2. **App.tsx**: Remover redirecionamento para FolhaBloqueadaPage
3. **adminMenu.ts**: Descomentar bloco do menu "Folha de Pagamento"
4. Validar políticas RLS para operação real
5. Popular tabelas de configuração (INSS, IRRF, bancos, rubricas)

---

## Arquivos de Referência

### Correções Pendentes (PDF Frequência)

| # | Problema | Severidade | Localização |
|---|----------|------------|-------------|
| 1 | Logo IDJuv com proporção errada | Alta | `pdfLogos.ts` |
| 2 | Texto do Cargo sobrepondo Unidade | Alta | `pdfFrequenciaMensal.ts` |
| 3 | Falta de truncamento em campos longos | Média | `pdfFrequenciaMensal.ts` |

### Proporções Corretas dos Logos

| Logo | Arquivo | Proporção (L:A) |
|------|---------|-----------------|
| Governo RR | `logo-governo-roraima.jpg` | 3.69:1 |
| IDJuv | `logo-idjuv-oficial.png` | ~1.55:1 |

---

*Última atualização: Fevereiro/2026*
