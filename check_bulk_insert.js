import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ivfpjjfutbhjsctwuesq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml2ZnBqamZ1dGJoanNjdHd1ZXNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2NjY1MzUsImV4cCI6MjA5NjI0MjUzNX0.DH-hRrxzUNZXbwPPV2bLSCxNbGj1YEMXIf_jEUq2HQY';
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const dVal = '2026-06-08';
  const inputProf = 'César';
  const clientName = 'Horário Bloqueado';
  const clientPhone = '(00) 00000-0000';
  const clientObs = 'Bloqueio manual de agenda.';
  const finalServiceId = 'bloqueio';
  const finalServiceName = 'Bloqueio de Agenda';
  const finalServicePrice = 'R$ 0,00';
  const finalServiceDuration = '60 min';

  const slots = ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'];

  const blocksToInsert = slots.map(t => ({
    clientName: clientName,
    clientPhone: clientPhone,
    clientBirth: '',
    clientObs: clientObs,
    serviceId: finalServiceId,
    serviceName: finalServiceName,
    servicePrice: finalServicePrice,
    serviceDuration: finalServiceDuration,
    date: dVal,
    time: t,
    professional: inputProf,
    status: 'Confirmado'
  }));

  console.log('Inserting blocks:', blocksToInsert.length);
  const { data, error } = await supabase.from('agendamentos').insert(blocksToInsert);
  if (error) {
    console.error('Insert Error:', error);
  } else {
    console.log('Insert Success! Data:', data);
  }
}

test();
