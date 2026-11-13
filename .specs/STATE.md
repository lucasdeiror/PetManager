# STATE

## Decisions

### AD-001
- **Decision**: Sem camada de API REST separada — Server Actions do Next.js (App Router) fazem toda escrita, Server Components fazem toda leitura direto do Supabase.
- **Reason**: Não há consumidor externo da API no v1; Server Actions eliminam boilerplate de rotas/handlers para um app CRUD interno de uso único.
- **Trade-off**: Se um dia surgir um segundo cliente (app mobile, integração externa), será necessário extrair uma camada de API — decisão reversível, mas com retrabalho.
- **Scope**: Todas as features do PetManager.
- **Date**: 2026-09-16
- **Status**: active

### AD-002
- **Decision**: Estrutura de pastas por domínio (`src/features/<dominio>/{actions,queries,types}.ts`), nunca por camada genérica (`utils/`, `helpers/`, `common/`).
- **Reason**: Cada domínio (agenda, estoque, vacinas...) nasce isolado e testável; evita virar dumping ground sem propósito claro.
- **Trade-off**: Nenhum código verdadeiramente compartilhado entre domínios deve ir em `shared/` só por conveniência — precisa ser genuinamente cross-cutting (ex.: cliente Supabase, componentes de UI).
- **Scope**: Todas as features do PetManager.
- **Date**: 2026-09-16
- **Status**: active

### AD-003
- **Decision**: Toda policy de RLS usa `(select auth.uid())`, nunca `auth.uid()` chamado diretamente na condição.
- **Reason**: `(select auth.uid())` é cacheado pelo planner do Postgres por statement; a forma direta é reavaliada por linha, degradando performance em tabelas grandes.
- **Trade-off**: Nenhum — é estritamente melhor, mas fácil de esquecer sem essa decisão documentada.
- **Scope**: Todas as tabelas com RLS em todas as features do PetManager.
- **Date**: 2026-09-16
- **Status**: active

### AD-004
- **Decision**: Toda task deve avaliar, além das skills já indicadas em `tasks.md`, se alguma das skills abaixo se aplica antes de ser considerada concluída: `application-security-testing`, `better-auth-security-best-practices`, `find-security-vulnerabilities-in-code`, `fix-security-vulnerabilities-with-strix`, `managed-pentesting-with-strix`, `penetration-testing-with-strix`, `supabase-postgres-best-practices`, `brainstorming`, `ci-security-scanning-with-strix`, `documentation-writer`, `mysql`, `frontend-design`, `mastering-typescript`, `react-expert`, `software-architecture`, `prompt-engineering`, `vercel-react-best-practices`.
- **Reason**: O software vai ser vendido a clientes reais (petshops) — segurança e qualidade de código pesam mais que velocidade. Ter o roster centralizado aqui evita esquecer de checar segurança/arquitetura numa task só porque `tasks.md` não previu aquela skill especificamente.
- **Trade-off**: Duas skills do roster não batem com a stack do projeto hoje — `mysql` (o projeto usa Postgres/Supabase) e `better-auth-security-best-practices` (o projeto usa Supabase Auth, não a lib Better Auth). Mantidas na lista a pedido, mas devem ser tratadas como não aplicáveis até o stack mudar — nenhuma task deve seguir orientação de `mysql` ou `better-auth` como se valesse para Postgres/Supabase Auth.
- **Scope**: Todas as tasks do projeto PetManager, do T7 em diante. A partir de 2026-09-19, nenhuma task nova pode listar `Skill: NONE` — todas as 17 tasks que estavam assim em `petmanager-completo/tasks.md` (T1, T2, T6, T9, T11, T12, T15, T16, T18, T22, T25-T27, T29, T30, T35, T40) já foram atualizadas com uma skill do roster acima que faz sentido pro trabalho daquela task.
- **Date**: 2026-09-18
- **Status**: active

### AD-005
- **Decision**: A partir do T8, nada vai direto pra `main`. Cada task (ou grupo pequeno de tasks bem relacionadas) roda numa branch `task/T<N>-<slug>`, sobe um PR, e só é integrada via **squash merge** depois que o gate da task (build/test) passa. A branch é apagada após o merge.
- **Reason**: O software vai ser vendido — `main` devia ser sempre um estado confiável. PR (mesmo sem outro revisor humano, já que é projeto solo) cria um ponto de checagem antes de qualquer coisa entrar em `main`, e o squash mantém o histórico da main com 1 commit por task (fácil de ler/reverter).
- **Trade-off**: Mais overhead por task num projeto solo (branch + PR + merge em vez de commit direto). Tentei habilitar branch protection na `main` via API pra forçar isso do lado do GitHub, mas o token fine-grained atual não tem permissão (`403 Resource not accessible`) — fica registrado que isso ainda não está tecnicamente bloqueado no GitHub, só é uma disciplina seguida manualmente. Lucas pode habilitar "Require pull request before merging" em Settings → Branches quando quiser forçar de verdade.
- **Scope**: Todas as tasks do projeto PetManager, do T8 em diante.
- **Date**: 2026-09-18
- **Status**: active

### AD-006
- **Decision**: `petmanager-completo` (`.specs/features/petmanager-completo/`) substitui `petmanager-mvp` como fonte da verdade a partir de agora. Escopo confirmado com o usuário: **single-tenant** (mantido) + **expandido** com Área de Vendas unificada (produto + serviço), filtros de pesquisa em todas as listas principais, e exportação de relatório em PDF. `petmanager-mvp` permanece no repositório só como histórico — T1-T8 (infra: Next.js, Supabase, migrations `0001`-`0003`, RLS, Vitest, Playwright, cliente Supabase server-side) continuam válidos e são reaproveitados integralmente, referenciados como T1 em `petmanager-completo/tasks.md`.
- **Reason**: Usuário validou um protótipo feito no v0.dev com donos de petshop reais e voltou com pedido explícito de expandir o escopo antes de seguir implementando. Reespecificar agora (antes de mais código) evita retrabalho maior depois.
- **V0 prototype — o que foi analisado**: `app/page.tsx` de ~54 linhas (single-file, tudo client-side), sem backend real — autenticação fake com senha em texto puro no `localStorage`, todos os dados (tutores, pets, serviços, produtos, vendas, agendamentos, vacinas) vivendo só no `localStorage`, sem papéis dono/recepcionista, sem horário de funcionamento, sem ocultar preço interno no agendamento, sem trilha de estoque, relatório fixo no mês corrente (não navegável). **Nenhuma linha de código do protótipo foi reaproveitada** — serviu só de referência de UX (sidebar escura, destaque ciano, cards de métrica no dashboard, tela de Vendas e filtros de busca, que inspiraram diretamente as novas stories VEN/FILT desta spec).
- **Trade-off**: Mudar a fonte de faturamento de "duas somas separadas" (agendamentos concluídos + saídas de estoque) para uma tabela `vendas` única exige uma migration nova (`0004_vendas.sql`, T20) e revisão da lógica de conclusão de agendamento (agora cria/estorna venda automaticamente) — mais uma migration antes de continuar as features de negócio, mas elimina uma classe inteira de bug de faturamento divergente.
- **Scope**: Todo o desenvolvimento do PetManager a partir de T9 (numeração antiga) / T2 (numeração nova em `petmanager-completo`).
- **Date**: 2026-09-18
- **Status**: active

### AD-007
- **Decision**: Integração automática do v0.dev com o GitHub deste repositório foi desconectada pelo usuário. v0 volta a ser usado só como prototipagem isolada — export em `.zip`, enviado manualmente pra análise, nunca sincronizado direto com o repo.
- **Reason**: Em 2026-09-18, o sync automático do v0 (branch `v0/lucasdeiror-7602-4095787c`, PR #8) substituiu a `main` inteira pelo export cru do v0 — apagou `.specs/` completo, `README.md`, os clientes Supabase, todas as Server Actions/queries feitas até então (T1-T5) e as configs de teste (Playwright/ESLint), sem aviso. Revertido via PR #11 (`git revert -m 1` do merge commit), nada foi perdido, mas o incidente mostrou que as duas fontes de escrita na `main` (SDD manual + v0 automático) não são compatíveis.
- **Trade-off**: Perde a conveniência de já ver o protótipo do v0 direto em produção; ganha em não correr o risco de perder trabalho de novo. Um segundo export do v0 (`MVP.zip`, com dashboard de métricas de vendas e navegação mobile) foi recebido manualmente em 2026-09-18 e vai ser usado só como referência de UX quando chegarmos nas tasks de Vendas/Relatórios (T22-T24, T38-T41), sem reaproveitar código.
- **Scope**: Todo o repositório `PetManager`, a partir de 2026-09-18.
- **Date**: 2026-09-18
- **Status**: active

### AD-008
- **Decision**: A partir de agora, tasks (`T<N>`) do `tasks.md` são executadas em sequência sem pedir confirmação antes de cada uma — plano + implementação + gates + PR + merge direto, uma atrás da outra. Continuo parando pra perguntar em decisões que não são rotina de task (achados de reconciliação, mudanças de escopo/arquitetura, incidentes como o do v0 sync).
- **Reason**: Pedido explícito do usuário — quer mais velocidade de execução, já validou o padrão de qualidade nas ~18 tasks anteriores.
- **Trade-off**: Menos pontos de checagem antes de cada task individual; compensado pelos gates automáticos (build/test) e pelo PR de cada task ficar registrado no GitHub pra revisão posterior, mesmo que eu já tenha mergeado.
- **Scope**: Execução de tasks do `petmanager-completo` a partir de T19.
- **Date**: 2026-09-19
- **Status**: active

### AD-009
- **Decision**: `preco_interno` não é segredo para a recepcionista. A RLS de `servicos` continua `select using (true)`; esconder o preço na tela do agendamento é só UX.
- **Reason**: Resposta do usuário na revisão de segurança de 2026-11-12. Evita mexer em RLS e criar view para uma regra que não protege nada de valor.
- **Trade-off**: Quem tem sessão de recepcionista lê o preço interno via API do Supabase; aceito.
- **Scope**: Feature `hardening` em diante.
- **Date**: 2026-11-12
- **Status**: active

## Handoff

- **Feature**: petmanager-completo — **COMPLETA** (41/41 tasks, `validation.md` = PASS com 3 lacunas de verificação documentadas)
- **Phase / Task**: encerrada
- **Completed**: T1-T41
- **In-progress**: none
- **Next step**: fechar as lacunas fora do sandbox: (1) `npx playwright install --with-deps && npm run test:e2e`; (2) seedar contas de teste dono/recepcionista no Supabase Auth e cobrir os cenários com sessão real; (3) teste de RLS por papel com queries reais. Depois: migrar `middleware` -> `proxy` (aviso de depreciação do Next 16), paginação nas listas e revogar os tokens GitHub compartilhados no chat.
- **Blockers**: nenhum bloqueio de código; só as verificações acima, que exigem ambiente com rede liberada
- **Uncommitted files**: none (após o PR de fechamento)
- **Branch**: main
