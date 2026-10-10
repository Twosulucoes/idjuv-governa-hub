# Onda B do RH — entrega B3: arquivos do RH no storage e download de frequência

Spec da terceira entrega da **Onda B** (`docs/planejamento/FINALIZACAO.md`, item 8), na sequência da B2
([spec](./2026-10-10-onda-b-rh-permissoes-design.md)). Levantamento pelo `arquiteto-idjuv` em 2026-10-10
sobre a `main` (depois das PRs #69, #71, #58 e #59). Premissas valem até o usuário dizer o contrário.

## O que existe hoje

| Bucket | Uso | Baseline (`overlay/50_storage.sql`) | Só migrações |
|---|---|---|---|
| `frequencias` | PDFs de frequência gerados em lote (`useFrequenciaPacotes.ts`) | lê e grava quem tem o módulo `rh` | **qualquer logado** lê e sobrescreve (`20260131151603`) |
| `documentos-requerimento` | documento assinado do servidor (`DocumentosServidorTab.tsx`), caminho `<servidor_id>/<doc_id>.<ext>` | lê e grava quem tem `rh` | **qualquer logado** lê, troca e apaga (`20260216171714`) |
| `documentos` | portarias, atos, cedência | lê e grava quem tem `workflow` ou `rh` | grava qualquer logado; **não há SELECT** (`20260116221736`) |

- `frequencia_pacotes` e `frequencia_arquivos` seguem com `acesso_total_*` no estado só-migrações (B1 e B2
  não as tocaram): qualquer logado lê o `link_download` e troca o `arquivo_path` do pacote.
- A Edge Function `download-frequencia` usa a service role e só confere se o token é válido: não exige
  perfil ativo, módulo nem permissão, e grava o e-mail do usuário no log. Com o link legível e o
  `arquivo_path` editável, devolve URL assinada de qualquer objeto do bucket `frequencias`.
- `DocumentosServidorTab` grava `getPublicUrl` num bucket privado: o link salvo não abre.
- O servidor não lê o próprio arquivo em nenhum dos dois buckets do RH.

## Premissas

1. **Dois estados do banco, como na B1 e na B2.** A migração vale no baseline e no replay só das
   migrações, é idempotente e remove as policies antigas por nome. O `overlay/50_storage.sql` recebe as
   mesmas policies, porque o `validar-baseline.sh` exige igualdade entre replay+overlays e baseline.
2. **Mesmo critério da B2 para o RH:** ler continua pelo módulo `rh` (mais o dono do arquivo); gravar
   exige o módulo **e** um código que o catálogo já tem. Nenhum código novo.
   - `frequencias` e as tabelas `frequencia_pacotes`/`frequencia_arquivos`: gravar com
     `rh.frequencia.lancar|criar|editar` (os códigos da `frequencia_mensal` na B2). O servidor lê o PDF
     dele (cruzando `frequencia_arquivos.arquivo_path` com `eh_meu_servidor`). Sem "nunca na própria":
     o lote da unidade inclui o próprio RH, e o arquivo é gerado, não decidido.
   - `documentos-requerimento`: gravar com `rh.servidores.editar`; o servidor lê a pasta dele
     (`<servidor_id>/…`). O servidor **não** envia arquivo (não há tela para isso).
   - Bucket `documentos-requerimento` ganha limite de 10 MB e tipos PDF e imagem, como `documentos`.
3. **`documentos` fica por módulo (`workflow` ou `rh`)**, só alinhando o replay ao baseline (inclui o
   SELECT que falta). Escolher o dono do bucket (RH, governança, workflow; cedência é patrimônio) e
   trocar os links públicos de portarias, atos e cedência fica para depois.
4. **`download-frequencia` passa a exigir perfil ativo, o módulo `rh` e `rh.frequencia.visualizar`**
   (o mesmo da rota `/rh/frequencia/pacotes`), checados pelo banco com o id do usuário do token, antes de
   qualquer leitura com a service role. Sai o e-mail do log. CORS continua `*`: a função só aceita
   `Authorization: Bearer`, sem cookie.
5. **Front mínimo:** `DocumentosServidorTab` grava o caminho e abre com URL assinada; links antigos já
   gravados (URL pública) são convertidos em caminho na leitura, sem migração de dados. O upload de
   frequência deixa de usar `upsert` (o caminho já tem carimbo de tempo). `DocumentosServidorTab` é
   aba de `ServidorDetalhePage` (tela da thread de design system): só a lógica de arquivo muda, nada de
   layout.
6. **Nada é aplicado em banco remoto.** O CI aplica no merge.

## O que muda

1. Migração `supabase/migrations/20261010110000_onda_b_rh_storage.sql`:
   - funções `eh_meu_arquivo_frequencia(text)` e `eh_minha_pasta_servidor(text)`: `plpgsql`/`sql`
     `STABLE SECURITY DEFINER`, `search_path` fixo, `EXECUTE` só para `authenticated`; a segunda valida o
     formato de uuid antes do cast;
   - remove as policies antigas dos três buckets (nomes das migrações e `st_*`) e cria
     `st_<bucket>_{select,insert,update,delete}` conforme as premissas 2 e 3;
   - limite e tipos do bucket `documentos-requerimento`;
   - `frequencia_pacotes` e `frequencia_arquivos` na classe `permissao` (SQL copiado do gerador, como na
     B2), removendo `acesso_total_*`.
2. `supabase/baseline/`: `overlay/50_storage.sql` (mesmas policies e funções no overlay 10),
   `rls/mapa.csv` + `35_policies_geradas.sql`, `overlay/40_privilegios.sql`, schema regenerado.
3. `scripts/db/testar-rls.sql`: storage por permissão e por dono (personas `perm_*` e servidor), com
   prova de vida no estado anterior.
4. `supabase/functions/download-frequencia/index.ts`: checagem de permissão e log sem e-mail.
5. Front: `src/lib/storageArquivos.ts` (caminho a partir de URL antiga + URL assinada),
   `DocumentosServidorTab.tsx`, `useFrequenciaPacotes.ts`.
6. Docs: `docs/RBAC_PERMISSOES.md` (subseção B3), `docs/BANCO_DE_DADOS.md`, `docs/EDGE_FUNCTIONS.md`,
   `supabase/baseline/README.md`, `docs/planejamento/FINALIZACAO.md`, `docs/planejamento/ROADMAP.md`.

## Fora de escopo

- Dono e permissões do bucket `documentos`; links públicos de portarias (`NovaPortariaSimplificada`,
  `RegistrarAssinaturaDialog`, `RegistrarPublicacaoDialog`), `GestaoDocumentosPage` e cedência.
- O ZIP do pacote de frequência, que nunca é gravado (o download fica sem arquivo até isso existir).
- Nome do servidor no caminho do PDF de frequência.
- Buckets de outros módulos (patrimônio, ASCOM, árbitros, transparência).
- Restringir CORS das Edge Functions à origem do tenant.
