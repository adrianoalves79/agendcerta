/**
 * ==========================================================================
 * CÉSAR BARBEARIA — ADMIN PANEL CONTROLLER
 * ==========================================================================
 */

import { supabase } from './supabaseClient.js';

document.addEventListener('DOMContentLoaded', () => {

  // ── Seeding & State ──────────────────────────────────────────────────────
  const state = {
    currentTab: 'tab-dashboard',
    selectedDate: new Date(), // Date object for calendar agenda
    pickerDate: new Date(),   // Date object for mini calendar picker navigation
    bookings: [],
    services: [],
    professionals: [],
    crmSearchQuery: ''
  };

  // Expose state globally for easy access if needed
  window.adminState = state;

  const defaultServices = [
    { id: "corte-degrade", name: "Corte Degradê", price: "R$ 25,00", duration: "30 min", img: "./imagens_servicos/corte_degrade.webp" },
    { id: "barba", name: "Barba", price: "R$ 15,00", duration: "30 min", img: "./imagens_servicos/barba.webp" },
    { id: "degrade-barba", name: "Degradê + Barba", price: "R$ 40,00", duration: "60 min", img: "./imagens_servicos/degrade_e_barba.webp" },
    { id: "sobrancelha", name: "Sobrancelha Navalhada", price: "R$ 8,00", duration: "30 min", img: "./imagens_servicos/sobrancelha.webp" },
    { id: "barba-sobrancelha", name: "Barba + Sobrancelha", price: "R$ 20,00", duration: "30 min", img: "./imagens_servicos/barba_e_sombrancelha.webp" },
    { id: "corte-pigmentacao", name: "Corte + Pigmentação", price: "R$ 38,00", duration: "60 min", img: "./imagens_servicos/corte_e_pigmentacao.webp" },
    { id: "pigmentacao", name: "Pigmentação", price: "R$ 15,00", duration: "30 min", img: "./imagens_servicos/pigmentacao.webp" },
    { id: "acabamento", name: "Acabamento de Cabelo", price: "R$ 8,00", duration: "30 min", img: "./imagens_servicos/acabamento.webp" },
    { id: "alisamento", name: "Alisamento Americano", price: "R$ 70,00", duration: "90 min", img: "./imagens_servicos/alisamento_americano.webp" }
  ];

  const defaultProfessionals = [
    { id: "cesar", name: "César", specialty: "Degradês e Barboterapia", img: "./imagens_hero/cesar.webp", active: true }
  ];

  // Helper refs
  const $ = id => document.getElementById(id);
  const $q = sel => document.querySelector(sel);

  // Tema de Cores do Painel (CSS Variables)
  const themes = {
    gold: {
      primary: '#C8922A',
      light: '#E0A83A',
      gradient: 'linear-gradient(135deg, #E0A83A 0%, #B8801A 100%)',
      border: 'rgba(200, 146, 42, 0.2)',
      borderCard: 'rgba(200, 146, 42, 0.25)'
    },
    blue: {
      primary: '#0a84ff',
      light: '#409cff',
      gradient: 'linear-gradient(135deg, #409cff 0%, #005ecb 100%)',
      border: 'rgba(10, 132, 255, 0.2)',
      borderCard: 'rgba(10, 132, 255, 0.25)'
    },
    emerald: {
      primary: '#30d158',
      light: '#5ee07e',
      gradient: 'linear-gradient(135deg, #5ee07e 0%, #1e9a3c 100%)',
      border: 'rgba(48, 209, 88, 0.2)',
      borderCard: 'rgba(48, 209, 88, 0.25)'
    },
    ruby: {
      primary: '#ff453a',
      light: '#ff6961',
      gradient: 'linear-gradient(135deg, #ff6961 0%, #c91e17 100%)',
      border: 'rgba(255, 69, 58, 0.2)',
      borderCard: 'rgba(255, 69, 58, 0.25)'
    }
  };

  function applyTheme(themeKey) {
    const t = themes[themeKey] || themes.gold;
    document.documentElement.style.setProperty('--gold', t.primary);
    document.documentElement.style.setProperty('--gold-light', t.light);
    document.documentElement.style.setProperty('--gold-gradient', t.gradient);
    document.documentElement.style.setProperty('--border', t.border);
    document.documentElement.style.setProperty('--border-card', t.borderCard);
  }

  // ── Bootstrapping & Initial Loading ──────────────────────────────────────
  async function init() {
    await loadDatabase();
    
    // Seed mock data if database is empty
    if (state.bookings.length === 0) {
      await seedMockData();
    }
    
    setupTabs();
    setupModals();
    setupLiveNotifications();
    setupManualBookingForm();
    setupServicesAdmin();
    setupCRMAdmin();
    setupSettingsAdmin();
    
    // Initial Render
    renderAll();
  }

  async function loadDatabase() {
    const { data: bookings } = await supabase.from('agendamentos').select('*');
    const { data: services } = await supabase.from('servicos').select('*');
    const { data: profs } = await supabase.from('profissionais').select('*');
    const { data: configData } = await supabase.from('configuracoes').select('*').eq('id', 'config_geral').single();

    state.bookings = bookings || [];
    state.services = services || [];
    state.professionals = profs || [];
    
    // Fallback to default lists if empty
    if (state.services.length === 0) {
      state.services = [...defaultServices];
    }
    if (state.professionals.length === 0) {
      state.professionals = [...defaultProfessionals];
    }

    if (!configData) {
      const defaultSettings = {
        name: "César Barbearia",
        phone: "(11) 99999-9999",
        address: "Praça Lucila Macedo Dêda, Simão Dias - SE",
        instagram: "@cesar.barbearia",
        theme: "gold",
        openDays: [1, 2, 3, 4, 5, 6], // Mon-Sat
        timeStart: "09:00",
        timeEnd: "20:00",
        interval: 60
      };
      state.config = defaultSettings;
    } else {
      state.config = configData;
    }

    // Aplicar tema no carregamento
    applyTheme(state.config.theme);

    // Atualizar nome no cabeçalho se existir
    setTimeout(() => {
      const titleEl = $q('.brand-info h2');
      if (titleEl) titleEl.textContent = state.config.name;
    }, 50);
  }

  async function saveBookings() {
    // In Supabase, we don't save the entire array, we update individual rows.
    // So this is a no-op for now. Updates are done individually.
  }

  async function saveServices() {
    // Upsert all services
    await supabase.from('servicos').upsert(state.services);
  }

  async function saveProfessionals() {
    // Upsert all professionals
    await supabase.from('profissionais').upsert(state.professionals);
  }

  // ── Mock Data Seeder ─────────────────────────────────────────────────────
  function seedMockData() {
    console.log("Semeando dados iniciais no localStorage...");
    const clients = [
      { name: "Adriano Silva", phone: "(11) 98765-4321", birth: "12/04/1995" },
      { name: "Matheus Costa", phone: "(11) 99888-7766", birth: "05/09/1988" },
      { name: "Carlos Eduardo", phone: "(11) 97766-5544", birth: "21/11/2001" },
      { name: "João Pedro Santos", phone: "(11) 96543-2109", birth: "30/01/1993" },
      { name: "Rodrigo Almeida", phone: "(11) 95432-1098", birth: "15/07/1987" },
      { name: "Thiago Oliveira", phone: "(11) 94321-0987", birth: "" },
      { name: "Lucas Fernandes", phone: "(11) 93210-9876", birth: "02/02/1998" }
    ];

    const slots = ['09:00','10:00','11:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00'];
    const mockBookings = [];

    // Let's generate 22 bookings over the last 15 days up to next 3 days
    const today = new Date();
    
    for (let i = -14; i <= 3; i++) {
      const targetDate = new Date();
      targetDate.setDate(today.getDate() + i);
      
      // Sunday is closed
      if (targetDate.getDay() === 0) continue;
      
      // Generate 1 to 3 bookings per day
      const dailyCount = i <= 0 ? Math.floor(Math.random() * 3) + 1 : Math.floor(Math.random() * 2);
      
      for (let j = 0; j < dailyCount; j++) {
        const client = clients[Math.floor(Math.random() * clients.length)];
        const service = defaultServices[Math.floor(Math.random() * defaultServices.length)];
        const time = slots[Math.floor(Math.random() * slots.length)];
        
        let status = "Confirmado";
        if (i < 0) {
          status = Math.random() > 0.15 ? "Concluido" : "Cancelado";
        } else if (i === 0) {
          status = Math.random() > 0.5 ? "Concluido" : "Confirmado";
        } else {
          status = Math.random() > 0.3 ? "Confirmado" : "Pendente";
        }

        mockBookings.push({
          id: 'ag-mock-' + targetDate.getTime() + j,
          clientName: client.name,
          clientPhone: client.phone,
          clientBirth: client.birth,
          clientObs: Math.random() > 0.7 ? "Prefere degradê bem disfarçado." : "",
          serviceId: service.id,
          serviceName: service.name,
          servicePrice: service.price,
          serviceDuration: service.duration,
          date: targetDate.toISOString(),
          time: time,
          professional: "César",
          status: status,
          createdAt: new Date(targetDate.getTime() - 2 * 3600000).toISOString() // 2 hours before
        });
      }
    }

    state.bookings = mockBookings;
    saveBookings();
  }

  // ── Render Director ──────────────────────────────────────────────────────
  async function renderAll() {
    // Refresh database view in state
    await loadDatabase();
    populateCalendarProfSelect();

    if (state.currentTab === 'tab-dashboard') {
      renderDashboard();
    } else if (state.currentTab === 'tab-calendar') {
      renderCalendarTab();
    } else if (state.currentTab === 'tab-services') {
      renderServicesTab();
    } else if (state.currentTab === 'tab-crm') {
      renderCRMTab();
    } else if (state.currentTab === 'tab-settings') {
      renderSettingsTab();
    }
  }

  // ── Navigation Tabs ──────────────────────────────────────────────────────
  function setupTabs() {
    const titles = {
      'tab-dashboard': 'Painel Geral',
      'tab-calendar': 'Agenda & Calendário',
      'tab-services': 'Serviços & Profissionais',
      'tab-crm': 'CRM & Cartão Fidelidade',
      'tab-settings': 'Configurações do Sistema'
    };

    document.querySelectorAll('.menu-item').forEach(button => {
      button.addEventListener('click', () => {
        const target = button.dataset.tab;
        
        // Remove active class
        document.querySelectorAll('.menu-item').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-panel').forEach(panel => panel.classList.remove('active'));
        
        // Add active class
        button.classList.add('active');
        $(target).classList.add('active');
        
        state.currentTab = target;
        $('page-title').textContent = titles[target];
        
        renderAll();
      });
    });
  }

  // ── UI Modal Manager ─────────────────────────────────────────────────────
  function setupModals() {
    // Open selectors
    $('btn-manual-booking').addEventListener('click', () => openModal('modal-manual-booking'));
    $('btn-add-service').addEventListener('click', () => {
      $('modal-service-title').textContent = "Adicionar Novo Serviço";
      $('service-edit-id').value = "";
      $('form-service').reset();
      $('service-img-preview').src = "./imagens_servicos/corte_degrade.webp";
      $('service-img-custom-opt').classList.add('hidden');
      $('service-img-custom-opt').value = "";
      openModal('modal-service');
    });

    $('btn-add-professional').addEventListener('click', () => {
      $('modal-prof-title').textContent = "Adicionar Novo Profissional";
      $('prof-edit-id').value = "";
      $('form-professional').reset();
      $('prof-img-preview').src = "./imagens_hero/cesar.webp";
      $('btn-prof-submit').textContent = "Adicionar Barbeiro";
      openModal('modal-professional');
    });

    // Close logic
    document.querySelectorAll('[data-close]').forEach(btn => {
      btn.addEventListener('click', () => {
        closeModal(btn.dataset.close);
      });
    });

    // Close on overlay click
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          closeModal(overlay.id);
        }
      });
    });
  }

  function openModal(id) {
    $(id).classList.add('active');
  }

  function closeModal(id) {
    $(id).classList.remove('active');
  }

  // ── Toast Notification & Audio Alerts ────────────────────────────────────
  function showToast(title, body) {
    const container = $('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast';
    
    toast.innerHTML = `
      <span class="toast-title">💈 ${title}</span>
      <span class="toast-body">${body}</span>
    `;
    
    container.appendChild(toast);
    playChime();
    
    // Auto dismiss
    setTimeout(() => {
      toast.classList.add('hiding');
      setTimeout(() => {
        toast.remove();
      }, 300);
    }, 5000);
  }

  // Synthesize beautiful luxurious chime sound programmatically
  function playChime() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc1.type = 'sine';
      osc2.type = 'triangle';
      
      // Elegant bell chime sound: Chord E5 (659.25Hz) and G#5 (830.61Hz)
      osc1.frequency.setValueAtTime(659.25, ctx.currentTime);
      osc2.frequency.setValueAtTime(830.61, ctx.currentTime);
      
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.2);
      
      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);
      
      osc1.start();
      osc2.start();
      osc1.stop(ctx.currentTime + 1.2);
      osc2.stop(ctx.currentTime + 1.2);
    } catch (e) {
      console.warn("AudioContext blocked by browser policy or unsupported:", e);
    }
  }

  // Multi-tab storage sync and alerts
  function setupLiveNotifications() {
    supabase.channel('admin-bookings')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'agendamentos' }, payload => {
        const newBooking = payload.new;
        showToast(
          "Novo Agendamento!",
          `<strong>${newBooking.clientName}</strong> reservou <strong>${newBooking.serviceName}</strong> às <strong>${newBooking.time}</strong>.`
        );

        // Update active notification badge
        const badge = $('notif-badge');
        let count = parseInt(badge.textContent || '0') + 1;
        badge.textContent = count;
        badge.classList.remove('hidden');
        
        // Refresh views
        renderAll();
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'agendamentos' }, payload => {
        renderAll();
      })
      .subscribe();

    $('btn-notification-bell').addEventListener('click', () => {
      const badge = $('notif-badge');
      badge.textContent = "0";
      badge.classList.add('hidden');
      
      // Simulates reading notifications
      showToast("Tudo Atualizado!", "Você visualizou todos os agendamentos recentes.");
    });
  }

  // ── Parse helpers ────────────────────────────────────────────────────────
  function parseLocalDate(dateStr) {
    if (!dateStr) return null;
    if (dateStr instanceof Date) return dateStr;
    if (typeof dateStr !== 'string') return new Date(dateStr);
    
    if (dateStr.includes('T')) {
      return new Date(dateStr);
    }
    
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      return new Date(year, month, day);
    }
    
    return new Date(dateStr);
  }

  function populateCalendarProfSelect() {
    const select = $('calendar-prof-select');
    if (!select) return;
    const currentVal = select.value || 'todos';
    select.innerHTML = '<option value="todos">Todos os Profissionais</option>';
    state.professionals.forEach(p => {
      if (p.active !== false) {
        const opt = document.createElement('option');
        opt.value = p.name;
        opt.textContent = p.name;
        select.appendChild(opt);
      }
    });
    select.value = currentVal;
  }

  function parsePrice(str) {
    if (!str) return 0;
    return parseFloat(str.replace('R$', '').replace(',', '.').trim());
  }

  function formatCurrency(val) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  }

  function getTodayString(d = new Date()) {
    return d.toDateString();
  }

  // ── TAB 1: RENDER DASHBOARD ──────────────────────────────────────────────
  function renderDashboard() {
    const todayStr = getTodayString();
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    // 1. Calculate metrics
    let monthlyRevenue = 0;
    let dailyRevenue = 0;
    let totalBookings = state.bookings.filter(b => b.status !== 'Cancelado').length;
    
    // CRM active client count
    const uniquePhones = new Set();
    state.bookings.forEach(b => {
      if (b.clientPhone) uniquePhones.add(b.clientPhone);
    });
    
    state.bookings.forEach(b => {
      const bDate = parseLocalDate(b.date);
      const isConfirmedOrCompleted = b.status === 'Confirmado' || b.status === 'Concluido';
      
      if (isConfirmedOrCompleted) {
        const val = parsePrice(b.servicePrice);
        
        // Month calc
        if (bDate.getMonth() === currentMonth && bDate.getFullYear() === currentYear) {
          monthlyRevenue += val;
        }
        
        // Daily calc
        if (bDate.toDateString() === todayStr) {
          dailyRevenue += val;
        }
      }
    });

    // Populate dashboard labels
    $('dashboard-monthly-revenue').textContent = formatCurrency(monthlyRevenue);
    $('dashboard-daily-revenue').textContent = formatCurrency(dailyRevenue);
    $('dashboard-total-bookings').textContent = totalBookings;
    $('dashboard-total-clients').textContent = uniquePhones.size;
    
    // Trends text updates
    const activeThisMonth = state.bookings.filter(b => {
      const bDate = parseLocalDate(b.date);
      return bDate.getMonth() === currentMonth && bDate.getFullYear() === currentYear;
    }).length;
    $('trend-bookings').textContent = `+${activeThisMonth} este mês`;

    // 2. Render Weekly Chart
    renderWeeklyChart();

    // 3. Render Popular Services
    renderPopularServices();

    // 4. Render Recent Bookings Table
    renderRecentBookingsTable();
  }

  function renderWeeklyChart() {
    const container = $('weekly-chart-container');
    if (!container) return;
    container.innerHTML = '';

    // Calculate billing per weekday for last 7 days
    const weekDaysShort = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];
    const daysData = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dStr = d.toDateString();
      
      let total = 0;
      state.bookings.forEach(b => {
        if (parseLocalDate(b.date).toDateString() === dStr && (b.status === 'Confirmado' || b.status === 'Concluido')) {
          total += parsePrice(b.servicePrice);
        }
      });

      daysData.push({
        label: weekDaysShort[d.getDay()],
        val: total,
        dateStr: d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
      });
    }

    // Determine max value for scale
    const maxVal = Math.max(...daysData.map(d => d.val), 50); // Min scale is R$ 50

    daysData.forEach(day => {
      const pct = (day.val / maxVal) * 100;
      
      const barWrap = document.createElement('div');
      barWrap.className = 'chart-bar-wrap';
      
      barWrap.innerHTML = `
        <div class="chart-bar-fill" style="height: ${pct}%;">
          <div class="chart-bar-tooltip">R$ ${day.val.toFixed(2)} (${day.dateStr})</div>
        </div>
        <div class="chart-label">${day.label}</div>
      `;
      
      container.appendChild(barWrap);
    });
  }

  function renderPopularServices() {
    const container = $('popular-services-list');
    if (!container) return;
    container.innerHTML = '';

    const counts = {};
    state.bookings.forEach(b => {
      if (b.status !== 'Cancelado') {
        counts[b.serviceName] = (counts[b.serviceName] || 0) + 1;
      }
    });

    // Transform to array
    const sorted = Object.keys(counts).map(name => ({
      name,
      count: counts[name]
    })).sort((a, b) => b.count - a.count).slice(0, 5); // top 5

    if (sorted.length === 0) {
      container.innerHTML = '<p class="status-hint" style="text-align:center;padding:20px 0;">Nenhum serviço agendado ainda.</p>';
      return;
    }

    const maxCount = Math.max(...sorted.map(s => s.count), 1);

    sorted.forEach(item => {
      const pct = (item.count / maxCount) * 100;
      
      const el = document.createElement('div');
      el.className = 'popular-item';
      
      el.innerHTML = `
        <div class="popular-item-info">
          <span class="popular-item-name">${item.name}</span>
          <span class="popular-item-count">${item.count} agend.</span>
        </div>
        <div class="popular-bar-track">
          <div class="popular-bar-fill" style="width: ${pct}%;"></div>
        </div>
      `;
      
      container.appendChild(el);
    });
  }

  function renderRecentBookingsTable() {
    const tbody = $('dashboard-recent-bookings-tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    // Sort by creation date or date desc, take 5
    const recent = [...state.bookings]
      .sort((a, b) => parseLocalDate(b.createdAt || b.date).getTime() - parseLocalDate(a.createdAt || a.date).getTime())
      .slice(0, 5);

    if (recent.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:30px;color:var(--text-muted);">Nenhum agendamento recente.</td></tr>';
      return;
    }

    recent.forEach(b => {
      const tr = document.createElement('tr');
      const bDate = parseLocalDate(b.date);
      const dateFormatted = `${String(bDate.getDate()).padStart(2,'0')}/${String(bDate.getMonth()+1).padStart(2,'0')} - ${b.time}`;
      
      tr.innerHTML = `
        <td data-label="Cliente">
          <div class="cell-user-info">
            <span class="cell-user-name">${b.clientName}</span>
            <span class="cell-user-phone">${b.clientPhone}</span>
          </div>
        </td>
        <td data-label="Serviço">${b.serviceName}</td>
        <td data-label="Data & Horário">${dateFormatted}</td>
        <td data-label="Profissional">${b.professional || 'César'}</td>
        <td data-label="Status"><span class="badge-status ${b.status.toLowerCase()}">${b.status}</span></td>
        <td data-label="Ações" style="text-align: right;">
          <button class="btn-text-link whatsapp" data-phone="${b.clientPhone}" data-name="${b.clientName}" data-service="${b.serviceName}" data-date="${bDate.toLocaleDateString('pt-BR')}" data-time="${b.time}">WhatsApp</button>
        </td>
      `;

      // Whatsapp click
      tr.querySelector('.whatsapp').addEventListener('click', (e) => {
        e.stopPropagation();
        openWhatsappOwnerMsg(e.target.dataset);
      });

      tbody.appendChild(tr);
    });

    $('btn-dashboard-view-all').onclick = () => {
      // Toggle to calendar tab
      $('btn-tab-calendar').click();
    };
  }

  function openWhatsappOwnerMsg(data) {
    const phone = '55' + data.phone.replace(/\D/g, '');
    const msg = encodeURIComponent(
      `Olá ${data.name}! Sou o César da Barbearia 💈\n\n` +
      `Estou entrando em contato para confirmar seu agendamento de *${data.service}* no dia *${data.date}* às *${data.time}*.\n\n` +
      `Confirmado? Te aguardo!`
    );
    window.open(`https://api.whatsapp.com/send?phone=${phone}&text=${msg}`, '_blank');
  }

  // ── TAB 2: CALENDAR & AGENDA ─────────────────────────────────────────────
  let agendaFilter = 'todos';

  function renderCalendarTab() {
    renderMiniPicker();
    renderDailyAgenda();
    
    // Setup filter button listeners inside tab-calendar
    document.querySelectorAll('.view-filters .btn-filter-status').forEach(btn => {
      btn.onclick = () => {
        document.querySelectorAll('.view-filters .btn-filter-status').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        agendaFilter = btn.dataset.filter;
        renderDailyAgenda();
      };
    });

    // professional filter
    $('calendar-prof-select').onchange = () => {
      renderDailyAgenda();
    };
  }

  // Render mini calendar picker in sidebar
  function renderMiniPicker() {
    const pDate = state.pickerDate;
    const sDate = state.selectedDate;
    
    const monthsName = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    
    $('picker-month-year').textContent = `${monthsName[pDate.getMonth()]} ${pDate.getFullYear()}`.toUpperCase();

    const grid = $('picker-days-grid');
    grid.innerHTML = '';

    const firstDay = new Date(pDate.getFullYear(), pDate.getMonth(), 1).getDay();
    const totalDays = new Date(pDate.getFullYear(), pDate.getMonth() + 1, 0).getDate();

    // Blanks
    for (let i = 0; i < firstDay; i++) {
      const cell = document.createElement('div');
      cell.className = 'picker-day-cell empty';
      grid.appendChild(cell);
    }

    // Days cells
    for (let d = 1; d <= totalDays; d++) {
      const currentCellDate = new Date(pDate.getFullYear(), pDate.getMonth(), d);
      const cell = document.createElement('button');
      cell.className = 'picker-day-cell';
      cell.textContent = d;

      // Has bookings marker
      const dStr = currentCellDate.toDateString();
      const dayBookings = state.bookings.filter(b => parseLocalDate(b.date).toDateString() === dStr && b.status !== 'Cancelado');
      if (dayBookings.length > 0) {
        cell.classList.add('has-bookings');
      }

      // Today
      if (currentCellDate.toDateString() === new Date().toDateString()) {
        cell.classList.add('today');
      }

      // Selected
      if (currentCellDate.toDateString() === sDate.toDateString()) {
        cell.classList.add('selected');
      }

      cell.onclick = () => {
        state.selectedDate = currentCellDate;
        renderMiniPicker();
        renderDailyAgenda();
      };

      grid.appendChild(cell);
    }

    // Nav selectors
    $('picker-prev').onclick = () => {
      state.pickerDate.setMonth(state.pickerDate.getMonth() - 1);
      renderMiniPicker();
    };
    $('picker-next').onclick = () => {
      state.pickerDate.setMonth(state.pickerDate.getMonth() + 1);
      renderMiniPicker();
    };
  }

  // Render Daily Agenda
  function renderDailyAgenda() {
    const container = $('bookings-agenda-container');
    if (!container) return;
    container.innerHTML = '';

    const sDate = state.selectedDate;
    const dateStr = sDate.toDateString();

    // Labels
    const daysWeekLong = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
    $('calendar-selected-date-label').textContent = `${daysWeekLong[sDate.getDay()]}, ${sDate.getDate()} de ${sDate.toLocaleDateString('pt-BR', { month: 'long' })}`;

    const selectedProf = $('calendar-prof-select').value;

    // Filter day bookings
    let dayBookings = state.bookings.filter(b => {
      const matchDate = parseLocalDate(b.date).toDateString() === dateStr;
      const matchProf = selectedProf === 'todos' || b.professional === selectedProf;
      const matchStatus = agendaFilter === 'todos' || b.status === agendaFilter;
      
      return matchDate && matchProf && matchStatus;
    });

    // Sort by time
    dayBookings.sort((a, b) => a.time.localeCompare(b.time));

    if (dayBookings.length === 0) {
      container.innerHTML = `
        <div class="no-bookings">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <h3>Nenhum Agendamento Encontrado</h3>
          <p style="font-size:12px;margin-top:4px;">Não há agendamentos cadastrados para este dia com os filtros selecionados.</p>
        </div>
      `;
      return;
    }

    dayBookings.forEach(b => {
      const card = document.createElement('div');
      card.className = 'agenda-item';
      
      // Render status indicators
      let actionsHTML = '';
      if (b.status === 'Confirmado' || b.status === 'Pendente') {
        actionsHTML = `
          <button class="btn-action-status conclude" data-id="${b.id}">Concluir</button>
          <button class="btn-action-status cancel" data-id="${b.id}">Cancelar</button>
        `;
      } else {
        // Concluded or Cancelled
        actionsHTML = `<span class="badge-status ${b.status.toLowerCase()}">${b.status}</span>`;
      }

      const hasObsHTML = b.clientObs ? `<div class="agenda-obs"><strong>Obs:</strong> ${b.clientObs}</div>` : '';

      card.innerHTML = `
        <div class="agenda-time">
          <span class="agenda-time-val">${b.time}</span>
          <span class="agenda-time-dur">${b.serviceDuration}</span>
        </div>
        <div class="agenda-detail">
          <div class="agenda-title-row">
            <span class="agenda-client-name">${b.clientName}</span>
            <span class="agenda-service-badge">${b.serviceName}</span>
          </div>
          <div class="agenda-meta-row">
            <span class="agenda-meta-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
              ${b.clientPhone}
            </span>
            <span class="agenda-meta-item">💈 ${b.professional || 'César'}</span>
            <span class="agenda-meta-item" style="color: var(--gold); font-weight:700;">${b.servicePrice}</span>
          </div>
          ${hasObsHTML}
        </div>
        <div class="agenda-actions">
          <div class="agenda-actions-row">
            ${actionsHTML}
            <button class="btn-action-icon whatsapp" data-phone="${b.clientPhone}" data-name="${b.clientName}" data-service="${b.serviceName}" data-date="${sDate.toLocaleDateString('pt-BR')}" data-time="${b.time}" title="Enviar WhatsApp">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
            </button>
          </div>
        </div>
      `;

      // Click handlers
      card.querySelectorAll('.btn-action-status').forEach(btn => {
        btn.onclick = () => {
          handleStatusChange(btn.dataset.id, btn.textContent);
        };
      });

      card.querySelector('.whatsapp').onclick = (e) => {
        const btn = e.currentTarget;
        openWhatsappOwnerMsg(btn.dataset);
      };

      container.appendChild(card);
    });
  }

  async function handleStatusChange(id, action) {
    const item = state.bookings.find(b => b.id === id);
    if (!item) return;

    let newStatus = item.status;

    if (action === 'Confirmar') {
      newStatus = 'Confirmado';
      showToast("Agendamento Confirmado", `Horário de ${item.clientName} às ${item.time} foi confirmado.`);
    } else if (action === 'Concluir') {
      newStatus = 'Concluido';
      
      // Auto register stamp in CRM fidelidade
      triggerFidelidadeStampAuto(item.clientPhone);

      showToast("Agendamento Concluído", `Corte de ${item.clientName} concluído com sucesso. Selo adicionado!`);
    } else if (action === 'Recusar' || action === 'Cancelar') {
      newStatus = 'Cancelado';
      showToast("Agendamento Cancelado", `Horário de ${item.clientName} às ${item.time} foi cancelado.`);
    }

    item.status = newStatus;
    
    // update supabase
    await supabase.from('agendamentos').update({ status: newStatus }).eq('id', id);

    renderAll();
  }

  // Automatic stamp generator in CRM when appointment is concluded
  function triggerFidelidadeStampAuto(phone) {
    const clientsStamps = JSON.parse(localStorage.getItem('cesar_barbearia_fidelidades') || '{}');
    const currentStamps = clientsStamps[phone] || 0;
    
    if (currentStamps < 10) {
      clientsStamps[phone] = currentStamps + 1;
      localStorage.setItem('cesar_barbearia_fidelidades', JSON.stringify(clientsStamps));
    }
  }

  // Manual booking submission inside modal
  function setupManualBookingForm() {
    const select = $('manual-service-select');
    
    // Fill services select options
    function populateServicesSelect() {
      select.innerHTML = '';
      state.services.forEach(s => {
        const opt = document.createElement('option');
        opt.value = s.id;
        opt.textContent = `${s.name} (${s.price})`;
        select.appendChild(opt);
      });
    }

    // Fill professionals select options
    function populateProfessionalsSelect() {
      const profSelect = $('manual-prof-select');
      if (!profSelect) return;
      profSelect.innerHTML = '';
      state.professionals.forEach(p => {
        if (p.active !== false) {
          const opt = document.createElement('option');
          opt.value = p.name;
          opt.textContent = p.name;
          profSelect.appendChild(opt);
        }
      });
    }

    // Check available time slots dynamically
    function updateManualTimeSlots() {
      const timeSelect = $('manual-time');
      if (!timeSelect) return;
      
      const dVal = $('manual-date').value;
      const inputProf = $('manual-prof-select').value;
      if (!dVal || !inputProf) return;
      
      const inputDate = parseLocalDate(dVal);
      const dStr = inputDate.toDateString();
      
      const bookedTimes = new Set(
        state.bookings
          .filter(b => {
            if (!b.date || !b.time || b.status === 'Cancelado') return false;
            const bookingDate = parseLocalDate(b.date);
            return bookingDate.toDateString() === dStr && b.professional === inputProf;
          })
          .map(b => b.time)
      );
      
      const config = state.config || {};
      const startHour = parseInt(config.timeStart ? config.timeStart.split(':')[0] : 9);
      const endHour = parseInt(config.timeEnd ? config.timeEnd.split(':')[0] : 20);
      const intervalMin = config.interval !== undefined ? config.interval : 60;
      
      const slots = [];
      const current = new Date();
      current.setHours(startHour, 0, 0, 0);
      
      const endLimit = new Date();
      endLimit.setHours(endHour, 0, 0, 0);
      
      while (current < endLimit) {
        const h = String(current.getHours()).padStart(2, '0');
        const m = String(current.getMinutes()).padStart(2, '0');
        const timeStr = `${h}:${m}`;
        
        if (current.getHours() !== 12) {
          slots.push(timeStr);
        }
        
        current.setMinutes(current.getMinutes() + intervalMin);
      }
      
      if (slots.length === 0) {
        slots.push("09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00");
      }
      
      const previousVal = timeSelect.value;
      timeSelect.innerHTML = '';
      
      slots.forEach(t => {
        const opt = document.createElement('option');
        opt.value = t;
        
        const isBooked = bookedTimes.has(t);
        if (isBooked) {
          opt.textContent = `${t} (Ocupado)`;
          opt.disabled = true;
          opt.style.color = '#888';
        } else {
          opt.textContent = t;
        }
        
        timeSelect.appendChild(opt);
      });
      
      if (previousVal && Array.from(timeSelect.options).some(o => o.value === previousVal && !o.disabled)) {
        timeSelect.value = previousVal;
      } else {
        const firstEnabled = Array.from(timeSelect.options).find(o => !o.disabled);
        if (firstEnabled) {
          timeSelect.value = firstEnabled.value;
        }
      }
    }

    // Modal click trigger should populate select options
    $('btn-manual-booking').addEventListener('click', () => {
      populateServicesSelect();
      populateProfessionalsSelect();
      updateManualTimeSlots();
    });

    // Set today as default date value
    $('manual-date').value = new Date().toISOString().split('T')[0];
    
    // Watch date and professional changes
    $('manual-date').addEventListener('change', updateManualTimeSlots);
    $('manual-prof-select').addEventListener('change', updateManualTimeSlots);

    $('form-manual-booking').onsubmit = async (e) => {
      e.preventDefault();
      
      const sId = select.value;
      const service = state.services.find(s => s.id === sId);

      const dVal = $('manual-date').value;
      const inputTime = $('manual-time').value;
      const inputProf = $('manual-prof-select').value;
      const inputDate = parseLocalDate(dVal);

      // Verificar colisão de horário para o barbeiro selecionado
      const hasCollision = state.bookings.some(b => {
        if (!b.date || !b.time || b.status === 'Cancelado') return false;
        const bookingDate = parseLocalDate(b.date);
        return bookingDate.toDateString() === inputDate.toDateString() &&
               b.time === inputTime &&
               b.professional === inputProf;
      });

      if (hasCollision) {
        const confirmOverbook = confirm(`Atenção: O profissional ${inputProf} já possui um agendamento ativo para às ${inputTime} no dia ${inputDate.toLocaleDateString('pt-BR')}.\nDeseja registrar o agendamento mesmo assim?`);
        if (!confirmOverbook) return;
      }

      const clientName = $('manual-client-name').value.trim();
      const clientPhone = $('manual-client-phone').value.trim();
      const clientObs = $('manual-obs').value.trim();

      try {
        const { error } = await supabase.from('agendamentos').insert([{
          clientName: clientName,
          clientPhone: clientPhone,
          clientBirth: '',
          clientObs: clientObs,
          serviceId: sId,
          serviceName: service.name,
          servicePrice: service.price,
          serviceDuration: service.duration,
          date: dVal, // YYYY-MM-DD
          time: inputTime,
          professional: inputProf,
          status: 'Confirmado'
        }]);

        if (error) throw error;
        
        showToast("Agendamento Registrado", `Cliente ${clientName} agendado para às ${inputTime} com sucesso.`);
      } catch (err) {
        console.error("Erro ao salvar agendamento manual:", err);
        alert("Erro ao registrar agendamento. Tente novamente.");
        return;
      }

      closeModal('modal-manual-booking');
      $('form-manual-booking').reset();
      
      // Select the day of manual booking
      state.selectedDate = new Date(dVal);
      state.pickerDate = new Date(dVal);

      renderAll();
    };
  }

  // ── TAB 3: SERVICES & PROFESSIONALS ADMIN ────────────────────────────────
  function setupServicesAdmin() {
    // Configurar preview da imagem do serviço ao alterar o select
    const serviceImgSelect = $('service-img');
    const serviceImgPreview = $('service-img-preview');
    if (serviceImgSelect && serviceImgPreview) {
      serviceImgSelect.addEventListener('change', (e) => {
        serviceImgPreview.src = e.target.value;
      });
    }

    // Configurar upload de imagem customizada para serviço
    const serviceImageInput = $('service-image-input');
    const serviceUploadBtn = $('btn-upload-service-img');
    const serviceCustomOpt = $('service-img-custom-opt');

    if (serviceUploadBtn && serviceImageInput) {
      serviceUploadBtn.addEventListener('click', () => serviceImageInput.click());
      
      serviceImageInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          if (file.size > 1024 * 1024) {
            alert("A imagem é muito grande. O limite máximo é 1MB.");
            return;
          }
          const reader = new FileReader();
          reader.onload = (event) => {
            const base64Str = event.target.result;
            serviceImgPreview.src = base64Str;
            
            // Colocar o valor base64 na opção customizada do select e selecioná-la
            if (serviceCustomOpt) {
              serviceCustomOpt.value = base64Str;
              serviceCustomOpt.classList.remove('hidden');
              serviceImgSelect.value = base64Str;
            }
          };
          reader.readAsDataURL(file);
        }
      });
    }

    $('form-service').onsubmit = (e) => {
      e.preventDefault();
      
      const editId = $('service-edit-id').value;
      const sName = $('service-name').value.trim();
      const sPrice = $('service-price').value.trim();
      const sDuration = $('service-duration').value;
      const sImg = $('service-img').value || $('service-img-preview').src;

      if (editId) {
        // Edit service
        const item = state.services.find(s => s.id === editId);
        if (item) {
          item.name = sName;
          item.price = sPrice.startsWith('R$') ? sPrice : `R$ ${sPrice}`;
          item.duration = sDuration;
          item.img = sImg;
          showToast("Serviço Atualizado", `O serviço "${sName}" foi atualizado.`);
        }
      } else {
        // Add new service
        const newS = {
          id: 'serv-' + Date.now(),
          name: sName,
          price: sPrice.startsWith('R$') ? sPrice : `R$ ${sPrice}`,
          duration: sDuration,
          img: sImg
        };
        state.services.push(newS);
        showToast("Serviço Adicionado", `O serviço "${sName}" foi criado e já está disponível para agendamentos.`);
      }

      saveServices();
      closeModal('modal-service');
      renderAll();
    };

    // Configurar upload de imagem para o profissional
    const imageInput = $('prof-image-input');
    const uploadBtn = $('btn-upload-prof-img');
    const imgPreview = $('prof-img-preview');

    if (uploadBtn && imageInput) {
      uploadBtn.addEventListener('click', () => imageInput.click());
      
      imageInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          if (file.size > 1024 * 1024) {
            alert("A imagem é muito grande. O limite máximo é 1MB.");
            return;
          }
          const reader = new FileReader();
          reader.onload = (event) => {
            imgPreview.src = event.target.result;
          };
          reader.readAsDataURL(file);
        }
      });
    }

    $('form-professional').onsubmit = (e) => {
      e.preventDefault();
      
      const editId = $('prof-edit-id').value;
      const pName = $('prof-name').value.trim();
      const pSpec = $('prof-specialty').value.trim() || 'Barbeiro';
      const pImg = $('prof-img-preview').src;

      if (editId) {
        // Modo Edição
        const prof = state.professionals.find(p => p.id === editId);
        if (prof) {
          prof.name = pName;
          prof.specialty = pSpec;
          prof.img = pImg;
          showToast("Profissional Atualizado", `O profissional "${pName}" foi atualizado.`);
        }
      } else {
        // Modo Adicionar
        const newP = {
          id: 'prof-' + Date.now(),
          name: pName,
          specialty: pSpec,
          img: pImg || './imagens_hero/cesar.webp',
          active: true
        };
        state.professionals.push(newP);
        showToast("Barbeiro Adicionado", `Profissional ${pName} foi integrado à equipe.`);
      }

      saveProfessionals();
      closeModal('modal-professional');
      renderAll();
    };
  }

  function renderServicesTab() {
    const grid = $('services-admin-grid');
    if (!grid) return;
    grid.innerHTML = '';

    state.services.forEach(s => {
      const card = document.createElement('div');
      card.className = 'service-admin-card';
      
      card.innerHTML = `
        <div class="service-admin-thumb">
          <img src="${s.img}" alt="${s.name}">
        </div>
        <div class="service-admin-details">
          <h3 class="service-admin-name">${s.name}</h3>
          <span class="service-admin-price">${s.price}</span>
          <span class="service-admin-meta">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            ${s.duration}
          </span>
        </div>
        <div class="service-admin-actions">
          <button class="btn-action-icon edit-btn" title="Editar Serviço">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button class="btn-action-icon delete-btn" title="Excluir Serviço" style="color: var(--color-red);">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
        </div>
      `;

      // Edit Click
      card.querySelector('.edit-btn').onclick = () => {
        $('modal-service-title').textContent = "Editar Serviço";
        $('service-edit-id').value = s.id;
        $('service-name').value = s.name;
        $('service-price').value = s.price;
        $('service-duration').value = s.duration;

        // Configurar a imagem no preview e no select
        const selectEl = $('service-img');
        const customOpt = $('service-img-custom-opt');
        const previewEl = $('service-img-preview');

        previewEl.src = s.img || "./imagens_servicos/corte_degrade.webp";

        // Verificar se s.img é uma das opções padrões (presets)
        const presetValues = Array.from(selectEl.options)
          .filter(opt => opt !== customOpt)
          .map(opt => opt.value);

        if (presetValues.includes(s.img)) {
          selectEl.value = s.img;
          customOpt.classList.add('hidden');
          customOpt.value = "";
        } else {
          // Imagem customizada carregada (Base64)
          customOpt.value = s.img;
          customOpt.classList.remove('hidden');
          selectEl.value = s.img;
        }

        openModal('modal-service');
      };

      // Delete Click
      card.querySelector('.delete-btn').onclick = async () => {
        if (confirm(`Tem certeza que deseja excluir o serviço "${s.name}"? Isso impedirá novos agendamentos para ele.`)) {
          const { error } = await supabase.from('servicos').delete().eq('id', s.id);
          if (error) {
            console.error("Erro ao deletar serviço no Supabase:", error);
            alert("Erro ao deletar serviço. Tente novamente.");
            return;
          }
          state.services = state.services.filter(item => item.id !== s.id);
          showToast("Serviço Removido", `O serviço "${s.name}" foi excluído.`);
          renderAll();
        }
      };

      grid.appendChild(card);
    });

    // Render Professionals list
    const profList = $('professionals-admin-list');
    profList.innerHTML = '';

    state.professionals.forEach(p => {
      const card = document.createElement('div');
      card.className = 'prof-admin-card';

      card.innerHTML = `
        <div class="prof-admin-info">
          <img src="${p.img}" alt="${p.name}" class="prof-admin-avatar">
          <div class="prof-admin-details">
            <h3>${p.name}</h3>
            <span>${p.specialty}</span>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:12px;">
          <span class="prof-admin-status active">Ativo</span>
          <div class="prof-admin-actions">
            <button class="btn-action-icon edit-prof-btn" title="Editar Profissional">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button class="btn-action-icon delete-prof-btn" style="color:var(--color-red);" title="Remover Profissional">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
          </div>
        </div>
      `;

      // Clique para editar profissional
      card.querySelector('.edit-prof-btn').onclick = () => {
        $('modal-prof-title').textContent = "Editar Profissional";
        $('prof-edit-id').value = p.id;
        $('prof-name').value = p.name;
        $('prof-specialty').value = p.specialty || '';
        $('prof-img-preview').src = p.img || './imagens_hero/cesar.webp';
        $('btn-prof-submit').textContent = "Salvar Alterações";
        openModal('modal-professional');
      };

      card.querySelector('.delete-prof-btn').onclick = async () => {
        if (p.id === 'cesar') {
          alert("Não é possível excluir o profissional principal (César).");
          return;
        }
        if (confirm(`Deseja mesmo remover o barbeiro ${p.name} da equipe?`)) {
          const { error } = await supabase.from('profissionais').delete().eq('id', p.id);
          if (error) {
            console.error("Erro ao deletar profissional no Supabase:", error);
            alert("Erro ao deletar profissional. Tente novamente.");
            return;
          }
          state.professionals = state.professionals.filter(item => item.id !== p.id);
          showToast("Barbeiro Removido", `${p.name} foi descadastrado.`);
          renderAll();
        }
      };

      profList.appendChild(card);
    });
  }

  // ── TAB 4: CRM & FIDELIDADE ADMIN ────────────────────────────────────────
  function setupCRMAdmin() {
    $('crm-search-input').oninput = (e) => {
      state.crmSearchQuery = e.target.value.toLowerCase();
      renderCRMTab();
    };
  }

  function renderCRMTab() {
    const tbody = $('crm-clients-tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    // Compile customer base from bookings
    const customersMap = {};

    state.bookings.forEach(b => {
      const phone = b.clientPhone;
      if (!phone) return;

      if (!customersMap[phone]) {
        customersMap[phone] = {
          name: b.clientName,
          phone: phone,
          birth: b.clientBirth || '—',
          visits: 0,
          lastBookingDate: null,
          lastBookingStr: '—'
        };
      }

      // If status is completed, add count
      if (b.status === 'Concluido') {
        customersMap[phone].visits++;
      }

      // Check last booking date
      const bDate = parseLocalDate(b.date);
      if (!customersMap[phone].lastBookingDate || bDate > customersMap[phone].lastBookingDate) {
        customersMap[phone].lastBookingDate = bDate;
        customersMap[phone].lastBookingStr = `${bDate.toLocaleDateString('pt-BR')} às ${b.time}`;
      }
    });

    const customers = Object.values(customersMap);
    
    // Filter by search
    const filtered = customers.filter(c => {
      return c.name.toLowerCase().includes(state.crmSearchQuery) || c.phone.includes(state.crmSearchQuery);
    });

    $('crm-total-count').textContent = customers.length;

    if (filtered.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:30px;color:var(--text-muted);">Nenhum cliente cadastrado ou correspondente à busca.</td></tr>';
      return;
    }

    // Read manual fidelidade stamp values
    const clientFidelidades = JSON.parse(localStorage.getItem('cesar_barbearia_fidelidades') || '{}');

    filtered.forEach(c => {
      const tr = document.createElement('tr');
      
      // Calculate active stamps count: uses local storage override, fallback to completed visits % 10
      const stamps = clientFidelidades[c.phone] !== undefined ? clientFidelidades[c.phone] : (c.visits % 10);

      tr.innerHTML = `
        <td data-label="Cliente" style="font-weight:600;">${c.name}</td>
        <td data-label="WhatsApp">${c.phone}</td>
        <td data-label="Nascimento">${c.birth}</td>
        <td data-label="Visitas" style="font-weight:700;color:var(--gold);">${c.visits} cortes</td>
        <td data-label="Último Agendamento" style="font-size:12px;color:var(--text-muted);">${c.lastBookingStr}</td>
        <td data-label="Fidelidade">
          <span class="crm-fidelidade-badge">👑 ${stamps}/10</span>
        </td>
        <td data-label="Ações" style="text-align: right;">
          <button class="btn-primary loyalty-card-btn" data-phone="${c.phone}" data-name="${c.name}">Fidelidade</button>
        </td>
      `;

      tr.querySelector('.loyalty-card-btn').onclick = (e) => {
        const btn = e.currentTarget;
        openLoyaltyCardModal(btn.dataset.phone, btn.dataset.name);
      };

      tbody.appendChild(tr);
    });
  }

  // Interactive Loyalty stamp pop-up
  function openLoyaltyCardModal(phone, name) {
    $('loyalty-client-name').textContent = name;
    $('loyalty-client-phone').textContent = phone;
    
    const stampsGrid = $('loyalty-stamps-grid');
    
    function renderStamps() {
      stampsGrid.innerHTML = '';
      
      const clientFidelidades = JSON.parse(localStorage.getItem('cesar_barbearia_fidelidades') || '{}');
      const stamps = clientFidelidades[phone] !== undefined ? clientFidelidades[phone] : 0;

      for (let i = 1; i <= 10; i++) {
        const slot = document.createElement('div');
        slot.className = 'stamp-slot';
        
        if (i <= stamps) {
          slot.classList.add('stamped');
          slot.textContent = '👑';
        } else {
          slot.textContent = i;
        }
        
        stampsGrid.appendChild(slot);
      }

      const diff = 10 - stamps;
      const hint = $('loyalty-status-message');
      
      if (diff === 0) {
        hint.innerHTML = '<span style="color:var(--color-green);font-weight:700;">🎁 PARABÉNS! O cliente completou o cartão fidelidade e ganhou um corte grátis!</span>';
        $('btn-loyalty-redeem').classList.remove('hidden');
        $('btn-loyalty-add-stamp').classList.add('hidden');
      } else {
        hint.textContent = `Faltam ${diff} selos para o cliente ganhar um corte cortesia.`;
        $('btn-loyalty-redeem').classList.add('hidden');
        $('btn-loyalty-add-stamp').classList.remove('hidden');
      }
    }

    renderStamps();
    openModal('modal-loyalty-card');

    // Button Add Stamp
    $('btn-loyalty-add-stamp').onclick = () => {
      const clientFidelidades = JSON.parse(localStorage.getItem('cesar_barbearia_fidelidades') || '{}');
      const stamps = clientFidelidades[phone] !== undefined ? clientFidelidades[phone] : 0;

      if (stamps < 10) {
        clientFidelidades[phone] = stamps + 1;
        localStorage.setItem('cesar_barbearia_fidelidades', JSON.stringify(clientFidelidades));
        playChime();
        renderStamps();
        renderCRMTab();
        showToast("Carimbo Adicionado", `Cartão fidelidade de ${name} carimbado.`);
      }
    };

    // Button Redeem Reward
    $('btn-loyalty-redeem').onclick = () => {
      const clientFidelidades = JSON.parse(localStorage.getItem('cesar_barbearia_fidelidades') || '{}');
      clientFidelidades[phone] = 0; // reset
      localStorage.setItem('cesar_barbearia_fidelidades', JSON.stringify(clientFidelidades));
      
      playChime();
      renderStamps();
      renderCRMTab();
      
      alert(`Recompensa resgatada com sucesso! Dê baixa no corte gratuito de ${name}.`);
      showToast("Prêmio Resgatado!", `Corte cortesia resgatado para ${name}. Cartão fidelidade reiniciado.`);
      closeModal('modal-loyalty-card');
    };

    // Button Reset Card
    $('btn-loyalty-reset').onclick = () => {
      if (confirm(`Deseja mesmo zerar o cartão fidelidade de ${name}?`)) {
        const clientFidelidades = JSON.parse(localStorage.getItem('cesar_barbearia_fidelidades') || '{}');
        clientFidelidades[phone] = 0;
        localStorage.setItem('cesar_barbearia_fidelidades', JSON.stringify(clientFidelidades));
        renderStamps();
        renderCRMTab();
        showToast("Cartão Reiniciado", `Cartão de ${name} foi resetado.`);
      }
    };
  }

  // ── TAB 5: CONFIGURAÇÕES E PERSONALIZAÇÃO (AGENDAI INSPIRED) ─────────────
  let selectedTheme = 'gold';

  function setupSettingsAdmin() {
    // Theme options click handlers
    document.querySelectorAll('.btn-theme-selector').forEach(btn => {
      btn.onclick = () => {
        document.querySelectorAll('.btn-theme-selector').forEach(b => {
          b.classList.remove('active');
          b.style.borderColor = 'transparent';
        });
        btn.classList.add('active');
        selectedTheme = btn.dataset.color;
        
        // Dynamic preview
        const t = themes[selectedTheme] || themes.gold;
        btn.style.borderColor = t.primary;
        
        applyTheme(selectedTheme);
      };
    });

    $('form-settings').addEventListener('submit', async (e) => {
      e.preventDefault();

      // Read days checkboxes
      const openDays = [];
      for (let i = 0; i <= 6; i++) {
        if ($(`set-day-${i}`).checked) {
          openDays.push(i);
        }
      }

      const config = {
        name: $('set-barber-name').value.trim(),
        phone: $('set-barber-phone').value.trim(),
        address: $('set-barber-address').value.trim(),
        instagram: $('set-barber-instagram').value.trim(),
        theme: selectedTheme,
        openDays: openDays,
        timeStart: $('set-time-start').value,
        timeEnd: $('set-time-end').value,
        interval: parseInt($('set-time-interval').value)
      };

      localStorage.setItem('cesar_barbearia_configuracoes', JSON.stringify(config));
      state.config = config;

      // Update header elements
      const titleEl = $q('.brand-info h2');
      if (titleEl) {
        titleEl.textContent = config.name;
      }
      
      showToast("Configurações Salvas", "As preferências da barbearia foram atualizadas e sincronizadas com a página do cliente.");
      
      // Sync notifications
      localStorage.setItem('cesar_barbearia_config_alterada', JSON.stringify({ timestamp: Date.now() }));
      
      renderAll();
    });
  }

  function renderSettingsTab() {
    const config = state.config;
    if (!config) return;

    $('set-barber-name').value = config.name || "César Barbearia";
    $('set-barber-phone').value = config.phone || "(11) 99999-9999";
    $('set-barber-address').value = config.address || "";
    $('set-barber-instagram').value = config.instagram || "";
    
    // Set checkboxes
    for (let i = 0; i <= 6; i++) {
      const checkbox = $(`set-day-${i}`);
      if (checkbox) {
        checkbox.checked = config.openDays.includes(i);
      }
    }

    $('set-time-start').value = config.timeStart || "09:00";
    $('set-time-end').value = config.timeEnd || "20:00";
    $('set-time-interval').value = config.interval !== undefined ? config.interval : 60;

    // Select color theme button
    selectedTheme = config.theme || 'gold';
    document.querySelectorAll('.btn-theme-selector').forEach(btn => {
      if (btn.dataset.color === selectedTheme) {
        btn.classList.add('active');
        const t = themes[selectedTheme];
        btn.style.borderColor = t.primary;
      } else {
        btn.classList.remove('active');
        btn.style.borderColor = 'transparent';
      }
    });
  }

  // Initialize Panel
  init();

});
