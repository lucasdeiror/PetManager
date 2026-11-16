# Design do MVP Validation

**Date**: 2026-11-15
**Spec**: `.specs/features/design-mvp/spec.md`
**Diff range**: `b587e1f^..cb1947a` (8 commits, PRs #53-#60, T26-T33; 56 arquivos, +1044/-479)
**Verifier**: independent sub-agent (author != verifier)

**Verdict**: PASS COM LACUNAS. Gates verdes (lint, unit 193, build, e2e 36/36), regras do projeto respeitadas, 6/6 requisitos implementados. Cobertura automatizada de DES-02, DES-05 e DES-06 (visual) é fraca; isso é lacuna de teste, não de implementação. Discrimination sensor não executado.

---

## Task Completion

| Task | Status | Notes |
| ---- | ------ | ----- |
| T26 base, menu, login (T26.1-26.4) | Done | tokens, `menu-lateral.tsx`, `/` -> `/agenda`, login |
| T27 agenda e lista | Done | `TituloPagina`, `cartao`, `Paginacao`/`paginar` em `src/shared/tela/` |
| T28 tutores e pets | Done | `pets/page.tsx:15,24-25,55` (`pagina_tutores`, `pagina_pets`) |
| T29 vendas | Done | métricas + lista paginada |
| T30 vacinas | Done | lista paginada |
| T31 estoque | Done | métricas + lista paginada |
| T32 relatórios | Done | métricas, mês corrente em Brasília (`relatorios/page.tsx:23-26`) |
| T33 serviços e horário | Done | sem paginação (catálogo curto, decisão registrada em `tasks.md`) |
| Painel inicial | Open | opcional, fora de escopo (spec) |

---

## Spec-Anchored Acceptance Criteria

| AC | Spec-defined outcome | `file:line` + evidência | Result |
| -- | -------------------- | ----------------------- | ------ |
| DES-01 | tokens do MVP (primary laranja, fundo stone-50, Inter via `next/font`) | `src/app/globals.css:6,9,15` (`--background` stone-50, `--primary` laranja); `src/app/layout.tsx:2,5` (`Inter` com `variable: "--font-inter"`). Sem teste automatizado (CSS) | PASS (só código) |
| DES-02 | menu fixo no desktop, gaveta no mobile, `aria-current`, Estoque/Relatórios só `dono` | `src/app/(dashboard)/menu-lateral.tsx:55` (`ITENS.filter(i => !i.soDono \|\| role === "dono")`), `:61` (`aria-current`), `:41,87-88` (gaveta `useState`, `aria-expanded`), `:97` (`role="dialog"`). Nenhum teste unit/e2e cobre o menu; `e2e/estoque.spec.ts:35` deixa o cenário do recepcionista como nota/TODO | PASS por código; lacuna de teste (L1) |
| DES-03 | e-mail, papel e botão Sair (`signOut` -> `/login`) | `menu-lateral.tsx:145-154` (e-mail, "Dono"/"Recepcionista", `aria-label="Sair da conta"`); `src/features/auth/__tests__/signout.test.ts:13-16` (`authSignOut` chamado uma vez, `redirect("/login")`) | PASS (ação testada; UI do bloco sem teste) |
| DES-04 | `/` -> `/agenda`; login e proxy levam a `/agenda` | `src/app/page.tsx` (`redirect("/agenda")`); `src/proxy.ts:62-63` (não-dono -> `/agenda`); `e2e/proxy.spec.ts:34-36` (recepcionista em rota de dono, `toHaveURL(/\/agenda$/)`) e `:4` (`"/"` na lista de rotas). `e2e/home.spec.ts` só afirma `toHaveTitle(/.+/)` | PASS (destino do login pós-autenticação sem teste, L2) |
| DES-05 | login no estilo do MVP (card "Área segura", laranja) | `src/app/(auth)/login/page.tsx:56` ("Área segura", `text-orange-700`). `e2e/login.spec.ts` não afirma o card (conta seedada só em nota, `:15`) | PASS por código; sem teste (L3) |
| DES-06 | título com eyebrow, busca com ícone, `rounded-2xl border-2`, métricas, paginação | `src/shared/tela/titulo-pagina.tsx:22` (`cartao = "rounded-2xl border-2 ..."`); `TituloPagina` em 9 telas (agenda, agenda/lista, estoque, horario, pets, relatorios, servicos, vacinas, vendas); `Paginacao` em 6 listas (agenda/lista, estoque, pets, relatorios, vacinas, vendas); métricas em estoque, relatórios, vendas; `src/shared/tela/__tests__/paginar.test.ts:9-10,14,18-21,24` (10 por página, faixa 11-20 de 23, última página, página inválida, lista vazia). e2e `estoque/pets/vacinas.spec.ts` buscam o registro criado por causa da paginação (`estoque.spec.ts:23`) | PASS (lógica de paginação testada; layout só por código, L4) |

**Status**: 6/6 implementados com evidência de código; 2 com teste forte (DES-03 ação, DES-06 `paginar`), 4 sem teste de UI (DES-01/02/04 parcial/05).

---

## Gates

| Comando | Resultado |
| ------- | --------- |
| `npm run lint` | limpo, 0 avisos |
| `npm run test:unit` (`TZ=UTC`) | 41 arquivos, **193 testes** passaram, 0 falhas |
| `npm run build` | sucesso; rotas dinâmicas listadas, `ƒ Proxy (Middleware)` ok |
| `npm run test:e2e` | **36 passed** (58,4 s), 0 falhas, sem intermitência de `agenda-calendario.spec.ts` nesta rodada |

Ambiente: Supabase local ativo (`npx supabase status` ok; serviços opcionais imgproxy/edge_runtime/pooler parados); porta 3000 livre. Durante o e2e o `next/font` não alcançou o Google Fonts e caiu no fallback (aviso, não falha; ver observação O1). `tsc --noEmit` não foi rodado separadamente (o `next build` já faz o type-check).

---

## Regras do projeto nas telas novas

| Regra | Resultado |
| ----- | --------- |
| AD-012 peças de `src/shared/tela/` | OK: `TituloPagina` em todas as 9 telas internas; `Paginacao`/`cartao` nas listas |
| Paginação de 10 | OK: `POR_PAGINA = 10` (`paginacao.tsx:4`), testado em `paginar.test.ts` |
| AD-010 `toLocale*String` de data sem `timeZone` | OK: `toLocaleString`/`toLocaleDateString` de data só em `src/shared/data/fuso.ts:28,32` (com `timeZone`). As 4 outras ocorrências (`servicos/page.tsx:28`, `relatorios/page.tsx:38`, `vendas/page.tsx:13`, `relatorio-pdf.tsx:35`) formatam moeda BRL, não data |
| AD-010 mês corrente | OK: `relatorios/page.tsx:23-26` usa `hojeEmSaoPaulo()` |
| AD-009 preço interno fora do agendamento | OK: nenhuma ocorrência de preço interno em `src/app/(dashboard)/agenda` nem em `src/features/agenda/*.tsx` |
| Acessibilidade básica | OK: `nav aria-label`, `aria-current`, `aria-expanded`, `aria-label` em Abrir/Fechar menu e Sair, paginação com `nav aria-label="Paginação"` e `aria-label` em anterior/próxima, ícones `aria-hidden` |
| Fora de escopo respeitado | OK: sem aba Criar conta, sem +/- de estoque, sem select livre de status (conferido só por ausência nos arquivos do diff lidos; não varri tudo) |

---

## Lacunas e observações

| # | Tipo | Descrição |
| - | ---- | --------- |
| L1 | Teste | DES-02: nenhum teste do menu (itens por papel, `aria-current`, gaveta). Esconder Estoque/Relatórios do recepcionista só é verificado no proxy, não no menu. `estoque.spec.ts:35` mantém isso como TODO (falta conta recepcionista seedada; `auth.setup.ts` já gera `recepcionista.json`, então dá para cobrir) |
| L2 | Teste | DES-04: `home.spec.ts` só checa título; o redirect `/` -> `/agenda` aparece indiretamente em `proxy.spec.ts:4`. Sem teste do destino do login |
| L3 | Teste | DES-05: sem asserção do card "Área segura" |
| L4 | Teste | DES-06: sem teste do componente `Paginacao` (links, `aria-label`, `?pagina=`) nem e2e de navegação entre páginas; "busca/filtro novo volta à página 1" (`use-list-filters.ts`) sem teste |
| L5 | Teste | `mesAtual()` (T32, correção de bug de fuso) não é exportada nem testada; um revert para UTC passaria na suíte. Sugestão: extrair e testar com relógio fixo às 22h BRT |
| O1 | Observação | `next/font/google` baixa Inter em build/dev; sem rede cai no fallback e o build/e2e passam mesmo assim. Em CI offline a fonte some em silêncio. Avaliar `next/font/local` |
| O2 | Observação | Discrimination sensor não rodado nesta verificação (pedido cobria ACs, regras e gates). Mutantes sugeridos: `soDono` invertido no menu, `POR_PAGINA` 10 -> 20 (o teste de `paginar` mata), `hojeEmSaoPaulo` -> `new Date()` em `mesAtual` (provável sobrevivente, L5) |
| O3 | Observação | `design-mvp/tasks.md` marca o Lote 2 como concluído; coerente com o código. O Painel inicial segue aberto por decisão |

Nenhuma falha de implementação encontrada; nenhum código de produção ou teste foi alterado.

---

## Lacunas cobertas (T35, 2026-11-15)

L1–L5 receberam testes (ver `tasks.md`, T35). A volta à página 1 pela **busca** já tinha teste em `use-list-filters.test.ts`. Faltava a volta pelo **filtro**, que foi adicionada. O1 (fonte via rede) segue em aberto.
