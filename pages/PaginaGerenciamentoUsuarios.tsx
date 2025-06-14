import React, { useEffect, useState } from 'react';
import { User, UserRole } from '../types';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { buscarUsuarios, atualizarStatusUsuario, criarUsuario } from '../services/apiService'; // Alterado para apiService
import Input from '../components/ui/Input';

const UserManagementPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newUser, setNewUser] = useState({ nome: '', email: '', role: UserRole.ANALISTA, senha: '' });
  const [isCreating, setIsCreating] = useState(false);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await buscarUsuarios();
      setUsers(data);
      setError(null);
    } catch (err: any) {
      console.error("Falha ao buscar usuários:", err);
      setError(err.message || "Não foi possível carregar os usuários.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleStatusChange = async (userId: string, newStatus: 'ativo' | 'inativo') => {
    try {
      await atualizarStatusUsuario(userId, newStatus);
      setUsers(prevUsers => 
        prevUsers.map(u => u.id === userId ? { ...u, status: newStatus } : u)
      );
    } catch (err: any) {
      console.error("Falha ao atualizar status do usuário:", err);
      setError(err.message || "Falha ao atualizar status do usuário.");
    }
  };
  
  const handleCreateUserChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setNewUser({...newUser, [e.target.name]: e.target.value });
  }

  const handleCreateUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
        await criarUsuario({
            nome: newUser.nome,
            email: newUser.email,
            role: newUser.role,
            senha: newUser.senha,
        });
        setShowCreateForm(false);
        setNewUser({ nome: '', email: '', role: UserRole.ANALISTA, senha: '' });
        await loadUsers(); 
    } catch (err: any) {
        console.error("Falha ao criar usuário:", err);
        setError(err.message || "Falha ao criar usuário. Verifique se o e-mail já existe.");
    } finally {
        setIsCreating(false);
    }
  }


  if (loading) {
    return <LoadingSpinner fullscreen message="Carregando usuários..." />;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-unifafibe_gray-dark">Gerenciamento de Usuários</h1>
        <Button onClick={() => setShowCreateForm(prev => !prev)} variant="primary">
            {showCreateForm ? 'Cancelar Novo Usuário' : 'Adicionar Novo Usuário'}
        </Button>
      </div>

      {error && <Card title="Erro"><p className="text-red-500">{error}</p></Card>}

      {showCreateForm && (
        <Card title="Criar Novo Usuário (Analista/Admin)" className="mb-6">
            <form onSubmit={handleCreateUserSubmit} className="space-y-4">
                <Input label="Nome Completo" name="nome" value={newUser.nome} onChange={handleCreateUserChange} required />
                <Input label="E-mail" name="email" type="email" value={newUser.email} onChange={handleCreateUserChange} required />
                <Input label="Senha Provisória" name="senha" type="password" value={newUser.senha} onChange={handleCreateUserChange} required />
                <div>
                    <label htmlFor="role" className="block text-sm font-medium text-unifafibe_gray-dark mb-1">Perfil</label>
                    <select id="role" name="role" value={newUser.role} onChange={handleCreateUserChange} className="w-full p-2 border rounded-md">
                        <option value={UserRole.ANALISTA}>Analista</option>
                        <option value={UserRole.ADMIN}>Administrador</option>
                    </select>
                </div>
                <Button type="submit" isLoading={isCreating}>Criar Usuário</Button>
            </form>
        </Card>
      )}

      <Card title="Lista de Usuários">
        {users.length === 0 ? (
          <p>Nenhum usuário encontrado.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-unifafibe_gray-light">
              <thead className="bg-unifafibe_gray-light">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-unifafibe_gray uppercase tracking-wider">Nome</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-unifafibe_gray uppercase tracking-wider">E-mail</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-unifafibe_gray uppercase tracking-wider">Perfil</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-unifafibe_gray uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-unifafibe_gray uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-unifafibe_gray-light">
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-unifafibe_gray-dark">{user.nome}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-unifafibe_gray">{user.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-unifafibe_gray">{user.role}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                       <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.status === 'ativo' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {user.status === 'ativo' ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {user.status === 'ativo' ? (
                        <Button onClick={() => handleStatusChange(user.id, 'inativo')} size="sm" variant="danger">Inativar</Button>
                      ) : (
                        <Button onClick={() => handleStatusChange(user.id, 'ativo')} size="sm" variant="secondary">Ativar</Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

export default UserManagementPage;
