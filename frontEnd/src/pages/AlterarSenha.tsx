// frontEnd/src/pages/AlterarSenha.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Lock, Eye, EyeOff, Save, X } from 'lucide-react';
import Layout from '../components/Layout';

const AlterarSenha: React.FC = () => {
    const [formData, setFormData] = useState({
        senhaAtual: '',
        novaSenha: '',
        confirmarSenha: ''
    });
    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const navigate = useNavigate();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError('');
        setSuccess('');
    };

    const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
        setShowPasswords({ ...showPasswords, [field]: !showPasswords[field] });
    };

    const validateForm = () => {
        if (!formData.senhaAtual || !formData.novaSenha || !formData.confirmarSenha) {
            setError('Por favor, preencha todos os campos');
            return false;
        }

        if (formData.novaSenha.length < 6) {
            setError('A nova senha deve ter pelo menos 6 caracteres');
            return false;
        }

        if (formData.novaSenha !== formData.confirmarSenha) {
            setError('As senhas não coincidem');
            return false;
        }

        if (formData.senhaAtual === formData.novaSenha) {
            setError('A nova senha deve ser diferente da senha atual');
            return false;
        }

        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!validateForm()) return;
        
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const token = localStorage.getItem('token');
            
            await axios.post(
                'http://localhost:3000/auth/alterar-senha',
                {
                    senhaAtual: formData.senhaAtual,
                    novaSenha: formData.novaSenha
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );
            
            setSuccess('Senha alterada com sucesso!');
            setFormData({
                senhaAtual: '',
                novaSenha: '',
                confirmarSenha: ''
            });
            
            // Redirecionar após 2 segundos
            setTimeout(() => {
                navigate('/');
            }, 2000);
            
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                setError(error.response.data.message || 'Erro ao alterar senha');
            } else {
                setError('Erro ao processar solicitação');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout>
            <div className="max-w-2xl mx-auto mt-10">
                <div className="bg-white p-8 rounded-lg shadow-md">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-gray-800">Alterar Senha</h2>
                        <button
                            onClick={() => navigate(-1)}
                            className="text-gray-600 hover:text-gray-800"
                        >
                            <X className="h-6 w-6" />
                        </button>
                    </div>

                    {error && (
                        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
                            {success}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        {/* Senha Atual */}
                        <div className="mb-4">
                            <label htmlFor="senhaAtual" className="block text-sm font-medium text-gray-700 mb-1">
                                Senha Atual
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type={showPasswords.current ? 'text' : 'password'}
                                    id="senhaAtual"
                                    name="senhaAtual"
                                    value={formData.senhaAtual}
                                    onChange={handleChange}
                                    placeholder="Digite sua senha atual"
                                    className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => togglePasswordVisibility('current')}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                >
                                    {showPasswords.current ? (
                                        <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                                    ) : (
                                        <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Nova Senha */}
                        <div className="mb-4">
                            <label htmlFor="novaSenha" className="block text-sm font-medium text-gray-700 mb-1">
                                Nova Senha
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type={showPasswords.new ? 'text' : 'password'}
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
                                    onClick={() => togglePasswordVisibility('new')}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                >
                                    {showPasswords.new ? (
                                        <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                                    ) : (
                                        <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Confirmar Nova Senha */}
                        <div className="mb-6">
                            <label htmlFor="confirmarSenha" className="block text-sm font-medium text-gray-700 mb-1">
                                Confirmar Nova Senha
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type={showPasswords.confirm ? 'text' : 'password'}
                                    id="confirmarSenha"
                                    name="confirmarSenha"
                                    value={formData.confirmarSenha}
                                    onChange={handleChange}
                                    placeholder="Repita a nova senha"
                                    className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => togglePasswordVisibility('confirm')}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                >
                                    {showPasswords.confirm ? (
                                        <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                                    ) : (
                                        <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Dicas de Senha */}
                        <div className="mb-6 p-4 bg-gray-50 rounded-md">
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Dicas para uma senha forte:</h4>
                            <ul className="text-xs text-gray-600 space-y-1">
                                <li>• Use pelo menos 6 caracteres</li>
                                <li>• Combine letras maiúsculas e minúsculas</li>
                                <li>• Inclua números e símbolos</li>
                                <li>• Evite informações pessoais óbvias</li>
                            </ul>
                        </div>

                        {/* Botões */}
                        <div className="flex gap-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className={`flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-150 ease-in-out flex items-center justify-center ${
                                    loading ? 'opacity-70 cursor-not-allowed' : ''
                                }`}
                            >
                                <Save className="h-5 w-5 mr-2" />
                                {loading ? 'Salvando...' : 'Salvar Nova Senha'}
                            </button>
                            
                            <button
                                type="button"
                                onClick={() => navigate(-1)}
                                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 transition duration-150 ease-in-out"
                            >
                                Cancelar
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </Layout>
    );
};

export default AlterarSenha;