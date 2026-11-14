# Design do MVP Tasks

**Spec**: `.specs/features/design-mvp/spec.md`
**Status**: Lote 1 concluído; Lote 2 em andamento (T27–T29 feitas)

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
- [ ] Vacinas
- [x] T29 Vendas: `Metrica` (total, itens, produtos sobre a lista filtrada inteira), registro de produto em cartão, lista paginada
- [ ] Estoque
- [ ] Relatórios
- [ ] Serviços e Horário
- [ ] Painel inicial (opcional)
