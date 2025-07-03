import axios from 'axios';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const CadastroFuncionario: React.FC = () => {
    const [values, setValues] = useState({
        email: '',
        senha: '',
        confirmarSenha: '',
        tipo_perfil: ''
    });

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChanges = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>): void => {
        setValues({...values, [e.target.name]: e.target.value});
        if (error) setError('');
    }

    const validateForm = (): boolean => {
        if (!values.email || !values.senha || !values.tipo_perfil) {
            setError('Por favor, preencha todos os campos obrigatórios.');
            return false;
        }

        if (values.senha !== values.confirmarSenha) {
            setError('As senhas não coincidem.');
            return false;
        }

        // if (values.senha.length < 6) {
        //     setError('A senha deve ter pelo menos 6 caracteres.');
        //     return false;
        // }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(values.email)) {
            setError('Por favor, insira um email válido.');
            return false;
        }

        return true;
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }

        setLoading(true);
        
        try {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { confirmarSenha, ...submitData } = values;
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const response = await axios.post('http://localhost:3000/auth/registro/funcionario', submitData);
            
            alert('Funcionário cadastrado com sucesso! Você pode fazer login agora.');
            navigate('/login');
            
        } catch (error) {
            console.error('Erro ao cadastrar funcionário:', error);
            
            if (axios.isAxiosError(error) && error.response) {
                setError(error.response.data.message || 'Erro ao cadastrar funcionário. Tente novamente.');
            } else {
                setError('Erro ao cadastrar funcionário. Tente novamente.');
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
                        Cadastro de Funcionário
                    </h2>
                    <p className="text-gray-600 text-sm mt-2">
                        Cadastro restrito para funcionários da empresa
                    </p>
                </div>
                
                {/* Mensagem de erro */}
                {error && (
                    <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                        {error}
                    </div>
                )}
                
                <form onSubmit={handleSubmit}>
                    {/* Email */}
                    <div className="mb-4">
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                            Email Corporativo *
                        </label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={values.email}
                            onChange={handleChanges}
                            placeholder="funcionario@empresa.com"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            required
                        />
                    </div>

                    {/* Tipo de Perfil */}
                    <div className="mb-4">
                        <label htmlFor="tipo_perfil" className="block text-sm font-medium text-gray-700 mb-1">
                            Perfil de Acesso *
                        </label>
                        <select
                            id="tipo_perfil"
                            name="tipo_perfil"
                            value={values.tipo_perfil}
                            onChange={handleChanges}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            required
                        >
                            <option value="">Selecione o perfil</option>
                            <option value="admin">Administrador</option>
                            <option value="analista">Técnico/Analista</option>
                        </select>
                        <div className="mt-1 text-xs text-gray-500">
                            <strong>Admin:</strong> Acesso completo ao sistema<br/>
                            <strong>Técnico:</strong> Acesso limitado às funcionalidades técnicas
                        </div>
                    </div>

                    {/* Senha */}
                    <div className="mb-4">
                        <label htmlFor="senha" className="block text-sm font-medium text-gray-700 mb-1">
                            Senha *
                        </label>
                        <input
                            type="password"
                            id="senha"
                            name="senha"
                            value={values.senha}
                            onChange={handleChanges}
                            placeholder="Mínimo 6 caracteres"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            required
                        />
                    </div>

                    {/* Confirmar Senha */}
                    <div className="mb-6">
                        <label htmlFor="confirmarSenha" className="block text-sm font-medium text-gray-700 mb-1">
                            Confirmar Senha *
                        </label>
                        <input
                            type="password"
                            id="confirmarSenha"
                            name="confirmarSenha"
                            value={values.confirmarSenha}
                            onChange={handleChanges}
                            placeholder="Digite a senha novamente"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            required
                        />
                    </div>

                    {/* Submit Button */}
                    <div className="mb-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 transition duration-150 ease-in-out ${
                                loading ? 'opacity-70 cursor-not-allowed' : ''
                            }`}
                        >
                            {loading ? 'Cadastrando...' : 'Cadastrar Funcionário'}
                        </button>
                    </div>

                    {/* Link para login */}
                    <div className="text-center">
                        <span className="text-sm text-gray-600">
                            Já tem uma conta?{' '}
                            <button
                                type="button"
                                onClick={() => navigate('/login')}
                                className="text-green-600 hover:text-green-800 underline"
                            >
                                Faça login
                            </button>
                        </span>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CadastroFuncionario;