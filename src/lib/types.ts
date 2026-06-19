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

export type FaseServico =
  | "Orçamento"
  | "Aprovado"
  | "Material encomendado"
  | "Material chegou"
  | "Instalação agendada"
  | "Instalado"
  | "Concluído";

export type Prioridade = "Alta" | "Média" | "Baixa";

export type MaterialChegou = "Sim" | "Não" | "A caminho";

export type StatusPagamentoServico =
  | "Aguardando entrada"
  | "Entrada recebida"
  | "Vencido"
  | "Quitado"
  | "Parcelado";

export type FormaPagamentoServico = "PIX" | "Dinheiro" | "Cartão" | "Transferência" | "Outro";

export type TipoProduto =
  | "Janela Fixa"
  | "Janela Móvel"
  | "Janela Fixa + Móvel"
  | "Janela 2 Fixas"
  | "Janela 2 Móveis"
  | "Box Frontal"
  | "Box L"
  | "Box Frontal + Lateral"
  | "Porta Vasculhante"
  | "Porta Inteira"
  | "Espelho"
  | "Película"
  | "Outro";

export type TipoBanco = "Banco" | "Carteira Digital" | "Dinheiro/Caixa Físico" | "Outro";

export type CategoriaBanco = "Empresa" | "Pessoal";

export type TipoLancamento = "Entrada" | "Saída";

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

export interface Servico {
  id: string;
  cliente_id: string;
  titulo: string;
  descricao: string | null;
  fase: FaseServico;
  prioridade: Prioridade;
  data_orcamento: string | null;
  data_instalacao: string | null;
  fornecedor_material: string | null;
  material_chegou: MaterialChegou | null;
  valor_total: number;
  valor_entrada: number;
  saldo_devedor: number;
  data_vencimento_saldo: string | null;
  status_pagamento: StatusPagamentoServico;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
  clientes?: { nome: string; telefone: string | null } | null;
}

export interface ServicoItem {
  id: string;
  servico_id: string;
  descricao: string;
  material: string | null;
  tipo_produto: TipoProduto | null;
  largura: number;
  altura: number;
  largura_original: number | null;
  altura_original: number | null;
  area_m2: number;
  preco_m2: number;
  quantidade: number;
  valor_total: number;
  observacao: string | null;
  created_at: string;
}

export interface Material {
  id: string;
  nome: string;
  descricao: string | null;
  preco_m2: number;
  ativo: boolean;
  created_at: string;
}

export interface ServicoPagamento {
  id: string;
  servico_id: string;
  valor: number;
  data_pagamento: string;
  forma: FormaPagamentoServico | null;
  observacao: string | null;
  created_at: string;
}

export interface ServicoFaseHistorico {
  id: string;
  servico_id: string;
  fase: FaseServico;
  changed_at: string;
}

export interface BancoConta {
  id: string;
  nome: string;
  tipo: TipoBanco;
  categoria: CategoriaBanco;
  saldo_inicial: number;
  ativo: boolean;
  created_at: string;
}

export interface Lancamento {
  id: string;
  data: string;
  tipo: TipoLancamento;
  banco_id: string | null;
  categoria_tipo: CategoriaBanco;
  servico_id: string | null;
  descricao: string | null;
  valor: number;
  categoria: CategoriaLancamento | null;
  cliente_fornecedor: string | null;
  created_at: string;
  bancos?: { nome: string } | null;
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

export interface FornecedorContato {
  id: string;
  fornecedor_id: string;
  nome: string;
  cargo: string | null;
  telefone: string | null;
  email: string | null;
  observacoes: string | null;
  created_at: string;
  fornecedores?: { nome: string } | null;
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
