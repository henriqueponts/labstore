import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { CheckCircle, Package, Home } from 'lucide-react';

const PagamentoSucesso: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [orderId, setOrderId] = useState<string | null>(null);

  useEffect(() => {
    const id = searchParams.get('order_id');
    setOrderId(id);
  }, [searchParams]);

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Pagamento Realizado com Sucesso!
          </h1>
          
          <p className="text-gray-600 mb-6">
            Seu pedido foi processado e vocÃª receberÃ¡ um e-mail de confirmaÃ§Ã£o em breve.
          </p>
          
          {orderId && (
            <p className="text-sm text-gray-500 mb-6">
              NÃºmero do pedido: <strong>{orderId}</strong>
            </p>
          )}
          
          <div className="space-y-3">
            <button
              onClick={() => navigate('/meus-pedidos')}
              className="w-full bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center"
            >
              <Package size={20} className="mr-2" />
              Ver Meus Pedidos
            </button>
            
            <button
              onClick={() => navigate('/')}
              className="w-full border border-gray-300 hover:border-gray-400 text-gray-700 px-6 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center"
            >
              <Home size={20} className="mr-2" />
              Voltar ao InÃ­cio
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PagamentoSucesso;