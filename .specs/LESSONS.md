# LESSONS - auto-maintained by scripts/lessons.py

> Machine-owned. Do NOT hand-edit. Changes are overwritten on the next `lessons.py` write.
> Canonical state lives in `.specs/lessons.json`. Edit lessons only via the script.
> promote_threshold=2 distinct features · window_days=45 · quarantine_threshold=2

## Confirmed (load these at Specify/Design)

Corroborated across multiple features. Safe to apply as guidance.

_none_

## Candidates (under observation - do NOT load as guidance yet)

Seen once or not yet corroborated. Tracked, not trusted.

### L-001 - Ao aplicar uma migration direto no Supabase via MCP, sempre commitar o arquivo .sql local e marcar a task no mesmo momento - nunca deixar o banco na frente do repositorio/specs.
- signal: `spec_deviation` · recurrence: 1 feature(s) · harmful: 0
- features: petmanager-mvp
- evidence: supabase/migrations (T5 gap, 2026-09-18)
- last seen: 2026-09-18T01:03:47Z

### L-002 - Ao planejar migrations em fases separadas, checar se uma task anterior ja depende de colunas so previstas pra uma migration futura - sequenciar a migration antes da task que precisa dela, nao junto com outra feature maior.
- signal: `spec_deviation` · recurrence: 1 feature(s) · harmful: 0
- features: petmanager-completo
- evidence: design.md data model (produtos.categoria/estoque_minimo, T18 vs T20)
- last seen: 2026-09-19T19:42:41Z

### L-003 - Supabase concede EXECUTE a anon por padrao em funcoes novas do schema public - revoke...from public nao basta pra security definer, precisa revoke...from anon explicito. Sempre checar get_advisors depois de criar uma funcao security definer.
- signal: `spec_deviation` · recurrence: 1 feature(s) · harmful: 0
- features: petmanager-completo
- evidence: supabase advisors (concluir_agendamento, T28)
- last seen: 2026-09-20T22:40:45Z

### L-004 - Teste de helper compartilhado nao prova a fiacao: afirme tambem, no ponto de uso, o resultado dependente do helper (ex.: status calculado com relogio fixo).
- signal: `surviving_mutant` · recurrence: 1 feature(s) · scope: `tests` · harmful: 0
- features: hardening
- evidence: M9 src/features/vacinas/queries.ts:73 (DAT-01) (tests)
- last seen: 2026-11-13T03:23:22Z

### L-005 - AC dependente de papel/sessao autenticada nao fica coberto por comentario de nota: escreva o teste com sessao real ou marque o AC como nao coberto.
- signal: `ac_gap` · recurrence: 1 feature(s) · scope: `e2e` · harmful: 0
- features: hardening
- evidence: ROT-02 e2e/proxy.spec.ts:30 (comentario sem teste) (e2e)
- last seen: 2026-11-13T03:23:22Z

### L-006 - toEqual ignora chaves undefined: use toStrictEqual ao afirmar o formato exato de um resultado { data } ou { error }.
- signal: `surviving_mutant` · recurrence: 1 feature(s) · scope: `tests` · harmful: 0
- features: hardening
- evidence: M6 src/shared/validacao/validar.ts:11 (validar.test.ts:19) (tests)
- last seen: 2026-11-13T03:23:22Z

## Quarantined (failed when applied - ignore)

A confirmed lesson that recurred alongside failure. Kept for the maintainer to review.

_none_
