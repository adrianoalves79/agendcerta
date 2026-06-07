# 📋 AgendCerta — Relatório Técnico Completo do Projeto

> **Última atualização:** 07/06/2026  
> **Commit atual:** `main` (pós-melhorias de bloqueio e CRM)  
> **Branch:** `main` → GitHub: `adrianoalves79/agendcerta`  
> **Produção:** Vercel (deploy automático a cada push no `main`)

---

## 🗂️ Visão Geral

**AgendCerta** é um sistema de agendamento online para a **César Barbearia** (Simão Dias - SE). O sistema é composto por duas frentes:

| Frente | Arquivo | Descrição |
|--------|---------|-----------|
| **Site do Cliente** | `index.html` + `app.js` + `style.css` | Fluxo de agendamento em 5 etapas |
| **Painel Admin** | `admin.html` + `admin.js` + `admin.css` | Gestão completa da barbearia |
| **Cancelamento** | `cancelar.html` + `cancelar.js` | Página de cancelamento via link |

---

## 🛠️ Stack Tecnológica

```
Frontend:   HTML5 + CSS3 (Vanilla) + JavaScript (ES Modules)
Build:      Vite 5.x
Database:   Supabase (PostgreSQL + Realtime)
Deploy:     Vercel (build automático via GitHub)
Fontes:     Google Fonts — Oswald (títulos) + Inter (corpo)
```

### Supabase
- **URL:** `https://ivfpjjfutbhjsctwuesq.supabase.co`
- **Client:** `supabaseClient.js` (importado em `app.js` e `admin.js`)
- **Realtime:** Ativo para `agendamentos`, `servicos`, `profissionais`, `configuracoes`

### Tabelas do Banco

| Tabela | Colunas principais | Uso |
|--------|-------------------|-----|
| `agendamentos` | `id, clientName, clientPhone, clientBirth, clientObs, serviceId, serviceName, servicePrice, serviceDuration, date, time, professional, status, createdAt` | Todos os agendamentos |
| `servicos` | `id, name, price, duration, img` | Serviços oferecidos |
| `profissionais` | `id, name, specialty, img, active` | Equipe de barbeiros |
| `configuracoes` | `id(='config_geral'), name, phone, address, instagram, theme, openDays, timeStart, timeEnd, interval` | Config geral do negócio |

**Status possíveis de agendamento:** `Confirmado` | `Pendente` | `Concluido` | `Cancelado`

---

## 📁 Estrutura de Arquivos

```
agendcerta/
├── index.html          # Site do cliente (agendamento)
├── app.js              # Lógica do site do cliente
├── style.css           # Estilos do site do cliente
├── admin.html          # Painel administrativo
├── admin.js            # Lógica do painel admin (~2772 linhas)
├── admin.css           # Estilos do painel admin (~3500 linhas)
├── cancelar.html       # Página de cancelamento
├── cancelar.js         # Lógica de cancelamento
├── supabaseClient.js   # Configuração do Supabase
├── vite.config.js      # Configuração do Vite
├── package.json        # Dependências
├── public/             # Assets públicos
├── imagens_hero/       # Fotos do barbeiro e hero
│   ├── cesar.webp
│   └── hero.png
└── imagens_servicos/   # Fotos dos serviços
    ├── corte_degrade.webp
    ├── barba.webp
    └── ...
```

---

## 🌐 Site do Cliente (`index.html` + `app.js`)

### Fluxo de 5 Etapas

```
Step 1 → Escolher Serviço
Step 2 → Escolher Profissional + Data + Horário
Step 3 → Preencher Dados (Nome, WhatsApp, Nascimento, Obs)
Step 4 → Confirmar Resumo
Step 5 → Agendamento Confirmado (WhatsApp + Google Calendar)
```

### State do App (`app.js`)
```js
const state = {
  step: 1,
  service: null,      // { id, name, price, duration, img }
  professional: null, // { id, name, specialty, img }
  date: null,         // Date object
  time: null,         // "HH:MM"
  client: { name, phone, birth, obs },
  cal: { month, year },
  config: null,
  lastBookingId: null
}
```

### Funções Principais (`app.js`)

| Função | O que faz |
|--------|-----------|
| `go(step)` | Navega entre etapas |
| `loadAndRenderServices()` | Carrega serviços do Supabase |
| `loadAndRenderProfessionals()` | Carrega profissionais do Supabase |
| `fetchMonthBookings()` | Busca agendamentos do mês para bloquear datas |
| `buildCalendar()` | Renderiza calendário interativo |
| `buildTimeSlots()` | Renderiza horários disponíveis (respeita bloqueios) |
| `loadBrandingConfig()` | Carrega tema, nome, endereço do Supabase |
| `applyTheme(themeKey)` | Aplica tema de cores via CSS variables |

### Validações no Step 3
- Nome: mínimo 3 caracteres
- Telefone: formato `(XX) XXXXX-XXXX` com máscara automática
- Data de nascimento: formato `DD/MM/AAAA` com máscara automática

### Confirmação (Step 4 → Step 5)
1. Verifica em tempo real se horário foi ocupado (race condition)
2. Insere agendamento no Supabase com `status: "Confirmado"`
3. Redireciona para Step 5 com botões de WhatsApp e Google Calendar

---

## 🛡️ Painel Admin (`admin.html` + `admin.js`)

### Estrutura de Tabs

| Tab | ID | Título | Renderização |
|-----|----|--------|-------------|
| Dashboard | `tab-dashboard` | Painel Geral | `renderDashboard()` |
| Calendário | `tab-calendar` | Agenda & Calendário | `renderCalendarTab()` |
| Serviços & Profissionais | `tab-services` | Serviços & Profissionais | `renderServicesTab()` |
| CRM | `tab-crm` | CRM & Cartão Fidelidade | `renderCRMTab()` |
| Configurações | `tab-settings` | Configurações do Sistema | `renderSettingsTab()` |

### State do Admin (`admin.js`)
```js
const state = {
  currentTab: 'tab-dashboard',
  selectedDate: new Date(), // Data selecionada no calendário
  pickerDate: new Date(),   // Mês navegado no mini-calendário
  bookings: [],             // Todos os agendamentos
  services: [],             // Todos os serviços
  professionals: [],        // Todos os profissionais
  crmSearchQuery: ''        // Query de busca no CRM
};
```

### Ciclo de Vida
```
init()
  ├── loadDatabase()         → carrega Supabase para state
  ├── seedMockData()         → (ATENÇÃO: só se banco estiver vazio!)
  ├── setupTabs()
  ├── setupDashboard()
  ├── setupMobileSidebar()
  ├── setupModals()
  ├── setupLiveNotifications()
  ├── setupManualBookingForm()
  ├── setupServicesAdmin()
  ├── setupCRMAdmin()
  ├── setupSettingsAdmin()
  └── renderAll()

renderAll()
  ├── loadDatabase()         → refresh do state
  └── render[Tab]()         → renderiza a tab atual
```

---

## 📊 Tab Dashboard

### Métricas Calculadas
- Agendamentos Hoje
- Agendamentos na Semana
- Total de Clientes Únicos (por telefone)
- Receita Hoje (status: Confirmado ou Concluido)
- Receita na Semana
- Pendentes (Confirmado com data >= hoje)

### Ações Rápidas
| Botão | ID | Ação |
|-------|----|------|
| Novo Agendamento | `qa-new-booking` | Abre modal de agendamento manual |
| **Novo Cliente** | `qa-new-client` | **Abre modal gestão de fidelidade** |
| Bloquear Horário | `qa-block-time` | Abre modal de bloqueio |
| Configurações | `qa-settings` | Navega para tab-settings |

### Próximos Agendamentos
- Lista os 5 próximos agendamentos confirmados
- Ícone ⋮ abre dropdown com ações: Concluído / Pendente / Cancelado
- Dropdown global: `#global-actions-dropdown` (posicionado com JS)
- Atualiza automaticamente a cada 30 segundos

---

## 📅 Tab Calendário

### Mini Calendário
- Navega por mês (botões `picker-prev` / `picker-next`)
- Dias com agendamentos marcados com ponto dourado
- Clique no dia filtra a agenda diária

### Agenda Diária
- Filtro por profissional e por status
- Cards de agendamento com botões: **Concluir** / **Cancelar** / **WhatsApp**
- Bloqueios aparecem em vermelho com botão "Desbloquear"

### `handleStatusChange(id, action)` — FUNÇÃO CENTRAL
```js
async function handleStatusChange(id, action) {
  // Determina novo status
  // Atualiza no Supabase
  
  // AUTO-STAMP DE FIDELIDADE:
  if (newStatus === 'Concluido' && item.clientPhone) {
    const loyaltyActive = JSON.parse(localStorage.getItem('cesar_barbearia_loyalty_active') || '{}');
    if (loyaltyActive[phone] === true) {
      // Adiciona selo automaticamente
      clientFidelidades[phone] = currentStamps + 1;
      localStorage.setItem('cesar_barbearia_fidelidades', ...);
      showToast('👑 Selo Registrado', ...);
    }
  }
  renderAll();
}
```

---

## ✂️ Tab Serviços & Profissionais

### Serviços
- CRUD completo via Supabase (tabela `servicos`)
- Upload de imagem customizada (Base64)
- Serviço especial `id: 'bloqueio'` — criado automaticamente, nunca exibido ao cliente
- Modal: `modal-service` | Form: `form-service`

### Serviços Padrão (fallback se banco vazio)
```
Corte Degradê         R$ 25,00   30min
Barba                 R$ 15,00   30min
Degradê + Barba       R$ 40,00   60min
Sobrancelha           R$ 8,00    30min
Barba + Sobrancelha   R$ 20,00   30min
Corte + Pigmentação   R$ 38,00   60min
Pigmentação           R$ 15,00   30min
Acabamento de Cabelo  R$ 8,00    30min
Alisamento Americano  R$ 70,00   90min
```

### Profissionais
- CRUD completo via Supabase (tabela `profissionais`)
- Upload de foto (Base64)
- Profissional padrão: César (`id: 'cesar'`) — não pode ser deletado
- Modal: `modal-professional` | Form: `form-professional`

---

## 👥 Tab CRM & Cartão Fidelidade

### CRM (Tabela de Clientes)
- Clientes compilados dinamicamente dos agendamentos (não há tabela separada de clientes)
- Apenas clientes com o programa fidelidade ativo (`loyaltyActive[phone] === true`) são listados na aba principal do CRM.
- Botão de atalho "Gerenciar Cartões" disponível diretamente na aba CRM para incluir ou remover clientes do programa.
- Agrupados por `clientPhone`
- Colunas: Nome, WhatsApp, Nascimento, Visitas, Último Agendamento, Fidelidade, Ações
- Busca em tempo real por nome ou telefone

### Sistema de Fidelidade

#### LocalStorage Keys
| Chave | Estrutura | Uso |
|-------|-----------|-----|
| `cesar_barbearia_loyalty_active` | `{ "telefone": true }` | Clientes no programa fidelidade |
| `cesar_barbearia_fidelidades` | `{ "telefone": 7 }` | Contagem de selos por cliente |

#### Fluxo Completo
```
Profissional clica "Novo Cliente" (dashboard)
    ↓
Modal "Clientes Fidelidade" abre (modal-manage-loyalty)
    ↓
Profissional clica "+ Adicionar" em um cliente
    ↓
localStorage.cesar_barbearia_loyalty_active[phone] = true
    ↓
Quando agendamento desse cliente é marcado "Concluído"
    ↓
handleStatusChange() detecta cliente fidelidade ativo
    ↓
Incrementa cesar_barbearia_fidelidades[phone]++
    ↓
Toast: "👑 Selo Registrado — X/10 selos"
    ↓
Ao completar 10: "🎁 Cartão Completo! Corte grátis!"
```

#### Gestão Manual (CRM)
- Botão "Fidelidade" em cada linha → abre `modal-loyalty-card`
- Pode carimbar selos manualmente, resgatar recompensa ou zerar

### Modais do CRM
| Modal ID | Função |
|----------|--------|
| `modal-manage-loyalty` | Gerenciar clientes do programa (ativar/desativar) |
| `modal-loyalty-card` | Cartão fidelidade visual de um cliente específico |

---

## ⚙️ Tab Configurações

### Painéis (Accordion)
| ID | Item de Menu | Conteúdo |
|----|-------------|----------|
| `panel-reports` | Relatório de Agendamentos | Métricas 7/30/todos os dias |
| `panel-financial` | Configuração Financeira | Moeda, meta de receita, custos fixos |
| `panel-faq` | Central de Ajuda (FAQ) | Perguntas frequentes |
| `panel-profile` | Editar Perfil | Nome, WhatsApp, endereço, Instagram, foto perfil, foto capa, tema |
| `panel-hours` | Horários de Trabalho | Dias da semana + horário início/fim + intervalo |
| `panel-notifications` | Notificações & Alertas | Toggle de som + seletor de som |
| `panel-share` | Links de Divulgação | Copiar/compartilhar link de agendamento |

### Temas de Cores
| Key | Cor | Nome |
|-----|-----|------|
| `gold` | #C8922A | Luxo (padrão) |
| `blue` | #0a84ff | Azul |
| `emerald` | #30d158 | Classic |
| `ruby` | #ff453a | Rubi |
| `custom` | JSON config | Cores totalmente customizadas |

### Config Salva no Supabase
```json
{
  "id": "config_geral",
  "name": "César Barbearia",
  "phone": "(79) XXXXX-XXXX",
  "address": "Praça Lucila Macedo Dêda, Simão Dias - SE",
  "instagram": "@cesar.barbearia",
  "theme": "gold",
  "openDays": [1,2,3,4,5,6],
  "timeStart": "09:00",
  "timeEnd": "20:00",
  "interval": 60
}
```

---

## 🔔 Sistema de Notificações

### Toast (`showToast(title, body)`)
- Aparece no canto inferior direito
- Auto-dismiss em 5 segundos
- Som configurável (chime, bell, retro, digital)
- Salvo em: `localStorage.cesar_notif_enabled` e `cesar_notif_sound`

### Realtime (Supabase)
```js
supabase.channel('admin-bookings')
  .on('postgres_changes', { event: 'INSERT', table: 'agendamentos' }, payload => {
    showToast("Novo Agendamento!", ...);
    // Atualiza badge do sino
    renderAll();
  })
  .on('postgres_changes', { event: 'UPDATE', table: 'agendamentos' }, () => renderAll())
  .subscribe();
```

---

## 📋 Agendamento Manual (Walk-in / Bloqueio)

Modal `modal-manual-booking` com dois modos:
1. **Modo Normal:** Nome, WhatsApp, Serviço, Profissional, Data, Horário, Obs
2. **Modo Bloqueio:** oculta campos de cliente, exibe checkbox "Bloquear dia todo"

### Regra de Bloqueio do Dia Inteiro
- **Registro Único:** Ao selecionar "Bloquear o dia todo", cancela de forma automática (pedindo confirmação se houver clientes) os agendamentos já marcados para o dia e profissional. Grava um único registro de bloqueio no Supabase com `time: 'Dia Inteiro'` e duração `'Dia Todo'`.
- **Prevenção de Concorrência & Colisão:** Desabilita todas as opções do seletor manual exibindo `(Dia Bloqueado)`. Na tela do cliente, os horários ficam indisponíveis com o balão `Sem atendimentos nesta data`. Validação em tempo real no checkout impede agendamentos em dias bloqueados.
- **Rápida Leitura:** Exibição limpa na agenda diária como `📅 AUSÊNCIA REGISTRADA` (Lembrete). O registro é omitido da seção de "Próximos Agendamentos" para manter foco em clientes.

Botões de acesso:
- Dashboard: `qa-new-booking` (normal) e `qa-block-time` (bloqueio)
- Calendário: `btn-manual-booking` (sidebar, modo normal)

---

## 📱 Responsividade Mobile

- Sidebar vira drawer deslizante com overlay (`sidebar-overlay`)
- Hamburger: `btn-hamburger`
- Tabelas do CRM têm atributo `data-label` para layout em cards no mobile
- Breakpoints principais: `@media (max-width: 991px)` e `@media (max-width: 768px)`

---

## 🔧 Todos os Modais do Sistema

| ID Modal | Título | Aberto por |
|----------|--------|-----------|
| `modal-manual-booking` | Novo Agendamento Manual | `qa-new-booking`, `btn-manual-booking`, `qa-block-time` |
| `modal-service` | Adicionar/Editar Serviço | `btn-add-service`, botão editar em cada card |
| `modal-professional` | Adicionar/Editar Profissional | `btn-add-professional`, botão editar na lista |
| `modal-manage-loyalty` | Clientes Fidelidade | `qa-new-client` (Ações Rápidas) |
| `modal-loyalty-card` | Cartão Fidelidade Virtual | Botão "Fidelidade" no CRM |

**Padrão de abertura/fechamento:**
```js
openModal('modal-id')   // adiciona classe 'active'
closeModal('modal-id')  // remove classe 'active'
// Qualquer elemento com [data-close="modal-id"] fecha o modal
// Clique no overlay (.modal-overlay) também fecha
```

---

## 🚀 Deploy e Comandos

```bash
# Desenvolvimento
npm run dev

# Build de produção
npm run build

# Deploy (automático via Vercel ao fazer push)
git add arquivo.js arquivo.html arquivo.css
git commit -m "feat: descricao da mudanca"
git push origin main
```

### Limpar banco antes de deploy
```js
// Salvar como clear_db.mjs e rodar: node clear_db.mjs
import { createClient } from '@supabase/supabase-js'
const supabase = createClient('https://ivfpjjfutbhjsctwuesq.supabase.co', 'CHAVE_AQUI')
await supabase.from('agendamentos').delete().neq('id', '00000000-0000-0000-0000-000000000000')
```

> O `dist/` está no `.gitignore` — o Vercel faz o build automaticamente na nuvem.

---

## ⚠️ Pontos de Atenção Críticos

### seedMockData() — Cuidado!
A função `seedMockData()` é chamada em `init()` **se o banco de agendamentos estiver vazio**. Em produção, se o banco for zerado acidentalmente, dados fictícios de teste serão inseridos. Para desativar isso, comentar ou remover as linhas em `init()`:
```js
// Se quiser desativar o seed em produção:
// if (state.bookings.length === 0) {
//   await seedMockData();
// }
```

### Fidelidade usa localStorage — Não Supabase
Os dados de selos e de clientes ativos no programa ficam **apenas no browser do profissional**. Se trocar de dispositivo ou limpar o cache, os dados são perdidos.

### CRM não tem tabela própria
Clientes são compilados dos agendamentos agrupados por telefone. Para campos extras permanentes (observações, tags), criar uma tabela `clientes` no Supabase.

### Temas Customizados são Base64
Imagens de perfil e capa customizadas são salvas como Base64 no Supabase dentro do campo `theme` como JSON. Pode crescer muito — considerar upload para Storage do Supabase no futuro.

---

## 📝 Histórico de Funcionalidades

| Data | Funcionalidade | Commit |
|------|---------------|--------|
| Jun/2026 | **Bloqueio de Dia Inteiro otimizado e CRM restrito a clientes ativos** | `main` |
| Jun/2026 | Correções de layout mobile e bloqueio de agenda | `3fbe6f4` |
| Jun/2026 | Fila de próximos agendamentos no dashboard (realtime) | anterior |
| Jun/2026 | **Sistema de Clientes Fidelidade completo** | `06da938` |
| Jun/2026 | Botão "Novo Cliente" → modal gestão fidelidade | `06da938` |
| Jun/2026 | Registro automático de selos ao concluir agendamento | `06da938` |
| Jun/2026 | Badge "Auto ✓" no CRM para clientes fidelidade ativos | `06da938` |
| Jun/2026 | Banco zerado e subido para produção limpa | `06da938` |

---

## 💡 Ideias para Futuras Funcionalidades

- [ ] Migrar fidelidade do localStorage para tabela Supabase
- [ ] Tabela `clientes` com histórico e observações permanentes
- [ ] Notificação automática via WhatsApp (lembrete 1 dia antes)
- [ ] Dashboard com gráfico de receita por mês
- [ ] Modo multi-unidade (várias barbearias)
- [ ] PWA (Progressive Web App) para instalar no celular
- [ ] QR code do cartão fidelidade para o cliente consultar online

---

*Documento gerado em 07/06/2026 — AgendCerta v1.0 — César Barbearia*
