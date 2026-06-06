# 📋 CHANGELOG — AgendCerta

Histórico de mudanças feitas no projeto. Atualizado a cada alteração.

---

## [2026-06-06] — Correção de Overflow Mobile no Dashboard (admin.css)

### Problema
Na versão mobile, os elementos **"Próximos Agendamentos"** e **"Ações Rápidas"** estavam com largura maior que o viewport, causando scroll horizontal indesejado.

### Causa Raiz
1. **`.dashboard-rows-grid`** — Grid container sem `min-width: 0`, causando colunas maiores que o viewport.
2. **`.db-upcoming-item`** — Flex container sem `flex-wrap`, os botões de ação (✓ ✗) e o nome do cliente ultrapassavam a borda.
3. **`.quick-action-btn`** — Sem `min-width: 0` nem `width: 100%`, vazava para fora da coluna do grid.
4. **`.admin-content`** no breakpoint mobile — Sem `overflow: hidden`, não continha os elementos filhos.

### Arquivos Alterados

#### `admin.css`
- **`.dashboard-rows-grid`** (linha ~2180): adicionado `min-width: 0`
- **`.dashboard-rows-grid > *`** (nova regra): adicionado `min-width: 0` e `overflow: hidden` em todos os filhos diretos do grid
- **`@media (max-width: 991px)` — `.admin-content`**: padding reduzido de `20px` para `16px`, adicionado `overflow: hidden`
- **`@media (max-width: 576px)` — `.quick-action-btn`**: adicionado `min-width: 0` e `width: 100%`
- **`@media (max-width: 576px)` — `.quick-action-btn span`**: adicionado `word-break: break-word`
- **`@media (max-width: 576px)` — `.db-upcoming-item`**: adicionado `flex-wrap: wrap` e `gap: 8px`
- **`@media (max-width: 576px)` — `.upcoming-details`**: adicionado `min-width: 0` e `flex: 1 1 0`
- **`@media (max-width: 576px)` — `.upcoming-client-name`**: adicionado `max-width: 100%`
- **`@media (max-width: 576px)` — `.upcoming-actions`**: adicionado `flex-shrink: 0`
- **`@media (max-width: 576px)` — `.report-box`**: adicionado `min-width: 0`, `width: 100%`, `box-sizing: border-box`
- **`@media (max-width: 576px)` — `.dashboard-upcoming-list`**: removido `max-height` para mostrar todos os itens

---

## Estrutura do Projeto

| Arquivo | Descrição |
|---|---|
| `admin.html` | Painel do empresário (sidebar, dashboard, calendário, CRM, configurações) |
| `admin.css` | Estilos do painel admin (3314 linhas) |
| `admin.js` | Lógica do painel (agendamentos, supabase, UI) |
| `index.html` | Página pública de agendamento do cliente |
| `style.css` | Estilos da página pública |
| `app.js` | Lógica da página de agendamento |
| `cancelar.html` / `cancelar.js` | Página de cancelamento de agendamento |
| `supabaseClient.js` | Configuração do cliente Supabase |
| `vite.config.js` | Configuração do Vite |

---

*Arquivo mantido automaticamente. Sempre atualizado após cada sessão de alterações.*
