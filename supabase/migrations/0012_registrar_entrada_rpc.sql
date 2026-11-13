-- Entrada de estoque atômica (T24, regra ACID do checklist).
--
-- Antes: a action lia o saldo, gravava saldo + qtd e inseria a
-- movimentação sem conferir erro. Duas entradas simultâneas perdiam uma
-- soma, e um insert com falha deixava o saldo alterado sem registro.
-- Agora o incremento é relativo e o insert roda na mesma transação.
-- security invoker: a RLS produtos_dono_only continua valendo.

create or replace function public.registrar_entrada(p_produto_id bigint, p_quantidade integer)
returns void
language plpgsql
security invoker
set search_path = 'public', 'pg_temp'
as $$
begin
  update public.produtos
  set saldo_estoque = saldo_estoque + p_quantidade
  where id = p_produto_id;

  if not found then
    raise exception 'Produto não encontrado';
  end if;

  insert into public.movimentacoes_estoque (produto_id, tipo, quantidade)
  values (p_produto_id, 'entrada', p_quantidade);
end;
$$;

revoke execute on function public.registrar_entrada(bigint, integer) from anon;
revoke execute on function public.registrar_entrada(bigint, integer) from public;
grant execute on function public.registrar_entrada(bigint, integer) to authenticated;
