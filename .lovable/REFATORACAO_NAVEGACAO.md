# Refatoração de Navegação — Sistema IDJUV

## Data: 2026-02-02
## Versão: 2.0.0

---

## Resumo da Refatoração

Refatoração completa da navegação do sistema administrativo, eliminando vícios de crescimento incremental e criando uma arquitetura institucional, clara, responsiva, escalável e orientada a processos.

---

## Arquivos Criados

### Configuração
- `src/config/navigation.config.ts` — Estrutura hierárquica governamental completa

### Componentes
- `src/components/navigation/MenuLateralDesktop.tsx` — Menu lateral colapsável
- `src/components/navigation/MenuDrawerMobile.tsx` — Drawer hamburger mobile
- `src/components/navigation/TopBarDesktop.tsx` — Header desktop com breadcrumb
- `src/components/navigation/TopBarMobile.tsx` — Header mobile simplificado
- `src/components/navigation/index.ts` — Exports centralizados

### Hooks
- `src/hooks/useNavigacaoPermissoes.ts` — Filtro RBAC para navegação

---

## Arquivos Modificados

- `src/components/admin/AdminLayout.tsx` — Integração dos novos componentes
- `src/components/admin/AdminSearch.tsx` — Uso da nova configuração
- `src/components/admin/index.ts` — Exports atualizados

---

## Arquivos Legados (Mantidos para Compatibilidade)

- `src/components/admin/AdminSidebar.tsx` — Deprecated
- `src/components/admin/AdminHeader.tsx` — Deprecated
- `src/config/adminMenu.ts` — Deprecated
- `src/hooks/useMenuDinamico.ts` — Deprecated
- `src/components/menu/MenuDinamico.tsx` — Deprecated

---

## Estrutura de Navegação

### Desktop
```
📂 PROCESSOS
   ├─ Processos Administrativos
   ├─ Meus Processos
   ├─ Em Tramitação
   └─ Arquivados

🛒 COMPRAS & CONTRATOS
   ├─ Licitações
   ├─ Contratos
   ├─ Execução Contratual
   └─ Empenhos / Liquidações / Pagamentos

🧑‍💼 RECURSOS HUMANOS
   ├─ Servidores
   ├─ Movimentações Funcionais
   │   ├─ Designações
   │   ├─ Lotações
   │   └─ Central de Portarias
   ├─ Férias e Licenças
   ├─ Frequência
   ├─ Viagens e Diárias
   └─ Folha de Pagamento (Bloqueada)

🏢 PATRIMÔNIO & ALMOXARIFADO
   ├─ Bens Patrimoniais
   ├─ Movimentações de Bens
   ├─ Almoxarifado
   └─ Estoque

📊 ORÇAMENTO
   ├─ Dotação Orçamentária
   ├─ Créditos Adicionais
   └─ Execução Orçamentária

🧭 GOVERNANÇA & COMPLIANCE
   ├─ Documentos Legais
   │   ├─ Lei de Criação
   │   ├─ Decreto Regulamentador
   │   ├─ Regimento Interno
   │   └─ Portarias
   ├─ Matriz RACI
   ├─ Gestão de Riscos
   ├─ Controles Internos
   └─ Checklists TCE/TCU/CGU

🌐 TRANSPARÊNCIA & LAI
   ├─ Portal da Transparência
   ├─ Licitações Públicas
   ├─ Contratos Públicos
   ├─ Execução Orçamentária
   ├─ Patrimônio Público
   ├─ Cargos e Remuneração
   └─ e-SIC / LAI

🏆 PROGRAMAS
   ├─ Federações Esportivas
   ├─ Bolsa Atleta
   ├─ Juventude Cidadã
   └─ Esporte na Comunidade

🏛️ ESTRUTURA ORGANIZACIONAL
   ├─ Organograma
   ├─ Gestão do Organograma
   ├─ Cargos
   └─ Unidades Locais

📢 COMUNICAÇÃO
   ├─ Gestão de Demandas ASCOM
   ├─ Reuniões
   └─ Pré-Cadastros

⚙️ ADMINISTRAÇÃO DO SISTEMA
   ├─ Usuários
   ├─ Perfis e Permissões
   ├─ Central de Aprovações
   ├─ Auditoria / Logs
   ├─ Banco de Dados
   ├─ Backup Offsite
   ├─ Disaster Recovery
   └─ Ajuda
```

### Mobile (Priorização)
1. Processos
2. Meus Processos
3. Tramitação
4. Licitações
5. Servidores
6. Favoritos do usuário

---

## Compatibilidade

### RBAC
✅ Todos os itens verificam permissões via `useNavigacaoPermissoes`
✅ Grupos somem automaticamente se usuário não tiver acesso
✅ Super_admin vê todos os itens
✅ Fallback para mostrar tudo se RPC falhar

### Rotas
✅ Nenhuma rota existente foi alterada
✅ Todas as rotas continuam funcionando
✅ Breadcrumb funciona para todas as rotas

### Fases do Sistema
✅ Fase 4 — Transparência
✅ Fase 5 — Governança
✅ Fase 6 — Workflow

---

## Princípios Aplicados

1. **Institucional** — Linguagem de órgão público
2. **Por Função Administrativa** — Não por tabela/entidade
3. **RBAC Nativo** — Permissões verificadas no hook
4. **Mobile-First** — Adaptação real, não só CSS
5. **Escalável** — Suporta até Fase 10 sem refatoração
6. **Inspirado em SEI/e-Processo** — UX governamental

---

## Migração

Para remover completamente os arquivos legados após validação:

```bash
# Arquivos que podem ser removidos após validação completa:
# - src/config/adminMenu.ts
# - src/hooks/useMenuDinamico.ts
# - src/components/menu/MenuDinamico.tsx
# - src/components/admin/AdminSidebar.tsx
# - src/components/admin/AdminHeader.tsx
```

**⚠️ Recomendação:** Manter os arquivos legados por 30 dias para rollback.
