
export enum UserRole {
  ADMIN = 'admin',
  ANALISTA = 'analista',
  CLIENTE = 'cliente',
}

export interface User {
  id: string;
  nome: string;
  email: string;
  role: UserRole;
  cpf_cnpj?: string;
  endereco?: string;
  telefone?: string;
  data_cadastro: string;
  status: 'ativo' | 'inativo';
}

export interface UserRegistrationData {
  nome: string;
  email: string;
  senha: string; // Senha para registro
  role: UserRole;
  cpf_cnpj?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface Product {
  id: string;
  nome: string;
  descricao: string;
  preco: number;
  categoria: string; 
  marca?: string;
  modelo?: string;
  estoque: number;
  status: 'ativo' | 'inativo';
  imagemUrl?: string; 
  compatibilidade?: string;
  cor?: string;
  ano_fabricacao?: number;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Order {
  id: string;
  clienteId: string;
  data_pedido: string;
  status: 'aguardando_pagamento' | 'processando' | 'enviado' | 'entregue' | 'cancelado' | 'concluido';
  metodo_pagamento: 'pix' | 'cartao_credito' | 'boleto';
  items: CartItem[];
  valorTotal: number;
  enderecoEntrega: string;
}

export enum ServiceRequestStatus {
  PENDENTE = 'pendente', // Aguardando análise técnica
  ORCAMENTO_ENVIADO = 'orcamento_enviado', // Aguardando aprovação do cliente
  EM_ANDAMENTO = 'em_andamento', // Serviço aprovado e sendo executado
  CONCLUIDO = 'concluido', // Serviço finalizado
  CANCELADO = 'cancelado', // Orçamento recusado pelo cliente ou cancelado
}

export enum QuoteStatus {
  PENDENTE_APROVACAO_CLIENTE = 'pendente_aprovacao_cliente',
  APROVADO_PELO_CLIENTE = 'aprovado_pelo_cliente',
  RECUSADO_PELO_CLIENTE = 'recusado_pelo_cliente',
}

export type TipoEntregaQuote = 'oficina' | 'visita_tecnica' | 'correios';

export interface ServiceRequest {
  id: string;
  clienteId: string;
  clienteNome?: string; // Para visualização de admin/analista
  clienteEmail?: string; // Para visualização de admin/analista
  tipo_equipamento: 'notebook' | 'desktop' | 'tablet' | 'outros'; // Expandido
  marca: string;
  modelo: string;
  descricao_problema: string;
  fotoUrl?: string; // Foto opcional
  aceiteLGPD: boolean; // Deve ser verdadeiro na criação a partir do formulário
  data_solicitacao: string;
  status: ServiceRequestStatus;
  forma_envio?: 'Correios' | 'Presencial'; // Dos campos originais
  
  quoteId?: string; // Link para o Orçamento
  dataAprovacao?: string; // Data de aprovação do orçamento
  previsaoEntrega?: string; // Data de entrega calculada após aprovação
  dataConclusao?: string; // Data de conclusão do serviço
  motivoRecusa?: string; // Motivo se o cliente recusou o orçamento
}

export interface Quote { // Orcamento
  id: string;
  solicitacaoId: string; // ID da ServiceRequest
  analistaId: string; // ID do usuário do técnico/analista
  diagnostico: string; // Diagnóstico detalhado, pode incluir peças necessárias
  valorMaoDeObra: number; // Custo do serviço
  valorPecasEstimado?: number; // Custo estimado das peças
  valorTotal: number; // valorMaoDeObra + valorPecasEstimado (ou conforme inserido pelo técnico)
  prazoEntregaDias: number; // Em dias
  tipoEntrega: TipoEntregaQuote;
  observacoesTecnicas?: string;
  status: QuoteStatus;
  dataCriacao: string;
}

export interface HelpTicket {
  id: string;
  clienteId: string;
  assunto: string;
  descricao: string;
  categoria?: string;
  data_abertura: string;
  status: 'aberto' | 'em_andamento' | 'respondido' | 'encerrado' | 'resolvido';
  anexos?: File[];
  respostas?: HelpTicketReply[];
}

export interface HelpTicketReply {
  id: string;
  ticketId: string;
  autorId: string;
  mensagem: string;
  data_resposta: string;
}

export interface LgpdTerm {
  id: string;
  conteudo: string;
  versao: string;
  data_efetiva: string;
}

export interface DashboardStats {
  totalClientes: number;
  vendasPeriodo: number;
  assistenciasPeriodo: number;
  novosPedidos?: number;
  chamadosAbertos?: number;
}

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
}