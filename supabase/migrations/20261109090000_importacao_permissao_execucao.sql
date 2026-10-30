-- ============================================================================
-- Importações por setor, entrega 2: permissão própria para importar a execução do FIPLAN
-- ============================================================================
-- Até aqui `orcamento.importar` valia para QDD, tabelas do FIPLAN, empenhos (FIP 614) e PEDs. O QDD e as tabelas
-- são do orçamento (Núcleo de Programação Orçamentária); empenhos e PEDs são da execução (Finanças/Contabilidade).
-- Com uma chave só, quem traz empenhos também troca o orçamento.
--
--   1. Nova permissão `financeiro.execucao.importar` no catálogo (módulo financeiro).
--   2. Quem já tinha `orcamento.importar` (papel, módulo ou avulsa) recebe a nova: ninguém perde acesso no dia;
--      depois o administrador tira de quem não deve ter, no Painel de Permissões.
--   3. importar_empenhos_fip614 e importar_peds_fiplan passam a exigir a nova permissão. A troca é feita no texto
--      da função que está no banco (pg_get_functiondef), sem copiar as centenas de linhas do corpo; se o trecho
--      esperado não estiver lá, a migração falha em vez de seguir sem trocar.
--
-- QDD e tabelas do FIPLAN continuam com `orcamento.importar`. Nenhuma tabela, policy ou grant muda.
-- ============================================================================

-- 1. Catálogo -----------------------------------------------------------------
INSERT INTO public.module_permissions_catalog
  (module_code, permission_code, label, category, action_type, sort_order)
VALUES
  ('financeiro', 'financeiro.execucao.importar', 'Importar a execução do FIPLAN (empenhos FIP 614 e PEDs)',
   'Orçamento', 'importar', 508)
ON CONFLICT (permission_code) DO NOTHING;

UPDATE public.module_permissions_catalog
   SET label = 'Importar o orçamento do FIPLAN (QDD e tabelas)'
 WHERE permission_code = 'orcamento.importar';


-- 2. Quem tinha orcamento.importar recebe a nova ---------------------------------
INSERT INTO public.role_permissions (role, permission)
SELECT DISTINCT rp.role, 'financeiro.execucao.importar'
  FROM public.role_permissions rp
 WHERE rp.permission = 'orcamento.importar'
   AND NOT EXISTS (SELECT 1 FROM public.role_permissions x
                    WHERE x.role = rp.role AND x.permission = 'financeiro.execucao.importar');

UPDATE public.user_modules
   SET permissions = array_append(permissions, 'financeiro.execucao.importar')
 WHERE 'orcamento.importar' = ANY (permissions)
   AND NOT 'financeiro.execucao.importar' = ANY (permissions);

INSERT INTO public.user_permissions (user_id, permission)
SELECT DISTINCT up.user_id, 'financeiro.execucao.importar'
  FROM public.user_permissions up
 WHERE up.permission = 'orcamento.importar'
   AND NOT EXISTS (SELECT 1 FROM public.user_permissions x
                    WHERE x.user_id = up.user_id AND x.permission = 'financeiro.execucao.importar');


-- 3. As duas RPCs da execução passam a conferir a nova permissão ---------------
DO $$
DECLARE
  v_funcao regprocedure;
  v_def text;
  v_nova text;
BEGIN
  FOREACH v_funcao IN ARRAY ARRAY[
    'public.importar_empenhos_fip614(integer, jsonb, jsonb, date, boolean)'::regprocedure,
    'public.importar_peds_fiplan(integer, jsonb, jsonb, boolean)'::regprocedure
  ] LOOP
    v_def := pg_get_functiondef(v_funcao);
    IF position('has_permission_code(v_uid, ''orcamento.importar'')' IN v_def) = 0
       OR position('Sem permissão para importar dados do FIPLAN (orcamento.importar).' IN v_def) = 0 THEN
      RAISE EXCEPTION 'A checagem de orcamento.importar não foi encontrada em %; confira a função antes de migrar.', v_funcao;
    END IF;
    v_nova := replace(v_def, 'has_permission_code(v_uid, ''orcamento.importar'')',
                             'has_permission_code(v_uid, ''financeiro.execucao.importar'')');
    v_nova := replace(v_nova, 'Sem permissão para importar dados do FIPLAN (orcamento.importar).',
                              'Sem permissão para importar a execução do FIPLAN (financeiro.execucao.importar).');
    -- pg_get_functiondef devolve CREATE OR REPLACE FUNCTION: mantém dono, grants e comentário
    EXECUTE v_nova;
  END LOOP;
END
$$;

COMMENT ON FUNCTION public.importar_empenhos_fip614(integer, jsonb, jsonb, date, boolean) IS
  'Importa os empenhos do FIP 614 do FIPLAN para fin_empenhos (origem fiplan) e o histórico de LIQ/NOB/GCV/estornos (p_simular = true só calcula as mudanças). Exige financeiro.execucao.importar.';

COMMENT ON FUNCTION public.importar_peds_fiplan(integer, jsonb, jsonb, boolean) IS
  'Importa o relatório "Consultar Pedido de Empenho da Despesa (PED)" do FIPLAN para fin_peds (p_simular = true só calcula; aplicação é tudo ou nada). Exige o módulo financeiro e financeiro.execucao.importar.';
