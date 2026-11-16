# Revisão de segurança antes de vender (2026-11-16)

Escopo: Server Actions, `proxy`, auth, RLS, funções e triggers no estado final do banco local (12 migrations). Modelo de ameaça: a chave publicável é pública, então qualquer login fala direto com o PostgREST sem passar pelas actions; a RLS é a fronteira real.

## Corrigido no T38

| # | Achado | Severidade |
|---|--------|------------|
| 1 | Policies `using (true)` liberavam tutores (telefone), pets, agendamentos e vacinas para **qualquer** `authenticated`, com ou sem perfil. Hoje só o signup desligado segurava; o `config.toml` não vale na nuvem, onde o projeto novo nasce com signup **ligado**. | Alta |
| 2 | `profiles.ativo` não era respeitado em lugar nenhum: funcionária desligada (`ativo = false`) continuava com acesso total. | Média |
| 3 | Insert direto de agendamento já `concluido` passava por fora do `trg_agendamento_status` (só `UPDATE`), deixando atendimento concluído sem venda. | Baixa |
| 4 | `current_role_petmanager` e `registrar_venda_produto` executáveis por `anon` (invoker, sem efeito prático; viola L-003). | Baixa |

## Conferido e ok

- Toda action: Zod → `exigirSessao`/`exigirDono` → Supabase. Login com mensagem genérica. `getUser()` (não `getSession`) no proxy.
- `vendas` sem UPDATE/DELETE por policy: venda é imutável pelo cliente; estorno só pelo trigger `security definer`.
- `profiles` sem INSERT/UPDATE por policy: ninguém troca o próprio papel.
- Headers `X-Frame-Options`, `nosniff`, `Referrer-Policy` no `next.config.ts`.

## Riscos aceitos

- **Preço interno e vendas legíveis pela recepcionista via API** (AD-009, VEN-05): esconder é só UX.
- **Recepcionista apaga tutor/pet/vacina/agendamento** via API (AUTH-03 dá acesso completo). FKs sem cascade impedem apagar agendamento com venda.
- **Senha mínima 6** no local; na nuvem configurar 8+ e manter o rate limit padrão do Supabase Auth.
- **CSP** fora (custo alto para 2–5 usuários, hardening spec).
