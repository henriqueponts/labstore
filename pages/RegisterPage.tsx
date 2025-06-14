
import React, { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { APP_NAME, ROUTES } from '../constants';
import { UserRole } from '../types'; // UserRegistrationData não é usado diretamente aqui, mas AuthContext espera para o registro

const RegisterPage: React.FC = () => {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [cpf, setCpf] = useState(''); // Simplificado, poderia ser CPF/CNPJ
  const [aceiteLGPD, setAceiteLGPD] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const { register, isLoading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }
    if (!aceiteLGPD) {
      setError('Você deve aceitar o termo LGPD para continuar.');
      return;
    }

    try {
      // O objeto passado aqui deve corresponder a UserRegistrationData
      const newUser = await register({
        nome,
        email,
        senha: password, // Este campo 'senha' agora é esperado por UserRegistrationData
        role: UserRole.CLIENTE, // O registro padrão é para clientes
        cpf_cnpj: cpf,
        // endereco e telefone não são coletados aqui, então não são passados
      });
      
      if (newUser) {
        setSuccess('Cadastro realizado com sucesso! Você será redirecionado para o login em instantes.');
        setTimeout(() => {
          navigate(ROUTES.LOGIN);
        }, 3000);
      } else {
        setError('Falha ao registrar. O e-mail ou CPF/CNPJ já pode estar em uso.');
      }
    } catch (err) {
      setError('Ocorreu um erro durante o registro. Tente novamente.');
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-unifafibe_gray-light flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
         <img
          className="mx-auto h-16 w-auto"
          src="https://picsum.photos/seed/unifafibe/100/100" // Logo de placeholder
          alt="Logo UNIFAFIBE"
        />
        <h2 className="mt-6 text-center text-3xl font-extrabold text-unifafibe_blue">
          Crie sua conta
        </h2>
         <p className="mt-2 text-center text-sm text-unifafibe_gray">
          Já possui uma conta?{' '}
          <Link to={ROUTES.LOGIN} className="font-medium text-unifafibe_orange hover:text-orange-500">
            Faça login
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Nome Completo"
              type="text"
              name="nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
            />
            <Input
              label="E-mail"
              type="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              label="CPF" // Simplificado
              type="text"
              name="cpf"
              value={cpf}
              onChange={(e) => setCpf(e.target.value)}
              required
            />
            <Input
              label="Senha"
              type="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <Input
              label="Confirmar Senha"
              type="password"
              name="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />

            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="aceiteLGPD"
                  name="aceiteLGPD"
                  type="checkbox"
                  checked={aceiteLGPD}
                  onChange={(e) => setAceiteLGPD(e.target.checked)}
                  className="focus:ring-unifafibe_orange h-4 w-4 text-unifafibe_orange border-gray-300 rounded"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="aceiteLGPD" className="font-medium text-unifafibe_gray-dark">
                  Aceito o termo LGPD
                </label>
                <p className="text-unifafibe_gray text-xs">Li e concordo com os termos de uso e política de privacidade.</p>
              </div>
            </div>

            {error && <p className="text-sm text-red-600 text-center">{error}</p>}
            {success && <p className="text-sm text-green-600 text-center">{success}</p>}

            <Button type="submit" className="w-full" isLoading={isLoading} size="lg">
              Registrar
            </Button>
          </form>
        </Card>
      </div>
      <p className="mt-8 text-center text-xs text-unifafibe_gray">
        {APP_NAME} &copy; {new Date().getFullYear()}
      </p>
    </div>
  );
};

export default RegisterPage;