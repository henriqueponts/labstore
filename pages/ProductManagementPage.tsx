
import React, { useEffect, useState } from 'react';
import { Product, UserRole } from '../types';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { fetchProducts as fetchAllProducts, createProduct, updateProduct, deleteProduct } from '../services/mockApiService';
import { useAuth } from '../hooks/useAuth';

// Formulário de Produto simplificado, app real usaria modal e mais campos
const ProductForm: React.FC<{ 
    product?: Product | null; 
    onSave: (productData: Omit<Product, 'id' | 'imagemUrl'> | Product) => Promise<void>; 
    onCancel: () => void;
    isSaving: boolean;
}> = ({ product, onSave, onCancel, isSaving }) => {
  const [formData, setFormData] = useState<Omit<Product, 'id' | 'imagemUrl'>>({
    nome: product?.nome || '',
    descricao: product?.descricao || '',
    preco: product?.preco || 0,
    categoria: product?.categoria || '',
    marca: product?.marca || '',
    modelo: product?.modelo || '',
    estoque: product?.estoque || 0,
    status: product?.status || 'ativo',
    compatibilidade: product?.compatibilidade || '',
    cor: product?.cor || '',
    ano_fabricacao: product?.ano_fabricacao || new Date().getFullYear(),
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'number' ? parseFloat(value) : type === 'checkbox' ? (e.target as HTMLInputElement).checked ? 'ativo' : 'inativo' : value;
    setFormData(prev => ({ ...prev, [name]: val }));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (product) { // Editando produto existente
        onSave({ ...product, ...formData });
    } else { // Criando novo produto
        onSave(formData);
    }
  };

  return (
    <Card title={product ? "Editar Produto" : "Adicionar Novo Produto"} className="mb-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Nome" name="nome" value={formData.nome} onChange={handleChange} required />
        <textarea name="descricao" value={formData.descricao} onChange={handleChange} placeholder="Descrição" className="w-full p-2 border rounded-md" required />
        <Input label="Preço" name="preco" type="number" step="0.01" value={formData.preco} onChange={handleChange} required />
        <Input label="Categoria" name="categoria" value={formData.categoria} onChange={handleChange} required />
        <Input label="Marca" name="marca" value={formData.marca || ''} onChange={handleChange} />
        <Input label="Modelo" name="modelo" value={formData.modelo || ''} onChange={handleChange} />
        <Input label="Estoque" name="estoque" type="number" value={formData.estoque} onChange={handleChange} required />
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-unifafibe_gray-dark mb-1">Status</label>
          <select id="status" name="status" value={formData.status} onChange={handleChange} className="w-full p-2 border rounded-md">
            <option value="ativo">Ativo</option>
            <option value="inativo">Inativo</option>
          </select>
        </div>
        <div className="flex gap-4">
            <Button type="submit" isLoading={isSaving} variant="primary">Salvar</Button>
            <Button type="button" onClick={onCancel} variant="ghost" disabled={isSaving}>Cancelar</Button>
        </div>
      </form>
    </Card>
  );
};


const ProductManagementPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { user } = useAuth();

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await fetchAllProducts(); // Busca todos, incluindo inativos
      setProducts(data);
      setError(null);
    } catch (err) {
      console.error("Falha ao buscar produtos:", err);
      setError("Não foi possível carregar os produtos para gerenciamento.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleSaveProduct = async (productData: Omit<Product, 'id' | 'imagemUrl'> | Product) => {
    if (!user || (user.role !== UserRole.ADMIN && user.role !== UserRole.ANALISTA)) {
        setError("Permissão negada.");
        return;
    }
    setIsSaving(true);
    try {
        if ('id' in productData && productData.id) { // Editando
            await updateProduct(productData.id, productData);
        } else { // Criando
            await createProduct(productData as Omit<Product, 'id' | 'imagemUrl'>);
        }
        setShowForm(false);
        setEditingProduct(null);
        await loadProducts(); // Atualiza lista
    } catch (err) {
        console.error("Falha ao salvar produto:", err);
        setError("Falha ao salvar produto.");
    } finally {
        setIsSaving(false);
    }
  };
  
  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setShowForm(true);
  };

  const handleAddNew = () => {
    setEditingProduct(null);
    setShowForm(true);
  };
  
  const handleCancelForm = () => {
    setShowForm(false);
    setEditingProduct(null);
  };

  const handleDelete = async (productId: string) => {
    if (!user || user.role !== UserRole.ADMIN ) { // Talvez apenas admin possa deletar? Ou analistas também.
        setError("Permissão negada para excluir.");
        return;
    }
    if (window.confirm("Tem certeza que deseja excluir este produto?")) {
        try {
            await deleteProduct(productId);
            await loadProducts();
        } catch (err) {
            console.error("Falha ao excluir produto:", err);
            setError("Falha ao excluir produto.");
        }
    }
  };


  if (loading) {
    return <LoadingSpinner fullscreen message="Carregando gerenciamento de produtos..." />;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-unifafibe_gray-dark">Gerenciamento de Produtos</h1>
        <Button onClick={handleAddNew} variant="primary">Adicionar Novo Produto</Button>
      </div>

      {error && <Card title="Erro"><p className="text-red-500">{error}</p></Card>}
      
      {showForm && (
        <ProductForm 
            product={editingProduct} 
            onSave={handleSaveProduct} 
            onCancel={handleCancelForm}
            isSaving={isSaving}
        />
      )}

      <Card title="Lista de Produtos">
        {products.length === 0 && !showForm ? (
          <p>Nenhum produto cadastrado.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-unifafibe_gray-light">
              <thead className="bg-unifafibe_gray-light">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-unifafibe_gray uppercase tracking-wider">Nome</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-unifafibe_gray uppercase tracking-wider">Preço</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-unifafibe_gray uppercase tracking-wider">Estoque</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-unifafibe_gray uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-unifafibe_gray uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-unifafibe_gray-light">
                {products.map((product) => (
                  <tr key={product.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-unifafibe_gray-dark">{product.nome}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-unifafibe_gray">R$ {product.preco.toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-unifafibe_gray">{product.estoque}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        product.status === 'ativo' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {product.status === 'ativo' ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <Button onClick={() => handleEdit(product)} size="sm" variant="ghost">Editar</Button>
                      {user?.role === UserRole.ADMIN && (
                        <Button onClick={() => handleDelete(product.id)} size="sm" variant="danger">Excluir</Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

export default ProductManagementPage;