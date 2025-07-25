// Arquivo: frontEnd/src/pages/CarrinhoPage.tsx

import React from 'react';
import Layout from '../components/Layout';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingCart, AlertTriangle } from 'lucide-react';

const CarrinhoPage: React.FC = () => {
    const { 
        itensCarrinho, 
        carregando, 
        atualizarQuantidade, 
        removerDoCarrinho, 
        limparCarrinho,
        totalItens,
        totalPreco
    } = useCart();
    const navigate = useNavigate();

    const formatarPreco = (preco: number) => {
        return new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
        }).format(preco);
    };

    if (carregando) {
        return <Layout showLoading={true}><div></div></Layout>;
    }

    return (
        <Layout>
            <div className="max-w-7xl mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold text-gray-800 mb-6">Meu Carrinho</h1>

                {itensCarrinho.length === 0 ? (
                    <div className="text-center bg-white p-12 rounded-lg shadow">
                        <ShoppingCart className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                        <h2 className="text-2xl font-semibold text-gray-700 mb-2">Seu carrinho está vazio</h2>
                        <p className="text-gray-500 mb-6">Adicione produtos ao seu carrinho para vê-los aqui.</p>
                        <button
                            onClick={() => navigate('/produtos')}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                        >
                            Ver Produtos
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Lista de Itens */}
                        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow">
                            <div className="flex justify-between items-center mb-4 border-b pb-4">
                                <h2 className="text-xl font-semibold text-gray-800">
                                    {totalItens} {totalItens === 1 ? 'item' : 'itens'}
                                </h2>
                                <button
                                    onClick={() => {
                                        if (confirm("Tem certeza que deseja esvaziar o carrinho?")) {
                                            limparCarrinho();
                                        }
                                    }}
                                    className="text-sm text-red-600 hover:text-red-800 font-medium flex items-center"
                                >
                                    <Trash2 size={16} className="mr-1" />
                                    Esvaziar Carrinho
                                </button>
                            </div>

                            <div className="space-y-6">
                                {itensCarrinho.map(item => (
                                    <div key={item.id_produto} className="flex items-center gap-4 border-b pb-6 last:border-b-0">
                                        <img
                                            src={item.imagem_principal ? `http://localhost:3000/produtos${item.imagem_principal}` : '/placeholder.svg'}
                                            alt={item.nome_produto}
                                            className="w-24 h-24 object-cover rounded-lg"
                                        />
                                        <div className="flex-grow">
                                            <h3 className="font-semibold text-gray-800">{item.nome_produto}</h3>
                                            <p className="text-sm text-gray-600">{formatarPreco(item.preco_atual)}</p>
                                            {item.estoque < item.quantidade && (
                                                <p className="text-xs text-red-600 flex items-center mt-1">
                                                    <AlertTriangle size={12} className="mr-1" />
                                                    Quantidade excede o estoque!
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex items-center border border-gray-300 rounded-lg">
                                            <button
                                                onClick={() => atualizarQuantidade(item.id_produto, item.quantidade - 1)}
                                                disabled={item.quantidade <= 1}
                                                className="p-2 hover:bg-gray-100 disabled:opacity-50"
                                            >
                                                <Minus size={16} />
                                            </button>
                                            <span className="px-4 py-1 font-medium">{item.quantidade}</span>
                                            <button
                                                onClick={() => atualizarQuantidade(item.id_produto, item.quantidade + 1)}
                                                disabled={item.quantidade >= item.estoque}
                                                className="p-2 hover:bg-gray-100 disabled:opacity-50"
                                            >
                                                <Plus size={16} />
                                            </button>
                                        </div>
                                        <div className="text-right w-24">
                                            <p className="font-semibold text-gray-900">{formatarPreco(item.subtotal)}</p>
                                        </div>
                                        <button
                                            onClick={() => removerDoCarrinho(item.id_produto)}
                                            className="text-gray-400 hover:text-red-600"
                                        >
                                            <Trash2 size={20} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Resumo do Pedido */}
                        <div className="lg:col-span-1">
                            <div className="bg-white p-6 rounded-lg shadow sticky top-4">
                                <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-4">Resumo do Pedido</h2>
                                <div className="space-y-2 mb-4">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Subtotal</span>
                                        <span className="text-gray-800">{formatarPreco(totalPreco)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Frete</span>
                                        <span className="text-green-600 font-medium">Grátis</span>
                                    </div>
                                </div>
                                <div className="flex justify-between font-bold text-lg border-t pt-4">
                                    <span>Total</span>
                                    <span>{formatarPreco(totalPreco)}</span>
                                </div>
                                <button
                                    className="w-full mt-6 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-bold transition-colors"
                                >
                                    Finalizar Compra
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default CarrinhoPage;