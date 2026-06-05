import { supabase } from './supabaseClient.js';

document.addEventListener('DOMContentLoaded', async () => {
  const $ = id => document.getElementById(id);

  // Elementos de estado
  const stateLoading = $('state-loading');
  const stateConfirm = $('state-confirm');
  const stateSuccess = $('state-success');
  const stateError = $('state-error');
  const errorMsg = $('error-message');

  const btnCancel = $('btn-submit-cancel');

  // Buscar código (UUID) na URL
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');

  if (!code) {
    showState(stateError);
    errorMsg.textContent = 'Nenhum código de agendamento foi fornecido na URL.';
    return;
  }

  let booking = null;

  // Carregar dados do agendamento
  try {
    const { data, error } = await supabase
      .from('agendamentos')
      .select('*')
      .eq('id', code)
      .single();

    if (error || !data) {
      showState(stateError);
      errorMsg.textContent = 'Não encontramos nenhum agendamento ativo com este código.';
      return;
    }

    if (data.status === 'Cancelado') {
      showState(stateError);
      errorMsg.textContent = 'Este agendamento já foi cancelado anteriormente.';
      return;
    }

    booking = data;
    
    // Preencher detalhes
    $('det-client').textContent = booking.clientName;
    $('det-service').textContent = booking.serviceName;
    $('det-prof').textContent = booking.professional || 'César';
    $('det-price').textContent = booking.servicePrice;
    
    // Formatar data localmente
    const bDate = parseLocalDate(booking.date);
    const dateFormatted = `${String(bDate.getDate()).padStart(2,'0')}/${String(bDate.getMonth()+1).padStart(2,'0')}/${bDate.getFullYear()}`;
    $('det-datetime').textContent = `${dateFormatted} às ${booking.time}`;

    showState(stateConfirm);

  } catch (err) {
    console.error('Erro ao buscar agendamento:', err);
    showState(stateError);
    errorMsg.textContent = 'Ocorreu um erro ao conectar ao servidor. Tente novamente mais tarde.';
  }

  // Confirmar cancelamento
  btnCancel.addEventListener('click', async () => {
    if (!booking) return;

    btnCancel.disabled = true;
    btnCancel.textContent = 'Cancelando...';

    try {
      const { error } = await supabase
        .from('agendamentos')
        .update({ status: 'Cancelado' })
        .eq('id', booking.id);

      if (error) throw error;

      showState(stateSuccess);
    } catch (err) {
      console.error('Erro ao cancelar agendamento:', err);
      alert('Não foi possível cancelar o agendamento no momento. Tente novamente.');
      btnCancel.disabled = false;
      btnCancel.textContent = 'Confirmar Cancelamento';
    }
  });

  // Auxiliares
  function showState(targetState) {
    [stateLoading, stateConfirm, stateSuccess, stateError].forEach(el => {
      el.classList.add('hidden');
      el.style.display = 'none';
    });
    targetState.classList.remove('hidden');
    targetState.style.display = targetState === stateLoading ? 'flex' : 'block';
  }

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
});
