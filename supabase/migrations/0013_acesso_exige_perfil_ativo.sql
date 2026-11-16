-- T38 (SEG-07): acesso ao domínio exige perfil ativo em profiles.
-- Antes, as policies `using (true)` liberavam tudo para qualquer `authenticated`:
-- um signup ligado por engano na nuvem (o config.toml só vale no local) ou uma
-- funcionária com `ativo = false` lia e gravava tutores, pets e agendamentos.

-- Papel só existe para perfil ativo; sem perfil ou inativo => null.
create or replace function public.current_role_petmanager()
returns text
language sql
stable
set search_path to 'public', 'pg_temp'
as $$
  select role from public.profiles where id = (select auth.uid()) and ativo
$$;

-- Leitura/escrita livre passa a exigir papel.
alter policy tutores_all_authenticated on public.tutores
  using ((select public.current_role_petmanager()) is not null)
  with check ((select public.current_role_petmanager()) is not null);
alter policy pets_all_authenticated on public.pets
  using ((select public.current_role_petmanager()) is not null)
  with check ((select public.current_role_petmanager()) is not null);
alter policy agendamentos_all_authenticated on public.agendamentos
  using ((select public.current_role_petmanager()) is not null)
  with check ((select public.current_role_petmanager()) is not null);
alter policy agendamento_servicos_all_authenticated on public.agendamento_servicos
  using ((select public.current_role_petmanager()) is not null)
  with check ((select public.current_role_petmanager()) is not null);
alter policy vacinas_all_authenticated on public.vacinas
  using ((select public.current_role_petmanager()) is not null)
  with check ((select public.current_role_petmanager()) is not null);
alter policy horarios_select_all on public.horarios_funcionamento
  using ((select public.current_role_petmanager()) is not null);
alter policy servicos_select_all on public.servicos
  using ((select public.current_role_petmanager()) is not null);
alter policy vendas_select_all on public.vendas
  using ((select public.current_role_petmanager()) is not null);

-- Agendamento nasce `agendado`: status final só por transição (trg_agendamento_status),
-- senão um insert direto `concluido` ficaria sem venda.
create or replace function public.agendamento_status_inicial()
returns trigger
language plpgsql
set search_path to 'public', 'pg_temp'
as $$
begin
  if new.status <> 'agendado' then
    raise exception 'Agendamento novo começa como agendado';
  end if;
  return new;
end;
$$;

create trigger trg_agendamento_status_inicial
  before insert on public.agendamentos
  for each row execute function public.agendamento_status_inicial();

-- L-003: nenhuma função do domínio é chamável por anon.
revoke execute on function public.current_role_petmanager() from anon, public;
revoke execute on function public.registrar_venda_produto from anon, public;
revoke execute on function public.agendamento_status_inicial() from anon, public, authenticated;
