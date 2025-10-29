"use client"

import type React from "react"
import { useState, useEffect } from "react"
import axios from "axios"
import Layout from "../components/Layout"
import { useNavigate } from "react-router-dom"
import {
  Package,
  Plus,
  Edit3,
  Eye,
  Search,
  Filter,
  DollarSign,
  Tag,
  Layers,
  ImageIcon,
  AlertCircle,
  CheckCircle,
} from "lucide-react"
import { useAlert } from "../components/Alert-container"

interface Produto {
  id_produto: number
  nome: string
  descricao: string
  preco: number
  marca_nome: string
  modelo: string
  estoque: number
  status: "ativo" | "inativo"
  imagemUrl: string | null
  categoria_nome: string
  cor: string
  ano_fabricacao: number
}

interface Categoria {
  id_categoria: number
  nome: string
}

interface Marca {
  id_marca: number
  nome: string
}

const GestaoProdutos: React.FC = () => {
  const navigate = useNavigate()
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [marcas, setMarcas] = useState<Marca[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("")
  const [selectedBrand, setSelectedBrand] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const { showErro, showAviso, showSucesso } = useAlert();

  // Carregar dados
  const fetchData = async () => {
    try {
      console.log("[v0] Iniciando carregamento de dados...")

      const [produtosRes, categoriasRes, marcasRes] = await Promise.all([
        axios.get("http://localhost:3000/produtos/produtos"),
        axios.get("http://localhost:3000/produtos/categorias"),
        axios.get("http://localhost:3000/gestao/marcas"),
      ])

      console.log("[v0] Produtos recebidos:", produtosRes.data)
      console.log("[v0] Categorias recebidas:", categoriasRes.data)
      console.log("[v0] Marcas recebidas:", marcasRes.data)

      produtosRes.data.forEach((produto: Produto, index: number) => {
        console.log(`[v0] Produto ${index + 1}:`, {
          nome: produto.nome,
          marca_nome: produto.marca_nome,
          id_marca: (produto as any).id_marca, // Verificando se existe id_marca
        })
      })

      setProdutos(produtosRes.data)
      setCategorias(categoriasRes.data)
      setMarcas(marcasRes.data)
    } catch (err) {
      console.error("[v0] Erro ao carregar dados:", err)
      if (axios.isAxiosError(err)) {
        console.error("[v0] Detalhes do erro:", {
          status: err.response?.status,
          statusText: err.response?.statusText,
          data: err.response?.data,
          url: err.config?.url,
        })
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Filtrar produtos
  const filteredProdutos = produtos.filter((produto) => {
    const matchesSearch =
      produto.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      produto.marca_nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      produto.modelo?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesCategory = !selectedCategory || produto.categoria_nome === selectedCategory

    const matchesBrand =
      !selectedBrand ||
      (produto.marca_nome && produto.marca_nome === selectedBrand) ||
      (!produto.marca_nome && selectedBrand === "Sem marca")

    const matchesStatus = !statusFilter || produto.status === statusFilter

    console.log(`[v0] Filtro para ${produto.nome}:`, {
      selectedBrand,
      produto_marca_nome: produto.marca_nome,
      matchesBrand,
      matchesSearch,
      matchesCategory,
      matchesStatus,
    })

    return matchesSearch && matchesCategory && matchesBrand && matchesStatus
  })

  // Formatar preço
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(price)
  }

  // Alternar status do produto (ativo/inativo)
  const handleToggleStatus = async (id: number, currentStatus: "ativo" | "inativo", nome: string) => {
    const newStatus = currentStatus === "ativo" ? "inativo" : "ativo"
    const actionText = newStatus === "inativo" ? "inativar" : "ativar"

    if (!confirm(`Tem certeza que deseja ${actionText} o produto "${nome}"?`)) {
      return
    }

    try {
      const token = localStorage.getItem("token")
      await axios.put(
        `http://localhost:3000/produtos/produtos/${id}`,
        { status: newStatus },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      )

      setProdutos((prevProdutos) => prevProdutos.map((p) => (p.id_produto === id ? { ...p, status: newStatus } : p)))
      showSucesso(`Produto "${nome}" ${actionText}ado com sucesso!`)
    } catch (err) {
      console.error(`Erro ao ${actionText}ar produto:`, err)
      showErro(`Erro ao ${actionText}ar produto`)
    }
  }

  if (loading) {
    return (
      <Layout showLoading={true}>
        <div></div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Gestão de Produtos</h1>
              <p className="text-gray-600">Gerencie o catálogo de produtos da loja</p>
            </div>
            <button
              onClick={() => navigate("/cadastro/produto")}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center"
            >
              <Plus size={20} className="mr-2" />
              Novo Produto
            </button>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Search className="inline mr-1" size={16} />
                Buscar
              </label>
              <input
                type="text"
                placeholder="Nome, marca ou modelo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Layers className="inline mr-1" size={16} />
                Categoria
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Todas as categorias</option>
                {categorias.map((categoria) => (
                  <option key={categoria.id_categoria} value={categoria.nome}>
                    {categoria.nome}
                  </option>
                ))}
              </select>
              {categorias.length === 0 && <p className="text-xs text-red-500 mt-1">Nenhuma categoria carregada</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Tag className="inline mr-1" size={16} />
                Marca
              </label>
              <select
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Todas as marcas</option>
                <option value="Sem marca">Sem marca</option>
                {marcas.map((marca) => (
                  <option key={marca.id_marca} value={marca.nome}>
                    {marca.nome}
                  </option>
                ))}
              </select>
              {marcas.length === 0 && <p className="text-xs text-red-500 mt-1">Nenhuma marca carregada</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Filter className="inline mr-1" size={16} />
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Todos os status</option>
                <option value="ativo">Ativo</option>
                <option value="inativo">Inativo</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchTerm("")
                  setSelectedCategory("")
                  setSelectedBrand("")
                  setStatusFilter("")
                }}
                className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Limpar Filtros
              </button>
            </div>
          </div>
        </div>

        {/* Lista de Produtos */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">Produtos ({filteredProdutos.length})</h2>
          </div>

          {filteredProdutos.length === 0 ? (
            <div className="text-center py-12">
              <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum produto encontrado</h3>
              <p className="text-gray-500 mb-4">
                {produtos.length === 0
                  ? "Comece adicionando seu primeiro produto ao catálogo."
                  : "Tente ajustar os filtros de busca."}
              </p>
              {produtos.length === 0 && (
                <button
                  onClick={() => navigate("/cadastro/produto")}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                >
                  Adicionar Produto
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Produto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Categoria
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Marca
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Preço
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estoque
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredProdutos.map((produto) => (
                    <tr key={produto.id_produto} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-12 w-12">
                            {produto.imagemUrl ? (
                              <img
                                className="h-12 w-12 rounded-lg object-cover"
                                src={`http://localhost:3000/produtos${produto.imagemUrl}`}
                                alt={produto.nome}
                              />
                            ) : (
                              <div className="h-12 w-12 rounded-lg bg-gray-200 flex items-center justify-center">
                                <ImageIcon className="h-6 w-6 text-gray-400" />
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{produto.nome}</div>
                            <div className="text-sm text-gray-500">{produto.modelo}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          {produto.categoria_nome}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            produto.marca_nome ? "bg-purple-100 text-purple-800" : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {produto.marca_nome || "Sem marca"}
                        </span>
                        {/* Temporário para debug - remover depois */}
                        {!produto.marca_nome && (
                          <div className="text-xs text-red-500 mt-1">
                            Debug: marca_nome = {JSON.stringify(produto.marca_nome)}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm font-medium text-gray-900">
                          <DollarSign size={16} className="mr-1 text-green-600" />
                          {formatPrice(produto.preco)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div
                          className={`flex items-center text-sm ${
                            produto.estoque <= 5 ? "text-red-600" : "text-gray-900"
                          }`}
                        >
                          {produto.estoque <= 5 ? (
                            <AlertCircle size={16} className="mr-1" />
                          ) : (
                            <Tag size={16} className="mr-1" />
                          )}
                          {produto.estoque} unidades
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            produto.status === "ativo" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                          }`}
                        >
                          {produto.status === "ativo" ? (
                            <>
                              <CheckCircle size={12} className="mr-1" /> Ativo
                            </>
                          ) : (
                            <>
                              <AlertCircle size={12} className="mr-1" /> Inativo
                            </>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => navigate(`/produto/${produto.id_produto}`)}
                            className="text-blue-600 hover:text-blue-800"
                            title="Visualizar"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => navigate(`/editar/produto/${produto.id_produto}`)}
                            className="text-green-600 hover:text-green-800"
                            title="Editar"
                          >
                            <Edit3 size={16} />
                          </button>
                          <button
                            onClick={() => handleToggleStatus(produto.id_produto, produto.status, produto.nome)}
                            className={`${
                              produto.status === "ativo"
                                ? "text-orange-600 hover:text-orange-800"
                                : "text-green-600 hover:text-green-800"
                            }`}
                            title={produto.status === "ativo" ? "Inativar" : "Ativar"}
                          >
                            {produto.status === "ativo" ? <AlertCircle size={16} /> : <CheckCircle size={16} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Estatísticas */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total de Produtos</p>
                <p className="text-2xl font-semibold text-gray-900">{produtos.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Produtos Ativos</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {produtos.filter((p) => p.status === "ativo").length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <AlertCircle className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Estoque Baixo</p>
                <p className="text-2xl font-semibold text-gray-900">{produtos.filter((p) => p.estoque <= 5).length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <Tag className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Marcas</p>
                <p className="text-2xl font-semibold text-gray-900">{marcas.length}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default GestaoProdutos
