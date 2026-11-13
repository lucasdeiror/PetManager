# Fuso Horário Tasks

**Spec**: `.specs/features/fuso-horario/spec.md`
**Status**: Approved

---

## Test Coverage Matrix

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| ---------- | ------------------ | -------------------- | ---------------- | ----------- |
| Helper de fuso | unit | Cada AC de FUS que usa o helper, com `TZ=UTC` e `TZ=America/Sao_Paulo` | `src/shared/data/__tests__/` | `npm run test:unit` |
| Server Action / query | unit | Valor gravado e limites de consulta com offset `-03:00` | `src/features/*/__tests__/` | `npm run test:unit` |
| Página / componente | none | Só troca de formatador já testado | - | build gate only |

## Gate Check Commands

| Gate Level | When to Use | Command |
| ---------- | ----------- | ------- |
| Quick | Tasks só com teste unitário | `TZ=UTC npm run test:unit && TZ=America/Sao_Paulo npm run test:unit` |
| Full | Última task | Quick + `npm run lint && npx tsc --noEmit && npm run build` |

---

## Execution Plan

### Phase 1: Fuso de Aracaju em todo o app

```
T1 → T2 → T3
T1 → T4
```

---

## Task Breakdown

### T1: Helpers de fuso

**What**: `src/shared/data/fuso.ts` com `instanteSP` (local → `-03:00`), `partesSP` (instante → `{dia, hora}` em Brasília), `dataHoraSP`, `dataSP` e `dataSimples` (`YYYY-MM-DD` → `DD/MM/YYYY`).
**Where**: `src/shared/data/fuso.ts`, `src/shared/data/__tests__/fuso.test.ts`
**Depends on**: None
**Reuses**: `hojeEmSaoPaulo` (mesmo `Intl` com `timeZone`)
**Requirement**: FUS-01, FUS-05, FUS-07, FUS-08

**Done when**:
- [x] Testes passam com `TZ=UTC` e `TZ=America/Sao_Paulo`

**Tests**: unit
**Gate**: quick

**Commit**: `feat(datas): helpers de fuso de sao paulo`

**Status**: Done

---

### T2: Agenda grava e valida no fuso de Aracaju

**What**: schema aceita só `YYYY-MM-DDTHH:MM[:SS]`; `extrairDiaEHora` lê da string; insert/update com `instanteSP`.
**Where**: `src/features/agenda/actions.ts` e testes
**Depends on**: T1
**Reuses**: `instanteSP`
**Requirement**: FUS-01, FUS-02, FUS-03

**Done when**:
- [x] 17:00 local grava `...T17:00:00-03:00`; com fuso na entrada vira `Data e hora inválidas`

**Tests**: unit
**Gate**: quick

**Commit**: `fix(agenda): grava horario no fuso de sao paulo`

**Status**: Done

---

### T3: Agenda lê e exibe no fuso de Aracaju

**What**: filtro do dia com `-03:00`; calendário, lista e ações usam `partesSP`/`dataHoraSP`.
**Where**: `src/features/agenda/queries.ts`, `src/features/agenda/components/AgendaCalendario.tsx`, `src/app/(dashboard)/agenda/agendamento-acoes.tsx`, `src/app/(dashboard)/agenda/lista/page.tsx`
**Depends on**: T2
**Reuses**: `partesSP`, `dataHoraSP`
**Requirement**: FUS-04, FUS-05

**Done when**:
- [x] Consulta do dia usa limites `-03:00`; nenhuma hora exibida sai de `slice` do ISO

**Tests**: unit
**Gate**: quick

**Commit**: `fix(agenda): exibe e filtra no fuso de sao paulo`

**Status**: Done

---

### T4: Relatório, vendas e vacinas no fuso de Aracaju

**What**: `limitesDoMes` e o filtro `mes` de `getVendas` com `T00:00:00-03:00`; vendas com `dataSP`; vacinas com `dataSimples`.
**Where**: `src/features/relatorios/queries.ts`, `src/features/vendas/queries.ts`, `src/app/(dashboard)/vendas/page.tsx`, `src/app/(dashboard)/vacinas/page.tsx`
**Depends on**: T1
**Reuses**: `dataSP`, `dataSimples`
**Requirement**: FUS-06, FUS-07, FUS-08

**Done when**:
- [x] Relatório de novembro vai de `2026-11-01T00:00:00-03:00` a `2026-12-01T00:00:00-03:00`

**Tests**: unit
**Gate**: full

**Commit**: `fix(relatorios): limites do mes no fuso de sao paulo`

**Status**: Done
