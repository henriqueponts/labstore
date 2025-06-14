
import React, { useState, useEffect, FormEvent } from 'react';
import { useAuth } from '../hooks/useAuth';
import { User } from '../types';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { updateUserProfile } from '../services/mockApiService';

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
      const updatedUser = await updateUserProfile(user.id, formData);
      if (updatedUser) {
        setAuthUser(updatedUser); // Atualiza contexto
        setSuccess('Perfil atualizado com sucesso!');
      } else {
        setError('Falha ao atualizar o perfil.');
      }
    } catch (err) {
      setError('Ocorreu um erro. Tente novamente.');
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
              disabled // Geralmente o e-mail não é editável ou requer verificação especial
            />
             <Input
              label="CPF/CNPJ"
              name="cpf_cnpj"
              value={formData.cpf_cnpj || ''}
              onChange={handleChange}
              disabled // Geralmente o CPF/CNPJ não é editável
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

          {/* Seção de alteração de senha poderia ser adicionada aqui */}
          {/* 
          <h3 className="text-lg font-medium text-unifafibe_gray-dark pt-4 border-t border-unifafibe_gray-light">Alterar Senha</h3>
          <Input label="Senha Atual" name="currentPassword" type="password" />
          <Input label="Nova Senha" name="newPassword" type="password" />
          <Input label="Confirmar Nova Senha" name="confirmNewPassword" type="password" />
          */}

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