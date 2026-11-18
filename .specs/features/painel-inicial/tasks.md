# Painel Inicial Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, adequacy review, Verifier, discrimination sensor).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

---

**Spec**: `.specs/features/painel-inicial/spec.md`
**Status**: Done

---

## Test Coverage Matrix

> Generated from codebase, project guidelines, and spec - confirm before Execute. Guidelines found: `AGENTS.md`, `vitest.config.ts`, `playwright.config.ts`, `.specs/STATE.md` (AD-004, AD-010, AD-012, AD-013).

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| ---------- | ------------------ | -------------------- | ---------------- | ----------- |
| Query (`getResumoPainel`) | unit | All branches; 1:1 to spec ACs (`PNL-02`..`PNL-04`, `PNL-06`..`PNL-10`); `dono` vs `recepcionista` + timezone boundary at 23:30 BRT | `src/features/painel/__tests__/*.test.ts` | `npm run test:unit` |
| Menu component (`MenuLateral`) | unit | Item `"Painel"` visível para `dono` e `recepcionista` e `aria-current="page"` em `/painel` (`PNL-01`) | `src/app/(dashboard)/__tests__/*.test.tsx` | `npm run test:unit` |
| Page (`painel/page.tsx`) + Route | e2e | Happy path (`dono` e `recepcionista` em `/painel`), ocultação de faturamento/estoque para `recepcionista` (`PNL-08`), sem sessão → `/login` (`PNL-11`), `/` continua indo para `/agenda` (`PNL-05`) | `e2e/painel.spec.ts` | `npm run test:e2e` |

## Gate Check Commands

> Generated from codebase - confirm before Execute.

| Gate Level | When to Use | Command |
| ---------- | ----------- | ------- |
| Quick | After tasks with unit tests only | `npm run test:unit` |
| Full | After tasks with e2e/integration tests | `npm run test:unit && npm run test:e2e` |
| Build | After phase completion or config/entity-only tasks | `npm run lint && npx tsc --noEmit && npm run test:unit && npm run build && npm run test:e2e` |

---

## Execution Plan

### Phase 1: Dados, Navegação e Página do Painel

```
T1 → T2 → T3
```

---

## Task Breakdown

### T1: Query `getResumoPainel` com filtro por papel e fuso de São Paulo

**What**: Criar `getResumoPainel(agora?: Date)` em `src/features/painel/queries.ts` agregando em paralelo (`Promise.all`) agendamentos de hoje (`total`, `agendados`, `concluidos` e até 5 próximos não-cancelados por `dataHora` asc), contagem de vacinas atrasadas e, somente quando `role === "dono"`, `faturamentoHoje`, `faturamentoMes` e `estoqueBaixoCount`.
**Where**: `src/features/painel/queries.ts`
**Depends on**: None
**Reuses**: `src/features/auth/queries.ts`, `src/features/agenda/queries.ts`, `src/features/vacinas/queries.ts`, `src/features/estoque/queries.ts`, `src/features/vendas/queries.ts`, `src/shared/data/hoje.ts`
**Requirement**: PNL-02, PNL-03, PNL-04, PNL-06, PNL-07, PNL-08, PNL-09, PNL-10

**Tools**:

- MCP: NONE
- Skill: `mastering-typescript`

**Done when**:

- [x] `getResumoPainel` retorna contagens do dia, até 5 próximos agendamentos não-cancelados em ordem crescente de `dataHora` e contagem de vacinas atrasadas para `dono` e `recepcionista`
- [x] Para `dono`, retorna `faturamentoHoje`, `faturamentoMes` e `estoqueBaixoCount`; para `recepcionista`, retorna `dono: null` sem consultar `getProdutos` nem `getVendas`
- [x] Usa `hojeEmSaoPaulo(agora)` e `mesEmSaoPaulo(agora)`, acertando o dia/mês mesmo às 23:30 BRT (`02:30Z` do dia seguinte)
- [x] Gate check passes: `npm run test:unit`
- [x] Test count: >= 209 tests pass

**Tests**: unit
**Gate**: quick

**Commit**: `feat(painel): adiciona query getResumoPainel por papel e fuso (T42)`

**Status**: Done

---

### T2: Link `/painel` no topo do `MenuLateral`

**What**: Adicionar `{ href: "/painel", label: "Painel", icon: LayoutDashboard }` como primeiro item de `ITENS` em `src/app/(dashboard)/menu-lateral.tsx` (visível para `dono` e `recepcionista`) e atualizar a suíte unitária do menu.
**Where**: `src/app/(dashboard)/menu-lateral.tsx`
**Depends on**: T1
**Reuses**: `lucide-react`, `src/app/(dashboard)/__tests__/menu-lateral.test.tsx`
**Requirement**: PNL-01

**Tools**:

- MCP: NONE
- Skill: `react-expert`

**Done when**:

- [x] `"Painel"` aparece como primeiro link do menu para `dono` e `recepcionista`
- [x] Em `/painel`, o link `"Painel"` recebe `aria-current="page"`
- [x] Gate check passes: `npm run test:unit`
- [x] Test count: >= 210 tests pass

**Tests**: unit
**Gate**: quick

**Commit**: `feat(painel): adiciona atalho do painel no menu lateral (T43)`

**Status**: Done

---

### T3: Página `/painel` e suíte E2E por papel

**What**: Criar o Server Component `src/app/(dashboard)/painel/page.tsx` usando `TituloPagina`, `Metrica` e `cartao` de `src/shared/tela/` para renderizar os cartões operacionais, a lista de até 5 agendamentos do dia, o alerta de vacinas atrasadas e os blocos exclusivos do `dono`, acompanhado do teste E2E `e2e/painel.spec.ts`.
**Where**: `src/app/(dashboard)/painel/page.tsx`
**Depends on**: T2
**Reuses**: `src/shared/tela/`, `src/features/painel/queries.ts`, `src/shared/data/fuso.ts`
**Requirement**: PNL-01, PNL-02, PNL-03, PNL-04, PNL-05, PNL-06, PNL-07, PNL-08, PNL-09, PNL-11

**Tools**:

- MCP: NONE
- Skill: `frontend-design`

**Done when**:

- [x] `/painel` exibe título `"Painel"`, métricas operacionais do dia, próximos agendamentos com link para `/agenda` e alerta de vacinas atrasadas com link para `/vacinas?status=atrasada`
- [x] Logado como `dono`, `/painel` exibe Faturamento (hoje e mês) e Estoque baixo com links para `/vendas`, `/relatorios` e `/estoque`
- [x] Logado como `recepcionista`, `/painel` não exibe blocos de Faturamento nem Estoque baixo
- [x] Sem sessão, `/painel` redireciona para `/login`; `/` continua redirecionando para `/agenda`
- [x] Gate check passes: `npm run lint && npx tsc --noEmit && npm run test:unit && npm run build && npm run test:e2e`
- [x] Test count: unit >= 211 (212), e2e >= 41 (41) pass

**Tests**: e2e
**Gate**: build

**Commit**: `feat(painel): cria pagina do painel inicial e testes e2e (T44)`

**Status**: Done

---

## Phase Execution Map

```
Phase 1:  T1 ------→ T2 ------→ T3
```
