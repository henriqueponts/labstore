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
  Package,
  SlidersHorizontal,
  ArrowUpDown,
  TrendingUp,
  Zap,
  X,
} from "lucide-react"
import { useCart } from "../context/CartContext" // <-- IMPORTADO

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
  const { adicionarAoCarrinho } = useCart() // <-- ADICIONADO

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

  // Verificar se há filtros ativos
  const temFiltrosAtivos =
    termoBusca || categoriasSelecionadas.length > 0 || faixaPreco.min || faixaPreco.max || marcasSelecionadas.length > 0

  if (loading) {
    return (
      <Layout showLoading={true}>
        <div></div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Header da página */}
          <div className="mb-12 text-center">
            <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-full text-blue-700 text-sm font-medium mb-4">
              <Zap size={16} className="mr-2" />
              Catálogo Completo
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4 bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent">
              Nossos Produtos
            </h1>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Descubra nossa seleção completa de produtos tecnológicos com a melhor qualidade e preços competitivos
            </p>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar de Filtros */}
            <div className={`lg:w-80 ${mostrarFiltros ? "block" : "hidden lg:block"}`}>
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6 sticky top-4">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-slate-900 flex items-center">
                    <SlidersHorizontal size={20} className="mr-3 text-blue-600" />
                    Filtros
                  </h2>
                  {temFiltrosAtivos && (
                    <button
                      onClick={limparFiltros}
                      className="text-sm text-blue-600 hover:text-blue-800 transition-colors duration-200 font-medium hover:bg-blue-50 px-3 py-1 rounded-lg"
                    >
                      Limpar tudo
                    </button>
                  )}
                  <button
                    onClick={() => setMostrarFiltros(false)}
                    className="lg:hidden text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Busca */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-slate-700 mb-3">Buscar produtos</label>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      type="text"
                      placeholder="Nome, marca, modelo..."
                      value={termoBusca}
                      onChange={(e) => setTermoBusca(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm transition-all duration-200 placeholder-slate-400"
                    />
                  </div>
                </div>

                {/* Categorias */}
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                    Categorias
                  </h3>
                  <div className="space-y-3 max-h-48 overflow-y-auto custom-scrollbar">
                    {categorias.map((categoria) => (
                      <label key={categoria.id_categoria} className="flex items-center group cursor-pointer">
                        <input
                          type="checkbox"
                          checked={categoriasSelecionadas.includes(categoria.nome)}
                          onChange={() => toggleCategoria(categoria.nome)}
                          className="rounded-md border-slate-300 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 transition-all duration-200"
                        />
                        <span className="ml-3 text-sm text-slate-700 group-hover:text-slate-900 transition-colors duration-200 flex-1">
                          {categoria.nome}
                        </span>
                        <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
                          {produtos.filter((p) => p.categoria_nome === categoria.nome).length}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Faixa de Preço */}
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    Faixa de Preço
                  </h3>
                  <div className="flex space-x-3">
                    <div className="flex-1">
                      <input
                        type="number"
                        placeholder="Mínimo"
                        value={faixaPreco.min}
                        onChange={(e) => setFaixaPreco((prev) => ({ ...prev, min: e.target.value }))}
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm transition-all duration-200 text-sm"
                      />
                    </div>
                    <div className="flex-1">
                      <input
                        type="number"
                        placeholder="Máximo"
                        value={faixaPreco.max}
                        onChange={(e) => setFaixaPreco((prev) => ({ ...prev, max: e.target.value }))}
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm transition-all duration-200 text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Marcas */}
                {marcasDisponiveis.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center">
                      <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                      Marcas
                    </h3>
                    <div className="space-y-3 max-h-48 overflow-y-auto custom-scrollbar">
                      {marcasDisponiveis.map((marca) => (
                        <label key={marca} className="flex items-center group cursor-pointer">
                          <input
                            type="checkbox"
                            checked={marcasSelecionadas.includes(marca)}
                            onChange={() => toggleMarca(marca)}
                            className="rounded-md border-slate-300 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 transition-all duration-200"
                          />
                          <span className="ml-3 text-sm text-slate-700 group-hover:text-slate-900 transition-colors duration-200 flex-1">
                            {marca}
                          </span>
                          <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
                            {produtos.filter((p) => p.marca === marca).length}
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
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 mb-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => setMostrarFiltros(!mostrarFiltros)}
                      className="lg:hidden flex items-center px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all duration-200 font-medium"
                    >
                      <Filter size={16} className="mr-2" />
                      Filtros
                      {temFiltrosAtivos && <span className="ml-2 w-2 h-2 bg-blue-500 rounded-full"></span>}
                    </button>

                    <div className="flex items-center space-x-2">
                      <TrendingUp size={16} className="text-blue-600" />
                      <span className="text-sm font-medium text-slate-700">
                        {produtosFiltrados.length}{" "}
                        {produtosFiltrados.length === 1 ? "produto encontrado" : "produtos encontrados"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    {/* Ordenação */}
                    <div className="flex items-center space-x-3">
                      <ArrowUpDown size={16} className="text-slate-400" />
                      <select
                        value={ordenacao}
                        onChange={(e) => setOrdenacao(e.target.value as OrdenacaoTipo)}
                        className="border border-slate-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm font-medium"
                      >
                        <option value="nome">Nome A-Z</option>
                        <option value="preco_asc">Menor preço</option>
                        <option value="preco_desc">Maior preço</option>
                        <option value="mais_recente">Mais recentes</option>
                      </select>
                    </div>

                    {/* Tipo de visualização */}
                    <div className="flex border border-slate-200 rounded-xl overflow-hidden bg-white/50 backdrop-blur-sm">
                      <button
                        onClick={() => setTipoVisualizacao("grid")}
                        className={`p-3 transition-all duration-200 ${
                          tipoVisualizacao === "grid"
                            ? "bg-blue-600 text-white shadow-md"
                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                        }`}
                      >
                        <Grid3X3 size={16} />
                      </button>
                      <button
                        onClick={() => setTipoVisualizacao("lista")}
                        className={`p-3 transition-all duration-200 ${
                          tipoVisualizacao === "lista"
                            ? "bg-blue-600 text-white shadow-md"
                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                        }`}
                      >
                        <List size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Lista de produtos */}
              {produtosPaginados.length === 0 ? (
                <div className="text-center py-16">
                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-12 max-w-md mx-auto">
                    <Package className="mx-auto h-20 w-20 text-slate-400 mb-6" />
                    <h3 className="text-xl font-bold text-slate-900 mb-3">Nenhum produto encontrado</h3>
                    <p className="text-slate-600 mb-6">
                      Tente ajustar os filtros ou termos de busca para encontrar o que procura.
                    </p>
                    <button
                      onClick={limparFiltros}
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    >
                      Limpar filtros
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Grid de produtos */}
                  <div
                    className={
                      tipoVisualizacao === "grid"
                        ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                        : "space-y-6"
                    }
                  >
                    {produtosPaginados.map((produto) => (
                      <div
                        key={produto.id_produto}
                        className={`bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 group ${
                          tipoVisualizacao === "lista" ? "flex p-6" : "overflow-hidden"
                        }`}
                      >
                        {tipoVisualizacao === "grid" ? (
                          // Visualização em grid
                          <>
                            <div
                              className="aspect-[4/3] bg-gradient-to-br from-slate-100 to-slate-200 relative overflow-hidden cursor-pointer"
                              onClick={() => navigate(`/produto/${produto.id_produto}`)}
                            >
                              {produto.imagemUrl ? (
                                <img
                                  src={`http://localhost:3000/produtos${produto.imagemUrl}`}
                                  alt={produto.nome}
                                  className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Package className="h-16 w-16 text-slate-400" />
                                </div>
                              )}

                              {/* Badge de estoque baixo */}
                              {produto.estoque <= 5 && produto.estoque > 0 && (
                                <div className="absolute top-3 left-3 bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                                  Últimas unidades
                                </div>
                              )}
                            </div>

                            <div className="p-6">
                              <div className="mb-4">
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                                  {produto.categoria_nome}
                                </span>
                              </div>
                              <h3
                                className="font-bold text-slate-900 mb-3 line-clamp-2 text-lg group-hover:text-blue-600 transition-colors duration-200 cursor-pointer"
                                onClick={() => navigate(`/produto/${produto.id_produto}`)}
                              >
                                {produto.nome}
                              </h3>
                              {produto.marca && (
                                <p className="text-sm text-slate-600 mb-4 font-medium">{produto.marca}</p>
                              )}

                              <div className="mb-4">
                                <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                  {formatarPreco(produto.preco)}
                                </span>
                              </div>

                              <div className="mb-6">
                                <span
                                  className={`inline-block text-xs font-medium px-3 py-1 rounded-full ${
                                    produto.estoque > 10
                                      ? "bg-green-100 text-green-800"
                                      : produto.estoque > 0
                                        ? "bg-orange-100 text-orange-800"
                                        : "bg-red-100 text-red-800"
                                  }`}
                                >
                                  {produto.estoque > 0 ? `${produto.estoque} em estoque` : "Esgotado"}
                                </span>
                              </div>

                              {/* Botões de ação */}
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => navigate(`/produto/${produto.id_produto}`)}
                                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-xl font-medium transition-all duration-200 text-sm"
                                >
                                  Ver Detalhes
                                </button>
                                <button
                                  onClick={() => adicionarAoCarrinho(produto.id_produto, 1)}
                                  disabled={produto.estoque <= 0}
                                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 p-2 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                  title="Adicionar ao carrinho"
                                >
                                  <ShoppingCart size={16} />
                                </button>
                              </div>
                            </div>
                          </>
                        ) : (
                          // Visualização em lista
                          <>
                            <div
                              className="w-32 h-24 bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl flex-shrink-0 mr-6 overflow-hidden cursor-pointer"
                              onClick={() => navigate(`/produto/${produto.id_produto}`)}
                            >
                              {produto.imagemUrl ? (
                                <img
                                  src={`http://localhost:3000/produtos${produto.imagemUrl}`}
                                  alt={produto.nome}
                                  className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Package className="h-12 w-12 text-slate-400" />
                                </div>
                              )}
                            </div>

                            <div className="flex-1">
                              <div className="flex items-start justify-between h-full">
                                <div className="flex-1 pr-4">
                                  <div className="mb-2">
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                                      {produto.categoria_nome}
                                    </span>
                                  </div>
                                  <h3
                                    className="font-bold text-slate-900 mb-2 text-xl group-hover:text-blue-600 transition-colors duration-200 cursor-pointer"
                                    onClick={() => navigate(`/produto/${produto.id_produto}`)}
                                  >
                                    {produto.nome}
                                  </h3>
                                  {produto.marca && (
                                    <p className="text-sm text-slate-600 mb-3 font-medium">{produto.marca}</p>
                                  )}
                                  <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed">
                                    {produto.descricao}
                                  </p>
                                </div>

                                <div className="text-right flex flex-col items-end justify-between h-full">
                                  <div className="mb-4">
                                    <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                                      {formatarPreco(produto.preco)}
                                    </div>
                                    <span
                                      className={`text-xs font-medium px-2 py-1 rounded-full ${
                                        produto.estoque > 10
                                          ? "bg-green-100 text-green-800"
                                          : produto.estoque > 0
                                            ? "bg-orange-100 text-orange-800"
                                            : "bg-red-100 text-red-800"
                                      }`}
                                    >
                                      {produto.estoque > 0 ? `${produto.estoque} em estoque` : "Esgotado"}
                                    </span>
                                  </div>
                                  <div className="flex flex-col space-y-2">
                                    <button
                                      onClick={() => navigate(`/produto/${produto.id_produto}`)}
                                      className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-xl font-medium transition-all duration-200 text-sm"
                                    >
                                      Ver Detalhes
                                    </button>
                                    <button
                                      onClick={() => adicionarAoCarrinho(produto.id_produto, 1)}
                                      disabled={produto.estoque <= 0}
                                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 p-2 rounded-xl transition-all duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
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
                    <div className="mt-12 flex justify-center">
                      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-2">
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => setPaginaAtual((prev) => Math.max(prev - 1, 1))}
                            disabled={paginaAtual === 1}
                            className="px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
                          >
                            Anterior
                          </button>

                          {Array.from({ length: Math.min(totalPaginas, 7) }, (_, i) => {
                            let pagina: number
                            if (totalPaginas <= 7) {
                              pagina = i + 1
                            } else if (paginaAtual <= 4) {
                              pagina = i + 1
                            } else if (paginaAtual >= totalPaginas - 3) {
                              pagina = totalPaginas - 6 + i
                            } else {
                              pagina = paginaAtual - 3 + i
                            }

                            return (
                              <button
                                key={pagina}
                                onClick={() => setPaginaAtual(pagina)}
                                className={`px-4 py-2 rounded-xl transition-all duration-200 font-medium ${
                                  pagina === paginaAtual
                                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg"
                                    : "border border-slate-200 hover:bg-slate-50 text-slate-700"
                                }`}
                              >
                                {pagina}
                              </button>
                            )
                          })}

                          <button
                            onClick={() => setPaginaAtual((prev) => Math.min(prev + 1, totalPaginas))}
                            disabled={paginaAtual === totalPaginas}
                            className="px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
                          >
                            Próxima
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </Layout>
  )
}

export default ListagemProdutos