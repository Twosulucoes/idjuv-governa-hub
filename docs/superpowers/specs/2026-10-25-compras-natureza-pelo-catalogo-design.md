# Natureza de despesa sugerida pelo catálogo do governo (PCA e processos)

- **Data:** 25/10/2026
- **Pedido:** Fabiano, thread "Importar planilha de contratações e PCA 2027": "a classificação da despesa ser padrão
  vindo do PNCP ou outra fonte". Escolheu "Sim, no PCA e nos processos".
- **Classificação:** bounded (sem tabela nova, sem mudança de RLS; uma ação nova na Edge Function `catalogo-compras`).
- **Base:** PCA entrega 1 (`docs/superpowers/specs/2026-10-23-compras-gerador-pca-design.md`) e reservas por natureza
  (`docs/superpowers/specs/2026-10-23-compras-processos-reserva-natureza-design.md`).

## 1. Problema

Hoje a natureza de despesa é escolhida à mão, num select com todas as naturezas, no item do PCA e na reserva do
processo. Erro comum: a mesma compra aparece como 4.4.90.52 numa aba e 3.3.90.30 em outra (planilha de 25/10).

## 2. Fonte oficial

O portal de dados abertos do Compras.gov.br (o mesmo catálogo CATMAT/CATSER usado no PNCP e que o sistema já consulta)
diz quais naturezas valem para cada material e serviço:

| Catálogo | Endpoint | Chave |
|---|---|---|
| Material (PDM) | `modulo-material/5_consultarMaterialNaturezaDespesa` | `codigoPdm` |
| Serviço | `modulo-servico/8_consultarNaturezaDespesaServico` | `codigoServico` |

Resposta: `codigoNaturezaDespesa` (8 dígitos, ex. `33904099`), `nomeNaturezaDespesa`, `statusNaturezaDespesa`.
Conferido em 25/10/2026: os dois respondem da Edge Function (mesmo host já liberado).

A fonte tem sujeira, então o sistema filtra (função pura, testada):
1. Só código com 8 dígitos, categoria 3 ou 4 e grupo 1 a 6 (descarta lixo como `30903030`).
2. Descarta status inativo (`false` ou `"0"`).
3. Descarta elemento 92 (despesas de exercícios anteriores), que nunca é natureza de um PCA ou de uma reserva nova.
4. Casa com a tabela de naturezas do FIPLAN de Roraima (`fin_naturezas_despesa`): primeiro os 8 dígitos; se o
   subelemento federal não existir em Roraima, cai para o elemento (6 dígitos ou `xx.00`). Natureza que não existe
   na tabela do estado não é sugerida.

## 3. O que muda para quem usa

### 3.1 Item do PCA (Compras → PCA → Novo item)
- Ao escolher o material (PDM) ou o serviço no catálogo, o sistema busca as naturezas no portal.
- **Uma só natureza válida:** o campo é preenchido sozinho, com a etiqueta "Sugerida pelo catálogo".
- **Mais de uma:** as válidas aparecem primeiro no select, marcadas "do catálogo"; a pessoa escolhe.
- **Natureza escolhida fora das do catálogo:** aviso amarelo "Esta natureza não é a indicada no catálogo para este
  item" (não bloqueia: a classificação final é de quem responde pelo PCA).
- **Portal fora do ar:** nada muda; o select segue como hoje, com um aviso discreto.

### 3.2 Reserva do processo (Compras → Processos → abrir → Reservas → Nova reserva)
A reserva já escolhe uma combinação ação × fonte × natureza do QDD. A sugestão marca as combinações cuja natureza é a
indicada, nesta ordem de força:
1. **PED do processo** (FIPLAN, já ligado pelo nº SEI): a natureza que o próprio PED usou.
2. **Empenho do processo** (FIP 614, pelo nº SEI).
3. **Item do PCA com o mesmo nº SEI** (o "Puxar do PCA" que já existe).
4. **Catálogo:** botão novo "Classificar pelo catálogo" abre a mesma busca do PCA; escolhido o material ou serviço,
   o sistema marca as combinações do QDD com a natureza indicada.

As combinações indicadas sobem para o topo da lista com a origem escrita ao lado ("do PED", "do empenho", "do PCA",
"do catálogo"). Se só uma combinação do QDD bater, ela já vem escolhida. Natureza fora da indicada: mesmo aviso
amarelo do PCA, sem bloquear.

## 4. Técnica

- **Edge Function `catalogo-compras`:** ação nova `naturezas` `{tipo: "material" | "servico", codigo}` → lista
  `{codigo, nome, ativo}` lida do portal (até 500 linhas, uma página). Mesma checagem de hoje: módulo compras e
  `compras.pca.visualizar` ou `editar`. Só leitura, não grava nada. URL montada em `portal.ts` (host fixo), com teste.
- **Função pura** `src/lib/pca/naturezaCatalogo.ts`: filtra (§2, passos 1 a 3) e casa com as naturezas do sistema
  (§2, passo 4). Testes em vitest.
- **Hook** `useNaturezasDoCatalogo(tipo, codigo)` em `usePca.ts` (React Query, `staleTime` longo: a tabela do portal
  quase não muda).
- **Processos:** as naturezas do PED, do empenho e do PCA já chegam ao front pelas consultas das abas Financeiro e
  Reservas; a ordem de força (§3.2) é outra função pura no mesmo arquivo, com teste.
- **Banco:** nada muda. Sem migração, sem RLS nova. As naturezas do estado já são lidas por `pca_classificadores`.

## 5. Fora do escopo

- Gravar a origem da sugestão no banco (pode vir depois, se o controle interno pedir).
- Classificar por IA a partir do texto do objeto (fica para a entrega 3 do PCA, que já prevê IA).
- Planilha de importação de PCA (não existe importador de PCA; é outro pedido).

## 6. Plano (uma PR)

| # | Tarefa | Arquivos | Verificação |
|---|---|---|---|
| 1 | URL e leitura das naturezas no portal | `supabase/functions/catalogo-compras/portal.ts` (+ teste) | vitest |
| 2 | Ação `naturezas` na função | `supabase/functions/catalogo-compras/index.ts` | revisão de segurança (só leitura, mesma permissão) |
| 3 | Filtro e casamento com as naturezas do estado | `src/lib/pca/naturezaCatalogo.ts` (+ teste) | vitest |
| 4 | Hook | `src/hooks/usePca.ts` | typecheck |
| 5 | Item do PCA: preenche, marca e avisa | `src/components/compras/pca/PcaItemDialog.tsx` | tela rodando (desktop e 390px) |
| 6 | Reserva: ordem de força e "Classificar pelo catálogo" | `src/components/compras/processos/ReservaFormDialog.tsx` | tela rodando |
| 7 | Docs da matriz e roadmap | `docs/EDGE_FUNCTIONS.md`, doc do módulo Compras, `docs/planejamento/ROADMAP.md` | `node scripts/check-docs-matriz.mjs --base origin/main` |
| 8 | Gate | — | `bash scripts/gate.sh` verde |

Depois do merge: a função `catalogo-compras` é publicada pelo CI (`deploy-funcoes.yml`). Não há migração para aprovar.
