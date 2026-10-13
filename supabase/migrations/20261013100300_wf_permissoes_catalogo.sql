-- Acompanhamento de processos do SEI: permissões que as RPCs exigem e que faltavam no catálogo.
-- Sem a linha no catálogo a tela de usuários não consegue concedê-las. Nenhum papel as recebe por padrão:
-- concede-se por usuário (user_permissions), junto com o módulo workflow.
INSERT INTO public.module_permissions_catalog
  (module_code, permission_code, label, category, action_type, sort_order)
VALUES
  ('workflow', 'workflow.concluir', 'Suspender, reativar e concluir processos', 'Geral', 'concluir', 603),
  ('workflow', 'workflow.arquivar', 'Arquivar processos', 'Geral', 'arquivar', 604),
  ('workflow', 'workflow.admin', 'Administrar o workflow (credenciais de sigilo e modelos de fluxo)', 'Geral', 'admin', 605)
ON CONFLICT (permission_code) DO NOTHING;
