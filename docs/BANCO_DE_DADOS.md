# Banco de Dados (Supabase / Postgres)

O schema `public` tem **231 tabelas**, **15 views** e **47 funções (RPC)**. Os
tipos TypeScript de todo o schema são gerados em
`src/integrations/supabase/types.ts` (**não editar à mão** — regenerar).

> Migrações versionadas em `supabase/migrations/*.sql` (~240 arquivos,
> `YYYYMMDDHHMMSS_<uuid>.sql`). Para mudar o schema, crie uma migração nova
> (ou use o fluxo do Lovable) e regenere os tipos. Não edite migrações antigas.

## Tabelas por domínio

### Autenticação, RBAC e administração
`profiles`, `user_roles`, `user_modules`, `user_org_units`, `module_access_scopes`,
`module_permissions_catalog`, `module_settings`, `form_field_config`,
`audit_logs`, `audit_log_licitacoes`, `approval_requests`, `approval_delegations`,
`backup_config`, `backup_history`, `backup_integrity_checks`,
`_backup_usuario_modulos_old` (legado).

### RH — servidores e vida funcional
`servidores`, `vinculos_servidor`, `vinculos_funcionais`, `servidor_regime`,
`regimes_trabalho`, `servidor_tags`, `servidor_tag_vinculos`, `historico_funcional`,
`provimentos`, `ocorrencias_servidor`, `documentos_requerimento_servidor`,
`pre_cadastros`, `lotacoes`, `memorandos_lotacao`, `designacoes`,
`ferias_servidor`, `licencas_afastamentos`, `portarias_servidor`,
`viagens_diarias`, `configuracao_jornada`, `horarios_jornada`.

### RH — frequência e ponto
`frequencia_mensal`, `frequencia_fechamento`, `frequencia_arquivos`,
`frequencia_pacotes`, `registros_ponto`, `justificativas_ponto`,
`solicitacoes_ajuste_ponto`, `solicitacoes_abono`, `tipos_abono`, `banco_horas`,
`lancamentos_banco_horas`, `dias_nao_uteis`, `feriados`,
`config_assinatura_frequencia`, `config_fechamento_frequencia`,
`config_jornada_padrao`, `config_compensacao`, `config_incidencias`.

### Folha de pagamento
`folhas_pagamento`, `folha_historico_status`, `fichas_financeiras`,
`itens_ficha_financeira`, `lancamentos_folha`, `rubricas`, `rubricas_historico`,
`config_rubricas`, `config_tipos_rubrica`, `parametros_folha`, `consignacoes`,
`dependentes_irrf`, `pensoes_alimenticias`, `tabela_inss`, `tabela_irrf`,
`adicionais_tempo_servico`, `config_fechamento_folha`, `exportacoes_folha`,
`bancos_cnab`, `remessas_bancarias`, `retornos_bancarios`,
`itens_retorno_bancario`, `eventos_esocial`.

### Financeiro / orçamento
Núcleo (prefixo `fin_`): `fin_solicitacoes`, `fin_solicitacao_itens`,
`fin_empenhos`, `fin_sub_empenhos`, `fin_empenho_anulacoes`, `fin_liquidacoes`,
`fin_pagamentos`, `fin_adiantamentos`, `fin_adiantamento_itens`,
`fin_restos_pagar`, `fin_dotacoes`, `fin_acoes_orcamentarias`,
`fin_alteracoes_orcamentarias`, `fin_programas_orcamentarios`,
`fin_naturezas_despesa`, `fin_fontes_recurso`, `fin_plano_contas`,
`fin_lancamentos_contabeis`, `fin_receitas`, `fin_contas_bancarias`,
`fin_extratos_bancarios`, `fin_extrato_transacoes`, `fin_fechamentos`,
`fin_checklist_ci`, `fin_documentos`, `fin_parametros`, `fin_audit_log`.
Legado/compartilhado: `dotacoes_orcamentarias`, `empenhos`, `liquidacoes`,
`pagamentos`, `creditos_adicionais`, `centros_custo`, `contas_autarquia`,
`config_autarquia`.

### Patrimônio e inventário
`bens_patrimoniais`, `movimentacoes_bem`, `movimentacoes_patrimonio`,
`historico_patrimonio`, `baixas_patrimonio`, `manutencoes_patrimonio`,
`ocorrencias_patrimonio`, `campanhas_inventario`, `coletas_inventario`,
`conciliacoes_inventario`, `patrimonio_unidade`. Almoxarifado: `almoxarifados`,
`estoque`, `movimentacoes_estoque`, `categorias_material`, `itens_material`,
`requisicoes_material`, `requisicao_itens`.

### Compras, licitações e contratos
`processos_licitatorios`, `itens_processo_licitatorio`, `itens_licitacao`,
`propostas_licitacao`, `documentos_preparatorios_licitacao`, `atas_registro_preco`,
`itens_ata_registro_preco`, `fornecedores`, `contratos`, `itens_contrato`,
`aditivos_contrato`, `medicoes_contrato`.

### Processos administrativos (workflow)
`processos_administrativos`, `movimentacoes_processo`, `documentos_processo`,
`despachos`, `encaminhamentos`, `pareceres_tecnicos`, `prazos_processo`,
`acesso_processo_sigiloso`, `acoes`.

### Governança e compliance
`estrutura_organizacional`, `cargos`, `composicao_cargos`,
`cargo_unidade_compatibilidade`, `nomeacoes_chefe_unidade`,
`matriz_raci_papeis`, `matriz_raci_processos`, `matriz_raci_atribuicoes`,
`riscos_institucionais`, `avaliacoes_risco`, `planos_tratamento_risco`,
`controles_internos`, `avaliacoes_controle`, `evidencias_controle`,
`checklists_conformidade`, `itens_checklist`, `respostas_checklist`,
`decisoes_administrativas`, `debitos_tecnicos`, `publicacoes_legais`,
`dados_oficiais`, `config_institucional`.

### Transparência / LAI
`solicitacoes_sic`, `recursos_lai`, `prazos_lai`, `historico_lai`, `publicacoes_lai`.

### Comunicação / CMS
`demandas_ascom`, `demandas_ascom_anexos`, `demandas_ascom_comentarios`,
`demandas_ascom_entregaveis`, `cms_conteudos`, `cms_categorias`, `cms_banners`,
`cms_galerias`, `cms_galeria_fotos`, `cms_media`, `conteudo_rascunho`,
`historico_conteudo_oficial`, `config_paginas_publicas`, `config_paginas_historico`,
`portal_diretoria`.

### Unidades locais e cessões
`unidades_locais`, `agenda_unidade`, `agrupamento_unidade_vinculo`,
`config_agrupamento_unidades`, `cessoes`, `termos_cessao`, `documentos_cedencia`.

### Esporte: federações, instituições, eventos e árbitros
`federacoes_esportivas`, `federacao_arbitros`, `federacao_espacos_cedidos`,
`federacao_parcerias`, `calendario_federacao`, `instituicoes`,
`noticias_eventos_esportivos`, `galeria_eventos_esportivos`,
`contatos_eventos_esportivos`, `categorias_noticias_eventos`,
`cadastro_arbitros`, `cadastro_arbitros_modalidades`.

### Gestores escolares (JER)
`gestores_escolares`, `gestores_escolares_historico`, `escolas_jer`.

### Reuniões
`reunioes`, `participantes_reuniao`, `historico_convites_reuniao`,
`modelos_mensagem_reuniao`, `config_assinatura_reuniao`.

### Programas e documentos gerais
`programas`, `documentos`.

### Parâmetros e catálogos de configuração
`config_parametros_meta`, `config_parametros_valores`, `config_regras_calculo`,
`config_motivos_desligamento`, `config_situacoes_funcionais`, `config_tipos_ato`,
`config_tipos_onus`, `config_tipos_servidor`.

## Views (`v_*`)

Usadas em relatórios e transparência (muitas expõem dados agregados/sem PII):

`v_servidores_situacao`, `v_servidor_tipo_derivado`, `v_relatorio_tce_pessoal`,
`v_relatorio_patrimonio`, `v_resumo_patrimonio`, `v_patrimonio_por_unidade`,
`v_historico_bem_completo`, `v_movimentacoes_completas`,
`v_relatorio_unidades_locais`, `v_relatorio_uso_unidades`, `v_cedencias_a_vencer`,
`v_processos_resumo`, `v_instituicoes_resumo`, `v_gestores_workflow_auditoria`,
`v_sic_consulta_publica`.

## Funções / RPC (`47`)

Chamadas via `supabase.rpc(...)`. Principais grupos:

- **Permissões / acesso**: `listar_permissoes_usuario`, `has_permission`,
  `has_role`, `usuario_tem_permissao`, `usuario_tem_permissao_financeira`,
  `usuario_tem_acesso_modulo`, `usuario_tem_acesso_rota`, `usuario_eh_super_admin`,
  `user_has_unit_access`, `user_context`, `get_my_modules`,
  `get_permissions_from_servidor`, `get_diagnostico_acessos`, `can_approve`,
  `log_audit`.
- **Folha / RH**: `calcular_inss_servidor`, `calcular_irrf`, `count_dependentes_irrf`,
  `fn_calcular_ferias`, `calcular_horas_trabalhadas`, `fechar_folha`,
  `reabrir_folha`, `usuario_pode_fechar_folha`, `usuario_pode_reabrir_folha`,
  `fn_validar_margem_consignavel`, `fn_validar_teto_remuneratorio`,
  `fn_atualizar_situacao_servidor`.
- **Financeiro**: `fn_gerar_numero_financeiro`, `fn_inscrever_restos_pagar`.
- **Processos / workflow**: `fn_calcular_sla_processo`,
  `fn_contar_processos_por_status`, `fn_pode_arquivar_processo`.
- **Patrimônio / unidades**: `gerar_numero_tombamento`, `gerar_protocolo_cedencia`,
  `gerar_relatorio_responsavel`, `get_hierarquia_unidade`,
  `get_subordinados_unidade`, `get_chefe_unidade_atual`.
- **LAI / transparência**: `calcular_prazo_lai`, `consultar_protocolo_sic`,
  `list_public_tables`.
- **Parâmetros**: `obter_parametro_vigente`, `obter_parametro_simples`,
  `fn_calcular_nivel_parametro`.
- **Reuniões**: `verificar_conflito_agenda`.
- **CMS**: `promover_rascunho`.
- **Bancário**: `get_proximo_numero_remessa`.

## Convenções

- Nomenclatura **em português, snake_case**; prefixos por domínio (`fin_`, `cms_`,
  `config_`, `frequencia_`, `demandas_ascom_`, `matriz_raci_`).
- **RLS** ativa: o acesso por linha é decidido no banco (apoiado pelas funções de
  permissão acima). A chave anônima no client é segura porque o RLS é a fronteira.
- Tabelas `config_*` e `parametros_*` parametrizam regras de cálculo (folha,
  frequência) sem hardcode no código.
</content>
