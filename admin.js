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
    crmSearchQuery: '',
    selectedProfFilter: 'todos',
    dashboardViewMode: 'upcoming'
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

  function lightenDarkenColor(col, amt) {
    if (!col || col[0] !== '#') return col;
    try {
      let usePound = true;
      col = col.slice(1);
      let num = parseInt(col, 16);
      let r = (num >> 16) + amt;
      if (r > 255) r = 255;
      else if (r < 0) r = 0;
      let g = ((num >> 8) & 0x00FF) + amt;
      if (g > 255) g = 255;
      else if (g < 0) g = 0;
      let b = (num & 0x0000FF) + amt;
      if (b > 255) b = 255;
      else if (b < 0) b = 0;
      return "#" + (b | (g << 8) | (r << 16)).toString(16).padStart(6, '0');
    } catch(e) {
      return "#" + col;
    }
  }

  function applyTheme(themeKey) {
    let t = themes.gold;
    let customProfile = null;
    let customCover = null;
    
    try {
      if (themeKey && themeKey.startsWith('{')) {
        const themeConfig = JSON.parse(themeKey);
        t = {
          primary: themeConfig.borderColor || '#C8922A',
          light: themeConfig.borderColor || '#E0A83A',
          gradient: `linear-gradient(135deg, ${themeConfig.borderColor || '#E0A83A'} 0%, ${themeConfig.borderColor || '#B8801A'} 100%)`,
          border: themeConfig.borderColor || 'rgba(200, 146, 42, 0.2)',
          borderCard: themeConfig.borderColor || 'rgba(200, 146, 42, 0.25)',
          text: themeConfig.textColor || '#FFFFFF',
          bg: themeConfig.bgColor || '#030304'
        };
        customProfile = themeConfig.profileImg;
        customCover = themeConfig.coverImg;
      } else {
        t = themes[themeKey] || themes.gold;
      }
    } catch (e) {
      console.error("Error parsing theme JSON:", e);
      t = themes[themeKey] || themes.gold;
    }

    document.documentElement.style.setProperty('--gold', t.primary);
    document.documentElement.style.setProperty('--gold-light', t.light || t.primary);
    document.documentElement.style.setProperty('--gold-gradient', t.gradient || `linear-gradient(135deg, ${t.primary} 0%, ${t.primary} 100%)`);
    document.documentElement.style.setProperty('--border', t.border || 'rgba(255,255,255,0.1)');
    document.documentElement.style.setProperty('--border-card', t.borderCard || 'rgba(255,255,255,0.12)');

    if (t.text) {
      document.documentElement.style.setProperty('--text', t.text);
    }
    if (t.bg) {
      document.documentElement.style.setProperty('--bg', t.bg);
      document.documentElement.style.setProperty('--bg-card', lightenDarkenColor(t.bg, 8));
      document.documentElement.style.setProperty('--bg-input', lightenDarkenColor(t.bg, 14));
      document.documentElement.style.setProperty('--bg-sidebar', lightenDarkenColor(t.bg, 3));
    } else {
      document.documentElement.style.removeProperty('--text');
      document.documentElement.style.removeProperty('--bg');
      document.documentElement.style.removeProperty('--bg-card');
      document.documentElement.style.removeProperty('--bg-input');
      document.documentElement.style.removeProperty('--bg-sidebar');
    }

    if (customProfile) {
      document.querySelectorAll('.profile-avatar, .settings-profile-avatar').forEach(img => {
        img.src = customProfile;
      });
    } else {
      document.querySelectorAll('.profile-avatar, .settings-profile-avatar').forEach(img => {
        img.src = './imagens_hero/cesar.webp';
      });
    }
  }

  // ── Bootstrapping & Initial Loading ──────────────────────────────────────
  async function init() {
    await loadDatabase();
    
    // Seed mock data if database is empty
    if (state.bookings.length === 0) {
      await seedMockData();
    }
    
    setupTabs();
    setupDashboard();
    setupMobileSidebar();
    setupModals();
    setupLiveNotifications();
    setupManualBookingForm();
    setupServicesAdmin();
    setupCRMAdmin();
    setupSettingsAdmin();
    
    // Initial Render
    renderAll();

    // Setup automatic queue updates every 30 seconds
    setInterval(() => {
      if (state.currentTab === 'tab-dashboard') {
        renderDashboard();
      }
    }, 30000);

    // Close dropdowns on outside click
    document.addEventListener('click', () => {
      const dd = document.getElementById('global-actions-dropdown');
      if (dd) dd.classList.add('hidden');
    });

    // Create the global dropdown menu and append to body
    createGlobalActionsDropdown();
  }

  function createGlobalActionsDropdown() {
    if (document.getElementById('global-actions-dropdown')) return;

    const globalDropdown = document.createElement('div');
    globalDropdown.className = 'actions-dropdown hidden';
    globalDropdown.id = 'global-actions-dropdown';
    globalDropdown.innerHTML = `
      <button class="dropdown-item conclude">Concluído</button>
      <button class="dropdown-item pending">Pendente</button>
      <button class="dropdown-item cancel">Cancelado</button>
    `;
    document.body.appendChild(globalDropdown);

    globalDropdown.querySelector('.conclude').onclick = (e) => {
      e.stopPropagation();
      const id = globalDropdown.dataset.id;
      globalDropdown.classList.add('hidden');
      handleStatusChange(id, 'Concluído');
    };
    globalDropdown.querySelector('.pending').onclick = (e) => {
      e.stopPropagation();
      const id = globalDropdown.dataset.id;
      globalDropdown.classList.add('hidden');
      handleStatusChange(id, 'Pendente');
    };
    globalDropdown.querySelector('.cancel').onclick = (e) => {
      e.stopPropagation();
      const id = globalDropdown.dataset.id;
      globalDropdown.classList.add('hidden');
      handleStatusChange(id, 'Cancelado');
    };

    // Close global dropdown when the upcoming list is scrolled
    document.addEventListener('scroll', (e) => {
      if (e.target && e.target.id === 'dashboard-upcoming-list') {
        globalDropdown.classList.add('hidden');
      }
    }, true); // Use capture phase because scroll events do not bubble
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

    // Garantir que o serviço interno de bloqueio está inserido no banco para não violar a chave estrangeira
    const hasBloqueio = state.services.some(s => s.id === 'bloqueio');
    if (!hasBloqueio) {
      const bloqueioService = {
        id: 'bloqueio',
        name: 'Bloqueio de Agenda',
        price: 'R$ 0,00',
        duration: '60 min',
        img: ''
      };
      state.services.push(bloqueioService);
      supabase.from('servicos').insert([bloqueioService]).then(({ error }) => {
        if (error) {
          console.error("Erro ao registrar serviço de bloqueio no Supabase:", error);
        }
      });
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
    renderProfessionalFilters();

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
        
        // Close mobile sidebar drawer if open
        const sidebar = $('admin-sidebar');
        const overlay = $('sidebar-overlay');
        if (sidebar && sidebar.classList.contains('active')) {
          sidebar.classList.remove('active');
          overlay.classList.remove('active');
        }
        
        renderAll();
      });
    });
  }

  // ── UI Modal Manager ─────────────────────────────────────────────────────
  function setupModals() {
    // Open selectors
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
    playNotificationSound();
    
    // Auto dismiss
    setTimeout(() => {
      toast.classList.add('hiding');
      setTimeout(() => {
        toast.remove();
      }, 300);
    }, 5000);
  }

  // Synthesize beautiful notification sounds programmatically
  function playNotificationSound(forcePlay = false) {
    const isEnabled = localStorage.getItem('cesar_notif_enabled') !== 'false';
    if (!isEnabled && !forcePlay) return;

    const soundType = localStorage.getItem('cesar_notif_sound') || 'chime';

    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      
      const t = ctx.currentTime;
      gain.connect(ctx.destination);
      osc1.connect(gain);
      osc2.connect(gain);

      if (soundType === 'chime') {
        osc1.type = 'sine'; osc2.type = 'triangle';
        osc1.frequency.setValueAtTime(659.25, t); // E5
        osc2.frequency.setValueAtTime(830.61, t); // G#5
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.12, t + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 1.2);
        osc1.start(t); osc2.start(t);
        osc1.stop(t + 1.2); osc2.stop(t + 1.2);
      } else if (soundType === 'bell') {
        osc1.type = 'sine'; osc2.type = 'sine';
        osc1.frequency.setValueAtTime(1046.50, t); // C6
        osc2.frequency.setValueAtTime(1318.51, t); // E6
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.15, t + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 1.5);
        osc1.start(t); osc2.start(t);
        osc1.stop(t + 1.5); osc2.stop(t + 1.5);
      } else if (soundType === 'retro') {
        osc1.type = 'square'; osc2.type = 'square';
        osc1.frequency.setValueAtTime(440, t); // A4
        osc2.frequency.setValueAtTime(880, t); // A5
        gain.gain.setValueAtTime(0, t);
        gain.gain.setValueAtTime(0.05, t);
        gain.gain.setValueAtTime(0, t + 0.1);
        gain.gain.setValueAtTime(0.05, t + 0.15);
        gain.gain.setValueAtTime(0, t + 0.25);
        osc1.start(t); osc2.start(t);
        osc1.stop(t + 0.3); osc2.stop(t + 0.3);
      } else if (soundType === 'digital') {
        osc1.type = 'sawtooth'; osc2.type = 'sine';
        osc1.frequency.setValueAtTime(800, t);
        osc1.frequency.linearRampToValueAtTime(1200, t + 0.1);
        osc2.frequency.setValueAtTime(1200, t);
        osc2.frequency.linearRampToValueAtTime(1600, t + 0.1);
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.08, t + 0.05);
        gain.gain.linearRampToValueAtTime(0, t + 0.2);
        osc1.start(t); osc2.start(t);
        osc1.stop(t + 0.2); osc2.stop(t + 0.2);
      }
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

  function getBookingStatus(booking) {
    if (booking.status !== 'Confirmado') {
      return booking.status;
    }
    const bDate = parseLocalDate(booking.date);
    if (!bDate) return 'Confirmado';
    const [hours, mins] = booking.time.split(':').map(Number);
    bDate.setHours(hours, mins, 0, 0);

    const durationMin = parseInt(booking.serviceDuration) || 30;
    const expirationTime = bDate.getTime() + (durationMin * 60 * 1000);
    const nowMs = new Date().getTime();

    if (nowMs > expirationTime) {
      return 'Pendente';
    }
    return 'Confirmado';
  }

  function getDelayTimeStr(booking) {
    const bDate = parseLocalDate(booking.date);
    if (!bDate) return '';
    const [hours, mins] = booking.time.split(':').map(Number);
    bDate.setHours(hours, mins, 0, 0);

    const durationMin = parseInt(booking.serviceDuration) || 30;
    const expirationTime = bDate.getTime() + (durationMin * 60 * 1000);
    const diffMs = new Date().getTime() - expirationTime;
    if (diffMs <= 0) return '0 min';

    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 60) {
      return `${diffMin} min`;
    }
    const diffHours = Math.floor(diffMin / 60);
    const remainingMin = diffMin % 60;
    if (remainingMin === 0) return `${diffHours}h`;
    return `${diffHours}h ${remainingMin}min`;
  }


  function getProfColor(profName) {
    const index = state.professionals.findIndex(p => p.name === profName);
    const palette = [
      { name: 'blue', emoji: '🔵', hex: '#0a84ff', lightHex: 'rgba(10, 132, 255, 0.15)', textHex: '#0a84ff' },
      { name: 'green', emoji: '🟢', hex: '#30d158', lightHex: 'rgba(48, 209, 88, 0.15)', textHex: '#30d158' },
      { name: 'orange', emoji: '🟠', hex: '#ff9f0a', lightHex: 'rgba(255, 159, 10, 0.15)', textHex: '#ff9f0a' },
      { name: 'purple', emoji: '🟣', hex: '#bf5af2', lightHex: 'rgba(191, 90, 242, 0.15)', textHex: '#bf5af2' },
      { name: 'red', emoji: '🔴', hex: '#ff453a', lightHex: 'rgba(255, 69, 58, 0.15)', textHex: '#ff453a' },
      { name: 'yellow', emoji: '🟡', hex: '#ffd60a', lightHex: 'rgba(255, 214, 10, 0.15)', textHex: '#ffd60a' }
    ];
    if (index === -1) {
      return palette[0];
    }
    return palette[index % palette.length];
  }

  function renderProfessionalFilters() {
    const container = $('calendar-prof-filter-list');
    if (!container) return;
    
    container.innerHTML = '';
    
    // Selecionar o primeiro profissional por padrão caso selecionado seja 'todos' ou inexistente
    const activeProfs = state.professionals.filter(p => p.active !== false);
    if (!state.selectedProfFilter || state.selectedProfFilter === 'todos') {
      if (activeProfs.length > 0) {
        state.selectedProfFilter = activeProfs[0].name;
      } else {
        state.selectedProfFilter = 'César';
      }
    }
    
    // Criar botão para cada profissional (sem a opção Todos)
    activeProfs.forEach(p => {
      const profColor = getProfColor(p.name);
      const btn = document.createElement('button');
      btn.className = `prof-filter-btn ${state.selectedProfFilter === p.name ? 'active' : ''}`;
      btn.innerHTML = `${profColor.emoji} ${p.name}`;
      
      btn.style.setProperty('--btn-color', profColor.hex);
      btn.style.setProperty('--btn-light-color', profColor.lightHex);
      
      btn.onclick = () => {
        state.selectedProfFilter = p.name;
        renderProfessionalFilters();
        renderMiniPicker();
        renderDailyAgenda();
      };
      container.appendChild(btn);
    });
  }

  function showUnlockConfirmPopup(cell, dStr, currentCellDate) {
    const existing = document.querySelector('.custom-confirm-popup');
    if (existing) existing.remove();

    const popup = document.createElement('div');
    popup.className = 'custom-confirm-popup';
    popup.innerHTML = `
      <p>Dia bloqueado🔏!</p>
      <p>Deseja desbloquear?</p>
      <div class="confirm-actions">
        <button class="btn-confirm-yes">Sim</button>
        <button class="btn-confirm-no">Não</button>
      </div>
    `;

    document.body.appendChild(popup);

    const rect = cell.getBoundingClientRect();
    const scrollY = window.scrollY || document.documentElement.scrollTop;
    const scrollX = window.scrollX || document.documentElement.scrollLeft;

    popup.style.position = 'absolute';
    popup.style.left = `${rect.left + scrollX + rect.width / 2}px`;
    popup.style.top = `${rect.top + scrollY - 10}px`;
    popup.style.transform = 'translate(-50%, -100%)';

    popup.querySelector('.btn-confirm-yes').onclick = async (e) => {
      e.stopPropagation();
      popup.remove();
      
      const blocks = state.bookings.filter(b => {
        if (b.status === 'Cancelado') return false;
        const isBlockRecord = b.serviceId === 'bloqueio' || b.clientName === 'Horário Bloqueado';
        const matchDate = parseLocalDate(b.date).toDateString() === dStr;
        const matchProf = state.selectedProfFilter === 'todos' || b.professional === state.selectedProfFilter;
        return isBlockRecord && b.time === 'Dia Inteiro' && matchDate && matchProf;
      });

      if (blocks.length > 0) {
        const blockIds = blocks.map(b => b.id);
        try {
          const { error } = await supabase
            .from('agendamentos')
            .update({ status: 'Cancelado' })
            .in('id', blockIds);
          if (error) throw error;
          
          blocks.forEach(b => b.status = 'Cancelado');
          showToast("Dia Desbloqueado", "O bloqueio do dia inteiro foi liberado.");
          
          state.selectedDate = currentCellDate;
          state.pickerDate = new Date(currentCellDate);
          renderAll();
        } catch (err) {
          console.error("Erro ao desbloquear dia:", err);
          alert("Erro ao desbloquear dia. Tente novamente.");
        }
      }
    };

    popup.querySelector('.btn-confirm-no').onclick = (e) => {
      e.stopPropagation();
      popup.remove();
      
      state.selectedDate = currentCellDate;
      state.pickerDate = new Date(currentCellDate);
      renderMiniPicker();
      renderDailyAgenda();
    };

    const closeOnOutsideClick = (e) => {
      if (!popup.contains(e.target) && e.target !== cell) {
        popup.remove();
        document.removeEventListener('click', closeOnOutsideClick);
      }
    };
    setTimeout(() => {
      document.addEventListener('click', closeOnOutsideClick);
    }, 50);
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

  // Helper to check if two dates are in the same week (Sunday-Saturday)
  function isSameWeek(d1, d2) {
    const getSunday = (d) => {
      const day = d.getDay();
      const sunday = new Date(d);
      sunday.setDate(d.getDate() - day);
      sunday.setHours(0, 0, 0, 0);
      return sunday.getTime();
    };
    return getSunday(d1) === getSunday(d2);
  }

  // Setup Dashboard static elements and event listeners
  function setupDashboard() {
    // Copy link click
    const btnCopy = $('btn-copy-booking-link');
    if (btnCopy) {
      btnCopy.onclick = () => {
        const url = $('dashboard-booking-url').textContent;
        navigator.clipboard.writeText(url).then(() => {
          showToast("Link Copiado", "O link de agendamento foi copiado para a área de transferência!");
        }).catch(err => {
          console.error("Could not copy: ", err);
          // Fallback
          const el = document.createElement('textarea');
          el.value = url;
          document.body.appendChild(el);
          el.select();
          document.execCommand('copy');
          document.body.removeChild(el);
          showToast("Link Copiado", "O link de agendamento foi copiado!");
        });
      };
    }

    // Open link click
    const btnOpen = $('btn-open-booking-link');
    if (btnOpen) {
      btnOpen.onclick = () => {
        const url = $('dashboard-booking-url').textContent;
        window.open(url, '_blank');
      };
    }

    const qaNewClient = $('qa-new-client');
    if (qaNewClient) {
      qaNewClient.onclick = () => {
        openManageLoyaltyModal();
      };
    }

    const qaSettings = $('qa-settings');
    if (qaSettings) {
      qaSettings.onclick = () => {
        $('btn-tab-settings').click();
      };
    }

    // Dashboard Metric Card Clicks
    const cardToday = $('card-metric-today');
    if (cardToday) {
      cardToday.onclick = () => {
        state.dashboardViewMode = state.dashboardViewMode === 'today' ? 'upcoming' : 'today';
        renderDashboard();
      };
    }

    const cardWeek = $('card-metric-week');
    if (cardWeek) {
      cardWeek.onclick = () => {
        state.dashboardViewMode = state.dashboardViewMode === 'week' ? 'upcoming' : 'week';
        renderDashboard();
      };
    }

    const cardClients = $('card-metric-clients');
    if (cardClients) {
      cardClients.onclick = () => {
        state.dashboardViewMode = state.dashboardViewMode === 'clients' ? 'upcoming' : 'clients';
        renderDashboard();
      };
    }

    const cardPending = $('card-metric-pending');
    if (cardPending) {
      cardPending.onclick = () => {
        state.dashboardViewMode = state.dashboardViewMode === 'pending' ? 'upcoming' : 'pending';
        renderDashboard();
      };
    }
  }

  // Setup Mobile Hamburger Menu & Drawer behavior
  function setupMobileSidebar() {
    const btnHam = $('btn-hamburger');
    const sidebar = $('admin-sidebar');
    const overlay = $('sidebar-overlay');

    if (btnHam && sidebar && overlay) {
      btnHam.onclick = (e) => {
        e.stopPropagation();
        sidebar.classList.toggle('active');
        overlay.classList.toggle('active');
      };

      overlay.onclick = () => {
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
      };
    }
  }

  // ── TAB 1: RENDER DASHBOARD ──────────────────────────────────────────────
  function renderDashboard() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTime = today.getTime();
    const todayStr = today.toDateString();

    // Set dynamic booking URL
    const bookingUrl = window.location.origin;
    const urlEl = $('dashboard-booking-url');
    if (urlEl) {
      urlEl.textContent = bookingUrl;
    }

    // Calculate metrics
    let bookingsToday = 0;
    let bookingsWeek = 0;
    let revenueToday = 0;
    let revenueWeek = 0;
    let pendingCount = 0;

    // Unique Clients Count
    const uniquePhones = new Set();
    state.bookings.forEach(b => {
      const isBlock = b.serviceId === 'bloqueio' || b.clientName === 'Horário Bloqueado';
      if (b.clientPhone && !isBlock) {
        uniquePhones.add(b.clientPhone.trim());
      }
    });
    const totalClients = uniquePhones.size;

    // Process all bookings
    state.bookings.forEach(b => {
      if (!b.date) return;
      const isBlock = b.serviceId === 'bloqueio' || b.clientName === 'Horário Bloqueado';
      if (isBlock) return;

      const bDate = parseLocalDate(b.date);
      const bDateMidnight = new Date(bDate);
      bDateMidnight.setHours(0, 0, 0, 0);
      const bDateTime = bDateMidnight.getTime();

      const isActive = b.status !== 'Cancelado';
      const isRevenueStatus = b.status === 'Confirmado' || b.status === 'Concluido';

      // 1. Agendamentos Hoje
      if (isActive && bDateTime === todayTime) {
        bookingsToday++;
      }

      // 2. Agendamentos Semana
      if (isActive && isSameWeek(bDateMidnight, today)) {
        bookingsWeek++;
      }

      // 3. Receita Hoje
      if (isRevenueStatus && bDateTime === todayTime) {
        revenueToday += parsePrice(b.servicePrice);
      }

      // 4. Receita Semana
      if (isRevenueStatus && isSameWeek(bDateMidnight, today)) {
        revenueWeek += parsePrice(b.servicePrice);
      }

      // 5. Pendentes (agendamentos confirmados cujo horário expirou)
      if (getBookingStatus(b) === 'Pendente') {
        pendingCount++;
      }
    });

    // Populate dashboard labels
    if ($('db-metric-today-count')) $('db-metric-today-count').textContent = bookingsToday;
    if ($('db-metric-week-count')) $('db-metric-week-count').textContent = bookingsWeek;
    if ($('db-metric-clients-count')) $('db-metric-clients-count').textContent = totalClients;
    if ($('db-metric-today-revenue')) $('db-metric-today-revenue').textContent = formatCurrency(revenueToday);
    if ($('db-metric-week-revenue')) $('db-metric-week-revenue').textContent = formatCurrency(revenueWeek);
    if ($('db-metric-pending-count')) {
      $('db-metric-pending-count').textContent = pendingCount;
      const cardPending = $('card-metric-pending');
      if (cardPending) {
        if (pendingCount > 0) {
          cardPending.classList.add('pulse-alert');
        } else {
          cardPending.classList.remove('pulse-alert');
        }
      }
    }

    // Update active metric card UI on the dashboard
    const cardIds = {
      today: 'card-metric-today',
      week: 'card-metric-week',
      clients: 'card-metric-clients',
      pending: 'card-metric-pending'
    };
    Object.entries(cardIds).forEach(([mode, id]) => {
      const el = $(id);
      if (el) {
        if (state.dashboardViewMode === mode) {
          el.classList.add('active-metric');
        } else {
          el.classList.remove('active-metric');
        }
      }
    });

    // Update list title and icon
    const listTitleEl = $q('.dashboard-upcoming-box .box-header h2');
    if (listTitleEl) {
      let iconHTML = '';
      let titleText = 'Próximos Agendamentos';
      
      switch (state.dashboardViewMode) {
        case 'today':
          iconHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 18px; height: 18px; color: var(--gold);"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`;
          titleText = 'Agendamentos de Hoje';
          break;
        case 'week':
          iconHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 18px; height: 18px; color: var(--gold);"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`;
          titleText = 'Agendamentos da Semana';
          break;
        case 'clients':
          iconHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 18px; height: 18px; color: var(--gold);"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>`;
          titleText = 'Clientes Fidelidade';
          break;
        case 'pending':
          iconHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 18px; height: 18px; color: var(--color-red, #ff453a);"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`;
          titleText = 'Agendamentos Pendentes';
          break;
        default:
          iconHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 18px; height: 18px; color: var(--gold);"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`;
          titleText = 'Próximos Agendamentos';
          break;
      }
      listTitleEl.innerHTML = `${iconHTML} ${titleText}`;
    }

    // Render Reset button in dashboard list header if active
    const headerActions = $('dashboard-list-header-actions');
    if (headerActions) {
      if (state.dashboardViewMode !== 'upcoming') {
        headerActions.innerHTML = `<button class="btn-secondary btn-sm" id="btn-reset-dashboard-view" style="padding: 4px 8px; font-size: 11px; text-transform: uppercase;">Limpar</button>`;
        const btnReset = $('btn-reset-dashboard-view');
        if (btnReset) {
          btnReset.onclick = (e) => {
            e.stopPropagation();
            state.dashboardViewMode = 'upcoming';
            renderDashboard();
          };
        }
      } else {
        headerActions.innerHTML = '';
      }
    }

    // Render Dashboard List (Upcoming Bookings, Today, Week, CRM Clients, Pending)
    const upcomingList = $('dashboard-upcoming-list');
    if (upcomingList) {
      upcomingList.innerHTML = '';

      let listData = [];

      if (state.dashboardViewMode === 'upcoming') {
        const eligibleBookings = state.bookings.filter(b => {
          if (getBookingStatus(b) !== 'Confirmado' || !b.date) return false;
          const isBlock = b.serviceId === 'bloqueio' || b.clientName === 'Horário Bloqueado';
          if (isBlock) return false;
          const bDate = parseLocalDate(b.date);
          bDate.setHours(0, 0, 0, 0);
          return bDate.getTime() >= todayTime;
        });

        const bookingsWithTime = eligibleBookings.map(b => {
          const bStart = parseLocalDate(b.date);
          const [hours, mins] = b.time.split(':').map(Number);
          bStart.setHours(hours, mins, 0, 0);
          return { booking: b, startTime: bStart.getTime() };
        });

        const nowMs = new Date().getTime();
        const pastOrPresent = bookingsWithTime.filter(item => item.startTime <= nowMs);
        const maxPastStartTime = pastOrPresent.length > 0 ? Math.max(...pastOrPresent.map(item => item.startTime)) : -1;
        const filteredBookings = bookingsWithTime.filter(item => item.startTime > nowMs || item.startTime === maxPastStartTime);
        
        filteredBookings.sort((a, b) => a.startTime - b.startTime);
        listData = filteredBookings.map(item => item.booking).slice(0, 5);

      } else if (state.dashboardViewMode === 'today') {
        listData = state.bookings.filter(b => {
          if (!b.date) return false;
          const isBlock = b.serviceId === 'bloqueio' || b.clientName === 'Horário Bloqueado';
          if (isBlock) return false;
          const bDate = parseLocalDate(b.date);
          bDate.setHours(0, 0, 0, 0);
          return bDate.getTime() === todayTime;
        });
        listData.sort((a, b) => a.time.localeCompare(b.time));

      } else if (state.dashboardViewMode === 'week') {
        listData = state.bookings.filter(b => {
          if (!b.date) return false;
          const isBlock = b.serviceId === 'bloqueio' || b.clientName === 'Horário Bloqueado';
          if (isBlock) return false;
          const bDate = parseLocalDate(b.date);
          bDate.setHours(0, 0, 0, 0);
          return isSameWeek(bDate, today);
        });
        listData.sort((a, b) => {
          const d1 = parseLocalDate(a.date).getTime();
          const d2 = parseLocalDate(b.date).getTime();
          if (d1 !== d2) return d1 - d2;
          return a.time.localeCompare(b.time);
        });

      } else if (state.dashboardViewMode === 'pending') {
        listData = state.bookings.filter(b => {
          const isBlock = b.serviceId === 'bloqueio' || b.clientName === 'Horário Bloqueado';
          if (isBlock) return false;
          return getBookingStatus(b) === 'Pendente';
        });
        listData.sort((a, b) => {
          const d1 = parseLocalDate(a.date).getTime();
          const d2 = parseLocalDate(b.date).getTime();
          if (d1 !== d2) return d1 - d2;
          return a.time.localeCompare(b.time);
        });

      } else if (state.dashboardViewMode === 'clients') {
        const loyaltyActive = JSON.parse(localStorage.getItem('cesar_barbearia_loyalty_active') || '{}');
        const clientStamps = JSON.parse(localStorage.getItem('cesar_barbearia_fidelidades') || '{}');
        const clientMap = {};
        
        state.bookings.forEach(b => {
          const isBlock = b.serviceId === 'bloqueio' || b.clientName === 'Horário Bloqueado';
          if (isBlock || !b.clientPhone) return;
          const phone = b.clientPhone.trim();
          
          if (loyaltyActive[phone] === true) {
            if (!clientMap[phone]) {
              clientMap[phone] = {
                name: b.clientName,
                phone: phone,
                stamps: clientStamps[phone] || 0
              };
            }
          }
        });
        listData = Object.values(clientMap);
        listData.sort((a, b) => a.name.localeCompare(b.name));
      }

      // Render elements
      if (listData.length === 0) {
        let emptyMsg = 'Nenhum agendamento encontrado.';
        if (state.dashboardViewMode === 'upcoming') emptyMsg = 'Nenhum agendamento pendente.';
        else if (state.dashboardViewMode === 'pending') emptyMsg = 'Nenhum agendamento pendente.';
        else if (state.dashboardViewMode === 'clients') emptyMsg = 'Nenhum cliente fidelidade cadastrado.';
        
        upcomingList.innerHTML = `<div class="no-bookings" style="padding: 24px; text-align: center; color: var(--text-muted); font-size: 13px;">${emptyMsg}</div>`;
      } else {
        if (state.dashboardViewMode === 'clients') {
          listData.forEach(c => {
            const itemEl = document.createElement('div');
            itemEl.className = 'db-upcoming-item db-client-item';
            itemEl.innerHTML = `
              <div class="upcoming-time-badge" style="background: rgba(200, 146, 42, 0.15); border-color: var(--gold);">
                <span class="upcoming-time" style="font-size: 14px;">👑</span>
                <span class="upcoming-date" style="color: var(--gold); font-weight:700;">${c.stamps}/10</span>
              </div>
              <div class="upcoming-details">
                <div class="upcoming-client-name">${c.name}</div>
                <div class="upcoming-service-meta">${c.phone}</div>
              </div>
              <div class="upcoming-actions">
                <button class="btn-action-icon view-loyalty-btn" data-phone="${c.phone}" data-name="${c.name}" title="Ver Cartão Fidelidade">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 16px; height: 16px;">
                    <rect x="3" y="4" width="18" height="16" rx="2" />
                    <line x1="7" y1="8" x2="17" y2="8" />
                    <line x1="7" y1="12" x2="17" y2="12" />
                    <line x1="7" y1="16" x2="13" y2="16" />
                  </svg>
                </button>
              </div>
            `;
            itemEl.querySelector('.view-loyalty-btn').onclick = (e) => {
              e.stopPropagation();
              openLoyaltyCardModal(c.phone, c.name);
            };
            upcomingList.appendChild(itemEl);
          });
        } else {
          listData.forEach(b => {
            const bDate = parseLocalDate(b.date);
            const dateFormatted = bDate.toDateString() === todayStr
              ? 'Hoje'
              : `${String(bDate.getDate()).padStart(2, '0')}/${String(bDate.getMonth() + 1).padStart(2, '0')}`;

            const calculatedStatus = getBookingStatus(b);
            const isPending = calculatedStatus === 'Pendente';

            const itemEl = document.createElement('div');
            itemEl.className = `db-upcoming-item ${isPending ? 'pending-alert' : ''}`;
            
            let actionsHTML = '';
            if (state.dashboardViewMode === 'pending') {
              // Botões diretos Concluir/Cancelar para facilidade operacional
              actionsHTML = `
                <button class="btn-action-icon conclude-btn" data-id="${b.id}" title="Concluir" style="color: var(--color-green, #30d158); border-color: rgba(48, 209, 88, 0.3);">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:16px; height:16px;"><polyline points="20 6 9 17 4 12"/></svg>
                </button>
                <button class="btn-action-icon cancel-btn" data-id="${b.id}" title="Cancelar" style="color: var(--color-red, #ff453a); border-color: rgba(255, 69, 58, 0.3);">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:16px; height:16px;"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              `;
            } else if (b.status === 'Confirmado' || b.status === 'Pendente') {
              actionsHTML = `
                <button class="btn-action-icon menu-trigger-btn" data-id="${b.id}" title="Ações">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width: 18px; height: 18px;">
                    <circle cx="12" cy="6" r="1.5" />
                    <circle cx="12" cy="12" r="1.5" />
                    <circle cx="12" cy="18" r="1.5" />
                  </svg>
                </button>
              `;
            } else {
              actionsHTML = `<span class="badge-status ${calculatedStatus.toLowerCase()}" style="font-size:10px; padding: 4px 8px; border-radius:4px;">${calculatedStatus}</span>`;
            }

            const delayText = isPending 
              ? ` <span style="color:var(--color-red, #ff453a); font-weight:700; margin-left: 6px;">⚠️ Expirou há ${getDelayTimeStr(b)}</span>`
              : '';

            itemEl.innerHTML = `
              <div class="upcoming-time-badge" style="${isPending ? 'background: rgba(255, 69, 58, 0.15); border-color: var(--color-red, #ff453a);' : ''}">
                <span class="upcoming-time" style="${isPending ? 'color: var(--color-red, #ff453a);' : ''}">${b.time}</span>
                <span class="upcoming-date">${dateFormatted}</span>
              </div>
              <div class="upcoming-details">
                <div class="upcoming-client-name">${b.clientName}${delayText}</div>
                <div class="upcoming-service-meta">${b.serviceName} • 💈 ${b.professional || 'César'}</div>
              </div>
              <div class="upcoming-actions" style="align-items: center; display: flex; gap: 6px;">
                ${actionsHTML}
              </div>
            `;

            // Vincular cliques se for modo pendente (botões diretos) ou menu dropdown
            if (state.dashboardViewMode === 'pending') {
              itemEl.querySelector('.conclude-btn').onclick = (e) => {
                e.stopPropagation();
                handleStatusChange(b.id, 'Concluir');
              };
              itemEl.querySelector('.cancel-btn').onclick = (e) => {
                e.stopPropagation();
                handleStatusChange(b.id, 'Cancelar');
              };
            } else {
              const triggerBtn = itemEl.querySelector('.menu-trigger-btn');
              if (triggerBtn) {
                triggerBtn.onclick = (e) => {
                  e.stopPropagation();
                  
                  const globalDropdown = document.getElementById('global-actions-dropdown');
                  if (!globalDropdown) return;

                  if (globalDropdown.dataset.id === b.id && !globalDropdown.classList.contains('hidden')) {
                    globalDropdown.classList.add('hidden');
                    return;
                  }

                  globalDropdown.dataset.id = b.id;
                  globalDropdown.classList.remove('hidden');

                  const rect = triggerBtn.getBoundingClientRect();
                  const dropdownWidth = globalDropdown.offsetWidth || 120;
                  const dropdownHeight = globalDropdown.offsetHeight || 132;

                  const scrollY = window.scrollY || document.documentElement.scrollTop;
                  const scrollX = window.scrollX || document.documentElement.scrollLeft;

                  const left = rect.left + scrollX - dropdownWidth - 8;
                  const top = rect.top + scrollY + (rect.height / 8) - (dropdownHeight / 1.8);

                  globalDropdown.style.left = `${left}px`;
                  globalDropdown.style.top = `${top}px`;
                  globalDropdown.style.position = 'absolute';
                };
              }
            }

            upcomingList.appendChild(itemEl);
          });
        }
      }
    }
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

    // Os botões dinâmicos de profissional gerenciam seus próprios cliques e chamam renderDailyAgenda()
  }

  // Render mini calendar picker in sidebar
  function renderMiniPicker() {
    const pDate = state.pickerDate;
    const sDate = state.selectedDate;
    
    if (!state.calendarViewMode) {
      state.calendarViewMode = localStorage.getItem('cesar_calendar_view_mode') || 'week';
    }

    const toggleBtn = $('btn-calendar-view-toggle');
    if (toggleBtn) {
      if (state.calendarViewMode === 'month') {
        toggleBtn.classList.add('active');
      } else {
        toggleBtn.classList.remove('active');
      }
      toggleBtn.onclick = (e) => {
        e.stopPropagation();
        const newMode = state.calendarViewMode === 'week' ? 'month' : 'week';
        state.calendarViewMode = newMode;
        localStorage.setItem('cesar_calendar_view_mode', newMode);
        renderMiniPicker();
      };
    }

    const monthsName = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    
    $('picker-month-year').textContent = `${monthsName[pDate.getMonth()]} ${pDate.getFullYear()}`.toUpperCase();

    const grid = $('picker-days-grid');
    grid.innerHTML = '';

    if (state.calendarViewMode === 'month') {
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
        cell.className = 'picker-day-cell view-month';
        cell.textContent = d;

        const dStr = currentCellDate.toDateString();
        
        // Filtrar agendamentos do dia de acordo com o profissional selecionado
        let dayBookings = state.bookings.filter(b => {
          const matchDate = parseLocalDate(b.date).toDateString() === dStr;
          const matchProf = state.selectedProfFilter === 'todos' || b.professional === state.selectedProfFilter;
          const matchStatus = b.status !== 'Cancelado';
          return matchDate && matchProf && matchStatus;
        });

        // Se não for dia de trabalho, ignorar bloqueios
        const openDays = (state.config && state.config.openDays) ? state.config.openDays : [1, 2, 3, 4, 5, 6];
        const isWorkingDay = openDays.includes(currentCellDate.getDay());
        if (!isWorkingDay) {
          dayBookings = dayBookings.filter(b => b.serviceId !== 'bloqueio' && b.clientName !== 'Horário Bloqueado');
        }

        // Verificar se há bloqueio de dia inteiro
        const hasAllDayBlockOnDate = dayBookings.some(b => {
          const isBlockRecord = b.serviceId === 'bloqueio' || b.clientName === 'Horário Bloqueado';
          return isBlockRecord && b.time === 'Dia Inteiro';
        });

        // Today
        if (currentCellDate.toDateString() === new Date().toDateString()) {
          cell.classList.add('today');
        }

        // Selected
        if (currentCellDate.toDateString() === sDate.toDateString()) {
          cell.classList.add('selected');
        }

        // Past day
        const todayMidnight = new Date();
        todayMidnight.setHours(0, 0, 0, 0);
        if (currentCellDate < todayMidnight) {
          cell.classList.add('past-day');
        }

        if (hasAllDayBlockOnDate) {
          cell.classList.add('day-blocked-x');
          const spanX = document.createElement('span');
          spanX.className = 'blocked-x-indicator';
          spanX.textContent = '❌';
          cell.appendChild(spanX);
        } else if (dayBookings.length > 0) {
          cell.classList.add('has-bookings');
          
          // Cor baseada no profissional do primeiro agendamento ativo
          const firstBookingProf = dayBookings[0].professional;
          const profColor = getProfColor(firstBookingProf);
          
          // Só aplica cor customizada se a célula não for a selecionada atualmente
          if (currentCellDate.toDateString() !== sDate.toDateString()) {
            cell.style.setProperty('color', profColor.hex, 'important');
            cell.style.setProperty('background-color', profColor.lightHex, 'important');
            cell.style.setProperty('border', `1px solid ${profColor.hex}`, 'important');
            cell.style.setProperty('font-weight', '700', 'important');
          }
        }

        cell.onclick = (e) => {
          e.stopPropagation();
          if (hasAllDayBlockOnDate) {
            showUnlockConfirmPopup(cell, dStr, currentCellDate);
            return;
          }
          
          state.selectedDate = currentCellDate;
          state.pickerDate = new Date(currentCellDate);
          renderMiniPicker();
          renderDailyAgenda();
        };

        grid.appendChild(cell);
      }
    } else {
      // WEEK VIEW
      const startOfWeek = new Date(sDate);
      startOfWeek.setHours(0, 0, 0, 0);
      const day = startOfWeek.getDay(); // Sunday is 0
      startOfWeek.setDate(startOfWeek.getDate() - day);

      for (let i = 0; i < 7; i++) {
        const currentCellDate = new Date(startOfWeek);
        currentCellDate.setHours(0, 0, 0, 0);
        currentCellDate.setDate(startOfWeek.getDate() + i);

        const cell = document.createElement('button');
        cell.className = 'picker-day-cell view-week';
        cell.textContent = currentCellDate.getDate();

        const dStr = currentCellDate.toDateString();
        
        // Filtrar agendamentos do dia de acordo com o profissional selecionado
        let dayBookings = state.bookings.filter(b => {
          const matchDate = parseLocalDate(b.date).toDateString() === dStr;
          const matchProf = state.selectedProfFilter === 'todos' || b.professional === state.selectedProfFilter;
          const matchStatus = b.status !== 'Cancelado';
          return matchDate && matchProf && matchStatus;
        });

        // Se não for dia de trabalho, ignorar bloqueios
        const openDays = (state.config && state.config.openDays) ? state.config.openDays : [1, 2, 3, 4, 5, 6];
        const isWorkingDay = openDays.includes(currentCellDate.getDay());
        if (!isWorkingDay) {
          dayBookings = dayBookings.filter(b => b.serviceId !== 'bloqueio' && b.clientName !== 'Horário Bloqueado');
        }

        // Verificar se há bloqueio de dia inteiro
        const hasAllDayBlockOnDate = dayBookings.some(b => {
          const isBlockRecord = b.serviceId === 'bloqueio' || b.clientName === 'Horário Bloqueado';
          return isBlockRecord && b.time === 'Dia Inteiro';
        });

        // Today
        if (currentCellDate.toDateString() === new Date().toDateString()) {
          cell.classList.add('today');
        }

        // Selected
        if (currentCellDate.toDateString() === sDate.toDateString()) {
          cell.classList.add('selected');
        }

        // Past day
        const todayMidnight = new Date();
        todayMidnight.setHours(0, 0, 0, 0);
        if (currentCellDate < todayMidnight) {
          cell.classList.add('past-day');
        }

        if (hasAllDayBlockOnDate) {
          cell.classList.add('day-blocked-x');
          const spanX = document.createElement('span');
          spanX.className = 'blocked-x-indicator';
          spanX.textContent = '❌';
          cell.appendChild(spanX);
        } else if (dayBookings.length > 0) {
          cell.classList.add('has-bookings');
          
          // Cor baseada no profissional do primeiro agendamento ativo
          const firstBookingProf = dayBookings[0].professional;
          const profColor = getProfColor(firstBookingProf);
          
          // Só aplica cor customizada se a célula não for a selecionada atualmente
          if (currentCellDate.toDateString() !== sDate.toDateString()) {
            cell.style.setProperty('color', profColor.hex, 'important');
            cell.style.setProperty('background-color', profColor.lightHex, 'important');
            cell.style.setProperty('border', `1px solid ${profColor.hex}`, 'important');
            cell.style.setProperty('font-weight', '700', 'important');
          }
        }

        cell.onclick = (e) => {
          e.stopPropagation();
          if (hasAllDayBlockOnDate) {
            showUnlockConfirmPopup(cell, dStr, currentCellDate);
            return;
          }
          
          state.selectedDate = currentCellDate;
          state.pickerDate = new Date(currentCellDate);
          renderMiniPicker();
          renderDailyAgenda();
        };

        grid.appendChild(cell);
      }
    }

    // Nav selectors
    $('picker-prev').onclick = () => {
      if (state.calendarViewMode === 'month') {
        state.pickerDate.setMonth(state.pickerDate.getMonth() - 1);
      } else {
        const newSelected = new Date(state.selectedDate);
        newSelected.setDate(newSelected.getDate() - 7);
        state.selectedDate = newSelected;
        state.pickerDate = new Date(newSelected);
        renderDailyAgenda();
      }
      renderMiniPicker();
    };
    
    $('picker-next').onclick = () => {
      if (state.calendarViewMode === 'month') {
        state.pickerDate.setMonth(state.pickerDate.getMonth() + 1);
      } else {
        const newSelected = new Date(state.selectedDate);
        newSelected.setDate(newSelected.getDate() + 7);
        state.selectedDate = newSelected;
        state.pickerDate = new Date(newSelected);
        renderDailyAgenda();
      }
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

    const selectedProf = state.selectedProfFilter;

    // Check if there are active hourly blocks for this professional and date
    const hasHourlyBlocks = state.bookings.some(b => {
      const matchDate = parseLocalDate(b.date).toDateString() === dateStr;
      const matchProf = selectedProf === 'todos' || b.professional === selectedProf;
      const isBlockRecord = b.serviceId === 'bloqueio';
      return matchDate && matchProf && isBlockRecord && b.time !== 'Dia Inteiro' && b.status !== 'Cancelado';
    });

    const blockBtn = document.getElementById('filter-btn-blocked');
    if (blockBtn) {
      if (hasHourlyBlocks) {
        blockBtn.style.display = 'flex';
      } else {
        blockBtn.style.display = 'none';
        if (agendaFilter === 'Bloqueado') {
          agendaFilter = 'todos';
          document.querySelectorAll('.view-filters .btn-filter-status').forEach(b => {
            if (b.dataset.filter === 'todos') {
              b.classList.add('active');
            } else {
              b.classList.remove('active');
            }
          });
        }
      }
    }

    // Filter day bookings
    let dayBookings = state.bookings.filter(b => {
      const matchDate = parseLocalDate(b.date).toDateString() === dateStr;
      const matchProf = selectedProf === 'todos' || b.professional === selectedProf;
      
      const isBlockRecord = b.serviceId === 'bloqueio';
      
      if (agendaFilter === 'Bloqueado') {
        // Mostrar apenas bloqueios de horário ativos (não dia inteiro)
        return matchDate && matchProf && isBlockRecord && b.time !== 'Dia Inteiro' && b.status !== 'Cancelado';
      } else {
        // Mostrar agendamentos comuns de acordo com o status dinâmico calculado
        const calculatedStatus = getBookingStatus(b);
        const matchStatus = agendaFilter === 'todos' || calculatedStatus === agendaFilter;
        return matchDate && matchProf && matchStatus && !isBlockRecord;
      }
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
      
      const isBlock = b.serviceId === 'bloqueio' || b.clientName === 'Horário Bloqueado';
      const calculatedStatus = getBookingStatus(b);
      const isPending = !isBlock && calculatedStatus === 'Pendente';
      
      card.className = `agenda-item ${isPending ? 'pending-alert' : ''}`;
      
      const profColor = getProfColor(b.professional || 'César');
      
      // Aplicar cor da borda esquerda baseada na cor do profissional (ou cor de alerta se pendente)
      if (isPending) {
        card.style.borderLeft = `4px solid var(--color-red, #ff453a)`;
      } else {
        card.style.borderLeft = `4px solid ${profColor.hex}`;
      }
      
      let actionsHTML = '';
      if (isBlock) {
        if (b.status === 'Confirmado' || b.status === 'Pendente') {
          actionsHTML = `
            <button class="btn-action-status cancel" data-id="${b.id}" style="background-color: var(--color-red, #ff453a); color: #000;">Desbloquear</button>
          `;
        } else {
          actionsHTML = `<span class="badge-status ${b.status.toLowerCase()}">${b.status === 'cancelado' ? 'desbloqueado' : b.status}</span>`;
        }
      } else {
        if (calculatedStatus === 'Confirmado' || calculatedStatus === 'Pendente') {
          actionsHTML = `
            <button class="btn-action-status conclude" data-id="${b.id}">Concluir</button>
            <button class="btn-action-status cancel" data-id="${b.id}">Cancelar</button>
          `;
        } else {
          actionsHTML = `<span class="badge-status ${calculatedStatus.toLowerCase()}">${calculatedStatus}</span>`;
        }
      }

      const hasObsHTML = b.clientObs 
        ? `<div class="agenda-obs" style="border-left-color: ${isBlock ? 'var(--color-red, #ff453a)' : 'var(--gold)'};"><strong>Obs:</strong> ${b.clientObs}</div>`
        : '';

      if (isBlock) {
        card.innerHTML = `
          <div class="agenda-time">
            <span class="agenda-time-val">${b.time}</span>
            <span class="agenda-time-dur">${b.serviceDuration}</span>
          </div>
          <div class="agenda-detail">
            <div class="agenda-title-row">
              <span class="agenda-client-name" style="color: var(--color-red, #ff453a); font-weight:700;">🚫 HORÁRIO BLOQUEADO</span>
              <span class="agenda-service-badge" style="background-color: rgba(255, 69, 58, 0.1); border-color: rgba(255, 69, 58, 0.2); color: var(--color-red, #ff453a);">${profColor.emoji} ${b.professional || 'César'}</span>
            </div>
            <div class="agenda-meta-row">
              <span class="agenda-meta-item">Este horário está reservado para bloqueio interno da agenda.</span>
            </div>
            ${hasObsHTML}
          </div>
          <div class="agenda-actions">
            <div class="agenda-actions-row">
              ${actionsHTML}
            </div>
          </div>
        `;
      } else {
        const delayBadgeHTML = isPending 
          ? `<span class="pending-delay-badge">⚠️ Atrasado há ${getDelayTimeStr(b)}</span>`
          : '';

        card.innerHTML = `
          <div class="agenda-time">
            <span class="agenda-time-val">${b.time}</span>
            <span class="agenda-time-dur">${b.serviceDuration}</span>
          </div>
          <div class="agenda-detail">
            <div class="agenda-title-row">
              <span class="agenda-client-name">${b.clientName}</span>
              <span class="agenda-service-badge">${b.serviceName}</span>
              ${delayBadgeHTML}
            </div>
            <div class="agenda-meta-row">
              <span class="agenda-meta-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                ${b.clientPhone}
              </span>
              <span class="agenda-meta-item">💈 ${profColor.emoji} ${b.professional || 'César'}</span>
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
      }

      // Click handlers
      card.querySelectorAll('.btn-action-status').forEach(btn => {
        btn.onclick = () => {
          handleStatusChange(btn.dataset.id, btn.textContent);
        };
      });

      if (!isBlock) {
        card.querySelector('.whatsapp').onclick = (e) => {
          const btn = e.currentTarget;
          openWhatsappOwnerMsg(btn.dataset);
        };
      }

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
    } else if (action === 'Concluir' || action === 'Concluído') {
      newStatus = 'Concluido';
      showToast("Agendamento Concluído", `Corte de ${item.clientName} concluído com sucesso.`);
    } else if (action === 'Pendente') {
      newStatus = 'Pendente';
      showToast("Agendamento Pendente", `Horário de ${item.clientName} às ${item.time} foi marcado como Pendente.`);
    } else if (action === 'Recusar' || action === 'Cancelar' || action === 'Cancelado' || action === 'Desbloquear') {
      newStatus = 'Cancelado';
      const isBlock = item.serviceId === 'bloqueio' || item.clientName === 'Horário Bloqueado';
      if (isBlock) {
        showToast("Horário Desbloqueado", `O horário das ${item.time} foi liberado com sucesso.`);
      } else {
        showToast("Agendamento Cancelado", `Horário de ${item.clientName} às ${item.time} foi cancelado.`);
      }
    }

    item.status = newStatus;
    
    // update supabase
    await supabase.from('agendamentos').update({ status: newStatus }).eq('id', id);

    // ── AUTO-STAMP: Se agendamento foi concluído e cliente está no programa fidelidade ──
    if (newStatus === 'Concluido' && item.clientPhone) {
      const loyaltyActive = JSON.parse(localStorage.getItem('cesar_barbearia_loyalty_active') || '{}');
      const phone = item.clientPhone.trim();
      
      if (loyaltyActive[phone] === true) {
        const clientFidelidades = JSON.parse(localStorage.getItem('cesar_barbearia_fidelidades') || '{}');
        const currentStamps = clientFidelidades[phone] !== undefined ? clientFidelidades[phone] : 0;
        
        if (currentStamps < 10) {
          clientFidelidades[phone] = currentStamps + 1;
          localStorage.setItem('cesar_barbearia_fidelidades', JSON.stringify(clientFidelidades));
          
          const newTotal = clientFidelidades[phone];
          const remaining = 10 - newTotal;
          
          if (newTotal === 10) {
            showToast(`🎁 Cartão Completo!`, `${item.clientName} completou o cartão fidelidade e ganhou um corte grátis!`);
          } else {
            showToast(`👑 Selo Registrado`, `Cartão fidelidade de ${item.clientName} atualizado: ${newTotal}/10 selos (faltam ${remaining}).`);
          }
          playNotificationSound(true);
        }
      }
    }

    renderAll();
  }

  // Manual booking submission inside modal
  function setupManualBookingForm() {
    const select = $('manual-service-select');
    
    // Fill services select options
    function populateServicesSelect() {
      select.innerHTML = '';
      state.services.filter(s => s.id !== 'bloqueio').forEach(s => {
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
      
      const dayBookings = state.bookings.filter(b => {
        if (!b.date || !b.time || b.status === 'Cancelado') return false;
        const bookingDate = parseLocalDate(b.date);
        return bookingDate.toDateString() === dStr && b.professional === inputProf;
      });

      const hasAllDayBlock = dayBookings.some(b => 
        (b.serviceId === 'bloqueio' || b.clientName === 'Horário Bloqueado') && 
        b.time === 'Dia Inteiro'
      );

      const bookedTimes = new Set(dayBookings.map(b => b.time));
      
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
        
        const isBooked = hasAllDayBlock || bookedTimes.has(t);
        if (isBooked) {
          opt.textContent = hasAllDayBlock ? `${t} (Dia Bloqueado)` : `${t} (Ocupado)`;
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

    // Dedicated function to open modal in either Manual Booking or Block Time mode
    function openManualBookingModal(isBlockMode = false) {
      const titleEl = $q('#modal-manual-booking h2');
      const submitBtn = $q('#form-manual-booking button[type="submit"]');
      
      const nameInput = $('manual-client-name');
      const phoneInput = $('manual-client-phone');
      const serviceSelect = $('manual-service-select');
      const obsInput = $('manual-obs');

      // Get parent form-field-groups
      const nameGroup = nameInput.closest('.form-field-group');
      const phoneGroup = phoneInput.closest('.form-field-group');
      const serviceGroup = serviceSelect.closest('.form-field-group');
      const obsGroup = obsInput.closest('.form-field-group');

      const allDayField = $('manual-field-allday');
      const allDayCheck = $('manual-allday');
      const timeSelect = $('manual-time');
      const timeGroup = timeSelect.closest('.form-field-group');

      if (isBlockMode) {
        // Set titles
        if (titleEl) titleEl.textContent = "Bloquear Horário";
        if (submitBtn) submitBtn.textContent = "Bloquear Horário";

        // Hide fields
        nameGroup.classList.add('hidden');
        phoneGroup.classList.add('hidden');
        serviceGroup.classList.add('hidden');
        
        // Show observations field as Motivo
        obsGroup.classList.remove('hidden');
        const obsLabel = obsGroup.querySelector('label');
        if (obsLabel) obsLabel.textContent = "Motivo (Opcional)";
        obsInput.placeholder = "Ex: Consulta médica, compromisso, treinamento, férias...";

        // Show all day checkbox
        if (allDayField) allDayField.classList.remove('hidden');
        if (allDayCheck) allDayCheck.checked = false;

        // Ensure time selector is visible and required by default
        if (timeGroup) timeGroup.classList.remove('hidden');
        timeSelect.required = true;

        // Remove required attributes to prevent validation issues
        nameInput.required = false;
        phoneInput.required = false;
        serviceSelect.required = false;

        // Pre-fill values
        nameInput.value = "Horário Bloqueado";
        phoneInput.value = "(00) 00000-0000";
        obsInput.value = "";
      } else {
        // Set titles
        if (titleEl) titleEl.textContent = "Novo Agendamento Manual";
        if (submitBtn) submitBtn.textContent = "Criar Agendamento";

        // Show fields
        nameGroup.classList.remove('hidden');
        phoneGroup.classList.remove('hidden');
        serviceGroup.classList.remove('hidden');
        
        // Reset observations label
        obsGroup.classList.remove('hidden');
        const obsLabel = obsGroup.querySelector('label');
        if (obsLabel) obsLabel.textContent = "Observações (Opcional)";
        obsInput.placeholder = "Observações de preferência, restrições...";

        // Hide all day checkbox
        if (allDayField) allDayField.classList.add('hidden');
        if (allDayCheck) allDayCheck.checked = false;

        // Show and set required for time select
        if (timeGroup) timeGroup.classList.remove('hidden');
        timeSelect.required = true;

        // Add required attributes
        nameInput.required = true;
        phoneInput.required = true;
        serviceSelect.required = true;

        // Reset values
        nameInput.value = "";
        phoneInput.value = "";
        obsInput.value = "";
      }

      // Populate select options
      populateServicesSelect();
      populateProfessionalsSelect();
      updateManualTimeSlots();

      // Open the modal
      openModal('modal-manual-booking');
    }

    // Modal click trigger should populate select options
    $('btn-manual-booking').addEventListener('click', () => {
      openManualBookingModal(false);
    });

    const qaNewBooking = $('qa-new-booking');
    if (qaNewBooking) {
      qaNewBooking.onclick = () => {
        openManualBookingModal(false);
      };
    }

    const qaBlockTime = $('qa-block-time');
    if (qaBlockTime) {
      qaBlockTime.onclick = () => {
        openManualBookingModal(true);
      };
    }

    // Set today as default date value
    $('manual-date').value = new Date().toISOString().split('T')[0];
    
    // Watch date and professional changes
    $('manual-date').addEventListener('change', updateManualTimeSlots);
    $('manual-prof-select').addEventListener('change', updateManualTimeSlots);

    // Watch allday checkbox change
    const allDayCheck = $('manual-allday');
    if (allDayCheck) {
      allDayCheck.addEventListener('change', (e) => {
        const timeSelect = $('manual-time');
        const timeGroup = timeSelect.closest('.form-field-group');
        if (e.target.checked) {
          if (timeGroup) timeGroup.classList.add('hidden');
          timeSelect.required = false;
        } else {
          if (timeGroup) timeGroup.classList.remove('hidden');
          timeSelect.required = true;
        }
      });
    }

    $('form-manual-booking').onsubmit = async (e) => {
      e.preventDefault();
      
      const sId = select.value;
      const service = state.services.find(s => s.id === sId);

      const dVal = $('manual-date').value;
      const inputTime = $('manual-time').value;
      const inputProf = $('manual-prof-select').value;
      const inputDate = parseLocalDate(dVal);

      const clientName = $('manual-client-name').value.trim();
      const isBlock = clientName === "Horário Bloqueado";
      const clientPhone = isBlock ? "(00) 00000-0000" : $('manual-client-phone').value.trim();
      const clientObs = $('manual-obs').value.trim();

      const finalServiceId = isBlock ? "bloqueio" : sId;
      const finalServiceName = isBlock ? "Bloqueio de Agenda" : (service ? service.name : "Serviço");
      const finalServicePrice = isBlock ? "R$ 0,00" : (service ? service.price : "R$ 0,00");
      const finalServiceDuration = isBlock ? `${state.config.interval || 60} min` : (service ? service.duration : "60 min");

      const allDayCheck = $('manual-allday');
      const isAllDayBlock = isBlock && allDayCheck && allDayCheck.checked;

      if (isAllDayBlock) {
        // Obter todos os agendamentos ativos (clientes ou bloqueios) para este profissional neste dia
        const dayBookings = state.bookings.filter(b => {
          if (!b.date || b.status === 'Cancelado') return false;
          const bookingDate = parseLocalDate(b.date);
          return bookingDate.toDateString() === inputDate.toDateString() &&
                 b.professional === inputProf;
        });

        // Filtrar agendamentos ativos que são de clientes reais (não bloqueios)
        const activeClientBookings = dayBookings.filter(b => {
          const isBlockRecord = b.serviceId === 'bloqueio' || b.clientName === 'Horário Bloqueado';
          return !isBlockRecord;
        });

        if (activeClientBookings.length > 0) {
          const confirmCancel = confirm(`Existem ${activeClientBookings.length} agendamento(s) ativo(s) de cliente(s) neste dia. Deseja cancelá-los automaticamente e prosseguir com o bloqueio do dia todo?`);
          if (!confirmCancel) return;
        }

        // Cancelar todos os agendamentos existentes deste barbeiro neste dia (clientes ou blocos individuais)
        if (dayBookings.length > 0) {
          const bookingIdsToCancel = dayBookings.map(b => b.id);
          try {
            const { error: cancelError } = await supabase
              .from('agendamentos')
              .update({ status: 'Cancelado' })
              .in('id', bookingIdsToCancel);

            if (cancelError) throw cancelError;

            // Atualizar estado local
            dayBookings.forEach(b => b.status = 'Cancelado');
          } catch (err) {
            console.error("Erro ao cancelar agendamentos existentes no Supabase:", err);
            alert("Erro ao cancelar agendamentos existentes. Tente novamente.");
            return;
          }
        }

        // Inserir um único registro de bloqueio para o dia todo
        const singleBlock = {
          clientName: clientName, // "Horário Bloqueado"
          clientPhone: clientPhone, // "(00) 00000-0000"
          clientBirth: '',
          clientObs: clientObs,
          serviceId: finalServiceId, // "bloqueio"
          serviceName: finalServiceName, // "Bloqueio de Agenda"
          servicePrice: finalServicePrice, // "R$ 0,00"
          serviceDuration: 'Dia Todo',
          date: dVal, // YYYY-MM-DD
          time: 'Dia Inteiro',
          professional: inputProf,
          status: 'Confirmado'
        };

        try {
          const { error } = await supabase.from('agendamentos').insert([singleBlock]);
          if (error) throw error;
          
          showToast("Ausência Registrada", `A ausência de ${inputProf} foi registrada com sucesso.`);
        } catch (err) {
          console.error("Erro ao salvar bloqueio do dia todo:", err);
          alert("Erro ao registrar bloqueio do dia todo. Tente novamente.");
          return;
        }

        closeModal('modal-manual-booking');
        $('form-manual-booking').reset();
        
        state.selectedDate = new Date(dVal);
        state.pickerDate = new Date(dVal);

        renderAll();
        return;
      }

      // Verificar colisão de horário para o barbeiro selecionado
      const hasCollision = state.bookings.some(b => {
        if (!b.date || !b.time || b.status === 'Cancelado') return false;
        const bookingDate = parseLocalDate(b.date);
        return bookingDate.toDateString() === inputDate.toDateString() &&
               (b.time === inputTime || b.time === 'Dia Inteiro') &&
               b.professional === inputProf;
      });

      if (hasCollision) {
        const confirmOverbook = confirm(`Atenção: O profissional ${inputProf} já possui um agendamento ativo para às ${inputTime} no dia ${inputDate.toLocaleDateString('pt-BR')}.\nDeseja registrar o agendamento mesmo assim?`);
        if (!confirmOverbook) return;
      }

      try {
        const { error } = await supabase.from('agendamentos').insert([{
          clientName: clientName,
          clientPhone: clientPhone,
          clientBirth: '',
          clientObs: clientObs,
          serviceId: finalServiceId,
          serviceName: finalServiceName,
          servicePrice: finalServicePrice,
          serviceDuration: finalServiceDuration,
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

    state.services.filter(s => s.id !== 'bloqueio').forEach(s => {
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

  // ── MODAL: GERENCIAR CLIENTES FIDELIDADE ────────────────────────────────
  function openManageLoyaltyModal() {
    const searchInput = $('manage-loyalty-search');
    if (searchInput) searchInput.value = '';
    renderManageLoyaltyList('');
    openModal('modal-manage-loyalty');

    if (searchInput) {
      searchInput.oninput = (e) => {
        renderManageLoyaltyList(e.target.value.toLowerCase());
      };
    }
  }

  function renderManageLoyaltyList(query = '') {
    const list = $('manage-loyalty-list');
    if (!list) return;
    list.innerHTML = '';

    // Compile unique clients from bookings
    const clientsMap = {};
    state.bookings.forEach(b => {
      const isBlock = b.serviceId === 'bloqueio' || b.clientName === 'Horário Bloqueado';
      if (isBlock || !b.clientPhone) return;

      const phone = b.clientPhone.trim();
      if (!clientsMap[phone]) {
        clientsMap[phone] = {
          name: b.clientName,
          phone: phone,
          visits: 0
        };
      }
      if (b.status === 'Concluido') {
        clientsMap[phone].visits++;
      }
    });

    const clients = Object.values(clientsMap);
    const filtered = query
      ? clients.filter(c => c.name.toLowerCase().includes(query) || c.phone.includes(query))
      : clients;

    filtered.sort((a, b) => a.name.localeCompare(b.name));

    const loyaltyActive = JSON.parse(localStorage.getItem('cesar_barbearia_loyalty_active') || '{}');
    const clientFidelidades = JSON.parse(localStorage.getItem('cesar_barbearia_fidelidades') || '{}');

    if (filtered.length === 0) {
      list.innerHTML = `<div style="text-align:center;padding:32px;color:var(--text-muted);font-size:13px;">
        ${query ? 'Nenhum cliente encontrado.' : 'Nenhum cliente cadastrado ainda.'}
      </div>`;
      return;
    }

    filtered.forEach(c => {
      const isActive = loyaltyActive[c.phone] === true;
      const stamps = clientFidelidades[c.phone] !== undefined ? clientFidelidades[c.phone] : 0;
      const initials = c.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

      const row = document.createElement('div');
      row.className = `loyalty-client-row${isActive ? ' is-active' : ''}`;
      row.innerHTML = `
        <div class="loyalty-client-avatar-sm">${isActive ? '👑' : initials}</div>
        <div class="loyalty-client-info">
          <div class="loyalty-client-info-name">${c.name}</div>
          <div class="loyalty-client-info-meta">${c.phone} · ${c.visits} visitas concluídas</div>
        </div>
        ${isActive ? `<span class="loyalty-active-badge">Ativo</span>` : ''}
        ${stamps > 0 ? `<span class="loyalty-client-stamps-badge">👑 ${stamps}/10</span>` : ''}
        <button class="btn-loyalty-toggle ${isActive ? 'is-active' : ''}" data-phone="${c.phone}" data-name="${c.name}">
          ${isActive ? 'Remover' : '+ Adicionar'}
        </button>
      `;

      const toggleBtn = row.querySelector('.btn-loyalty-toggle');
      toggleBtn.onclick = () => {
        const loyaltyActiveNow = JSON.parse(localStorage.getItem('cesar_barbearia_loyalty_active') || '{}');
        const wasActive = loyaltyActiveNow[c.phone] === true;

        if (wasActive) {
          delete loyaltyActiveNow[c.phone];
          localStorage.setItem('cesar_barbearia_loyalty_active', JSON.stringify(loyaltyActiveNow));
          showToast('Fidelidade Removida', `${c.name} foi removido do programa fidelidade.`);
        } else {
          loyaltyActiveNow[c.phone] = true;
          localStorage.setItem('cesar_barbearia_loyalty_active', JSON.stringify(loyaltyActiveNow));
          showToast('👑 Fidelidade Ativada', `${c.name} foi adicionado ao programa fidelidade. Os selos serão registrados automaticamente!`);
        }

        // Re-render list
        const currentQuery = ($('manage-loyalty-search') || {}).value || '';
        renderManageLoyaltyList(currentQuery.toLowerCase());

        // Refresh CRM if visible
        if (state.currentTab === 'tab-crm') renderCRMTab();
      };

      list.appendChild(row);
    });
  }

  // ── TAB 4: CRM & FIDELIDADE ADMIN ────────────────────────────────────────
  function setupCRMAdmin() {
    $('crm-search-input').oninput = (e) => {
      state.crmSearchQuery = e.target.value.toLowerCase();
      renderCRMTab();
    };

    const btnCrmManage = $('btn-crm-manage-loyalty');
    if (btnCrmManage) {
      btnCrmManage.onclick = () => {
        openManageLoyaltyModal();
      };
    }
  }

  function renderCRMTab() {
    const tbody = $('crm-clients-tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    // Compile customer base from bookings
    const customersMap = {};

    state.bookings.forEach(b => {
      const isBlock = b.serviceId === 'bloqueio' || b.clientName === 'Horário Bloqueado';
      if (isBlock) return;

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

    const loyaltyActive = JSON.parse(localStorage.getItem('cesar_barbearia_loyalty_active') || '{}');
    const customers = Object.values(customersMap).filter(c => loyaltyActive[c.phone] === true);
    
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
      
      // Calculate active stamps count: uses local storage override, fallback to 0 (only manual addition)
      const stamps = clientFidelidades[c.phone] !== undefined ? clientFidelidades[c.phone] : 0;
      const isLoyaltyActive = loyaltyActive[c.phone] === true;

      tr.innerHTML = `
        <td data-label="Cliente" style="font-weight:600;">${c.name}</td>
        <td data-label="WhatsApp">${c.phone}</td>
        <td data-label="Nascimento">${c.birth}</td>
        <td data-label="Visitas" style="font-weight:700;color:var(--gold);">${c.visits} cortes</td>
        <td data-label="Último Agendamento" style="font-size:12px;color:var(--text-muted);">${c.lastBookingStr}</td>
        <td data-label="Fidelidade">
          <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
            <span class="crm-fidelidade-badge">👑 ${stamps}/10</span>
            ${isLoyaltyActive ? '<span class="loyalty-active-badge">Auto ✓</span>' : ''}
          </div>
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
        playNotificationSound(true);
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
      
      playNotificationSound(true);
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

  // ── TAB 5: CONFIGURAÇÕES E PERSONALIZAÇÃO (Abas) ─────────────
  let selectedTheme = 'gold';

  // Helper to place active panel in correct container depending on screen size
  function adjustSettingsPanelPosition() {
    const activePanel = document.querySelector('.settings-accordion-panel.open');
    if (!activePanel) return;
    
    const activeTrigger = document.querySelector('.settings-item.accordion-active');
    if (!activeTrigger) return;
    
    if (window.innerWidth <= 991) {
      // Mobile: Move active panel below trigger button
      if (activeTrigger.nextElementSibling !== activePanel) {
        activeTrigger.after(activePanel);
      }
    } else {
      // Desktop: Move active panel to right column
      const contentColumn = document.querySelector('.settings-content-column');
      if (contentColumn && activePanel.parentElement !== contentColumn) {
        contentColumn.appendChild(activePanel);
      }
    }
  }

  // Monitor screen resize to shift panels if needed
  window.addEventListener('resize', adjustSettingsPanelPosition);

  // Helper: switch settings tab panel
  function openSettingsPanel(panelId, triggerId) {
    // Close all other panels
    document.querySelectorAll('.settings-accordion-panel').forEach(p => {
      if (p.id !== panelId) {
        p.classList.remove('open');
      }
    });
    document.querySelectorAll('.settings-item').forEach(btn => {
      if (btn.id !== triggerId) {
        btn.classList.remove('accordion-active');
      }
    });

    const panel = $(panelId);
    const trigger = $(triggerId);

    if (panel) {
      panel.classList.add('open');
    }
    if (trigger) {
      trigger.classList.add('accordion-active');
    }

    // Move to correct position depending on responsive width
    adjustSettingsPanelPosition();

    // Scroll trigger into view on mobile so it is not cut off
    if (window.innerWidth <= 991 && trigger) {
      setTimeout(() => {
        trigger.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 150);
    }
  }

  function closeSettingsPanel(panelId) {
    const panel = $(panelId);
    if (panel) panel.classList.remove('open');
    document.querySelectorAll('.settings-item').forEach(btn => btn.classList.remove('accordion-active'));
  }

  // Helper: generate reports data
  function generateReports(days = 7) {
    const now = new Date();
    now.setHours(23, 59, 59, 999);
    const cutoffDate = days === 'all' ? new Date(0) : new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));
    cutoffDate.setHours(0, 0, 0, 0);
    
    let total = 0;
    let concluido = 0;
    let pendente = 0;
    let falta = 0;
    
    let clientCounts = {};
    let serviceCounts = {};

    state.bookings.forEach(b => {
      if (b.serviceId === 'bloqueio' || b.clientName === 'Horário Bloqueado') return;
      
      const bDate = parseLocalDate(b.date);
      if (bDate >= cutoffDate) {
        total++;
        if (b.status === 'Concluido') concluido++;
        else if (b.status === 'Cancelado') falta++;
        else pendente++;
        
        if (b.clientName) {
          clientCounts[b.clientName] = (clientCounts[b.clientName] || 0) + 1;
        }
        if (b.serviceName) {
          serviceCounts[b.serviceName] = (serviceCounts[b.serviceName] || 0) + 1;
        }
      }
    });

    const elTotal = $('rep-val-total');
    const elConcluidos = $('rep-val-concluidos');
    const elPendentes = $('rep-val-pendentes');
    const elFaltas = $('rep-val-faltas');

    if (elTotal) elTotal.textContent = total;
    if (elConcluidos) elConcluidos.innerHTML = `${concluido} <span style="font-size:14px;color:var(--text-muted)">/${total}</span>`;
    if (elPendentes) elPendentes.textContent = pendente;
    if (elFaltas) elFaltas.textContent = falta;

    // Ranking Clients
    const topClients = Object.entries(clientCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const rankingBox = $('rep-ranking-box');
    if (rankingBox) {
      if (topClients.length === 0) {
        rankingBox.innerHTML = 'Nenhum cliente neste período';
        rankingBox.className = 'reports-empty-box';
      } else {
        rankingBox.className = 'report-list-container';
        rankingBox.innerHTML = topClients.map(([name, count]) => `
          <div class="rep-rank-item">
            <span class="name">${name}</span>
            <span class="val">${count} agendamento${count > 1 ? 's' : ''}</span>
          </div>
        `).join('');
      }
    }

    // Demanda Services
    const topServices = Object.entries(serviceCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const demandaBox = $('rep-demanda-box');
    if (demandaBox) {
      if (topServices.length === 0) {
        demandaBox.innerHTML = 'Nenhum serviço neste período';
        demandaBox.className = 'reports-empty-box';
      } else {
        demandaBox.className = 'report-list-container';
        demandaBox.innerHTML = topServices.map(([name, count]) => `
          <div class="rep-rank-item">
            <span class="name">${name}</span>
            <span class="val">${count} vez${count > 1 ? 'es' : ''}</span>
          </div>
        `).join('');
      }
    }
  }

  function setupSettingsAdmin() {
    // Foto do Perfil Upload Trigger
    const profileImgInput = $('set-profile-img-file');
    const profileImgBtn = $('btn-upload-profile-img');
    const profileImgPreview = $('set-profile-img-preview');
    if (profileImgBtn && profileImgInput && profileImgPreview) {
      profileImgBtn.addEventListener('click', () => profileImgInput.click());
      profileImgInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          if (file.size > 1024 * 1024) {
            alert("A imagem é muito grande. O limite máximo é 1MB.");
            return;
          }
          const reader = new FileReader();
          reader.onload = (event) => {
            profileImgPreview.src = event.target.result;
          };
          reader.readAsDataURL(file);
        }
      });
    }

    // Foto da Capa Upload Trigger
    const coverImgInput = $('set-cover-img-file');
    const coverImgBtn = $('btn-upload-cover-img');
    const coverImgPreview = $('set-cover-img-preview');
    if (coverImgBtn && coverImgInput && coverImgPreview) {
      coverImgBtn.addEventListener('click', () => coverImgInput.click());
      coverImgInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          if (file.size > 1024 * 1024) {
            alert("A imagem é muito grande. O limite máximo é 1MB.");
            return;
          }
          const reader = new FileReader();
          reader.onload = (event) => {
            coverImgPreview.src = event.target.result;
          };
          reader.readAsDataURL(file);
        }
      });
    }

    // Theme options click handlers
    document.querySelectorAll('.btn-theme-selector').forEach(btn => {
      btn.onclick = () => {
        document.querySelectorAll('.btn-theme-selector').forEach(b => {
          b.classList.remove('active');
          b.style.borderColor = 'transparent';
        });
        btn.classList.add('active');
        selectedTheme = btn.dataset.color;
        
        // Toggle Custom Colors container display
        const customContainer = $('custom-colors-container');
        if (selectedTheme === 'custom') {
          customContainer.classList.remove('hidden');
        } else {
          customContainer.classList.add('hidden');
        }
        
        // Dynamic preview
        if (selectedTheme === 'custom') {
          btn.style.borderColor = $('set-color-border').value;
          const customThemeObj = {
            theme: 'custom',
            profileImg: $('set-profile-img-preview').src,
            coverImg: $('set-cover-img-preview').src,
            borderColor: $('set-color-border').value,
            textColor: $('set-color-text').value,
            bgColor: $('set-color-bg').value
          };
          applyTheme(JSON.stringify(customThemeObj));
        } else {
          const t = themes[selectedTheme] || themes.gold;
          btn.style.borderColor = t.primary;
          
          const presetThemeObj = {
            theme: selectedTheme,
            profileImg: $('set-profile-img-preview').src,
            coverImg: $('set-cover-img-preview').src,
            borderColor: t.primary,
            textColor: '#FFFFFF',
            bgColor: '#030304'
          };
          applyTheme(JSON.stringify(presetThemeObj));
        }
      };
    });

    // Custom color inputs change handler
    ['set-color-border', 'set-color-text', 'set-color-bg'].forEach(id => {
      const el = $(id);
      if (el) {
        el.addEventListener('change', () => {
          if (selectedTheme === 'custom') {
            const btnCustom = document.querySelector('.btn-theme-selector[data-color="custom"]');
            if (btnCustom) btnCustom.style.borderColor = $('set-color-border').value;
            
            const customThemeObj = {
              theme: 'custom',
              profileImg: $('set-profile-img-preview').src,
              coverImg: $('set-cover-img-preview').src,
              borderColor: $('set-color-border').value,
              textColor: $('set-color-text').value,
              bgColor: $('set-color-bg').value
            };
            applyTheme(JSON.stringify(customThemeObj));
          }
        });
      }
    });

    // Submit do formulário de perfil (dentro do panel-profile)
    const formProfile = $('form-config-profile');
    if (formProfile) {
      formProfile.addEventListener('submit', async (e) => {
        e.preventDefault();

        const config = state.config || {};
        config.name = $('set-barber-name').value.trim();
        config.phone = $('set-barber-phone').value.trim();
        config.address = $('set-barber-address').value.trim();
        config.instagram = $('set-barber-instagram').value.trim();

        // Serialize theme with custom photos and colors
        const profileImg = $('set-profile-img-preview').src;
        const coverImg = $('set-cover-img-preview').src;
        
        const themeObj = {
          theme: selectedTheme,
          profileImg: profileImg,
          coverImg: coverImg,
          borderColor: selectedTheme === 'custom' ? $('set-color-border').value : (themes[selectedTheme] ? themes[selectedTheme].primary : '#C8922A'),
          textColor: selectedTheme === 'custom' ? $('set-color-text').value : '#FFFFFF',
          bgColor: selectedTheme === 'custom' ? $('set-color-bg').value : '#030304'
        };
        
        config.theme = JSON.stringify(themeObj);

        localStorage.setItem('cesar_barbearia_configuracoes', JSON.stringify(config));
        state.config = config;

        const titleEl = $q('.brand-info h2');
        if (titleEl) titleEl.textContent = config.name;

        applyTheme(config.theme);
        
        // Push update to Supabase
        try {
          const { error } = await supabase.from('configuracoes')
            .update({
              name: config.name,
              phone: config.phone,
              address: config.address,
              instagram: config.instagram,
              theme: config.theme
            })
            .eq('id', 'config_geral');
          if (error) throw error;
          showToast("Perfil Salvo", "As informações da barbearia foram atualizadas.");
        } catch (err) {
          console.error("Erro ao salvar perfil no Supabase:", err);
          showToast("Salvo Localmente", "Atualizado com sucesso localmente, mas houve um erro ao enviar para o servidor.");
        }

        localStorage.setItem('cesar_barbearia_config_alterada', JSON.stringify({ timestamp: Date.now() }));
        renderAll();
      });
    }

    // Submit do formulário de horários (dentro do modal-config-hours)
    const formHours = $('form-config-hours');
    if (formHours) {
      formHours.addEventListener('submit', async (e) => {
        e.preventDefault();

        const openDays = [];
        for (let i = 0; i <= 6; i++) {
          const cb = $(`set-day-${i}`);
          if (cb && cb.checked) openDays.push(i);
        }

        const config = state.config || {};
        config.openDays = openDays;
        config.timeStart = $('set-time-start') ? $('set-time-start').value : config.timeStart;
        config.timeEnd = $('set-time-end') ? $('set-time-end').value : config.timeEnd;
        config.interval = $('set-time-interval') ? parseInt($('set-time-interval').value) : config.interval;

        localStorage.setItem('cesar_barbearia_configuracoes', JSON.stringify(config));
        state.config = config;

        // Push update to Supabase
        try {
          const { error } = await supabase.from('configuracoes')
            .update({
              openDays: config.openDays,
              timeStart: config.timeStart,
              timeEnd: config.timeEnd,
              interval: config.interval
            })
            .eq('id', 'config_geral');
          if (error) throw error;
          showToast("Horários Salvos", "Os horários de funcionamento foram atualizados.");
        } catch (err) {
          console.error("Erro ao salvar horários no Supabase:", err);
          showToast("Salvo Localmente", "Atualizado com sucesso localmente, mas houve um erro ao enviar para o servidor.");
        }

        localStorage.setItem('cesar_barbearia_config_alterada', JSON.stringify({ timestamp: Date.now() }));
        renderAll();
      });
    }

    // Accordion panel bindings (replace modals)
    const btnReports = $('set-item-reports');
    if (btnReports) {
      btnReports.onclick = () => {
        openSettingsPanel('panel-reports', 'set-item-reports');
        if ($('panel-reports').classList.contains('open')) {
          generateReports(7);
          document.querySelectorAll('.report-filter-pill').forEach(p => p.classList.remove('active'));
          const defaultPill = document.querySelector('.report-filter-pill[data-days="7"]');
          if (defaultPill) defaultPill.classList.add('active');
        }
      };
    }

    // Reports Pill Filters
    document.querySelectorAll('.report-filter-pill').forEach(pill => {
      pill.onclick = (e) => {
        document.querySelectorAll('.report-filter-pill').forEach(p => p.classList.remove('active'));
        e.target.classList.add('active');
        const days = e.target.dataset.days;
        generateReports(days === 'all' ? 'all' : parseInt(days));
      };
    });

    const btnFinancial = $('set-item-financial');
    if (btnFinancial) btnFinancial.onclick = () => openSettingsPanel('panel-financial', 'set-item-financial');

    const btnFaq = $('set-item-faq');
    if (btnFaq) btnFaq.onclick = () => openSettingsPanel('panel-faq', 'set-item-faq');

    const btnProfile = $('set-item-profile');
    if (btnProfile) btnProfile.onclick = () => openSettingsPanel('panel-profile', 'set-item-profile');

    const btnHours = $('set-item-hours');
    if (btnHours) btnHours.onclick = () => openSettingsPanel('panel-hours', 'set-item-hours');

    const btnNotifications = $('set-item-notifications');
    if (btnNotifications) btnNotifications.onclick = () => openSettingsPanel('panel-notifications', 'set-item-notifications');

    const btnShare = $('set-item-share');
    if (btnShare) btnShare.onclick = () => openSettingsPanel('panel-share', 'set-item-share');

    // Copy link in settings
    const btnSettingsCopy = $('set-item-copy-link');
    if (btnSettingsCopy) {
      btnSettingsCopy.onclick = () => {
        const url = $('dashboard-booking-url') ? $('dashboard-booking-url').textContent : "https://agendcerta.vercel.app";
        navigator.clipboard.writeText(url).then(() => {
          showToast("Link Copiado", "O link de agendamento foi copiado para a área de transferência!");
        }).catch(err => {
          console.error("Could not copy: ", err);
          const el = document.createElement('textarea');
          el.value = url;
          document.body.appendChild(el);
          el.select();
          document.execCommand('copy');
          document.body.removeChild(el);
          showToast("Link Copiado", "O link de agendamento foi copiado!");
        });
      };
    }

    // Share link in settings
    const btnSettingsShare = $('set-item-share-link');
    if (btnSettingsShare) {
      btnSettingsShare.onclick = () => {
        const url = $('dashboard-booking-url') ? $('dashboard-booking-url').textContent : "https://agendcerta.vercel.app";
        if (navigator.share) {
          navigator.share({
            title: (state.config && state.config.name) || 'César Barbearia',
            text: 'Agende seu horário online na César Barbearia!',
            url: url
          }).catch(err => console.log('Error sharing:', err));
        } else {
          navigator.clipboard.writeText(url).then(() => {
            showToast("Compartilhar", "Link copiado! Envie para seus clientes.");
          });
        }
      };
    }

    // Notification settings event listeners
    const notifToggle = $('set-notif-sound-toggle');
    const notifSelect = $('set-notif-sound-select');
    const notifTestBtn = $('btn-test-notif-sound');

    if (notifToggle) {
      notifToggle.addEventListener('change', (e) => {
        localStorage.setItem('cesar_notif_enabled', e.target.checked);
        if (e.target.checked) playNotificationSound(true);
      });
    }

    if (notifSelect) {
      notifSelect.addEventListener('change', (e) => {
        localStorage.setItem('cesar_notif_sound', e.target.value);
        playNotificationSound(true);
      });
    }

    if (notifTestBtn) {
      notifTestBtn.addEventListener('click', () => {
        if (notifSelect) {
          localStorage.setItem('cesar_notif_sound', notifSelect.value);
        }
        playNotificationSound(true);
      });
    }
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

    // Load images previews and color inputs
    const themeKey = config.theme;
    let themeName = themeKey;
    let customColors = null;
    let profileSrc = './imagens_hero/cesar.webp';
    let coverSrc = './imagens_hero/hero.png';
    
    if (themeKey && themeKey.startsWith('{')) {
      try {
        const themeConfig = JSON.parse(themeKey);
        themeName = themeConfig.theme || 'custom';
        profileSrc = themeConfig.profileImg || profileSrc;
        coverSrc = themeConfig.coverImg || coverSrc;
        customColors = {
          border: themeConfig.borderColor || '#C8922A',
          text: themeConfig.textColor || '#FFFFFF',
          bg: themeConfig.bgColor || '#030304'
        };
      } catch (e) {
        console.error("Error parsing theme JSON in render:", e);
      }
    }
    
    $('set-profile-img-preview').src = profileSrc;
    $('set-cover-img-preview').src = coverSrc;
    
    selectedTheme = themeName || 'gold';
    
    // Select color theme button
    document.querySelectorAll('.btn-theme-selector').forEach(btn => {
      if (btn.dataset.color === selectedTheme) {
        btn.classList.add('active');
        const t = themes[selectedTheme] || { primary: (customColors ? customColors.border : '#C8922A') };
        btn.style.borderColor = t.primary;
      } else {
        btn.classList.remove('active');
        btn.style.borderColor = 'transparent';
      }
    });
    
    // Toggle Custom Colors container visibility
    const colorsContainer = $('custom-colors-container');
    if (selectedTheme === 'custom') {
      colorsContainer.classList.remove('hidden');
      if (customColors) {
        $('set-color-border').value = customColors.border;
        $('set-color-text').value = customColors.text;
        $('set-color-bg').value = customColors.bg;
      }
    } else {
      colorsContainer.classList.add('hidden');
    }

    // Load Notification settings
    const notifToggle = $('set-notif-sound-toggle');
    const notifSelect = $('set-notif-sound-select');
    
    if (notifToggle) {
      notifToggle.checked = localStorage.getItem('cesar_notif_enabled') !== 'false';
    }
    
    if (notifSelect) {
      const soundType = localStorage.getItem('cesar_notif_sound') || 'chime';
      notifSelect.value = soundType;
    }

    // Default settings tab (Reports) if none is currently active
    const hasOpen = Array.from(document.querySelectorAll('.settings-accordion-panel')).some(p => p.classList.contains('open'));
    if (!hasOpen) {
      openSettingsPanel('panel-reports', 'set-item-reports');
      generateReports(7);
    }
  }

  // Initialize Panel
  init();

});
