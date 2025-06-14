import React, { useEffect, useState } from 'react';
import { Order } from '../types';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { buscarPedidos } from '../services/apiService'; // Alterado para apiService
import { useAuth } from '../hooks/useAuth';

const OrdersPage: React.FC = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadOrders = async () => {
      if (!user) return;
      try {
        setLoading(true);
        const data = await buscarPedidos(); // userId é inferido no backend
        setOrders(data);
        setError(null);
      } catch (err: any) {
        console.error("Falha ao buscar pedidos:", err);
        setError(err.message || "Não foi possível carregar seus pedidos.");
      } finally {
        setLoading(false);
      }
    };
    loadOrders();
  }, [user]);

  const getOrderStatusText = (status: Order['status']): string => {
    const map = {
      'aguardando_pagamento': 'Aguardando Pagamento',
      'processando': 'Processando',
      'enviado': 'Enviado',
      'entregue': 'Entregue',
      'cancelado': 'Cancelado',
      'concluido': 'Concluído'
    };
    return map[status] || status;
  }

  if (loading) {
    return <LoadingSpinner fullscreen message="Carregando pedidos..." />;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-unifafibe_gray-dark mb-6">Meus Pedidos</h1>
      {error && <Card title="Erro"><p className="text-red-500">{error}</p></Card>}
      
      {orders.length === 0 && !error ? (
        <Card>
          <p>Você ainda não fez nenhum pedido.</p>
        </Card>
      ) : (
        <div className="space-y-6">
          {orders.map(order => (
            <Card key={order.id} title={`Pedido #${order.id.substring(0,8)}... - ${new Date(order.data_pedido).toLocaleDateString()}`}>
              <div className="mb-4">
                <p className="text-sm text-unifafibe_gray">Status: 
                  <span className={`ml-2 px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    order.status === 'entregue' || order.status === 'concluido' ? 'bg-green-100 text-green-800' 
                    : order.status === 'cancelado' ? 'bg-red-100 text-red-800'
                    : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {getOrderStatusText(order.status)}
                  </span>
                </p>
                <p className="text-sm text-unifafibe_gray">Total: R$ {order.valorTotal.toFixed(2)}</p>
                <p className="text-sm text-unifafibe_gray">Pagamento: {order.metodo_pagamento === 'cartao_credito' ? 'Cartão de Crédito' : order.metodo_pagamento === 'boleto' ? 'Boleto' : 'PIX'}</p>
              </div>
              <h4 className="text-md font-semibold text-unifafibe_gray-dark mb-2">Itens:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-unifafibe_gray">
                {order.items.map(item => (
                  <li key={item.id}>{item.nome} (x{item.quantity}) - R$ {(item.preco * item.quantity).toFixed(2)}</li>
                ))}
              </ul>
              <div className="mt-4">
                <Button variant="ghost" size="sm">Ver Detalhes do Pedido</Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrdersPage;
