-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Criar tabela de Configurações
create table if not exists public.configuracoes (
  id text primary key default 'config_geral',
  name text not null,
  phone text not null,
  address text not null,
  instagram text not null,
  theme text not null,
  "openDays" jsonb not null default '[1, 2, 3, 4, 5, 6]',
  "timeStart" text not null default '09:00',
  "timeEnd" text not null default '20:00',
  interval integer not null default 60
);

-- Inserir configuração padrão caso não exista
insert into public.configuracoes (id, name, phone, address, instagram, theme, "openDays", "timeStart", "timeEnd", interval)
values ('config_geral', 'César Barbearia', '(11) 99999-9999', 'Praça Lucila Macedo Dêda, Simão Dias - SE', '@cesar.barbearia', 'gold', '[1, 2, 3, 4, 5, 6]', '09:00', '20:00', 60)
on conflict (id) do nothing;

-- Criar tabela de Serviços
create table if not exists public.servicos (
  id text primary key,
  name text not null,
  price text not null,
  duration text not null,
  img text not null
);

-- Inserir serviços padrões (se a tabela estiver vazia)
insert into public.servicos (id, name, price, duration, img)
values 
  ('corte-degrade', 'Corte Degradê', 'R$ 25,00', '30 min', './imagens_servicos/corte_degrade.webp'),
  ('barba', 'Barba', 'R$ 15,00', '30 min', './imagens_servicos/barba.webp'),
  ('degrade-barba', 'Degradê + Barba', 'R$ 40,00', '60 min', './imagens_servicos/degrade_e_barba.webp'),
  ('sobrancelha', 'Sobrancelha Navalhada', 'R$ 8,00', '30 min', './imagens_servicos/sobrancelha.webp'),
  ('barba-sobrancelha', 'Barba + Sobrancelha', 'R$ 20,00', '30 min', './imagens_servicos/barba_e_sombrancelha.webp'),
  ('corte-pigmentacao', 'Corte + Pigmentação', 'R$ 38,00', '60 min', './imagens_servicos/corte_e_pigmentacao.webp'),
  ('pigmentacao', 'Pigmentação', 'R$ 15,00', '30 min', './imagens_servicos/pigmentacao.webp'),
  ('acabamento', 'Acabamento de Cabelo', 'R$ 8,00', '30 min', './imagens_servicos/acabamento.webp'),
  ('alisamento', 'Alisamento Americano', 'R$ 70,00', '90 min', './imagens_servicos/alisamento_americano.webp')
on conflict (id) do nothing;

-- Criar tabela de Profissionais
create table if not exists public.profissionais (
  id text primary key,
  name text not null,
  specialty text not null,
  img text not null,
  active boolean default true
);

-- Inserir profissional padrão
insert into public.profissionais (id, name, specialty, img, active)
values ('cesar', 'César', 'Degradês e Barboterapia', './imagens_hero/cesar.webp', true)
on conflict (id) do nothing;

-- Criar tabela de Agendamentos
create table if not exists public.agendamentos (
  id uuid primary key default uuid_generate_v4(),
  "clientName" text not null,
  "clientPhone" text not null,
  "clientBirth" text,
  "clientObs" text,
  "serviceId" text not null references public.servicos(id),
  "serviceName" text not null,
  "servicePrice" text not null,
  "serviceDuration" text not null,
  date date not null,
  time text not null,
  professional text not null,
  status text not null default 'Pendente',
  "createdAt" timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Configurar RLS (Row Level Security) para permitir que a API anônima leia e grave sem autenticação por enquanto
-- Em um ambiente de produção real, é recomendado configurar políticas mais restritas.
alter table public.configuracoes enable row level security;
alter table public.servicos enable row level security;
alter table public.profissionais enable row level security;
alter table public.agendamentos enable row level security;

-- Criar políticas (Policies) permitindo acesso público para simplificar o Frontend
create policy "Allow public access on configuracoes" on public.configuracoes for all using (true) with check (true);
create policy "Allow public access on servicos" on public.servicos for all using (true) with check (true);
create policy "Allow public access on profissionais" on public.profissionais for all using (true) with check (true);
create policy "Allow public access on agendamentos" on public.agendamentos for all using (true) with check (true);

-- Habilitar o Realtime para a tabela de agendamentos
alter publication supabase_realtime add table public.agendamentos;
alter publication supabase_realtime add table public.configuracoes;
alter publication supabase_realtime add table public.servicos;
alter publication supabase_realtime add table public.profissionais;
