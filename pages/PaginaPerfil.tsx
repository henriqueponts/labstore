import React, { useState, useEffect, FormEvent } from 'react';
import { useAuth } from '../hooks/useAuth';
import { User } from '../types';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { atualizarPerfilUsuario } from '../services/apiService'; // Alterado para apiService

const ProfilePage: React.FC = () => {
  const { user, setUser: setAuthUser, isLoading: authLoading } = useAuth();
  const [formData, setFormData] = useState<Partial<User>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (user) {
      setFormData({
        nome: user.nome,
        email: user.email,
        cpf_cnpj: user.cpf_cnpj,
        endereco: user.endereco,
        telefone: user.telefone,
      });
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      // O ID do usuário é pego do contexto, mas a API pode inferir pelo token.
      // Passamos explicitamente para endpoints que esperam o ID.
      const updatedUser = await atualizarPerfilUsuario(user.id, formData);
      if (updatedUser) {
        setAuthUser(updatedUser); 
        setSuccess('Perfil atualizado com sucesso!');
      } else {
        setError('Falha ao atualizar o perfil.'); // Isso pode não ser atingido se apiService sempre lançar erro
      }
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro. Tente novamente.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading || !user) {
    return <LoadingSpinner fullscreen message="Carregando perfil..." />;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-unifafibe_gray-dark mb-6">Meu Perfil</h1>
      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Nome Completo"
              name="nome"
              value={formData.nome || ''}
              onChange={handleChange}
              required
            />
            <Input
              label="E-mail"
              name="email"
              type="email"
              value={formData.email || ''}
              onChange={handleChange}
              required
              disabled 
            />
             <Input
              label="CPF/CNPJ"
              name="cpf_cnpj"
              value={formData.cpf_cnpj || ''}
              onChange={handleChange}
              disabled 
            />
            <Input
              label="Telefone"
              name="telefone"
              type="tel"
              value={formData.telefone || ''}
              onChange={handleChange}
            />
          </div>
          <Input
            label="Endereço Completo"
            name="endereco"
            value={formData.endereco || ''}
            onChange={handleChange}
          />

          {error && <p className="text-sm text-red-600">{error}</p>}
          {success && <p className="text-sm text-green-600">{success}</p>}

          <div className="pt-2">
            <Button type="submit" isLoading={isLoading} variant="primary">
              Salvar Alterações
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default ProfilePage;
