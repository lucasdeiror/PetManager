# Hardening Specification

## Problem Statement

O `petmanager-completo` passa nos 80 testes unitários, mas eles mockam o Supabase e nenhum roda SQL de verdade. Por isso passaram furos que perdem dinheiro ou expõem dado de cliente: `concluir_agendamento` gera venda duplicada quando chamado duas vezes; `reabrir_agendamento_concluido` (`security definer`) apaga a venda com `DELETE`, sem checar o status nem deixar rastro; a máquina de estados do agendamento não tem guarda (dá para cancelar ou editar um agendamento já concluído); e as Server Actions não validam a entrada em runtime. Isso precisa ser corrigido antes do primeiro cliente piloto.

## Goals

- [ ] Toda regra de dinheiro e de estado provada por teste contra um Postgres real (Supabase local no Docker), não por mock.
- [ ] Zero vendas duplicadas e zero vendas apagadas: estorno é registro, não `DELETE`.
- [ ] 100% das Server Actions validam a entrada com Zod antes de tocar no banco.
- [ ] Nenhuma rota do dashboard abre sem sessão.

## Out of Scope

| Feature | Reason |
| ------- | ------ |
| CORS | Não há rota `/api`; Server Actions já comparam `Origin` com `Host` por padrão no Next.js. |
| Rate limit próprio | O login passa pelo Supabase Auth, que tem limite próprio; as actions exigem sessão. Reavaliar quando houver rota pública (ex.: agendamento online). |
| Idempotency-key genérica | A idempotência que importa (venda por agendamento) é garantida no banco por guarda de status + índice único. |
| Ocultar `preco_interno` da recepcionista no banco | Decisão do dono do produto (AD-009): o preço interno não é segredo; o filtro na tela do agendamento continua só por UX. |
| CSP com nonce | Custo alto para app interno de 2–5 usuários; entram só os headers baratos (SEG-03). |
| Log de auditoria completo | Fora do corte; o estorno guarda quem e quando (IDP-05), o que cobre o caso do dinheiro. |
| Paginação das listas | Desempenho, não segurança; fica para outra feature. |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --------------------- | -------------- | --------- | ---------- |
| Ambiente de teste de banco | Supabase local via CLI (`npx supabase start`) no Docker | Escolha do usuário; custo zero; mesmo Postgres + Auth + RLS da nuvem | y |
| Recepcionista pode ver preço interno | Pode; nenhuma mudança de RLS em `servicos` | Resposta do usuário em 2026-11-12 | y |
| Quem pode reabrir agendamento concluído | Dono e recepcionista (comportamento atual) | Com estorno não destrutivo o risco de "apagar faturamento" some; mudar a regra de negócio não foi pedido | n |
| Forma do estorno | Colunas `estornada_em`/`estornada_por` em `vendas`; venda estornada não conta em listas nem em relatórios | Menor mudança que preserva o histórico; reabrir + concluir de novo gera nova venda | n |
| Cadastro público na nuvem | Desligado manualmente no painel do Supabase (passo de runbook), e `enable_signup = false` no `config.toml` local | É configuração do projeto Supabase, não do código; o teste só consegue cobrir o ambiente local | n |
| Mensagem genérica de entrada inválida | `"Dados inválidos."` mais a mensagem do primeiro campo que falhou | Mantém o padrão atual (`{ error }`) sem vazar detalhe interno | n |

**Open questions:** none - all resolved or logged above.

---

## User Stories

### P1: Testes de banco reais ⭐ MVP

**User Story**: As a desenvolvedor, I want rodar testes contra o Supabase local so that RLS, RPC e constraints sejam provadas e não supostas.

**Why P1**: Sem isso nenhuma correção abaixo tem prova; foi a falta disso que deixou os furos passarem.

**Acceptance Criteria**:

1. WHEN `npm run test:db` é executado com o Supabase local rodando THEN o sistema SHALL aplicar as migrations de `supabase/migrations/` num banco limpo e rodar a suíte de testes de banco.
2. The suíte de banco SHALL criar um usuário `dono` e um `recepcionista` reais no Auth local e executar cada teste com a sessão do papel indicado.
3. IF o Supabase local não estiver rodando THEN `npm run test:db` SHALL falhar com a mensagem `Supabase local não está rodando: rode "npx supabase start"`.
4. The `npm run test:unit` SHALL continuar rodando sem Docker e sem banco.

**Independent Test**: `npx supabase start && npm run test:db` passa; com o stack parado, falha com a mensagem do AC 3.

---

### P1: Venda de serviço idempotente e estorno não destrutivo ⭐ MVP

**User Story**: As a dono, I want que cada agendamento concluído gere exatamente uma venda e que reabrir estorne em vez de apagar so that o faturamento bata com a realidade.

**Why P1**: Hoje dois cliques em "concluir" geram duas vendas, e reabrir apaga o registro financeiro.

**Acceptance Criteria**:

1. WHEN `concluir_agendamento` é chamado para um agendamento com status `agendado` THEN o sistema SHALL mudar o status para `concluido` e criar exatamente uma venda `servico` com `valor_total` igual à soma dos `preco_interno` dos serviços do agendamento.
2. IF `concluir_agendamento` é chamado para um agendamento com status diferente de `agendado` THEN o sistema SHALL lançar o erro `Agendamento não está agendado` e não criar venda.
3. IF duas chamadas concorrentes de `concluir_agendamento` chegam para o mesmo agendamento THEN o sistema SHALL criar exatamente uma venda não estornada.
4. The tabela `vendas` SHALL impedir, por índice único, mais de uma venda `servico` não estornada para o mesmo `agendamento_id`.
5. WHEN `reabrir_agendamento_concluido` é chamado para um agendamento `concluido` THEN o sistema SHALL preencher `estornada_em` e `estornada_por` na venda de serviço ativa, sem apagar a linha, e voltar o status para `agendado`.
6. IF `reabrir_agendamento_concluido` é chamado para um agendamento com status diferente de `concluido` THEN o sistema SHALL lançar o erro `Agendamento não está concluído` e não alterar nenhuma venda.
7. The listagem de vendas e o relatório mensal SHALL ignorar vendas com `estornada_em` preenchido.
8. WHEN um agendamento estornado é concluído de novo THEN o sistema SHALL criar uma nova venda e manter a venda estornada no histórico.

**Independent Test**: no `test:db`, concluir duas vezes → uma venda; reabrir → a venda continua no banco, estornada, e some do relatório; concluir de novo → duas linhas, uma ativa.

---

### P1: Máquina de estados do agendamento ⭐ MVP

**User Story**: As a dono, I want que o agendamento só mude de estado por transições válidas so that não exista agendamento cancelado com faturamento nem serviço alterado depois de cobrado.

**Why P1**: Hoje `cancelarAgendamento` e `editarAgendamento` não checam o status.

**Acceptance Criteria**:

1. The sistema SHALL permitir só estas transições de status: `agendado → concluido`, `agendado → cancelado`, `cancelado → agendado`, `concluido → agendado` (via reabrir com estorno).
2. IF alguém tenta cancelar um agendamento `concluido` THEN o sistema SHALL recusar com `Reabra o agendamento antes de cancelar` e manter status e venda inalterados.
3. IF alguém tenta editar um agendamento que não está `agendado` THEN o sistema SHALL recusar com `Só é possível editar agendamentos agendados` e não alterar o agendamento nem seus serviços.
4. IF um `update` direto no banco (fora das actions) tenta uma transição fora da lista do AC 1 THEN o banco SHALL rejeitar a operação.

**Independent Test**: no `test:db`, com sessão de recepcionista, `update agendamentos set status='cancelado'` num concluído falha; pela action volta a mensagem do AC 2.

---

### P1: Entrada validada nas Server Actions ⭐ MVP

**User Story**: As a dono, I want que toda action rejeite entrada malformada antes do banco so that um POST forjado não grave lixo nem vaze erro interno.

**Why P1**: Server Action é endpoint POST público; tipo TypeScript não existe em runtime.

**Acceptance Criteria**:

1. The cada Server Action exportada em `src/features/*/actions.ts` SHALL validar seus argumentos com um schema Zod antes de criar o cliente Supabase.
2. IF o argumento falha no schema THEN a action SHALL retornar `{ error }` começando com `Dados inválidos.` e SHALL NOT chamar o Supabase.
3. The schemas SHALL manter os limites de negócio que já existem (nome até 255 caracteres, telefone válido via libphonenumber, quantidade inteira maior que zero, preço ≥ 0, `porte` ∈ {pequeno, medio, grande}).
4. IF um campo de texto chega com espaços nas pontas THEN o schema SHALL removê-los antes de validar o tamanho.

**Independent Test**: teste unitário por action chamando com `nome: 123` (e equivalentes) → `Dados inválidos.` e mock do Supabase não chamado.

---

### P2: Papel checado no servidor

**User Story**: As a dono, I want que as ações restritas a mim recusem a recepcionista no servidor so that esconder um botão não seja a única barreira.

**Why P2**: A RLS já bloqueia a maioria; o furo real é `gerarRelatorioPdf`, que lê `vendas` (visível a todos) e por isso devolve o PDF de faturamento para a recepcionista.

**Acceptance Criteria**:

1. IF uma recepcionista chama `gerarRelatorioPdf`, `criarProduto`, `registrarEntrada`, `registrarVendaProduto`, `criarServico` ou `salvarHorario` THEN a action SHALL retornar `{ error: "Ação permitida só ao dono." }` sem gravar nem gerar nada.
2. IF não há sessão THEN toda Server Action SHALL retornar `{ error: "Sessão expirada. Entre novamente." }`.

**Independent Test**: unitário com `getCurrentUserRole` mockado como `recepcionista` → mensagem do AC 1.

---

### P2: Rotas protegidas por sessão

**User Story**: As a dono, I want que nenhuma página do dashboard abra sem login so that a tela não apareça vazia nem dê pista da estrutura do sistema.

**Why P2**: Hoje `src/middleware.ts` só cobre `/estoque` e `/relatorios`; a RLS segura os dados, mas a página abre.

**Acceptance Criteria**:

1. WHEN um visitante sem sessão acessa qualquer rota fora de `/login` THEN o sistema SHALL redirecionar para `/login`.
2. WHILE o usuário tiver papel `recepcionista`, o sistema SHALL redirecionar `/estoque` e `/relatorios` para `/` (comportamento atual mantido).
3. The proteção de rotas SHALL viver em `src/proxy.ts` (convenção do Next.js 16), e `src/middleware.ts` SHALL deixar de existir.

**Independent Test**: E2E sem sessão abrindo `/agenda` termina em `/login`.

---

### P2: Cadastro público fechado

**User Story**: As a dono, I want que ninguém de fora crie conta so that dados de tutores (nome, telefone) não fiquem expostos a qualquer pessoa da internet.

**Why P2**: Novo usuário nasce `recepcionista` (`0001_profiles.sql:3`) e as policies de tutores/pets/agendamentos liberam leitura a qualquer autenticado.

**Acceptance Criteria**:

1. The `supabase/config.toml` SHALL ter `enable_signup = false`.
2. IF alguém chama `signUp` contra o Supabase local THEN o Auth SHALL recusar o cadastro.
3. The `README.md` SHALL ter, na seção de deploy, o passo "desligar Allow new users to sign up no painel do Supabase" e o de criar usuários só por convite.

**Independent Test**: `test:db` chama `auth.signUp` e recebe erro.

---

### P2: Data de hoje no fuso de Brasília

**User Story**: As a recepcionista, I want que "hoje" seja o dia de Aracaju so that a agenda do dia e o status das vacinas não pulem para amanhã depois das 21h.

**Why P2**: `new Date().toISOString().slice(0, 10)` é a data em UTC (`src/features/vacinas/queries.ts:72`, `src/app/(dashboard)/agenda/page.tsx:9`).

**Acceptance Criteria**:

1. WHEN o relógio marca 2026-11-12T22:30-03:00 THEN o sistema SHALL tratar "hoje" como `2026-11-12` na agenda do dia e no cálculo de status de vacina.
2. The cálculo de "hoje" SHALL usar o fuso `America/Sao_Paulo` em um único ponto do código.

**Independent Test**: unitário com relógio fixo em 2026-11-13T01:30Z devolve `2026-11-12`.

---

### P3: Headers de segurança

**User Story**: As a dono, I want headers básicos de segurança so that o app não possa ser embutido em iframe de terceiros nem tenha MIME sniffing.

**Why P3**: Defesa extra barata; não fecha nenhum furo conhecido.

**Acceptance Criteria**:

1. The toda resposta HTML SHALL incluir `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff` e `Referrer-Policy: strict-origin-when-cross-origin`.

**Independent Test**: E2E lê os headers da resposta de `/login`.

---

## Edge Cases

- IF `concluir_agendamento` recebe um id inexistente THEN o sistema SHALL lançar `Agendamento não encontrado` (mantido).
- IF o agendamento não tem serviços THEN `concluir_agendamento` SHALL criar a venda com `valor_total = 0` (mantido; o AC 1 de IDP define a soma).
- IF a sessão expira entre abrir a tela e enviar o formulário THEN a action SHALL responder com a mensagem de SEG-02.

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| -------------- | ----- | ----- | ------ |
| TST-01 | P1: Testes de banco reais | Design | Done |
| TST-02 | P1: Testes de banco reais | Design | Done |
| TST-03 | P1: Testes de banco reais | Design | Done |
| TST-04 | P1: Testes de banco reais | Design | Done |
| IDP-01 | P1: Venda idempotente / estorno | Design | Done |
| IDP-02 | P1: Venda idempotente / estorno | Design | Done |
| IDP-03 | P1: Venda idempotente / estorno | Design | Done |
| IDP-04 | P1: Venda idempotente / estorno | Design | Done |
| IDP-05 | P1: Venda idempotente / estorno | Design | Done |
| IDP-06 | P1: Venda idempotente / estorno | Design | Done |
| IDP-07 | P1: Venda idempotente / estorno | Design | Pending |
| IDP-08 | P1: Venda idempotente / estorno | Design | Done |
| MAQ-01 | P1: Máquina de estados | Design | Done |
| MAQ-02 | P1: Máquina de estados | Design | Done |
| MAQ-03 | P1: Máquina de estados | Design | Pending |
| MAQ-04 | P1: Máquina de estados | Design | Done |
| ENT-01 | P1: Entrada validada | Design | Pending |
| ENT-02 | P1: Entrada validada | Design | Pending |
| ENT-03 | P1: Entrada validada | Design | Pending |
| ENT-04 | P1: Entrada validada | Design | Pending |
| SEG-01 | P2: Papel no servidor | Design | Pending |
| SEG-02 | P2: Papel no servidor | Design | Pending |
| ROT-01 | P2: Rotas protegidas | Design | Pending |
| ROT-02 | P2: Rotas protegidas | Design | Pending |
| ROT-03 | P2: Rotas protegidas | Design | Pending |
| CAD-01 | P2: Cadastro fechado | Design | Done |
| CAD-02 | P2: Cadastro fechado | Design | Done |
| CAD-03 | P2: Cadastro fechado | Design | Pending |
| DAT-01 | P2: Data em Brasília | Design | Pending |
| DAT-02 | P2: Data em Brasília | Design | Pending |
| SEG-03 | P3: Headers | Design | Pending |

**Coverage:** 31 total, 31 mapped to tasks (T1–T23), 0 unmapped


---

## Success Criteria

- [ ] `npm run test:db` verde cobrindo IDP, EST e CAD com sessões reais de dono e recepcionista.
- [ ] Dois cliques em "concluir" no E2E deixam exatamente uma venda.
- [ ] Nenhum `delete from public.vendas` sobra em migration ativa.
- [ ] `grep` por action sem schema Zod em `src/features/*/actions.ts` retorna vazio.
