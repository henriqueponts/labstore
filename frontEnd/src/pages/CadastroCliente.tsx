import axios from 'axios';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface EnderecoData {
    logradouro: string;
    bairro: string;
    localidade: string;
    uf: string;
    erro?: boolean;
}

const CadastroCliente: React.FC = () => {
    const [values, setValues] = useState({
        nome: '',
        email: '',
        senha: '',
        confirmarSenha: '',
        cpf_cnpj: '',
        cep: '',
        logradouro: '',
        numero: '',
        complemento: '',
        bairro: '',
        cidade: '',
        estado: '',
        telefone: ''
    });

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [cpfCnpjError, setCpfCnpjError] = useState('');
    const [cepLoading, setCepLoading] = useState(false);
    const [cepError, setCepError] = useState('');
    const navigate = useNavigate();

    // Função para formatar o CPF enquanto o usuário digita
    const formatCPF = (value: string): string => {
        const cpfNumbers = value.replace(/\D/g, '').slice(0, 11);
        return cpfNumbers
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d{1,2})/, '$1-$2');
    };

    // Função para formatar o CNPJ enquanto o usuário digita
    const formatCNPJ = (value: string): string => {
        const cnpjNumbers = value.replace(/\D/g, '').slice(0, 14);
        return cnpjNumbers
            .replace(/(\d{2})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1/$2')
            .replace(/(\d{4})(\d{1,2})/, '$1-$2');
    };

    // Função para formatar o CEP
    const formatCEP = (value: string): string => {
        const cepNumbers = value.replace(/\D/g, '').slice(0, 8);
        return cepNumbers.replace(/(\d{5})(\d)/, '$1-$2');
    };

    // Função para validar o CPF completo
    const validateCPF = (cpf: string): boolean => {
        const cpfNumbers = cpf.replace(/\D/g, '');
        if (cpfNumbers.length !== 11 || /^(\d)\1+$/.test(cpfNumbers)) return false;
        let sum = 0;
        let remainder;
        for (let i = 1; i <= 9; i++) sum += parseInt(cpfNumbers.substring(i - 1, i)) * (11 - i);
        remainder = (sum * 10) % 11;
        if (remainder === 10 || remainder === 11) remainder = 0;
        if (remainder !== parseInt(cpfNumbers.substring(9, 10))) return false;
        sum = 0;
        for (let i = 1; i <= 10; i++) sum += parseInt(cpfNumbers.substring(i - 1, i)) * (12 - i);
        remainder = (sum * 10) % 11;
        if (remainder === 10 || remainder === 11) remainder = 0;
        if (remainder !== parseInt(cpfNumbers.substring(10, 11))) return false;
        return true;
    };

    // Função para validar o CNPJ completo
    const validateCNPJ = (cnpj: string): boolean => {
        const cnpjNumbers = cnpj.replace(/\D/g, '');
        if (cnpjNumbers.length !== 14 || /^(\d)\1+$/.test(cnpjNumbers)) return false;

        // Validação do primeiro dígito verificador
        let sum = 0;
        let weight = 2;
        for (let i = 11; i >= 0; i--) {
            sum += parseInt(cnpjNumbers.charAt(i)) * weight;
            weight++;
            if (weight === 10) weight = 2;
        }
        let remainder = sum % 11;
        const digit1 = remainder < 2 ? 0 : 11 - remainder;
        if (digit1 !== parseInt(cnpjNumbers.charAt(12))) return false;

        // Validação do segundo dígito verificador
        sum = 0;
        weight = 2;
        for (let i = 12; i >= 0; i--) {
            sum += parseInt(cnpjNumbers.charAt(i)) * weight;
            weight++;
            if (weight === 10) weight = 2;
        }
        remainder = sum % 11;
        const digit2 = remainder < 2 ? 0 : 11 - remainder;
        if (digit2 !== parseInt(cnpjNumbers.charAt(13))) return false;

        return true;
    };

    // Função para determinar se é CPF ou CNPJ e formatar adequadamente
    const formatCpfCnpj = (value: string): string => {
        const numbers = value.replace(/\D/g, '');
        if (numbers.length <= 11) {
            return formatCPF(value);
        } else {
            return formatCNPJ(value);
        }
    };

    // Função para validar CPF ou CNPJ
    const validateCpfCnpj = (value: string): { isValid: boolean; message: string } => {
        const numbers = value.replace(/\D/g, '');
        
        if (numbers.length === 0) {
            return { isValid: false, message: '' };
        }
        
        if (numbers.length === 11) {
            const isValid = validateCPF(value);
            return {
                isValid,
                message: isValid ? '' : 'CPF inválido'
            };
        } else if (numbers.length === 14) {
            const isValid = validateCNPJ(value);
            return {
                isValid,
                message: isValid ? '' : 'CNPJ inválido'
            };
        } else {
            return {
                isValid: false,
                message: 'CPF deve ter 11 dígitos ou CNPJ deve ter 14 dígitos'
            };
        }
    };

    // Função para buscar endereço pelo CEP
    const buscarEnderecoPorCEP = async (cep: string): Promise<void> => {
        const cepLimpo = cep.replace(/\D/g, '');
        
        if (cepLimpo.length !== 8) {
            setCepError('CEP deve ter 8 dígitos');
            return;
        }

        setCepLoading(true);
        setCepError('');

        try {
            const response = await axios.get<EnderecoData>(`https://viacep.com.br/ws/${cepLimpo}/json/`);
            
            if (response.data.erro) {
                setCepError('CEP não encontrado');
                return;
            }

            // Preencher os campos automaticamente
            setValues(prev => ({
                ...prev,
                logradouro: response.data.logradouro || '',
                bairro: response.data.bairro || '',
                cidade: response.data.localidade || '',
                estado: response.data.uf || ''
            }));

            setCepError('');
        } catch (error) {
            console.error('Erro ao buscar CEP:', error);
            setCepError('Erro ao buscar CEP. Tente novamente.');
        } finally {
            setCepLoading(false);
        }
    };

    const handleChanges = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
        const { name, value } = e.target;
        
        if (name === 'cpf_cnpj') {
            const formattedValue = formatCpfCnpj(value);
            setValues({...values, [name]: formattedValue});
            
            // Validar em tempo real
            const validation = validateCpfCnpj(formattedValue);
            setCpfCnpjError(validation.message);
        } else if (name === 'cep') {
            const formattedCep = formatCEP(value);
            setValues({...values, [name]: formattedCep});
            
            // Buscar endereço quando CEP estiver completo
            const cepLimpo = formattedCep.replace(/\D/g, '');
            if (cepLimpo.length === 8) {
                buscarEnderecoPorCEP(formattedCep);
            } else {
                setCepError('');
            }
        } else {
            setValues({...values, [name]: value});
        }
        
        if (error) setError('');
    }

    const validateForm = (): boolean => {
        if (!values.nome || !values.email || !values.senha || !values.cpf_cnpj || !values.cep || !values.numero) {
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

        // Validar CPF/CNPJ
        const cpfCnpjValidation = validateCpfCnpj(values.cpf_cnpj);
        if (!cpfCnpjValidation.isValid) {
            setError(cpfCnpjValidation.message || 'CPF/CNPJ inválido.');
            return false;
        }

        // Validar CEP
        const cepLimpo = values.cep.replace(/\D/g, '');
        if (cepLimpo.length !== 8) {
            setError('CEP deve ter 8 dígitos.');
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
            
            // Montar endereço completo para enviar ao backend
            const enderecoCompleto = `${submitData.logradouro}, ${submitData.numero}${submitData.complemento ? ', ' + submitData.complemento : ''}, ${submitData.bairro}, ${submitData.cidade} - ${submitData.estado}, CEP: ${submitData.cep}`;
            
            const dataToSubmit = {
                ...submitData,
                endereco: enderecoCompleto
            };

            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const response = await axios.post('http://localhost:3000/auth/registro/cliente', dataToSubmit);
            
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

    // Determinar o tipo de documento para o placeholder
    const getDocumentPlaceholder = (): string => {
        const numbers = values.cpf_cnpj.replace(/\D/g, '');
        if (numbers.length <= 11) {
            return "000.000.000-00";
        } else {
            return "00.000.000/0000-00";
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
            <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-2xl">
                <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">
                        Cadastre-se na LAB Store
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Nome */}
                        <div className="md:col-span-2">
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
                        <div className="md:col-span-2">
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
                        <div>
                            <label htmlFor="cpf_cnpj" className="block text-sm font-medium text-gray-700 mb-1">
                                CPF/CNPJ *
                            </label>
                            <input
                                type="text"
                                id="cpf_cnpj"
                                name="cpf_cnpj"
                                value={values.cpf_cnpj}
                                onChange={handleChanges}
                                placeholder={getDocumentPlaceholder()}
                                className={`w-full px-3 py-2 border rounded-md placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent ${
                                    cpfCnpjError 
                                        ? 'border-red-500 focus:ring-red-500' 
                                        : values.cpf_cnpj && !cpfCnpjError 
                                        ? 'border-green-500 focus:ring-green-500'
                                        : 'border-gray-300 focus:ring-blue-500'
                                }`}
                                required
                            />
                            {cpfCnpjError && (
                                <p className="mt-1 text-sm text-red-600">{cpfCnpjError}</p>
                            )}
                            {values.cpf_cnpj && !cpfCnpjError && (
                                <p className="mt-1 text-sm text-green-600">
                                    ✓ {values.cpf_cnpj.replace(/\D/g, '').length === 11 ? 'CPF' : 'CNPJ'} válido
                                </p>
                            )}
                        </div>

                        {/* Telefone */}
                        <div>
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

                        {/* CEP */}
                        <div>
                            <label htmlFor="cep" className="block text-sm font-medium text-gray-700 mb-1">
                                CEP *
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    id="cep"
                                    name="cep"
                                    value={values.cep}
                                    onChange={handleChanges}
                                    placeholder="00000-000"
                                    className={`w-full px-3 py-2 border rounded-md placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent ${
                                        cepError
                                            ? 'border-red-500 focus:ring-red-500'
                                            : values.logradouro
                                            ? 'border-green-500 focus:ring-green-500'
                                            : 'border-gray-300 focus:ring-blue-500'
                                    }`}
                                    required
                                />
                                {cepLoading && (
                                    <div className="absolute right-3 top-2">
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                                    </div>
                                )}
                            </div>
                            {cepError && (
                                <p className="mt-1 text-sm text-red-600">{cepError}</p>
                            )}
                            {values.logradouro && !cepError && (
                                <p className="mt-1 text-sm text-green-600">✓ Endereço encontrado</p>
                            )}
                        </div>

                        {/* Logradouro */}
                        <div>
                            <label htmlFor="logradouro" className="block text-sm font-medium text-gray-700 mb-1">
                                Logradouro
                            </label>
                            <input
                                type="text"
                                id="logradouro"
                                name="logradouro"
                                value={values.logradouro}
                                onChange={handleChanges}
                                placeholder="Rua, Avenida, etc."
                                className="w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                                readOnly
                            />
                        </div>

                        {/* Número */}
                        <div>
                            <label htmlFor="numero" className="block text-sm font-medium text-gray-700 mb-1">
                                Número *
                            </label>
                            <input
                                type="text"
                                id="numero"
                                name="numero"
                                value={values.numero}
                                onChange={handleChanges}
                                placeholder="123"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                required
                            />
                        </div>

                        {/* Complemento */}
                        <div>
                            <label htmlFor="complemento" className="block text-sm font-medium text-gray-700 mb-1">
                                Complemento
                            </label>
                            <input
                                type="text"
                                id="complemento"
                                name="complemento"
                                value={values.complemento}
                                onChange={handleChanges}
                                placeholder="Apt, Casa, etc."
                                className="w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        {/* Bairro */}
                        <div>
                            <label htmlFor="bairro" className="block text-sm font-medium text-gray-700 mb-1">
                                Bairro
                            </label>
                            <input
                                type="text"
                                id="bairro"
                                name="bairro"
                                value={values.bairro}
                                onChange={handleChanges}
                                placeholder="Centro"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                                readOnly
                            />
                        </div>

                        {/* Cidade */}
                        <div>
                            <label htmlFor="cidade" className="block text-sm font-medium text-gray-700 mb-1">
                                Cidade
                            </label>
                            <input
                                type="text"
                                id="cidade"
                                name="cidade"
                                value={values.cidade}
                                onChange={handleChanges}
                                placeholder="São Paulo"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                                readOnly
                            />
                        </div>

                        {/* Estado */}
                        <div>
                            <label htmlFor="estado" className="block text-sm font-medium text-gray-700 mb-1">
                                Estado
                            </label>
                            <input
                                type="text"
                                id="estado"
                                name="estado"
                                value={values.estado}
                                onChange={handleChanges}
                                placeholder="SP"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                                readOnly
                            />
                        </div>

                        {/* Senha */}
                        <div>
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
                        <div>
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
                    </div>

                    {/* Submit Button */}
                    <div className="mt-6">
                        <button
                            type="submit"
                            disabled={loading || !!cpfCnpjError || !!cepError}
                            className={`w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition duration-150 ease-in-out ${
                                loading || cpfCnpjError || cepError ? 'opacity-70 cursor-not-allowed' : ''
                            }`}
                        >
                            {loading ? 'Cadastrando...' : 'Cadastrar'}
                        </button>
                    </div>

                    {/* Link para login */}
                    <div className="text-center mt-4">
                        <span className="text-sm text-gray-600">
                            Já tem uma conta?{' '}
                            <a href="/login" className="text-blue-600 hover:text-blue-800 underline">
                                Faça login
                            </a>
                        </span>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CadastroCliente;