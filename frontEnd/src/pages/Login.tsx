import axios from 'axios';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Login: React.FC = () => {
    const [values, setValues] = useState({
        email: '',
        senha: ''
    });
    
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    
    const navigate = useNavigate();

    const handleChanges = (e: React.ChangeEvent<HTMLInputElement>): void => {
        setValues({...values, [e.target.name]: e.target.value});
        if (error) setError('');
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
        e.preventDefault();
        setLoading(true);
        
        try {
            // Login unificado - o backend detecta automaticamente o tipo de usuário
            const response = await axios.post('http://localhost:3000/auth/login', values);
            
            // Guardar token e dados do usuário
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('usuario', JSON.stringify(response.data.usuario));
            
            // Configurar axios para enviar o token em todas as requisições futuras
            axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
            
            // Redirecionar para a página inicial
            navigate('/');
            
        } catch (error) {
            console.error('Erro no login:', error);
            
            if (axios.isAxiosError(error) && error.response) {
                setError(error.response.data.message || 'Erro ao fazer login. Tente novamente.');
            } else {
                setError('Erro ao fazer login. Tente novamente.');
            }
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
            <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
                <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">
                        Entrar no Sistema
                    </h2>
                    <p className="text-gray-600 text-sm mt-2">
                        Acesso para clientes e funcionários
                    </p>
                </div>
                
                {/* Mensagem de erro */}
                {error && (
                    <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                        {error}
                    </div>
                )}
                
                <form onSubmit={handleSubmit}>
                    {/* Email Field */}
                    <div className="mb-4">
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                            Email
                        </label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={values.email}
                            onChange={handleChanges}
                            placeholder="seu@email.com"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                        />
                    </div>

                    {/* Password Field */}
                    <div className="mb-6">
                        <label htmlFor="senha" className="block text-sm font-medium text-gray-700 mb-1">
                            Senha
                        </label>
                        <input
                            type="password"
                            id="senha"
                            name="senha"
                            value={values.senha}
                            onChange={handleChanges}
                            placeholder="Digite sua senha"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                        />
                    </div>

                    {/* Submit Button */}
                    <div className="mb-6">
                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition duration-150 ease-in-out ${
                                loading ? 'opacity-70 cursor-not-allowed' : ''
                            }`}
                        >
                            {loading ? 'Entrando...' : 'Entrar'}
                        </button>
                    </div>

                    {/* Links para cadastro */}
                    <div className="border-t pt-4">
                        <div className="text-center mb-3">
                            <span className="text-sm text-gray-600">
                                Não tem uma conta?
                            </span>
                        </div>
                        <div className="grid grid-cols-1 gap-2">
                            <button
                                type="button"
                                onClick={() => navigate('/cadastro/cliente')}
                                className="w-full bg-blue-50 hover:bg-blue-100 text-blue-700 py-2 px-4 rounded-md border border-blue-200 text-sm font-medium transition-colors"
                            >
                                📄 Cadastro de Cliente
                            </button>
                            <button
                                type="button"
                                onClick={() => navigate('/cadastro/funcionario')}
                                className="w-full bg-green-50 hover:bg-green-100 text-green-700 py-2 px-4 rounded-md border border-green-200 text-sm font-medium transition-colors"
                            >
                                👤 Cadastro de Funcionário
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Login;