# Design do MVP Specification

## Problem Statement

A produção funciona, mas não tem layout comum: cada tela é solta, sem menu, sem sair da conta, com o cinza padrão do shadcn e destaque em ciano. A rota `/` (destino do login) ainda era a página de exemplo do Next.js. O protótipo validado com donos de petshop (repo `MVP-Petmanager`, feito no v0) tem a identidade visual que o produto deve ter.

## Goals

- [ ] Toda tela autenticada tem o visual do MVP: menu lateral escuro (slate-950), destaque laranja, fundo stone-50, fonte Inter.
- [ ] As regras de negócio da produção continuam valendo onde o MVP diverge.

## Out of Scope

| Feature | Reason |
| ------- | ------ |
| Aba "Criar conta" no login | Cadastro público é fechado (runbook de deploy); usuários entram por convite. |
| Botões +/- de estoque | Estoque sem saída manual: toda saída é por venda. |
| Select livre de status do agendamento | Status só muda por transição válida (`trg_agendamento_status`). |
| Painel inicial com métricas (Dashboard do MVP) | Lote futuro; por ora `/` vai para `/agenda`. |
| Tema escuro | O MVP não usa nas telas internas. |

## Requirements

| ID | Requisito | Lote |
| -- | --------- | ---- |
| DES-01 | Tokens do MVP no `globals.css` (primary laranja, fundo stone-50, Inter via `next/font`). | 1 |
| DES-02 | Layout `(dashboard)` com menu lateral fixo no desktop e gaveta no mobile; item ativo com `aria-current`; Estoque e Relatórios só para `dono`. | 1 |
| DES-03 | Bloco da conta no menu com e-mail, papel e botão Sair (`signOut` → `/login`). | 1 |
| DES-04 | `/` redireciona para `/agenda`; login e proxy (recepcionista em rota de dono) levam direto para `/agenda`. | 1 |
| DES-05 | Login no estilo do MVP (card "Área segura", laranja). | 1 |
| DES-06 | Telas internas com o padrão do MVP: título com eyebrow, busca com ícone, cards `rounded-2xl border-2`, métricas, paginação. | 2+ |

## Decisões

- O MVP é a referência direta; não passou pelo Paper (pedido do Lucas em 2026-11-13).
- Sem dependência nova: a gaveta mobile é um `useState` simples, não o `Sheet` do shadcn.
