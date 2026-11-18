# Revisão Geral de Design Specification (`design-geral`)

## Problem Statement

O PetManager está em produção e pronto para o 1º piloto, mas o visual das telas internas apresenta irregularidades operacionais e de acabamento:
1. A barra lateral (`MenuLateral`) ocupa `256px` (`w-64`) fixos a partir de `lg:` (`1024px`) sem opção de recolher para ícones e fica como barra de topo entre `768px` e `1023px`, reduzindo a área útil para tabelas e formulários em telas de notebook e tablet.
2. A tipografia usa `font-black` (peso 900) de forma generalizada em títulos, subtítulos, nomes de itens e botões, sem escala unificada nos primitivos de `src/shared/tela/` e sem `tabular-nums` em valores monetários, quantidades, horários e paginação.
3. O espaçamento de container, cartões e seções é repetido manualmente em cada rota do dashboard em vez de centralizado em primitivos compartilhados.
4. Controles interativos importantes (`AgendamentoAcoes`, `RegistrarEntradaForm`, `Paginacao`, `linkAtalho` e inputs/selects de formulários) têm alturas de `36px` (`h-9`) ou `40px` (`h-10`), abaixo do mínimo de `44px` (`h-11` / `min-h-11`) recomendado para uso em toque e balcão.

## Goals

- [x] Implementar **sidebar recolhível** (`collapsible="icon"`) a partir de `768px` (`md:`): recolhida por padrão (mostrando apenas ícones), abrindo ao passar o mouse (`120ms`/`220ms`) ou ao receber foco de teclado (`Tab`), com botão de "fixar aberta" persistido no cookie `sidebar_state` lido no Server Component `DashboardLayout` (sem piscar na hidratação) e virando gaveta (`Sheet`/modal) abaixo de `768px`.
- [x] Unificar a **escala de tipografia** e números tabulares (`tabular-nums`) através dos primitivos de `src/shared/tela/`, eliminando tamanhos e pesos `font-black` soltos nas 10 rotas do dashboard.
- [x] Unificar a **escala de espaçamento** (container da página, gaps entre blocos, cartões e paddings internos) em todas as 10 rotas do dashboard e em `loading.tsx`.
- [x] Garantir **responsividade e alvos de toque de no mínimo `44px`** (`min-h-11` / `h-11`) em `375px`, `768px` e `1280px`, sem scroll horizontal (`scrollWidth <= innerWidth`) e com `41/41` testes E2E verdes.

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
| ------- | ------ |
| Alterar regras de negócio, rotas, Server Actions ou queries do Supabase | Escopo estritamente visual e de experiência de uso nas telas internas existentes. |
| Redesenhar o PDF do relatório mensal (`src/shared/pdf/relatorio-pdf.tsx`) | Fora do escopo declarado pelo usuário. |
| Importar cores, fontes ou identidade visual da Gabi Modas | Regra de ouro de isolamento entre projetos: copia-se apenas a mecânica comportamental da sidebar; a estética do PetManager (`slate-950`, `orange-300`/`orange-600`, `stone-50`, `Inter`) permanece intacta (AD-011). |
| Tema escuro nas telas internas | Fora do escopo do MVP/piloto (`design-mvp`). |

---

## Assumptions & Open Questions

Every ambiguity is resolved or recorded here — nothing is left silently unclear.

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --------------------- | -------------- | --------- | ---------- |
| Estado inicial da sidebar quando o cookie `sidebar_state` não existe | **Recolhida (`false`)** — mostra apenas os ícones (`w-16` / `4rem`) e abre ao passar o mouse ou focar por teclado | Confirmado pelo usuário no Party Mode ("1. recolhida"); replica o comportamento de referência da Gabi Modas maximizando a área útil de tela | y |
| Breakpoint entre gaveta mobile e sidebar recolhível | **`768px` (`md:`)** — abaixo de `768px` é barra superior + gaveta modal; em `768px` e acima já exibe a sidebar recolhível em ícones | Confirmado pelo usuário no Party Mode ("2. sidebar recolhida") | y |
| Persistência do pino ("fixar aberta") sem piscar na hidratação | Cookie `sidebar_state` (`true` \| `false`, `path=/`, `max-age=31536000`) lido via `await cookies()` no Server Component `src/app/(dashboard)/layout.tsx` | Evita flash de hidratação (FOUC / layout shift) entre o HTML do servidor e o cliente no Next.js 16 | y |
| Comportamento do hover em dispositivos touch e teclado | Hover restrito a ponteiros de mouse (`pointerType === "mouse"`, debounce `120ms` ao entrar e `220ms` ao sair) sobrepondo sem refluir o `<main>`; `Tab` (foco de teclado) expande a barra imediatamente sem delay | Evita hover fantasma ("sticky hover") em tablets touch (`768px`) e garante acessibilidade por teclado (`design-engineering`) | y |
| Acessibilidade dos links quando a sidebar está recolhida nos ícones | Links mantêm nome acessível (`aria-label={label}` e `title={label}`) mesmo quando o texto visual está oculto no modo ícone | Garante navegação por leitor de tela e compatibilidade total com `getByRole("link", { name })` nos testes unitários e E2E | y |

**Open questions:** none — all resolved and confirmed with the user.

---

## User Stories

### P1: Sidebar Recolhível com Pino Persistente em Cookie ⭐ MVP

**User Story**: Como `dono` ou `recepcionista`, quero que o menu lateral fique recolhido nos ícones por padrão a partir de `768px`, abra ao passar o mouse ou navegar com `Tab`, tenha um botão de fixar aberta lembrado entre sessões e funcione como gaveta no celular (`< 768px`), para aproveitar melhor a largura da tela sem perder rapidez de navegação.

**Why P1**: Prioridade #1 definida pelo usuário; impacta o layout estrutural (`layout.tsx` e `menu-lateral.tsx`) de todas as rotas autenticadas.

**Acceptance Criteria**:

1. WHEN `DashboardLayout` renders on the server without cookie `sidebar_state=true` THEN the system SHALL render the sidebar in collapsed icon mode (`data-state="collapsed"`, `data-collapsible="icon"`) on viewports `>= 768px` (`md:`) without hydration layout shift. [DSG-01]
2. WHEN the user hovers the collapsed sidebar with a mouse pointer (`pointerType === "mouse"`) THEN the system SHALL expand the sidebar after `120ms` and collapse it `220ms` after the mouse leaves, without shifting the `<main>` content layout when unpinned. [DSG-02]
3. WHEN the user clicks the pin button in `MenuLateral` THEN the system SHALL toggle `aria-pressed` (`"true"` / `"false"`), update `aria-label` (`"Fixar a barra lateral aberta"` when unpinned, `"Soltar a barra lateral (abre só com o mouse)"` when pinned), and persist `sidebar_state=<true|false>; path=/; max-age=31536000` in `document.cookie`. [DSG-03]
4. WHEN the user navigates via keyboard (`Tab`) into the sidebar THEN the system SHALL make the pin button focusable with visible focus ring and expand the sidebar while focus remains inside it. [DSG-04]
5. WHEN the viewport width is `< 768px` (`max-md`) THEN the system SHALL display a top header bar with the `"Abrir menu"` button (`>= 44x44px`) that opens a modal drawer (`role="dialog"`, `aria-label="Menu"`) closable via `"Fechar menu"`, link click, or `Escape`. [DSG-05]
6. The system SHALL preserve PetManager's visual identity (`bg-slate-950`, active item `bg-orange-300 text-stone-950`, `Inter`) and keep all navigation links accessible by name (`getByRole("link", { name })`) in both expanded and collapsed states. [DSG-06]

**Independent Test**: Abrir `/painel` em `1280px` e `768px`, verificar que a sidebar inicia recolhida nos ícones, abre ao passar o mouse, fixa aberta ao clicar no botão de pino (persistindo após reload via cookie `sidebar_state=true`), recebe foco visível com `Tab`, e em `375px` abre e fecha como gaveta modal.

---

### P2: Escala Única de Tipografia e Números Tabulares ⭐ MVP

**User Story**: Como `dono` ou `recepcionista`, quero uma hierarquia tipográfica limpa e números alinhados (`tabular-nums`) em métricas, preços, estoques, horários e datas, para ler rapidamente listas e valores sem ruído visual.

**Why P2**: Prioridade #2 definida pelo usuário; corrige o excesso de `font-black` e o desalinhamento de dígitos em todas as telas.

**Acceptance Criteria**:

1. WHEN any dashboard page renders `TituloPagina` THEN the system SHALL apply the unified page header scale: eyebrow in `text-xs font-bold uppercase tracking-[0.14em] text-orange-700` and `h1` in `text-2xl font-bold tracking-tight text-stone-950 sm:text-[1.75rem]`. [DSG-07]
2. WHEN any dashboard page renders `Metrica` or `Paginacao` THEN the system SHALL apply `tabular-nums` to metric values (`text-2xl font-bold tracking-tight text-stone-950 tabular-nums`) and pagination counters (`de–ate de total`, `atual / totalPaginas`). [DSG-08]
3. WHEN dashboard pages render section headings (`h2`), list item titles, secondary metadata, and numeric figures (BRL currency, stock units, appointment times, dates) THEN the system SHALL use the shared typography tokens/primitives from `src/shared/tela/` (`TituloSecao`, `textoPrimario`, `textoMeta`, `valorTabela` with `tabular-nums`) instead of ad-hoc `font-black` classes. [DSG-09]

**Independent Test**: Inspecionar `src/shared/tela/` e as 10 rotas de `src/app/(dashboard)/` verificando que `Metrica`, `Paginacao`, preços em `/vendas`, `/relatorios`, `/servicos`, saldos em `/estoque` e horários em `/agenda` e `/painel` possuem `tabular-nums` e seguem a escala única sem `font-black` solto.

---

### P3: Escala Única de Espaçamento nas Rotas do Dashboard ⭐ MVP

**User Story**: Como usuário do sistema, quero que todas as telas internas tenham a mesma moldura, o mesmo respiro entre seções e o mesmo padding interno nos cartões e listas, para que a transição entre páginas pareça parte de um único produto coeso.

**Why P3**: Prioridade #3 definida pelo usuário; elimina variações arbitrárias de padding e gap entre as 10 rotas.

**Acceptance Criteria**:

1. WHEN any of the 10 dashboard pages or `DashboardLoading` renders THEN the system SHALL wrap its content in the shared `PaginaContainer` primitive (`mx-auto grid w-full max-w-6xl gap-6 p-4 sm:p-6 lg:p-8`) from `src/shared/tela/`. [DSG-10]
2. WHEN cards and list sections render across the dashboard THEN the system SHALL apply the standardized spacing tokens from `src/shared/tela/` (`cartao`, `cartaoForm` with `p-4 sm:p-5`, `cabecalhoLista` with `px-4 py-3.5 sm:px-5`, `itemLista` with `px-4 py-3.5 sm:px-5`, and `gap-4` for metric grids). [DSG-11]

**Independent Test**: Verificar que todas as 10 páginas em `src/app/(dashboard)/**/page.tsx` e `loading.tsx` utilizam `PaginaContainer` e os tokens de espaçamento de `src/shared/tela/`.

---

### P4: Responsividade em 375px, 768px e 1280px e Alvos de Toque >= 44px ⭐ MVP

**User Story**: Como recepcionista ou dono operando o sistema no celular (`375px`), tablet (`768px`) ou desktop (`1280px`), quero que nenhuma tela tenha scroll horizontal e que todos os botões, links de ação e campos de formulário tenham pelo menos `44px` de altura, para tocar com precisão no balcão.

**Why P4**: Prioridade #4 definida pelo usuário; garante usabilidade real em dispositivos móveis e tablets antes do piloto.

**Acceptance Criteria**:

1. WHEN any interactive button, action link (`linkAtalho`, `Paginacao` links, `AgendamentoAcoes` buttons, `RegistrarEntradaForm` button), input, or select renders in the dashboard THEN the system SHALL enforce a minimum touch target height of `44px` (`h-11` or `min-h-11`, and `min-w-11` for icon-only buttons). [DSG-12]
2. WHEN any dashboard route is viewed at `375px`, `768px`, and `1280px` viewport widths THEN the system SHALL render without horizontal page overflow (`document.documentElement.scrollWidth <= window.innerWidth`). [DSG-13]

**Independent Test**: Executar verificação automatizada em Playwright nas larguras `375px`, `768px` e `1280px` checando `scrollWidth <= innerWidth`, foco via `Tab` no pino da sidebar e altura `>= 44px` nos controles, além de `41/41` E2E passando.

---

## Edge Cases

- WHEN a touch device at `>= 768px` taps inside the sidebar THEN synthetic pointer events (`pointerType !== "mouse"`) SHALL NOT leave the sidebar stuck in hover-expanded state. [DSG-02]
- WHEN `Paginacao` renders disabled previous/next controls (on first or last page) THEN the disabled indicators SHALL maintain the same `44x44px` (`size-11`) footprint so the pagination bar never shifts size between pages. [DSG-12]
- WHEN long pet names, service combinations, or product names render at `375px` THEN flex/grid items SHALL wrap or truncate cleanly (`min-w-0`) without overflowing the card width. [DSG-13]

---

## Requirement Traceability

| Requirement ID | Story | Phase / Task | Status |
| -------------- | ----- | ------------ | ------ |
| DSG-01 | P1: Sidebar Recolhível | T46 | Verified |
| DSG-02 | P1: Sidebar Recolhível | T46 | Verified |
| DSG-03 | P1: Sidebar Recolhível | T46 | Verified |
| DSG-04 | P1: Sidebar Recolhível | T46 | Verified |
| DSG-05 | P1: Sidebar Recolhível | T46 | Verified |
| DSG-06 | P1: Sidebar Recolhível | T46 | Verified |
| DSG-07 | P2: Escala Única de Tipografia | T47 | Verified |
| DSG-08 | P2: Escala Única de Tipografia | T47 | Verified |
| DSG-09 | P2: Escala Única de Tipografia | T47 | Verified |
| DSG-10 | P3: Escala Única de Espaçamento | T48 | Verified |
| DSG-11 | P3: Escala Única de Espaçamento | T48 | Verified |
| DSG-12 | P4: Responsividade e Toque 44px | T49 | Verified |
| DSG-13 | P4: Responsividade e Toque 44px | T49 | Verified |

**Coverage:** 13 total, 13 mapped to tasks, 0 unmapped ✅

---

## Success Criteria

- [x] Sidebar recolhível funcionando com cookie `sidebar_state` lido no servidor (zero flash), hover de mouse (`120ms`/`220ms`), foco de teclado (`Tab`), pino acessível e gaveta abaixo de `768px`.
- [x] Primitivos de `src/shared/tela/` governando tipografia (`tabular-nums`) e espaçamento em todas as 10 rotas do dashboard.
- [x] Zero scroll horizontal e alvos de toque `>= 44px` verificados em `375px`, `768px` e `1280px` com screenshots antes/depois.
- [x] `npm run lint`, `npx tsc --noEmit`, `npm run test:unit`, `npm run build` e `npm run test:e2e` (43/43) verdes.
