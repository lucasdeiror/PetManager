-- Checagem de implantação: rode no SQL Editor do projeto novo depois das migrations.
-- Tudo certo = só a linha final "ok". Qualquer outra linha é um problema a corrigir.
with problemas as (
  select 'tabela sem RLS: ' || c.relname as problema
  from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity
  union all
  select 'função executável por anon: ' || p.proname
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and has_function_privilege('anon', p.oid, 'execute')
  union all
  select 'migrations: falta a 0013 (acesso exige perfil ativo)'
  where not exists (select 1 from pg_trigger where tgname = 'trg_agendamento_status_inicial')
  union all
  select 'nenhum dono ativo em profiles'
  where not exists (select 1 from public.profiles where role = 'dono' and ativo)
  union all
  select 'login sem perfil em profiles: ' || u.email
  from auth.users u left join public.profiles p on p.id = u.id
  where p.id is null
)
select problema from problemas
union all
select 'ok' where not exists (select 1 from problemas);
