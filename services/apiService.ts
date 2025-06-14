
import axios, { AxiosInstance, AxiosError } from 'axios';
import { 
  User, 
  UserRegistrationData, 
  AuthResponse, 
  Product, 
  CartItem,
  Order,
  ServiceRequest,
  Quote,
  HelpTicket,
  LgpdTerm,
  DashboardStats,
  UserRole,
  QuoteStatus,
  ServiceRequestStatus
} from '@/types';
import { API_BASE_URL } from '@/constants';

const AUTH_TOKEN_KEY = 'authToken'; 

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const definirTokenAutenticacao = (token: string | null): void => {
  if (token) {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    delete apiClient.defaults.headers.common['Authorization'];
  }
};

export const obterTokenAutenticacao = (): string | null => {
  return localStorage.getItem(AUTH_TOKEN_KEY);
};

const handleApiError = (error: AxiosError | any, contexto: string): never => {
  let errorMessage = `Erro desconhecido em ${contexto}.`;
  if (axios.isAxiosError(error)) {
    if (error.response) {
      // Usa a mensagem do backend se disponível, senão uma mensagem genérica de status.
      errorMessage = error.response.data?.message || error.response.data?.error || `Erro em ${contexto}: Status ${error.response.status}`;
    } else if (error.request) {
      errorMessage = `Sem resposta do servidor em ${contexto}. Verifique sua conexão.`;
    } else {
      errorMessage = `Erro ao configurar requisição para ${contexto}: ${error.message}`;
    }
  } else if (error instanceof Error) {
    errorMessage = error.message;
  }
  console.error(`Erro na API em ${contexto}:`, error);
  throw new Error(errorMessage);
};


// --- Autenticação ---
export const entrar = async (email: string, pass: string): Promise<AuthResponse> => {
  try {
    const response = await apiClient.post<AuthResponse>('/auth/login', { email, senha: pass });
    if (response.data.token) {
      definirTokenAutenticacao(response.data.token);
    }
    return response.data;
  } catch (error) {
    handleApiError(error, 'entrar');
  }
};

export const registrar = async (userData: UserRegistrationData): Promise<AuthResponse> => {
  try {
    // UserRegistrationData now includes optional endereco and telefone
    const response = await apiClient.post<AuthResponse>('/auth/register', userData);
     if (response.data.token) {
      definirTokenAutenticacao(response.data.token);
    }
    return response.data;
  } catch (error) {
    handleApiError(error, 'registrar');
  }
};

export const sair = async (): Promise<void> => {
  try {
     await apiClient.post('/auth/logout'); 
  } catch (error) {
    console.warn("Erro na API ao sair (ignorado, prosseguindo com logout no cliente):", error);
  } finally {
    definirTokenAutenticacao(null);
  }
};

// --- Produtos ---
export const buscarProdutos = async (forManagement = false): Promise<Product[]> => {
  try {
    const endpoint = forManagement ? '/products/admin/all' : '/products';
    const response = await apiClient.get<Product[]>(endpoint);
    return response.data;
  } catch (error) {
    handleApiError(error, 'buscarProdutos');
  }
};

export const criarProduto = async (productData: Omit<Product, 'id' | 'imagemUrl'> & { categoria: string }): Promise<Product> => {
    try {
        // productData.categoria is the string ID of the category.
        // The backend controller expects 'categoria' in the body as the string ID.
        // The Product type has id_categoria (numeric) and categoria (name), but the input 'productData.categoria' here IS the ID.
        const response = await apiClient.post<Product>('/products', productData);
        return response.data;
    } catch (error) {
        handleApiError(error, 'criarProduto');
    }
};

export const atualizarProduto = async (productId: string, productData: Partial<Product> & { categoria?: string }): Promise<Product> => {
    try {
        // productData may contain 'categoria' as a string ID if the category is being updated.
        // The backend controller for PUT /products/:id expects 'categoria' in the body if it's being changed,
        // and it will parse it to 'id_categoria' for the service.
        // We send productData directly.
        const response = await apiClient.put<Product>(`/products/${productId}`, productData);
        return response.data;
    } catch (error) {
        handleApiError(error, 'atualizarProduto');
    }
};

export const excluirProduto = async (productId: string): Promise<void> => {
    try {
        await apiClient.delete(`/products/${productId}`);
    } catch (error) {
        handleApiError(error, 'excluirProduto');
    }
};


// --- Carrinho ---
export const buscarItensCarrinho = async (): Promise<CartItem[]> => {
  try {
    const response = await apiClient.get<CartItem[]>('/cart'); 
    return response.data;
  } catch (error) {
    handleApiError(error, 'buscarItensCarrinho');
  }
};

export const adicionarAoCarrinho = async (productId: string, quantity: number): Promise<CartItem> => {
  try {
    const response = await apiClient.post<CartItem>('/cart/items', { productId: productId, quantity });
    return response.data;
  } catch (error) {
    handleApiError(error, 'adicionarAoCarrinho');
  }
};

export const atualizarQuantidadeItemCarrinho = async (itemId: string, newQuantity: number): Promise<CartItem | null > => {
  try {
    const response = await apiClient.put<CartItem>(`/cart/items/${itemId}`, { quantity: newQuantity });
    if (response.status === 204) return null; 
    return response.data;
  } catch (error) {
    handleApiError(error, 'atualizarQuantidadeItemCarrinho');
  }
};

export const removerItemCarrinho = async (itemId: string): Promise<void> => {
  try {
    await apiClient.delete(`/cart/items/${itemId}`);
  } catch (error) {
    handleApiError(error, 'removerItemCarrinho');
  }
};


// --- Usuários (Admin) ---
export const buscarUsuarios = async (): Promise<User[]> => {
  try {
    const response = await apiClient.get<User[]>('/users');
    return response.data;
  } catch (error) {
    handleApiError(error, 'buscarUsuarios');
  }
};

export const atualizarPerfilUsuario = async (userId: string, data: Partial<User>): Promise<User> => {
  try {
    const response = await apiClient.put<User>(`/users/${userId}/profile`, data);
    return response.data;
  } catch (error) {
    handleApiError(error, 'atualizarPerfilUsuario');
  }
};

export const atualizarStatusUsuario = async (userId: string, status: 'ativo' | 'inativo'): Promise<User> => {
  try {
    const response = await apiClient.put<User>(`/users/${userId}/status`, { status });
    return response.data;
  } catch (error) {
    handleApiError(error, 'atualizarStatusUsuario');
  }
};

export const criarUsuario = async (userData: Omit<User, 'id' | 'data_cadastro' | 'status' | 'cpf_cnpj' | 'endereco' | 'telefone'> & {senha: string}): Promise<User> => {
    try {
        const response = await apiClient.post<User>('/users', userData); 
        return response.data;
    } catch (error) {
        handleApiError(error, 'criarUsuario (admin/analista)');
    }
};


// --- Pedidos ---
export const buscarPedidos = async (): Promise<Order[]> => {
  try {
    const response = await apiClient.get<Order[]>('/orders');
    return response.data;
  } catch (error) {
    handleApiError(error, 'buscarPedidos');
  }
};

export const criarPedido = async (orderDetails: { metodo_pagamento: string, enderecoEntrega?: string }): Promise<Order> => {
    try {
        const response = await apiClient.post<Order>('/orders', orderDetails);
        return response.data;
    } catch (error) {
        handleApiError(error, 'criarPedido');
    }
};


// --- Solicitações de Serviço e Orçamentos ---
export const buscarSolicitacoesServico = async (): Promise<ServiceRequest[]> => {
  try {
    const response = await apiClient.get<ServiceRequest[]>('/service-requests');
    return response.data;
  } catch (error) {
    handleApiError(error, 'buscarSolicitacoesServico');
  }
};

export const criarSolicitacaoServico = async (
    requestData: Omit<ServiceRequest, 'id' | 'clienteId' | 'data_solicitacao' | 'status' | 'quoteId' | 'dataAprovacao' | 'previsaoEntrega' | 'dataConclusao' | 'motivoRecusa' | 'clienteNome' | 'clienteEmail'>
): Promise<ServiceRequest> => {
    try {
        const response = await apiClient.post<ServiceRequest>('/service-requests', requestData);
        return response.data;
    } catch (error) {
        handleApiError(error, 'criarSolicitacaoServico');
    }
};

export const buscarOrcamento = async (quoteId: string): Promise<Quote> => {
    try {
        const response = await apiClient.get<Quote>(`/service-requests/quotes/${quoteId}`); 
        return response.data;
    } catch (error) {
        handleApiError(error, 'buscarOrcamento');
    }
};

export const criarOrcamentoParaSolicitacao = async (
    serviceRequestId: string, 
    quoteData: Omit<Quote, 'id' | 'solicitacaoId' | 'status' | 'analistaId' | 'dataCriacao'>
): Promise<Quote> => {
    try {
        const response = await apiClient.post<Quote>(`/service-requests/${serviceRequestId}/quotes`, quoteData);
        return response.data;
    } catch (error) {
        handleApiError(error, 'criarOrcamentoParaSolicitacao');
    }
};

export const aprovarOrcamento = async (serviceRequestId: string, quoteId: string): Promise<ServiceRequest> => {
    try {
        const response = await apiClient.post<ServiceRequest>(`/service-requests/${serviceRequestId}/quotes/${quoteId}/approve`);
        return response.data;
    } catch (error) {
        handleApiError(error, 'aprovarOrcamento');
    }
};

export const recusarOrcamento = async (serviceRequestId: string, quoteId: string, motivo: string): Promise<ServiceRequest> => {
    try {
        const response = await apiClient.post<ServiceRequest>(`/service-requests/${serviceRequestId}/quotes/${quoteId}/refuse`, { motivo });
        return response.data;
    } catch (error) {
        handleApiError(error, 'recusarOrcamento');
    }
};

export const concluirSolicitacaoServicoTecnico = async (serviceRequestId: string): Promise<ServiceRequest> => {
    try {
        const response = await apiClient.post<ServiceRequest>(`/service-requests/${serviceRequestId}/complete`);
        return response.data;
    } catch (error) {
        handleApiError(error, 'concluirSolicitacaoServicoTecnico');
    }
};

// --- Central de Ajuda (Help Tickets) ---
export const buscarChamadosAjuda = async (): Promise<HelpTicket[]> => {
  try {
    const response = await apiClient.get<HelpTicket[]>('/help-tickets');
    return response.data;
  } catch (error) {
    handleApiError(error, 'buscarChamadosAjuda');
  }
};
export const criarChamadoAjuda = async (ticketData: Omit<HelpTicket, 'id' | 'clienteId' | 'data_abertura' | 'status' | 'respostas'>): Promise<HelpTicket> => {
    try {
        const response = await apiClient.post<HelpTicket>('/help-tickets', ticketData);
        return response.data;
    } catch (error) {
        handleApiError(error, 'criarChamadoAjuda');
    }
}

// --- Termos LGPD ---
export const buscarTermosLgpd = async (): Promise<LgpdTerm[]> => {
  try {
    const response = await apiClient.get<LgpdTerm[]>('/lgpd-terms');
    return response.data;
  } catch (error) {
    handleApiError(error, 'buscarTermosLgpd');
  }
};

export const atualizarTermoLgpd = async (termId: string, termData: Partial<LgpdTerm>): Promise<LgpdTerm> => {
    try {
        const payload = { conteudo: termData.conteudo, versao: termData.versao };
        const response = await apiClient.put<LgpdTerm>(`/lgpd-terms/${termId}`, payload);
        return response.data;
    } catch (error) {
        handleApiError(error, 'atualizarTermoLgpd');
    }
};

// --- Estatísticas do Painel ---
export const buscarEstatisticasPainel = async (): Promise<DashboardStats> => {
  try {
    const response = await apiClient.get<DashboardStats>('/dashboard/stats');
    return response.data;
  } catch (error) {
    handleApiError(error, 'buscarEstatisticasPainel');
  }
};
