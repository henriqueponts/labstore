"use client"

import type React from "react"
import { useState, useEffect } from "react"
import axios from "axios"
import Layout from "../components/Layout"
import { useNavigate, useParams } from "react-router-dom"
import { ShoppingCart, Share2, ChevronLeft, ChevronRight, Plus, Minus, Check, AlertCircle, Home, ChevronRightSquare as ChevronRightBreadcrumb, Zap, Calendar, Palette, Tag, Package, Weight, Ruler, Award, Hash } from 'lucide-react'
import { useCart } from "../context/CartContext" // <-- IMPORTADO
import { useAlert } from "../components/Alert-container"

interface ImagemProduto {
  id_imagem: number
  url_imagem: string
  nome_arquivo: string
  ordem: number
  is_principal: boolean
}

interface Produto {
  id_produto: number
  nome: string
  descricao: string
  preco: number
  marca: string
  marca_nome?: string
  modelo: string
  estoque: number
  id_categoria: number
  compatibilidade: string
  cor: string
  ano_fabricacao: number
  status: "ativo" | "inativo"
  categoria_nome: string
  imagens: ImagemProduto[]
  peso_kg: number | null
  altura_cm: number | null
  largura_cm: number | null
  comprimento_cm: number | null
}

const VisualizarProduto: React.FC = () => {
  const navegar = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [produto, setProduto] = useState<Produto | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [imagemAtual, setImagemAtual] = useState(0)
  const [quantidade, setQuantidade] = useState(1)
  const [adicionandoCarrinho, setAdicionandoCarrinho] = useState(false)
  const { adicionarAoCarrinho: adicionarProdutoAoCarrinho } = useCart()
  const { showErro, showAviso, showSucesso } = useAlert();

  // Carregar dados do produto
  const buscarProduto = async () => {
    try {
      const resposta = await axios.get(`http://localhost:3000/produtos/produtos/${id}`)
      setProduto(resposta.data)
    } catch (err) {
      console.error("Erro ao carregar produto:", err)
      if (axios.isAxiosError(err) && err.response?.status === 404) {
        showAviso("Produto não encontrado")
        navegar("/")
      } else {
        showErro("Erro ao carregar produto")
      }
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    if (!id) {
      navegar("/")
      return
    }
    buscarProduto()
  }, [id])

  // Formatar preço
  const formatarPreco = (preco: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(preco)
  }

  // Navegar entre imagens
  const proximaImagem = () => {
    if (produto?.imagens) {
      setImagemAtual((atual) => (atual + 1) % produto.imagens.length)
    }
  }

  const imagemAnterior = () => {
    if (produto?.imagens) {
      setImagemAtual((atual) => (atual - 1 + produto.imagens.length) % produto.imagens.length)
    }
  }

  // Alterar quantidade
  const alterarQuantidade = (novaQuantidade: number) => {
    if (novaQuantidade >= 1 && novaQuantidade <= (produto?.estoque || 0)) {
      setQuantidade(novaQuantidade)
    }
  }

  // Adicionar ao carrinho
  const adicionarAoCarrinho = async () => {
    if (!produto) return

    setAdicionandoCarrinho(true)
    try {
      await adicionarProdutoAoCarrinho(produto.id_produto, quantidade)
    } catch (err) {
      // O tratamento de erro já está no context, mas pode adicionar lógica extra aqui se quiser
      console.error("Erro ao adicionar ao carrinho (componente):", err)
    } finally {
      setAdicionandoCarrinho(false)
    }
  }

  const comprarAgora = async () => {
    if (!produto) return

    setAdicionandoCarrinho(true)
    try {
      await adicionarProdutoAoCarrinho(produto.id_produto, quantidade)
      // Redireciona para o carrinho após adicionar
      navegar('/carrinho')
    } catch (err) {
      console.error("Erro ao comprar agora:", err)
    } finally {
      setAdicionandoCarrinho(false)
    }
  }

  // Compartilhar produto
  const compartilharProduto = async () => {
    if (navigator.share && produto) {
      try {
        await navigator.share({
          title: produto.nome,
          text: produto.descricao,
          url: window.location.href,
        })
      } catch (err) {
        console.log("Erro ao compartilhar:", err)
      }
    } else {
      // Fallback: copiar URL
      navigator.clipboard.writeText(window.location.href)
      showSucesso("Link copiado para a área de transferência!")
    }
  }

  if (carregando) {
    return (
      <Layout showLoading={true}>
        <div></div>
      </Layout>
    )
  }

  if (!produto) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 py-8 text-center">
          <AlertCircle className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Produto não encontrado</h2>
          <p className="text-gray-600 mb-6">O produto que você está procurando não existe ou foi removido.</p>
          <button
            onClick={() => navegar("/")}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Voltar à página inicial
          </button>
        </div>
      </Layout>
    )
  }

  const imagemPrincipal = produto.imagens?.[imagemAtual] || null

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-8">
          <button onClick={() => navegar("/")} className="hover:text-blue-600 transition-colors">
            <Home size={16} />
          </button>
          <ChevronRightBreadcrumb size={16} />
          <span className="hover:text-blue-600 cursor-pointer">{produto.categoria_nome}</span>
          <ChevronRightBreadcrumb size={16} />
          <span className="text-gray-900 font-medium truncate">{produto.nome}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Galeria de Imagens */}
          <div className="space-y-4">
            {/* Imagem Principal */}
            <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden group">
              {imagemPrincipal ? (
                <img
                  src={
                    imagemPrincipal.url_imagem
                      ? `http://localhost:3000/produtos${imagemPrincipal.url_imagem}`
                      : "/placeholder.svg"
                  }
                  alt={produto.nome}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="h-24 w-24 text-gray-400" />
                </div>
              )}

              {/* Navegação de Imagens */}
              {produto.imagens && produto.imagens.length > 1 && (
                <>
                  <button
                    onClick={imagemAnterior}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    onClick={proximaImagem}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <ChevronRight size={20} />
                  </button>
                </>
              )}

              {/* Indicadores */}
              {produto.imagens && produto.imagens.length > 1 && (
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                  {produto.imagens.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setImagemAtual(index)}
                      className={`w-2 h-2 rounded-full transition-colors ${index === imagemAtual ? "bg-white" : "bg-white/50"
                        }`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Miniaturas */}
            {produto.imagens && produto.imagens.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {produto.imagens.slice(0, 4).map((imagem, index) => (
                  <button
                    key={imagem.id_imagem}
                    onClick={() => setImagemAtual(index)}
                    className={`aspect-square bg-gray-100 rounded-lg overflow-hidden border-2 transition-colors ${index === imagemAtual ? "border-blue-500" : "border-transparent hover:border-gray-300"
                      }`}
                  >
                    <img
                      src={
                        imagem.url_imagem ? `http://localhost:3000/produtos${imagem.url_imagem}` : "/placeholder.svg"
                      }
                      alt={`${produto.nome} - Imagem ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Informações do Produto */}
          <div className="space-y-6">
            {/* Cabeçalho */}
            <div>
              <div className="flex items-start justify-between mb-2">
                <h1 className="text-3xl font-bold text-gray-900">{produto.nome}</h1>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={compartilharProduto}
                    className="p-2 rounded-full text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-colors"
                  >
                    <Share2 size={20} />
                  </button>
                </div>
              </div>

              {(produto.marca_nome || produto.marca) && (
                <p className="text-lg text-gray-600 mb-2">
                  {produto.marca_nome || produto.marca} {produto.modelo && `- ${produto.modelo}`}
                </p>
              )}
            </div>

            {/* Preço */}
            <div className="border-t border-b border-gray-200 py-6">
              <div className="flex items-baseline space-x-2 mb-2">
                <span className="text-3xl font-bold text-gray-900">{formatarPreco(produto.preco)}</span>
              </div>
            </div>

            {/* Status do Estoque */}
            <div className="flex items-center space-x-2">
              {produto.estoque > 0 ? (
                <>
                  <Check className="text-green-600" size={20} />
                  <span className="text-green-600 font-medium">
                    Em estoque ({produto.estoque} {produto.estoque === 1 ? "unidade" : "unidades"})
                  </span>
                </>
              ) : (
                <>
                  <AlertCircle className="text-red-600" size={20} />
                  <span className="text-red-600 font-medium">Produto esgotado</span>
                </>
              )}
            </div>

            {/* Seletor de Quantidade e Botões */}
            {produto.estoque > 0 && (
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <span className="text-sm font-medium text-gray-700">Quantidade:</span>
                  <div className="flex items-center border border-gray-300 rounded-lg">
                    <button
                      onClick={() => alterarQuantidade(quantidade - 1)}
                      disabled={quantidade <= 1}
                      className="p-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Minus size={16} />
                    </button>
                    <span className="px-4 py-2 font-medium">{quantidade}</span>
                    <button
                      onClick={() => alterarQuantidade(quantidade + 1)}
                      disabled={quantidade >= produto.estoque}
                      className="p-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>

                <div className="flex space-x-4">
                  <button
                    onClick={adicionarAoCarrinho}
                    disabled={adicionandoCarrinho}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {adicionandoCarrinho ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Adicionando...
                      </>
                    ) : (
                      <>
                        <ShoppingCart size={20} className="mr-2" />
                        Adicionar ao Carrinho
                      </>
                    )}
                  </button>
                  <button 
                    onClick={comprarAgora}
                    disabled={adicionandoCarrinho}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {adicionandoCarrinho ? 'Processando...' : 'Comprar Agora'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Seção de Detalhes */}
        <div className="mt-16 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Descrição */}
          <div className="lg:col-span-2 space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Descrição do Produto</h2>
              {/* ADICIONADO break-words AQUI */}
              <div className="text-gray-700 leading-relaxed break-words">
                {produto.descricao.split('\n').map((linha, index) => (
                  <span key={index} className="block">
                    {linha || <>&nbsp;</>}
                  </span>
                ))}
              </div>
            </div>

            {/* Especificações (antiga Compatibilidade) */}
            {produto.compatibilidade && (
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3 flex items-center">
                  <Zap className="mr-2" size={20} />
                  Especificações
                </h3>
                <div className="text-gray-700 break-words">
                  {produto.compatibilidade.split('\n').map((linha, index) => (
                    <span key={index} className="block">
                      {linha || <>&nbsp;</>}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Informações do Produto (antiga Especificações) */}
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Informações do Produto</h3>
            <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-200">
              {(produto.marca_nome || produto.marca) && (
                <div className="px-4 py-3 flex justify-between">
                  <span className="text-sm font-medium text-gray-600 flex items-center">
                    <Award size={14} className="mr-1" />
                    Marca
                  </span>
                  <span className="text-sm text-gray-900">{produto.marca_nome || produto.marca}</span>
                </div>
              )}
              {produto.modelo && (
                <div className="px-4 py-3 flex justify-between">
                  <span className="text-sm font-medium text-gray-600 flex items-center">
                    <Hash size={14} className="mr-1" />
                    Modelo
                  </span>
                  <span className="text-sm text-gray-900">{produto.modelo}</span>
                </div>
              )}
              {produto.cor && (
                <div className="px-4 py-3 flex justify-between">
                  <span className="text-sm font-medium text-gray-600 flex items-center">
                    <Palette size={14} className="mr-1" />
                    Cor
                  </span>
                  <span className="text-sm text-gray-900">{produto.cor}</span>
                </div>
              )}
              {produto.ano_fabricacao && (
                <div className="px-4 py-3 flex justify-between">
                  <span className="text-sm font-medium text-gray-600 flex items-center">
                    <Calendar size={14} className="mr-1" />
                    Ano
                  </span>
                  <span className="text-sm text-gray-900">{produto.ano_fabricacao}</span>
                </div>
              )}

              <div className="px-4 py-3 flex justify-between">
                <span className="text-sm font-medium text-gray-600 flex items-center">
                  <Tag size={14} className="mr-1" />
                  Categoria
                </span>
                <span className="text-sm text-gray-900">{produto.categoria_nome}</span>
              </div>
            </div>

            {(produto.peso_kg || produto.altura_cm) && (
              <div className="mt-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Informações de Envio</h3>
                <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-200">
                  {produto.peso_kg && (
                    <div className="px-4 py-3 flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600 flex items-center">
                        <Weight size={14} className="mr-2" /> Peso
                      </span>
                      <span className="text-sm text-gray-900">{produto.peso_kg} kg</span>
                    </div>
                  )}
                  {produto.altura_cm && produto.largura_cm && produto.comprimento_cm && (
                    <div className="px-4 py-3 flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600 flex items-center">
                        <Ruler size={14} className="mr-2" /> Dimensões
                      </span>
                      <span className="text-sm text-gray-900">
                        {produto.altura_cm}cm (A) x {produto.largura_cm}cm (L) x {produto.comprimento_cm}cm (C)
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default VisualizarProduto
