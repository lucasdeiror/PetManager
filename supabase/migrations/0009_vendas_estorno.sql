-- Estorno não destrutivo de vendas (hardening IDP-04/IDP-05).
--
-- Reabrir um agendamento concluído passa a marcar a venda como estornada
-- em vez de apagá-la. A unique total por agendamento vira índice parcial:
-- só uma venda de serviço *ativa* por agendamento, o que permite
-- reconcluir depois do estorno (IDP-08).

alter table public.vendas
  add column estornada_em timestamptz,
  add column estornada_por uuid references public.profiles (id);

create index vendas_estornada_por_idx on public.vendas (estornada_por);

alter table public.vendas drop constraint vendas_agendamento_unique;

create unique index vendas_servico_ativa_unique
  on public.vendas (agendamento_id)
  where tipo = 'servico' and estornada_em is null;
