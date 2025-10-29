"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import Layout from "../components/Layout"
import { Save, Upload, Eye, EyeOff, ImageIcon, Package, Loader2 } from "lucide-react"
import { useAlert } from "../components/Alert-container"

interface carrosselImage {
  id_carrossel: number
  titulo: string
  subtitulo: string
  url_imagem: string | null
  link_destino?: string
  ordem: number
  ativo: boolean | number
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
  const [carrosselImages, setcarrosselImages] = useState<carrosselImage[]>([])
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [produtosDestaque, setProdutosDestaque] = useState<number[]>([])
  const [imageErrors, setImageErrors] = useState<{ [key: number]: boolean }>({})
  const navigate = useNavigate()
  const { showErro, showAviso, showSucesso } = useAlert();

  // Refs para inputs de arquivo
  const fileInputRefs = useRef<{ [key: number]: HTMLInputElement | null }>({})

  // Função para normalizar o valor booleano
  const normalizeBoolean = (value: boolean | number): boolean => {
    return Boolean(value)
  }

  // Função para construir URL da imagem
  const getImageUrl = (image: carrosselImage) => {
    if (!image.url_imagem) return null

    if (image.url_imagem.startsWith("http")) {
      return image.url_imagem
    }

    if (image.url_imagem.startsWith("/")) {
      return `http://localhost:3000${image.url_imagem}`
    }

    return `http://localhost:3000/uploads/carrossel/${image.url_imagem}`
  }

  // Função para lidar com erro de imagem
  const handleImageError = (imageId: number) => {
    console.error(`Erro ao carregar imagem do preview ID: ${imageId}`)
    setImageErrors((prev) => ({ ...prev, [imageId]: true }))
  }

  // Carregar dados da home
  const loadHomeData = async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        navigate("/login")
        return
      }

      const response = await axios.get("http://localhost:3000/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      })

      const userData = response.data
      if (userData.tipo !== "funcionario" || !["admin", "analista"].includes(userData.tipo_perfil)) {
        navigate("/")
        return
      }

      try {
        const carrosselResponse = await axios.get("http://localhost:3000/api/carrossel")
        const sortedImages = carrosselResponse.data
          .map((img: carrosselImage) => ({
            ...img,
            ativo: normalizeBoolean(img.ativo),
          }))
          .sort((a: carrosselImage, b: carrosselImage) => a.ordem - b.ordem)

        setcarrosselImages(sortedImages)
      } catch (err) {
        console.error("Erro ao carregar carrossel:", err)
        setcarrosselImages([])
      }

      const produtosResponse = await axios.get("http://localhost:3000/produtos/produtos")
      const produtosAtivos = produtosResponse.data.filter((p: Produto) => p.estoque > 0)
      setProdutos(produtosAtivos)

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

  // Função para upload de arquivo
  const handleFileUpload = async (imageId: number, file: File) => {
    if (!file || !file.type.startsWith("image/")) {
      showAviso("Por favor, selecione apenas arquivos de imagem.")
      return
    }

    setUploadingImages((prev) => ({ ...prev, [imageId]: true }))

    try {
      const formData = new FormData()
      formData.append("imagem", file)

      const image = carrosselImages.find((img) => img.id_carrossel === imageId)
      if (image) {
        formData.append("titulo", image.titulo)
        formData.append("subtitulo", image.subtitulo)
        formData.append("link_destino", image.link_destino || "")
        formData.append("ordem", image.ordem.toString())
        formData.append("ativo", image.ativo.toString())

        const response = await axios.put(`http://localhost:3000/api/carrossel/${imageId}`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        })

        const updatedImage = {
          ...response.data,
          ativo: normalizeBoolean(response.data.ativo),
        }

        setcarrosselImages((prev) => prev.map((img) => (img.id_carrossel === imageId ? updatedImage : img)))
        setImageErrors((prev) => ({ ...prev, [imageId]: false }))

        showSucesso("Imagem carregada com sucesso!")
      }
    } catch (error) {
      console.error("Erro ao fazer upload:", error)
      showErro("Erro ao carregar imagem. Tente novamente.")
    } finally {
      setUploadingImages((prev) => ({ ...prev, [imageId]: false }))
    }
  }
  
  // --- INÍCIO DAS MODIFICAÇÕES ---

  // 1. Nova função para atualizar o estado local instantaneamente (sem trim)
  const handlecarrosselInputChange = (id: number, field: keyof carrosselImage, value: carrosselImage[keyof carrosselImage]) => {
    setcarrosselImages((prev) =>
      prev.map((img) => (img.id_carrossel === id ? { ...img, [field]: value } : img)),
    )
  }

  // 2. Nova função para ser chamada no onBlur dos inputs de texto
  const handlecarrosselInputBlur = (id: number, field: keyof carrosselImage) => {
    const image = carrosselImages.find((img) => img.id_carrossel === id)
    if (!image) return

    const currentValue = image[field]
    if (typeof currentValue === 'string') {
      const trimmedValue = currentValue.trim()
      // Apenas atualiza se o valor realmente mudou após o trim
      if (trimmedValue !== currentValue) {
        // Atualiza o estado local com o valor "limpo" e envia para a API
        updatecarrosselImage(id, field, trimmedValue)
      }
    }
  }

  // 3. A função original agora é o nosso "salvador" de dados
  const updatecarrosselImage = async (id: number, field: keyof carrosselImage, value: carrosselImage[keyof carrosselImage]) => {
    // Adiciona o trim aqui para garantir que qualquer valor de string seja limpo antes de enviar
    const finalValue = typeof value === 'string' ? value.trim() : value

    try {
      const image = carrosselImages.find((img) => img.id_carrossel === id)
      if (!image) return

      // Usamos o estado local para os outros campos para não perder dados não salvos
      const updatedData = {
        titulo: image.titulo,
        subtitulo: image.subtitulo,
        link_destino: image.link_destino,
        ordem: image.ordem,
        ativo: image.ativo,
        [field]: finalValue, // Aplica o valor atualizado e limpo
      }

      const response = await axios.put(`http://localhost:3000/api/carrossel/${id}`, updatedData)

      const updatedImage = {
        ...response.data,
        ativo: normalizeBoolean(response.data.ativo),
      }

      setcarrosselImages((prev) => prev.map((img) => (img.id_carrossel === id ? updatedImage : img)))

      if (field === "ativo") {
        const status = value ? "ativada" : "inativada"
        const message = `"${image.titulo}" foi ${status} com sucesso!`
        
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
        `
        document.body.appendChild(feedbackDiv)
        
        setTimeout(() => {
          feedbackDiv.remove()
        }, 3000)
      }
    } catch (error) {
      console.error("Erro ao atualizar slide:", error)
      showErro("Erro ao atualizar slide. Tente novamente.")
    }
  }

  // --- FIM DAS MODIFICAÇÕES ---

  const toggleProdutoDestaque = (produtoId: number) => {
    setProdutosDestaque((prev) => {
      if (prev.includes(produtoId)) {
        return prev.filter((id) => id !== produtoId)
      } else {
        return [...prev, produtoId]
      }
    })
  }

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

  const handleSave = async () => {
    // Antes de salvar, vamos garantir que todos os dados de texto estão limpos.
    const trimmedcarrosselImages = carrosselImages.map(img => ({
      ...img,
      titulo: img.titulo.trim(),
      subtitulo: img.subtitulo.trim(),
      link_destino: img.link_destino?.trim(),
    }))
    
    // Atualiza o estado local para refletir os valores limpos
    setcarrosselImages(trimmedcarrosselImages)
    
    const invalidImages = trimmedcarrosselImages.filter(
      (img) =>
        normalizeBoolean(img.ativo) &&
        (!img.titulo || !img.subtitulo || (img.link_destino && !isValidUrl(img.link_destino))),
    )

    if (invalidImages.length > 0) {
      showAviso("Por favor, preencha todos os campos obrigatórios dos slides ativos e verifique se os links estão corretos.")
      return
    }

    setSaving(true)
    try {
      // Salva os produtos destaque
      localStorage.setItem("produtosDestaque", JSON.stringify(produtosDestaque))
      
      // Salva todas as alterações dos slides no backend
      const updatePromises = trimmedcarrosselImages.map(image =>
        axios.put(`http://localhost:3000/api/carrossel/${image.id_carrossel}`, {
          ...image,
          link_destino: image.link_destino || null
        })
      )
      await Promise.all(updatePromises)
      
      const slidesAtivos = trimmedcarrosselImages.filter((img) => normalizeBoolean(img.ativo))
      const totalSlides = slidesAtivos.length
      const totalProdutos = produtosDestaque.length
      const primeiraImagem = slidesAtivos.sort((a, b) => a.ordem - b.ordem)[0]

      const message = `Alterações salvas com sucesso!\n\n• ${totalSlides} slide(s) ativo(s) no carrossel\n• ${totalProdutos} produto(s) em destaque\n• Primeira imagem: "${primeiraImagem?.titulo || "Nenhuma"}"`

      showSucesso(message)
      navigate("/")
    } catch (err) {
      console.error("Erro ao salvar:", err)
      showErro("Erro ao salvar alterações. Tente novamente.")
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
        {/* ... (o seu CSS e header continuam os mesmos) ... */}
        <style>{`
          .preview-container {
            position: relative;
            height: 128px;
            border-radius: 8px;
            overflow: hidden;
            background: transparent !important;
          }
          
          .preview-image-container {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 1;
          }
          
          .preview-image {
            width: 100% !important;
            height: 100% !important;
            object-fit: cover !important;
            object-position: center !important;
            background: transparent !important;
            display: block !important;
          }
          
          .preview-overlay {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 2;
            background: rgba(0, 0, 0, 0.4) !important;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          .preview-fallback {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 1;
            background: linear-gradient(135deg, #3B82F6 0%, #8B5CF6 50%, #1E40AF 100%) !important;
            display: flex;
            align-items: center;
            justify-content: center;
          }
        `}</style>

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
             {/* ... (o cabeçalho do carrossel continua o mesmo) ... */}
             <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Carrossel de Imagens</h2>
              <p className="text-sm text-gray-600 mt-1">
                A ordem das imagens é definida pelo campo "Posição". A primeira imagem (posição 1) será exibida primeiro
                no carrossel.
              </p>
            </div>


            <div className="space-y-6">
              {carrosselImages.map((image) => {
                const isActive = normalizeBoolean(image.ativo)
                const imageUrl = getImageUrl(image)
                
                return (
                  <div
                    key={image.id_carrossel}
                    className={`border rounded-lg p-4 transition-all duration-200 ${
                      !isActive ? "opacity-75 bg-gray-50 border-gray-300" : "border-gray-200"
                    }`}
                  >
                    {/* ... (input de arquivo e header do item continuam os mesmos) ... */}
                     <input
                      type="file"
                      ref={(el) => {
                        fileInputRefs.current[image.id_carrossel] = el
                      }}
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          handleFileUpload(image.id_carrossel, file)
                        }
                      }}
                      accept="image/*"
                      className="hidden"
                    />

                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <span className="text-sm font-medium text-gray-600">Posição {image.ordem}</span>
                        <h3 className="text-lg font-medium text-gray-900">
                          {image.titulo.trim() || 'Slide sem título'} {/* Usar trim para exibição */}
                          {!isActive && <span className="ml-2 text-sm text-red-500 font-medium">(INATIVO)</span>}
                        </h3>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() =>
                            updatecarrosselImage(image.id_carrossel, "ativo", !normalizeBoolean(image.ativo))
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
                       {/* ... (o campo de imagem continua o mesmo) ... */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Imagem *</label>
                        <div className="flex">
                          <div className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg bg-gray-50 text-gray-500 text-sm">
                            {image.url_imagem ? "Imagem carregada" : "Nenhuma imagem"}
                          </div>
                          <button
                            onClick={() => fileInputRefs.current[image.id_carrossel]?.click()}
                            disabled={uploadingImages[image.id_carrossel]}
                            className="px-3 py-2 bg-blue-600 text-white border border-l-0 border-blue-600 rounded-r-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                            title="Alterar imagem"
                          >
                            {uploadingImages[image.id_carrossel] ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Upload className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* --- MODIFICAÇÃO NOS INPUTS DE TEXTO --- */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Link de Destino
                          {/* ... (o link externo continua o mesmo) ... */}
                        </label>
                        <input
                          type="text"
                          value={image.link_destino || ""}
                          onChange={(e) => handlecarrosselInputChange(image.id_carrossel, "link_destino", e.target.value)}
                          onBlur={() => handlecarrosselInputBlur(image.id_carrossel, "link_destino")}
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
                          onChange={(e) => handlecarrosselInputChange(image.id_carrossel, "titulo", e.target.value)}
                          onBlur={() => handlecarrosselInputBlur(image.id_carrossel, "titulo")}
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
                          onChange={(e) => handlecarrosselInputChange(image.id_carrossel, "subtitulo", e.target.value)}
                          onBlur={() => handlecarrosselInputBlur(image.id_carrossel, "subtitulo")}
                          placeholder="Subtítulo do slide"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                      </div>
                    </div>

                    {/* ... (O preview da imagem continua o mesmo) ... */}
                     <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Preview</label>
                      <div className="preview-container">
                        {!imageErrors[image.id_carrossel] && imageUrl ? (
                          <div className="preview-image-container">
                            <img
                              src={imageUrl}
                              alt={image.titulo}
                              className="preview-image"
                              onLoad={() => {
                              }}
                              onError={() => {
                                console.error(`Erro no preview: ${imageUrl}`)
                                handleImageError(image.id_carrossel)
                              }}
                            />
                          </div>
                        ) : (
                          <div className="preview-fallback">
                            <div className="text-center text-white opacity-50">
                              <ImageIcon className="h-12 w-12 mx-auto mb-2" />
                              <p className="text-sm">
                                {image.url_imagem ? "Erro ao carregar imagem" : "Nenhuma imagem selecionada"}
                              </p>
                            </div>
                          </div>
                        )}
                        
                        {/* Overlay com texto sempre visível */}
                        <div className="preview-overlay">
                          <div className="text-center text-white">
                            <h4 className="font-semibold text-lg mb-1">{image.titulo}</h4>
                            <p className="text-sm opacity-90">{image.subtitulo}</p>
                            {image.link_destino && (
                              <p className="text-xs mt-2 opacity-75">
                                Link: {image.link_destino}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
              
              {/* ... (o resto do componente continua o mesmo) ... */}
               {carrosselImages.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <ImageIcon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>Nenhuma imagem no carrossel encontrada.</p>
                </div>
              )}
            </div>

            {/* Resumo da ordem */}
            {carrosselImages.length > 0 && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">Slides Ativos (Ordem de Exibição):</h3>
                <div className="space-y-1">
                  {carrosselImages
                    .filter((img) => normalizeBoolean(img.ativo))
                    .sort((a, b) => a.ordem - b.ordem)
                    .map((img, index) => (
                      <div key={img.id_carrossel} className="flex items-center space-x-2 text-sm">
                        <span className="font-medium text-gray-600">{index + 1}°</span>
                        <span className="text-gray-900">{img.titulo}</span>
                        <span className="text-gray-500">(Posição {img.ordem})</span>
                        <span className={`text-xs px-2 py-1 rounded ${
                          img.url_imagem ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {img.url_imagem ? 'Com imagem' : 'Sem imagem'}
                        </span>
                      </div>
                    ))}
                  {carrosselImages.filter((img) => normalizeBoolean(img.ativo)).length === 0 && (
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