"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import {
  ShoppingCart,
  User,
  Search,
  Menu,
  Wrench,
  CircleQuestionMark,
  Scale,
  Users,
  LogOut,
  Package,
  BarChart3,
  Headphones,
  Monitor,
  X,
  Edit3,
  ShoppingBag,
  ImageIcon,
} from "lucide-react"
import { useCart } from "../context/CartContext"
import axios from "axios"

// Interfaces locais para os dados
interface UsuarioData {
  id_cliente?: number
  id_usuario?: number
  nome?: string
  email: string
  tipo: "cliente" | "funcionario"
  tipo_perfil?: "admin" | "analista"
}

interface ProdutoBusca {
  id_produto: number
  nome: string
  preco: number
  imagemUrl: string | null
}

interface HeaderProps {
  usuario: UsuarioData | null
  onLogout: () => void
  searchTerm: string
  onSearchChange: (value: string) => void
}

const Header: React.FC<HeaderProps> = ({ usuario, onLogout, searchTerm, onSearchChange }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const searchContainerRef = useRef<HTMLDivElement>(null) // Ref para o container da busca
  const navigate = useNavigate()
  const { totalItens } = useCart()

  // --- NOVOS ESTADOS PARA A BUSCA DINÂMICA ---
  const [searchResults, setSearchResults] = useState<ProdutoBusca[]>([])
  const [isSearchLoading, setIsSearchLoading] = useState(false)
  const [isResultsVisible, setIsResultsVisible] = useState(false)

  // Efeito para buscar produtos com debounce (espera o usuário parar de digitar)
  useEffect(() => {
    // Se o termo de busca for muito curto, limpa os resultados e esconde o painel
    if (searchTerm.trim().length < 2) {
      setSearchResults([])
      setIsResultsVisible(false)
      return
    }

    const fetchResults = async () => {
      console.log(`[BUSCA] Iniciando busca por: "${searchTerm.trim()}"`)
      setIsSearchLoading(true)
      try {
        const response = await axios.get(
          `http://localhost:3000/produtos/busca-rapida?termo=${encodeURIComponent(searchTerm.trim())}`,
        )
        const data = response.data
        console.log("[BUSCA] API retornou:", data)

        setSearchResults(data)
        setIsResultsVisible(true) // Sempre mostra o painel para dar feedback (mesmo que seja "nenhum resultado")
      } catch (error) {
        console.error("[BUSCA] Erro na API:", error)
        setSearchResults([])
        setIsResultsVisible(true) // Mostra o painel com erro também
      } finally {
        setIsSearchLoading(false)
      }
    }

    // Debounce: A busca só acontece 300ms após o usuário parar de digitar
    const timerId = setTimeout(fetchResults, 300)

    // Função de limpeza: cancela o timer se o usuário digitar novamente
    return () => clearTimeout(timerId)
  }, [searchTerm])

  // Efeito para fechar o painel de busca ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsResultsVisible(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Remove a navegação antiga. Agora a busca é dinâmica.
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchTerm.trim()) {
      // Navega para a página de listagem completa com o termo
      navigate(`/produtos?busca=${encodeURIComponent(searchTerm.trim())}`)
      setIsResultsVisible(false) // Esconde o painel após submeter
    }
  }

  const handleProductClick = (id: number) => {
    navigate(`/produto/${id}`)
    setIsResultsVisible(false) // Esconde o painel
    onSearchChange("") // Limpa a barra de pesquisa
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(price)
  }

  const canEditHomePage =
    usuario?.tipo === "funcionario" && (usuario?.tipo_perfil === "admin" || usuario?.tipo_perfil === "analista")

  return (
    <header className="bg-white shadow-md relative z-50">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-blue-600 cursor-pointer" onClick={() => navigate("/")}>
              LabStore
            </h1>
            <span className="text-sm text-gray-500 ml-2 hidden md:block">Tecnologia & Inovação</span>
          </div>

          {/* --- CONTAINER DA BARRA DE PESQUISA --- */}
          <div ref={searchContainerRef} className="flex-1 max-w-xl mx-4 md:mx-8 relative">
            <form onSubmit={handleSearchSubmit}>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar produtos..."
                  value={searchTerm}
                  onChange={(e) => onSearchChange(e.target.value)}
                  onFocus={() => {
                    if (searchTerm.length > 1) setIsResultsVisible(true)
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button type="submit" className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600">
                  <Search size={20} />
                </button>
              </div>
            </form>

            {/* --- PAINEL DE RESULTADOS DA BUSCA --- */}
            {isResultsVisible && (
              <div className="absolute top-full mt-2 w-full bg-white rounded-lg shadow-xl border border-gray-200 z-50 overflow-hidden">
                {isSearchLoading ? (
                  <div className="p-4 text-center text-gray-500">Buscando...</div>
                ) : searchResults.length > 0 ? (
                  <ul>
                    {searchResults.map((produto) => (
                      <li key={produto.id_produto}>
                        <div
                          onClick={() => handleProductClick(produto.id_produto)}
                          className="flex items-center p-3 hover:bg-gray-100 cursor-pointer transition-colors"
                        >
                          {produto.imagemUrl ? (
                            <img
                              src={`http://localhost:3000/produtos${produto.imagemUrl}`}
                              alt={produto.nome}
                              className="w-12 h-12 object-cover rounded-md mr-4"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gray-200 rounded-md mr-4 flex items-center justify-center">
                              <ImageIcon className="h-6 w-6 text-gray-400" />
                            </div>
                          )}
                          <div className="flex-1">
                            <p className="font-medium text-gray-800 truncate">{produto.nome}</p>
                            <p className="text-sm text-blue-600 font-semibold">{formatPrice(produto.preco)}</p>
                          </div>
                        </div>
                      </li>
                    ))}
                    {searchTerm.trim() && (
                      <li>
                        <button
                          onClick={handleSearchSubmit}
                          className="w-full text-center p-3 bg-gray-50 hover:bg-gray-200 text-sm font-medium text-blue-600 transition-colors"
                        >
                          Ver todos os resultados
                        </button>
                      </li>
                    )}
                  </ul>
                ) : (
                  <div className="p-4 text-center text-gray-500">Nenhum resultado encontrado.</div>
                )}
              </div>
            )}
          </div>

          {/* User actions (sem alterações) */}
          <div className="flex items-center space-x-2 md:space-x-4">
            {/* ... o resto do seu código de ações do usuário permanece aqui ... */}
            {!usuario ? (
              <>
                <button
                  onClick={() => navigate("/login")}
                  className="flex items-center text-gray-700 hover:text-blue-600 transition-colors"
                >
                  <User size={20} className="mr-1" />
                  <span className="hidden md:block">Entrar</span>
                </button>
              </>
            ) : (
              <div className="flex items-center space-x-2 md:space-x-3">
                {usuario.tipo === "cliente" && (
                  <button
                    onClick={() => navigate("/carrinho")}
                    className="relative flex items-center text-gray-700 hover:text-blue-600 transition-colors"
                  >
                    <ShoppingCart size={20} />
                    {totalItens > 0 && (
                      <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {totalItens}
                      </span>
                    )}
                  </button>
                )}

                {usuario.tipo === "funcionario" && (
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      usuario.tipo_perfil === "admin" ? "bg-purple-100 text-purple-800" : "bg-green-100 text-green-800"
                    }`}
                  >
                    {usuario.tipo_perfil === "admin" ? "Admin" : "Técnico"}
                  </span>
                )}

                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center text-gray-700 hover:text-blue-600 transition-colors p-1 rounded-full hover:bg-gray-100"
                    title="Menu do usuário"
                  >
                    <User size={20} />
                  </button>

                  {userDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50">
                      <div className="px-4 py-2 text-sm text-gray-500 border-b border-gray-200">
                        Olá,{" "}
                        <span className="font-medium text-blue-600">
                          {usuario.nome?.split(" ")[0] || usuario.email.split("@")[0]}
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          navigate("/meus-pedidos")
                          setUserDropdownOpen(false)
                        }}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        <ShoppingBag size={16} className="mr-2" />
                        Meus Pedidos
                      </button>
                      <button
                        onClick={() => {
                          navigate("/alterar-senha")
                          setUserDropdownOpen(false)
                        }}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        <Edit3 size={16} className="mr-2" />
                        Alterar Senha
                      </button>
                      <hr className="my-1 border-gray-200" />
                      <button
                        onClick={() => {
                          onLogout()
                          setUserDropdownOpen(false)
                        }}
                        className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut size={16} className="mr-2" />
                        Sair
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {!usuario && (
              <button
                onClick={() => navigate("/carrinho")}
                className="relative flex items-center text-gray-700 hover:text-blue-600 transition-colors"
              >
                <ShoppingCart size={20} />
                {totalItens > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {totalItens}
                  </span>
                )}
              </button>
            )}

            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden text-gray-700 p-1">
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Desktop Navigation Menu */}
      <div className="bg-gray-100 border-t hidden md:block">
        <div className="max-w-7xl mx-auto px-4">
          {/* A <nav> agora apenas alinha os itens. O espaçamento é feito nos <div> internos */}
          <nav className="flex items-center py-3">
            {/* Grupo de Menu Público */}
            <div className="flex items-center space-x-6">
              <a href="/produtos" className="flex items-center text-gray-700 hover:text-blue-600 transition-colors">
                <Monitor size={16} className="mr-1" />
                Produtos
              </a>
              <a
                href="/nova-solicitacao-assistencia"
                className="flex items-center text-gray-700 hover:text-blue-600 transition-colors"
              >
                <Wrench size={16} className="mr-1" />
                Assistência Técnica
              </a>
              {!canEditHomePage && (
                <a
                  href="/central-ajuda"
                  className="flex items-center text-gray-700 hover:text-blue-600 transition-colors"
                >
                  <CircleQuestionMark size={16} className="mr-1" />
                  Ajuda
                </a>
              )}
            </div>

            {/* Menu administrativo */}
            {usuario?.tipo === "funcionario" && (
              // Usamos um Fragment <> para agrupar a lógica do menu de funcionário
              <>
                {/* Separador 1 (restaurado) */}
                <div className="border-l border-gray-300 h-6 mx-6"></div>

                {/* Grupo de Menu Administrativo */}
                <div className="flex items-center space-x-6">
                  {/* Menu específico para Admin e Analista */}
                  {canEditHomePage && (
                    <>
                      <a
                        href="/editar-home"
                        className="flex items-center text-orange-700 hover:text-orange-600 transition-colors"
                      >
                        <Edit3 size={16} className="mr-1" />
                        Home
                      </a>
                      <a
                        href="/meus-pedidos"
                        className="flex items-center text-blue-700 hover:text-blue-600 transition-colors"
                      >
                        <ShoppingBag size={16} className="mr-1" />
                        Pedidos
                      </a>
                    </>
                  )}

                  <a
                    href="/gestao/produtos"
                    className="flex items-center text-green-700 hover:text-green-600 transition-colors"
                  >
                    <Package size={16} className="mr-1" />
                    Produtos
                  </a>

                  <a
                    href="/gestao/solicitacoes"
                    className="flex items-center text-green-700 hover:text-green-600 transition-colors"
                  >
                    <Wrench size={16} className="mr-1" />
                    Solicitações
                  </a>

                  <a
                    href="/gestao/chamados"
                    className="flex items-center text-yellow-700 hover:text-yellow-600 transition-colors"
                  >
                    <Headphones size={16} className="mr-1" />
                    Chamados
                  </a>

                  {/* Menu exclusivo para Admin */}
                  {usuario.tipo_perfil === "admin" && (
                    <>
                      {/* Separador 2 (restaurado) */}
                      <div className="border-l border-gray-300 h-6 mx-0"></div>

                      <a
                        href="/gestao/usuarios"
                        className="flex items-center text-purple-700 hover:text-purple-600 transition-colors"
                      >
                        <Users size={16} className="mr-1" />
                        Usuários
                      </a>
                      <a href="#" className="flex items-center text-purple-700 hover:text-purple-600 transition-colors">
                        <BarChart3 size={16} className="mr-1" />
                        Relatórios
                      </a>
                      <a
                        href="/gestao/lgpd"
                        className="flex items-center text-purple-700 hover:text-purple-600 transition-colors"
                      >
                        <Scale size={16} className="mr-1" />
                        LGPD
                      </a>
                    </>
                  )}
                </div>
              </>
            )}
          </nav>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t shadow-lg">
          <div className="px-4 py-3 space-y-3">
            {/* Menu público */}
            <div className="space-y-2">
              <h4 className="font-semibold text-gray-800 text-sm">Categorias</h4>
              <a
                href="/produtos"
                className="flex items-center text-gray-700 hover:text-blue-600 transition-colors py-2"
              >
                <Monitor size={16} className="mr-2" />
                Produtos
              </a>
              <a
                href="/nova-solicitacao-assistencia"
                className="flex items-center text-gray-700 hover:text-blue-600 transition-colors py-2"
              >
                <Wrench size={16} className="mr-2" />
                Assistência Técnica
              </a>
              {!canEditHomePage && (
                <a
                  href="/central-ajuda"
                  className="flex items-center text-gray-700 hover:text-blue-600 transition-colors py-2"
                >
                  <CircleQuestionMark size={16} className="mr-2" />
                  Ajuda
                </a>
              )}
            </div>

            {/* Menu administrativo mobile */}
            {usuario?.tipo === "funcionario" && (
              <div className="border-t pt-3 space-y-2">
                <h4 className="font-semibold text-gray-800 text-sm">Administração</h4>

                {/* Menu específico para Admin e Analista Mobile */}
                {canEditHomePage && (
                  <>
                    <a
                      href="/editar-home"
                      className="flex items-center text-orange-700 hover:text-orange-600 transition-colors py-2"
                    >
                      <Edit3 size={16} className="mr-2" />
                      Home
                    </a>
                    <a
                      href="/gestao/pedidos"
                      className="flex items-center text-blue-700 hover:text-blue-600 transition-colors py-2"
                    >
                      <ShoppingBag size={16} className="mr-2" />
                      Pedidos
                    </a>
                  </>
                )}

                <a
                  href="/gestao/produtos"
                  className="flex items-center text-green-700 hover:text-green-600 transition-colors py-2"
                >
                  <Package size={16} className="mr-2" />
                  Produtos
                </a>

                <a
                  href="/gestao/solicitacoes"
                  className="flex items-center text-yellow-700 hover:text-yellow-600 transition-colors py-2"
                >
                  <Wrench size={16} className="mr-2" />
                  Solicitações
                </a>

                <a
                  href="/gestao/chamados"
                  className="flex items-center text-yellow-700 hover:text-yellow-600 transition-colors py-2"
                >
                  <Headphones size={16} className="mr-2" />
                  Chamados
                </a>
                {usuario.tipo_perfil === "admin" && (
                  <>
                    <a
                      href="/gestao/usuarios"
                      className="flex items-center text-purple-700 hover:text-purple-600 transition-colors py-2"
                    >
                      <Users size={16} className="mr-2" />
                      Usuários
                    </a>
                    <a
                      href="#"
                      className="flex items-center text-purple-700 hover:text-purple-600 transition-colors py-2"
                    >
                      <BarChart3 size={16} className="mr-2" />
                      Relatórios
                    </a>

                    <a
                      href="/gestao/lgpd"
                      className="flex items-center text-purple-700 hover:text-purple-600 transition-colors py-2"
                    >
                      <Scale size={16} className="mr-2" />
                      LGPD
                    </a>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  )
}

export default Header
