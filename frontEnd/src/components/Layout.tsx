/* eslint-disable @typescript-eslint/no-unused-vars */
// Salvar como: frontEnd/src/components/Layout.tsx

import axios from 'axios';
import React, { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import Header from './Header';

interface UsuarioData {
  id_cliente?: number;
  id_usuario?: number;
  nome?: string;
  email: string;
  tipo: 'cliente' | 'funcionario';
  tipo_perfil?: 'admin' | 'analista';
}

interface LayoutProps {
  children: ReactNode;
  showHeader?: boolean;
  backgroundColor?: string;
  showLoading?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  showHeader = true, 
  backgroundColor = "bg-gray-50",
  showLoading = true 
}) => {
  const [usuario, setUsuario] = useState<UsuarioData | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // Verificar se há usuário logado (opcional)
  const checkUser = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const response = await axios.get('http://localhost:3000/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.status === 200) {
          setUsuario(response.data);
        }
      }
    } catch (err) {
      // Usuário não logado ou token inválido - não é problema
      localStorage.removeItem('token');
      localStorage.removeItem('usuario');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkUser();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    setUsuario(null);
    delete axios.defaults.headers.common['Authorization'];
  };

  if (loading && showLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${backgroundColor}`}>
      {/* Header - Opcional */}
      {showHeader && (
        <Header 
          usuario={usuario}
          onLogout={handleLogout}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
        />
      )}
      
      {/* Conteúdo da página */}
      {children}
    </div>
  );
};

export default Layout;