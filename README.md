# 🐾 PetManager

Sistema de gestão para petshops de pequeno e médio porte — agenda de
banho/tosa, cadastro de tutores e pets, controle de vacinas, estoque,
vendas e relatório financeiro mensal exportável em PDF.

Desenvolvido para substituir o controle manual (caderno, WhatsApp,
planilha solta) hoje usado por petshops de Aracaju/Barra dos Coqueiros,
com o objetivo de ser **vendido a múltiplos petshops**, cada um com seu
próprio deploy.

> **Status atual**: em produção (`https://petmanager-six.vercel.app`). As
> features `petmanager-completo`, `hardening`, `fuso-horario` e
> `design-mvp` (T1–T41) estão concluídas, verificadas e implantadas —
> ver [Status do Desenvolvimento](#-status-do-desenvolvimento).

---

## 📑 Sumário

- [Visão geral](#-visão-geral)
- [Funcionalidades](#-funcionalidades)
- [Fora de escopo (v1)](#-fora-de-escopo-v1)
- [Stack técnica](#-stack-técnica)
- [Arquitetura](#-arquitetura)
- [Modelo de dados](#-modelo-de-dados)
- [Estrutura de pastas](#-estrutura-de-pastas)
- [Papéis e permissões](#-papéis-e-permissões)
- [Decisões de arquitetura](#-decisões-de-arquitetura)
- [Status do desenvolvimento](#-status-do-desenvolvimento)
- [Como rodar o projeto](#-como-rodar-o-projeto)
- [Deploy (runbook)](#-deploy-runbook)
- [Testes](#-testes)
- [Fluxo de contribuição](#-fluxo-de-contribuição)
- [Documentação (specs)](#-documentação-specs)

---

## 🎯 Visão geral

Donos de petshop controlam hoje, manualmente, agendamento de
banho/tosa, aplicação de vacinas, estoque de produtos e vendas — sem
nenhuma visão organizada de faturamento mensal. O PetManager centraliza
tudo isso em um único sistema web:

- Agenda de serviços com visualização de horários ocupados;
- Cadastro de tutores, pets, serviços e produtos;
- Histórico de vacinas e retorno previsto por pet;
- Controle de estoque com alerta de saldo baixo;
- **Área de Vendas** única (produto + serviço), fonte confiável de
  faturamento;
- **Dashboard/relatório mensal** navegável, exportável em **PDF**;
- Toda lista principal do sistema é **buscável e filtrável**.

**Modelo de implantação**: single-tenant — cada petshop-cliente roda
sua própria instância/deploy e seu próprio projeto Supabase. Não há
multi-tenancy na mesma base de dados.

---

## ✅ Funcionalidades

| Módulo | Descrição |
|---|---|
| **Autenticação e Papéis** | Login por e-mail/senha (Supabase Auth), dois papéis: `dono` e `recepcionista`, com acesso restrito por rota e por RLS |
| **Horário de Funcionamento** | Cadastro de dias/horários de abertura, usado para limitar os slots da agenda |
| **Tutores e Pets** | Cadastro com validação de telefone brasileiro, porte do pet e vínculo tutor↔pet |
| **Serviços** | Cadastro de serviços (banho, tosa...) com preço interno **nunca exibido** na tela de agendamento |
| **Agenda** | Criar, editar, cancelar, reabrir e concluir agendamentos; concluir gera venda automaticamente; reabrir um concluído estorna a venda |
| **Vacinas** | Registro de vacina aplicada + data de retorno prevista, histórico completo por pet |
| **Estoque** | Cadastro de produto, entrada de estoque, alerta de saldo baixo — **sem saída manual**: toda saída só acontece através de uma venda |
| **Vendas** ⭐ | Tela única para vendas de produto (avulsa, no balcão) e de serviço (gerada ao concluir agendamento) — fonte única de faturamento |
| **Relatórios / Dashboard** | Contagem de concluídos/cancelados e faturamento total por mês, navegável para qualquer mês anterior, com **exportação em PDF** |
| **Filtros de Pesquisa** ⭐ | Busca textual + filtro por atributo em todas as listas principais (Agenda, Pets, Vacinas, Produtos, Vendas), combináveis, sem recarregar a página |

⭐ = funcionalidades novas em relação ao MVP original, incorporadas
após validação de um protótipo com donos de petshop reais (ver
[Decisões de arquitetura](#-decisões-de-arquitetura)).

---

## 🚫 Fora de escopo (v1)

Excluído deliberadamente desta versão, para não gerar scope creep:

| Item | Motivo |
|---|---|
| Pagamento online | Não é dor prioritária hoje |
| Multi-tenant (vários petshops numa base) | Cada petshop tem seu próprio deploy |
| Múltiplas unidades/filiais | Fora do nicho-alvo (unidade única) |
| Agenda por funcionário/tosador | Agenda única do estabelecimento |
| Autoatendimento do tutor | Tutor não acessa o sistema |
| Chatbot WhatsApp | Feature separada, pós-validação comercial |
| API pública / rate limiting | Sistema interno, sem API exposta |
| Trilha de auditoria campo-a-campo | `vendas`/`movimentacoes_estoque` já registram quem criou; log completo fica para versão futura |

---

## 🧱 Stack técnica

| Camada | Tecnologia |
|---|---|
| Framework | **Next.js (App Router)** + TypeScript |
| UI | **Tailwind CSS** + **shadcn/ui** |
| Backend | **Server Actions** do Next.js (sem API REST separada) |
| Dados / Auth | **Supabase** (Postgres + Supabase Auth) |
| Autorização | **RLS (Row Level Security)** como camada real de controle de acesso — não só na UI |
| PDF | **`@react-pdf/renderer`** — geração server-side, sem headless browser |
| Testes unitários | **Vitest** |
| Testes e2e | **Playwright** |
| Deploy | **Vercel** |

Não há camada de API REST própria: Server Components fazem toda
leitura direto do Supabase, e Server Actions fazem toda escrita (ver
[AD-001](#-decisões-de-arquitetura)).

---

## 🏗️ Arquitetura

```mermaid
graph TD
    A[Server Component - pagina] -->|le dados direto, com filtros via searchParams| S[Supabase client - server]
    B[Formulario - Client Component] -->|chama| C[Server Action]
    C -->|grava| S
    C -->|conclui agendamento| V[Cria venda automaticamente]
    C -->|registra venda de produto| V
    V -->|le| R[features/relatorios]
    R -->|gera| P[PDF - server-side]
    S -->|RLS por role| D[(Postgres)]
    S --> E[Supabase Auth]
```

**Princípios centrais:**

- Nenhuma escrita passa por fora de uma Server Action; nenhuma leitura
  passa por fora de um Server Component ou de uma query tipada.
- RLS é a camada real de segurança — a UI apenas reflete as permissões,
  nunca as substitui.
- **Vendas é a fonte única de faturamento.** Nunca se soma
  "agendamentos concluídos" + "saídas de estoque" separadamente — tudo
  passa pela tabela `vendas`, eliminando divergência de cálculo.
- Saída de estoque só existe como efeito colateral de uma venda de
  produto (função Postgres transacional `registrar_venda_produto`),
  nunca como ação isolada.

---

## 🗃️ Modelo de dados

Principais entidades (nomes simplificados; ver
[`design.md`](#-documentação-specs) para o schema completo):

```typescript
interface Produto {
  id: string
  nome: string
  categoria: string
  precoUnitario: number
  saldoEstoque: number
  estoqueMinimo: number // alimenta o alerta de estoque baixo
}

interface MovimentacaoEstoque {
  id: string
  produtoId: string
  tipo: 'entrada' | 'saida'   // 'saida' só é criada via venda
  quantidade: number
  vendaId: string | null      // rastreia qual venda causou a saída
  data: string
}

interface Venda {
  id: string
  tipo: 'servico' | 'produto'
  agendamentoId: string | null // só quando tipo = 'servico'
  produtoId: string | null     // só quando tipo = 'produto'
  servicoIds: string[] | null  // snapshot dos serviços vendidos
  quantidade: number           // sempre 1 para serviço; variável para produto
  valorTotal: number
  criadoPor: string
  criadoEm: string              // ISO 8601, base do filtro por mês
}
```

**Constraint chave**: cada `Venda` deve ter exatamente um de
`agendamentoId`/`produtoId` preenchido, de acordo com o `tipo` (`CHECK`
no banco).

**Migrations (`0001`–`0013`):**

| Migration | Conteúdo |
|---|---|
| `0001`–`0003` | `profiles` (papéis), tabelas de domínio (tutores, pets, serviços, agendamentos, vacinas, produtos), RLS inicial |
| `0004`–`0008` | Categorias/estoque mínimo de produtos, tabela `vendas` + `registrar_venda_produto`, RPCs de concluir e reabrir agendamento, nome da vacina |
| `0009`–`0013` | Estorno não-destrutivo (`estornada_em`), trigger de máquina de estados de agendamento (`trg_agendamento_status`), RPCs como `security invoker`, `registrar_entrada` atômica, exigência de perfil ativo em todas as policies (`0013`) |

Toda policy de RLS usa `(select auth.uid())` — nunca `auth.uid()`
chamado linha a linha (ver [AD-003](#-decisões-de-arquitetura)).

---

## 📂 Estrutura de pastas

Organização **por domínio de negócio**, nunca por camada genérica
(`utils/`, `helpers/`, `common/`):

```
src/
  app/
    (auth)/login/
    (dashboard)/
      agenda/
      pets/
      servicos/
      vacinas/
      estoque/
      vendas/
      relatorios/
      horario-funcionamento/
  features/
    agenda/          # actions.ts · queries.ts · types.ts · components/
    pets/
    servicos/
    vacinas/
    estoque/          # sem ação de saída direta
    vendas/            # fonte única de faturamento
    relatorios/        # lê de vendas, gera PDF
    horario-funcionamento/
    auth/
  shared/
    supabase/
      client.ts        # cliente browser-side
      server.ts        # cliente server-side
    ui/                 # componentes shadcn/ui
    tela/               # TituloPagina, cartao, Metrica, Paginacao (10/página)
    data/               # fuso.ts e hoje.ts (America/Sao_Paulo, -03:00)
    validacao/          # helper validar() com Zod
    filters/            # busca/filtro reutilizável via URL
      use-list-filters.ts
      search-filter-bar.tsx
    pdf/                 # geração de PDF server-side
      relatorio-pdf.tsx
supabase/
  checagem-implantacao.sql
  migrations/
    0001_profiles.sql ... 0013_acesso_exige_perfil_ativo.sql
e2e/
  *.spec.ts
```

---

## 🔐 Papéis e permissões

| Recurso | `dono` | `recepcionista` |
|---|---|---|
| Agenda (criar/editar/cancelar/concluir) | ✅ | ✅ |
| Tutores, Pets, Vacinas | ✅ | ✅ |
| Cadastro de Serviços | ✅ | ❌ |
| Estoque (cadastro de produto, entrada) | ✅ | ❌ |
| Venda de produto avulsa | ✅ | ❌ |
| Listagem de Vendas | ✅ | ✅ |
| Relatório mensal / Exportar PDF | ✅ | ❌ |

A restrição é aplicada em **duas camadas independentes**: middleware de
rota (UX) e RLS no Postgres (segurança real) — a UI nunca é a única
barreira.

---

## 🧭 Decisões de arquitetura

Registradas em `.specs/STATE.md`, resumidas aqui:

| ID | Decisão |
|---|---|
| **AD-001** | Sem API REST separada — Server Actions escrevem, Server Components leem direto do Supabase. Reversível se surgir um segundo cliente (app mobile, integração externa). |
| **AD-002** | Estrutura por domínio (`features/<dominio>/`), nunca por camada genérica. Código só vai para `shared/` se for genuinamente cross-cutting. |
| **AD-003** | RLS sempre com `(select auth.uid())` — cacheado pelo planner por statement, evita reavaliação linha a linha em tabelas grandes. |
| **AD-004** | Toda task avalia um roster fixo de skills de segurança/qualidade (testes de segurança, pentesting, boas práticas Postgres/TypeScript/React, arquitetura) antes de ser considerada concluída — o software é vendido a clientes reais. |
| **AD-005** | A partir de T8, nada vai direto para `main`. Cada task roda em branch `task/T<N>-<slug>`, sobe PR, é integrada via **squash merge** só depois do gate (build/test) passar. |
| **AD-006** | `petmanager-completo` substitui `petmanager-mvp` como fonte da verdade. Escopo confirmado como single-tenant + Área de Vendas unificada + filtros de pesquisa + exportação em PDF, após validação com donos de petshop via protótipo em v0.dev (**nenhum código do protótipo foi reaproveitado** — serviu só de referência visual). |
| **AD-007** | v0.dev desconectado do GitHub; usado só como referência visual isolada. |
| **AD-008** | Execução contínua de tasks com gates automáticos e PR por task. |
| **AD-009** | `preco_interno` oculto na tela de agendamento por UX; RLS de `servicos` permanece aberta para leitura autenticada com perfil ativo. |
| **AD-010** | Todo horário em `America/Sao_Paulo` (`-03:00`) via `src/shared/data/fuso.ts`, com lint bloqueando formatação de data sem `timeZone`. |
| **AD-011 / AD-012** | Identidade visual do MVP (`slate-950`, `orange`, `stone-50`, fonte Inter local) e componentes de tela padronizados em `src/shared/tela/` com paginação de 10 itens. |
| **AD-013** | `npm run test:unit` roda com `TZ=UTC` (mesmo fuso da Vercel). |
| **AD-015** | Implantação ativa em produção (`https://petmanager-six.vercel.app`) com RLS endurecida exigindo perfil ativo (`0013`). |

**Principais decisões técnicas (`design.md`):**

- **Geração de PDF**: `@react-pdf/renderer`, 100% server-side — leve o
  suficiente para a serverless da Vercel, sem depender de
  Chromium/Puppeteer.
- **Faturamento**: sempre `SUM(vendas.valor_total)` de vendas ativas (`estornada_em is null`) — nunca dois
  cálculos separados (agendamentos + estoque).
- **Concluir / Reabrir agendamento**: controlado no banco pelo trigger `trg_agendamento_status` (`0010`), que exige transições válidas, cria venda na conclusão e marca estorno não-destrutivo na reabertura.
- **Filtros e paginação de lista**: estado guardado na URL (`searchParams`), voltando à página 1 quando a busca ou o filtro mudam.

---

## 📊 Status do desenvolvimento

O projeto segue um fluxo **spec-driven**: cada feature nasce de um
`spec.md` (requisitos) → `design.md` (arquitetura) → `tasks.md` (plano
de execução rastreável) → `validation.md` (verificação independente), guardados em `.specs/`.

| Feature | Escopo | Status |
|---|---|---|
| `petmanager-completo` | Todas as 8 fases funcionais (Auth, Cadastros, Estoque, Vendas, Agenda, Vacinas, Relatórios + PDF, Filtros) — 41 tasks | ✅ Concluída e verificada |
| `hardening` | Testes reais de banco (`test:db`), estorno não-destrutivo, trigger de estados, validação Zod em 100% das Server Actions, `proxy.ts`, headers, `0013` (perfil ativo) e runbook SQL | ✅ Concluída e verificada |
| `fuso-horario` | Datas e horários fixados em `America/Sao_Paulo` (`-03:00`) + regra de lint contra data sem `timeZone` | ✅ Concluída e verificada |
| `design-mvp` | Identidade visual do MVP, `MenuLateral` responsivo, componentes `src/shared/tela/`, paginação de 10 itens e fonte Inter local | ✅ Concluída e verificada |

**Suíte de verificação atual:** `205` testes unitários (`TZ=UTC`) · `40` testes de integração no Postgres (`test:db`) · `38/38` testes E2E no Playwright (`test:e2e`).

---

## 🚀 Como rodar o projeto

> Pré-requisitos: Node.js LTS, uma conta/projeto Supabase e as
> variáveis de ambiente configuradas.

```bash
# instalar dependências
npm install

# configurar variáveis de ambiente do Supabase
cp .env.example .env.local
# preencher NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

# aplicar as migrations no projeto Supabase
# (via Supabase CLI ou MCP, conforme o fluxo do projeto)

# rodar em desenvolvimento
npm run dev
```

Acesse `http://localhost:3000`.

---

## 🛫 Deploy (runbook)

Cada petshop tem o próprio projeto Supabase e o próprio deploy na Vercel.
Faça na ordem; a checagem do passo 6 diz se algo ficou para trás.

1. **Antes de tudo, rode os testes de banco no local** (precisa do Docker).
   `test:db` recria o banco local com `supabase db reset`, então não aponte
   para nada que tenha dados.

   ```bash
   npx supabase start
   npm run test:db
   ```

2. **Crie o projeto Supabase** na região `sa-east-1` (São Paulo). Anote a
   URL e a chave publicável em Project Settings → API Keys.

3. **Feche o cadastro e endureça o login** em Authentication:
   - Sign In / Providers: desligue **Allow new users to sign up**. O
     `supabase/config.toml` só vale no local; na nuvem o projeto nasce com o
     cadastro **ligado**, e qualquer pessoa criaria conta pela API.
   - Senha mínima de 8 caracteres (o local usa 6 só para teste).

4. **Aplique as migrations** (`supabase/migrations/0001` a `0013`):

   ```bash
   npx supabase link --project-ref <ref-do-projeto>
   npx supabase db push
   ```

   Pelo MCP, aplique cada arquivo em ordem com `apply_migration`.

5. **Crie os usuários.** Em Authentication → Users → **Add user → Create new
   user**, com e-mail, senha e **Auto Confirm User** marcado. Não use
   **Invite user**: o link do convite leva a uma tela de definir senha que o
   app não tem. Depois, no SQL Editor, dê o papel a cada um (sem isso o
   login não entra em nada):

   ```sql
   insert into public.profiles (id, role)
   select id, 'dono' from auth.users where email = 'dono@petshop.com';
   -- repita com 'recepcionista' para cada funcionária
   ```

   Para desligar alguém depois: `update public.profiles set ativo = false
   where id = (select id from auth.users where email = '...');`. O acesso
   cai na hora, inclusive pela API.

6. **Rode a checagem** colando `supabase/checagem-implantacao.sql` no SQL
   Editor. O resultado tem que ser uma única linha `ok`; qualquer outra
   linha diz o que falta (tabela sem RLS, função aberta a `anon`, migration
   faltando, nenhum dono, login sem perfil). Rode também o **Security
   Advisor** do painel (ou `get_advisors` pelo MCP) e zere os avisos.

7. **Deploy na Vercel.** Importe o repositório e cadastre, em Production:

   | Variável | Valor |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | URL do passo 2 |
   | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | chave publicável do passo 2 |

   Nenhuma chave secreta (`service_role`) vai para a Vercel.

8. **Teste de fumaça em produção**, com o dono: entrar, cadastrar horário de
   funcionamento, um tutor com pet, um serviço, agendar e concluir (a venda
   aparece em Vendas), e baixar o PDF de Relatórios. Com a recepcionista:
   Estoque e Relatórios somem do menu e `/estoque` volta para `/agenda`.

> **Plano Free:** o Supabase pausa projetos sem uso por 7 dias e não tem
> backup para baixar. Um petshop em uso diário não pausa, mas o backup fica
> por sua conta até haver plano pago.

## 🧪 Testes

| Tipo | Cobertura | Comando |
|---|---|---|
| Unitário (Vitest) | Server Actions e Queries — todos os branches, 1:1 com os critérios de aceite da spec | `npm run test:unit` |
| E2E (Playwright) | Fluxos de página completos (login, agenda, vendas, relatórios) e bloqueio de rota por papel | `npm run test:e2e` |
| Build/Lint | Migrations, RLS, função Postgres transacional e config validados via gate de build | `npm run build && npm run lint` |

**Gates de qualidade** usados antes de qualquer merge:

| Gate | Quando usar | Comando |
|---|---|---|
| Quick | Tasks só com testes unitários | `npm run test:unit` |
| Full | Tasks com e2e | `npm run test:unit && npm run test:e2e` |
| Build | Fim de fase ou tasks de config/schema | `npm run build && npm run lint && npm run test:unit && npm run test:e2e` |

---

## 🔀 Fluxo de contribuição

A partir da task T8, **nada vai direto para `main`** (AD-005):

1. Cada task (ou grupo pequeno de tasks relacionadas) nasce numa branch
   `task/T<N>-<slug>`.
2. Abre-se um Pull Request.
3. O PR só é integrado após o **gate da task** (build/test) passar.
4. Integração via **squash merge** — `main` mantém 1 commit por task,
   fácil de ler e reverter.
5. A branch é apagada após o merge.

> Nota: branch protection na `main` ainda não está habilitada
> tecnicamente no GitHub (limitação do token atual) — é seguida como
> disciplina manual até ser configurada em Settings → Branches.

---

## 📚 Documentação (specs)

Toda a especificação, o design técnico e o plano de execução vivem em
`.specs/`, seguindo um fluxo spec-driven:

```
.specs/
  STATE.md                              # decisões de arquitetura (AD-001..AD-015) + handoff atual
  LESSONS.md / lessons.json             # lições aprendidas entre features
  features/
    petmanager-mvp/                     # versão inicial — histórico (T1-T8 reaproveitados)
    petmanager-completo/                # escopo funcional completo (41 tasks, 8 fases)
    hardening/                          # segurança, Zod, máquina de estados, estorno, test:db e runbook
    fuso-horario/                       # padronização em America/Sao_Paulo (-03:00)
    design-mvp/                         # visual do MVP, menu lateral e paginação
```

Para entender **o quê** o sistema deve fazer, comece por
`spec.md`; para entender **como**, veja `design.md`; para acompanhar
**o progresso**, veja `tasks.md` e o bloco *Handoff* em `STATE.md`.
