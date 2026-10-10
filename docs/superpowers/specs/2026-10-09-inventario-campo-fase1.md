# Inventário de campo – fase 1 (vistoria de unidades, fotos de evidência e mapa)

Data: 09/10/2026 · Classificação: **architectural** (tabelas novas, bucket novo, dependência nova, rota nova).

## Premissas (sessão sem ninguém respondendo em tempo real; registradas para a revisão da PR)

1. O usuário escolheu "construir agora" a fase 1 descrita na especificação funcional do inventário (documento externo ao repositório: aplicativo de campo e painel). PR em **rascunho**; **nenhuma migração é aplicada em projeto remoto**.
2. A nova tabela `campanhas_inventario_unidades` **complementa** `campanhas_inventario.unidades_abrangidas` (não a substitui nem a migra). Na fase 1 o painel lê só a tabela nova.
3. **Não** se altera RLS existente. O levantamento achou `acesso_total_*` em `campanhas_inventario` e `coletas_inventario` no histórico de migrações (o baseline já corrige). Isso fica registrado na PR como achado, para decisão do usuário.
4. Mudar a situação da unidade exige acesso ao módulo `patrimonio` ou `patrimonio_mobile` (as equipes de campo usam o módulo mobile). Apagar foto de evidência exige `patrimonio.tramitar`, para preservar a prova.
5. KML é lido no navegador (DOMParser) e grava coordenadas/polígono por UPDATE; sem Edge Function.
6. Mapa: Leaflet + react-leaflet 4.x (React 18). Fundo de satélite Esri World Imagery e de ruas OpenStreetMap, com atribuição visível. Os termos de uso da Esri para uso institucional ficam a confirmar pelo dono do produto.
7. Nada de dado de cliente no código: as unidades, coordenadas e a campanha vêm do banco (importação de KML e cadastro pela tela).

## Objetivo da fase 1

Equipes em campo registram a vistoria de cada unidade com fotos georreferenciadas, mesmo sem sinal; a coordenação acompanha num painel com mapa e satélite.

## Banco (migração nova + baseline)

- `unidades_locais` ganha: `latitude numeric(10,8)`, `longitude numeric(11,8)` (CHECK de faixa), `poligono_geojson jsonb` (CHECK tipo Polygon/MultiPolygon), `area_terreno_m2`, `area_construida_m2 numeric(14,2)`, `fonte_geometria text CHECK IN ('manual','gps','kml')`, `geometria_atualizada_em`, `geometria_atualizada_por`. As policies existentes da tabela cobrem as colunas.
- `campanhas_inventario_unidades`: situação de cada unidade na campanha (`a_visitar`, `em_vistoria`, `concluida`, `com_pendencia`, `excluida`), `equipe text`, `data_prevista`, `iniciada_em`, `concluida_em`, `observacao`, auditoria; `UNIQUE (campanha_id, unidade_local_id)`. RLS por módulo `patrimonio|patrimonio_mobile` desde a migração.
- `fotos_vistoria_inventario`: `id uuid` gerado no celular (chave de idempotência da fila), `campanha_id`, `unidade_local_id`, `bem_id` opcional, `codigo_objeto`, `storage_path`, `hash_sha256` (64 hex), `latitude`, `longitude`, `precisao_m`, `capturada_em`, `enviada_em default now()`, `mime_type`, `tamanho_bytes`, `tem_pessoa boolean`, `legenda`, `dispositivo_info jsonb`, `usuario_id default auth.uid()`. RLS por módulo; DELETE só com `has_permission_code(auth.uid(),'patrimonio.tramitar')`; sem UPDATE de `hash_sha256`/`storage_path` (trigger que bloqueia).
- Bucket **privado** `inventario-evidencias` (10 MB, jpeg/webp), caminho `<campanha>/<unidade>/<id>.jpg`, policies de storage por módulo; leitura por URL assinada.
- Baseline: linhas em `supabase/baseline/rls/mapa.csv`, regenerar `rls/35_policies_geradas.sql`, bucket em `overlay/50_storage.sql`.

## Front

- `src/lib/filaFotosOffline.ts` (IndexedDB sem dependência) + `src/hooks/useFilaFotosVistoria.ts`: guarda a foto (Blob) com metadados e hash SHA-256 calculado na captura; envia quando `online`; upload idempotente (`upsert` do registro pelo id; storage com `upsert:false` e tolerância a "já existe").
- `src/hooks/useGeolocalizacao.ts`: posição com precisão.
- `src/hooks/useVistoriaInventario.ts`: unidades da campanha com situação e coordenadas; atualizar situação; fotos por unidade com URL assinada; importar KML.
- `src/lib/kml.ts`: KML → lista de {nome, ponto, polígono}.
- Painel `src/pages/inventario/PainelCampoInventarioPage.tsx` em `/inventario/campanhas/:id/painel` (`patrimonio.visualizar`): mapa satélite/ruas, marcadores por situação, contadores, lista filtrável, detalhe com fotos, importação de KML (casar placemark com unidade por nome, confirmação manual).
- Mobile: componente `src/components/mobile/VistoriaUnidade.tsx`, acessado por um novo cartão "Vistoria de unidade" em `/patrimonio-mobile`: escolher campanha e unidade, ver GPS e precisão, fotografar (fila offline), marcar situação e observação, ver pendentes de envio.
- Link para o painel na página de detalhe da campanha.

## Fora da fase 1

Edificações, instalações, ocupações, documentos, relatórios automáticos (vistoria, diário, semanal), importação da planilha, conciliação com a relação da SEED, rastreio de equipe, cache offline de tiles.

## Segurança

RLS em todas as tabelas novas desde a migração; bucket privado; URL assinada de curta duração; hash para integridade; nenhum dado pessoal novo além do `usuario_id`; atribuição dos mapas.
