-- VidroBox - Schema do banco de dados
-- Execute este script no SQL Editor do Supabase

create extension if not exists "pgcrypto";

-- =========================================================
-- CLIENTES & ORÇAMENTOS
-- =========================================================
create table if not exists clientes (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  telefone text,
  como_chegou text check (como_chegou in ('Instagram','Indicação','Google','Passou na frente','WhatsApp','Outros')),
  tipo_servico text,
  data_orcamento date,
  valor_orcado numeric(12,2) default 0,
  status text not null default 'Orçamento enviado' check (status in ('Orçamento enviado','Aprovado','Aguardando obra','Em execução','Concluído','Cancelado')),
  observacoes text,
  created_at timestamptz not null default now()
);

-- =========================================================
-- CONTROLE DE PAGAMENTOS
-- =========================================================
create table if not exists pagamentos (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references clientes(id) on delete cascade,
  servico text,
  data_servico date,
  valor_total numeric(12,2) not null default 0,
  valor_pago numeric(12,2) not null default 0,
  data_vencimento date,
  status text not null default 'Aguardando entrada' check (status in ('Em dia','Vencido','Quitado','Parcelado','Aguardando entrada')),
  observacoes text,
  created_at timestamptz not null default now()
);

-- =========================================================
-- CRONOGRAMA DE SERVIÇOS
-- =========================================================
create table if not exists cronograma (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references clientes(id) on delete cascade,
  servico text,
  previsao_inicio date,
  previsao_conclusao date,
  fase text not null default 'Novo orçamento' check (fase in ('Novo orçamento','Aguardando material','Agendado','Em execução','Concluído')),
  prioridade text not null default 'Média' check (prioridade in ('Alta','Média','Baixa')),
  fornecedor_material text,
  material_chegou text check (material_chegou in ('Sim','Não','A caminho')),
  observacoes text,
  created_at timestamptz not null default now()
);

-- =========================================================
-- FLUXO DE CAIXA
-- =========================================================
create table if not exists lancamentos (
  id uuid primary key default gen_random_uuid(),
  data date not null default current_date,
  tipo text not null check (tipo in ('Entrada','Saída')),
  banco text not null check (banco in ('Nubank','Bradesco','Caixa','Banco do Brasil','Inter','Dinheiro/Caixa Físico')),
  descricao text,
  valor numeric(12,2) not null default 0,
  categoria text check (categoria in ('Material/Vidro','Combustível/Transporte','Mão de obra','Ferramentas','Pagamento recebido','Outros')),
  cliente_fornecedor text,
  created_at timestamptz not null default now()
);

-- =========================================================
-- FORNECEDORES
-- =========================================================
create table if not exists fornecedores (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  contato text,
  telefone text,
  produto_principal text,
  prazo_entrega integer,
  forma_pagamento text check (forma_pagamento in ('Dinheiro','PIX','Boleto','Cartão','Transferência','Outros')),
  avaliacao integer check (avaliacao between 1 and 5),
  observacoes text,
  ativo boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists precos_materiais (
  id uuid primary key default gen_random_uuid(),
  material text not null,
  espessura_tipo text,
  fornecedor_id uuid references fornecedores(id) on delete set null,
  preco_m2 numeric(12,2) not null default 0,
  data_cotacao date,
  validade date,
  created_at timestamptz not null default now()
);

-- =========================================================
-- INSTAGRAM / CAPTAÇÃO
-- =========================================================
create table if not exists postagens (
  id uuid primary key default gen_random_uuid(),
  data date not null default current_date,
  tipo text not null check (tipo in ('Antes e Depois','Serviço concluído','Dica técnica','Depoimento','Promoção','Bastidor','Outros')),
  tema text,
  formato text not null check (formato in ('Reels','Carrossel','Foto única','Story')),
  hashtags text,
  status text not null default 'Não publicado' check (status in ('Publicado','Agendado','Não publicado')),
  alcance integer default 0,
  interacoes integer default 0,
  created_at timestamptz not null default now()
);

create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  data date not null default current_date,
  nome text not null,
  telefone text,
  como_chegou text check (como_chegou in ('Instagram','Indicação','Google','Passou na frente','WhatsApp','Outros')),
  servico_interesse text,
  converteu boolean not null default false,
  observacoes text,
  created_at timestamptz not null default now()
);

-- =========================================================
-- ÍNDICES
-- =========================================================
create index if not exists idx_pagamentos_cliente on pagamentos(cliente_id);
create index if not exists idx_cronograma_cliente on cronograma(cliente_id);
create index if not exists idx_precos_fornecedor on precos_materiais(fornecedor_id);
create index if not exists idx_lancamentos_data on lancamentos(data);
create index if not exists idx_lancamentos_banco on lancamentos(banco);
create index if not exists idx_pagamentos_status on pagamentos(status);
create index if not exists idx_cronograma_fase on cronograma(fase);

-- =========================================================
-- ROW LEVEL SECURITY
-- App sem autenticação: acesso liberado via chave anon (uso interno).
-- =========================================================
alter table clientes enable row level security;
alter table pagamentos enable row level security;
alter table cronograma enable row level security;
alter table lancamentos enable row level security;
alter table fornecedores enable row level security;
alter table precos_materiais enable row level security;
alter table postagens enable row level security;
alter table leads enable row level security;

create policy "Public full access" on clientes for all to anon, authenticated using (true) with check (true);
create policy "Public full access" on pagamentos for all to anon, authenticated using (true) with check (true);
create policy "Public full access" on cronograma for all to anon, authenticated using (true) with check (true);
create policy "Public full access" on lancamentos for all to anon, authenticated using (true) with check (true);
create policy "Public full access" on fornecedores for all to anon, authenticated using (true) with check (true);
create policy "Public full access" on precos_materiais for all to anon, authenticated using (true) with check (true);
create policy "Public full access" on postagens for all to anon, authenticated using (true) with check (true);
create policy "Public full access" on leads for all to anon, authenticated using (true) with check (true);
