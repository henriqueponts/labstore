import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from '../components/Layout';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  UserCheck, 
  UserX, 
  Edit3, 
  Shield, 
  ShieldCheck, 
  Calendar,
  Mail,
  Phone,
  User
} from 'lucide-react';

interface Usuario {
  id_usuario: number;
  nome: string;
  email: string;
  tipo_perfil: 'admin' | 'analista';
  data_cadastro: string;
  status: 'ativo' | 'inativo';
}

interface Cliente {
  id_cliente: number;
  nome: string;
  email: string;
  telefone: string;
  data_cadastro: string;
  status: 'ativo' | 'inativo';
}

const GestaoUsuarios: React.FC = () => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'usuarios' | 'clientes'>('usuarios');
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [newProfile, setNewProfile] = useState<'admin' | 'analista'>('analista');
  const navigate = useNavigate();

  // Carregar dados
  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/');
        return;
      }

      const headers = { Authorization: `Bearer ${token}` };
      
      const [usuariosRes, clientesRes] = await Promise.all([
        axios.get('http://localhost:3000/gestao/usuarios', { headers }),
        axios.get('http://localhost:3000/gestao/clientes', { headers })
      ]);

      setUsuarios(usuariosRes.data);
      setClientes(clientesRes.data);
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
      if (axios.isAxiosError(err) && err.response?.status === 403) {
        setError('Acesso negado. Apenas funcionários podem acessar esta página.');
      } else {
        setError('Erro ao carregar dados. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Alterar perfil de usuário
  const alterarPerfil = async (userId: number, novoPerfil: 'admin' | 'analista') => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `http://localhost:3000/gestao/usuarios/${userId}/perfil`,
        { tipo_perfil: novoPerfil },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Atualizar lista local
      setUsuarios(usuarios.map(user => 
        user.id_usuario === userId 
          ? { ...user, tipo_perfil: novoPerfil }
          : user
      ));

      setEditingUserId(null);
      alert('Perfil alterado com sucesso!');
    } catch (err) {
      console.error('Erro ao alterar perfil:', err);
      if (axios.isAxiosError(err) && err.response) {
        alert(err.response.data.message || 'Erro ao alterar perfil');
      } else {
        alert('Erro ao alterar perfil');
      }
    }
  };

  // Inativar/Reativar usuário
  const toggleUsuarioStatus = async (userId: number, isActive: boolean) => {
    try {
      const token = localStorage.getItem('token');
      const action = isActive ? 'inativar' : 'reativar';
      
      await axios.put(
        `http://localhost:3000/gestao/usuarios/${userId}/${action}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Atualizar lista local
      setUsuarios(usuarios.map(user => 
        user.id_usuario === userId 
          ? { ...user, status: isActive ? 'inativo' : 'ativo' }
          : user
      ));

      alert(`Usuário ${isActive ? 'inativado' : 'reativado'} com sucesso!`);
    } catch (err) {
      console.error('Erro ao alterar status:', err);
      if (axios.isAxiosError(err) && err.response) {
        alert(err.response.data.message || 'Erro ao alterar status');
      } else {
        alert('Erro ao alterar status');
      }
    }
  };

  // Inativar/Reativar cliente
  const toggleClienteStatus = async (clienteId: number, isActive: boolean) => {
    try {
      const token = localStorage.getItem('token');
      const action = isActive ? 'inativar' : 'reativar';
      
      await axios.put(
        `http://localhost:3000/gestao/clientes/${clienteId}/${action}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Atualizar lista local
      setClientes(clientes.map(cliente => 
        cliente.id_cliente === clienteId 
          ? { ...cliente, status: isActive ? 'inativo' : 'ativo' }
          : cliente
      ));

      alert(`Cliente ${isActive ? 'inativado' : 'reativado'} com sucesso!`);
    } catch (err) {
      console.error('Erro ao alterar status:', err);
      if (axios.isAxiosError(err) && err.response) {
        alert(err.response.data.message || 'Erro ao alterar status');
      } else {
        alert('Erro ao alterar status');
      }
    }
  };

  // Formatar data
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <Layout showLoading={true}>
        <div></div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Gestão de Usuários e Clientes
          </h1>
          <p className="text-gray-600">
            Gerencie funcionários e clientes do sistema
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('usuarios')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'usuarios'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center">
                  <Users size={20} className="mr-2" />
                  Funcionários ({usuarios.length})
                </div>
              </button>
              <button
                onClick={() => setActiveTab('clientes')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'clientes'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center">
                  <User size={20} className="mr-2" />
                  Clientes ({clientes.length})
                </div>
              </button>
            </nav>
          </div>
        </div>

        {/* Conteúdo das Tabs */}
        {activeTab === 'usuarios' ? (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-800">
                Lista de Funcionários
              </h2>
              <button
                onClick={() => navigate('/cadastro/funcionario')}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center"
              >
                <Users size={20} className="mr-2" />
                Adicionar Funcionário
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nome
                  </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Perfil
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data Cadastro
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {usuarios.map((usuario) => (
                    <tr key={usuario.id_usuario} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{usuario.nome}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Mail size={16} className="text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900">{usuario.email}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingUserId === usuario.id_usuario ? (
                          <div className="flex items-center space-x-2">
                            <select
                              value={newProfile}
                              onChange={(e) => setNewProfile(e.target.value as 'admin' | 'analista')}
                              className="text-sm border border-gray-300 rounded px-2 py-1"
                            >
                              <option value="admin">Admin</option>
                              <option value="analista">Técnico</option>
                            </select>
                            <button
                              onClick={() => alterarPerfil(usuario.id_usuario, newProfile)}
                              className="text-green-600 hover:text-green-800"
                              title="Salvar"
                            >
                              ✓
                            </button>
                            <button
                              onClick={() => setEditingUserId(null)}
                              className="text-red-600 hover:text-red-800"
                              title="Cancelar"
                            >
                              ✗
                            </button>
                          </div>
                        ) : (
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            usuario.tipo_perfil === 'admin'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {usuario.tipo_perfil === 'admin' ? (
                              <><Shield size={12} className="mr-1" /> Admin</>
                            ) : (
                              <><ShieldCheck size={12} className="mr-1" /> Técnico</>
                            )}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-500">
                          <Calendar size={16} className="mr-2" />
                          {formatDate(usuario.data_cadastro)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          usuario.status === 'ativo'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {usuario.status === 'ativo' ? (
                            <><UserCheck size={12} className="mr-1" /> Ativo</>
                          ) : (
                            <><UserX size={12} className="mr-1" /> Inativo</>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              setEditingUserId(usuario.id_usuario);
                              setNewProfile(usuario.tipo_perfil);
                            }}
                            className="text-blue-600 hover:text-blue-800"
                            title="Alterar Perfil"
                          >
                            <Edit3 size={16} />
                          </button>
                          <button
                            onClick={() => toggleUsuarioStatus(usuario.id_usuario, usuario.status === 'ativo')}
                            className={`${
                              usuario.status === 'ativo'
                                ? 'text-red-600 hover:text-red-800'
                                : 'text-green-600 hover:text-green-800'
                            }`}
                            title={usuario.status === 'ativo' ? 'Inativar' : 'Reativar'}
                          >
                            {usuario.status === 'ativo' ? <UserX size={16} /> : <UserCheck size={16} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">
                Lista de Clientes
              </h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nome
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Telefone
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data Cadastro
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {clientes.map((cliente) => (
                    <tr key={cliente.id_cliente} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <User size={16} className="text-gray-400 mr-2" />
                          <span className="text-sm font-medium text-gray-900">{cliente.nome}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Mail size={16} className="text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900">{cliente.email}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Phone size={16} className="text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900">{cliente.telefone || 'Não informado'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-500">
                          <Calendar size={16} className="mr-2" />
                          {formatDate(cliente.data_cadastro)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          cliente.status === 'ativo'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {cliente.status === 'ativo' ? (
                            <><UserCheck size={12} className="mr-1" /> Ativo</>
                          ) : (
                            <><UserX size={12} className="mr-1" /> Inativo</>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => toggleClienteStatus(cliente.id_cliente, cliente.status === 'ativo')}
                          className={`${
                            cliente.status === 'ativo'
                              ? 'text-red-600 hover:text-red-800'
                              : 'text-green-600 hover:text-green-800'
                          }`}
                          title={cliente.status === 'ativo' ? 'Inativar' : 'Reativar'}
                        >
                          {cliente.status === 'ativo' ? <UserX size={16} /> : <UserCheck size={16} />}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Estatísticas */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Funcionários</p>
                <p className="text-2xl font-semibold text-gray-900">{usuarios.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Administradores</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {usuarios.filter(u => u.tipo_perfil === 'admin').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <User className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Clientes</p>
                <p className="text-2xl font-semibold text-gray-900">{clientes.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <UserCheck className="h-8 w-8 text-emerald-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Clientes Ativos</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {clientes.filter(c => c.status === 'ativo').length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default GestaoUsuarios;