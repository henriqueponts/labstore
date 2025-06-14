import React, { useEffect, useState } from 'react';
import { CartItem } from '../types';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { buscarItensCarrinho, atualizarQuantidadeItemCarrinho, removerItemCarrinho } from '../services/apiService'; // Alterado para apiService
import { useAuth } from '../hooks/useAuth';
import { Link } from 'react-router-dom';
import { ROUTES } from '../constants';

const CartPage: React.FC = () => {
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCartItems = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const data = await buscarItensCarrinho(); // userId é inferido no backend
      setCartItems(data);
      setError(null);
    } catch (err: any) {
      console.error("Falha ao buscar itens do carrinho:", err);
      setError(err.message || "Não foi possível carregar o carrinho.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCartItems();
  }, [user]);

  const handleQuantityChange = async (itemId: string, newQuantity: number) => {
    if (!user || newQuantity < 1) return;
    try {
      await atualizarQuantidadeItemCarrinho(itemId, newQuantity); // userId é inferido no backend
      setCartItems(prevItems => 
        prevItems.map(item => item.id === itemId ? { ...item, quantity: newQuantity } : item)
      );
    } catch (err: any) {
      console.error("Falha ao atualizar quantidade do item:", err);
      setError(err.message || "Falha ao atualizar quantidade.");
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    if (!user) return;
    try {
      await removerItemCarrinho(itemId); // userId é inferido no backend
      setCartItems(prevItems => prevItems.filter(item => item.id !== itemId));
    } catch (err: any) {
      console.error("Falha ao remover item:", err);
      setError(err.message || "Falha ao remover item.");
    }
  };

  const calculateSubtotal = () => {
    return cartItems.reduce((total, item) => total + item.preco * item.quantity, 0);
  };

  if (loading) {
    return <LoadingSpinner fullscreen message="Carregando carrinho..." />;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-unifafibe_gray-dark mb-6">Meu Carrinho</h1>
      {error && <Card title="Erro"><p className="text-red-500">{error}</p></Card>}
      
      {cartItems.length === 0 && !error ? (
        <Card>
          <p className="text-center text-unifafibe_gray">Seu carrinho está vazio.</p>
          <div className="mt-4 text-center">
            <Link to={ROUTES.PRODUCTS}>
              <Button variant="primary">Continuar Comprando</Button>
            </Link>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map(item => (
              <Card key={item.id} className="flex flex-col sm:flex-row items-center gap-4">
                <img src={item.imagemUrl || `https://picsum.photos/seed/${item.id}/100/100`} alt={item.nome} className="w-24 h-24 object-cover rounded-md"/>
                <div className="flex-grow">
                  <h3 className="text-lg font-semibold text-unifafibe_blue">{item.nome}</h3>
                  <p className="text-sm text-unifafibe_gray">Preço Unit.: R$ {item.preco.toFixed(2)}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <label htmlFor={`quantity-${item.id}`} className="sr-only">Quantidade</label>
                  <input 
                    type="number" 
                    id={`quantity-${item.id}`}
                    min="1" 
                    value={item.quantity} 
                    onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value))}
                    className="w-16 p-1 border rounded-md text-center"
                    aria-label={`Quantidade de ${item.nome}`}
                  />
                </div>
                <p className="font-semibold text-unifafibe_gray-dark w-24 text-right">
                  R$ {(item.preco * item.quantity).toFixed(2)}
                </p>
                <Button onClick={() => handleRemoveItem(item.id)} variant="danger" size="sm" className="ml-2 sm:ml-0">Remover</Button>
              </Card>
            ))}
          </div>
          <div className="lg:col-span-1">
            <Card title="Resumo do Pedido">
              <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>R$ {calculateSubtotal().toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Frete:</span>
                  <span>A calcular</span>
                </div>
                <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2">
                  <span>Total:</span>
                  <span>R$ {calculateSubtotal().toFixed(2)}</span>
                </div>
              </div>
              <Link to="#">
                <Button className="w-full" variant="secondary" size="lg" disabled={cartItems.length === 0}>
                  Finalizar Compra
                </Button>
              </Link>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartPage;
