
import React, { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { APP_NAME, ROUTES } from '../constants';
import { UserIcon as EmailIcon, ShieldCheckIcon as PasswordIcon } from '../components/ui/Icon'; // Reutilizando ícones

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const user = await login(email, password);
      if (user) {
        navigate(ROUTES.DASHBOARD);
      } else {
        setError('E-mail ou senha inválidos. Verifique suas credenciais.');
      }
    } catch (err) {
      setError('Falha ao tentar fazer login. Tente novamente mais tarde.');
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
          Acesse sua conta
        </h2>
        <p className="mt-2 text-center text-sm text-unifafibe_gray">
          Ou{' '}
          <Link to={ROUTES.REGISTER} className="font-medium text-unifafibe_orange hover:text-orange-500">
            crie uma nova conta
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="E-mail"
              type="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              Icon={EmailIcon}
              placeholder="seuemail@exemplo.com"
            />
            <Input
              label="Senha"
              type="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              Icon={PasswordIcon}
              placeholder="Sua senha"
            />

            {error && <p className="text-sm text-red-600 text-center">{error}</p>}

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-unifafibe_orange focus:ring-unifafibe_orange border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-unifafibe_gray-dark">
                  Lembrar-me
                </label>
              </div>

              <div className="text-sm">
                <Link to="#" className="font-medium text-unifafibe_orange hover:text-orange-500"> {/* TODO: Página de esqueceu a senha */}
                  Esqueceu sua senha?
                </Link>
              </div>
            </div>

            <Button type="submit" className="w-full" isLoading={isLoading} size="lg">
              Entrar
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

export default LoginPage;