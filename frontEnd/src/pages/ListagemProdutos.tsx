"use client"

import type React from "react"
import { useState, useEffect } from "react"
import axios from "axios"
import Layout from "../components/Layout"
import { useNavigate, useSearchParams } from "react-router-dom"
import {
  Search,
  Filter,
  Grid3X3,
  List,
  ShoppingCart,
  Eye,
  Package,
  SlidersHorizontal,
  ArrowUpDown,
  Home,
  ChevronRight,
} from "lucide-react"

interface Produto {
  id_produto: number
  nome: string
  descricao: string
  preco: number
  marca: string
  modelo: string
  estoque: number
  status: "ativo" | "inativo"
  imagemUrl: string | null
  categoria_nome: string
  cor: string
  ano_fabricacao: number
  imagens: Array<{
    id_imagem: number
    url_imagem: string
    is_principal: boolean
  }>
}

interface Categoria {
  id_categoria: number
  nome: string
  descricao: string
}

type TipoVisualizacao = "grid" | "lista"
type OrdenacaoTipo = "nome" | "preco_asc" | "preco_desc" | "mais_recente"

const ListagemProdutos: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  // Estados principais
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [loading, setLoading] = useState(true)

  // Estados de filtros
  const [termoBusca, setTermoBusca] = useState(searchParams.get("busca") || "")
  const [categoriasSelecionadas, setCategoriasSelecionadas] = useState<string[]>(
    searchParams.get("categoria")?.split(",").filter(Boolean) || [],
  )
  const [faixaPreco, setFaixaPreco] = useState({
    min: searchParams.get("preco_min") || "",
    max: searchParams.get("preco_max") || "",
  })
  const [marcasSelecionadas, setMarcasSelecionadas] = useState<string[]>(
    searchParams.get("marca")?.split(",").filter(Boolean) || [],
  )

  // Estados de interface
  const [tipoVisualizacao, setTipoVisualizacao] = useState<TipoVisualizacao>("grid")
  const [ordenacao, setOrdenacao] = useState<OrdenacaoTipo>("nome")
  const [mostrarFiltros, setMostrarFiltros] = useState(false)
  const [produtosPorPagina] = useState(12)
  const [paginaAtual, setPaginaAtual] = useState(1)

  // Carregar dados
  const carregarDados = async () => {
    try {
      const [produtosRes, categoriasRes] = await Promise.all([
        axios.get("http://localhost:3000/produtos/produtos"),
        axios.get("http://localhost:3000/produtos/categorias"),
      ])

      // Filtrar apenas produtos ativos
      const produtosAtivos = produtosRes.data.filter((produto: Produto) => produto.status === "ativo")
      setProdutos(produtosAtivos)
      setCategorias(categoriasRes.data)
    } catch (err) {
      console.error("Erro ao carregar dados:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregarDados()
  }, [])

  // Obter marcas únicas
  const marcasDisponiveis = [...new Set(produtos.map((p) => p.marca).filter(Boolean))].sort()

  // Filtrar produtos
  const produtosFiltrados = produtos.filter((produto) => {
    // Filtro de busca
    const matchBusca =
      !termoBusca ||
      produto.nome.toLowerCase().includes(termoBusca.toLowerCase()) ||
      produto.marca?.toLowerCase().includes(termoBusca.toLowerCase()) ||
      produto.modelo?.toLowerCase().includes(termoBusca.toLowerCase()) ||
      produto.descricao.toLowerCase().includes(termoBusca.toLowerCase())

    // Filtro de categoria
    const matchCategoria =
      categoriasSelecionadas.length === 0 || categoriasSelecionadas.includes(produto.categoria_nome)

    // Filtro de preço
    const matchPreco =
      (!faixaPreco.min || produto.preco >= Number.parseFloat(faixaPreco.min)) &&
      (!faixaPreco.max || produto.preco <= Number.parseFloat(faixaPreco.max))

    // Filtro de marca
    const matchMarca = marcasSelecionadas.length === 0 || (produto.marca && marcasSelecionadas.includes(produto.marca))

    return matchBusca && matchCategoria && matchPreco && matchMarca
  })

  // Ordenar produtos
  const produtosOrdenados = [...produtosFiltrados].sort((a, b) => {
    switch (ordenacao) {
      case "preco_asc":
        return a.preco - b.preco
      case "preco_desc":
        return b.preco - a.preco
      case "mais_recente":
        return b.id_produto - a.id_produto
      default:
        return a.nome.localeCompare(b.nome)
    }
  })

  // Paginação
  const totalPaginas = Math.ceil(produtosOrdenados.length / produtosPorPagina)
  const indiceInicio = (paginaAtual - 1) * produtosPorPagina
  const produtosPaginados = produtosOrdenados.slice(indiceInicio, indiceInicio + produtosPorPagina)

  // Atualizar URL com filtros
  const atualizarURL = () => {
    const params = new URLSearchParams()
    if (termoBusca) params.set("busca", termoBusca)
    if (categoriasSelecionadas.length > 0) params.set("categoria", categoriasSelecionadas.join(","))
    if (faixaPreco.min) params.set("preco_min", faixaPreco.min)
    if (faixaPreco.max) params.set("preco_max", faixaPreco.max)
    if (marcasSelecionadas.length > 0) params.set("marca", marcasSelecionadas.join(","))

    setSearchParams(params)
  }

  useEffect(() => {
    atualizarURL()
    setPaginaAtual(1)
  }, [termoBusca, categoriasSelecionadas, faixaPreco, marcasSelecionadas])

  // Formatação de preço
  const formatarPreco = (preco: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(preco)
  }

  // Limpar filtros
  const limparFiltros = () => {
    setTermoBusca("")
    setCategoriasSelecionadas([])
    setFaixaPreco({ min: "", max: "" })
    setMarcasSelecionadas([])
    setSearchParams(new URLSearchParams())
  }

  // Toggle categoria
  const toggleCategoria = (categoria: string) => {
    setCategoriasSelecionadas((prev) =>
      prev.includes(categoria) ? prev.filter((c) => c !== categoria) : [...prev, categoria],
    )
  }

  // Toggle marca
  const toggleMarca = (marca: string) => {
    setMarcasSelecionadas((prev) => (prev.includes(marca) ? prev.filter((m) => m !== marca) : [...prev, marca]))
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
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-8">
          <button onClick={() => navigate("/")} className="hover:text-blue-600 transition-colors">
            <Home size={16} />
          </button>
          <ChevronRight size={16} />
          <span className="text-gray-900 font-medium">Produtos</span>
        </nav>

        {/* Header da página */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Nossos Produtos</h1>
          <p className="text-gray-600">Descubra nossa seleção completa de produtos tecnológicos</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar de Filtros */}
          <div className={`lg:w-80 ${mostrarFiltros ? "block" : "hidden lg:block"}`}>
            <div className="bg-white rounded-lg shadow-sm border p-6 sticky top-4">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <SlidersHorizontal size={20} className="mr-2" />
                  Filtros
                </h2>
                <button onClick={limparFiltros} className="text-sm text-blue-600 hover:text-blue-800 transition-colors">
                  Limpar tudo
                </button>
              </div>

              {/* Busca */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Buscar produtos</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    placeholder="Nome, marca, modelo..."
                    value={termoBusca}
                    onChange={(e) => setTermoBusca(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Categorias */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Categorias</h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {categorias.map((categoria) => (
                    <label key={categoria.id_categoria} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={categoriasSelecionadas.includes(categoria.nome)}
                        onChange={() => toggleCategoria(categoria.nome)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">{categoria.nome}</span>
                      <span className="ml-auto text-xs text-gray-500">
                        ({produtos.filter((p) => p.categoria_nome === categoria.nome).length})
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Faixa de Preço */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Faixa de Preço</h3>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    placeholder="Mín"
                    value={faixaPreco.min}
                    onChange={(e) => setFaixaPreco((prev) => ({ ...prev, min: e.target.value }))}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <input
                    type="number"
                    placeholder="Máx"
                    value={faixaPreco.max}
                    onChange={(e) => setFaixaPreco((prev) => ({ ...prev, max: e.target.value }))}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Marcas */}
              {marcasDisponiveis.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Marcas</h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {marcasDisponiveis.map((marca) => (
                      <label key={marca} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={marcasSelecionadas.includes(marca)}
                          onChange={() => toggleMarca(marca)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">{marca}</span>
                        <span className="ml-auto text-xs text-gray-500">
                          ({produtos.filter((p) => p.marca === marca).length})
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Área principal */}
          <div className="flex-1">
            {/* Barra de controles */}
            <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => setMostrarFiltros(!mostrarFiltros)}
                    className="lg:hidden flex items-center px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Filter size={16} className="mr-2" />
                    Filtros
                  </button>

                  <span className="text-sm text-gray-600">
                    {produtosFiltrados.length}{" "}
                    {produtosFiltrados.length === 1 ? "produto encontrado" : "produtos encontrados"}
                  </span>
                </div>

                <div className="flex items-center space-x-4">
                  {/* Ordenação */}
                  <div className="flex items-center space-x-2">
                    <ArrowUpDown size={16} className="text-gray-400" />
                    <select
                      value={ordenacao}
                      onChange={(e) => setOrdenacao(e.target.value as OrdenacaoTipo)}
                      className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="nome">Nome A-Z</option>
                      <option value="preco_asc">Menor preço</option>
                      <option value="preco_desc">Maior preço</option>
                      <option value="mais_recente">Mais recentes</option>
                    </select>
                  </div>

                  {/* Tipo de visualização */}
                  <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                    <button
                      onClick={() => setTipoVisualizacao("grid")}
                      className={`p-2 ${tipoVisualizacao === "grid" ? "bg-blue-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"} transition-colors`}
                    >
                      <Grid3X3 size={16} />
                    </button>
                    <button
                      onClick={() => setTipoVisualizacao("lista")}
                      className={`p-2 ${tipoVisualizacao === "lista" ? "bg-blue-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"} transition-colors`}
                    >
                      <List size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Lista de produtos */}
            {produtosPaginados.length === 0 ? (
              <div className="text-center py-12">
                <Package className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum produto encontrado</h3>
                <p className="text-gray-500 mb-4">
                  Tente ajustar os filtros ou termos de busca para encontrar o que procura.
                </p>
                <button
                  onClick={limparFiltros}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                >
                  Limpar filtros
                </button>
              </div>
            ) : (
              <>
                {/* Grid de produtos */}
                <div
                  className={
                    tipoVisualizacao === "grid"
                      ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                      : "space-y-4"
                  }
                >
                  {produtosPaginados.map((produto) => (
                    <div
                      key={produto.id_produto}
                      className={`bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow ${
                        tipoVisualizacao === "lista" ? "flex p-4" : "overflow-hidden"
                      }`}
                    >
                      {tipoVisualizacao === "grid" ? (
                        // Visualização em grid
                        <>
                          <div className="aspect-square bg-gray-100 relative group">
                            {produto.imagemUrl ? (
                              <img
                                src={`http://localhost:3000/produtos${produto.imagemUrl}`}
                                alt={produto.nome}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package className="h-12 w-12 text-gray-400" />
                              </div>
                            )}

                            {/* Overlay com ações */}
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => navigate(`/produto/${produto.id_produto}`)}
                                  className="bg-white text-gray-800 p-2 rounded-full hover:bg-gray-100 transition-colors"
                                  title="Ver detalhes"
                                >
                                  <Eye size={16} />
                                </button>
                                <button
                                  className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition-colors"
                                  title="Adicionar ao carrinho"
                                >
                                  <ShoppingCart size={16} />
                                </button>
                              </div>
                            </div>
                          </div>

                          <div className="p-4">
                            <div className="mb-2">
                              <span className="text-xs text-blue-600 font-medium">{produto.categoria_nome}</span>
                            </div>
                            <h3 className="font-medium text-gray-900 mb-1 line-clamp-2">{produto.nome}</h3>
                            {produto.marca && <p className="text-sm text-gray-600 mb-2">{produto.marca}</p>}
                            <div className="flex items-center justify-between">
                              <span className="text-lg font-bold text-gray-900">{formatarPreco(produto.preco)}</span>
                              <span className="text-xs text-gray-500">{produto.estoque} em estoque</span>
                            </div>
                          </div>
                        </>
                      ) : (
                        // Visualização em lista
                        <>
                          <div className="w-24 h-24 bg-gray-100 rounded-lg flex-shrink-0 mr-4">
                            {produto.imagemUrl ? (
                              <img
                                src={`http://localhost:3000/produtos${produto.imagemUrl}`}
                                alt={produto.nome}
                                className="w-full h-full object-cover rounded-lg"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package className="h-8 w-8 text-gray-400" />
                              </div>
                            )}
                          </div>

                          <div className="flex-1">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="mb-1">
                                  <span className="text-xs text-blue-600 font-medium">{produto.categoria_nome}</span>
                                </div>
                                <h3 className="font-medium text-gray-900 mb-1">{produto.nome}</h3>
                                {produto.marca && <p className="text-sm text-gray-600 mb-2">{produto.marca}</p>}
                                <p className="text-sm text-gray-600 line-clamp-2">{produto.descricao}</p>
                              </div>

                              <div className="ml-4 text-right">
                                <div className="text-lg font-bold text-gray-900 mb-2">
                                  {formatarPreco(produto.preco)}
                                </div>
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() => navigate(`/produto/${produto.id_produto}`)}
                                    className="text-blue-600 hover:text-blue-800 p-1"
                                    title="Ver detalhes"
                                  >
                                    <Eye size={16} />
                                  </button>
                                  <button
                                    className="text-blue-600 hover:text-blue-800 p-1"
                                    title="Adicionar ao carrinho"
                                  >
                                    <ShoppingCart size={16} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>

                {/* Paginação */}
                {totalPaginas > 1 && (
                  <div className="mt-8 flex justify-center">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setPaginaAtual((prev) => Math.max(prev - 1, 1))}
                        disabled={paginaAtual === 1}
                        className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Anterior
                      </button>

                      {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((pagina) => (
                        <button
                          key={pagina}
                          onClick={() => setPaginaAtual(pagina)}
                          className={`px-3 py-2 border rounded-lg transition-colors ${
                            pagina === paginaAtual
                              ? "bg-blue-600 text-white border-blue-600"
                              : "border-gray-300 hover:bg-gray-50"
                          }`}
                        >
                          {pagina}
                        </button>
                      ))}

                      <button
                        onClick={() => setPaginaAtual((prev) => Math.min(prev + 1, totalPaginas))}
                        disabled={paginaAtual === totalPaginas}
                        className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Próxima
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default ListagemProdutos
