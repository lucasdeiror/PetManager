# Fuso Horário Validation

**Date**: 2026-11-13
**Spec**: `.specs/features/fuso-horario/spec.md`
**Diff range**: `0c3cfae..HEAD` (branch `task/T25-fuso-sao-paulo`, 4 commits: 9550111, 99b0df4, 70624f2, 2733462)
**Verifier**: independent sub-agent (author != verifier)

**Verdict**: PASS (com 1 lacuna de precisão FUS-02 e 2 observações menores)

---

## Task Completion

| Task | Status | Notes |
| ---- | ------ | ----- |
| T1 helpers | Done | `src/shared/data/fuso.ts` |
| T2 agenda grava/valida | Done | `src/features/agenda/actions.ts` |
| T3 agenda lê/exibe | Done | queries + calendário + lista + ações |
| T4 relatório/vendas/vacinas | Done | `limitesDoMes`, `getVendas`, páginas |

---

## Spec-Anchored Acceptance Criteria

| AC | Spec-defined outcome | `file:line` + assertion | Result |
| -- | -------------------- | ----------------------- | ------ |
| FUS-01 | 17:00 local -> `-03:00` / `20:00Z` | `src/shared/data/__tests__/fuso.test.ts:7-8` - `instanteSP("2026-11-14T17:00:00")` `toBe("...T17:00:00-03:00")` e `toISOString()` `toBe("2026-11-14T20:00:00.000Z")`; gravação em `src/features/agenda/__tests__/actions.test.ts:49` (`data_hora: "2026-09-21T10:00:00-03:00"`) e `editar-cancelar.test.ts:37` (update com `T11:00:00-03:00`) | PASS |
| FUS-02 | dia da semana/hora da string local, iguais em UTC e BRT | `actions.test.ts:62` (09:00 aceito) e `:72` (20:00 rejeitado) exercitam a hora; nenhum teste fixa o dia da semana com data perto da meia-noite | Spec-precision gap (ver lacuna 1) |
| FUS-03 | `Z`, `±HH:MM` ou fora do formato -> `Data e hora inválidas`, sem tocar no banco | `src/features/agenda/__tests__/validacao.test.ts:51-59` - `it.each(["...Z","...-03:00","2026-09-21"])` -> `toEqual({ error: "Dados inválidos. Data e hora inválidas" })` + `expect(createClient).not.toHaveBeenCalled()` (só `criarAgendamento`; `editarAgendamento` usa o mesmo schema, sem teste próprio) | PASS |
| FUS-04 | dia D: `D 00:00` a `D 23:59:59.999` de Brasília | `src/features/agenda/__tests__/queries.test.ts:34-35` - `gte "2026-09-21T00:00:00-03:00"`, `lte "2026-09-21T23:59:59.999-03:00"` | PASS |
| FUS-05 | `20:00Z` -> `17:00`; 23:30 BRT fica no dia local | `fuso.test.ts:12` (`partesSP("2026-11-14T20:00:00+00:00")` -> `{dia:"2026-11-14",hora:"17:00"}`), `:16` (02:30Z -> dia 14, 23:30), `:20` (`dataHoraSP` -> `"14/11/2026, 17:00"`). Componentes/páginas sem teste (matriz: "none") | PASS |
| FUS-06 | `M-01 00:00` incl. a `M+1-01 00:00` excl.; dezembro -> `2027-01-01T00:00:00-03:00` | `src/features/relatorios/__tests__/queries.test.ts:83-95` - `gte("data_hora","2026-11-01T00:00:00-03:00")`/`lt("2026-12-01T00:00:00-03:00")` e `12 -> 2027-01-01T00:00:00-03:00`; vendas: `src/features/vendas/__tests__/queries.test.ts:77-78` | PASS |
| FUS-07 | `2026-12-01T00:30Z` -> `30/11/2026` | `fuso.test.ts:24` - `expect(dataSP("2026-12-01T00:30:00Z")).toBe("30/11/2026")` | PASS |
| FUS-08 | `2026-11-13` -> `13/11/2026` | `fuso.test.ts:28` - `expect(dataSimples("2026-11-13")).toBe("13/11/2026")` | PASS |

**Status**: 7/8 PASS; 1 lacuna de precisão (FUS-02).

---

## Gate (TZ duplo)

- `TZ=UTC npm run test:unit`: 38 arquivos, 184 testes passaram, 0 falhas.
- `TZ=America/Sao_Paulo npm run test:unit`: 38 arquivos, 184 testes passaram, 0 falhas.
- Lint/tsc/build não foram reexecutados nesta verificação (só gate unit pedido).

---

## Discrimination Sensor

Worktree temporário `/tmp/claude-1001/fuso-sensor` (node_modules por symlink), removido ao final; `git status --porcelain` da árvore real = `?? .idea/` (igual ao baseline).

| # | File | Mutação | UTC | America/Sao_Paulo | Resultado |
| - | ---- | ------- | --- | ----------------- | --------- |
| M1 | `src/shared/data/fuso.ts:6` | offset `-03:00` -> `-02:00` | 7 falhas | 7 falhas | Killed |
| M2 | `src/features/agenda/actions.ts` (`extrairDiaEHora`) | volta a `new Date(str).getDay()` / `toTimeString()` | 44 ok | 44 ok | **Survived** |
| M3 | `actions.ts` (`dataHoraSchema`) | remove `.regex(...)` | 3 falhas | 3 falhas | Killed |
| M4 | `src/features/agenda/queries.ts:44` | tira `instanteSP` do `gte` do dia | 1 falha | 1 falha | Killed |
| M4b | `queries.ts:45` | tira `instanteSP` do `lte` do dia | 1 falha | 1 falha | Killed |
| M5 | `src/features/relatorios/queries.ts:30` | `limitesDoMes` sem `instanteSP` | 2 falhas | 2 falhas | Killed |
| M6 | `fuso.ts` (`dataSP`) | remove `timeZone` | 1 falha | 8 ok | Killed só com TZ=UTC |
| M7 | `actions.ts` (update) | `data_hora: dataHora` sem `instanteSP` | 1 falha | 1 falha | Killed |
| M8 | `src/features/vendas/queries.ts:85` | filtro `mes` sem `instanteSP` | 1 falha | 1 falha | Killed |
| M9 | `fuso.ts` (`dataSimples`) | usa `new Date(data).toLocaleDateString` | 8 ok | 1 falha | Killed só com TZ=Sao_Paulo |

**Sensor depth**: lightweight ampliado (10 mutantes). **Result**: PASS — 9/10 mortos no gate duplo; 1 sobrevivente (M2). (nota do orquestrador: M2 é mutante equivalente, já que o schema só aceita horário local sem fuso)

M6 e M9 só morrem em um dos fusos: o gate duplo (UTC + BRT) é necessário, nenhum fuso sozinho basta.

---

## Lacunas (ranqueadas)

1. **FUS-02 sem teste discriminante (M2 sobrevive).** As datas usadas (`2026-09-21T10:00/09:00/20:00`) caem no mesmo dia da semana em qualquer fuso, e `new Date("YYYY-MM-DDTHH:MM")` sem fuso é lido como local do servidor, então o comportamento antigo também era estável entre UTC e BRT para essa entrada. A mutação é, na prática, quase equivalente para strings locais; o código novo é correto e mais robusto, mas nenhum teste o prova. Sugestão: teste com data de borda (ex.: domingo `2026-09-20T23:30:00` com horário de domingo configurado / segunda sem expediente) e, se quiser prova real, mock de `Date`/`TZ`. Prioridade baixa.
2. `editarAgendamento` não tem teste de rejeição para `dataHora` com fuso (FUS-03 só provado via `criarAgendamento`); schema é compartilhado (M3 morre), então risco baixo.
3. Sem teste para `AgendaCalendario`, lista, ações e `vendas/vacinas page` (matriz declara "none"); a spec de sucesso "nenhum `toLocale*String` sem `timeZone` em `src/`" não tem verificação automática (um grep em CI resolveria). Não verificado aqui.

---

## Code Quality

| Principle | Status |
| --------- | ------ |
| Minimum code / sem abstração extra | OK (um módulo de 38 linhas) |
| Surgical changes | OK (só arquivos do escopo) |
| Matches patterns | OK; `shortcut:` comentado em `instanteSP` conforme spec |
| Every test maps to a spec AC | OK |
| Guidelines | none - strong defaults applied |

---

## Requirement Traceability Update

| Requirement | Previous | New |
| ----------- | -------- | --- |
| FUS-01, 03, 04, 05, 06, 07, 08 | Done | Verified |
| FUS-02 | Done | Verified (código); teste com precisão fraca |

---

## Summary

**Overall**: PASS (Ready)
**Spec-anchored check**: 7/8 ACs com assertion exata; 1 spec-precision gap (FUS-02)
**Sensor**: 9/10 mutantes mortos; sobrevivente M2 (equivalente na prática)
**Gate**: 184 passed em TZ=UTC e em TZ=America/Sao_Paulo
