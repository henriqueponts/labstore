
import { User, UserRole, Product, CartItem, Order, ServiceRequest, Quote, HelpTicket, LgpdTerm, DashboardStats, UserRegistrationData, ServiceRequestStatus, QuoteStatus, TipoEntregaQuote } from '../types';
import { MOCK_API_DELAY } from '../constants';

// --- Armazenamento de Dados Mock ---
let mockUsers: User[] = [
  { id: 'admin1', nome: 'Admin User', email: 'admin@unifafibe.com', role: UserRole.ADMIN, data_cadastro: new Date().toISOString(), status: 'ativo' },
  { id: 'analyst1', nome: 'Analista User', email: 'analyst@unifafibe.com', role: UserRole.ANALISTA, data_cadastro: new Date().toISOString(), status: 'ativo' },
  { id: 'client1', nome: 'Cliente User', email: 'client@unifafibe.com', role: UserRole.CLIENTE, cpf_cnpj: '123.456.789-00', data_cadastro: new Date().toISOString(), status: 'ativo', endereco: 'Rua Exemplo, 123', telefone: '(17) 99999-9999' },
];

let mockProducts: Product[] = [
  { id: 'prod1', nome: 'Mouse Gamer RGB', descricao: 'Mouse óptico com alta precisão e iluminação RGB customizável.', preco: 129.90, categoria: 'Periféricos', marca: 'TechBrand', modelo: 'GamerX1', estoque: 15, status: 'ativo', imagemUrl: 'https://picsum.photos/seed/mouse/400/300' },
  { id: 'prod2', nome: 'Teclado Mecânico Pro', descricao: 'Teclado mecânico com switches azuis, ABNT2 e backlight.', preco: 349.50, categoria: 'Periféricos', marca: 'KeyMaster', modelo: 'ProClick', estoque: 8, status: 'ativo', imagemUrl: 'https://picsum.photos/seed/keyboard/400/300' },
  { id: 'prod3', nome: 'Monitor LED 24" Full HD', descricao: 'Monitor com painel IPS, 75Hz e design bordas finas.', preco: 899.00, categoria: 'Monitores', marca: 'ViewSonic', modelo: 'VX2458', estoque: 0, status: 'ativo', imagemUrl: 'https://picsum.photos/seed/monitor/400/300' },
];

let mockCart: { [userId: string]: CartItem[] } = {
    'client1': [ { ...mockProducts[0], quantity: 1 } ]
};

let mockOrders: Order[] = [
    { id: 'order1', clienteId: 'client1', data_pedido: new Date(Date.now() - 86400000 * 2).toISOString(), status: 'entregue', metodo_pagamento: 'cartao_credito', items: [{...mockProducts[0], quantity: 1}], valorTotal: 129.90, enderecoEntrega: 'Rua Exemplo, 123' },
];

let mockServiceRequests: ServiceRequest[] = [
    {id: 'sr1', clienteId: 'client1', clienteNome: 'Cliente User', clienteEmail: 'client@unifafibe.com', tipo_equipamento: 'notebook', marca: 'Dell', modelo: 'Inspiron 15', descricao_problema: 'Tela não liga após queda.', fotoUrl: 'https://picsum.photos/seed/sr1/200/150', aceiteLGPD: true, data_solicitacao: new Date(Date.now() - 86400000 * 5).toISOString(), status: ServiceRequestStatus.PENDENTE, forma_envio: 'Correios'},
    {id: 'sr2', clienteId: 'client1', clienteNome: 'Cliente User', clienteEmail: 'client@unifafibe.com', tipo_equipamento: 'desktop', marca: 'Custom PC', modelo: 'Gamer Rig', descricao_problema: 'Não dá boot, faz barulho estranho.', aceiteLGPD: true, data_solicitacao: new Date(Date.now() - 86400000 * 3).toISOString(), status: ServiceRequestStatus.ORCAMENTO_ENVIADO, forma_envio: 'Presencial', quoteId: 'qt1'},
];

let mockQuotes: Quote[] = [
    {id: 'qt1', solicitacaoId: 'sr2', analistaId: 'analyst1', diagnostico: 'Fonte de alimentação queimada. Necessário substituição por uma de 650W.', valorMaoDeObra: 150, valorPecasEstimado: 350, valorTotal: 500, prazoEntregaDias: 3, tipoEntrega: 'oficina', observacoesTecnicas: 'Recomendamos limpeza interna preventiva.', status: QuoteStatus.PENDENTE_APROVACAO_CLIENTE, dataCriacao: new Date(Date.now() - 86400000 * 2).toISOString() }
];

let mockHelpTickets: HelpTicket[] = [
    {id: 'ht1', clienteId: 'client1', assunto: 'Pedido atrasado', descricao: 'Meu pedido #order1 não chegou na data prevista.', categoria: 'Problemas com a entrega', data_abertura: new Date().toISOString(), status: 'aberto'},
];

let mockLgpdTerms: LgpdTerm[] = [
    {id: 'lgpd1', conteudo: 'Este é o termo LGPD padrão. Ao se cadastrar, você concorda com o uso dos seus dados para processamento de pedidos, comunicação sobre serviços e ofertas, e para fins de suporte técnico, conforme detalhado em nossa Política de Privacidade.', versao: 'v1.0', data_efetiva: new Date(Date.now() - 86400000 * 30).toISOString() }
];

const delay = <T,>(data: T): Promise<T> => new Promise(resolve => setTimeout(() => resolve(data), MOCK_API_DELAY / 2)); // Atraso reduzido para testes de UI mais rápidos
const generateId = () => Math.random().toString(36).substring(2, 11);

export const mockLogin = (email: string, pass: string): Promise<User | null> => {
  const user = mockUsers.find(u => u.email === email && u.status === 'ativo');
  // Simula verificação de senha (em um app real, seria hash)
  return delay(user || null);
};

export const mockRegister = (userData: UserRegistrationData): Promise<User | null> => {
  if (mockUsers.some(u => u.email === userData.email || (userData.cpf_cnpj && u.cpf_cnpj === userData.cpf_cnpj) )) {
    return delay(null); // Usuário já existe
  }
  const { senha, ...registrationDetails } = userData; // Remove a senha do objeto principal
  const newUser: User = {
    ...registrationDetails, 
    id: generateId(),
    data_cadastro: new Date().toISOString(),
    status: 'ativo', // Usuário é ativo por padrão ao registrar
  };
  mockUsers.push(newUser);
  return delay(newUser);
};

export const mockLogout = (): Promise<void> => delay(undefined);
export const fetchUsers = (): Promise<User[]> => delay([...mockUsers]);

export const updateUserProfile = (userId: string, data: Partial<User>): Promise<User | null> => {
  const userIndex = mockUsers.findIndex(u => u.id === userId);
  if (userIndex === -1) return delay(null);
  mockUsers[userIndex] = { ...mockUsers[userIndex], ...data };
  return delay(mockUsers[userIndex]);
};

export const updateUserStatus = (userId: string, status: 'ativo' | 'inativo'): Promise<User | null> => {
  const userIndex = mockUsers.findIndex(u => u.id === userId);
  if (userIndex === -1) return delay(null);
  mockUsers[userIndex].status = status;
  return delay(mockUsers[userIndex]);
};

export const createUser = (userData: Omit<User, 'id' | 'data_cadastro' | 'status' | 'cpf_cnpj' | 'endereco' | 'telefone'> & {senha: string}): Promise<User | null> => {
   if (mockUsers.some(u => u.email === userData.email )) {
    return delay(null); // Email já existe
  }
  const { senha, ...restOfUserData } = userData; // Senha não é armazenada diretamente no mockUser
  const newUser: User = {
    ...restOfUserData,
    id: generateId(),
    data_cadastro: new Date().toISOString(),
    status: 'ativo',
  };
  mockUsers.push(newUser);
  return delay(newUser);
}

// --- Produtos ---
export const fetchProducts = (): Promise<Product[]> => delay([...mockProducts]);
export const createProduct = (productData: Omit<Product, 'id' | 'imagemUrl'>): Promise<Product> => {
    const newProduct: Product = { ...productData, id: generateId(), imagemUrl: `https://picsum.photos/seed/${generateId()}/400/300` };
    mockProducts.push(newProduct);
    return delay(newProduct);
};
export const updateProduct = (productId: string, productData: Partial<Product>): Promise<Product | null> => {
    const index = mockProducts.findIndex(p => p.id === productId);
    if (index === -1) return delay(null);
    mockProducts[index] = { ...mockProducts[index], ...productData };
    return delay(mockProducts[index]);
};
export const deleteProduct = (productId: string): Promise<boolean> => {
    const initialLength = mockProducts.length;
    mockProducts = mockProducts.filter(p => p.id !== productId);
    return delay(mockProducts.length < initialLength);
};

// --- Carrinho ---
export const fetchCartItems = (userId: string): Promise<CartItem[]> => delay(mockCart[userId] || []);
export const addToCart = (userId: string, productId: string, quantity: number): Promise<CartItem | null> => {
    const product = mockProducts.find(p => p.id === productId);
    if (!product || product.estoque < quantity) return delay(null); // Produto não encontrado ou sem estoque
    if (!mockCart[userId]) mockCart[userId] = [];
    const existingItemIndex = mockCart[userId].findIndex(item => item.id === productId);
    if (existingItemIndex > -1) {
        mockCart[userId][existingItemIndex].quantity += quantity; // Adiciona à quantidade existente
        return delay(mockCart[userId][existingItemIndex]);
    } else {
        const cartItem: CartItem = { ...product, quantity };
        mockCart[userId].push(cartItem);
        return delay(cartItem);
    }
};
export const updateCartItemQuantity = (userId: string, itemId: string, newQuantity: number): Promise<CartItem | null> => {
    if (!mockCart[userId]) return delay(null);
    const itemIndex = mockCart[userId].findIndex(item => item.id === itemId);
    if (itemIndex === -1) return delay(null); // Item não encontrado
    if (newQuantity <= 0) { // Remove o item se a quantidade for 0 ou menor
        mockCart[userId].splice(itemIndex, 1);
        return delay(null); 
    }
    mockCart[userId][itemIndex].quantity = newQuantity;
    return delay(mockCart[userId][itemIndex]);
};
export const removeCartItem = (userId: string, itemId: string): Promise<boolean> => {
    if (!mockCart[userId]) return delay(false);
    const initialLength = mockCart[userId].length;
    mockCart[userId] = mockCart[userId].filter(item => item.id !== itemId);
    return delay(mockCart[userId].length < initialLength);
};

// --- Pedidos ---
export const fetchOrders = (userId: string): Promise<Order[]> => {
    return delay(mockOrders.filter(order => order.clienteId === userId).sort((a,b) => new Date(b.data_pedido).getTime() - new Date(a.data_pedido).getTime()));
};

// --- Solicitações de Serviço (Aprimorado) ---
export const fetchServiceRequests = (userId: string, userRole: UserRole): Promise<ServiceRequest[]> => {
    let requests = mockServiceRequests.map(sr => {
        const client = mockUsers.find(u => u.id === sr.clienteId);
        return {
            ...sr,
            clienteNome: client?.nome, // Adiciona nome do cliente para visualização do admin/analista
            clienteEmail: client?.email, // Adiciona email do cliente
        }
    });
    if (userRole === UserRole.CLIENTE) {
        return delay(requests.filter(sr => sr.clienteId === userId).sort((a,b) => new Date(b.data_solicitacao).getTime() - new Date(a.data_solicitacao).getTime()));
    }
    return delay(requests.sort((a,b) => new Date(b.data_solicitacao).getTime() - new Date(a.data_solicitacao).getTime())); // Admin/Analista veem todos
};

export const createServiceRequest = (
    clienteId: string, 
    requestData: Omit<ServiceRequest, 'id' | 'clienteId' | 'data_solicitacao' | 'status' | 'quoteId' | 'dataAprovacao' | 'previsaoEntrega' | 'dataConclusao' | 'motivoRecusa' | 'clienteNome' | 'clienteEmail'>
): Promise<ServiceRequest> => {
    const client = mockUsers.find(u => u.id === clienteId);
    const newSR: ServiceRequest = {
        ...requestData,
        id: `sr-${generateId()}`,
        clienteId,
        clienteNome: client?.nome,
        clienteEmail: client?.email,
        data_solicitacao: new Date().toISOString(),
        status: ServiceRequestStatus.PENDENTE,
        aceiteLGPD: requestData.aceiteLGPD, // Garante que isso é passado do formulário
    };
    mockServiceRequests.push(newSR);
    return delay(newSR);
};

// --- Orçamentos (Quote) ---
export const fetchQuote = (quoteId: string): Promise<Quote | null> => {
    const quote = mockQuotes.find(q => q.id === quoteId);
    return delay(quote || null);
};

export const createQuoteForServiceRequest = (
    serviceRequestId: string, 
    quoteData: Omit<Quote, 'id' | 'solicitacaoId' | 'status' | 'analistaId' | 'dataCriacao'>, 
    analistaId: string
): Promise<Quote | null> => {
    const srIndex = mockServiceRequests.findIndex(sr => sr.id === serviceRequestId);
    if (srIndex === -1 || mockServiceRequests[srIndex].status !== ServiceRequestStatus.PENDENTE) {
        console.error("Solicitação de Serviço não encontrada ou não está no estado PENDENTE.");
        return delay(null);
    }
    const newQuote: Quote = {
        ...quoteData,
        id: `qt-${generateId()}`,
        solicitacaoId: serviceRequestId,
        analistaId,
        status: QuoteStatus.PENDENTE_APROVACAO_CLIENTE,
        dataCriacao: new Date().toISOString(),
    };
    mockQuotes.push(newQuote);
    mockServiceRequests[srIndex].status = ServiceRequestStatus.ORCAMENTO_ENVIADO;
    mockServiceRequests[srIndex].quoteId = newQuote.id;
    return delay(newQuote);
};

export const approveQuote = (userId: string, serviceRequestId: string, quoteId: string): Promise<ServiceRequest | null> => {
    const srIndex = mockServiceRequests.findIndex(sr => sr.id === serviceRequestId && sr.clienteId === userId && sr.quoteId === quoteId);
    const quoteIndex = mockQuotes.findIndex(q => q.id === quoteId && q.solicitacaoId === serviceRequestId);

    if (srIndex === -1 || quoteIndex === -1 || mockServiceRequests[srIndex].status !== ServiceRequestStatus.ORCAMENTO_ENVIADO) {
        console.error("Validação falhou ao aprovar orçamento (solicitação/orçamento não encontrado ou status incorreto).");
        return delay(null);
    }
    
    mockServiceRequests[srIndex].status = ServiceRequestStatus.EM_ANDAMENTO;
    mockServiceRequests[srIndex].dataAprovacao = new Date().toISOString();
    const quote = mockQuotes[quoteIndex];
    const deliveryDate = new Date();
    // Adiciona dias úteis (simplificado, não considera fins de semana/feriados)
    deliveryDate.setDate(deliveryDate.getDate() + quote.prazoEntregaDias);
    mockServiceRequests[srIndex].previsaoEntrega = deliveryDate.toISOString();

    mockQuotes[quoteIndex].status = QuoteStatus.APROVADO_PELO_CLIENTE;
    return delay(mockServiceRequests[srIndex]);
};

export const refuseQuote = (userId: string, serviceRequestId: string, quoteId: string, motivo: string): Promise<ServiceRequest | null> => {
    const srIndex = mockServiceRequests.findIndex(sr => sr.id === serviceRequestId && sr.clienteId === userId && sr.quoteId === quoteId);
    const quoteIndex = mockQuotes.findIndex(q => q.id === quoteId && q.solicitacaoId === serviceRequestId);

    if (srIndex === -1 || quoteIndex === -1 || mockServiceRequests[srIndex].status !== ServiceRequestStatus.ORCAMENTO_ENVIADO) {
         console.error("Validação falhou ao recusar orçamento (solicitação/orçamento não encontrado ou status incorreto).");
        return delay(null);
    }

    mockServiceRequests[srIndex].status = ServiceRequestStatus.CANCELADO;
    mockServiceRequests[srIndex].motivoRecusa = motivo;
    mockQuotes[quoteIndex].status = QuoteStatus.RECUSADO_PELO_CLIENTE;
    return delay(mockServiceRequests[srIndex]);
};

export const completeServiceRequestByTechnician = (technicianId: string, serviceRequestId: string): Promise<ServiceRequest | null> => {
    // Adicionar validação de perfil do técnico se necessário
    const srIndex = mockServiceRequests.findIndex(sr => sr.id === serviceRequestId);
    if (srIndex === -1 || mockServiceRequests[srIndex].status !== ServiceRequestStatus.EM_ANDAMENTO) {
        console.error("Solicitação de Serviço não encontrada ou não está no estado EM ANDAMENTO.");
        return delay(null);
    }
    mockServiceRequests[srIndex].status = ServiceRequestStatus.CONCLUIDO;
    mockServiceRequests[srIndex].dataConclusao = new Date().toISOString();
    return delay(mockServiceRequests[srIndex]);
};


// --- Central de Ajuda (Help Tickets) ---
export const fetchHelpTickets = (userId: string, userRole: UserRole): Promise<HelpTicket[]> => {
    if (userRole === UserRole.CLIENTE) {
        return delay(mockHelpTickets.filter(ht => ht.clienteId === userId));
    }
    return delay([...mockHelpTickets]); // Admin/Analista veem todos
};
export const createHelpTicket = (clienteId: string, ticketData: Omit<HelpTicket, 'id' | 'clienteId' | 'data_abertura' | 'status' | 'respostas'>): Promise<HelpTicket> => {
    const newHT: HelpTicket = {
        ...ticketData,
        id: `ht-${generateId()}`,
        clienteId,
        data_abertura: new Date().toISOString(),
        status: 'aberto',
    };
    mockHelpTickets.push(newHT);
    return delay(newHT);
}

// --- Termos LGPD ---
export const fetchLgpdTerms = (): Promise<LgpdTerm[]> => delay([...mockLgpdTerms]);
export const updateLgpdTerm = (termId: string, termData: Partial<LgpdTerm>): Promise<LgpdTerm | null> => {
    const index = mockLgpdTerms.findIndex(t => t.id === termId);
    if (index === -1 && termId) { // Se termId é fornecido mas não encontrado
        return delay(null);
    }
    if (index !== -1) { // Atualiza termo existente
      mockLgpdTerms[index] = { ...mockLgpdTerms[index], ...termData };
      return delay(mockLgpdTerms[index]);
    } else { // Cria novo termo se nenhum id foi passado (ou se é para criar um novo)
      const newTerm: LgpdTerm = { id: generateId(), ...termData } as LgpdTerm; // Força tipo se dados parciais
      mockLgpdTerms.push(newTerm);
      return delay(newTerm);
    }
};

// --- Estatísticas do Painel ---
export const fetchDashboardStats = (role: UserRole): Promise<DashboardStats> => {
  let stats: DashboardStats = {
    totalClientes: mockUsers.filter(u => u.role === UserRole.CLIENTE).length,
    vendasPeriodo: mockOrders.reduce((sum, order) => sum + order.valorTotal, 0) / 2, // Exemplo: média de vendas
    assistenciasPeriodo: mockServiceRequests.filter(sr => sr.status === ServiceRequestStatus.CONCLUIDO).length,
  };
  if (role === UserRole.CLIENTE) {
    const clientUser = mockUsers.find(u => u.role === UserRole.CLIENTE); // Pega primeiro cliente para mock
    if(clientUser) {
        stats.novosPedidos = mockOrders.filter(o => o.clienteId === clientUser.id && new Date(o.data_pedido) > new Date(Date.now() - 86400000 * 7)).length; // Pedidos nos últimos 7 dias
        stats.chamadosAbertos = mockHelpTickets.filter(ht => ht.clienteId === clientUser.id && ht.status === 'aberto').length;
    }
  } else if (role === UserRole.ANALISTA) {
    stats.chamadosAbertos = mockHelpTickets.filter(ht => ht.status === 'aberto' || ht.status === 'em_andamento').length;
  }
  // Admin não tem stats específicos adicionais neste mock, herda os básicos
  return delay(stats);
};