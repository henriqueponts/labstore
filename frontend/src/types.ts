
export enum UserRole {
  ADMIN = 'admin',
  ANALISTA = 'analista',
  CLIENTE = 'cliente',
}

export interface User {
  id: string; // Pode ser "cliente_ID" ou "usuario_ID"
  nome: string;
  email: string;
  role: UserRole;
  cpf_cnpj?: string; // Para clientes
  endereco?: string; // Para clientes
  telefone?: string; // Para clientes
  data_cadastro: string;
  status: 'ativo' | 'inativo';
}

export interface UserRegistrationData {
  nome: string;
  email: string;
  senha: string; 
  role: UserRole; // Geralmente UserRole.CLIENTE para registro público
  cpf_cnpj?: string;
  endereco?: string; // Adicionado para compatibilidade com apiService
  telefone?: string; // Adicionado para compatibilidade com apiService
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface Product {
  id: string; // id_produto do banco
  nome: string;
  descricao: string;
  preco: number;
  categoria: string; // nome_categoria do banco (nome da categoria)
  id_categoria?: number; // ID da categoria, para envio ao backend
  marca?: string;
  modelo?: string;
  estoque: number;
  status: 'ativo' | 'inativo'; // status_produto do banco
  imagemUrl?: string; 
  compatibilidade?: string;
  cor?: string;
  ano_fabricacao?: number;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Order {
  id: string; // id_pedido do banco
  clienteId: string; // id_cliente (formatado como "cliente_ID")
  data_pedido: string;
  status: 'aguardando_pagamento' | 'processando' | 'enviado' | 'entregue' | 'cancelado' | 'concluido';
  metodo_pagamento: 'pix' | 'cartao_credito' | 'boleto';
  items: CartItem[];
  valorTotal: number;
  enderecoEntrega: string;
}

export enum ServiceRequestStatus {
  PENDENTE = 'pendente', 
  ORCAMENTO_ENVIADO = 'orcamento_enviado', 
  EM_ANDAMENTO = 'em_andamento', 
  CONCLUIDO = 'concluido', 
  CANCELADO = 'cancelado',
}

export enum QuoteStatus {
  PENDENTE_APROVACAO_CLIENTE = 'pendente_aprovacao_cliente',
  APROVADO_PELO_CLIENTE = 'aprovado_pelo_cliente',
  RECUSADO_PELO_CLIENTE = 'recusado_pelo_cliente',
}

export type TipoEntregaQuote = 'oficina' | 'visita_tecnica' | 'correios';

export interface ServiceRequest {
  id: string; // id_solicitacao do banco
  clienteId: string; // id_cliente (formatado como "cliente_ID")
  clienteNome?: string; 
  clienteEmail?: string; 
  tipo_equipamento: 'notebook' | 'desktop' | 'tablet' | 'outros';
  marca: string;
  modelo: string;
  descricao_problema: string;
  fotoUrl?: string; 
  aceiteLGPD: boolean; 
  data_solicitacao: string;
  status: ServiceRequestStatus; // Mapeado do status do DB
  forma_envio?: 'Correios' | 'Presencial'; 
  
  quoteId?: string; // id_orcamento do banco (se houver)
  dataAprovacao?: string; 
  previsaoEntrega?: string; 
  dataConclusao?: string; 
  motivoRecusa?: string; 
}

export interface Quote { 
  id: string; // id_orcamento do banco
  solicitacaoId: string; // id_solicitacao do banco
  analistaId: string; // id_analista (formatado como "usuario_ID")
  diagnostico: string; 
  valorMaoDeObra: number; 
  valorPecasEstimado?: number; 
  valorTotal: number; 
  prazoEntregaDias: number; 
  tipoEntrega: TipoEntregaQuote; // Pode não estar no DB Orcamento, verificar
  observacoesTecnicas?: string;
  status: QuoteStatus; // Mapeado de status_aprovacao do DB
  dataCriacao: string;
}

export interface HelpTicket {
  id: string; // id_chamado do banco
  clienteId: string; // id_cliente (formatado como "cliente_ID")
  assunto: string;
  descricao: string;
  categoria?: string;
  data_abertura: string;
  status: 'aberto' | 'em_andamento' | 'respondido' | 'encerrado' | 'resolvido';
  anexos?: File[]; // Anexos são complexos, não tratados no backend mock/DB simples
  respostas?: HelpTicketReply[];
}

export interface HelpTicketReply {
  id: string;
  ticketId: string;
  autorId: string; // Pode ser cliente ou usuario (admin/analista)
  mensagem: string;
  data_resposta: string;
}

export interface LgpdTerm {
  id: string; // id_termo do banco
  conteudo: string;
  versao: string;
  data_efetiva: string;
}

export interface DashboardStats {
  totalClientes?: number; // Undefined para clientes
  vendasPeriodo?: number; // Undefined para clientes
  assistenciasPeriodo?: number; // Undefined para clientes
  novosPedidos?: number; // Apenas para clientes
  chamadosAbertos?: number; // Para todos, mas com escopos diferentes
}

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
}
