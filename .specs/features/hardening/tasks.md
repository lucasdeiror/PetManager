# Hardening Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, adequacy review, Verifier, discrimination sensor).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

Fluxo git de cada task: AD-005 (branch `task/T<N>-<slug>` → PR → squash merge), em sequência sem pedir confirmação (AD-008). Migrations só no Supabase **local**; aplicar na nuvem exige ok explícito.

Pré-requisito antes da T1: `npm ci` (o checkout está sem `node_modules`).

---

**Design**: `.specs/features/hardening/design.md`
**Status**: Draft

---

## Test Coverage Matrix

> Generated from codebase, project guidelines, and spec - confirm before Execute. Guidelines found: `AGENTS.md` (só aviso do Next 16), `vitest.config.ts`, `playwright.config.ts`, CLAUDE.md global (checklist de segurança). Sem threshold de cobertura configurado → strong defaults.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| ---------- | ------------------ | -------------------- | ---------------- | ----------- |
| Migration / RPC / trigger / RLS | integration (db) | 1:1 com os ACs de IDP, MAQ e CAD; caminho feliz + cada `raise` | `src/**/__tests__/*.db.test.ts` | `npm run test:db` |
| Server Action | unit | Cada AC de ENT/SEG/MAQ-02/MAQ-03; input inválido não chama o Supabase | `src/features/*/__tests__/*.test.ts` | `npm run test:unit` |
| Shared helper (`validar`, `exigir*`) | unit | Todos os ramos | `src/**/__tests__/*.test.ts` | `npm run test:unit` |
| Query (`getVendas`) | unit + integration (db) | Filtro de estorno no mock e no banco real | `src/features/vendas/__tests__/` | `npm run test:unit && npm run test:db` |
| Proxy / headers | e2e | Sem sessão → `/login`; headers presentes | `e2e/*.spec.ts` | `npm run test:e2e` |
| Config / docs | none | build gate only | - | build gate only |

## Gate Check Commands

> Generated from codebase - confirm before Execute.

| Gate Level | When to Use | Command |
| ---------- | ----------- | ------- |
| Quick | Tasks só com teste unitário | `npm run test:unit` |
| Full | Tasks com teste de banco ou e2e | `npm run test:unit && npm run test:db` (+ `npm run test:e2e` nas tasks de proxy/headers) |
| Build | Fim de fase e tasks de config/docs | `npm run lint && npm run build && npm run test:unit && npm run test:db` |

---

## Execution Plan

### Phase 1: Infra de testes de banco

```
T1 → T2 → T3
```

### Phase 2: Vendas e máquina de estados

```
T4 → T5 → T6 → T7 → T8
```

### Phase 3: Helpers de validação e sessão

```
T9 → T10
```

### Phase 4: Zod + sessão nas actions de uso geral

```
T11 → T12 → T13
```

### Phase 5: Zod + papel nas actions de dono

```
T14 → T15 → T16 → T17 → T18 → T19
```

### Phase 6: Rotas, headers e runbook

```
T20 → T21 → T22 → T23
```

---

## Task Breakdown

### T1: Inicializar Supabase local com cadastro fechado

**What**: Adicionar a CLI `supabase` como devDependency, rodar `npx supabase init` e deixar `[auth] enable_signup = false` no `config.toml`.
**Where**: `supabase/config.toml`
**Depends on**: None
**Reuses**: migrations existentes em `supabase/migrations/`
**Requirement**: CAD-01

**Tools**:
- MCP: NONE
- Skill: `supabase`

**Done when**:
- [x] `npx supabase start` sobe o stack e aplica as 8 migrations sem erro
- [x] `config.toml` versionado com `enable_signup = false`
- [x] Gate build passa (sem `test:db` ainda)

**Tests**: none
**Gate**: build

**Commit**: `chore(supabase): inicializa stack local com cadastro publico desligado`

**Status**: Done

---

### T2: globalSetup do test:db

**What**: globalSetup que checa a saúde do Supabase local (mensagem do TST-03), roda `supabase db reset` e cria dono e recepcionista via admin API; mais `vitest.db.config.ts` e o script `test:db`.
**Where**: `src/shared/supabase/__tests__/db-setup.ts`
**Depends on**: T1
**Reuses**: `@supabase/supabase-js`
**Requirement**: TST-01, TST-03, TST-04

**Tools**:
- MCP: NONE
- Skill: `supabase`

**Done when**:
- [x] Com o stack parado, `npm run test:db` falha com `Supabase local não está rodando: rode "npx supabase start"`
- [x] Com o stack rodando, o banco é resetado e os dois usuários existem
- [x] `npm run test:unit` continua sem Docker (o `include` não pega `*.db.test.ts`)
- [x] Test count: suíte unit mantém 80 testes

**Tests**: integration (db)
**Gate**: full

**Commit**: `test(db): adiciona harness de testes contra supabase local`

**Status**: Done

---

### T3: Sessão real por papel + testes de RLS e cadastro

**What**: Helper `clienteComo(papel)`/`clienteAdmin()` e a primeira suíte de banco: recepcionista não lê `produtos`, dono lê, e `auth.signUp` é recusado.
**Where**: `src/shared/supabase/__tests__/db-sessao.ts`
**Depends on**: T2
**Reuses**: `db-setup.ts`
**Requirement**: TST-02, CAD-02

**Tools**:
- MCP: NONE
- Skill: `supabase-postgres-best-practices`

**Done when**:
- [x] `rls.db.test.ts` cobre os três cenários com login real
- [x] Gate full passa

**Tests**: integration (db)
**Gate**: full

**Commit**: `test(db): sessoes reais de dono e recepcionista`

**Status**: Done

---

### T4: Migration de estorno em vendas

**What**: `0009_vendas_estorno.sql` com `estornada_em`, `estornada_por` e a troca da unique por índice parcial `vendas_servico_ativa_unique`.
**Where**: `supabase/migrations/0009_vendas_estorno.sql`
**Depends on**: None
**Reuses**: tabela `vendas` de `0005_vendas.sql`
**Requirement**: IDP-04

**Tools**:
- MCP: NONE
- Skill: `supabase-postgres-best-practices`

**Done when**:
- [x] Teste db: segunda venda `servico` ativa no mesmo agendamento → erro `23505`
- [x] Teste db: com a primeira estornada, a segunda entra
- [x] Gate full passa

**Tests**: integration (db)
**Gate**: full

**Commit**: `feat(vendas): estorno nao destrutivo com unique parcial`

**Status**: Done

---

### T5: Trigger de transição de status

**What**: `0010_agendamento_status_trigger.sql` com `agendamento_status_guard()` (`security definer`, `revoke` de `anon`/`public`) e o trigger BEFORE UPDATE seguindo a tabela do design.
**Where**: `supabase/migrations/0010_agendamento_status_trigger.sql`
**Depends on**: T4
**Reuses**: soma de `preco_interno` de `0006_concluir_agendamento.sql`
**Requirement**: MAQ-01, MAQ-02, MAQ-04, IDP-01, IDP-05, IDP-08

**Tools**:
- MCP: NONE
- Skill: `supabase-postgres-best-practices`

**Done when**:
- [x] Teste db por transição válida (4) e inválida (`concluido → cancelado` com a mensagem do MAQ-02; outra com `Transição de status inválida`)
- [x] Teste db: `update` direto como recepcionista `agendado → concluido` cria exatamente 1 venda com a soma certa
- [x] Teste db: `concluido → agendado` preenche `estornada_em`/`estornada_por` e a linha continua existindo
- [x] Teste db: reconcluir depois do estorno cria nova venda e mantém a antiga
- [x] Gate full passa

**Tests**: integration (db)
**Gate**: full

**Commit**: `feat(agenda): trigger guarda transicoes de status e sincroniza vendas`

**Status**: Done

---

### T6: RPCs de agendamento como security invoker

**What**: `0011_rpcs_agendamento_invoker.sql` reescrevendo `concluir_agendamento` e `reabrir_agendamento_concluido`: `select for update`, guarda de status de origem, `update status`; sem `delete from vendas`.
**Where**: `supabase/migrations/0011_rpcs_agendamento_invoker.sql`
**Depends on**: T5
**Reuses**: assinaturas atuais (as actions não mudam a chamada)
**Requirement**: IDP-02, IDP-03, IDP-06

**Tools**:
- MCP: NONE
- Skill: `supabase-postgres-best-practices`

**Done when**:
- [x] Teste db: concluir não-`agendado` → `Agendamento não está agendado`, nenhuma venda nova
- [x] Teste db: duas chamadas concorrentes (`Promise.all`) → exatamente 1 venda ativa
- [x] Teste db: reabrir não-`concluido` → `Agendamento não está concluído`, vendas intactas
- [x] `grep -n "delete from public.vendas" supabase/migrations/0011*` vazio
- [x] Gate full passa

**Tests**: integration (db)
**Gate**: full

**Commit**: `fix(agenda): rpcs de concluir e reabrir checam status e nao apagam venda`

**Status**: Done

---

### T7: getVendas ignora vendas estornadas

**What**: Filtro `.is("estornada_em", null)` em `getVendas` e `estornada_em` no tipo `Venda`.
**Where**: `src/features/vendas/queries.ts`
**Depends on**: T6
**Reuses**: `getRelatorioMensal` já usa `getVendas`
**Requirement**: IDP-07

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [x] Unit: o filtro é aplicado na query
- [x] Teste db: venda estornada não aparece em `getVendas` nem no total do relatório
- [x] Gate full passa

**Tests**: integration (db)
**Gate**: full

**Commit**: `fix(vendas): listagem e relatorio ignoram vendas estornadas`

**Status**: Done

---

### T8: Actions de agenda respeitam a máquina de estados

**What**: `editarAgendamento` checa `status = 'agendado'` antes de alterar (MAQ-03); `cancelarAgendamento`, `concluirAgendamento` e `reabrirAgendamentoConcluido` mapeiam as novas mensagens do banco.
**Where**: `src/features/agenda/actions.ts`
**Depends on**: T7
**Reuses**: padrão de mapeamento de erro atual
**Requirement**: MAQ-02, MAQ-03, IDP-02, IDP-06

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [x] Unit: editar agendamento `concluido`/`cancelado` → `Só é possível editar agendamentos agendados`, sem `update`
- [x] Unit: cada mensagem nova do banco vira a mensagem do spec
- [x] Gate full passa

**Tests**: unit
**Gate**: full

**Commit**: `fix(agenda): actions respeitam transicoes de status`

**Status**: Done

---

### T9: Helper validar com Zod

**What**: Instalar `zod` e criar `validar(schema, input)` no formato de erro do projeto.
**Where**: `src/shared/validacao/validar.ts`
**Depends on**: None
**Reuses**: nada
**Requirement**: ENT-02, ENT-04

**Tools**:
- MCP: NONE
- Skill: `mastering-typescript`

**Done when**:
- [x] Unit: input válido devolve `data` com texto aparado; inválido devolve `Dados inválidos. <mensagem>`
- [x] Gate quick passa

**Tests**: unit
**Gate**: quick

**Commit**: `feat(validacao): helper zod com mensagem padrao`


**Status**: Done
---

### T10: exigirSessao e exigirDono

**What**: Dois helpers de sessão e papel no servidor.
**Where**: `src/features/auth/queries.ts`
**Depends on**: T9
**Reuses**: `getCurrentUserRole`
**Requirement**: SEG-01, SEG-02

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [x] Unit: sem sessão → `Sessão expirada. Entre novamente.`; recepcionista em `exigirDono` → `Ação permitida só ao dono.`; dono passa
- [x] Gate quick passa

**Tests**: unit
**Gate**: quick

**Commit**: `feat(auth): checagem de sessao e papel no servidor`


**Status**: Done
---

### T11: Zod + sessão em agenda

**What**: Schema e `exigirSessao` nas seis actions de agenda.
**Where**: `src/features/agenda/actions.ts`
**Depends on**: None
**Reuses**: `validar`, `exigirSessao`
**Requirement**: ENT-01, ENT-02, SEG-02

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [x] Unit por action: payload malformado → `Dados inválidos.` e `createClient` não chamado
- [x] Gate quick passa; testes antigos de agenda continuam verdes

**Tests**: unit
**Gate**: quick

**Commit**: `feat(agenda): valida entrada com zod`


**Status**: Done
---

### T12: Zod + sessão em pets

**What**: Schemas de `criarTutor` (telefone via libphonenumber em `.refine`) e `criarPet` (`porte` enum, nome ≤ 255).
**Where**: `src/features/pets/actions.ts`
**Depends on**: T11
**Reuses**: validação de telefone atual
**Requirement**: ENT-01, ENT-02, ENT-03, SEG-02

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [x] Unit: `nome: 123`, `porte: "gigante"`, telefone inválido, nome de 256 chars → `Dados inválidos.` sem Supabase
- [x] Gate quick passa

**Tests**: unit
**Gate**: quick

**Commit**: `feat(pets): valida entrada com zod`


**Status**: Done
---

### T13: Zod + sessão em vacinas

**What**: Schema de `registrarVacina` (datas com `z.iso.date({ abort: true })`, ver `Conhecimento/Zod.md`).
**Where**: `src/features/vacinas/actions.ts`
**Depends on**: T12
**Reuses**: `validar`
**Requirement**: ENT-01, ENT-02, SEG-02

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [x] Unit: data malformada gera um único erro `Dados inválidos.`; sem Supabase
- [x] Gate quick passa

**Tests**: unit
**Gate**: quick

**Commit**: `feat(vacinas): valida entrada com zod`


**Status**: Done
---

### T14: Zod + dono em estoque

**What**: Schemas de `criarProduto` e `registrarEntrada` + `exigirDono`.
**Where**: `src/features/estoque/actions.ts`
**Depends on**: None
**Reuses**: `validar`, `exigirDono`
**Requirement**: ENT-01, ENT-03, SEG-01

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [x] Unit: recepcionista → `Ação permitida só ao dono.`; quantidade 0 ou fracionada → `Dados inválidos.`
- [x] Gate quick passa

**Tests**: unit
**Gate**: quick

**Commit**: `feat(estoque): valida entrada e exige papel dono`


**Status**: Done
---

### T15: Zod + dono em vendas

**What**: Schema de `registrarVendaProduto` + `exigirDono`.
**Where**: `src/features/vendas/actions.ts`
**Depends on**: T14
**Reuses**: `validar`, `exigirDono`
**Requirement**: ENT-01, ENT-03, SEG-01

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [x] Unit: recepcionista bloqueada; quantidade inválida sem chamar RPC
- [x] Gate quick passa

**Tests**: unit
**Gate**: quick

**Commit**: `feat(vendas): valida entrada e exige papel dono`


**Status**: Done
---

### T16: Zod + dono em serviços

**What**: Schema de `criarServico` (preço ≥ 0) + `exigirDono`.
**Where**: `src/features/servicos/actions.ts`
**Depends on**: T15
**Reuses**: `validar`, `exigirDono`
**Requirement**: ENT-01, ENT-03, SEG-01

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [x] Unit: preço negativo/texto → `Dados inválidos.`; recepcionista bloqueada
- [x] Gate quick passa

**Tests**: unit
**Gate**: quick

**Commit**: `feat(servicos): valida entrada e exige papel dono`


**Status**: Done
---

### T17: Zod + dono em horário de funcionamento

**What**: Schema de `salvarHorario` + `exigirDono`.
**Where**: `src/features/horario-funcionamento/actions.ts`
**Depends on**: T16
**Reuses**: `validar`, `exigirDono`
**Requirement**: ENT-01, SEG-01

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [x] Unit: dia/horário malformado → `Dados inválidos.`; recepcionista bloqueada
- [x] Gate quick passa

**Tests**: unit
**Gate**: quick

**Commit**: `feat(horario): valida entrada e exige papel dono`


**Status**: Done
---

### T18: Zod + dono em relatórios

**What**: Schema de `gerarRelatorioPdf` (ano/mês inteiros, mês 1–12) + `exigirDono`.
**Where**: `src/features/relatorios/actions.ts`
**Depends on**: T17
**Reuses**: `validar`, `exigirDono`
**Requirement**: ENT-01, SEG-01

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [x] Unit: recepcionista não recebe PDF; mês 13 → `Dados inválidos.`
- [x] Gate quick passa

**Tests**: unit
**Gate**: quick

**Commit**: `fix(relatorios): so o dono gera o pdf de faturamento`


**Status**: Done
---

### T19: Zod no login

**What**: Schema de `signIn` (e-mail válido, senha não vazia), sem exigir sessão.
**Where**: `src/features/auth/actions.ts`
**Depends on**: T18
**Reuses**: `validar`
**Requirement**: ENT-01, ENT-02

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [x] Unit: e-mail não-string → `Dados inválidos.` sem chamar o Auth; mensagem de credencial inválida inalterada
- [x] `grep` de action exportada sem `validar(` em `src/features/*/actions.ts` retorna vazio
- [x] Gate build passa (fim da Phase 5)

**Tests**: unit
**Gate**: build

**Commit**: `feat(auth): valida entrada do login com zod`


**Status**: Done
---

### T20: proxy.ts protegendo todo o dashboard

**What**: Criar `src/proxy.ts` (ler antes o guia de proxy em `node_modules/next/dist/docs/`) com redirect para `/login` sem sessão e a regra de dono atual; apagar `src/middleware.ts`.
**Where**: `src/proxy.ts`
**Depends on**: None
**Reuses**: corpo de `src/middleware.ts`
**Requirement**: ROT-01, ROT-02, ROT-03

**Tools**:
- MCP: NONE
- Skill: `vercel:nextjs`

**Done when**:
- [x] E2E: sem sessão, `/agenda` e `/pets` terminam em `/login`; `/login` abre
- [x] `src/middleware.ts` não existe
- [x] Gate full (com e2e) passa

**Tests**: e2e
**Gate**: full

**Commit**: `feat(auth): proxy exige sessao em todas as rotas do dashboard`

---

### T21: Headers de segurança

**What**: `headers()` no `next.config.ts` com `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`.
**Where**: `next.config.ts`
**Depends on**: T20
**Reuses**: config atual (`reactCompiler`)
**Requirement**: SEG-03

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [x] E2E: resposta de `/login` traz os três headers com os valores do spec
- [x] Gate full (com e2e) passa

**Tests**: e2e
**Gate**: full

**Commit**: `feat(seguranca): headers basicos em todas as respostas`

---

### T22: Runbook de deploy

**What**: Seção de deploy no README com: desligar "Allow new users to sign up" no painel, criar usuários só por convite, como rodar `test:db`.
**Where**: `README.md`
**Depends on**: T21
**Reuses**: README atual
**Requirement**: CAD-03

**Tools**:
- MCP: NONE
- Skill: `humanize-skills`

**Done when**:
- [x] README tem os três passos
- [x] Gate build passa

**Tests**: none
**Gate**: build

**Commit**: `docs: runbook de deploy com cadastro fechado`

---

### T23: "Hoje" no fuso de Brasília

**What**: Função `hojeEmSaoPaulo(agora = new Date())` com `Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" })` (sem dependência nova), usada em `getVacinas` e na página da agenda no lugar de `toISOString().slice(0, 10)`.
**Where**: `src/shared/data/hoje.ts`
**Depends on**: T22
**Reuses**: `Intl` da plataforma
**Requirement**: DAT-01, DAT-02

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [x] Unit: `2026-11-13T01:30:00Z` → `2026-11-12`; `2026-11-12T15:00:00Z` → `2026-11-12`
- [x] `grep -rn "toISOString().slice(0, 10)" src --include=*.ts --include=*.tsx` fora de testes retorna vazio
- [x] Gate build passa

**Tests**: unit
**Gate**: build

**Commit**: `fix(datas): hoje calculado no fuso de sao paulo`

---

## Phase Execution Map

```
Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6

Phase 1:  T1 → T2 → T3
Phase 2:  T4 → T5 → T6 → T7 → T8
Phase 3:  T9 → T10
Phase 4:  T11 → T12 → T13
Phase 5:  T14 → T15 → T16 → T17 → T18 → T19
Phase 6:  T20 → T21 → T22 → T23
```

### T38: Acesso exige perfil ativo (revisão de segurança 2026-11)

**What**: Migration 0013: `current_role_petmanager` só devolve papel de perfil ativo; as policies `using (true)` (tutores, pets, agendamentos, agendamento_servicos, vacinas e os selects de horários, serviços e vendas) passam a exigir papel; trigger `trg_agendamento_status_inicial` barra insert fora de `agendado`; `revoke execute ... from anon` nas funções que faltavam (L-003). `getUsuarioAtual` e `proxy` filtram `ativo = true`. Achados e riscos aceitos em `revisao-seguranca-2026-11.md`.
**Where**: `supabase/migrations/0013_acesso_exige_perfil_ativo.sql`, `src/features/auth/queries.ts`, `src/proxy.ts`
**Requirement**: SEG-07

**Done when**:
- [x] `acesso-sem-perfil.db.test.ts` falha sem a migration (8 falhas) e passa com ela
- [x] lint · tsc · unit 204 · test:db 40 · build · e2e 38/38

**Commit**: `fix(seguranca): acesso ao dominio exige perfil ativo (T38)`

**Status**: Done

### T39: Roteiro de implantação por petshop

**What**: Seção "Deploy (runbook)" do README reescrita em 8 passos (testes locais, projeto em sa-east-1, cadastro fechado e senha 8+, `db push` das migrations 0001–0013, usuários por **Create new user** + SQL de perfil, checagem, Vercel, fumaça). `supabase/checagem-implantacao.sql` lista o que falta (tabela sem RLS, função aberta a `anon`, 0013 ausente, nenhum dono, login sem perfil) ou devolve `ok`. Corrige o T22: **Invite user** não funciona porque o app não tem tela de definir senha.
**Where**: `README.md`, `supabase/checagem-implantacao.sql`
**Requirement**: CAD-03, SEG-07

**Done when**:
- [x] Simulação local após `db reset`: checagem acusa "nenhum dono" → criar login acusa "login sem perfil" → SQL do perfil dá `ok` → login do dono emite token
- [x] Checagem acusa RLS desligada e `grant execute ... to anon` plantados de propósito

**Commit**: `docs(implantacao): roteiro por petshop com checagem sql (T39)`

**Status**: Done

### T40: Login sem perfil ativo avisa em vez de voltar mudo

**What**: `signIn` em `src/features/auth/actions.ts` consulta `profiles` (`ativo = true`) após autenticar; se não houver perfil ativo, chama `auth.signOut()` e retorna `{ error: "Usuário sem acesso ao sistema. Fale com o administrador." }` em vez de redirecionar para `/agenda` e cair de volta em `/login` sem mensagem.
**Where**: `src/features/auth/actions.ts`, `src/features/auth/__tests__/signin.test.ts`
**Requirement**: SEG-07

**Done when**:
- [x] Unit: login válido sem perfil ativo chama `signOut` e retorna a mensagem de bloqueio
- [x] lint · tsc · unit 205 · build · e2e login 4/4

**Commit**: `fix(auth): login sem perfil ativo avisa em vez de voltar mudo (T40)`

**Status**: Done

### T41: Sincronização documental do SDD e README

**What**: Atualizar `.specs/STATE.md` (`AD-010`–`AD-015` e `Handoff`), registrar `T40`/`T41` em `hardening/tasks.md`, atualizar status de `O1` em `design-mvp/validation.md` e alinhar `README.md` com as 13 migrations e o estado real de produção.
**Where**: `.specs/STATE.md`, `.specs/features/hardening/tasks.md`, `.specs/features/design-mvp/validation.md`, `README.md`
**Requirement**: CAD-03

**Done when**:
- [x] `.specs/STATE.md`, `hardening/tasks.md`, `design-mvp/validation.md` e `README.md` refletem T1–T41 e as migrations `0001`–`0013`
- [x] Gate build (`npm run lint && npm run build && npm run test:unit`) passa

**Commit**: `docs(specs): sincroniza state, tasks e readme com producao (T41)`

**Status**: Done
