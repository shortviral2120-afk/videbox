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
-- SERVIÇOS (módulo central: orçamento, fases, pagamentos)
-- =========================================================
create table if not exists servicos (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references clientes(id) on delete cascade,
  titulo text not null,
  descricao text,
  fase text not null default 'Orçamento' check (fase in (
    'Orçamento','Aprovado','Material encomendado','Material chegou',
    'Instalação agendada','Instalado','Concluído'
  )),
  prioridade text not null default 'Média' check (prioridade in ('Alta','Média','Baixa')),
  data_orcamento date default current_date,
  data_instalacao date,
  fornecedor_material text,
  material_chegou text check (material_chegou in ('Sim','Não','A caminho')),
  valor_total numeric(12,2) not null default 0,
  valor_entrada numeric(12,2) not null default 0,
  saldo_devedor numeric(12,2) generated always as (valor_total - valor_entrada) stored,
  data_vencimento_saldo date,
  status_pagamento text not null default 'Aguardando entrada' check (status_pagamento in (
    'Aguardando entrada','Entrada recebida','Vencido','Quitado','Parcelado'
  )),
  observacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists servico_itens (
  id uuid primary key default gen_random_uuid(),
  servico_id uuid not null references servicos(id) on delete cascade,
  descricao text not null,
  material text,
  tipo_produto text,
  largura numeric(10,2) not null default 0,
  altura numeric(10,2) not null default 0,
  largura_original numeric(10,2),
  altura_original numeric(10,2),
  area_m2 numeric(12,4) generated always as (largura * altura) stored,
  preco_m2 numeric(12,2) not null default 0,
  quantidade integer not null default 1,
  valor_total numeric(12,2) generated always as (largura * altura * preco_m2 * quantidade) stored,
  observacao text,
  created_at timestamptz not null default now()
);

create table if not exists servico_pagamentos (
  id uuid primary key default gen_random_uuid(),
  servico_id uuid not null references servicos(id) on delete cascade,
  valor numeric(12,2) not null default 0,
  data_pagamento date not null default current_date,
  forma text check (forma in ('PIX','Dinheiro','Cartão','Transferência','Outro')),
  observacao text,
  created_at timestamptz not null default now()
);

create table if not exists servico_fase_historico (
  id uuid primary key default gen_random_uuid(),
  servico_id uuid not null references servicos(id) on delete cascade,
  fase text not null,
  changed_at timestamptz not null default now()
);

-- =========================================================
-- FLUXO DE CAIXA / FINANCEIRO
-- =========================================================
create table if not exists bancos (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  tipo text not null default 'Banco' check (tipo in ('Banco','Carteira Digital','Dinheiro/Caixa Físico','Outro')),
  categoria text not null default 'Empresa' check (categoria in ('Empresa','Pessoal')),
  saldo_inicial numeric(12,2) not null default 0,
  ativo boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists lancamentos (
  id uuid primary key default gen_random_uuid(),
  data date not null default current_date,
  tipo text not null check (tipo in ('Entrada','Saída')),
  banco_id uuid references bancos(id) on delete set null,
  categoria_tipo text not null default 'Empresa' check (categoria_tipo in ('Empresa','Pessoal')),
  servico_id uuid references servicos(id) on delete set null,
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

create table if not exists fornecedor_contatos (
  id uuid primary key default gen_random_uuid(),
  fornecedor_id uuid not null references fornecedores(id) on delete cascade,
  nome text not null,
  cargo text,
  telefone text,
  email text,
  observacoes text,
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
-- CATÁLOGO DE MATERIAIS (orçamento)
-- =========================================================
create table if not exists materiais (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  descricao text,
  preco_m2 numeric(12,2) not null default 0,
  ativo boolean not null default true,
  created_at timestamptz not null default now()
);

insert into materiais (nome, preco_m2) values
  ('Vidro Incolor 6mm', 180.00),
  ('Vidro Incolor 8mm', 220.00),
  ('Vidro Incolor 10mm', 280.00),
  ('Vidro Fumê 6mm', 210.00),
  ('Vidro Fumê 8mm', 250.00),
  ('Vidro Verde 6mm', 200.00),
  ('Espelho 4mm', 120.00),
  ('Espelho 6mm', 190.00),
  ('Película Anti-UV', 85.00)
on conflict (nome) do nothing;

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
create index if not exists idx_servicos_cliente on servicos(cliente_id);
create index if not exists idx_servicos_fase on servicos(fase);
create index if not exists idx_servicos_data_instalacao on servicos(data_instalacao);
create index if not exists idx_servico_itens_servico on servico_itens(servico_id);
create index if not exists idx_servico_pagamentos_servico on servico_pagamentos(servico_id);
create index if not exists idx_servico_fase_historico_servico on servico_fase_historico(servico_id);
create index if not exists idx_fornecedor_contatos_fornecedor on fornecedor_contatos(fornecedor_id);
create index if not exists idx_precos_fornecedor on precos_materiais(fornecedor_id);
create index if not exists idx_lancamentos_data on lancamentos(data);
create index if not exists idx_lancamentos_banco_id on lancamentos(banco_id);
create index if not exists idx_lancamentos_servico on lancamentos(servico_id);

-- =========================================================
-- ROW LEVEL SECURITY
-- App sem autenticação: acesso liberado via chave anon (uso interno).
-- =========================================================
alter table clientes enable row level security;
alter table servicos enable row level security;
alter table servico_itens enable row level security;
alter table servico_pagamentos enable row level security;
alter table servico_fase_historico enable row level security;
alter table bancos enable row level security;
alter table lancamentos enable row level security;
alter table fornecedores enable row level security;
alter table fornecedor_contatos enable row level security;
alter table precos_materiais enable row level security;
alter table materiais enable row level security;
alter table postagens enable row level security;
alter table leads enable row level security;

create policy "Public full access" on clientes for all to anon, authenticated using (true) with check (true);
create policy "Public full access" on servicos for all to anon, authenticated using (true) with check (true);
create policy "Public full access" on servico_itens for all to anon, authenticated using (true) with check (true);
create policy "Public full access" on servico_pagamentos for all to anon, authenticated using (true) with check (true);
create policy "Public full access" on servico_fase_historico for all to anon, authenticated using (true) with check (true);
create policy "Public full access" on bancos for all to anon, authenticated using (true) with check (true);
create policy "Public full access" on lancamentos for all to anon, authenticated using (true) with check (true);
create policy "Public full access" on fornecedores for all to anon, authenticated using (true) with check (true);
create policy "Public full access" on fornecedor_contatos for all to anon, authenticated using (true) with check (true);
create policy "Public full access" on precos_materiais for all to anon, authenticated using (true) with check (true);
create policy "Public full access" on materiais for all to anon, authenticated using (true) with check (true);
create policy "Public full access" on postagens for all to anon, authenticated using (true) with check (true);
create policy "Public full access" on leads for all to anon, authenticated using (true) with check (true);
