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
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [produtosDestaque, setProdutosDestaque] = useState<Produto[]>([])
  const [loading, setLoading] = useState(true)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [carouselImages, setCarouselImages] = useState<CarouselImage[]>([])
  const [imageErrors, setImageErrors] = useState<{ [key: number]: boolean }>({})
  const navigate = useNavigate()
  const { adicionarAoCarrinho } = useCart()

  // Carregar imagens do carrossel do banco
  const loadCarouselImages = async () => {
    try {
      console.log("🎠 Carregando imagens do carrossel...")
      const response = await axios.get("http://localhost:3000/api/carousel")
      console.log("📊 Resposta do carrossel:", response.data)

      // Filtrar apenas imagens ativas e ordenar
      const imagensAtivas = response.data
        .filter((img: CarouselImage) => img.ativo)
        .sort((a: CarouselImage, b: CarouselImage) => a.ordem - b.ordem)

      console.log(`✅ ${imagensAtivas.length} imagens ativas encontradas`)
      setCarouselImages(imagensAtivas)
    } catch (error) {
      console.error("❌ Erro ao carregar carrossel:", error)
      // Usar imagens padrão em caso de erro
      setCarouselImages([])
    }
  }

  // Carregar produtos
  const loadProdutos = async () => {
    try {
      const response = await axios.get("http://localhost:3000/produtos/produtos")
      const produtosAtivos = response.data.filter((produto: Produto) => produto.status === "ativo")
      setProdutos(produtosAtivos)

      // Carregar produtos em destaque salvos ou usar padrão
      const produtosDestaqueSalvos = localStorage.getItem("produtosDestaque")
      if (produtosDestaqueSalvos) {
        const idsDestaque = JSON.parse(produtosDestaqueSalvos)
        const produtosEmDestaque = produtosAtivos.filter((p: Produto) => idsDestaque.includes(p.id_produto))
        setProdutosDestaque(produtosEmDestaque)
      } else {
        // Selecionar produtos em destaque padrão (primeiros 8 produtos)
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
    console.error(`❌ Erro ao carregar imagem do carrossel ID: ${imageId}`)
    setImageErrors((prev) => ({ ...prev, [imageId]: true }))
  }

  // Função para construir URL da imagem
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

  return (
    <Layout showLoading={loading}>
      <div className="min-h-screen">
        {/* Carrossel de Imagens */}
        {carouselImages.length > 0 && (
          <section className="relative h-96 md:h-[500px] overflow-hidden">
            <div
              className="flex transition-transform duration-500 ease-in-out h-full"
              style={{ transform: `translateX(-${currentSlide * 100}%)` }}
            >
              {carouselImages.map((image) => (
                <div key={image.id_carousel} className="min-w-full h-full relative">
                  {/* Imagem do slide */}
                  {!imageErrors[image.id_carousel] && image.url_imagem ? (
                    <img
                      src={getImageUrl(image) || "/placeholder.svg"}
                      alt={image.titulo}
                      className="w-full h-full object-cover"
                      onError={() => handleImageError(image.id_carousel)}
                      onLoad={() => console.log(`✅ Imagem carregada: ${image.titulo}`)}
                    />
                  ) : (
                    // Fallback quando não há imagem ou erro
                    <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                      <ImageIcon className="h-24 w-24 text-white opacity-50" />
                    </div>
                  )}

                  {/* Overlay com conteúdo */}
                  <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                    <div className="text-center text-white px-4 max-w-4xl">
                      <h2 className="text-3xl md:text-5xl font-bold mb-4">{image.titulo}</h2>
                      <p className="text-lg md:text-xl mb-8 text-gray-200">{image.subtitulo}</p>
                      {image.link_destino && (
                        <button
                          onClick={() => handleSlideClick(image.link_destino)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors duration-200 inline-flex items-center"
                        >
                          Explorar
                          <ArrowRight className="ml-2 h-5 w-5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Controles do Carrossel - Setinhas maiores e mais visíveis */}
            {carouselImages.length > 1 && (
              <>
                <button
                  onClick={prevSlide}
                  className="absolute left-6 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-3 rounded-full transition-all duration-200 shadow-lg hover:scale-110"
                  title="Imagem anterior"
                >
                  <ChevronLeft className="h-8 w-8" />
                </button>
                <button
                  onClick={nextSlide}
                  className="absolute right-6 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-3 rounded-full transition-all duration-200 shadow-lg hover:scale-110"
                  title="Próxima imagem"
                >
                  <ChevronRight className="h-8 w-8" />
                </button>

                {/* Indicador de posição no canto */}
                <div className="absolute bottom-4 right-4 bg-black bg-opacity-60 text-white px-3 py-1 rounded-full text-sm font-medium">
                  {currentSlide + 1} / {carouselImages.length}
                </div>

                {/* Bolinhas pequenas para navegação direta (opcional) */}
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
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

                      {/* Badge de estoque baixo */}
                      {produto.estoque <= 5 && produto.estoque > 0 && (
                        <div className="absolute top-3 left-3 bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                          Últimas unidades
                        </div>
                      )}

                      {/* Badge de categoria */}
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

                      {/* Botões de ação */}
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

            {/* Botão Ver Todos os Produtos */}
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

        {/* Footer */}
        <footer className="bg-gray-800 text-white py-12">
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div>
                <h5 className="text-lg font-semibold mb-4">LabStore</h5>
                <p className="text-gray-400 text-sm mb-4">
                  Sua loja de tecnologia com os melhores produtos e preços do mercado.
                </p>
                <div className="flex space-x-4">
                  <a href="#" className="text-gray-400 hover:text-white transition-colors">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
                    </svg>
                  </a>
                  <a href="#" className="text-gray-400 hover:text-white transition-colors">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z" />
                    </svg>
                  </a>
                  <a href="#" className="text-gray-400 hover:text-white transition-colors">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.347-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.746-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24.009 12.017 24.009c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641.001.012.001z.017 0z" />
                    </svg>
                  </a>
                </div>
              </div>
              <div>
                <h6 className="font-semibold mb-4">Categorias</h6>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li>
                    <a href="/produtos?categoria=Notebooks" className="hover:text-white transition-colors">
                      Notebooks
                    </a>
                  </li>
                  <li>
                    <a href="/produtos?categoria=Monitores" className="hover:text-white transition-colors">
                      Monitores
                    </a>
                  </li>
                  <li>
                    <a href="/produtos?categoria=PCs Gamer" className="hover:text-white transition-colors">
                      PCs Gamer
                    </a>
                  </li>
                  <li>
                    <a href="/produtos" className="hover:text-white transition-colors">
                      Ver Todos
                    </a>
                  </li>
                </ul>
              </div>
              <div>
                <h6 className="font-semibold mb-4">Suporte</h6>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li>
                    <a href="/central-ajuda" className="hover:text-white transition-colors">
                      Central de Ajuda
                    </a>
                  </li>
                  <li>
                    <a href="/central-ajuda" className="hover:text-white transition-colors">
                      Fale Conosco
                    </a>
                  </li>
                </ul>
              </div>
              <div>
                <h6 className="font-semibold mb-4">Contato</h6>
                <div className="space-y-2 text-sm text-gray-400">
                  <p className="flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                      />
                    </svg>
                    (17) 3345-1234
                  </p>
                  <p className="flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                    contato@labstore.com
                  </p>
                  <p className="flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    Bebedouro - SP
                  </p>
                  <p className="text-xs mt-4">
                    Seg-Sex: 8h às 18h
                    <br />
                    Sáb: 8h às 12h
                  </p>
                </div>
              </div>
            </div>
            <div className="border-t border-gray-700 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-gray-400">
              <p>&copy; 2025 LabStore. Todos os direitos reservados.</p>
              <div className="flex space-x-4 mt-4 md:mt-0">
                <a href="#" className="hover:text-white transition-colors">
                  Política de Privacidade
                </a>
                <a href="#" className="hover:text-white transition-colors">
                  Termos de Uso
                </a>
              </div>
            </div>
          </div>
        </footer>

        <style>{`
          .line-clamp-2 {
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }
        `}</style>
      </div>
    </Layout>
  )
}

export default Home
