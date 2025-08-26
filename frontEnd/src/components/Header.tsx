"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Link, useNavigate } from "react-router-dom"
import axios from "axios"
import {
  ShoppingCart, User, Search, Menu, Wrench, FileQuestion as CircleQuestionMark,
  Scale, Users, LogOut, Package, BarChart3, Headphones, Monitor, X, Edit3, Lock,
  ListOrdered, Loader2,
} from "lucide-react"
import { useCart } from "../context/CartContext"

// Interface para os dados do usuário logado
interface UsuarioData {
  id_cliente?: number
  id_usuario?: number
  nome?: string
  email: string
  tipo: "cliente" | "funcionario"
  tipo_perfil?: "admin" | "analista"
}

// Interface para os produtos exibidos no dropdown de busca
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
  const navigate = useNavigate()
  const { totalItens } = useCart()
  const dropdownRef = useRef<HTMLDivElement>(null)
  const searchContainerRef = useRef<HTMLDivElement>(null)

  // Estados locais para o dropdown de busca rápida
  const [dropdownResults, setDropdownResults] = useState<ProdutoBusca[]>([])
  const [isDropdownLoading, setIsDropdownLoading] = useState(false)
  const [isDropdownVisible, setIsDropdownVisible] = useState(false)

  // Efeito para fechar dropdowns ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false)
      }
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsDropdownVisible(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Efeito para buscar resultados para o dropdown com debounce (atraso)
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchTerm.trim().length > 1) {
        setIsDropdownLoading(true)
        setIsDropdownVisible(true)
        try {
          const response = await axios.get(`http://localhost:3000/produtos/produtos/buscar?nome=${searchTerm}`)
          setDropdownResults(response.data.slice(0, 5)) // Limita a 5 resultados
        } catch (error) {
          console.error("Erro na busca de produtos:", error)
          setDropdownResults([])
        } finally {
          setIsDropdownLoading(false)
        }
      } else {
        setDropdownResults([])
        setIsDropdownVisible(false)
      }
    }, 300)

    return () => clearTimeout(delayDebounceFn)
  }, [searchTerm])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsDropdownVisible(false)
    if (searchTerm.trim()) {
      navigate(`/produtos?busca=${encodeURIComponent(searchTerm.trim())}`)
    } else {
      navigate("/produtos")
    }
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
          {/* Logo */}
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-blue-600 cursor-pointer" onClick={() => navigate("/")}>
              LabStore
            </h1>
          </div>

          {/* Search bar com Dropdown */}
          <div className="flex-1 max-w-xl mx-4 md:mx-8 relative" ref={searchContainerRef}>
            <form onSubmit={handleSearchSubmit}>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar produtos..."
                  value={searchTerm}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button type="submit" className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600">
                  <Search size={20} />
                </button>
              </div>
            </form>

            {/* Dropdown de Resultados */}
            {isDropdownVisible && (
              <div className="absolute top-full mt-2 w-full bg-white rounded-lg shadow-lg border z-20 max-h-96 overflow-y-auto">
                {isDropdownLoading ? (
                  <div className="flex items-center justify-center p-4">
                    <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                    <span className="ml-2 text-gray-600">Buscando...</span>
                  </div>
                ) : dropdownResults.length > 0 ? (
                  <ul>
                    {dropdownResults.map((produto) => (
                      <li key={produto.id_produto}>
                        <Link
                          to={`/produto/${produto.id_produto}`}
                          onClick={() => setIsDropdownVisible(false)}
                          className="flex items-center p-3 hover:bg-gray-100 transition-colors"
                        >
                          <div className="w-12 h-12 bg-gray-100 rounded-md overflow-hidden flex-shrink-0 mr-3">
                            <img
                              src={
                                produto.imagemUrl
                                  ? `http://localhost:3000/produtos${produto.imagemUrl}`
                                  : "/placeholder.svg"
                              }
                              alt={produto.nome}
                              className="w-full h-full object-contain"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-800 truncate">{produto.nome}</p>
                            <p className="text-sm text-blue-600 font-semibold">{formatPrice(produto.preco)}</p>
                          </div>
                        </Link>
                      </li>
                    ))}
                    <li className="border-t">
                      <button
                        onClick={handleSearchSubmit}
                        className="w-full text-center p-3 text-sm font-semibold text-blue-600 hover:bg-blue-50"
                      >
                        Ver todos os resultados
                      </button>
                    </li>
                  </ul>
                ) : (
                  <div className="p-4 text-center text-gray-500">Nenhum produto encontrado.</div>
                )}
              </div>
            )}
          </div>

          {/* User actions */}
          <div className="flex items-center space-x-2 md:space-x-4">
            {!usuario ? (
              <button
                onClick={() => navigate("/login")}
                className="flex items-center text-gray-700 hover:text-blue-600 transition-colors"
              >
                <User size={20} className="mr-1" />
                <span className="hidden md:block">Entrar</span>
              </button>
            ) : (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center text-gray-700 hover:text-blue-600 transition-colors p-2 rounded-full hover:bg-gray-100"
                >
                  <User size={20} />
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg border z-10">
                    <div className="p-4 border-b">
                      <p className="font-medium text-gray-800 truncate">{usuario.nome || usuario.email}</p>
                      <p className="text-sm text-gray-500 truncate">{usuario.email}</p>
                    </div>
                    <div className="py-2">
                      {usuario.tipo === "cliente" && (
                        <>
                          <a
                            href="/meus-pedidos"
                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            <ListOrdered size={16} className="mr-3" />
                            Meus Pedidos
                          </a>
                          <a
                            href="/alterar-senha"
                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            <Lock size={16} className="mr-3" />
                            Alterar Senha
                          </a>
                        </>
                      )}
                      {usuario.tipo === "funcionario" && (
                        <a
                          href="/alterar-senha"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <Lock size={16} className="mr-3" />
                          Alterar Senha
                        </a>
                      )}
                    </div>
                    <div className="border-t">
                      <button
                        onClick={() => {
                          setUserDropdownOpen(false)
                          onLogout()
                        }}
                        className="w-full text-left flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        <LogOut size={16} className="mr-3" />
                        Sair
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {(!usuario || usuario.tipo === "cliente") && (
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
          <nav className="flex space-x-8 py-3">
            <a href="/produtos" className="flex items-center text-gray-700 hover:text-blue-600 transition-colors">
              <Monitor size={16} className="mr-1" />
              Produtos
            </a>
            <a href="#" className="flex items-center text-gray-700 hover:text-blue-600 transition-colors">
              <Wrench size={16} className="mr-1" />
              Assistência Técnica
            </a>
            <a href="/central-ajuda" className="flex items-center text-gray-700 hover:text-blue-600 transition-colors">
              <CircleQuestionMark size={16} className="mr-1" />
              Ajuda
            </a>

            {usuario?.tipo === "funcionario" && (
              <>
                <div className="border-l border-gray-300 mx-4"></div>
                {canEditHomePage && (
                  <a
                    href="/editar-home"
                    className="flex items-center text-orange-700 hover:text-orange-600 transition-colors"
                  >
                    <Edit3 size={16} className="mr-1" />
                    Home
                  </a>
                )}
                <a
                  href="/gestao/produtos"
                  className="flex items-center text-green-700 hover:text-green-600 transition-colors"
                >
                  <Package size={16} className="mr-1" />
                  Produtos
                </a>
                <a href="#" className="flex items-center text-green-700 hover:text-green-600 transition-colors">
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
                <div className="border-l border-gray-300 mx-4"></div>
                {usuario.tipo_perfil === "admin" && (
                  <>
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
              </>
            )}
          </nav>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t shadow-lg">
          <div className="px-4 py-3 space-y-3">
            <div className="space-y-2">
              <h4 className="font-semibold text-gray-800 text-sm">Categorias</h4>
              <a
                href="/produtos"
                className="flex items-center text-gray-700 hover:text-blue-600 transition-colors py-2"
              >
                <Monitor size={16} className="mr-2" />
                Produtos
              </a>
              <a href="#" className="flex items-center text-gray-700 hover:text-blue-600 transition-colors py-2">
                <Wrench size={16} className="mr-2" />
                Assistência Técnica
              </a>
              <a
                href="/central-ajuda"
                className="flex items-center text-gray-700 hover:text-blue-600 transition-colors py-2"
              >
                <CircleQuestionMark size={16} className="mr-2" />
                Ajuda
              </a>
            </div>
            {usuario?.tipo === "funcionario" && (
              <div className="border-t pt-3 space-y-2">
                <h4 className="font-semibold text-gray-800 text-sm">Administração</h4>
                {canEditHomePage && (
                  <a
                    href="/editar-home"
                    className="flex items-center text-orange-700 hover:text-orange-600 transition-colors py-2"
                  >
                    <Edit3 size={16} className="mr-2" />
                    Home
                  </a>
                )}
                <a
                  href="/gestao/produtos"
                  className="flex items-center text-green-700 hover:text-green-600 transition-colors py-2"
                >
                  <Package size={16} className="mr-2" />
                  Produtos
                </a>
                <a href="#" className="flex items-center text-yellow-700 hover:text-yellow-600 transition-colors py-2">
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