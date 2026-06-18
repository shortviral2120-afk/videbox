# VidroBox

Sistema de gestão para vidraçarias pequenas/médias. Controle de clientes, orçamentos, pagamentos, cronograma de serviços, fluxo de caixa, fornecedores e captação via Instagram — tudo em um app mobile-first.

## Stack

- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **UI**: shadcn/ui (Radix UI + Tailwind)
- **Banco de dados**: Supabase (PostgreSQL)
- **Drag-and-drop**: dnd-kit (Kanban do Cronograma)
- **Deploy**: Vercel

> Este app não possui autenticação — é de uso interno e abre direto no dashboard. Se for expor publicamente, adicione uma camada de proteção (ex: autenticação na borda, VPN, ou reative o Supabase Auth).

## Módulos

1. **Dashboard** — KPIs em tempo real, alertas de pagamentos vencidos, resumo por fase de serviço
2. **Clientes & Orçamentos** — CRUD completo com busca e filtro por status
3. **Controle de Pagamentos** — saldo devedor automático, status com destaque visual
4. **Cronograma de Serviços** — Kanban com drag-and-drop entre fases
5. **Fluxo de Caixa** — saldos por banco/carteira, lançamentos de entrada/saída
6. **Fornecedores** — cadastro de fornecedores + tabela de preços de materiais
7. **Instagram / Captação** — calendário de postagens + lista de leads

## Setup

### 1. Pré-requisitos

- Node.js 18+
- Uma conta no [Supabase](https://supabase.com)

### 2. Configurar o Supabase

1. Crie um novo projeto em [supabase.com](https://supabase.com).
2. Abra o **SQL Editor** do seu projeto e execute o conteúdo de [`supabase/schema.sql`](supabase/schema.sql). Isso cria todas as tabelas, índices e políticas de Row Level Security (liberadas para a chave `anon`, já que o app não tem login).
3. Em **Project Settings → API**, copie a **Project URL** e a **anon public key**.

### 3. Variáveis de ambiente

Copie o arquivo de exemplo e preencha com os dados do seu projeto Supabase:

```bash
cp .env.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key
```

### 4. Instalar dependências e rodar localmente

```bash
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) — o app abre direto no dashboard, sem login.

### 5. Build de produção (local)

```bash
npm run build
npm run start
```

## Deploy na Vercel

1. Suba o código para um repositório no GitHub/GitLab/Bitbucket.
2. Em [vercel.com/new](https://vercel.com/new), importe o repositório.
3. Configure as variáveis de ambiente no painel da Vercel (mesmas do `.env.local`):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Clique em **Deploy**. A Vercel detecta automaticamente o projeto Next.js.

## Estrutura do projeto

```
src/
  app/
    (app)/               layout com sidebar/bottom nav
      page.tsx            dashboard (rota "/")
      clientes/
      pagamentos/
      cronograma/
      caixa/
      fornecedores/
      instagram/
  components/
    ui/                  primitivos shadcn/ui
    sidebar.tsx, bottom-nav.tsx, page-header.tsx, ...
  lib/
    supabase/            cliente Supabase (browser)
    types.ts             tipos das tabelas
    utils.ts             helpers de formatação (moeda, data BR)
supabase/
  schema.sql             script SQL completo do banco
```

## Notas técnicas

- Todas as datas são exibidas no formato brasileiro (DD/MM/AAAA) e valores monetários em Real (R$).
- Toda operação assíncrona possui estado de carregamento e notificações via toast (sucesso/erro).
- Exclusões sempre exigem confirmação.
- Não há autenticação: o app abre direto em `/` (dashboard) e usa a chave `anon` do Supabase para todas as operações.
- O projeto fixa `next@14.2.x` (LTS da série 14) conforme especificado; mantenha o pacote atualizado dentro dessa série para receber correções de segurança.
