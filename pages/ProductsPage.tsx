
import React, { useEffect, useState } from 'react';
import { Product } from '../types';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { fetchProducts, addToCart } from '../services/mockApiService';
import { useAuth } from '../hooks/useAuth';
import { ShoppingCartIcon } from '../components/ui/Icon';

const ProductCard: React.FC<{ product: Product; onAddToCart: (product: Product) => void }> = ({ product, onAddToCart }) => {
  return (
    <Card className="flex flex-col h-full">
      <img 
        src={product.imagemUrl || `https://picsum.photos/seed/${product.id}/400/300`} 
        alt={product.nome} 
        className="w-full h-48 object-cover"
      />
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="text-lg font-semibold text-unifafibe_blue mb-1 truncate" title={product.nome}>{product.nome}</h3>
        <p className="text-sm text-unifafibe_gray mb-2 flex-grow min-h-[40px] line-clamp-2">{product.descricao}</p>
        <p className="text-xs text-unifafibe_gray mb-1">Marca: {product.marca || 'N/A'}</p>
        <p className="text-xs text-unifafibe_gray mb-2">Estoque: {product.estoque > 0 ? product.estoque : 'Indisponível'}</p>
        <div className="mt-auto">
          <p className="text-xl font-bold text-unifafibe_orange mb-3">
            R$ {product.preco.toFixed(2).replace('.', ',')}
          </p>
          <Button 
            onClick={() => onAddToCart(product)} 
            className="w-full" 
            disabled={product.estoque === 0}
            variant={product.estoque > 0 ? "primary" : "ghost"}
            leftIcon={<ShoppingCartIcon size={18}/>}
          >
            {product.estoque > 0 ? 'Adicionar ao Carrinho' : 'Indisponível'}
          </Button>
        </div>
      </div>
    </Card>
  );
};

const ProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth(); // Necessário para addToCart se usar userId

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        const data = await fetchProducts();
        setProducts(data.filter(p => p.status === 'ativo')); // Mostrar apenas produtos ativos
        setError(null);
      } catch (err) {
        console.error("Falha ao buscar produtos:", err);
        setError("Não foi possível carregar os produtos.");
      } finally {
        setLoading(false);
      }
    };
    loadProducts();
  }, []);

  const handleAddToCart = async (product: Product) => {
    if (!user) {
        alert("Você precisa estar logado para adicionar produtos ao carrinho.");
        return;
    }
    try {
        await addToCart(user.id, product.id, 1);
        alert(`${product.nome} adicionado ao carrinho!`);
        // Potencialmente atualizar ícone/estado do carrinho globalmente
    } catch (err) {
        alert(`Erro ao adicionar ${product.nome} ao carrinho.`);
        console.error(err);
    }
  };

  if (loading) {
    return <LoadingSpinner fullscreen message="Carregando produtos..." />;
  }

  if (error) {
    return <Card title="Erro"><p className="text-red-500">{error}</p></Card>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-unifafibe_gray-dark mb-8">Nossos Produtos</h1>
      {products.length === 0 ? (
        <Card>
          <p>Nenhum produto encontrado no momento.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} onAddToCart={handleAddToCart} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductsPage;