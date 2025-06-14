
import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import LoginPage from '@/pages/PaginaLogin';
import RegisterPage from '@/pages/PaginaRegistro';
import DashboardPage from '@/pages/PaginaPainelControle';
import ProductsPage from '@/pages/PaginaProdutos';
import ProductManagementPage from '@/pages/PaginaGerenciamentoProdutos';
import UserManagementPage from '@/pages/PaginaGerenciamentoUsuarios';
import ServiceRequestsPage from '@/pages/PaginaSolicitacoesServico';
import HelpDeskPage from '@/pages/PaginaCentralAjuda';
import LgpdManagementPage from '@/pages/PaginaGerenciamentoLgpd';
import ProfilePage from '@/pages/PaginaPerfil';
import CartPage from '@/pages/PaginaCarrinho';
import OrdersPage from '@/pages/PaginaPedidos';
import NotFoundPage from '@/pages/PaginaNaoEncontrada';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/types';
import { ROUTES } from '@/constants';

const ProtectedRoute: React.FC<{ children: React.ReactNode; roles?: UserRole[] }> = ({ children, roles }) => {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }
  if (roles && user && !roles.includes(user.role)) {
    return <Navigate to={ROUTES.DASHBOARD} replace />; // Ou uma página específica de "Acesso Negado"
  }
  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <HashRouter>
      <Routes>
        <Route path={ROUTES.LOGIN} element={<LoginPage />} />
        <Route path={ROUTES.REGISTER} element={<RegisterPage />} />
        <Route element={<Layout />}>
          <Route path="/" element={<ProtectedRoute><Navigate to={ROUTES.DASHBOARD} replace /></ProtectedRoute>} />
          <Route path={ROUTES.DASHBOARD} element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path={ROUTES.PRODUCTS} element={<ProtectedRoute><ProductsPage /></ProtectedRoute>} />
          <Route path={ROUTES.CART} element={<ProtectedRoute roles={[UserRole.CLIENTE]}><CartPage /></ProtectedRoute>} />
          <Route path={ROUTES.ORDERS} element={<ProtectedRoute roles={[UserRole.CLIENTE]}><OrdersPage /></ProtectedRoute>} />
          <Route path={ROUTES.PROFILE} element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path={ROUTES.SERVICE_REQUESTS} element={<ProtectedRoute><ServiceRequestsPage /></ProtectedRoute>} />
          <Route path={ROUTES.HELP_DESK} element={<ProtectedRoute><HelpDeskPage /></ProtectedRoute>} />
          
          {/* Rotas Administrativas */}
          <Route path={ROUTES.ADMIN_PRODUCT_MANAGEMENT} element={<ProtectedRoute roles={[UserRole.ADMIN, UserRole.ANALISTA]}><ProductManagementPage /></ProtectedRoute>} />
          <Route path={ROUTES.ADMIN_USER_MANAGEMENT} element={<ProtectedRoute roles={[UserRole.ADMIN]}><UserManagementPage /></ProtectedRoute>} />
          <Route path={ROUTES.ADMIN_LGPD_MANAGEMENT} element={<ProtectedRoute roles={[UserRole.ADMIN]}><LgpdManagementPage /></ProtectedRoute>} />
          
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </HashRouter>
  );
};

export default App;