
# Plano: Cadastro de Instituicoes e Integracao com Solicitacoes de Espaco

## Visao Geral

Criar um sistema robusto de cadastro de instituicoes (formais e informais) que possam solicitar o uso de espacos publicos (Unidades Locais). O sistema deve suportar tres categorias de solicitantes: instituicoes formais com CNPJ, grupos informais sem CNPJ e orgaos publicos. Todas as solicitacoes de uso de espaco devem estar vinculadas a um processo SEI para aprovacao.

---

## Arquitetura Proposta

```text
MODELO DE DADOS
┌─────────────────────────────────────────────────────────────────────┐
│                         instituicoes                                 │
│  (Cadastro central de todas as entidades solicitantes)              │
├─────────────────────────────────────────────────────────────────────┤
│  tipo_instituicao: formal | informal | orgao_publico                │
│  cnpj (opcional para informal)                                       │
│  razao_social / nome_grupo                                           │
│  responsavel_legal                                                   │
│  contatos, endereco, documentos                                      │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              │ instituicao_id (FK)
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      agenda_unidade                                  │
│  (Solicitacoes de uso de espaco - tabela existente)                 │
├─────────────────────────────────────────────────────────────────────┤
│  + instituicao_id (novo campo)                                       │
│  + processo_sei (novo campo obrigatorio para aprovacao)              │
│  + numero_protocolo_sei (referencia externa)                         │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Detalhamento dos Tipos de Instituicao

| Tipo | Descricao | Campos Obrigatorios |
|------|-----------|---------------------|
| **formal** | Entidades com registro (associacoes, ONGs, clubes, ligas) | CNPJ, razao social, representante legal |
| **informal** | Grupos sem CNPJ (times amadores, coletivos, grupos de bairro) | Nome do grupo, responsavel, documento do responsavel |
| **orgao_publico** | Secretarias, prefeituras, orgaos governamentais | Nome do orgao, esfera (municipal/estadual/federal), servidor responsavel |

---

## Componentes a Criar

### 1. Banco de Dados (Migration SQL)

**Tabela: instituicoes**
```text
- id (UUID, PK)
- codigo_instituicao (auto-gerado: INS-0001)
- tipo_instituicao (enum: formal, informal, orgao_publico)
- nome_razao_social (nome ou razao social)
- nome_fantasia (opcional)
- cnpj (obrigatorio se formal)
- inscricao_estadual (opcional)
- esfera_governo (se orgao: municipal, estadual, federal)
- orgao_vinculado (texto livre para orgaos)
- endereco_* (logradouro, numero, bairro, cidade, uf, cep)
- telefone, email, site
- responsavel_nome
- responsavel_cpf
- responsavel_cargo
- responsavel_telefone
- responsavel_email
- ato_constituicao (estatuto, lei criacao, etc)
- ato_documento_url (arquivo anexo)
- data_fundacao
- area_atuacao (texto ou array)
- observacoes
- status (ativo, inativo, pendente_validacao)
- validado_por, data_validacao
- ativo, created_at/by, updated_at/by
```

**Alteracoes em agenda_unidade**
```text
+ instituicao_id (FK para instituicoes, opcional)
+ numero_processo_sei (varchar, obrigatorio para aprovacao)
```

**View: v_instituicoes_resumo**
- Consolidar dados para listagem e relatorios

### 2. Tipos TypeScript

| Arquivo | Conteudo |
|---------|----------|
| `src/types/instituicoes.ts` | Tipos, enums e labels para instituicoes |

### 3. Hooks de Dados

| Arquivo | Conteudo |
|---------|----------|
| `src/hooks/useInstituicoes.ts` | CRUD completo de instituicoes |

### 4. Componentes UI

| Arquivo | Descricao |
|---------|-----------|
| `src/components/instituicoes/InstituicaoFormDialog.tsx` | Dialog de cadastro/edicao |
| `src/components/instituicoes/InstituicaoCard.tsx` | Card resumo da instituicao |
| `src/components/instituicoes/InstituicaoSelector.tsx` | Seletor reutilizavel para formularios |
| `src/components/instituicoes/TipoInstituicaoBadge.tsx` | Badge visual do tipo |

### 5. Paginas

| Arquivo | Descricao |
|---------|-----------|
| `src/pages/instituicoes/GestaoInstituicoesPage.tsx` | Listagem e gestao |
| `src/pages/instituicoes/InstituicaoDetalhePage.tsx` | Visualizacao detalhada |

### 6. Alteracoes em AgendaTab

Modificar o formulario de nova reserva para:
1. Permitir selecionar uma instituicao cadastrada
2. Adicionar campo obrigatorio de numero do processo SEI
3. Bloquear aprovacao se nao houver processo SEI informado

---

## Fluxo de Uso

```text
1. CADASTRO DA INSTITUICAO
   Usuario interno acessa /admin/instituicoes
   → Clica em "Nova Instituicao"
   → Seleciona o tipo (formal/informal/orgao)
   → Preenche dados conforme tipo
   → Salva (status: ativo)

2. SOLICITACAO DE ESPACO
   Usuario acessa Unidade Local → Agenda
   → Clica em "Nova Reserva"
   → Seleciona instituicao cadastrada OU preenche dados avulsos
   → Informa numero do processo SEI
   → Submete solicitacao (status: solicitado)

3. APROVACAO
   Gestor visualiza solicitacao
   → Sistema verifica se tem processo SEI (obrigatorio)
   → Aprova ou rejeita
   → Gera termo de cessao
```

---

## Integracao com SEI

**Regra de Negocio Principal:**
- O campo `numero_processo_sei` e **obrigatorio** para mudar status de "solicitado" para "aprovado"
- Bloquear aprovacao via frontend e backend se processo SEI nao informado
- Formato sugerido: XXXX.XXXXXX/YYYY-XX (padrao SEI)

**Implementacao:**
1. Adicionar validacao no frontend (botao de aprovar desabilitado)
2. Adicionar trigger no banco para impedir UPDATE de status sem processo SEI
3. Exibir alerta visual quando processo SEI estiver vazio

---

## Seguranca e Permissoes

**Nova Permissao RBAC:**
- `instituicoes.visualizar` - Ver listagem e detalhes
- `instituicoes.gerenciar` - Criar, editar, excluir

**Politicas RLS:**
- SELECT: usuarios com permissao `instituicoes.visualizar` ou super_admin
- INSERT/UPDATE/DELETE: usuarios com permissao `instituicoes.gerenciar` ou super_admin

---

## Migracao de Dados Existentes

Para solicitacoes ja feitas com dados avulsos (sem instituicao vinculada):
- Manter compatibilidade: instituicao_id pode ser NULL
- Dados do solicitante ja preenchidos continuam funcionando
- Possibilidade futura de vincular retroativamente

---

## Integracao com Federacoes

As federacoes esportivas (`federacoes_esportivas`) ja possuem cadastro proprio. A abordagem sera:
- **Nao duplicar dados**: Federacoes continuam na tabela propria
- **Manter selector separado**: Toggle "Solicitante e Federacao" continua funcionando
- **Opcao futura**: Criar view unificada para consolidar todos os tipos de solicitantes

---

## Resumo de Arquivos

### Novos Arquivos

| Caminho | Tipo |
|---------|------|
| `src/types/instituicoes.ts` | Tipos TypeScript |
| `src/hooks/useInstituicoes.ts` | Hook de dados |
| `src/components/instituicoes/InstituicaoFormDialog.tsx` | Dialog de formulario |
| `src/components/instituicoes/InstituicaoCard.tsx` | Card visual |
| `src/components/instituicoes/InstituicaoSelector.tsx` | Seletor reutilizavel |
| `src/components/instituicoes/TipoInstituicaoBadge.tsx` | Badge de tipo |
| `src/pages/instituicoes/GestaoInstituicoesPage.tsx` | Pagina de gestao |
| `src/pages/instituicoes/InstituicaoDetalhePage.tsx` | Pagina de detalhe |

### Arquivos a Modificar

| Caminho | Alteracao |
|---------|-----------|
| `src/components/unidades/AgendaTab.tsx` | Adicionar selector de instituicao e campo SEI |
| `src/types/unidadesLocais.ts` | Adicionar campos para instituicao e SEI |
| `src/config/menu.config.ts` | Adicionar rota de instituicoes |
| `src/App.tsx` | Registrar novas rotas |

### Migrations SQL

| Descricao |
|-----------|
| Criar enum tipo_instituicao |
| Criar tabela instituicoes |
| Adicionar colunas em agenda_unidade (instituicao_id, numero_processo_sei) |
| Criar trigger de validacao SEI para aprovacao |
| Criar view v_instituicoes_resumo |
| Inserir permissoes RBAC |

---

## Ordem de Implementacao

1. **Fase 1**: Migration SQL (tabela, enum, trigger SEI)
2. **Fase 2**: Tipos TypeScript e Hook de dados
3. **Fase 3**: Componentes UI basicos (Dialog, Card, Selector)
4. **Fase 4**: Pagina de Gestao de Instituicoes
5. **Fase 5**: Integracao com AgendaTab (selector + campo SEI)
6. **Fase 6**: Permissoes RBAC e RLS
7. **Fase 7**: Testes e ajustes finais
