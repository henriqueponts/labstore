import axios from 'axios';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const CadastroCliente: React.FC = () => {
    const [values, setValues] = useState({
        nome: '',
        email: '',
        senha: '',
        confirmarSenha: '',
        cpf_cnpj: '',
        endereco: '',
        telefone: ''
    });

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChanges = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
        setValues({...values, [e.target.name]: e.target.value});
        if (error) setError('');
    }

    const validateForm = (): boolean => {
        if (!values.nome || !values.email || !values.senha || !values.cpf_cnpj) {
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
        
        try {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { confirmarSenha, ...submitData } = values;
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const response = await axios.post('http://localhost:3000/auth/registro/cliente', submitData);
            
            alert('Cliente cadastrado com sucesso! Você pode fazer login agora.');
            navigate('/login');
            
        } catch (error) {
            console.error('Erro ao cadastrar cliente:', error);
            
            if (axios.isAxiosError(error) && error.response) {
                setError(error.response.data.message || 'Erro ao cadastrar cliente. Tente novamente.');
            } else {
                setError('Erro ao cadastrar cliente. Tente novamente.');
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
                        Cadastro de Cliente
                    </h2>
                    <p className="text-gray-600 text-sm mt-2">
                        Crie sua conta para acessar nossos serviços
                    </p>
                </div>
                
                {/* Mensagem de erro */}
                {error && (
                    <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                        {error}
                    </div>
                )}
                
                <form onSubmit={handleSubmit}>
                    {/* Nome */}
                    <div className="mb-4">
                        <label htmlFor="nome" className="block text-sm font-medium text-gray-700 mb-1">
                            Nome Completo *
                        </label>
                        <input
                            type="text"
                            id="nome"
                            name="nome"
                            value={values.nome}
                            onChange={handleChanges}
                            placeholder="Seu nome completo"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                        />
                    </div>

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
                            placeholder="seu@email.com"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                        />
                    </div>

                    {/* CPF/CNPJ */}
                    <div className="mb-4">
                        <label htmlFor="cpf_cnpj" className="block text-sm font-medium text-gray-700 mb-1">
                            CPF/CNPJ *
                        </label>
                        <input
                            type="text"
                            id="cpf_cnpj"
                            name="cpf_cnpj"
                            value={values.cpf_cnpj}
                            onChange={handleChanges}
                            placeholder="000.000.000-00 ou 00.000.000/0000-00"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                        />
                    </div>

                    {/* Telefone */}
                    <div className="mb-4">
                        <label htmlFor="telefone" className="block text-sm font-medium text-gray-700 mb-1">
                            Telefone
                        </label>
                        <input
                            type="text"
                            id="telefone"
                            name="telefone"
                            value={values.telefone}
                            onChange={handleChanges}
                            placeholder="(11) 99999-9999"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    {/* Endereço */}
                    <div className="mb-4">
                        <label htmlFor="endereco" className="block text-sm font-medium text-gray-700 mb-1">
                            Endereço
                        </label>
                        <textarea
                            id="endereco"
                            name="endereco"
                            value={values.endereco}
                            onChange={handleChanges}
                            placeholder="Rua, número, bairro, cidade, estado"
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        />
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
                            className="w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                            className="w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                        />
                    </div>

                    {/* Submit Button */}
                    <div className="mb-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition duration-150 ease-in-out ${
                                loading ? 'opacity-70 cursor-not-allowed' : ''
                            }`}
                        >
                            {loading ? 'Cadastrando...' : 'Cadastrar'}
                        </button>
                    </div>

                    {/* Link para login */}
                    <div className="text-center">
                        <span className="text-sm text-gray-600">
                            Já tem uma conta?{' '}
                            <button
                                type="button"
                                onClick={() => navigate('/login')}
                                className="text-blue-600 hover:text-blue-800 underline"
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

export default CadastroCliente;