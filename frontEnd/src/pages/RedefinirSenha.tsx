import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';
import { Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';

const RedefinirSenha: React.FC = () => {
    const [searchParams] = useSearchParams();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const navigate = useNavigate();
    
    const [formData, setFormData] = useState({
        novaSenha: '',
        confirmarSenha: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [validatingToken, setValidatingToken] = useState(true);
    
    const token = searchParams.get('token');
    const email = searchParams.get('email');

    useEffect(() => {
        validateToken();
    }, []);

    const validateToken = async () => {
        if (!token || !email) {
            setError('Link inválido');
            setValidatingToken(false);
            return;
        }

        try {
            await axios.post('http://localhost:3000/auth/validar-token', {
                token,
                email
            });
            setValidatingToken(false);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
            setError('Link inválido ou expirado');
            setValidatingToken(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError('');
    };

    const validateForm = () => {
        if (formData.novaSenha.length < 6) {
            setError('A senha deve ter pelo menos 6 caracteres');
            return false;
        }
        if (formData.novaSenha !== formData.confirmarSenha) {
            setError('As senhas não coincidem');
            return false;
        }
        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!validateForm()) return;
        
        setLoading(true);
        setError('');

        try {
            await axios.post('http://localhost:3000/auth/redefinir-senha', {
                token,
                email,
                novaSenha: formData.novaSenha
            });
            setSuccess(true);
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                setError(error.response.data.message || 'Erro ao redefinir senha');
            } else {
                setError('Erro ao processar solicitação');
            }
        } finally {
            setLoading(false);
        }
    };

    if (validatingToken) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Validando link...</p>
                </div>
            </div>
        );
    }

    if (error && !formData.novaSenha && !formData.confirmarSenha) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
                <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md text-center">
                    <div className="mb-6">
                        <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                            <span className="text-3xl">⚠️</span>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">Link Inválido</h2>
                        <p className="text-gray-600">{error}</p>
                    </div>
                    <Link
                        to="/esqueceu-senha"
                        className="text-blue-600 hover:text-blue-700"
                    >
                        Solicitar novo link
                    </Link>
                </div>
            </div>
        );
    }

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
                <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md text-center">
                    <div className="mb-6">
                        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                            <CheckCircle className="h-8 w-8 text-green-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">Senha Alterada!</h2>
                        <p className="text-gray-600">
                            Sua senha foi redefinida com sucesso.
                        </p>
                    </div>
                    <Link
                        to="/login"
                        className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-md"
                    >
                        Fazer Login
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
            <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
                <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">Nova Senha</h2>
                    <p className="text-gray-600 text-sm mt-2">
                        Digite sua nova senha
                    </p>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label htmlFor="novaSenha" className="block text-sm font-medium text-gray-700 mb-1">
                            Nova Senha
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Lock className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                id="novaSenha"
                                name="novaSenha"
                                value={formData.novaSenha}
                                onChange={handleChange}
                                placeholder="Mínimo 6 caracteres"
                                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                            >
                                {showPassword ? (
                                    <EyeOff className="h-5 w-5 text-gray-400" />
                                ) : (
                                    <Eye className="h-5 w-5 text-gray-400" />
                                )}
                            </button>
                        </div>
                    </div>

                    <div className="mb-6">
                        <label htmlFor="confirmarSenha" className="block text-sm font-medium text-gray-700 mb-1">
                            Confirmar Nova Senha
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Lock className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                id="confirmarSenha"
                                name="confirmarSenha"
                                value={formData.confirmarSenha}
                                onChange={handleChange}
                                placeholder="Repita a senha"
                                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-150 ease-in-out ${
                            loading ? 'opacity-70 cursor-not-allowed' : ''
                        }`}
                    >
                        {loading ? 'Alterando...' : 'Alterar Senha'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default RedefinirSenha;