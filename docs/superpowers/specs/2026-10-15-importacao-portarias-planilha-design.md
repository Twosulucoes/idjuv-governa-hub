# Importação de portarias por planilha

Data: 2026-10-15. Pedido do dono (Fabiano, 15/10/2026): não copiar as portarias de nomeação para o repositório;
em vez disso, um processo de importação de planilhas, pelo sistema e também pelo banco. Ele autorizou seguir sem
mandar os títulos da planilha dele ("segue"): o sistema oferece um **modelo padrão** para preencher.

Classificação: bounded (importador novo na Central de Importações, uma RPC e uma permissão; nenhuma RLS existente muda).

## Premissas (decididas na sessão, revisáveis pelo dono)

1. **Só matrícula** identifica o servidor. CPF não entra na planilha (LGPD: não trafega, não vai para log).
2. **Tudo ou nada** na aplicação: com qualquer linha com erro, nada é gravado.
3. **Não percorre o ciclo** de portaria já existente: o importador só preenche campos vazios e soma servidores; mudança
   de etapa vira aviso ("avance na tela da portaria").
4. **Pendência `PENDENTE/AAAA`** do mesmo servidor e categoria não é alterada: a linha é inserida normalmente e a
   simulação avisa que existe a pendência, para o usuário concluí-la ou cancelá-la na tela.
5. **Quem importa:** módulo `gabinete` + permissão nova `gabinete.portarias.importar` (o papel admin passa por
   `has_permission_code`). RH não importa nesta versão.
6. Sem coluna de cargo nesta versão.
7. **Anexo não entra:** o PDF sobe depois na própria portaria.

## Modelo de planilha (aba "Portarias")

| Coluna | Regra |
|---|---|
| Número | Obrigatório; `NNN/AAAA` (normaliza `1/2026` → `001/2026`); `PENDENTE` recusado; repetido no arquivo é erro. Chave da importação. |
| Data da portaria | Obrigatória; dd/mm/aaaa, AAAA-MM-DD ou data do Excel; não futura. |
| Categoria | Obrigatória; código ou rótulo da tela (Nomeação, Exoneração, …). |
| Ementa | Opcional, até 2000 caracteres. Título = ementa ou "Portaria nº X". |
| Processo SEI | Opcional, até 60 caracteres. |
| Situação | Opcional: Aguardando assinatura, Assinada, Publicada, Vigente. Vazia: Publicada se houver DOE, senão Aguardando assinatura. Revogada recusada. |
| Assinado por / Data da assinatura | Obrigatórios se Assinada. |
| Nº DOE / Data DOE | Juntos; obrigatórios se Publicada ou Vigente; Data DOE não anterior à data da portaria. |
| Início da vigência / Fim da vigência | Início obrigatório se Vigente; fim não antes do início. |
| Matrículas | Opcional; várias separadas por `;`. Vira `servidores_ids`. Nas categorias de pessoal, vazio é aviso. |
| Observações | Opcional (aviso: não colocar dado pessoal). |

## Ação por linha

- `inserir`: número não existe.
- `atualizar`: número existe e há o que preencher (campos vazios: processo SEI, ementa, DOE quando já publicada/vigente,
  vigência) ou servidores novos (somados). Nunca muda categoria nem status, nunca remove servidor.
- `sem_alteracao`: nada a mudar. Nada é apagado; não há `ausentes`.

## Banco

RPC `public.importar_portarias_planilha(p_linhas jsonb, p_arquivo jsonb, p_simular boolean DEFAULT true) RETURNS jsonb`,
`SECURITY DEFINER`, `search_path` fixo, mesmo padrão de `importar_qdd_fiplan` (migração `20261009153000`):
`auth.uid()` + `perfil_ativo_atual()` + `can_access_module(uid,'gabinete')` + `has_permission_code(uid,'gabinete.portarias.importar')`,
senão 42501; 1 a 2000 linhas; `pg_try_advisory_xact_lock` (com outra em andamento, erro `55P03` na hora). Cada linha roda num bloco com savepoint fazendo o INSERT/UPDATE
real (triggers `documentos_portaria_validar`, índice único, regra de setor), desfeito na simulação; o erro vira erro da
linha. Aplicação com erro em qualquer linha aborta tudo. Log em `importacoes` (tipo `portarias_planilha`, módulo
`gabinete`). Retorno = `ResultadoBanco` + `erros[{indice,mensagem}]` e `avisos` por linha. Grants: `REVOKE ALL FROM PUBLIC, anon`;
`EXECUTE` para `authenticated`. Permissão no `module_permissions_catalog` na mesma migração.

**Via banco:** a mesma RPC chamada por `psql` (túnel SSH), carregando o CSV numa tabela `TEMP` e assumindo o usuário real
(`SET LOCAL role authenticated` + `request.jwt.claims`), com simulação e depois aplicação. Sem usuário, `auth.uid()` é
nulo e a RPC recusa. Procedimento em `docs/BANCO_DE_DADOS.md`, operado por humano.

## Front

`src/lib/importacao/planilha.ts` (leitura da primeira aba, normalização de cabeçalho, datas, gerar modelo),
`src/lib/importacao/importadores/portariasPlanilha.ts` (parser testado com vitest), campo opcional `modelo` em
`Importador` e botão "Baixar modelo" no assistente; `ROUTE_PERMISSIONS` e menu da Central aceitam as permissões de
todos os importadores.

## Contrato front ↔ RPC

Cada item de `p_linhas` (já normalizado pelo front; datas `AAAA-MM-DD`; campos vazios `null`):

```json
{ "indice": 0, "numero": "001/2026", "data_documento": "2026-01-10", "categoria": "nomeacao",
  "ementa": null, "processo_sei": null, "status": "publicado", "status_informado": true,
  "assinado_por": null, "data_assinatura": null,
  "doe_numero": "1234", "doe_data": "2026-01-12", "data_vigencia_inicio": null, "data_vigencia_fim": null,
  "matriculas": ["12345"], "observacoes": null }
```

`status_informado` (boolean): `true` quando a coluna Situação veio preenchida na planilha; `false` quando o front
preencheu `status` por padrão (publicado com DOE, senão aguardando assinatura). Só com `true` a RPC avisa que a
situação da planilha difere da do sistema. Ausente ou `null`: a RPC trata como `status` preenchido (o front deve
enviar sempre).

`p_arquivo`: `{ "nome", "sha256", "tamanho" }` (validado só na aplicação). Retorno:

```json
{ "simulacao": true, "importacao_id": null,
  "totais": { "inserir": 1, "atualizar": 0, "sem_alteracao": 0 },
  "linhas": [ { "indice": 0, "acao": "inserir", "mudancas": { "campo": [null, "valor"] }, "avisos": ["..."] } ],
  "erros": [ { "indice": 3, "mensagem": "Matrícula 999 não encontrada" } ] }
```

Na aplicação, com `erros` não vazio a RPC não grava nada e devolve o mesmo formato com `importacao_id` nulo. O front
re-valida o que pode (formato, obrigatórios, datas, repetidos no arquivo) e a RPC confere tudo de novo.
