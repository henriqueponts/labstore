"use client"

import axios from "axios"
import type React from "react"
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import Layout from "../components/Layout"
import { ChevronLeft, ChevronRight, ShoppingCart, Package, ArrowRight, ImageIcon } from "lucide-react"
import { useCart } from "../context/CartContext"

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

interface CarouselImage {
  id_carousel: number
  titulo: string
  subtitulo: string
  url_imagem: string | null
  link_destino?: string
  ordem: number
  ativo: boolean
}

const Home: React.FC = () => {
  const [, setProdutos] = useState<Produto[]>([])
  const [produtosDestaque, setProdutosDestaque] = useState<Produto[]>([])
  const [loading, setLoading] = useState(true)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [carouselImages, setCarouselImages] = useState<CarouselImage[]>([])
  const [imageErrors, setImageErrors] = useState<{ [key: number]: boolean }>({})
  interface DebugInfo {
    url: string
    naturalWidth: number
    naturalHeight: number
    displayWidth: number
    displayHeight: number
    objectFit: string
    objectPosition: string
    backgroundColor: string
  }
  const [, setDebugInfo] = useState<{ [key: number]: DebugInfo }>({})
  const navigate = useNavigate()
  const { adicionarAoCarrinho } = useCart()

  // Carregar imagens do carrossel do banco
  const loadCarouselImages = async () => {
    try {
      const response = await axios.get("http://localhost:3000/api/carousel")

      // Filtrar apenas imagens ativas e ordenar
      const imagensAtivas = response.data
        .filter((img: CarouselImage) => img.ativo)
        .sort((a: CarouselImage, b: CarouselImage) => a.ordem - b.ordem)

      setCarouselImages(imagensAtivas)
    } catch (error) {
      console.error("⚠ Erro ao carregar carrossel:", error)
      setCarouselImages([])
    }
  }

  // Carregar produtos
  const loadProdutos = async () => {
    try {
      const response = await axios.get("http://localhost:3000/produtos/produtos")
      const produtosAtivos = response.data.filter((produto: Produto) => produto.status === "ativo")
      setProdutos(produtosAtivos)

      const produtosDestaqueSalvos = localStorage.getItem("produtosDestaque")
      if (produtosDestaqueSalvos) {
        const idsDestaque = JSON.parse(produtosDestaqueSalvos)
        const produtosEmDestaque = produtosAtivos.filter((p: Produto) => idsDestaque.includes(p.id_produto))
        setProdutosDestaque(produtosEmDestaque)
      } else {
        setProdutosDestaque(produtosAtivos.slice(0, 8))
      }
    } catch (err) {
      console.error("Erro ao carregar produtos:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCarouselImages()
    loadProdutos()
  }, [])

  // Auto-play do carrossel
  useEffect(() => {
    if (carouselImages.length > 1) {
      const timer = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % carouselImages.length)
      }, 5000)
      return () => clearInterval(timer)
    }
  }, [carouselImages.length])

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(price)
  }

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % carouselImages.length)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + carouselImages.length) % carouselImages.length)
  }

  const goToSlide = (index: number) => {
    setCurrentSlide(index)
  }

  const handleSlideClick = (link?: string) => {
    if (link) {
      if (link.startsWith("/")) {
        navigate(link)
      } else {
        window.open(link, "_blank")
      }
    }
  }

  // Função para lidar com erro de imagem
  const handleImageError = (imageId: number) => {
    console.error(`⚠ Erro ao carregar imagem do carrossel ID: ${imageId}`)
    setImageErrors((prev) => ({ ...prev, [imageId]: true }))
  }

  // Função para construir URL da imagem
  const getImageUrl = (image: CarouselImage) => {
    if (!image.url_imagem) return null

    if (image.url_imagem.startsWith("http")) {
      return image.url_imagem
    }

    if (image.url_imagem.startsWith("/")) {
      return `http://localhost:3000${image.url_imagem}`
    }

    return `http://localhost:3000/uploads/carousel/${image.url_imagem}`
  }

  // Debug da imagem
  const debugImage = (imageId: number, imageUrl: string, event: React.SyntheticEvent<HTMLImageElement>) => {
    const imgElement = event.target as HTMLImageElement
    const computedStyle = window.getComputedStyle(imgElement)
    
    const debug = {
      url: imageUrl,
      naturalWidth: imgElement.naturalWidth,
      naturalHeight: imgElement.naturalHeight,
      displayWidth: imgElement.offsetWidth,
      displayHeight: imgElement.offsetHeight,
      objectFit: computedStyle.objectFit,
      objectPosition: computedStyle.objectPosition,
      backgroundColor: computedStyle.backgroundColor,
    }
    
    setDebugInfo(prev => ({ ...prev, [imageId]: debug }))
  }

  return (
    <Layout showLoading={loading}>
      <div className="min-h-screen">
        {/* CSS Debug Styles */}
        <style>{`
          /* Reset para garantir que não há estilos conflitantes */
          .carousel-container {
            position: relative;
            overflow: hidden;
            background: transparent !important;
          }
          
          .carousel-slide {
            position: relative;
            min-width: 100%;
            height: 100%;
            background: transparent !important;
          }
          
          .carousel-image-container {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 1;
            background: transparent !important;
          }
          
          .carousel-image {
            width: 100% !important;
            height: 100% !important;
            object-fit: cover !important;
            object-position: center !important;
            background: transparent !important;
            display: block !important;
          }
          
          .carousel-overlay {
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
          
          .carousel-fallback {
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

        {/* Carrossel de Imagens */}
        {carouselImages.length > 0 && (
          <section className="relative h-96 md:h-[500px] carousel-container">
            <div
              className="flex transition-transform duration-500 ease-in-out h-full"
              style={{ transform: `translateX(-${currentSlide * 100}%)` }}
            >
              {carouselImages.map((image) => {
                const imageUrl = getImageUrl(image)
                
                return (
                  <div key={image.id_carousel} className="carousel-slide">
                    {/* Container da imagem com z-index baixo */}
                    {!imageErrors[image.id_carousel] && imageUrl ? (
                      <div className="carousel-image-container">
                        <img
                          src={imageUrl}
                          alt={image.titulo}
                          className="carousel-image"
                          onLoad={(e) => {
                            debugImage(image.id_carousel, imageUrl, e)
                          }}
                          onError={() => {
                            console.error(`❌ Falha ao carregar: ${imageUrl}`)
                            handleImageError(image.id_carousel)
                          }}
                        />
                      </div>
                    ) : (
                      <div className="carousel-fallback">
                        <div className="text-center text-white opacity-30">
                          <ImageIcon className="h-24 w-24 mx-auto mb-4" />
                          <p className="text-lg">
                            {image.url_imagem ? "Erro ao carregar imagem" : "Aguardando imagem"}
                          </p>
                          {imageUrl && (
                            <p className="text-sm mt-2 opacity-75">URL: {imageUrl}</p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Overlay com z-index alto */}
                    <div className="carousel-overlay">
                      <div className="text-center text-white px-4 max-w-4xl relative z-10">
                        <h2 className="text-3xl md:text-5xl font-bold mb-4 text-shadow">
                          {image.titulo}
                        </h2>
                        <p className="text-lg md:text-xl mb-8 text-gray-200 text-shadow">
                          {image.subtitulo}
                        </p>
                        
                        
                        {image.link_destino && (
                          <button
                            onClick={() => handleSlideClick(image.link_destino)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors duration-200 inline-flex items-center shadow-lg"
                          >
                            Explorar
                            <ArrowRight className="ml-2 h-5 w-5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Controles do Carrossel */}
            {carouselImages.length > 1 && (
              <>
                <button
                  onClick={prevSlide}
                  className="absolute left-6 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-3 rounded-full transition-all duration-200 shadow-lg hover:scale-110 z-30"
                  title="Imagem anterior"
                >
                  <ChevronLeft className="h-8 w-8" />
                </button>
                <button
                  onClick={nextSlide}
                  className="absolute right-6 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-3 rounded-full transition-all duration-200 shadow-lg hover:scale-110 z-30"
                  title="Próxima imagem"
                >
                  <ChevronRight className="h-8 w-8" />
                </button>

                {/* Indicador de posição */}
                <div className="absolute bottom-4 right-4 bg-black bg-opacity-60 text-white px-3 py-1 rounded-full text-sm font-medium z-30">
                  {currentSlide + 1} / {carouselImages.length}
                </div>

                {/* Dots de navegação */}
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 z-30">
                  {carouselImages.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => goToSlide(index)}
                      className={`w-2 h-2 rounded-full transition-all duration-200 ${
                        index === currentSlide ? "bg-white" : "bg-white bg-opacity-40"
                      }`}
                      title={`Ir para slide ${index + 1}`}
                    />
                  ))}
                </div>
              </>
            )}
          </section>
        )}

        {/* Mensagem quando não há carrossel */}
        {carouselImages.length === 0 && (
          <section className="h-96 md:h-[500px] bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
            <div className="text-center text-gray-600">
              <ImageIcon className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <h2 className="text-2xl font-bold mb-2">Carrossel em Manutenção</h2>
              <p>As imagens do carrossel serão exibidas em breve.</p>
            </div>
          </section>
        )}

        {/* Resto do componente continua igual... */}
        {/* Produtos em Destaque */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-12">
              <h3 className="text-3xl font-bold text-gray-800 mb-4">Produtos em Destaque</h3>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Confira nossa seleção especial de produtos tecnológicos com a melhor qualidade e preços competitivos
              </p>
            </div>

            {produtosDestaque.length === 0 ? (
              <div className="text-center py-12">
                <Package className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                <p className="text-gray-500 text-lg">Nenhum produto em destaque no momento.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {produtosDestaque.map((produto) => (
                  <div
                    key={produto.id_produto}
                    className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group"
                  >
                    <div
                      className="aspect-[4/3] bg-gradient-to-br from-gray-100 to-gray-200 relative overflow-hidden cursor-pointer"
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
                          <Package className="h-16 w-16 text-gray-400" />
                        </div>
                      )}

                      {produto.estoque <= 5 && produto.estoque > 0 && (
                        <div className="absolute top-3 left-3 bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                          Últimas unidades
                        </div>
                      )}

                      <div className="absolute top-3 right-3 bg-blue-600 text-white text-xs font-semibold px-2 py-1 rounded-full">
                        {produto.categoria_nome}
                      </div>
                    </div>

                    <div className="p-6">
                      <div className="mb-3">
                        {produto.marca && <p className="text-sm text-gray-500 font-medium">{produto.marca}</p>}
                      </div>

                      <h4
                        className="font-bold text-gray-900 mb-3 line-clamp-2 text-lg group-hover:text-blue-600 transition-colors duration-200 cursor-pointer"
                        onClick={() => navigate(`/produto/${produto.id_produto}`)}
                      >
                        {produto.nome}
                      </h4>

                      <div className="mb-4">
                        <span className="text-2xl font-bold text-blue-600">{formatPrice(produto.preco)}</span>
                      </div>

                      <div className="mb-4">
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

                      <div className="flex space-x-2">
                        <button
                          onClick={() => navigate(`/produto/${produto.id_produto}`)}
                          className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 px-4 rounded-lg font-medium transition-all duration-200 text-sm"
                        >
                          Ver Detalhes
                        </button>
                        <button
                          onClick={() => adicionarAoCarrinho(produto.id_produto, 1)}
                          disabled={produto.estoque <= 0}
                          className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Adicionar ao carrinho"
                        >
                          <ShoppingCart className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="text-center mt-12">
              <button
                onClick={() => navigate("/produtos")}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors duration-200 inline-flex items-center"
              >
                Ver Todos os Produtos
                <ArrowRight className="ml-2 h-5 w-5" />
              </button>
            </div>
          </div>
        </section>

        <style>{`
          .line-clamp-2 {
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }
          
          .text-shadow {
            text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
          }
        `}</style>
      </div>
    </Layout>
  )
}

export default Home