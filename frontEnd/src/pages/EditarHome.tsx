"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import Layout from "../components/Layout"
import { Save, Upload, Eye, EyeOff, ImageIcon, Package, ExternalLink, Loader2 } from "lucide-react"

interface CarouselImage {
  id_carousel: number
  titulo: string
  subtitulo: string
  url_imagem: string | null
  link_destino?: string
  ordem: number
  ativo: boolean | number // Pode vir como boolean ou number do banco
}

interface Produto {
  id_produto: number
  nome: string
  preco: number
  marca: string
  imagemUrl: string | null
  categoria_nome: string
  estoque: number
}

const EditarHome: React.FC = () => {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingImages, setUploadingImages] = useState<{ [key: number]: boolean }>({})
  const [carouselImages, setCarouselImages] = useState<CarouselImage[]>([])
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [produtosDestaque, setProdutosDestaque] = useState<number[]>([])
  const navigate = useNavigate()

  // Refs para inputs de arquivo
  const fileInputRefs = useRef<{ [key: number]: HTMLInputElement | null }>({})

  // Função para normalizar o valor booleano (MySQL pode retornar 0/1)
  const normalizeBoolean = (value: boolean | number): boolean => {
    return Boolean(value)
  }

  // Carregar dados da home
  const loadHomeData = async () => {
    try {
      // Verificar autenticação
      const token = localStorage.getItem("token")
      if (!token) {
        navigate("/login")
        return
      }

      // Verificar se é admin ou analista
      const response = await axios.get("http://localhost:3000/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      })

      const userData = response.data
      if (userData.tipo !== "funcionario" || !["admin", "analista"].includes(userData.tipo_perfil)) {
        navigate("/")
        return
      }

      // Carregar imagens do carrossel do banco
      try {
        const carouselResponse = await axios.get("http://localhost:3000/api/carousel")
        // Normalizar valores booleanos e ordenar por ordem crescente
        const sortedImages = carouselResponse.data
          .map((img: CarouselImage) => ({
            ...img,
            ativo: normalizeBoolean(img.ativo), // Normalizar boolean
          }))
          .sort((a: CarouselImage, b: CarouselImage) => a.ordem - b.ordem)

        setCarouselImages(sortedImages)
        console.log("🎠 Imagens carregadas e normalizadas:", sortedImages)
      } catch (err) {
        console.error("Erro ao carregar carrossel:", err)
        setCarouselImages([])
      }

      // Carregar produtos
      const produtosResponse = await axios.get("http://localhost:3000/produtos/produtos")
      const produtosAtivos = produtosResponse.data.filter((p: Produto) => p.estoque > 0)
      setProdutos(produtosAtivos)

      // Carregar produtos em destaque salvos ou usar padrão
      const produtosDestaqueSalvos = localStorage.getItem("produtosDestaque")
      if (produtosDestaqueSalvos) {
        const idsDestaque = JSON.parse(produtosDestaqueSalvos)
        setProdutosDestaque(idsDestaque)
      } else {
        setProdutosDestaque(produtosAtivos.slice(0, 8).map((p: Produto) => p.id_produto))
      }
    } catch (err) {
      console.error("Erro ao carregar dados:", err)
      navigate("/login")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadHomeData()
  }, [])

  // Função para lidar com upload de arquivo
  const handleFileUpload = async (imageId: number, file: File) => {
    if (!file || !file.type.startsWith("image/")) {
      alert("Por favor, selecione apenas arquivos de imagem.")
      return
    }

    setUploadingImages((prev) => ({ ...prev, [imageId]: true }))

    try {
      const formData = new FormData()
      formData.append("imagem", file)

      const image = carouselImages.find((img) => img.id_carousel === imageId)
      if (image) {
        formData.append("titulo", image.titulo)
        formData.append("subtitulo", image.subtitulo)
        formData.append("link_destino", image.link_destino || "")
        formData.append("ordem", image.ordem.toString())
        formData.append("ativo", image.ativo.toString())

        const response = await axios.put(`http://localhost:3000/api/carousel/${imageId}`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        })

        // Normalizar resposta e atualizar estado
        const updatedImage = {
          ...response.data,
          ativo: normalizeBoolean(response.data.ativo),
        }

        setCarouselImages((prev) => prev.map((img) => (img.id_carousel === imageId ? updatedImage : img)))

        alert("Imagem carregada com sucesso!")
      }
    } catch (error) {
      console.error("Erro ao fazer upload:", error)
      alert("Erro ao carregar imagem. Tente novamente.")
    } finally {
      setUploadingImages((prev) => ({ ...prev, [imageId]: false }))
    }
  }

  // Atualizar imagem do carrossel
  const updateCarouselImage = async (id: number, field: keyof CarouselImage, value: any) => {
    try {
      console.log(`🔄 Atualizando campo "${field}" da imagem ${id} para:`, value)

      const image = carouselImages.find((img) => img.id_carousel === id)
      if (!image) {
        console.error(`❌ Imagem ${id} não encontrada`)
        return
      }

      // Criar objeto com todos os dados da imagem, atualizando apenas o campo específico
      const updatedData = {
        titulo: field === "titulo" ? value : image.titulo,
        subtitulo: field === "subtitulo" ? value : image.subtitulo,
        link_destino: field === "link_destino" ? value : image.link_destino,
        ordem: field === "ordem" ? value : image.ordem,
        ativo: field === "ativo" ? value : image.ativo,
      }

      console.log(`📝 Enviando dados para API:`, updatedData)

      const response = await axios.put(`http://localhost:3000/api/carousel/${id}`, updatedData)

      console.log(`✅ Resposta da API:`, response.data)

      // Normalizar resposta e atualizar estado IMEDIATAMENTE
      const updatedImage = {
        ...response.data,
        ativo: normalizeBoolean(response.data.ativo),
      }

      setCarouselImages((prev) => prev.map((img) => (img.id_carousel === id ? updatedImage : img)))

      // Feedback visual específico para mudança de status
      if (field === "ativo") {
        const status = value ? "ativada" : "inativada"
        const statusEmoji = value ? "✅" : "❌"
        console.log(`🎯 Imagem "${image.titulo}" foi ${status}`)

        // Mostrar toast/feedback visual
        const message = `${statusEmoji} "${image.titulo}" foi ${status} com sucesso!`

        // Criar elemento de feedback temporário
        const feedbackDiv = document.createElement("div")
        feedbackDiv.innerHTML = message
        feedbackDiv.style.cssText = `
          position: fixed;
          top: 20px;
          right: 20px;
          background: ${value ? "#10B981" : "#EF4444"};
          color: white;
          padding: 12px 20px;
          border-radius: 8px;
          font-weight: 500;
          z-index: 9999;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          animation: slideIn 0.3s ease-out;
        `

        // Adicionar animação CSS
        const style = document.createElement("style")
        style.textContent = `
          @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }
        `
        document.head.appendChild(style)
        document.body.appendChild(feedbackDiv)

        // Remover após 3 segundos
        setTimeout(() => {
          feedbackDiv.remove()
          style.remove()
        }, 3000)
      }
    } catch (error) {
      console.error("❌ Erro ao atualizar slide:", error)
      if (typeof error === "object" && error !== null && "response" in error) {
        // @ts-expect-error: error is unknown, but we checked for response
        console.error("📊 Detalhes do erro:", error.response.data)
        // @ts-expect-error: error is unknown, but we checked for response
        alert(`Erro ao atualizar slide. Detalhes: ${error.response?.data?.message || error.message}`)
      } else {
        alert(`Erro ao atualizar slide. Detalhes: ${error instanceof Error ? error.message : String(error)}`)
      }
    }
  }

  // Toggle produto em destaque
  const toggleProdutoDestaque = (produtoId: number) => {
    setProdutosDestaque((prev) => {
      if (prev.includes(produtoId)) {
        return prev.filter((id) => id !== produtoId)
      } else {
        return [...prev, produtoId]
      }
    })
  }

  // Validar URL
  const isValidUrl = (url: string) => {
    if (!url) return true
    try {
      if (url.startsWith("/")) return true
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  // Função para construir URL da imagem para preview
  const getImageUrl = (image: CarouselImage) => {
    if (!image.url_imagem) return null

    // Se já é uma URL completa, usar diretamente
    if (image.url_imagem.startsWith("http")) {
      return image.url_imagem
    }

    // Se começa com /, construir URL completa
    if (image.url_imagem.startsWith("/")) {
      return `http://localhost:3000${image.url_imagem}`
    }

    // Caso contrário, assumir que é um caminho relativo
    return `http://localhost:3000/uploads/carousel/${image.url_imagem}`
  }

  // Salvar alterações
  const handleSave = async () => {
    // Validar dados antes de salvar
    const invalidImages = carouselImages.filter(
      (img) =>
        normalizeBoolean(img.ativo) &&
        (!img.titulo.trim() || !img.subtitulo.trim() || (img.link_destino && !isValidUrl(img.link_destino))),
    )

    if (invalidImages.length > 0) {
      alert(
        "Por favor, preencha todos os campos obrigatórios dos slides ativos e verifique se os links estão corretos.",
      )
      return
    }

    setSaving(true)
    try {
      // Salvar produtos em destaque no localStorage
      localStorage.setItem("produtosDestaque", JSON.stringify(produtosDestaque))

      // Simular delay
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // ✅ CÁLCULO CORRETO - Normalizar valores booleanos
      const slidesAtivos = carouselImages.filter((img) => normalizeBoolean(img.ativo))
      const totalSlides = slidesAtivos.length
      const totalProdutos = produtosDestaque.length

      // Primeira imagem ativa ordenada por ordem
      const primeiraImagem = slidesAtivos.sort((a, b) => a.ordem - b.ordem)[0]

      const message = `Alterações salvas com sucesso!\n\n• ${totalSlides} slide(s) ativo(s) no carrossel\n• ${totalProdutos} produto(s) em destaque\n• Primeira imagem: "${primeiraImagem?.titulo || "Nenhuma"}"`

      alert(message)
      navigate("/")
    } catch (err) {
      console.error("Erro ao salvar:", err)
      alert("Erro ao salvar alterações. Tente novamente.")
    } finally {
      setSaving(false)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(price)
  }

  return (
    <Layout showLoading={loading}>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Editar Página Inicial</h1>
                <p className="text-gray-600 mt-2">Gerencie o carrossel de imagens e produtos em destaque</p>
              </div>
              <div className="flex space-x-4">
                <button
                  onClick={() => navigate("/")}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Salvar Alterações
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Carrossel de Imagens */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Carrossel de Imagens</h2>
              <p className="text-sm text-gray-600 mt-1">
                A ordem das imagens é definida pelo campo "Posição". A primeira imagem (posição 1) será exibida primeiro
                no carrossel.
              </p>
            </div>

            <div className="space-y-6">
              {carouselImages.map((image) => {
                const isActive = normalizeBoolean(image.ativo)
                return (
                  <div
                    key={image.id_carousel}
                    className={`border rounded-lg p-4 transition-all duration-200 ${
                      !isActive ? "opacity-75 bg-gray-50 border-gray-300" : "border-gray-200"
                    }`}
                  >
                    {/* Input de arquivo oculto */}
                    <input
                      type="file"
                      ref={(el) => {
                        fileInputRefs.current[image.id_carousel] = el
                      }}
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          handleFileUpload(image.id_carousel, file)
                        }
                      }}
                      accept="image/*"
                      className="hidden"
                    />

                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <span className="text-sm font-medium text-gray-600">Posição {image.ordem}</span>

                        <h3 className="text-lg font-medium text-gray-900">
                          {image.titulo}
                          {!isActive && <span className="ml-2 text-sm text-red-500 font-medium">(INATIVO)</span>}
                        </h3>
                      </div>

                      <div className="flex items-center space-x-2">
                        {/* Toggle ativo/inativo - VERSÃO SIMPLES */}
                        <button
                          onClick={() =>
                            updateCarouselImage(image.id_carousel, "ativo", !normalizeBoolean(image.ativo))
                          }
                          className={`p-2 rounded-lg transition-colors ${
                            normalizeBoolean(image.ativo)
                              ? "text-green-600 hover:bg-red-50 hover:text-red-600"
                              : "text-gray-400 hover:bg-green-50 hover:text-green-600"
                          }`}
                          title={normalizeBoolean(image.ativo) ? "Inativar" : "Ativar"}
                        >
                          {normalizeBoolean(image.ativo) ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Imagem *</label>
                        <div className="flex">
                          <div className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg bg-gray-50 text-gray-500 text-sm">
                            {image.url_imagem ? "Imagem carregada" : "Nenhuma imagem"}
                          </div>
                          <button
                            onClick={() => fileInputRefs.current[image.id_carousel]?.click()}
                            disabled={uploadingImages[image.id_carousel]}
                            className="px-3 py-2 bg-blue-600 text-white border border-l-0 border-blue-600 rounded-r-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                            title="Alterar imagem"
                          >
                            {uploadingImages[image.id_carousel] ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Upload className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Link de Destino
                          {image.link_destino && (
                            <a
                              href={image.link_destino}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ml-2 text-blue-600 hover:text-blue-800"
                              title="Testar link"
                            >
                              <ExternalLink className="h-3 w-3 inline" />
                            </a>
                          )}
                        </label>
                        <input
                          type="text"
                          value={image.link_destino || ""}
                          onChange={(e) => updateCarouselImage(image.id_carousel, "link_destino", e.target.value)}
                          placeholder="/produtos ou https://exemplo.com"
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            image.link_destino && !isValidUrl(image.link_destino) ? "border-red-300" : "border-gray-300"
                          }`}
                        />
                        {image.link_destino && !isValidUrl(image.link_destino) && (
                          <p className="text-red-500 text-xs mt-1">URL inválida</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Título *</label>
                        <input
                          type="text"
                          value={image.titulo}
                          onChange={(e) => updateCarouselImage(image.id_carousel, "titulo", e.target.value)}
                          placeholder="Título do slide"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Subtítulo *</label>
                        <input
                          type="text"
                          value={image.subtitulo}
                          onChange={(e) => updateCarouselImage(image.id_carousel, "subtitulo", e.target.value)}
                          placeholder="Subtítulo do slide"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                      </div>
                    </div>

                    {/* Preview da imagem */}
                    {image.url_imagem && (
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Preview</label>
                        <div className="relative h-32 bg-gray-100 rounded-lg overflow-hidden">
                          <img
                            src={getImageUrl(image) || "/placeholder.svg"}
                            alt={image.titulo}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.style.display = "none"
                            }}
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                            <div className="text-center text-white">
                              <h4 className="font-semibold">{image.titulo}</h4>
                              <p className="text-sm">{image.subtitulo}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}

              {carouselImages.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <ImageIcon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>Nenhuma imagem no carrossel encontrada.</p>
                </div>
              )}
            </div>

            {/* Resumo da ordem - APENAS SLIDES ATIVOS */}
            {carouselImages.length > 0 && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">📋 Slides Ativos (Ordem de Exibição):</h3>
                <div className="space-y-1">
                  {carouselImages
                    .filter((img) => normalizeBoolean(img.ativo))
                    .sort((a, b) => a.ordem - b.ordem)
                    .map((img, index) => (
                      <div key={img.id_carousel} className="flex items-center space-x-2 text-sm">
                        <span className="font-medium text-gray-600">{index + 1}°</span>
                        <span className="text-gray-900">{img.titulo}</span>
                        <span className="text-gray-500">(Posição {img.ordem})</span>
                      </div>
                    ))}
                  {carouselImages.filter((img) => normalizeBoolean(img.ativo)).length === 0 && (
                    <p className="text-gray-500 text-sm">Nenhum slide ativo no momento.</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Produtos em Destaque */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Produtos em Destaque</h2>
              <p className="text-gray-600">
                Selecione os produtos que aparecerão na seção de destaque da página inicial
              </p>
            </div>

            {produtos.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Package className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>Nenhum produto disponível.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {produtos.map((produto) => {
                  const isDestaque = produtosDestaque.includes(produto.id_produto)
                  return (
                    <div
                      key={produto.id_produto}
                      className={`border-2 rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                        isDestaque
                          ? "border-blue-500 bg-blue-50 shadow-md"
                          : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
                      }`}
                      onClick={() => toggleProdutoDestaque(produto.id_produto)}
                    >
                      <div className="aspect-square bg-gray-100 rounded-lg mb-3 overflow-hidden">
                        {produto.imagemUrl ? (
                          <img
                            src={`http://localhost:3000/produtos${produto.imagemUrl}`}
                            alt={produto.nome}
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="h-8 w-8 text-gray-400" />
                          </div>
                        )}
                      </div>

                      <div className="text-center">
                        <h4 className="font-medium text-gray-900 text-sm mb-1 line-clamp-2">{produto.nome}</h4>
                        <p className="text-xs text-gray-500 mb-2">{produto.marca}</p>
                        <p className="font-semibold text-blue-600 text-sm">{formatPrice(produto.preco)}</p>
                        <p className="text-xs text-gray-500 mt-1">{produto.estoque} em estoque</p>
                      </div>

                      <div className="mt-3 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleProdutoDestaque(produto.id_produto)
                          }}
                          className={`px-3 py-1 text-xs rounded-full font-medium transition-colors ${
                            isDestaque
                              ? "bg-blue-600 text-white hover:bg-blue-700"
                              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                          }`}
                        >
                          {isDestaque ? "Em Destaque" : "Adicionar"}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-between text-sm">
                <div className="text-blue-800">
                  <strong>{produtosDestaque.length}</strong> produto(s) selecionado(s) para destaque
                </div>
                {produtosDestaque.length > 0 && (
                  <button
                    onClick={() => setProdutosDestaque([])}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Limpar seleção
                  </button>
                )}
              </div>
              <p className="text-blue-700 text-xs mt-1">Clique nos produtos para adicionar ou remover do destaque</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default EditarHome
