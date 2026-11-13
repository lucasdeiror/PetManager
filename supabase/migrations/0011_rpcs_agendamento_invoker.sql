-- RPCs de agendamento como security invoker (hardening IDP-02/03/06).
--
-- A criação e o estorno da venda agora são feitos pelo trigger
-- trg_agendamento_status (0010). As RPCs só serializam (select ... for
-- update), checam o status de origem com mensagem específica e mudam o
-- status. Rodam com o papel de quem chama, então não precisam mais de
-- security definer. Nenhuma linha de vendas é apagada.

create or replace function public.concluir_agendamento(p_agendamento_id bigint)
returns bigint
language plpgsql
security invoker
set search_path = 'public', 'pg_temp'
as $$
declare
  v_status text;
  v_venda_id bigint;
begin
  select status into v_status
  from public.agendamentos
  where id = p_agendamento_id
  for update;

  if not found then
    raise exception 'Agendamento não encontrado';
  end if;

  if v_status <> 'agendado' then
    raise exception 'Agendamento não está agendado';
  end if;

  update public.agendamentos
  set status = 'concluido', updated_at = now()
  where id = p_agendamento_id;

  select id into v_venda_id
  from public.vendas
  where agendamento_id = p_agendamento_id
    and tipo = 'servico'
    and estornada_em is null;

  return v_venda_id;
end;
$$;

create or replace function public.reabrir_agendamento_concluido(p_agendamento_id bigint)
returns void
language plpgsql
security invoker
set search_path = 'public', 'pg_temp'
as $$
declare
  v_status text;
begin
  select status into v_status
  from public.agendamentos
  where id = p_agendamento_id
  for update;

  if not found then
    raise exception 'Agendamento não encontrado';
  end if;

  if v_status <> 'concluido' then
    raise exception 'Agendamento não está concluído';
  end if;

  update public.agendamentos
  set status = 'agendado', updated_at = now()
  where id = p_agendamento_id;
end;
$$;

revoke execute on function public.concluir_agendamento(bigint) from anon;
revoke execute on function public.concluir_agendamento(bigint) from public;
grant execute on function public.concluir_agendamento(bigint) to authenticated;
revoke execute on function public.reabrir_agendamento_concluido(bigint) from anon;
revoke execute on function public.reabrir_agendamento_concluido(bigint) from public;
grant execute on function public.reabrir_agendamento_concluido(bigint) to authenticated;
