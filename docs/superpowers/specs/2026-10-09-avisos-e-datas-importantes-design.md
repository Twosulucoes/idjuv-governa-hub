# Avisos e datas importantes — desenho

**Data:** 2026-10-09 · **Classificação:** architectural (tabelas novas, tela nova, sino e destaque no layout)
**Pedido:** "preciso criar avisos no sistema, datas importantes, avisos..." (Fabiano)

## Premissas (sessão autônoma)

1. **Quem publica:** quem tem a permissão nova `avisos.gerenciar` (catálogo do módulo `comunicacao`) e o papel
   admin (que já passa por cima em `has_permission_code`). Ninguém mais escreve.
2. **Quem vê um aviso:** usuário ativo, aviso ativo e dentro da janela `inicio_em`..`expira_em`, e público
   `todos` ou um dos `modulos_alvo` acessível (`can_access_module`). Filtrado por RLS, não só no front.
3. **Feriados não ganham tabela nova:** já existem em `dias_nao_uteis` (Configuração de Frequência). O
   calendário os lê dali e completa com os feriados nacionais da BrasilAPI (público, sem chave), sem duplicar
   datas já cadastradas. Se a BrasilAPI falhar, o calendário segue só com o que está no banco.
4. **Aniversariantes:** a tabela `servidores` é restrita ao RH. Para todos verem os aniversariantes do mês
   sem abrir dado pessoal, uma RPC `aniversariantes_do_mes(mes)` devolve só nome (social, se houver) e dia —
   sem ano, CPF, contato ou lotação.
5. **Prazos da folha e demais datas:** cadastrados em `datas_importantes` (tipo `prazo`, `evento`,
   `reuniao`, `comemorativa`, `outro`), com recorrência anual opcional e módulos-alvo opcionais.
6. **Migração versionada, não aplicada:** ainda não há acesso ao Supabase do IDJUV. Os tipos gerados
   (`types.ts`) não são editados à mão; os hooks usam `from("<tabela>" as any)` como `useLinksUteis`.
7. **Texto simples:** o conteúdo do aviso é texto puro (renderizado como texto, quebra de linha preservada);
   sem HTML, sem risco de XSS.

## Desenho

### Banco (`supabase/migrations/20261009120000_avisos_e_datas_importantes.sql`)

| Tabela | Campos principais | RLS |
|---|---|---|
| `avisos` | titulo, conteudo, prioridade (`baixa/normal/alta/urgente`), destaque, publico (`todos/modulos`), modulos_alvo text[], inicio_em, expira_em, link, ativo | SELECT: gestor vê tudo; demais pela premissa 2. Escrita: `avisos.gerenciar` |
| `avisos_leituras` | aviso_id, user_id, lido_em (PK aviso+usuário) | cada usuário lê/insere/apaga só as suas; gestor lê todas (contagem de leitura) |
| `datas_importantes` | titulo, descricao, data, data_fim, tipo, recorrente_anual, modulos_alvo text[] (nulo = todos), ativo | SELECT: ativo e (sem alvo ou módulo acessível), gestor vê tudo. Escrita: `avisos.gerenciar` |

RPC `aniversariantes_do_mes(p_mes int)`: SECURITY DEFINER, `search_path` fixo, exige `is_active_user()`,
`EXECUTE` só para `authenticated`. Linha no `module_permissions_catalog` para `avisos.gerenciar`.

### Front

- `src/types/avisos.ts`, `src/hooks/useAvisos.ts`, `src/hooks/useDatasImportantes.ts`.
- `src/components/avisos/`: `AvisosSino` (sino no cabeçalho dos módulos com não lidos e próximas datas),
  `AvisosDestaque` (faixa no topo do conteúdo para avisos em destaque/urgentes não lidos, com "Marcar como
  lido"), `AvisoFormDialog`, `DataImportanteFormDialog`, `CalendarioDatasLista`.
- Página `src/pages/avisos/AvisosPage.tsx` em `/avisos` (`ProtectedRoute`, qualquer usuário logado), com abas
  Mural · Datas importantes · Gerenciar (só com `avisos.gerenciar`).
- Menu: item "Avisos e Datas" no módulo Comunicação; o sino leva a `/avisos` de qualquer módulo.

## Fora do escopo

Notificação por e-mail/push, anexos em aviso, confirmação de leitura obrigatória, importação automática de
prazos da folha a partir do motor de folha.
