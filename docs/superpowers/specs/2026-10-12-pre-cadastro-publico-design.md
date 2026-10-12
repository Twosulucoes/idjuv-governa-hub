# Pré-cadastro público (`/curriculo`) — desenho para aprovação (12/10/2026)

**Status:** proposta, nada implementado. Precisa de aprovação do dono antes de construir (cria superfície pública e
tabela nova do RH, que exige regenerar o baseline).

## 1. Problema (verificado no banco de produção e no código)

1. O candidato usa `/curriculo` **sem login** (papel `anon`). `anon` **não tem nenhum grant** em `pre_cadastros`, nem
   leitura de `servidores`. Resultado: criar, salvar e enviar o pré-cadastro falham; a checagem de CPF duplicado
   (`usePreCadastro.criar`) também.
2. O "código de acesso" é sequencial (`PC-2026-0001`, `0002`…): quem conhece o formato adivinha o código de outra
   pessoa. Se alguém abrisse a tabela ao `anon` para consertar o item 1, **qualquer um leria CPF, endereço, dados
   bancários e dependentes de todos os candidatos**.

Por isso a correção não é "dar permissão ao anon": é um acesso por **token secreto**, intermediado pelo servidor.

## 2. Desenho

```
candidato ──► /curriculo (React) ──► Edge Function `pre-cadastro-publico` (service role, só no servidor)
                                          │  valida token, campos permitidos, estado e limite de uso
                                          ▼
                                     pre_cadastros (RLS atual: só módulo rh/gabinete lê e grava)
```

- **Token:** 128 bits aleatórios (`gen_random_bytes(16)` em hex) na coluna nova `pre_cadastros.token_acesso`
  (índice único). Vai só no link enviado ao candidato (`/curriculo/<token>`). O `PC-AAAA-nnnn` continua existindo como
  **número de protocolo para o RH conversar com o candidato** (não é segredo e não dá acesso a nada).
- **Edge Function `pre-cadastro-publico`** (nunca devolve linha inteira de outra pessoa; só a do token):
  - `criar` → cria rascunho, devolve `token` e `codigo`. **Não revela** se o CPF já é servidor ou já tem pré-cadastro:
    responde sempre igual e o RH resolve a duplicidade na conversão (a conversão já recusa CPF existente).
  - `obter(token)` → devolve o rascunho do próprio token.
  - `salvar(token, dados)` → só campos de uma **lista permitida** (não aceita `status`, `servidor_id`, `observacoes` do
    RH, `codigo_acesso`); só enquanto o estado for `rascunho`.
  - `enviar(token)` → `rascunho → enviado`; depois disso o candidato só lê.
  - Estados `aprovado`, `rejeitado`, `convertido` são do RH (já são por RLS e pelo trigger de campos iniciais).
- **Validade do token:** 30 dias sem uso (`token_expira_em` renovado a cada salvamento); expirado → o candidato pede
  novo link.
- **Limite de uso:** por IP e por token (ex.: 20 criações/h por IP; 120 chamadas/h por token). Opções: (a) tabela
  `pre_cadastro_limite` (nova tabela do RH: mapa de RLS, autoria, baseline) ou (b) plugin de rate limit do Kong/Traefik
  na rota `/functions/v1/pre-cadastro-publico` (sem tabela, depende de infra).
- **Anti-robô:** campo isca (honeypot) obrigatoriamente vazio; captcha opcional (Cloudflare Turnstile) se houver abuso.
- **Trilha:** gravações pela função entram em `audit_logs` com origem `sistema` e **protocolo** próprio
  (`RH-AAAA-NNNNNN`, tipo `cadastro`); o candidato não é usuário do sistema, então o autor é "formulário público".
- **LGPD:** coleta limitada à lista de campos; sem listagem; sem resposta que confirme existência de CPF; logs sem o
  conteúdo dos campos (máscara já existente); aviso de finalidade na tela (a página já tem orientações).

## 3. Mudanças

| Onde | O quê |
|---|---|
| Migration | `pre_cadastros.token_acesso`, `token_expira_em`; índice único; trigger que gera o token no INSERT; função de validação de campos permitidos |
| Edge Function | `supabase/functions/pre-cadastro-publico/` (service role; ações acima; CORS só do domínio do site) |
| Front | `usePreCadastro` (uso público) passa a chamar a função; `MiniCurriculoPage` usa o token na URL; `PublicPageGuard` e CSP (`connect-src`) conferidos |
| Segurança | `anon` continua **sem** acesso à tabela; teste negativo no baseline (`testar-rls`) |
| Docs | `docs/EDGE_FUNCTIONS.md`, `docs/BANCO_DE_DADOS.md`, runbook do link ao candidato |

## 4. Testes previstos

- anônimo direto na tabela: negado (select, insert, update, delete);
- token errado, expirado ou de pré-cadastro já enviado: recusa sem vazar nada;
- `salvar` com `status`/`servidor_id`/`codigo_acesso`: campos ignorados;
- duas pessoas, dois tokens: nenhum lê o outro;
- limite de uso dispara; honeypot preenchido é recusado;
- fluxo completo no navegador (390 px): criar → salvar → enviar → RH converte → servidor e protocolo.

## 5. Decisões para o dono

1. **Aprova o acesso por token + Edge Function** (em vez de abrir a tabela)?
2. **Limite de uso:** tabela nova (mais controle, regenera baseline) ou limite no Kong/Traefik (mais simples, é infra)?
3. **Captcha** desde já (Turnstile) ou só se houver abuso?
4. **Validade do token:** 30 dias sem uso serve?
5. O link é enviado pelo RH ao candidato (e-mail/WhatsApp) ou o candidato abre o formulário sozinho em `/curriculo`
   (cria o próprio rascunho e recebe o link por e-mail)? A segunda opção exige confirmar o e-mail antes de gravar dados.
