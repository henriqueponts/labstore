import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface UsuarioData {
  id_cliente?: number;
  id_usuario?: number;
  nome?: string;
  email: string;
  tipo: 'cliente' | 'funcionario';
  tipo_perfil?: 'admin' | 'analista';
  cpf_cnpj?: string;
}

const Home: React.FC = () => {
  const [usuario, setUsuario] = useState<UsuarioData | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchUser = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await axios.get('http://localhost:3000/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 200) {
        setUsuario(response.data);
      }
    } catch (err) {
      console.error('Erro ao buscar dados do usuário:', err);
      // Limpar dados inválidos
      localStorage.removeItem('token');
      localStorage.removeItem('usuario');
      navigate('/login');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    delete axios.defaults.headers.common['Authorization'];
    navigate('/login');
  };

  useEffect(() => {
    fetchUser();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!usuario) {
    return null; // O useEffect irá redirecionar para login
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Sistema LabStore
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                Logado como: <span className="font-medium">{usuario.email}</span>
              </div>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Bem-vindo ao Sistema!
            </h2>
            
            {/* Informações do usuário */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email:</label>
                  <p className="text-sm text-gray-900">{usuario.email}</p>
                </div>
                
                {usuario.nome && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Nome:</label>
                    <p className="text-sm text-gray-900">{usuario.nome}</p>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Tipo de Usuário:</label>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    usuario.tipo === 'cliente' 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {usuario.tipo === 'cliente' ? 'Cliente' : 'Funcionário'}
                  </span>
                </div>
                
                {usuario.tipo_perfil && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Perfil de Acesso:</label>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      usuario.tipo_perfil === 'admin' 
                        ? 'bg-purple-100 text-purple-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {usuario.tipo_perfil === 'admin' ? 'Administrador' : 'Técnico/Analista'}
                    </span>
                  </div>
                )}
                
                {usuario.cpf_cnpj && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">CPF/CNPJ:</label>
                    <p className="text-sm text-gray-900">{usuario.cpf_cnpj}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Menu de funcionalidades baseado no tipo de usuário */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Funcionalidades Disponíveis
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {usuario.tipo === 'cliente' ? (
                <>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900">Catálogo de Produtos</h4>
                    <p className="text-sm text-blue-700 mt-1">Visualizar produtos e serviços disponíveis</p>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900">Meus Pedidos</h4>
                    <p className="text-sm text-blue-700 mt-1">Acompanhar status dos seus pedidos</p>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900">Suporte</h4>
                    <p className="text-sm text-blue-700 mt-1">Abrir chamados de suporte técnico</p>
                  </div>
                </>
              ) : (
                <>
                  {usuario.tipo_perfil === 'admin' && (
                    <>
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <h4 className="font-medium text-green-900">Gestão de Usuários</h4>
                        <p className="text-sm text-green-700 mt-1">Gerenciar clientes e funcionários</p>
                      </div>
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <h4 className="font-medium text-green-900">Gestão de Produtos</h4>
                        <p className="text-sm text-green-700 mt-1">Adicionar e editar produtos</p>
                      </div>
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <h4 className="font-medium text-green-900">Relatórios</h4>
                        <p className="text-sm text-green-700 mt-1">Visualizar relatórios do sistema</p>
                      </div>
                    </>
                  )}
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h4 className="font-medium text-yellow-900">Gerenciar Pedidos</h4>
                    <p className="text-sm text-yellow-700 mt-1">Processar e atualizar pedidos</p>
                  </div>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h4 className="font-medium text-yellow-900">Suporte Técnico</h4>
                    <p className="text-sm text-yellow-700 mt-1">Responder chamados de clientes</p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Home;