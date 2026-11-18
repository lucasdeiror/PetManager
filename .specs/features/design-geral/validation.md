# Revisão Geral de Design Validation (`design-geral`)

**Date**: 2026-11-18
**Spec**: `.specs/features/design-geral/spec.md`
**Tasks**: T46 (PR #72), T47 (PR #73), T48 (PR #74), T49 (PR #75)
**Verdict**: PASS
**Overall**: PASS ✅

---

## Task Completion

| Task | PR | Status | Notes |
| ---- | -- | ------ | ----- |
| T46 | #72 (`f7823c4`) | ✅ Done | Sidebar recolhível (`collapsible="icon"`) a partir de `768px` (`md:`), recolhida por padrão sem cookie, leitura server-side via `await cookies()` em `DashboardLayout`, hover `120ms`/`220ms`, foco de teclado `Tab`, pino com `aria-pressed` e gaveta `< 768px`. |
| T47 | #73 (`87d2144`) | ✅ Done | Escala única de tipografia em `src/shared/tela/` (`TituloPagina`, `TituloSecao`, `Metrica`, `textoPrimario`, `textoMeta`, `valorTabela`) e `tabular-nums` em valores numéricos, preços, saldos, datas, horários e paginação; remoção de `font-black` solto. |
| T48 | #74 (`6fa6782`) | ✅ Done | Escala única de espaçamento com `PaginaContainer`, `cartaoForm`, `cabecalhoLista` e `itemLista` aplicados às 10 rotas do dashboard e ao `loading.tsx`. |
| T49 | #75 | ✅ Done | Alvos de toque mínimos de `44px` (`botaoPrimario`, `botaoSecundario`, `campoInput`, botões `size-11` de `Paginacao`), zero scroll horizontal em `375px`, `768px` e `1280px` e screenshots antes/depois verificados. |

---

## Spec-Anchored Acceptance Criteria

| ID | Criterion | Evidence (`file:line` + test) | Result |
| -- | --------- | ----------------------------- | ------ |
| **DSG-01** | Sidebar inicia recolhida (`data-state="collapsed"`, `data-collapsible="icon"`) em `>= 768px` quando não há cookie `sidebar_state=true`, lida no SSR via `cookies()`. | `src/app/(dashboard)/layout.tsx:11`, `src/app/(dashboard)/__tests__/menu-lateral.test.tsx:73`, `e2e/painel.spec.ts:41` | ✅ PASS |
| **DSG-02** | Hover de mouse (`pointerType === "mouse"`) expande após `120ms` e fecha após `220ms` sem empurrar o `<main>` e ignorando toque (`pointerType === "touch"`). | `src/app/(dashboard)/menu-lateral.tsx:66-82`, `src/app/(dashboard)/__tests__/menu-lateral.test.tsx:86` | ✅ PASS |
| **DSG-03** | Botão de pino alterna `aria-pressed`, atualiza `aria-label` e grava `sidebar_state` no cookie. | `src/app/(dashboard)/menu-lateral.tsx:84-90,141-159`, `src/app/(dashboard)/__tests__/menu-lateral.test.tsx:120`, `e2e/painel.spec.ts:51` | ✅ PASS |
| **DSG-04** | `Tab` foca o pino com anel visível e expande a sidebar enquanto o foco permanece nela. | `src/app/(dashboard)/menu-lateral.tsx:110-115`, `src/app/(dashboard)/__tests__/menu-lateral.test.tsx:139`, `e2e/painel.spec.ts:46` | ✅ PASS |
| **DSG-05** | Em `< 768px` (`md:hidden`), exibe barra superior com botão `"Abrir menu"` (`size-11`) e gaveta modal `role="dialog"` que fecha com `Escape`. | `src/app/(dashboard)/menu-lateral.tsx:191-249`, `src/app/(dashboard)/__tests__/menu-lateral.test.tsx:60` | ✅ PASS |
| **DSG-06** | Preserva paleta do PetManager (`bg-slate-950`, ativo `bg-orange-300 text-stone-950`) e links acessíveis por nome tanto aberta quanto recolhida. | `src/app/(dashboard)/menu-lateral.tsx:167-183`, `src/app/(dashboard)/__tests__/menu-lateral.test.tsx:26-58` | ✅ PASS |
| **DSG-07** | `TituloPagina` aplica escala única sem `font-black`. | `src/shared/tela/titulo-pagina.tsx:33-53`, `src/shared/tela/__tests__/titulo-pagina.test.tsx:22` | ✅ PASS |
| **DSG-08** | `Metrica` e `Paginacao` aplicam `tabular-nums`. | `src/shared/tela/titulo-pagina.tsx:68-75`, `src/shared/tela/paginacao.tsx:48`, `src/shared/tela/__tests__/titulo-pagina.test.tsx:35` | ✅ PASS |
| **DSG-09** | `TituloSecao`, `textoPrimario`, `textoMeta` e `valorTabela` padronizados nas 10 rotas sem `font-black` solto. | `src/shared/tela/titulo-pagina.tsx:4-7`, `src/shared/tela/__tests__/titulo-pagina.test.tsx:53` | ✅ PASS |
| **DSG-10** | `PaginaContainer` (`mx-auto grid w-full max-w-6xl gap-6 p-4 sm:p-6 lg:p-8`) aplicado nas 10 rotas e em `loading.tsx`. | `src/shared/tela/titulo-pagina.tsx:10,21-30`, `src/shared/tela/__tests__/titulo-pagina.test.tsx:66` | ✅ PASS |
| **DSG-11** | Tokens `cartao`, `cartaoForm`, `cabecalhoLista` e `itemLista` aplicados uniformemente. | `src/shared/tela/titulo-pagina.tsx:11-15`, `src/shared/tela/__tests__/titulo-pagina.test.tsx:78-81` | ✅ PASS |
| **DSG-12** | Controles interativos (`botaoPrimario`, `botaoSecundario`, `campoInput`, `Paginacao` `size-11`) com altura mínima de `44px` (`h-11` / `min-h-11`). | `src/shared/tela/titulo-pagina.tsx:18-23`, `src/shared/tela/paginacao.tsx:43`, `e2e/painel.spec.ts:75-83` | ✅ PASS |
| **DSG-13** | Zero scroll horizontal (`scrollWidth <= innerWidth`) em `375px`, `768px` e `1280px`. | `e2e/painel.spec.ts:63-73` | ✅ PASS |

---

## Review Table (`design-engineering` Format: `Before | After | Why`)

| Before | After | Why |
| ------ | ----- | --- |
| `<aside class="hidden w-64 lg:flex">` fixa e sem pino | Sidebar `collapsible="icon"` a partir de `md:` (`768px`), recolhida por padrão (`w-16`), hover `120ms`/`220ms`, `Tab` focus e pino persistido em cookie `sidebar_state` lido via `cookies()` no Server Component | Libera `192px` horizontais em tablets/notebooks sem piscar na hidratação e sem refluir o `<main>` durante o hover |
| `font-black` (peso 900) em H1, H2, nomes de itens, selos e botões; dígitos proporcionais | Escala única em `src/shared/tela/` (`font-bold` em títulos, `font-semibold` em linhas) + `tabular-nums` em métricas, preços, saldos, horários, datas e paginação | Elimina ruído visual em sessões longas de balcão e alinha dígitos verticalmente |
| Container `mx-auto grid max-w-6xl gap-6 p-4 sm:p-6 lg:p-8` e paddings copiados manualmente em cada página | Primitivos `PaginaContainer`, `cartaoForm`, `cabecalhoLista` e `itemLista` em `src/shared/tela/` | Garante consistência geométrica entre as 10 rotas e `loading.tsx` |
| Botões de ação e paginação com `h-9` (`36px`) / `p-2` e inputs com `h-10` (`40px`) | Todos os controles com `min-h-11` / `h-11` / `size-11` (`>= 44px`) e `active:scale-[0.98]` | Cumpre o piso de `44px` de alvo de toque para operação sem erros no celular e tablet |

---

## Gate Check

- **Command**: `npm run lint && npx tsc --noEmit && npm run test:unit && npm run build && npm run test:e2e`
- **Unit tests**: 47 suites, **220 passed** (`TZ=UTC`)
- **E2E tests**: **43/43 passed** (incluindo verificação de pino/teclado/cookie e responsividade `375px`/`768px`/`1280px` + `boundingBox >= 44px`)
- **Screenshots**: Capturados antes e depois em `375px`, `768px` e `1280px` (`/painel`, `/agenda`, `/estoque`).
