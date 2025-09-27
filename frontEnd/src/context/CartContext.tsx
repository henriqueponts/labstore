// Arquivo: frontEnd/src/context/CartContext.tsx

import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import axios from 'axios';

// Interface para os itens do carrinho, baseada na sua VIEW CarrinhoDetalhado
interface ItemCarrinho {
    id_cliente: number;
    id_produto: number;
    nome_produto: string;
    preco_atual: number;
    quantidade: number;
    subtotal: number;
    estoque: number;
    imagem_principal: string | null;
}

// Interface para o valor do contexto
interface CartContextData {
    itensCarrinho: ItemCarrinho[];
    carregando: boolean;
    adicionarAoCarrinho: (id_produto: number, quantidade: number) => Promise<void>;
    atualizarQuantidade: (id_produto: number, nova_quantidade: number) => Promise<void>;
    removerDoCarrinho: (id_produto: number) => Promise<void>;
    limparCarrinho: () => Promise<void>;
    handleLogoutAndClearCart: () => void; // <-- ADICIONADO
    totalItens: number;
    totalPreco: number;
    buscarCarrinho: () => void; // <-- ADICIONADO para ser chamado no login
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [itensCarrinho, setItensCarrinho] = useState<ItemCarrinho[]>([]);
    const [carregando, setCarregando] = useState(true);

    const getToken = () => localStorage.getItem('token');

    const buscarCarrinho = useCallback(async () => {
        const token = getToken();
        const usuarioJSON = localStorage.getItem('usuario');


        if (!token || !usuarioJSON) {
            setItensCarrinho([]);
            setCarregando(false);
            return;
        }

        try {
            const usuario = JSON.parse(usuarioJSON);

            // Se o usuário logado NÃO é um cliente, ele não tem carrinho.
            // Apenas limpamos o estado e paramos a execução para evitar a chamada à API.
            if (usuario.tipo !== 'cliente') {
                setItensCarrinho([]);
                setCarregando(false);
                return; // Ponto crucial: Impede a chamada da API para admins/analistas
            }

            setCarregando(true);
            const response = await axios.get('http://localhost:3000/carrinho', {
                headers: { Authorization: `Bearer ${token}` },
            });
            setItensCarrinho(response.data);
        } catch (error) {
            console.error("Erro ao buscar carrinho:", error);
            if (axios.isAxiosError(error) && (error.response?.status === 401 || error.response?.status === 403)) {
                setItensCarrinho([]);
            }
        } finally {
            setCarregando(false);
        }
    }, []);

    useEffect(() => {
        buscarCarrinho();
    }, [buscarCarrinho]);

    // NOVA FUNÇÃO DE LOGOUT CENTRALIZADA
    const handleLogoutAndClearCart = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
        delete axios.defaults.headers.common['Authorization'];
        setItensCarrinho([]); // A MÁGICA ACONTECE AQUI!
    };

    const adicionarAoCarrinho = async (id_produto: number, quantidade: number) => {
        const token = getToken();
        if (!token) {
            alert("Você precisa estar logado como cliente para adicionar itens ao carrinho.");
            return;
        }
        try {
            await axios.post('http://localhost:3000/carrinho/adicionar', 
                { id_produto, quantidade },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            await buscarCarrinho();
            alert("Produto adicionado ao carrinho!");
        } catch (error) {
            console.error("Erro ao adicionar ao carrinho:", error);
            if (axios.isAxiosError(error) && error.response) {
                alert(`Erro: ${error.response.data.message}`);
            } else {
                alert("Não foi possível adicionar o produto ao carrinho.");
            }
        }
    };

    const atualizarQuantidade = async (id_produto: number, nova_quantidade: number) => {
        // ... (código existente sem alteração)
        const token = getToken();
        if (!token) return;
        try {
            await axios.put('http://localhost:3000/carrinho/atualizar', 
                { id_produto, nova_quantidade },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            await buscarCarrinho();
        } catch (error) {
            console.error("Erro ao atualizar quantidade:", error);
            if (axios.isAxiosError(error) && error.response) {
                alert(`Erro: ${error.response.data.message}`);
            } else {
                alert("Não foi possível atualizar a quantidade.");
            }
        }
    };

    const removerDoCarrinho = async (id_produto: number) => {
        // ... (código existente sem alteração)
        const token = getToken();
        if (!token) return;
        try {
            await axios.delete(`http://localhost:3000/carrinho/remover/${id_produto}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            await buscarCarrinho();
        } catch (error) {
            console.error("Erro ao remover do carrinho:", error);
            alert("Não foi possível remover o produto do carrinho.");
        }
    };

    const limparCarrinho = async () => {
        // ... (código existente sem alteração)
        const token = getToken();
        if (!token) return;
        try {
            await axios.delete('http://localhost:3000/carrinho/limpar', {
                headers: { Authorization: `Bearer ${token}` },
            });
            await buscarCarrinho();
        } catch (error) {
            console.error("Erro ao limpar carrinho:", error);
            alert("Não foi possível limpar o carrinho.");
        }
    };

    const totalItens = itensCarrinho.reduce((total, item) => total + item.quantidade, 0);
    
    const totalPreco = itensCarrinho.reduce((total, item) => {
        const subtotalNumerico = Number(item.subtotal) || 0;
        return total + subtotalNumerico;
    }, 0);

    return (
        <CartContext.Provider value={{ 
            itensCarrinho, 
            carregando, 
            adicionarAoCarrinho, 
            atualizarQuantidade, 
            removerDoCarrinho, 
            limparCarrinho,
            handleLogoutAndClearCart, // <-- EXPOSTO NO CONTEXTO
            totalItens,
            totalPreco,
            buscarCarrinho, // <-- EXPOSTO NO CONTEXTO
        }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart deve ser usado dentro de um CartProvider');
    }
    return context;
};