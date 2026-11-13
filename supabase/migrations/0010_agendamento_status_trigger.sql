-- Máquina de estados do agendamento no banco (hardening MAQ-01/02/04, IDP-01/05/08).
--
-- Todo UPDATE que muda `status` passa por este trigger, inclusive um update
-- direto fora das Server Actions. Ele valida a transição e mantém a venda
-- de serviço sincronizada (cria ao concluir, estorna ao reabrir). É
-- `security definer` porque a RLS de `vendas` não tem policy de INSERT/UPDATE
-- para venda de serviço (de propósito, ver 0005). Nada de DELETE em vendas.
--
-- Lição L-003: Supabase concede EXECUTE a anon por padrão; revoke explícito.

create or replace function public.agendamento_status_guard()
returns trigger
language plpgsql
security definer
set search_path = 'public', 'pg_temp'
as $$
begin
  if old.status = 'agendado' and new.status = 'concluido' then
    insert into public.vendas (tipo, agendamento_id, quantidade, valor_total, criado_por)
    select 'servico', old.id, 1, coalesce(sum(s.preco_interno), 0), auth.uid()
    from public.agendamento_servicos ags
    join public.servicos s on s.id = ags.servico_id
    where ags.agendamento_id = old.id;
  elsif old.status = 'concluido' and new.status = 'agendado' then
    update public.vendas
    set estornada_em = now(), estornada_por = auth.uid()
    where agendamento_id = old.id
      and tipo = 'servico'
      and estornada_em is null;
  elsif old.status = 'agendado' and new.status = 'cancelado' then
    null;
  elsif old.status = 'cancelado' and new.status = 'agendado' then
    null;
  elsif old.status = 'concluido' and new.status = 'cancelado' then
    raise exception 'Reabra o agendamento antes de cancelar';
  else
    raise exception 'Transição de status inválida: % → %', old.status, new.status;
  end if;

  return new;
end;
$$;

revoke execute on function public.agendamento_status_guard() from anon;
revoke execute on function public.agendamento_status_guard() from public;
revoke execute on function public.agendamento_status_guard() from authenticated;

create trigger trg_agendamento_status
  before update on public.agendamentos
  for each row
  when (old.status is distinct from new.status)
  execute function public.agendamento_status_guard();
