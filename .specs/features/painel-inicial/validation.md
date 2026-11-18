# Painel Inicial Validation

**Date**: 2026-11-18
**Spec**: `.specs/features/painel-inicial/spec.md`
**Diff range**: `ee0e320..68ac28c` (`task/T42-painel-inicial`)
**Verifier**: independent sub-agent (author ≠ verifier)
**Verdict**: PASS
**Overall**: PASS ✅

---

## Task Completion

| Task | Status  | Notes |
| ---- | ------- | ----- |
| T1   | ✅ Done | `getResumoPainel(agora)` implementado em `src/features/painel/queries.ts` com `Promise.all`, filtro por papel e fuso `America/Sao_Paulo` (`6fa6d73`). |
| T2   | ✅ Done | Item `"Painel"` (`/painel`) no topo de `ITENS` em `src/app/(dashboard)/menu-lateral.tsx` para `dono` e `recepcionista` (`af50ef6`). |
| T3   | ✅ Done | Server Component `src/app/(dashboard)/painel/page.tsx`, testes unitários (`painel-page.test.tsx`) e E2E (`e2e/painel.spec.ts`) (`68ac28c`). |

---

## Spec-Anchored Acceptance Criteria

### P1: Visão Operacional do Dia (Dono e Recepcionista)

| Criterion (WHEN X THEN Y) | Spec-defined outcome | `file:line` + assertion | Result |
| ------------------------- | -------------------- | ----------------------- | ------ |
| **PNL-01**: WHEN an authenticated user with an active profile navigates to `/painel` THEN the system SHALL render the page title `"Painel"` and highlight the `"Painel"` link with `aria-current="page"` in `MenuLateral`. | Heading `"Painel"` visível e primeiro link `"Painel"` (`/painel`) com `aria-current="page"` para `dono` e `recepcionista`. | `src/app/(dashboard)/__tests__/menu-lateral.test.tsx:23` - `expect(links[0].textContent).toBe("Painel")`<br>`src/app/(dashboard)/__tests__/menu-lateral.test.tsx:24` - `expect(links[0].getAttribute("href")).toBe("/painel")`<br>`src/app/(dashboard)/__tests__/menu-lateral.test.tsx:48` - `expect(menu().getByRole("link", { name: "Painel" }).getAttribute("aria-current")).toBe("page")`<br>`src/app/(dashboard)/__tests__/painel-page.test.tsx:58` - `expect(screen.getByRole("heading", { name: "Painel" })).toBeTruthy()`<br>`e2e/painel.spec.ts:16` - `await expect(menu.getByRole("link", { name: "Painel" })).toHaveAttribute("aria-current", "page")`<br>`e2e/painel.spec.ts:17` - `await expect(page.getByRole("heading", { name: "Painel" })).toBeVisible()`<br>`e2e/painel.spec.ts:45` - `await expect(menu.getByRole("link", { name: "Painel" })).toHaveAttribute("aria-current", "page")` | ✅ PASS |
| **PNL-02**: WHEN `/painel` loads THEN the system SHALL display today's appointment counts (`total`, `agendados`, `concluidos`) calculated for `hojeEmSaoPaulo()` in timezone `America/Sao_Paulo` (`-03:00`). | Contagens exatas de hoje (`total: 7`, `agendados: 5`, `concluidos: 1` no fixture unitário) consultadas para `hojeEmSaoPaulo(agora)` e exibidas nos cartões de métrica. | `src/features/painel/__tests__/queries.test.ts:76` - `expect(mockGetAgendamentosPorDia).toHaveBeenCalledWith("2026-11-18")`<br>`src/features/painel/__tests__/queries.test.ts:80` - `expect(resultado.agendamentosHoje.total).toBe(7)`<br>`src/features/painel/__tests__/queries.test.ts:81` - `expect(resultado.agendamentosHoje.agendados).toBe(5)`<br>`src/features/painel/__tests__/queries.test.ts:82` - `expect(resultado.agendamentosHoje.concluidos).toBe(1)`<br>`e2e/painel.spec.ts:19` - `await expect(page.getByText("Agendamentos hoje")).toBeVisible()`<br>`e2e/painel.spec.ts:20` - `await expect(page.getByText("Pendentes hoje")).toBeVisible()`<br>`e2e/painel.spec.ts:21` - `await expect(page.getByText("Concluídos hoje")).toBeVisible()` | ✅ PASS |
| **PNL-03**: WHEN `/painel` loads THEN the system SHALL list up to 5 non-canceled appointments for today ordered by `dataHora` ascending and provide a link to `/agenda`. | Até 5 agendamentos com `status !== "cancelado"` ordenados por `dataHora` asc (`[1, 4, 3, 5, 6]`, excluindo `id: 2` cancelado e `id: 7` sexto item) e link `href="/agenda"`. | `src/features/painel/__tests__/queries.test.ts:83` - `expect(resultado.agendamentosHoje.proximos.map((a) => a.id)).toStrictEqual([1, 4, 3, 5, 6])`<br>`src/app/(dashboard)/__tests__/painel-page.test.tsx:59` - `expect(screen.getByText("Thor")).toBeTruthy()`<br>`src/app/(dashboard)/__tests__/painel-page.test.tsx:65` - `expect(screen.getByRole("link", { name: "Ver agenda" }).getAttribute("href")).toBe("/agenda")`<br>`e2e/painel.spec.ts:28` - `await expect(page.getByRole("link", { name: "Ver agenda" })).toHaveAttribute("href", "/agenda")` | ✅ PASS |
| **PNL-04**: WHEN `/painel` loads THEN the system SHALL display the total count of overdue vaccines (`status === "atrasada"` as of `hojeEmSaoPaulo()`) and provide a link to `/vacinas?status=atrasada`. | Contagem total (`total: 6`) e até 5 itens (`[1, 2, 3, 4, 5]`) de vacinas com `{ status: "atrasada" }`, mais link `href="/vacinas?status=atrasada"`. | `src/features/painel/__tests__/queries.test.ts:77` - `expect(mockGetVacinas).toHaveBeenCalledWith({ status: "atrasada" })`<br>`src/features/painel/__tests__/queries.test.ts:84` - `expect(resultado.vacinasAtrasadas.total).toBe(6)`<br>`src/features/painel/__tests__/queries.test.ts:85` - `expect(resultado.vacinasAtrasadas.itens.map((v) => v.id)).toStrictEqual([1, 2, 3, 4, 5])`<br>`src/app/(dashboard)/__tests__/painel-page.test.tsx:66` - `expect(screen.getByRole("link", { name: "Ver vacinas atrasadas" }).getAttribute("href")).toBe("/vacinas?status=atrasada")`<br>`e2e/painel.spec.ts:29` - `await expect(page.getByRole("link", { name: "Ver vacinas atrasadas" })).toHaveAttribute("href", "/vacinas?status=atrasada")` | ✅ PASS |
| **PNL-05**: The system SHALL keep `/` and post-login redirects pointing to `/agenda` (`DES-04`). | `/` e pós-login redirecionam para `/agenda`. | `e2e/home.spec.ts:5` - `await expect(page).toHaveURL(/\/agenda$/)`<br>`e2e/login.spec.ts:22` - `await expect(page).toHaveURL(/\/agenda$/)` | ✅ PASS |

### P1: Indicadores de Gestão e Estoque Crítico (Exclusivo Dono)

| Criterion (WHEN X THEN Y) | Spec-defined outcome | `file:line` + assertion | Result |
| ------------------------- | -------------------- | ----------------------- | ------ |
| **PNL-06**: WHERE the authenticated user has role `"dono"`, WHEN `/painel` loads THEN the system SHALL display the active revenue for today (`faturamentoHoje` in BRL) and for the current month (`faturamentoMes` in BRL, based on `mesEmSaoPaulo()`), excluding refunded sales (`estornada_em IS NOT NULL`), with links to `/vendas` and `/relatorios`. | `faturamentoHoje: 140` e `faturamentoMes: 230` (via `getVendas({ mes: "2026-11" })`, que já filtra `estornada_em IS NULL`), formatados em BRL (`R$ 120,00`, `R$ 1.450,50`) com links para `/vendas` e `/relatorios`. | `src/features/painel/__tests__/queries.test.ts:78` - `expect(mockGetVendas).toHaveBeenCalledWith({ mes: "2026-11" })`<br>`src/features/painel/__tests__/queries.test.ts:86` - `expect(resultado.dono).toStrictEqual({ faturamentoHoje: 140, faturamentoMes: 230, estoqueBaixoCount: 2 })`<br>`src/app/(dashboard)/__tests__/painel-page.test.tsx:70` - `expect(screen.getByText(/120,00/)).toBeTruthy()`<br>`src/app/(dashboard)/__tests__/painel-page.test.tsx:72` - `expect(screen.getByText(/1\.450,50/)).toBeTruthy()`<br>`src/app/(dashboard)/__tests__/painel-page.test.tsx:74` - `expect(screen.getByRole("link", { name: "Ir para vendas" }).getAttribute("href")).toBe("/vendas")`<br>`src/app/(dashboard)/__tests__/painel-page.test.tsx:75` - `expect(screen.getByRole("link", { name: "Ir para relatórios" }).getAttribute("href")).toBe("/relatorios")`<br>`e2e/painel.spec.ts:24` - `await expect(page.getByText("Faturamento hoje")).toBeVisible()`<br>`e2e/painel.spec.ts:25` - `await expect(page.getByText("Faturamento no mês")).toBeVisible()` | ✅ PASS |
| **PNL-07**: WHERE the authenticated user has role `"dono"`, WHEN `/painel` loads THEN the system SHALL display the count of products with low stock (`saldoEstoque <= estoqueMinimo`) and a link to `/estoque`. | `estoqueBaixoCount: 2` (produtos com `estoqueBaixo === true`) e link `href="/estoque"`. | `src/features/painel/__tests__/queries.test.ts:89` - `estoqueBaixoCount: 2` (em `toStrictEqual`)<br>`src/app/(dashboard)/__tests__/painel-page.test.tsx:73` - `expect(screen.getByText("Produtos em estoque baixo")).toBeTruthy()`<br>`src/app/(dashboard)/__tests__/painel-page.test.tsx:76` - `expect(screen.getByRole("link", { name: "Ir para estoque" }).getAttribute("href")).toBe("/estoque")`<br>`e2e/painel.spec.ts:26` - `await expect(page.getByText("Produtos em estoque baixo")).toBeVisible()`<br>`e2e/painel.spec.ts:33` - `await expect(page.getByRole("link", { name: "Ir para estoque" })).toHaveAttribute("href", "/estoque")` | ✅ PASS |
| **PNL-08**: IF the authenticated user has role `"recepcionista"` THEN the system SHALL NOT query or render the revenue metrics (`faturamentoHoje`, `faturamentoMes`) or the low-stock alert (`estoqueBaixoCount`) on `/painel`. | `mockGetProdutos` e `mockGetVendas` não chamados, `dono: null` e nenhum rótulo de faturamento ou estoque baixo renderizado no DOM. | `src/features/painel/__tests__/queries.test.ts:102` - `expect(mockGetProdutos).not.toHaveBeenCalled()`<br>`src/features/painel/__tests__/queries.test.ts:103` - `expect(mockGetVendas).not.toHaveBeenCalled()`<br>`src/features/painel/__tests__/queries.test.ts:104` - `expect(resultado.dono).toBeNull()`<br>`src/app/(dashboard)/__tests__/painel-page.test.tsx:100` - `expect(screen.queryByText("Faturamento hoje")).toBeNull()`<br>`src/app/(dashboard)/__tests__/painel-page.test.tsx:101` - `expect(screen.queryByText("Faturamento no mês")).toBeNull()`<br>`src/app/(dashboard)/__tests__/painel-page.test.tsx:102` - `expect(screen.queryByText("Produtos em estoque baixo")).toBeNull()`<br>`e2e/painel.spec.ts:50` - `await expect(page.getByText("Faturamento hoje")).toHaveCount(0)`<br>`e2e/painel.spec.ts:51` - `await expect(page.getByText("Faturamento no mês")).toHaveCount(0)`<br>`e2e/painel.spec.ts:52` - `await expect(page.getByText("Produtos em estoque baixo")).toHaveCount(0)` | ✅ PASS |

### Edge Cases

| Criterion (WHEN X THEN Y) | Spec-defined outcome | `file:line` + assertion | Result |
| ------------------------- | -------------------- | ----------------------- | ------ |
| **PNL-09**: WHEN there are no appointments today, no overdue vaccines, no sales, or no low-stock products THEN the system SHALL display `0` (and `R$ 0,00` for `dono` revenue) with empty-state messages instead of failing or hiding the operational sections. | Contagens `0`, listas `[]`, faturamento `0` e mensagens `"Nenhum atendimento previsto para hoje."` e `"Nenhuma vacina atrasada."`. | `src/features/painel/__tests__/queries.test.ts:118` - `expect(resultado).toStrictEqual({ hoje: "2026-11-18", agendamentosHoje: { total: 0, agendados: 0, concluidos: 0, proximos: [] }, vacinasAtrasadas: { total: 0, itens: [] }, dono: { faturamentoHoje: 0, faturamentoMes: 0, estoqueBaixoCount: 0 } })`<br>`src/app/(dashboard)/__tests__/painel-page.test.tsx:98` - `expect(screen.getByText("Nenhum atendimento previsto para hoje.")).toBeTruthy()`<br>`src/app/(dashboard)/__tests__/painel-page.test.tsx:99` - `expect(screen.getByText("Nenhuma vacina atrasada.")).toBeTruthy()` | ✅ PASS |
| **PNL-10**: WHEN the server clock in UTC is already on the next day or next month (`2026-12-01T02:30:00Z` = `2026-11-30T23:30:00-03:00`) THEN the system SHALL still compute today's appointments, today's sales, and current month's revenue using `America/Sao_Paulo` (`2026-11-30` and month `2026-11`). | `hoje === "2026-11-30"`, `mes === "2026-11"` e venda em `2026-12-01T01:30:00Z` (`22:30 BRT` de `30/11`) contabilizada em `faturamentoHoje: 75` e `faturamentoMes: 75`. | `src/features/painel/__tests__/queries.test.ts:149` - `expect(mockGetAgendamentosPorDia).toHaveBeenCalledWith("2026-11-30")`<br>`src/features/painel/__tests__/queries.test.ts:150` - `expect(mockGetVendas).toHaveBeenCalledWith({ mes: "2026-11" })`<br>`src/features/painel/__tests__/queries.test.ts:151` - `expect(resultado.hoje).toBe("2026-11-30")`<br>`src/features/painel/__tests__/queries.test.ts:152` - `expect(resultado.dono).toStrictEqual({ faturamentoHoje: 75, faturamentoMes: 75, estoqueBaixoCount: 0 })` | ✅ PASS |
| **PNL-11**: IF an unauthenticated user requests `/painel` THEN the system SHALL redirect the request to `/login` via `proxy.ts`. | Redirecionamento HTTP para `/login` quando `storageState` está vazio. | `e2e/painel.spec.ts:8` - `await expect(page).toHaveURL(/\/login$/)` | ✅ PASS |

**Status**: ✅ All 11 ACs covered (`PNL-01`..`PNL-11`)

---

## Discrimination Sensor

Baseline `git status --porcelain` capturado antes do sensor e verificado idêntico após restauração via cópias em `/tmp` (`git diff` vazio).

| Mutation | File:line | Description | Killed? |
| -------- | --------- | ----------- | ------- |
| 1        | `src/features/painel/queries.ts:51` | Invertida guarda de papel `if (role === "dono")` → `if (role !== "dono")` | ✅ Killed (4/4 testes falharam em `src/features/painel/__tests__/queries.test.ts:78,102,118,150`) |
| 2        | `src/features/painel/queries.ts:33` | Trocado `hojeEmSaoPaulo(agora)` por `agora.toISOString().slice(0, 10)` (UTC puro) | ✅ Killed (`queries.test.ts:149` falhou: recebeu `"2026-12-01"` em vez de `"2026-11-30"`) |
| 3        | `src/app/(dashboard)/painel/page.tsx:29` | Removida guarda `{dono && (` exibindo indicadores do dono mesmo com `dono === null` | ✅ Killed (`painel-page.test.tsx:100` falhou: `expect(screen.queryByText("Faturamento hoje")).toBeNull()`) |

**Sensor depth**: lightweight (3 targeted behavior-level mutations across RBAC, timezone boundary, and UI role-gating)
**Result**: 3/3 killed - PASS ✅

---

## Code Quality

| Principle | Status |
| --------- | ------ |
| Minimum code | ✅ |
| Surgical changes | ✅ |
| No scope creep | ✅ |
| Matches patterns | ✅ |
| Spec-anchored outcome check (asserted values match spec) | ✅ |
| Per-layer Coverage Expectation met (domain 1:1 ACs; routes happy+edge+error) | ✅ |
| Every test maps to a spec requirement - no unclaimed tests | ✅ |
| Documented guidelines followed: `AGENTS.md`, `.specs/STATE.md` (AD-004, AD-010, AD-012, AD-013) | ✅ |

---

## Edge Cases

- [x] **PNL-09** (Dia/mês sem agendamentos, vacinas atrasadas, vendas ou estoque baixo): tratado com contagens `0`, `R$ 0,00` e mensagens de estado vazio (`queries.test.ts:109`, `painel-page.test.tsx:79`).
- [x] **PNL-10** (Relógio UTC já no dia/mês seguinte às 23:30 BRT = `02:30Z`): tratado com `hojeEmSaoPaulo(agora)` e `mesEmSaoPaulo(agora)` (`queries.test.ts:138`).
- [x] **PNL-11** (Usuário não autenticado em `/painel`): redirecionado para `/login` via `proxy.ts` (`e2e/painel.spec.ts:6`).

---

## Gate Check

- **Gate command**: `npm run lint && npx tsc --noEmit && npm run test:unit && npm run build && npm run test:e2e`
- **Result**: 212 unit passed, 41 e2e passed, 0 failed, 0 skipped
- **Test count before feature**: 205 unit / 38 e2e
- **Test count after feature**: 212 unit / 41 e2e
- **Delta**: +7 unit tests, +3 e2e tests
- **Skipped tests**: none
- **Failures**: none

---

## Requirement Traceability Update

| Requirement | Previous Status | New Status  |
| ----------- | --------------- | ----------- |
| PNL-01      | Implementing    | ✅ Verified |
| PNL-02      | Implementing    | ✅ Verified |
| PNL-03      | Implementing    | ✅ Verified |
| PNL-04      | Implementing    | ✅ Verified |
| PNL-05      | Implementing    | ✅ Verified |
| PNL-06      | Implementing    | ✅ Verified |
| PNL-07      | Implementing    | ✅ Verified |
| PNL-08      | Implementing    | ✅ Verified |
| PNL-09      | Implementing    | ✅ Verified |
| PNL-10      | Implementing    | ✅ Verified |
| PNL-11      | Implementing    | ✅ Verified |

---

## Summary

**Overall**: PASS ✅

**Spec-anchored check**: 11/11 ACs matched spec outcome (0 gaps)
**Sensor**: 3/3 mutations killed
**Gate**: 212 unit passed, 41 e2e passed

**What works**:
- `/painel` consolida agendamentos do dia (`total`, `agendados`, `concluidos`, até 5 próximos não-cancelados por `dataHora` asc) e alertas de vacinas atrasadas em `Promise.all`.
- Indicadores de gestão (`faturamentoHoje`, `faturamentoMes`, `estoqueBaixoCount`) são consultados e renderizados exclusivamente para o papel `dono`.
- Fuso horário `America/Sao_Paulo` respeitado na virada de dia/mês (`23:30 BRT` = `02:30Z`), proteção de rota `/painel` → `/login` sem sessão e preservação de `/` → `/agenda` (`DES-04`).

**Issues found**: none

**Next steps**: Feature pronta para conclusão e merge.
