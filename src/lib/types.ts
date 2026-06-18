export type ComoChegou =
  | "Instagram"
  | "Indicação"
  | "Google"
  | "Passou na frente"
  | "WhatsApp"
  | "Outros";

export type StatusCliente =
  | "Orçamento enviado"
  | "Aprovado"
  | "Aguardando obra"
  | "Em execução"
  | "Concluído"
  | "Cancelado";

export type StatusPagamento =
  | "Em dia"
  | "Vencido"
  | "Quitado"
  | "Parcelado"
  | "Aguardando entrada";

export type FaseCronograma =
  | "Novo orçamento"
  | "Aguardando material"
  | "Agendado"
  | "Em execução"
  | "Concluído";

export type Prioridade = "Alta" | "Média" | "Baixa";

export type MaterialChegou = "Sim" | "Não" | "A caminho";

export type TipoLancamento = "Entrada" | "Saída";

export type Banco =
  | "Nubank"
  | "Bradesco"
  | "Caixa"
  | "Banco do Brasil"
  | "Inter"
  | "Dinheiro/Caixa Físico";

export type CategoriaLancamento =
  | "Material/Vidro"
  | "Combustível/Transporte"
  | "Mão de obra"
  | "Ferramentas"
  | "Pagamento recebido"
  | "Outros";

export type FormaPagamento = "Dinheiro" | "PIX" | "Boleto" | "Cartão" | "Transferência" | "Outros";

export type TipoPostagem =
  | "Antes e Depois"
  | "Serviço concluído"
  | "Dica técnica"
  | "Depoimento"
  | "Promoção"
  | "Bastidor"
  | "Outros";

export type FormatoPostagem = "Reels" | "Carrossel" | "Foto única" | "Story";

export type StatusPostagem = "Publicado" | "Agendado" | "Não publicado";

export interface Cliente {
  id: string;
  nome: string;
  telefone: string | null;
  como_chegou: ComoChegou | null;
  tipo_servico: string | null;
  data_orcamento: string | null;
  valor_orcado: number | null;
  status: StatusCliente;
  observacoes: string | null;
  created_at: string;
}

export interface Pagamento {
  id: string;
  cliente_id: string;
  servico: string | null;
  data_servico: string | null;
  valor_total: number;
  valor_pago: number;
  data_vencimento: string | null;
  status: StatusPagamento;
  observacoes: string | null;
  created_at: string;
  clientes?: { nome: string } | null;
}

export interface Cronograma {
  id: string;
  cliente_id: string;
  servico: string | null;
  previsao_inicio: string | null;
  previsao_conclusao: string | null;
  fase: FaseCronograma;
  prioridade: Prioridade;
  fornecedor_material: string | null;
  material_chegou: MaterialChegou | null;
  observacoes: string | null;
  created_at: string;
  clientes?: { nome: string } | null;
}

export interface Lancamento {
  id: string;
  data: string;
  tipo: TipoLancamento;
  banco: Banco;
  descricao: string | null;
  valor: number;
  categoria: CategoriaLancamento | null;
  cliente_fornecedor: string | null;
  created_at: string;
}

export interface Fornecedor {
  id: string;
  nome: string;
  contato: string | null;
  telefone: string | null;
  produto_principal: string | null;
  prazo_entrega: number | null;
  forma_pagamento: FormaPagamento | null;
  avaliacao: number | null;
  observacoes: string | null;
  ativo: boolean;
  created_at: string;
}

export interface PrecoMaterial {
  id: string;
  material: string;
  espessura_tipo: string | null;
  fornecedor_id: string | null;
  preco_m2: number;
  data_cotacao: string | null;
  validade: string | null;
  created_at: string;
  fornecedores?: { nome: string } | null;
}

export interface Postagem {
  id: string;
  data: string;
  tipo: TipoPostagem;
  tema: string | null;
  formato: FormatoPostagem;
  hashtags: string | null;
  status: StatusPostagem;
  alcance: number | null;
  interacoes: number | null;
  created_at: string;
}

export interface Lead {
  id: string;
  data: string;
  nome: string;
  telefone: string | null;
  como_chegou: ComoChegou | null;
  servico_interesse: string | null;
  converteu: boolean;
  observacoes: string | null;
  created_at: string;
}
