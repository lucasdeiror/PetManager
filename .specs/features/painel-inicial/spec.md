# Painel Inicial Specification

## Problem Statement

O dono e a recepcionista precisam consultar até quatro telas diferentes (`/agenda`, `/vacinas`, `/estoque`, `/relatorios`) para saber o resumo operacional do dia: quantos atendimentos faltam hoje, se há vacinas com retorno vencido, se algum produto entrou em estoque crítico e quanto entrou no caixa hoje e no mês. Falta uma visão consolidada em `/painel` que respeite o sigilo por papel (`dono` vs `recepcionista`) sem tirar `/agenda` como destino padrão de abertura (`DES-04`).

## Goals

- [ ] Consolidar em `/painel` os indicadores operacionais do dia (agendamentos de hoje e vacinas atrasadas) para `dono` e `recepcionista`, no fuso `America/Sao_Paulo`.
- [ ] Exibir indicadores financeiros (faturamento de hoje e do mês) e de estoque baixo exclusivamente para o papel `dono`, ocultando esses blocos para `recepcionista`.

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
| ------- | ------ |
| Alterar o redirecionamento de `/` ou pós-login para `/painel` | `DES-04` permanece ativo: `/` e o login continuam levando direto para `/agenda` para não atrasar o balcão. |
| Gráficos de série histórica ou comparativo entre meses | O volume de dados de um petshop individual não justifica gráficos antes do 1º piloto; a tela `/relatorios` já permite navegar mês a mês. |
| Ações de escrita (concluir agendamento, vender produto) direto no `/painel` | O painel é somente leitura com atalhos diretos para as telas de operação (`/agenda`, `/vacinas`, `/estoque`, `/vendas`, `/relatorios`). |
| Filtro de período customizado no painel | O painel reflete sempre o estado de hoje (`hojeEmSaoPaulo`) e do mês corrente (`mesEmSaoPaulo`). |

---

## Assumptions & Open Questions

Every ambiguity is resolved or recorded here - nothing is left silently unclear.

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --------------------- | -------------- | --------- | ---------- |
| Rota do Painel Inicial e comportamento de `/` | Rota dedicada `/painel` no topo do `MenuLateral`; `/` e login continuam redirecionando para `/agenda` | Preserva `DES-04`, os testes E2E existentes e a agilidade de atendimento no balcão | y |
| Visibilidade por papel (`dono` vs `recepcionista`) | Ambos acessam `/painel`; `recepcionista` vê apenas agenda de hoje e vacinas atrasadas; `dono` vê também faturamento (hoje/mês) e estoque baixo | Respeita `EST-04` e `REL-05` sem bloquear a visão operacional útil para a recepção | y |
| Blocos do escopo P1 (MVP) | Quatro blocos: (1) Resumo e próximos itens da Agenda de Hoje, (2) Vacinas Atrasadas, (3) Estoque Baixo (só `dono`), (4) Faturamento de Hoje e do Mês (só `dono`) | Combina as quatro fontes já existentes no código sem criar tabelas nem migrations novas | y |
| Limite de itens nas listas rápidas do painel | Exibir até 5 agendamentos do dia (priorizando `agendado` por ordem de horário) e até 5 alertas de vacinas atrasadas, com link "Ver todos" para a respectiva tela | Evita paginação dupla dentro do resumo e mantém a tela escaneável em uma dobra | y |
| Dimensões implícitas (persistência, concorrência, chamadas externas) | N/A para escrita, idempotência e transição de estado porque `/painel` é exclusivamente leitura sobre queries existentes; fuso horário segue `America/Sao_Paulo` (`AD-010`) e autorização segue `exigirSessao`/papel no servidor | Não há mutação de dados nem integração externa nova neste escopo | y |

**Open questions:** none - all resolved or logged above.

---

## User Stories

### P1: Visão Operacional do Dia (Dono e Recepcionista) ⭐ MVP

**User Story**: As a `dono` or `recepcionista`, I want to see today's appointment summary and overdue vaccines on `/painel` so that I know immediately which pets are coming in today and which tutors need a vaccine follow-up.

**Why P1**: Entrega valor diário imediato para ambos os papéis sem expor dados restritos.

**Acceptance Criteria**:

1. WHEN an authenticated user with an active profile navigates to `/painel` THEN the system SHALL render the page title `"Painel"` and highlight the `"Painel"` link with `aria-current="page"` in `MenuLateral`. [PNL-01]
2. WHEN `/painel` loads THEN the system SHALL display today's appointment counts (`total`, `agendados`, `concluidos`) calculated for `hojeEmSaoPaulo()` in timezone `America/Sao_Paulo` (`-03:00`). [PNL-02]
3. WHEN `/painel` loads THEN the system SHALL list up to 5 non-canceled appointments for today ordered by `dataHora` ascending and provide a link to `/agenda`. [PNL-03]
4. WHEN `/painel` loads THEN the system SHALL display the total count of overdue vaccines (`status === "atrasada"` as of `hojeEmSaoPaulo()`) and provide a link to `/vacinas?status=atrasada`. [PNL-04]
5. The system SHALL keep `/` and post-login redirects pointing to `/agenda` (`DES-04`). [PNL-05]

**Independent Test**: Entrar como `recepcionista` ou `dono`, clicar em `"Painel"` no menu lateral e verificar as contagens de agendamentos de hoje, a lista de próximos atendimentos e o contador de vacinas atrasadas com atalho para `/vacinas?status=atrasada`.

---

### P1: Indicadores de Gestão e Estoque Crítico (Exclusivo Dono) ⭐ MVP

**User Story**: As a `dono`, I want to see today's revenue, current month's revenue, and low-stock product alerts on `/painel` so that I can monitor cash flow and restock needs in one screen.

**Why P1**: Consolida os dois indicadores exclusivos da gestão (`dono`) que motivam a existência do painel executivo.

**Acceptance Criteria**:

1. WHERE the authenticated user has role `"dono"`, WHEN `/painel` loads THEN the system SHALL display the active revenue for today (`faturamentoHoje` in BRL) and for the current month (`faturamentoMes` in BRL, based on `mesEmSaoPaulo()`), excluding refunded sales (`estornada_em IS NOT NULL`), with links to `/vendas` and `/relatorios`. [PNL-06]
2. WHERE the authenticated user has role `"dono"`, WHEN `/painel` loads THEN the system SHALL display the count of products with low stock (`saldoEstoque <= estoqueMinimo`) and a link to `/estoque`. [PNL-07]
3. IF the authenticated user has role `"recepcionista"` THEN the system SHALL NOT query or render the revenue metrics (`faturamentoHoje`, `faturamentoMes`) or the low-stock alert (`estoqueBaixoCount`) on `/painel`. [PNL-08]

**Independent Test**: Logar como `dono` e verificar em `/painel` os cartões de Faturamento (Hoje e Mês) e Estoque Baixo; logar como `recepcionista` e verificar que nenhum texto ou valor de faturamento ou estoque baixo é renderizado em `/painel`.

---

## Edge Cases

- WHEN there are no appointments today, no overdue vaccines, no sales, or no low-stock products THEN the system SHALL display `0` (and `R$ 0,00` for `dono` revenue) with empty-state messages instead of failing or hiding the operational sections. [PNL-09]
- WHEN the server clock in UTC is already on the next day or next month (e.g., `2026-11-30T23:30:00-03:00` = `2026-12-01T02:30:00Z`) THEN the system SHALL still compute today's appointments, today's sales, and current month's revenue using `America/Sao_Paulo` (`2026-11-30` and month `2026-11`). [PNL-10]
- IF an unauthenticated user requests `/painel` THEN the system SHALL redirect the request to `/login` via `proxy.ts`. [PNL-11]

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| -------------- | ----- | ----- | ------ |
| PNL-01 | P1: Visão Operacional do Dia | Phase 1 (T2, T3) | Implementing |
| PNL-02 | P1: Visão Operacional do Dia | Phase 1 (T1, T3) | Implementing |
| PNL-03 | P1: Visão Operacional do Dia | Phase 1 (T1, T3) | Implementing |
| PNL-04 | P1: Visão Operacional do Dia | Phase 1 (T1, T3) | Implementing |
| PNL-05 | P1: Visão Operacional do Dia | Phase 1 (T3) | Implementing |
| PNL-06 | P1: Indicadores de Gestão e Estoque Crítico | Phase 1 (T1, T3) | Implementing |
| PNL-07 | P1: Indicadores de Gestão e Estoque Crítico | Phase 1 (T1, T3) | Implementing |
| PNL-08 | P1: Indicadores de Gestão e Estoque Crítico | Phase 1 (T1, T3) | Implementing |
| PNL-09 | Edge Cases | Phase 1 (T1, T3) | Implementing |
| PNL-10 | Edge Cases | Phase 1 (T1) | Implementing |
| PNL-11 | Edge Cases | Phase 1 (T3) | Implementing |

**Coverage:** 11 total, 11 mapped to tasks, 0 unmapped ✅

---

## Success Criteria

- [ ] `/painel` carrega com todos os indicadores do papel logado em uma única renderização server-side (`Promise.all`), mantendo `/` → `/agenda`.
- [ ] `recepcionista` não vê números de faturamento nem de estoque em `/painel` (validado em teste unitário e E2E).
- [ ] Todos os cálculos de "hoje" e "mês atual" em `/painel` passam com `TZ=UTC` às 22h–23h59 BRT.
