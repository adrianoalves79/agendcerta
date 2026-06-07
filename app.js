/**
 * ==========================================================================
 * CÉSAR BARBEARIA — APP CONTROLLER
 * ==========================================================================
 */

import { supabase } from './supabaseClient.js';

document.addEventListener('DOMContentLoaded', () => {

  // ── Tema de Cores do Painel (CSS Variables)
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
    document.documentElement.style.setProperty('--border', t.border || 'rgba(255,255,255,0.15)');
    document.documentElement.style.setProperty('--border-card', t.borderCard || 'rgba(255,255,255,0.18)');

    if (t.text) {
      document.documentElement.style.setProperty('--text', t.text);
    }
    if (t.bg) {
      document.documentElement.style.setProperty('--bg', t.bg);
      document.documentElement.style.setProperty('--bg-card', lightenDarkenColor(t.bg, 8));
      document.documentElement.style.setProperty('--bg-input', lightenDarkenColor(t.bg, 8));
      document.documentElement.style.setProperty('--bg-section', t.bg);
    } else {
      document.documentElement.style.removeProperty('--text');
      document.documentElement.style.removeProperty('--bg');
      document.documentElement.style.removeProperty('--bg-card');
      document.documentElement.style.removeProperty('--bg-input');
      document.documentElement.style.removeProperty('--bg-section');
    }

    // Apply custom cover image to hero section if present
    const heroBg = document.getElementById('hero-bg');
    if (heroBg) {
      if (customCover) {
        heroBg.src = customCover;
      } else {
        heroBg.src = './imagens_hero/hero.png';
      }
    }
  }

  async function loadBrandingConfig() {
    const { data: config, error } = await supabase.from('configuracoes').select('*').eq('id', 'config_geral').single();
    if (!config) return;

    state.config = config;
    applyTheme(config.theme);

    // Update footer labels dynamically
    document.querySelectorAll('.footer-col').forEach(col => {
      const label = col.querySelector('.footer-col-label');
      const val = col.querySelector('.footer-col-val');
      if (!label || !val) return;
      
      const txt = label.textContent.trim();
      if (txt === 'Telefone') {
        val.textContent = config.phone;
      } else if (txt === 'Endereço') {
        val.innerHTML = config.address.replace(', ', '<br>');
      } else if (txt === 'Horário') {
        const daysLong = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        const minDay = Math.min(...config.openDays);
        const maxDay = Math.max(...config.openDays);
        
        let daysStr = "Seg à Sáb";
        if (config.openDays.length > 0) {
          if (minDay === maxDay) {
            daysStr = daysLong[minDay];
          } else {
            daysStr = `${daysLong[minDay]} à ${daysLong[maxDay]}`;
          }
        }
        val.innerHTML = `${daysStr}: ${config.timeStart} às ${config.timeEnd}<br>Dom: Fechado`;
      }
    });

    // Update branding headers if they exist
    const heroTitle = document.querySelector('.hero-title');
    if (heroTitle) {
      heroTitle.innerHTML = config.name.toUpperCase().replace('BARBEARIA', '<span style="color: var(--gold);">BARBEARIA</span>');
    }
  }

  // Listen to configuration changes from admin panel via Supabase Realtime
  supabase.channel('config-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'configuracoes' }, payload => {
      loadBrandingConfig();
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'servicos' }, payload => {
      loadAndRenderServices();
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'profissionais' }, payload => {
      loadAndRenderProfessionals();
    })
    .subscribe();

  // ── State ──────────────────────────────────────────────────────────────
  const state = {
    step: 1,
    service: null,   // { id, name, price, duration, img }
    professional: null, // { id, name, specialty, img }
    date: null,      // Date object
    time: null,      // "HH:MM"
    client: { name: '', phone: '', birth: '', obs: '' },
    cal: { month: new Date().getMonth(), year: new Date().getFullYear() },
    config: null,
    lastBookingId: null
  };

  // Expose for inline onclick
  window.app = { go };

  // ── DOM refs ───────────────────────────────────────────────────────────
  const $ = id => document.getElementById(id);
  const $q = sel => document.querySelector(sel);

  // ── Navigation ─────────────────────────────────────────────────────────
  function go(target) {
    if (target < 1 || target > 5) return;

    // Hide current, show target
    $(`step-${state.step}`).classList.remove('active');
    $(`step-${target}`).classList.add('active');
    state.step = target;

    updateHeader(target);
    updateProgress(target);
    populateStep(target);

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function updateHeader(step) {
    const branding   = $('hero-branding');
    const btnBack    = $('btn-back');
    const btnMenu    = $('btn-menu');
    const progressEl = $('progress-section');

    // Back / menu
    if (step > 1 && step < 5) {
      if (btnBack) btnBack.classList.remove('hidden');
      if (btnMenu) btnMenu.classList.add('hidden');
    } else {
      if (btnBack) btnBack.classList.add('hidden');
      if (btnMenu) btnMenu.classList.remove('hidden');
    }

    if (step === 1) {
      if (branding) branding.classList.remove('hidden');
      progressEl.classList.remove('hidden');
    } else if (step === 5) {
      if (branding) branding.classList.add('hidden');
      progressEl.classList.add('hidden');
    } else {
      if (branding) branding.classList.add('hidden');
      progressEl.classList.remove('hidden');
    }
  }

  function updateProgress(step) {
    const CHECKMARK = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>`;

    const progressEl = $('progress-section');
    if (progressEl) {
      if (step === 1) {
        progressEl.classList.add('step-1');
      } else {
        progressEl.classList.remove('step-1');
      }
    }

    for (let i = 1; i <= 4; i++) {
      const dot    = $(`dot-${i}`);
      const circle = $(`circle-${i}`);
      dot.classList.remove('active', 'done');

      if (i < step) {
        dot.classList.add('done');
        circle.innerHTML = CHECKMARK;
      } else if (i === step) {
        dot.classList.add('active');
        circle.textContent = i;
      } else {
        circle.textContent = i;
      }
    }

    // Connector lines
    for (let i = 1; i <= 3; i++) {
      const line = $(`line-${i}-${i+1}`);
      line.classList.toggle('done', step > i);
    }

    const sub = $('progress-sub');
    if (sub && step <= 4) sub.textContent = `Passo ${step} de 4`;
  }

  async function populateStep(step) {
    if (!state.service) return;

    if (step === 2) {
      $('s2-img').src       = state.service.img;
      $('s2-name').textContent = state.service.name;
      $('s2-dur').textContent  = state.service.duration;
      $('s2-price').textContent = state.service.price;
      await fetchMonthBookings();
      buildCalendar();
      await buildTimeSlots();
    }

    if (step === 3) {
      $('s3-img').src  = state.service.img;
      $('s3-name').textContent = state.service.name;
      $('s3-date').textContent = fmtDate(state.date);
      $('s3-time').textContent = state.time;
    }

    if (step === 4) {
      $('s4-img').src = state.service.img;
      $('s4-service-name').textContent = state.service.name;
      $('s4-duration').textContent     = state.service.duration;
      $('s4-date').textContent         = fmtDate(state.date);
      $('s4-time').textContent         = state.time;
      $('s4-name').textContent         = state.client.name;
      $('s4-phone').textContent        = state.client.phone;

      const s4Prof = $('s4-prof-name');
      if (s4Prof) {
        s4Prof.textContent = state.professional ? state.professional.name : 'César';
      }
    }

    if (step === 5) {
      $('t-name').textContent    = state.client.name.split(' ')[0];
      $('t-service').textContent = state.service.name;
      $('t-date').textContent    = fmtDate(state.date);
      $('t-time').textContent    = state.time;

      const tProf = $('t-prof-name');
      if (tProf) {
        tProf.textContent = state.professional ? state.professional.name : 'César';
      }
    }
  }

  // ── Step 1: Services ───────────────────────────────────────────────────
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

  async function loadAndRenderServices() {
    let { data: services, error } = await supabase.from('servicos').select('*');
    if (error || !services || services.length === 0) {
      services = defaultServices;
    }

    const activeServices = services.filter(s => s.id !== 'bloqueio');

    const grid = $('services-list');
    if (!grid) return;
    grid.innerHTML = '';

    activeServices.forEach(service => {
      const card = document.createElement('div');
      card.className = 'service-card';
      card.dataset.id = service.id;
      card.dataset.name = service.name;
      card.dataset.price = service.price;
      card.dataset.duration = service.duration;
      card.dataset.img = service.img;

      // Formatar label interna da miniatura do serviço
      const displayLabel = service.name.toUpperCase().replace(' + ', '<br>+ ').replace(' +', '<br>+');

      card.innerHTML = `
        <div class="service-thumb">
          <img src="${service.img}" alt="${service.name}">
          <div class="service-thumb-label">${displayLabel}</div>
        </div>
        <div class="service-info">
          <div class="service-name">${service.name}</div>
          <div class="service-meta">
            <span class="service-price">${service.price}</span>
            <span class="service-dur">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              ${service.duration}
            </span>
          </div>
        </div>
        <div class="service-chevron">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </div>
      `;

      card.addEventListener('click', () => {
        state.service = {
          id: service.id,
          name: service.name,
          price: service.price,
          duration: service.duration,
          img: service.img
        };
        go(2);
      });

      grid.appendChild(card);
    });
  }

  // ── Step 2: Calendar ───────────────────────────────────────────────────
  const MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
                  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

  let monthBookings = [];

  async function fetchMonthBookings() {
    if (!state.professional) return;
    const { month, year } = state.cal;
    const lastDay = new Date(year, month + 1, 0).getDate();
    const startStr = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const endStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    
    const { data, error } = await supabase.from('agendamentos').select('date, time, professional, status')
      .eq('professional', state.professional.name)
      .neq('status', 'Cancelado')
      .gte('date', startStr)
      .lte('date', endStr);
      
    if (error) {
      console.error("Erro ao buscar bloqueios do mês:", error);
      monthBookings = [];
    } else {
      monthBookings = data || [];
    }
  }

  $('cal-prev').addEventListener('click', async () => {
    state.cal.month--;
    if (state.cal.month < 0) { state.cal.month = 11; state.cal.year--; }
    await fetchMonthBookings();
    buildCalendar();
  });

  $('cal-next').addEventListener('click', async () => {
    state.cal.month++;
    if (state.cal.month > 11) { state.cal.month = 0; state.cal.year++; }
    await fetchMonthBookings();
    buildCalendar();
  });

  function buildCalendar() {
    const { month, year } = state.cal;
    $('cal-month-display').textContent = `${MONTHS[month]} ${year}`.toUpperCase();

    const grid      = $('cal-days');
    grid.innerHTML  = '';
    const firstDay  = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const today     = new Date(); today.setHours(0,0,0,0);

    // Empty cells for offset
    for (let i = 0; i < firstDay; i++) {
      const blank = document.createElement('div');
      grid.appendChild(blank);
    }

    const openDays = (state.config && state.config.openDays) ? state.config.openDays : [1, 2, 3, 4, 5, 6];

    for (let d = 1; d <= totalDays; d++) {
      const dateObj = new Date(year, month, d);
      const btn     = document.createElement('button');
      btn.className = 'cal-day';
      btn.textContent = d;

      const isWorkingDay = openDays.includes(dateObj.getDay());

      // Check if this date is blocked all day
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const isAllDayBlocked = monthBookings.some(b => 
        b.date === dateStr && b.time === 'Dia Inteiro'
      );

      if (dateObj < today || !isWorkingDay || isAllDayBlocked) {
        btn.classList.add('past');
        btn.disabled = true;
      } else {
        if (state.date && dateObj.toDateString() === state.date.toDateString()) {
          btn.classList.add('selected');
        }
        if (dateObj.toDateString() === today.toDateString()) {
          btn.classList.add('today');
        }
        btn.addEventListener('click', async () => {
          state.date = dateObj;
          state.time = null;
          const continueBtn = $('btn-continue-2');
          continueBtn.classList.add('disabled');
          continueBtn.disabled = true;
          buildCalendar();
          await buildTimeSlots();
        });
      }

      grid.appendChild(btn);
    }
  }

  async function buildTimeSlots() {
    const grid  = $('time-grid');
    grid.innerHTML = '';

    if (!state.date) {
      grid.innerHTML = '<p style="grid-column:1/-1;text-align:center;font-size:12px;color:#666;padding:10px 0">Selecione uma data primeiro</p>';
      return;
    }

    const { data: configData } = await supabase.from('configuracoes').select('timeStart, timeEnd, interval').eq('id', 'config_geral').single();
    const config = configData || {};
    const startHour = parseInt(config.timeStart ? config.timeStart.split(':')[0] : 9);
    const endHour = parseInt(config.timeEnd ? config.timeEnd.split(':')[0] : 20);
    const intervalMin = config.interval !== undefined ? config.interval : 60;

    const slots = [];
    let current = new Date();
    current.setHours(startHour, 0, 0, 0);

    const endLimit = new Date();
    endLimit.setHours(endHour, 0, 0, 0);

    while (current <= endLimit) {
      const h = String(current.getHours()).padStart(2, '0');
      const m = String(current.getMinutes()).padStart(2, '0');
      const timeStr = `${h}:${m}`;
      
      // Ignora horários de almoço comuns (12:00 a 13:00)
      if (current.getHours() !== 12) {
        slots.push(timeStr);
      }
      
      current.setMinutes(current.getMinutes() + intervalMin);
    }

    const now    = new Date();
    const isToday = state.date.toDateString() === now.toDateString();

    // Buscar agendamentos existentes para desabilitar horários já ocupados
    const dateStr = `${state.date.getFullYear()}-${String(state.date.getMonth() + 1).padStart(2, '0')}-${String(state.date.getDate()).padStart(2, '0')}`; // YYYY-MM-DD
    const { data: bookings } = await supabase.from('agendamentos').select('time, professional, status')
      .eq('date', dateStr)
      .neq('status', 'Cancelado');
    
    const validBookings = bookings || [];

    const hasAllDayBlock = validBookings.some(b => 
      b.time === 'Dia Inteiro' &&
      b.professional === (state.professional ? state.professional.name : "César")
    );

    const bookedTimes = new Set(
      validBookings
        .filter(b => {
          const isSameProf = b.professional === (state.professional ? state.professional.name : "César");
          return isSameProf;
        })
        .map(b => b.time)
    );

    slots.forEach(t => {
      const btn = document.createElement('button');
      btn.className   = 'time-slot';
      btn.textContent = t;

      const [h, m] = t.split(':').map(Number);
      const slotDt  = new Date(state.date);
      slotDt.setHours(h, m, 0, 0);

      const isBooked = hasAllDayBlock || bookedTimes.has(t);

      if (isToday && slotDt <= now) {
        btn.disabled = true;
      } else if (isBooked) {
        btn.disabled = true;
        btn.classList.add('booked');
        btn.title = hasAllDayBlock ? "Sem atendimentos nesta data" : "Horário já reservado";
      } else {
        if (state.time === t) btn.classList.add('selected');
        btn.addEventListener('click', () => {
          state.time = t;
          document.querySelectorAll('.time-slot').forEach(b => b.classList.remove('selected'));
          btn.classList.add('selected');
          const cont = $('btn-continue-2');
          cont.classList.remove('disabled');
          cont.disabled = false;
        });
      }
      grid.appendChild(btn);
    });
  }

  $('btn-continue-2').addEventListener('click', () => {
    if (state.date && state.time) go(3);
  });

  $('btn-alter-2').addEventListener('click', () => go(1));

  // ── Step 3: Form ───────────────────────────────────────────────────────
  // Phone mask
  $('input-phone').addEventListener('input', e => {
    let v = e.target.value.replace(/\D/g, '').slice(0, 11);
    let r = '';
    if (v.length > 0) r = '(' + v.slice(0, 2);
    if (v.length > 2) r += ') ' + v.slice(2, 7);
    if (v.length > 7) r += '-' + v.slice(7, 11);
    e.target.value = r;
  });

  // Birth mask
  $('input-birth').addEventListener('input', e => {
    let v = e.target.value.replace(/\D/g, '').slice(0, 8);
    let r = '';
    if (v.length > 0) r = v.slice(0, 2);
    if (v.length > 2) r += '/' + v.slice(2, 4);
    if (v.length > 4) r += '/' + v.slice(4, 8);
    e.target.value = r;
  });

  $('btn-alter-3').addEventListener('click', () => go(2));

  $('btn-continue-3').addEventListener('click', () => {
    let ok = true;

    const nameInput  = $('input-name');
    const phoneInput = $('input-phone');
    const nameField  = $('field-name');
    const phoneField = $('field-phone');

    if (nameInput.value.trim().length < 3) {
      nameField.classList.add('has-error'); ok = false;
    } else {
      nameField.classList.remove('has-error');
    }

    if (!/^\(\d{2}\) \d{5}-\d{4}$/.test(phoneInput.value.trim())) {
      phoneField.classList.add('has-error'); ok = false;
    } else {
      phoneField.classList.remove('has-error');
    }

    if (ok) {
      state.client.name  = nameInput.value.trim();
      state.client.phone = phoneInput.value.trim();
      state.client.birth = $('input-birth').value.trim();
      state.client.obs   = $('input-obs').value.trim();
      go(4);
    }
  });

  // ── Step 4: Confirm ────────────────────────────────────────────────────
  $('btn-confirm').addEventListener('click', async () => {
    // Verificar se o horário já foi agendado por outra pessoa em tempo real
    const dateStr = `${state.date.getFullYear()}-${String(state.date.getMonth() + 1).padStart(2, '0')}-${String(state.date.getDate()).padStart(2, '0')}`;
    const { data: bookings } = await supabase.from('agendamentos').select('id, time')
      .eq('date', dateStr)
      .eq('professional', state.professional ? state.professional.name : "César")
      .neq('status', 'Cancelado');

    const isAlreadyBooked = bookings && bookings.some(b => b.time === state.time || b.time === 'Dia Inteiro');

    if (isAlreadyBooked) {
      alert("Desculpe, este horário já foi reservado por outro cliente. Por favor, escolha outro horário.");
      go(2);
      return;
    }

    const overlay = $('loading-overlay');
    overlay.classList.add('active');
    
    // Persist booking in Supabase
    try {
      const { data, error } = await supabase.from('agendamentos').insert([{
        clientName: state.client.name,
        clientPhone: state.client.phone,
        clientBirth: state.client.birth,
        clientObs: state.client.obs,
        serviceId: state.service.id,
        serviceName: state.service.name,
        servicePrice: state.service.price,
        serviceDuration: state.service.duration,
        date: dateStr,
        time: state.time,
        professional: state.professional ? state.professional.name : "César",
        status: "Confirmado"
      }]).select();

      if (error) throw error;
      
      if (data && data[0]) {
        state.lastBookingId = data[0].id;
      }
    } catch (err) {
      console.error("Erro ao salvar agendamento no Supabase:", err);
      alert("Ocorreu um erro ao salvar o agendamento. Tente novamente.");
      overlay.classList.remove('active');
      return;
    }

    setTimeout(() => {
      overlay.classList.remove('active');
      go(5);
    }, 1600);
  });

  // ── Step 5: Actions ────────────────────────────────────────────────────
  $('btn-whatsapp').addEventListener('click', async () => {
    const { data: config } = await supabase.from('configuracoes').select('name, phone').eq('id', 'config_geral').single();
    const targetName = config && config.name ? config.name.split(' ')[0] : 'César';
    const targetPhone = config && config.phone ? '55' + config.phone.replace(/\D/g, '') : '5511999999999';
    const barberShopName = config && config.name ? config.name : 'César Barbearia';
    
    const bookingCode = state.lastBookingId ? state.lastBookingId.substring(0, 8).toUpperCase() : 'AG' + Date.now().toString().slice(-6);
    const cancelLink = `${window.location.origin}/cancelar.html?code=${state.lastBookingId || ''}`;

    const msg = encodeURIComponent(
      `Olá!\n\n` +
      `Acabei de realizar um agendamento pelo sistema.\n\n` +
      `Cliente: ${state.client.name}\n` +
      `Unidade: ${barberShopName}\n` +
      `Profissional: ${state.professional ? state.professional.name : "César"}\n` +
      `Serviço: ${state.service.name}\n` +
      `Data: ${fmtDate(state.date)}\n` +
      `Horário: ${state.time}\n` +
      `Valor: ${state.service.price}\n` +
      `Código: ${bookingCode}\n\n` +
      `Caso precise cancelar:\n` +
      `${cancelLink}\n\n` +
      `Nos vemos em breve. Obrigado!`
    );
    window.open(`https://api.whatsapp.com/send?phone=${targetPhone}&text=${msg}`, '_blank');
  });

  const btnCalendar = $('btn-calendar');
  if (btnCalendar) {
    btnCalendar.addEventListener('click', () => {
      if (!state.service || !state.date || !state.time) return;
      const [h, m] = state.time.split(':').map(Number);
      const start  = new Date(state.date); start.setHours(h, m, 0, 0);
      const end    = new Date(start); end.setMinutes(end.getMinutes() + 60);
      const fmt    = d => d.toISOString().replace(/[-:]/g,'').split('.')[0] + 'Z';
      const ics = [
        'BEGIN:VCALENDAR','VERSION:2.0','BEGIN:VEVENT',
        `DTSTART:${fmt(start)}`,`DTEND:${fmt(end)}`,
        `SUMMARY:Agendamento - ${state.service.name} (${state.professional ? state.professional.name : 'César'}) | César Barbearia`,
        'LOCATION:Praça Lucila Macedo Dêda, São Paulo - SP',
        'BEGIN:VALARM','TRIGGER:-PT30M','ACTION:DISPLAY',
        'DESCRIPTION:Lembrete - César Barbearia','END:VALARM',
        'END:VEVENT','END:VCALENDAR'
      ].join('\r\n');
      const blob = new Blob([ics], { type: 'text/calendar' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `agendamento-${(state.professional ? state.professional.name : 'cesar').toLowerCase()}.ics`;
      a.click();
    });
  }

  // ── Header back button ─────────────────────────────────────────────────
  $('btn-back').addEventListener('click', () => {
    if (state.step > 1 && state.step < 5) go(state.step - 1);
  });

  // ── Utils ──────────────────────────────────────────────────────────────
  async function loadAndRenderProfessionals() {
    let { data: professionals, error } = await supabase.from('profissionais').select('*');
    if (error || !professionals || professionals.length === 0) {
      professionals = [
        { id: "cesar", name: "César", specialty: "Degradês e Barboterapia", img: "./imagens_hero/cesar.webp", active: true }
      ];
    }
    
    const container = $('client-professionals-list');
    if (!container) return;
    container.innerHTML = '';
    
    // Selecionar o César por padrão, se ainda não houver nenhum selecionado
    if (!state.professional && professionals.length > 0) {
      const cesar = professionals.find(p => p.id === 'cesar') || professionals[0];
      state.professional = cesar;
    }
    
    professionals.forEach(p => {
      if (p.active === false) return; // Ignorar inativos
      
      const card = document.createElement('div');
      card.className = 'professional-card';
      
      const isSelected = state.professional && state.professional.id === p.id;
      if (isSelected) {
        card.classList.add('selected');
      }
      
      const tagText = isSelected ? 'Profissional selecionado' : (p.specialty || 'Barbeiro');
      
      card.innerHTML = `
        <div class="prof-photo">
          <img src="${p.img}" alt="${p.name}">
        </div>
        <div class="prof-info">
          <span class="prof-tag">${tagText}</span>
          <span class="prof-name">${p.name}</span>
        </div>
      `;
      
      card.addEventListener('click', () => {
        state.professional = p;
        
        // Atualizar todas as classes e tags no container
        document.querySelectorAll('#client-professionals-list .professional-card').forEach(c => {
          c.classList.remove('selected');
          const pId = c.dataset.profId;
          const found = professionals.find(item => item.id === pId);
          const tag = c.querySelector('.prof-tag');
          if (tag && found) {
            tag.textContent = found.specialty || 'Barbeiro';
          }
        });
        
        card.classList.add('selected');
        const activeTag = card.querySelector('.prof-tag');
        if (activeTag) {
          activeTag.textContent = 'Profissional selecionado';
        }
        
        // Atualizar textos descritivos
        const servicesHeading = $('services-heading-desc');
        if (servicesHeading) {
          servicesHeading.textContent = `Serviços oferecidos por ${p.name}`;
        }
      });
      
      card.dataset.profId = p.id;
      container.appendChild(card);
    });

    // Atualizar texto descritivo inicial
    const servicesHeading = $('services-heading-desc');
    if (servicesHeading && state.professional) {
      servicesHeading.textContent = `Serviços oferecidos por ${state.professional.name}`;
    }
  }

  function fmtDate(d) {
    if (!d) return '—';
    return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
  }

  // ── Bootstrap ──────────────────────────────────────────────────────────
  loadBrandingConfig();
  loadAndRenderServices();
  loadAndRenderProfessionals();
  updateProgress(1);
});
