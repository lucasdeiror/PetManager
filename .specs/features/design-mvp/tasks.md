# Design do MVP Tasks

**Spec**: `.specs/features/design-mvp/spec.md`
**Status**: Concluído (Lotes 1 e 2 + Painel inicial entregue em `.specs/features/painel-inicial/`)

## Gate Check Commands

| Gate | Command |
| ---- | ------- |
| Full | `npm run lint && npx tsc --noEmit && npm run test:unit && npm run build && PORT=3010 npm run test:e2e` |

## Lote 1 — base e login (T26)

- [x] T26.1 Tokens, Inter e troca ciano → laranja (DES-01)
- [x] T26.2 Layout `(dashboard)` + `MenuLateral` (DES-02, DES-03); `signOut` com teste unitário
- [x] T26.3 `/` → `/agenda`, login e proxy direto para `/agenda`; `proxy.spec` sem porta fixa; `PORT` no Playwright (DES-04)
- [x] T26.4 Login no estilo do MVP (DES-05)

Evidência: lint/tsc limpos · unit 187 · build ok · e2e 36/36 na porta 3010.

## Lote 2+ — telas internas (DES-06)

- [x] T27 Agenda e lista: `TituloPagina`, `cartao`, `Paginacao`/`paginar` (10 por página, `?pagina=`) em `src/shared/tela/`; busca com ícone; busca/filtro novo volta à página 1
- [x] T28 Tutores e pets: duas listas paginadas (`pagina_tutores`, `pagina_pets`), pet mostra tutor e porte
- [x] T30 Vacinas: registro em cartão, ficha do pet destacada com "Fechar ficha", selo Em dia/Atrasada, lista paginada
- [x] T29 Vendas: `Metrica` (total, itens, produtos sobre a lista filtrada inteira), registro de produto em cartão, lista paginada
- [x] T31 Estoque: métricas (produtos, estoque baixo, unidades), cadastro em cartão, entrada na linha do produto, lista paginada
- [x] T32 Relatórios: métricas do mês, navegação em cartão, PDF no cabeçalho, vendas paginadas; mês corrente em Brasília (corrige bug de UTC); `test:unit` com `TZ=UTC`
- [x] T33 Serviços e Horário: título, cadastro em cartão ao lado da lista (sem paginação: catálogo curto), dias do horário em cartões brancos
- [x] Painel inicial (entregue em `.specs/features/painel-inicial/`, T42–T44)

## Lacunas de teste da validação (T35)

- [x] T35 Testes para L1–L5 do `validation.md`: `MenuLateral` (papel, `aria-current`, gaveta com Esc) e e2e da recepcionista sem Estoque/Relatórios (DES-02); `/` e login válido levam a `/agenda` (DES-04); card "Área segura" (DES-05); componente `Paginacao` e filtro novo volta à página 1 (DES-06); `mesAtual` vira `mesEmSaoPaulo` em `src/shared/data/hoje.ts`, testado às 22h BRT (L5). Vitest passa a incluir `src/app/**/__tests__`.

Evidência: lint/tsc limpos · unit 204 · build ok · e2e 38/38. Mutantes mortos: `soDono` ignorado no menu, `mesEmSaoPaulo` em UTC.

---

### T37: Inter via `next/font/local` (O1)

**What**: `layout.tsx` troca `next/font/google` por `next/font/local` com `src/app/fonts/inter-latin.woff2` (Inter variável 100–900, subset latin, do `@fontsource-variable/inter@5.3.0`, licença OFL junto). Build e e2e deixam de depender de rede.
**Where**: `src/app/layout.tsx`, `src/app/fonts/`

**Done when**:
- [x] Build sem aviso de fonte; lint · unit 204 · e2e 38/38

**Commit**: `chore(design): inter local sem depender do google fonts (T37)`

**Status**: Done
