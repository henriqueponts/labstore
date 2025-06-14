
import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { UserRole } from '../../types';
import { ROUTES } from '../../constants';
import { DashboardIcon, ProductIcon, UsersIcon, ShieldCheckIcon, CogIcon, ShoppingCartIcon, ListBulletIcon, WrenchScrewdriverIcon, ChatBubbleLeftEllipsisIcon } from '../ui/Icon';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

interface NavItem {
  path: string;
  name: string;
  icon: React.ReactNode;
  roles?: UserRole[];
}

const commonNavItems: NavItem[] = [
  { path: ROUTES.DASHBOARD, name: 'Painel', icon: <DashboardIcon className="w-5 h-5 mr-3" /> },
  { path: ROUTES.PRODUCTS, name: 'Produtos', icon: <ProductIcon className="w-5 h-5 mr-3" /> },
];

const clientNavItems: NavItem[] = [
  { path: ROUTES.CART, name: 'Carrinho', icon: <ShoppingCartIcon className="w-5 h-5 mr-3" />, roles: [UserRole.CLIENTE] },
  { path: ROUTES.ORDERS, name: 'Meus Pedidos', icon: <ListBulletIcon className="w-5 h-5 mr-3" />, roles: [UserRole.CLIENTE] },
  { path: ROUTES.SERVICE_REQUESTS, name: 'Suporte Técnico', icon: <WrenchScrewdriverIcon className="w-5 h-5 mr-3" />, roles: [UserRole.CLIENTE, UserRole.ADMIN, UserRole.ANALISTA] },
  { path: ROUTES.HELP_DESK, name: 'Central de Ajuda', icon: <ChatBubbleLeftEllipsisIcon className="w-5 h-5 mr-3" />, roles: [UserRole.CLIENTE, UserRole.ADMIN, UserRole.ANALISTA] },
];

const adminAnalystNavItems: NavItem[] = [
   { path: ROUTES.SERVICE_REQUESTS, name: 'Solicitações Técnicas', icon: <WrenchScrewdriverIcon className="w-5 h-5 mr-3" />, roles: [UserRole.ADMIN, UserRole.ANALISTA] },
   { path: ROUTES.HELP_DESK, name: 'Chamados', icon: <ChatBubbleLeftEllipsisIcon className="w-5 h-5 mr-3" />, roles: [UserRole.ADMIN, UserRole.ANALISTA] },
];

const adminNavItems: NavItem[] = [
  { path: ROUTES.ADMIN_PRODUCT_MANAGEMENT, name: 'Gerenciar Produtos', icon: <CogIcon className="w-5 h-5 mr-3" />, roles: [UserRole.ADMIN, UserRole.ANALISTA] },
  { path: ROUTES.ADMIN_USER_MANAGEMENT, name: 'Gerenciar Usuários', icon: <UsersIcon className="w-5 h-5 mr-3" />, roles: [UserRole.ADMIN] },
  { path: ROUTES.ADMIN_LGPD_MANAGEMENT, name: 'Gerenciar LGPD', icon: <ShieldCheckIcon className="w-5 h-5 mr-3" />, roles: [UserRole.ADMIN] },
];


const NavItemLink: React.FC<{ item: NavItem; onClick?: () => void }> = ({ item, onClick }) => (
  <NavLink
    to={item.path}
    onClick={onClick}
    className={({ isActive }) =>
      `flex items-center px-4 py-2.5 rounded-lg transition-colors duration-200 ${
        isActive
          ? 'bg-unifafibe_orange text-white shadow-sm'
          : 'text-unifafibe_gray-dark hover:bg-unifafibe_gray-light hover:text-unifafibe_blue'
      }`
    }
  >
    {item.icon}
    {item.name}
  </NavLink>
);

const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen }) => {
  const { user } = useAuth();

  const getNavItems = () => {
    if (!user) return [];
    let items = [...commonNavItems];
    if (user.role === UserRole.CLIENTE) {
      items = [...items, ...clientNavItems.filter(item => !item.roles || item.roles.includes(UserRole.CLIENTE))];
    }
    if (user.role === UserRole.ADMIN || user.role === UserRole.ANALISTA) {
      items = [...items, ...adminAnalystNavItems.filter(item => !item.roles || item.roles.includes(user.role))];
      items = [...items, ...adminNavItems.filter(item => !item.roles || item.roles.includes(user.role))];
    }
     // Remove duplicatas por caminho
    const uniqueItems = items.reduce((acc, current) => {
        const x = acc.find(item => item.path === current.path);
        if (!x) {
            return acc.concat([current]);
        } else {
            return acc;
        }
    }, [] as NavItem[]);
    return uniqueItems;
  };

  const navItemsToRender = getNavItems();

  const handleLinkClick = () => {
    if (window.innerWidth < 768) { // Ponto de quebra 'md'
        setIsOpen(false);
    }
  }

  return (
    <>
      {/* Overlay para mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black opacity-50 md:hidden"
          onClick={() => setIsOpen(false)}
        ></div>
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-white shadow-xl transform ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } md:relative md:translate-x-0 transition-transform duration-300 ease-in-out flex flex-col`}
      >
        <div className="flex items-center justify-center h-16 bg-unifafibe_blue text-white">
          <span className="text-xl font-semibold">Menu</span>
        </div>
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItemsToRender.map((item) => (
            <NavItemLink key={item.path} item={item} onClick={handleLinkClick} />
          ))}
        </nav>
        <div className="p-4 border-t border-unifafibe_gray-light">
          {/* Opcional: Informações do usuário ou link de configurações aqui */}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;