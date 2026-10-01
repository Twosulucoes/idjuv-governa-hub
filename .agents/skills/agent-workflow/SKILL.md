---
name: agent-workflow
description: Workflow portátil do IDJUV Governa Hub para criar ou mudar qualquer coisa no repositório; agnóstico ao agente (Claude Code, Codex, Cursor).
---

# IDJUV Governa Hub — workflow portátil de agentes

Não depende de plugins nem de ferramentas específicas. No Claude Code, o adaptador é o skill `superpowers`
(`.claude/skills/superpowers/SKILL.md`), que usa os subagentes de `.claude/agents/`.

1. **Classificar:** spike (viabilidade), bounded (ajuste num fluxo existente) ou architectural (módulo, tabela, RBAC, fluxo novo). Na dúvida, o mais pesado. Bug → investigar causa raiz antes de corrigir.
2. **Explorar:** leia `AGENTS.md`, `CLAUDE.md`, a doc de `docs/` do assunto e o código vizinho. Ler não é verificar: rode o comando quando a afirmação depender do estado real.
3. **Desenhar e aprovar:** bounded → desenho curto; architectural → spec em `docs/superpowers/specs/` e **aprovação antes de implementar** (sessão interativa). Sessão autônoma: registre premissas e siga, parando só por risco.
4. **Planejar:** tarefas pequenas e verificáveis em `docs/superpowers/plans/` (arquivos, verificação, docs, invariantes de RLS/RBAC).
5. **Executar:** uma tarefa por vez. Delegue/paralelize somente se o ambiente realmente tiver subagentes; senão execute em sequência. Nunca simule delegação.
6. **Revisar:** diff, regressões, segurança (RLS/RBAC/secrets), padrões do repo.
7. **Verificar:** `bash scripts/gate.sh` (lint, typecheck, build) com saída lida. Sem evidência fresca, sem afirmação de conclusão.
8. **Entregar:** docs da matriz (`docs/GOVERNANCA_DOCUMENTACAO.md`), commit descritivo, PR rascunho a pedido, nunca merge automático.

Invariantes: RLS desde a migração; RBAC no banco e na rota; arquivos gerados do Supabase intocados; tenant-agnóstico; nada de dado de cliente em `public/`; documentação fiel ao código real.
