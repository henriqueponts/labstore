import axios from 'axios';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { Mail, Lock, Briefcase, UserPlus, ArrowLeft } from 'lucide-react'; // Added UserPlus and ArrowLeft for consistency

const CadastroFuncionario: React.FC = () => {
    const [values, setValues] = useState({
        email: '',
        senha: '',
        confirmarSenha: '',
        tipo_perfil: '' as 'admin' | 'analista' | '' // Explicitly type tipo_perfil
    });

    const [error, setError] = useState('');
    const [success, setSuccess] = useState(''); // Added success state for consistent feedback
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChanges = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>): void => {
        setValues({...values, [e.target.name]: e.target.value});
        if (error) setError('');
        if (success) setSuccess(''); // Clear success message on change
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

        if (values.senha.length < 6) {
            setError('A senha deve ter pelo menos 6 caracteres.');
            return false;
        }

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
        setError('');
        setSuccess('');
        
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setError('Token de autenticação não encontrado. Faça login novamente.');
                setLoading(false);
                return;
            }

            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { confirmarSenha, ...submitData } = values;
            
            const response = await axios.post('http://localhost:3000/auth/registro/funcionario', submitData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            
            setSuccess(response.data.message || 'Funcionário cadastrado com sucesso!');
            setValues({ // Clear form after successful submission
                email: '',
                senha: '',
                confirmarSenha: '',
                tipo_perfil: ''
            });
            // Optionally navigate back after a short delay
            setTimeout(() => {
                navigate('/gestao/usuarios');
            }, 2000); 
            
        } catch (err) {
            console.error('Erro ao cadastrar funcionário:', err);
            if (axios.isAxiosError(err) && err.response) {
                setError(err.response.data.message || 'Erro ao cadastrar funcionário. Tente novamente.');
            } else {
                setError('Erro ao cadastrar funcionário. Tente novamente.');
            }
        } finally {
            setLoading(false);
        }
    }

    return (
        <Layout>
            <div className="max-w-4xl mx-auto px-4 py-8"> {/* Adjusted max-width for better fit */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">
                        <UserPlus className="inline-block mr-2 text-blue-600" size={32} /> {/* Icon for heading */}
                        Cadastro de Novo Funcionário
                    </h1>
                    <p className="text-gray-600">
                        Preencha os campos abaixo para adicionar um novo funcionário ao sistema.
                    </p>
                </div>

                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h2 className="text-lg font-semibold text-gray-800">
                            Dados do Funcionário
                        </h2>
                    </div>
                    
                    <form onSubmit={handleSubmit} className="p-6"> {/* Added padding to form */}
                        {/* Mensagem de erro */}
                        {error && (
                            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md"> {/* Consistent rounded-md */}
                                {error}
                            </div>
                        )}
                        {/* Mensagem de sucesso */}
                        {success && (
                            <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-md">
                                {success}
                            </div>
                        )}
                        
                        {/* Email */}
                        <div className="mb-4">
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                                Email *
                            </label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={values.email}
                                onChange={handleChanges}
                                placeholder="funcionario@empresa.com"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" // Adjusted focus ring color to blue
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
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" // Adjusted focus ring color to blue
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
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" // Adjusted focus ring color to blue
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
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" // Adjusted focus ring color to blue
                                required
                            />
                        </div>

                        {/* Submit Button */}
                        <div className="flex justify-end space-x-3 mt-6"> {/* Use flexbox for buttons, space them */}
                            <button
                                type="button" // Set type to button for "Voltar"
                                onClick={() => navigate('/gestao/usuarios')}
                                className="flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                            >
                                <ArrowLeft size={18} className="mr-2" />
                                Voltar
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className={`flex items-center bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-medium transition-colors ${
                                    loading ? 'opacity-70 cursor-not-allowed' : ''
                                }`}
                            >
                                {loading ? 'Cadastrando...' : (
                                    <>
                                        <UserPlus size={18} className="mr-2" />
                                        Cadastrar Funcionário
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </Layout>
    );
};

export default CadastroFuncionario;