# Revisão Geral de Design Tasks (`design-geral`)

**Spec**: `.specs/features/design-geral/spec.md`
**Design**: `.specs/features/design-geral/design.md`
**Status**: In Progress

---

## Test Coverage Matrix

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| ---------- | ------------------ | -------------------- | ---------------- | ----------- |
| `MenuLateral` + `DashboardLayout` (T46) | unit + e2e | Estado recolhido por padrão (`DSG-01`), abertura por mouse hover e teclado `Tab` (`DSG-02`, `DSG-04`), botão de pino com `aria-pressed`/`aria-label` e cookie `sidebar_state` (`DSG-03`), gaveta mobile `< 768px` (`DSG-05`), identidade e links acessíveis (`DSG-06`) | `src/app/(dashboard)/__tests__/menu-lateral.test.tsx`, `e2e/painel.spec.ts` | `npm run test:unit && npm run test:e2e` |
| Primitivos de Tipografia e `tabular-nums` (T47) | unit | `TituloPagina`, `TituloSecao`, `Metrica` e `Paginacao` com escala unificada e `tabular-nums` (`DSG-07`..`DSG-09`) | `src/shared/tela/__tests__/*.test.tsx` | `npm run test:unit` |
| Primitivos de Espaçamento (T48) | unit | `PaginaContainer` e tokens de cartão/lista aplicados em todas as 10 rotas e `loading.tsx` (`DSG-10`, `DSG-11`) | `src/shared/tela/__tests__/*.test.tsx` | `npm run test:unit` |
| Responsividade e Toque 44px (T49) | unit + e2e | Controles `>= 44px` (`min-h-11` / `h-11`) (`DSG-12`), zero scroll horizontal em `375px`, `768px` e `1280px` (`DSG-13`), 41/41 E2E verdes | `e2e/*.spec.ts` | `npm run lint && npx tsc --noEmit && npm run test:unit && npm run build && npm run test:e2e` |

## Gate Check Commands

| Gate Level | When to Use | Command |
| ---------- | ----------- | ------- |
| Quick | Unit tests + typecheck + lint | `npm run lint && npx tsc --noEmit && npm run test:unit` |
| Full | Full verification per task PR | `npm run lint && npx tsc --noEmit && npm run test:unit && npm run build && npm run test:e2e` |

---

## Execution Plan

Uma branch `task/T<N>-<slug>` e um PR por task (AD-005):

```
T46 (sidebar) → T47 (tipografia) → T48 (espaçamento) → T49 (responsividade 44px + validação final)
```

---

## Task Breakdown

### T46: Sidebar recolhível com cookie `sidebar_state`, hover, foco de teclado e gaveta mobile

**Branch**: `task/T46-sidebar-recolhivel`
**What**:
- Ler `cookies()` no Server Component `src/app/(dashboard)/layout.tsx` (`sidebar_state === "true"`, default `false` = recolhida) e repassar `defaultFixada` para `MenuLateral` sem piscar na hidratação.
- Em `src/app/(dashboard)/menu-lateral.tsx`, exibir sidebar recolhível em ícones a partir de `md:` (`768px`), abrindo por cima do conteúdo ao passar o mouse (`pointerType === "mouse"`, `120ms`/`220ms`) ou ao receber foco via `Tab`, com botão de pino (`aria-pressed`, `aria-label`, gravação no cookie `sidebar_state`) que fixa a barra aberta e ajusta o `sidebar-gap` no layout.
- Abaixo de `768px` (`md:hidden`), manter barra superior + gaveta modal acessível (`role="dialog"`, `aria-label="Menu"`, fecha com `Escape`, backdrop, botão X ou clique em link).
**Where**: `src/app/(dashboard)/layout.tsx`, `src/app/(dashboard)/menu-lateral.tsx`, `src/app/(dashboard)/__tests__/menu-lateral.test.tsx`
**Requirement**: DSG-01, DSG-02, DSG-03, DSG-04, DSG-05, DSG-06
**Skill**: `design-engineering`, `react-expert`

**Done when**:
- [x] Sem cookie `sidebar_state`, a sidebar inicia recolhida (`data-state="collapsed"`, `data-collapsible="icon"`) em `>= 768px`
- [x] Hover de mouse expande após `120ms` e recolhe após `220ms`; foco via `Tab` expande imediatamente e chega ao botão de pino com foco visível
- [x] Clicar no pino alterna `aria-pressed`, atualiza `aria-label` e grava `sidebar_state` no cookie
- [x] Testes unitários e E2E (`41/41` + novo spec) passam sem regressão
- [x] PR criado e mergeado na `main`

**Status**: Done

---

### T47: Escala única de tipografia e `tabular-nums` nos primitivos e telas

**Branch**: `task/T47-tipografia-primitivos`
**What**:
- Atualizar `src/shared/tela/titulo-pagina.tsx` e `src/shared/tela/paginacao.tsx` com a escala tipográfica única (`TituloPagina`, `TituloSecao`/`tituloSecao`, `Metrica`, `textoPrimario`, `textoMeta`, `valorTabela`) e `tabular-nums` em métricas e paginação.
- Aplicar os primitivos tipográficos e `tabular-nums` nas 10 páginas de `src/app/(dashboard)/` e em seus componentes (`AgendamentoAcoes`, `AgendaCalendario`), removendo `font-black` e tamanhos soltos.
**Where**: `src/shared/tela/titulo-pagina.tsx`, `src/shared/tela/paginacao.tsx`, `src/shared/tela/__tests__/`, `src/app/(dashboard)/**`
**Requirement**: DSG-07, DSG-08, DSG-09
**Skill**: `design-taste-frontend`, `frontend-ui-engineering`

**Done when**:
- [ ] `Metrica`, `Paginacao` e todos os valores monetários, quantidades, horários e datas usam `tabular-nums`
- [ ] Nenhum `text-lg font-black` ou `font-black` solto permanece nas páginas de `(dashboard)`
- [ ] Lint, tsc, unit, build e E2E passando
- [ ] PR criado e mergeado na `main`

**Status**: Pending

---

### T48: Escala única de espaçamento em todas as rotas do dashboard

**Branch**: `task/T48-espacamento-consistente`
**What**:
- Exportar `PaginaContainer`, `cartaoForm`, `cabecalhoLista` e `itemLista` em `src/shared/tela/titulo-pagina.tsx`.
- Padronizar todas as 10 rotas de `src/app/(dashboard)/**/page.tsx` e `src/app/(dashboard)/loading.tsx` para usar `PaginaContainer` e a mesma escala de padding interno e gap entre cartões e seções.
**Where**: `src/shared/tela/titulo-pagina.tsx`, `src/app/(dashboard)/loading.tsx`, `src/app/(dashboard)/**/page.tsx`
**Requirement**: DSG-10, DSG-11
**Skill**: `design-engineering`, `frontend-ui-engineering`

**Done when**:
- [ ] Todas as 10 rotas do dashboard e `loading.tsx` usam `PaginaContainer` e os tokens de espaçamento de `src/shared/tela/`
- [ ] Lint, tsc, unit, build e E2E passando
- [ ] PR criado e mergeado na `main`

**Status**: Pending

---

### T49: Responsividade (375px, 768px, 1280px) e alvos de toque mínimos de 44px

**Branch**: `task/T49-responsividade-toque-44px`
**What**:
- Elevar todos os botões, links de atalho/paginação, inputs e selects do dashboard para altura mínima de `44px` (`h-11` / `min-h-11`, `size-11` em botões de ícone de `Paginacao`) com feedback `active:scale-[0.98]`.
- Ajustar o empilhamento responsivo em `375px`, `768px` e `1280px` (`AgendamentoAcoes`, `RegistrarEntradaForm`, `HorarioDiaForm`, `RelatoriosPage`, `VacinasPage`, `PetsPage`, `VendasPage`, `ServicosPage`) garantindo zero scroll horizontal.
- Capturar screenshots "depois" nas 3 larguras, validar foco de teclado no pino e produzir `.specs/features/design-geral/validation.md`.
**Where**: `src/shared/tela/`, `src/shared/filters/search-filter-bar.tsx`, `src/app/(dashboard)/**`, `e2e/`
**Requirement**: DSG-12, DSG-13
**Skill**: `design-engineering`, `design-taste-frontend`

**Done when**:
- [ ] Todos os alvos de toque interativos têm `>= 44px` de altura
- [ ] Zero scroll horizontal em `375px`, `768px` e `1280px` validado + screenshots antes/depois gerados
- [ ] `lint`, `tsc`, `test:unit`, `build` e `test:e2e` (41/41+) verdes
- [ ] PR criado e mergeado na `main` + deploy conferido na Vercel

**Status**: Pending
