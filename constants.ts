export const APP_NAME = "UNIFAFIBE Marketplace & Suporte";

export const API_BASE_URL = "http://localhost:3001/api"; // Idealmente, viria de uma variável de ambiente

export const ROUTES = {
  LOGIN: '/entrar',
  REGISTER: '/registrar',
  DASHBOARD: '/painel-controle',
  PRODUCTS: '/produtos',
  PRODUCT_DETAIL: '/produtos/:id', // Exemplo, não totalmente implementado
  CART: '/carrinho',
  ORDERS: '/pedidos',
  PROFILE: '/perfil',
  SERVICE_REQUESTS: '/solicitacoes-servico',
  HELP_DESK: '/central-ajuda',
  ADMIN_PRODUCT_MANAGEMENT: '/admin/gerenciar-produtos',
  ADMIN_USER_MANAGEMENT: '/admin/gerenciar-usuarios',
  ADMIN_LGPD_MANAGEMENT: '/admin/gerenciar-lgpd',
};

export const MOCK_API_DELAY = 1000; // ms