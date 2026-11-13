# hardening Validation

**Date**: 2026-11-13
**Spec**: `.specs/features/hardening/spec.md`
**Diff range**: `c1d812e..HEAD` (HEAD = 1489200, main local)
**Verifier**: independent sub-agent (author != verifier)
**Verdict**: PASS (iteração 2: 4/4 lacunas fechadas, 5/5 mutações mortas; a iteração 1 reprovou)

---

## Task Completion

tasks.md: 61 checkboxes `[x]`, 0 abertos. Sem tarefa parcial.

---

## Spec-Anchored Acceptance Criteria

Resultado: 29 de 31 ACs com evidência `arquivo:linha` que bate com o valor da spec; 2 SEM evidência automatizada (TST-03, ROT-02); 3 lacunas de precisão (DAT-01 fiação, CAD-03, ENT-03 parcial) listadas ao final.

| AC | Resultado definido na spec | `arquivo:linha` + assertion | Result |
|----|----------------------------|------------------------------|--------|
| TST-01 | migrations aplicadas em banco limpo | `src/shared/supabase/__tests__/harness.db.test.ts:11-14` `expect(error).toBeNull()` em `vendas`; `db-setup.ts:20` roda `supabase db reset` | PASS |
| TST-02 | dono e recepcionista reais | `harness.db.test.ts:20` `toEqual([{role:"dono"},{role:"recepcionista"}])`; `rls.db.test.ts:18-20` recepcionista lê `[]` | PASS |
| TST-03 | erro `Supabase local não está rodando: rode "npx supabase start"` | só `db-setup.ts:17` (código) e verificação manual em `tasks.md:126`; nenhuma assertion | NÃO coberto (sem teste) |
| TST-04 | `test:unit` sem Docker | `npm run test:unit` 168 passed com os testes de banco excluídos (`vitest.config.ts`, `vitest.db.config.ts:5` `include *.db.test.ts`) | PASS |
| IDP-01 | status `concluido` + 1 venda `valor_total` = soma | `agendamento-rpc.db.test.ts:17-19` `toHaveLength(1)`, `Number(valor_total)).toBe(50)`, `statusDe).toBe("concluido")`; `agendamento-status.db.test.ts:19-20` `toBe(50.5)` | PASS |
| IDP-02 | erro `Agendamento não está agendado`, sem venda | `agendamento-rpc.db.test.ts:27-28` `error?.message).toBe("Agendamento não está agendado")`, `vendasDe).toHaveLength(1)`; `concluir.test.ts:51` | PASS |
| IDP-03 | 2 chamadas concorrentes, 1 venda ativa | `agendamento-rpc.db.test.ts:50-53` 1 sucesso, 1 erro exato, `filter(estornada_em===null)).toHaveLength(1)` | PASS |
| IDP-04 | índice único parcial (23505) | `vendas.db.test.ts:14` `error?.code).toBe("23505")`; `:23` | PASS |
| IDP-05 | `estornada_em`/`estornada_por` preenchidos, linha mantida, status `agendado` | `agendamento-status.db.test.ts:42-46` `toHaveLength(1)`, `estornada_em not.toBeNull()`, `estornada_por not.toBeNull()`; `agendamento-rpc.db.test.ts:64-67` | PASS (estornada_por só afirmado como não nulo, não o id do usuário) |
| IDP-06 | erro `Agendamento não está concluído`, vendas intactas | `agendamento-rpc.db.test.ts:73-75` `toBe("Agendamento não está concluído")`, `vendasDe).toHaveLength(0)`, status `agendado` | PASS |
| IDP-07 | listagem e relatório ignoram estornadas | `estorno.db.test.ts:28-29` `toContain(111)`, `not.toContain(777)`; `:35-37`; unit `vendas/__tests__/queries.test.ts:118` `is` chamado com `("estornada_em", null)` | PASS |
| IDP-08 | nova venda, estornada mantida | `agendamento-rpc.db.test.ts:86` `toEqual([true,false])`; `agendamento-status.db.test.ts:55-58` `toHaveLength(2)`, `valor_total toBe(40)` | PASS |
| MAQ-01 | 4 transições válidas | `agendamento-status.db.test.ts:14-59` (agendado→concluido, agendado→cancelado `:26`, cancelado→agendado `:34`, concluido→agendado `:41`) | PASS |
| MAQ-02 | `Reabra o agendamento antes de cancelar`, status e venda mantidos | DB `agendamento-status.db.test.ts:68-72`; action `editar-cancelar.test.ts:93` `toBe("Reabra o agendamento antes de cancelar")` (erro do banco mockado) | PASS |
| MAQ-03 | `Só é possível editar agendamentos agendados`, nada alterado | `editar-cancelar.test.ts:66-69` `toBe(...)`, `update/del/insertServicos not.toHaveBeenCalled()` | PASS |
| MAQ-04 | banco rejeita transição inválida | `agendamento-status.db.test.ts:79-81` `toBe("Transição de status inválida: cancelado → concluido")`, status e vendas mantidos | PASS |
| ENT-01 | todas as actions validam antes do `createClient` | `*/__tests__/validacao.test.ts` (agenda:40-42, pets:34-36, estoque:30-32, servicos:25-27, vacinas:34-35, vendas:20-22, relatorios:26-29, horario:28-30, auth `signin.test.ts:56-58`) `createClient not.toHaveBeenCalled()` | PASS |
| ENT-02 | `{ error }` começando com `Dados inválidos.` | mesmos testes `toMatch(/^Dados inválidos\. /)`; `vacinas/validacao.test.ts:21` `toEqual({error:"Dados inválidos. Data inválida"})`; `validar.test.ts:19` | PASS |
| ENT-03 | limites: nome 255, telefone, qtd inteira > 0, preço >= 0, porte | `estoque/validacao.test.ts:20,22,36-38`; `servicos/validacao.test.ts:30-36` (preço 0 aceito); `pets/validacao.test.ts:39-47`. Limite `porte` não localizado como caso explícito | PASS parcial (spec-precision gap: `porte`) |
| ENT-04 | trim antes do tamanho | `pets/validacao.test.ts:54-55` `toEqual({id:1})`, `insert toHaveBeenCalledWith({nome:"a".repeat(255), ...})`; `validar.test.ts:12,16` | PASS |
| SEG-01 | recepcionista: `Ação permitida só ao dono.` sem gravar | `auth/queries.test.ts:78`; `estoque/validacao.test.ts:50`; `relatorios/validacao.test.ts:37-39`; `servicos/validacao.test.ts:42`; `vendas/validacao.test.ts:36`; `horario/validacao.test.ts:36` (`createClient not.toHaveBeenCalled()`) | PASS |
| SEG-02 | `Sessão expirada. Entre novamente.` | `auth/queries.test.ts:69-70`; `agenda/validacao.test.ts:70`; `pets/validacao.test.ts:67`; `vacinas/validacao.test.ts:41` | PASS |
| ROT-01 | sem sessão, qualquer rota != /login vai a /login | `e2e/proxy.spec.ts:10` `toHaveURL(/\/login$/)` para `/agenda`, `/pets`, `/` (e `:25` rotas restritas) | PASS |
| ROT-02 | recepcionista: `/estoque` e `/relatorios` vão para `/` | nenhum teste com sessão de recepcionista; `e2e/proxy.spec.ts:30-34` é só um comentário (NOTA) | NÃO coberto (sem teste; comportamento herdado, `src/proxy.ts:53-58`) |
| ROT-03 | `proxy.ts` existe, `middleware.ts` não | `src/proxy.ts` presente, `src/middleware.ts` ausente (`ls` falha); sensor M8 mostra o e2e usando o proxy | PASS (estrutural) |
| CAD-01 | `enable_signup = false` | `supabase/config.toml:178` | PASS (config; sem teste estático dedicado) |
| CAD-02 | `signUp` recusado | `rls.db.test.ts:28-29` `error not.toBeNull()`, `data.user toBeNull()` | PASS (mensagem de erro não afirmada) |
| CAD-03 | README com os passos de deploy | `README.md:367-368` ("sign up", convite) | PASS (verificação por leitura, sem teste; spec-precision gap menor) |
| DAT-01 | 22:30-03:00 vira `2026-11-12` na agenda e em vacinas | `hoje.test.ts:6` `toBe("2026-11-12")` com `2026-11-13T01:30:00Z`; fiação em `vacinas/queries.ts:73` e `agenda/page.tsx:15` NÃO testada (mutante M9 sobreviveu) | helper PASS; fiação GAP |
| DAT-02 | fuso `America/Sao_Paulo` em um único ponto | `hoje.test.ts:10`; `src/shared/data/hoje.ts:3`; sem outra ocorrência de `toISOString().slice` em `src/` (grep vazio) | PASS |
| SEG-03 | 3 headers em `/login` | `e2e/headers.spec.ts:7-9` `toBe("DENY")`, `toBe("nosniff")`, `toBe("strict-origin-when-cross-origin")` | PASS |

**Status**: contagem estrita (evidência-ou-zero): 29/31 ACs cobertos; TST-03 e ROT-02 sem evidência automatizada.

### Spec-precision gaps

1. DAT-01: o teste afirma o helper, mas nenhum teste afirma que `vacinas/queries.ts` e `agenda/page.tsx` o usam (ver M9).
2. ENT-03: limite `porte` ∈ {pequeno, medio, grande} sem caso de borda explícito nos validacao.test.
3. CAD-03: README conferido por leitura, sem teste.
4. IDP-05: `estornada_por` afirmado apenas como não nulo, não como o id de quem reabriu.

---

## Discrimination Sensor

Profundidade: P0 completa (dinheiro/auth), 13 mutações manuais, cada uma em scratch. Scratch: `git worktree add .../scratchpad/verif-wt HEAD` com `node_modules` copiado (symlink quebra o Turbopack). O `npm run test:db` do worktree roda `npx supabase db reset` a partir do cwd, então aplica as migrations do worktree no mesmo stack Docker; no fim, `supabase db reset` na árvore real restaurou as migrations reais.

| # | Arquivo | Mutação | Testes | Killed? |
|---|---------|---------|--------|---------|
| M1 | `supabase/migrations/0011_rpcs_agendamento_invoker.sql` | removida a guarda `v_status <> 'agendado'` | test:db: 2 falhas em `agendamento-rpc.db.test.ts` | Killed |
| M2 | `0010_agendamento_status_trigger.sql` | `concluido → cancelado` passa (raise vira `null`) | test:db: 1 falha em `agendamento-status.db.test.ts` | Killed |
| M3 | `0010_agendamento_status_trigger.sql` | não preenche `estornada_por` | test:db: 1 falha (`agendamento-status.db.test.ts:46`) | Killed |
| M4 | `src/features/vendas/queries.ts:77` | removido `.is("estornada_em", null)` | unit: 1 falha (`queries.test.ts:118`) | Killed |
| M4b | idem | idem | test:db: 2 falhas em `estorno.db.test.ts` | Killed |
| M5 | `src/features/relatorios/actions.ts` | removido `exigirDono()` | unit: 1 falha (`validacao.test.ts`) | Killed |
| M6 | `src/shared/validacao/validar.ts:11` | devolve `{ data: resultado.data, error }` | unit: 158 passed, 0 falhas | **Survived** |
| M7 | `src/shared/data/hoje.ts:3` | fuso `UTC` | unit: 1 falha (`hoje.test.ts:6`) | Killed |
| M8 | `src/proxy.ts` | sem sessão passa (`return response`) | e2e sem-sessao: 6 falhas em `proxy.spec.ts` | Killed |
| M9 | `src/features/vacinas/queries.ts:73` | `new Date().toISOString().slice(0,10)` no lugar de `hojeEmSaoPaulo()` | unit: 168 passed, 0 falhas | **Survived** |
| M10 | `0009_vendas_estorno.sql` | índice único parcial neutralizado (`where tipo='xx'`) | test:db: 1 falha (`vendas.db.test.ts`) | Killed |
| M11 | `src/features/agenda/actions.ts` | `if (false)` no lugar da guarda `status !== "agendado"` do editar | unit: 2 falhas | Killed |
| M12 | `0010_agendamento_status_trigger.sql` | `valor_total` fixo 0 | test:db: 10 falhas | Killed |

**Sensor depth**: P0-full manual
**Resultado (iteração 1)**: 11/13 killed, 2 sobreviventes (reprovado na época).

Notas sobre os sobreviventes:
- M9 (real): nenhum teste liga o cálculo de "hoje" de `getVacinas`/status de vacina ao helper; reverter para UTC volta o bug do DAT-01 sem quebrar nada (a spec cita agenda do dia e status de vacina).
- M6 (fraco): o mutante é quase equivalente, pois `safeParse` com falha devolve `data` indefinido, e `toEqual` (`validar.test.ts:19`) ignora chaves `undefined`. Mas o teste não distingue `{error}` de `{data: undefined, error}`; `toStrictEqual` mataria. Como as actions testam `"error" in validado`, o impacto real hoje é nulo.

Isolamento: `git status --porcelain` da árvore real antes e depois: apenas `?? .idea/` (mais este `validation.md`). Worktree removido com `git worktree remove --force` e `prune`.

---

## Code Quality

| Principle | Status |
| --------- | ------ |
| Minimum code / surgical changes | OK (superfície 78 arquivos, todos ligados a ACs; `supabase/config.toml` de 426 linhas é saída padrão do `supabase init`) |
| Matches patterns (pastas por domínio, `validar`/`exigir*` compartilhados) | OK |
| Spec-anchored outcome check (valores/mensagens exatos) | OK com os gaps acima |
| Testes mapeiam para AC | OK; `harness`/`rls` mapeiam para TST-01/02 e CAD-02 |
| Per-layer coverage (rotas e2e: happy + edge + erro) | Parcial: ROT-02 sem teste de sessão recepcionista |
| Diretrizes documentadas | LESSONS L-003 (revoke anon): `0010` revoga anon/public/authenticated da função trigger; `0011` revoga anon/public e concede authenticated nas RPCs |

---

## Edge Cases

- [x] id inexistente: `agendamento-rpc.db.test.ts:33` `toBe("Agendamento não encontrado")`
- [x] agendamento sem serviços: `agendamento-rpc.db.test.ts:40` `toEqual([0])`
- [x] sessão expira entre tela e envio: `agenda/validacao.test.ts:70`

---

## Gate Check

- **unit** (`npm run test:unit`): 35 arquivos, 168 passed, 0 failed, 0 skipped (antes da feature: 80, delta +88)
- **db** (`npm run test:db`): 6 arquivos, 24 passed, 0 failed
- **e2e** (`npm run test:e2e`, Chrome local): 32 passed, 0 failed
- Contagem de testes não diminuiu; nenhuma asserção enfraquecida detectada nos arquivos alterados.

---

## Fix Plans

### Fix 1 (Major): fiação do "hoje" em vacinas/agenda sem teste (M9, DAT-01)
- **Where**: `src/features/vacinas/queries.ts:73`, `src/app/(dashboard)/agenda/page.tsx:15`
- **Fix**: teste de `getVacinas`/status com `vi.useFakeTimers` em `2026-11-13T01:30:00Z` afirmando status calculado para 2026-11-12; teste do page ou extração do default de `dia`.
- **Done when**: M9 mata.

### Fix 2 (Major): ROT-02 e TST-03 sem teste
- **Fix**: e2e com sessão de recepcionista (`/estoque` e `/relatorios` terminam em `/`); teste do `globalSetup` com fetch falhando afirmando a mensagem exata.

### Fix 3 (Minor): `validar` e `toEqual`
- **Fix**: `toStrictEqual` em `validar.test.ts:19-24` (ou `expect("data" in r).toBe(false)`); caso explícito para `porte` inválido (ENT-03); afirmar o id em `estornada_por` (IDP-05).

---

## Requirement Traceability Update

| Requirement | Novo status |
| ----------- | ----------- |
| TST-03, ROT-02 | Needs Fix (sem teste) |
| DAT-01 | Needs Fix (fiação não testada) |
| Demais 28 | Verified |

---

## Summary

**Overall (iteração 1, superada pela seção Iteração 2)**: Not Ready por 2 sobreviventes e 2 ACs sem evidência

**Spec-anchored check**: 29/31 ACs cobertos | 4 spec-precision gaps
**Sensor**: 11/13 mutações mortas
**Gate**: unit 168 / db 24 / e2e 32 passed, 0 failed

**What works**: núcleo de dinheiro (IDP-01..08, MAQ-01..04) provado contra Postgres real e discriminante em 8 mutações de SQL/queries; validação Zod, papel no servidor, proxy e headers cobertos.

---

## Iteração 2

**Commit de correção**: `1059424`. **Verifier**: independente, escopo restrito às 4 lacunas da iteração 1.

### Lacunas (evidência `arquivo:linha` + assertion)

| Lacuna | Evidência | Result |
|--------|-----------|--------|
| M9/DAT-01 vacinas | `src/features/vacinas/__tests__/queries.test.ts:116-118`: relógio fake `2026-11-13T01:30:00Z`, `expect(vacina.status).toBe("em-dia")` para retorno `2026-11-12` | Fechada |
| M9/DAT-01 agenda | `src/features/agenda/__tests__/agenda-page-hoje.test.ts:19-21`: sem `?data`, `expect(getAgendamentosPorDia).toHaveBeenCalledWith("2026-11-12")` | Fechada |
| ROT-02 | `e2e/proxy.spec.ts:34-37`: com sessão real de recepcionista (`auth.setup.ts`), `/estoque` e `/relatorios` fazem `toHaveURL(/localhost:3000\/$/)`; `/agenda` segue acessível | Fechada |
| TST-03 | `src/shared/supabase/__tests__/db-setup.test.ts:5,12,17`: `rejects.toThrow('Supabase local não está rodando: rode "npx supabase start"')` para fetch recusado e para status 503 | Fechada |
| M6 | `src/shared/validacao/__tests__/validar.test.ts:12,16,20`: `toStrictEqual` | Fechada |

### Sensor (scratch `verif-wt2`, node_modules copiado)

| # | Mutação | Resultado | Killed? |
|---|---------|-----------|---------|
| M9a | `vacinas/queries.ts:73` UTC no lugar de `hojeEmSaoPaulo()` | 1 falha (`queries.test.ts`, DAT-01) | Killed |
| M9b | `agenda/page.tsx:15` idem | 1 falha (`agenda-page-hoje.test.ts`) | Killed |
| M6 | `validar.ts` devolve `{ data: undefined, error }` | 1 falha (`validar.test.ts`, ENT-02) | Killed |
| M14 | `proxy.ts` recepcionista passa (`if (false)`) | e2e: 2 falhas (`/estoque`, `/relatorios`) | Killed |
| M15 | mensagem alterada em `db-setup.ts` | 2 falhas (`db-setup.test.ts`) | Killed |

**Result**: PASS, 5/5 mortas, 0 sobreviventes. Worktree removido (`--force` + prune); `git status` da árvore real: apenas `.specs/LESSONS.md`, `.specs/lessons.json`, `.idea/` e este `validation.md`.

### Gates (árvore real, Supabase local)

- unit: 37 arquivos, 172 passed, 0 failed
- db: 6 arquivos, 24 passed, 0 failed
- e2e: 36 passed, 0 failed (era 32; +4 do ROT-02 e do setup da recepcionista)

### Observações (não bloqueiam)

- ENT-03: `porte` inválido sem caso de borda explícito.
- CAD-03: README conferido só por leitura.
- IDP-05: `estornada_por` afirmado como não nulo, não como o id de quem reabriu.

**Veredito da iteração 2**: PASS. TST-03, ROT-02 e DAT-01 passam a Verified.
