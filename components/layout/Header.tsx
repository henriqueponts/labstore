
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { APP_NAME, ROUTES } from '../../constants';
import { UserIcon, ShoppingCartIcon, LogoutIcon } from '../ui/Icon';
import { UserRole } from '../../types';

interface HeaderProps {
  onMenuButtonClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuButtonClick }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate(ROUTES.LOGIN);
  };

  return (
    <header className="bg-unifafibe_blue text-white shadow-md">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <button
              onClick={onMenuButtonClick}
              className="text-gray-300 hover:text-white focus:outline-none focus:text-white md:hidden mr-3"
              aria-label="Abrir menu lateral"
            >
              <svg className="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <Link to={ROUTES.DASHBOARD} className="text-2xl font-bold">
              {APP_NAME}
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            {isAuthenticated && user ? (
              <>
                {user.role === UserRole.CLIENTE && (
                  <Link to={ROUTES.CART} className="hover:text-unifafibe_orange transition-colors">
                    <ShoppingCartIcon size={24} />
                  </Link>
                )}
                <span className="hidden sm:inline">Olá, {user.nome.split(' ')[0]}</span>
                <Link to={ROUTES.PROFILE} className="hover:text-unifafibe_orange transition-colors">
                  <UserIcon size={24} />
                </Link>
                <button onClick={handleLogout} className="hover:text-unifafibe_orange transition-colors" title="Sair">
                  <LogoutIcon size={24} />
                </button>
              </>
            ) : (
              <>
                <Link to={ROUTES.LOGIN} className="hover:text-unifafibe_orange transition-colors">
                  Entrar
                </Link>
                <Link to={ROUTES.REGISTER} className="bg-unifafibe_orange hover:bg-orange-600 px-3 py-1.5 rounded-md text-sm font-medium transition-colors">
                  Registrar
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;