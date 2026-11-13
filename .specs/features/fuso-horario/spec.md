# Fuso Horário Specification

## Problem Statement

O form da agenda manda o horário sem fuso (`2026-11-14T17:00:00`) e o Postgres, em UTC, grava 17:00 UTC (14:00 em Aracaju). Na Vercel (Node em UTC) a tela também formata em UTC e os dois erros se cancelam; na máquina local (Node em Brasília) a agenda mostra 3 horas a menos. O instante gravado está errado, então filtro do dia, limites do mês no relatório e qualquer uso futuro do horário (lembrete, exportação) herdam o erro. Vendas já mostram data errada em produção: `criado_em` é `now()` correto, mas a tela formata em UTC e uma venda das 21h30 aparece no dia seguinte.

## Goals

- [ ] Todo horário gravado é o instante real em Aracaju (`America/Sao_Paulo`).
- [ ] Toda tela e filtro dão o mesmo resultado com o servidor em UTC ou em Brasília.

## Out of Scope

| Feature | Reason |
| ------- | ------ |
| Fuso configurável por petshop | Público é Aracaju/Barra dos Coqueiros; single-tenant com um fuso só. |
| Corrigir dados antigos na nuvem | O projeto Supabase está pausado e sem piloto; não há agendamento real gravado. |
| Horário de verão | O Brasil não tem desde 2019; offset fixo `-03:00` com comentário `shortcut`. |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --------------------- | -------------- | --------- | ---------- |
| Dados da nuvem | Não há dado real a migrar | Projeto `petmanager project` está INACTIVE (consultado em 2026-11-13) | y |
| Offset | Fixo `-03:00` | Sem horário de verão no Brasil desde 2019 | n |
| Datas sem hora (vacinas) | Formatadas a partir da string `YYYY-MM-DD`, sem `new Date()` | `new Date("2026-11-13")` é meia-noite UTC e vira dia 12 em Brasília | n |

**Open questions:** none - all resolved or logged above.

---

## User Stories

### P1: Horário da agenda no fuso de Aracaju ⭐ MVP

**User Story**: As a recepcionista, I want que o horário marcado seja o horário de Aracaju so that a agenda mostre a mesma hora em qualquer servidor.

**Why P1**: Hoje o horário só aparece certo por acaso na Vercel.

**Acceptance Criteria**:

1. WHEN `criarAgendamento` ou `editarAgendamento` recebe `dataHora` local `YYYY-MM-DDTHH:MM[:SS]` THEN o sistema SHALL gravar o instante com offset `-03:00` (17:00 local → `20:00Z`).
2. WHEN a validação do expediente roda THEN o sistema SHALL usar o dia da semana e a hora da string local, iguais com o servidor em UTC ou em Brasília.
3. IF `dataHora` vier com fuso (`Z` ou `±HH:MM`) ou fora do formato local THEN a action SHALL responder `Data e hora inválidas` sem tocar no banco.
4. WHEN a agenda de um dia `D` é consultada THEN o sistema SHALL trazer os agendamentos entre `D 00:00` e `D 23:59:59.999` de Brasília.
5. WHEN um agendamento é exibido (calendário, lista, ações) THEN a hora e o dia SHALL ser os de Brasília (`20:00Z` → `17:00`).

**Independent Test**: unit dos helpers e das actions rodando com `TZ=UTC` e com `TZ=America/Sao_Paulo`.

---

### P1: Relatório e vendas no fuso de Aracaju ⭐ MVP

**User Story**: As a dono, I want que o relatório do mês e a lista de vendas usem o dia de Aracaju so that a venda das 21h30 de 30/11 conte em novembro.

**Why P1**: É o bug que já aparece em produção.

**Acceptance Criteria**:

1. WHEN o relatório do mês `M` é gerado THEN o sistema SHALL contar de `M-01 00:00` (inclusive) a `M+1-01 00:00` (exclusive) de Brasília.
2. WHEN uma venda é listada THEN a data SHALL ser a de Brasília (`2026-12-01T00:30Z` → `30/11/2026`).
3. WHEN uma vacina é listada THEN `data_aplicacao` e `data_retorno_prevista` (`date`) SHALL aparecer no mesmo dia gravado (`2026-11-13` → `13/11/2026`) em qualquer fuso do servidor.

**Independent Test**: unit de `limitesDoMes` e dos formatadores com `TZ=UTC` e `TZ=America/Sao_Paulo`.

---

## Edge Cases

- IF o agendamento é às 23:30 de Brasília THEN ele SHALL aparecer no dia local, não no dia seguinte (UTC já virou).
- IF o mês é dezembro THEN o fim do relatório SHALL ser `ano+1-01-01T00:00:00-03:00`.

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| -------------- | ----- | ----- | ------ |
| FUS-01 | P1: Horário da agenda | Tasks | Pending |
| FUS-02 | P1: Horário da agenda | Tasks | Pending |
| FUS-03 | P1: Horário da agenda | Tasks | Pending |
| FUS-04 | P1: Horário da agenda | Tasks | Pending |
| FUS-05 | P1: Horário da agenda | Tasks | Pending |
| FUS-06 | P1: Relatório e vendas | Tasks | Pending |
| FUS-07 | P1: Relatório e vendas | Tasks | Pending |
| FUS-08 | P1: Relatório e vendas | Tasks | Pending |

FUS-01..05 = ACs 1..5 da história 1; FUS-06..08 = ACs 1..3 da história 2.

## Success Criteria

- [ ] `TZ=UTC npm run test:unit` e `TZ=America/Sao_Paulo npm run test:unit` verdes.
- [ ] Nenhum `toLocale*String` de data sem `timeZone` em `src/`.
