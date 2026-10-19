# Plano — Onda 0: configurações de impressão

Spec: [`../specs/2026-10-19-padrao-relatorios-configuravel-design.md`](../specs/2026-10-19-padrao-relatorios-configuravel-design.md)
(aprovada pelo dono em 19/10/2026). Execução em linha nesta sessão.

| # | Tarefa | Arquivos | Verificação |
|---|---|---|---|
| 1 | `EstiloImpressao` + escalas de letra; contexto leva `estilo` e `fonte` | `src/lib/documentos/tipos.ts`, `core/tokens.ts`, `core/pagina.ts`, `core/renderizar.ts` | testes existentes seguem verdes |
| 2 | Blocos usam `ctx.fonte`; zebra opcional na tabela | `src/lib/documentos/blocos/*.ts` | `tabela.test.ts` |
| 3 | Moldura: linha extra do cabeçalho, texto do rodapé, emissor opcional | `core/moldura.ts` | teste novo `estilo.test.ts` |
| 4 | Perfil do tenant ganha `impressao`; 9 chaves `impressao_*` no catálogo `CAMPOS_CLIENTE` (categoria `impressao`, valor inválido ignorado) | `src/core/tenant/types.ts`, `dadosOficiais.ts`, `index.ts` | teste novo `dadosOficiais.test.ts` |
| 5 | `marcaDoTenant` respeita cor e logos; `estiloDoTenant`; `emitirDocumento` aceita perfil de pré-visualização | `src/lib/documentos/marca.ts`, `emitir.ts` | `marca.test.ts` |
| 6 | Modelos de amostra (relatório e ficha) no `REGISTRO` | `src/lib/documentos/modelos/amostras.ts`, `registro.ts` | `amostras.test.ts` |
| 7 | Seção "Impressão de documentos" na Configuração do cliente: selects, cor com aviso de contraste, botão "Ver exemplo" (PDF num diálogo) | `src/pages/admin/ConfiguracaoClientePage.tsx` | app rodando, 390 px e desktop |
| 8 | Docs | `docs/PADRAO_DOCUMENTOS.md`, `docs/CONFIGURACAO_CLIENTE.md`, `docs/planejamento/ROADMAP.md` | `node scripts/check-docs-matriz.mjs --base origin/main` |
| 9 | Gate | — | `bash scripts/gate.sh` |

Sem migração: as chaves novas são linhas de `dados_oficiais` (RLS existente: leitura pública, escrita admin).
