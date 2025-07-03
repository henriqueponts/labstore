import axios from 'axios';
import React, { useEffect, useState } from 'react';

// Interfaces para tipagem
interface Cargo {
  id: number;
  nome: string;
}

interface Equipamento {
  id: number;
  nome: string;
}

const Registro: React.FC = () => {
    const [values, setValues] = useState({
        nome: '',
        cpf: '',
        cargo: '',
        equipamento: '',
        senha: ''
    });

    const [cargos, setCargos] = useState<Cargo[]>([]);
    const [equipamentos, setEquipamentos] = useState<Equipamento[]>([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);

    // Buscar cargos e equipamentos ao carregar o componente
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Buscar cargos
                const cargoResponse = await axios.get('http://localhost:3000/auth/cargos');
                setCargos(cargoResponse.data);
                
                // Buscar equipamentos
                const equipamentoResponse = await axios.get('http://localhost:3000/auth/equipamentos');
                setEquipamentos(equipamentoResponse.data);
                
                setLoading(false);
            } catch (error) {
                console.error('Erro ao buscar dados:', error);
                setError('Não foi possível carregar os dados necessários.');
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleChanges = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>): void => {
        setValues({...values, [e.target.name]: e.target.value})
        if (error) setError('');
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
        e.preventDefault();
        try {
            const response = await axios.post('http://localhost:3000/auth/registro', values);
            console.log(response);
            alert('Usuário criado com sucesso!');
            // Limpar o formulário após envio bem-sucedido
            setValues({
                nome: '',
                cpf: '',
                cargo: '',
                equipamento: '',
                senha: ''
            });
        } catch (error) {
            console.error('Erro ao criar usuário:', error);
            
            // Verificar se o erro contém resposta do servidor
            if (axios.isAxiosError(error) && error.response) {
                // Exibir a mensagem de erro que veio do servidor
                setError(error.response.data.message || 'Erro ao criar usuário. Tente novamente.');
            } else {
                setError('Erro ao criar usuário. Tente novamente.');
            }
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-gray-600">Carregando dados...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
            <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
                <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
                    Criar Usuário
                </h2>
                
                {/* Mensagem de erro */}
                {error && (
                    <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                        {error}
                    </div>
                )}
                
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label htmlFor="nome" className="block text-sm font-medium text-gray-700 mb-1">
                            Nome
                        </label>
                        <input
                            type="text"
                            id="nome"
                            name="nome"
                            value={values.nome}
                            onChange={handleChanges}
                            placeholder="Digite seu nome completo"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                        />
                    </div>

                    {/* CPF Field */}
                    <div className="mb-4">
                        <label htmlFor="cpf" className="block text-sm font-medium text-gray-700 mb-1">
                            CPF
                        </label>
                        <input
                            type="text"
                            id="cpf"
                            name="cpf"
                            value={values.cpf}
                            onChange={handleChanges}
                            placeholder="000.000.000-00"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                        />
                    </div>

                    {/* Cargo Field - Agora dinâmico */}
                    <div className="mb-4">
                        <label htmlFor="cargo" className="block text-sm font-medium text-gray-700 mb-1">
                            Cargo
                        </label>
                        <select
                            id="cargo"
                            name="cargo"
                            value={values.cargo}
                            onChange={handleChanges}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                        >
                            <option value="" disabled>Selecione um cargo</option>
                            {cargos.map(cargo => (
                                <option key={cargo.id} value={cargo.id}>{cargo.nome}</option>
                            ))}
                        </select>
                    </div>

                    {/* Equipamento Field - Novo campo dinâmico */}
                    <div className="mb-4">
                        <label htmlFor="equipamento" className="block text-sm font-medium text-gray-700 mb-1">
                            Equipamento
                        </label>
                        <select
                            id="equipamento"
                            name="equipamento"
                            value={values.equipamento}
                            onChange={handleChanges}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                        >
                            <option value="" disabled>Selecione um equipamento</option>
                            {equipamentos.map(equipamento => (
                                <option key={equipamento.id} value={equipamento.id}>{equipamento.nome}</option>
                            ))}
                        </select>
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
                    <div>
                        <button
                            type="submit"
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition duration-150 ease-in-out"
                        >
                            Registrar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Registro;