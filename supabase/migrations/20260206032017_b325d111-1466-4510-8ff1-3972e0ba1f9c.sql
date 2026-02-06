-- Corrige perfil "Gestor RH" para funcionar com o RBAC baseado em funcoes_sistema
-- 1) Define um código único (evita NULL e permite referência consistente)
update public.perfis
set codigo = 'gestor_rh'
where id = '8661f27d-7279-4a17-84cf-f00db1b366ea'
  and codigo is null;

-- 2) Concede todas as funções do módulo RH para este perfil
insert into public.perfil_funcoes (perfil_id, funcao_id, concedido)
select
  '8661f27d-7279-4a17-84cf-f00db1b366ea'::uuid as perfil_id,
  fs.id as funcao_id,
  true as concedido
from public.funcoes_sistema fs
where fs.modulo = 'rh'
  and fs.ativo = true
on conflict (perfil_id, funcao_id)
do update set concedido = true;