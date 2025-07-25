"use client"

import type React from "react"
import { useState } from "react"
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
} from "lucide-react"
import { useCart } from "../context/CartContext" // <-- IMPORTADO

interface UsuarioData {
  id_cliente?: number
  id_usuario?: number
  nome?: string
  email: string
  tipo: "cliente" | "funcionario"
  tipo_perfil?: "admin" | "analista"
}

interface HeaderProps {
  usuario: UsuarioData | null
  onLogout: () => void
  searchTerm: string
  onSearchChange: (value: string) => void
}

const Header: React.FC<HeaderProps> = ({ usuario, onLogout, searchTerm, onSearchChange }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const navigate = useNavigate()
  const { totalItens } = useCart() // <-- ADICIONADO

  return (
    <header className="bg-white shadow-md relative z-50">
      {/* Main header */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-blue-600 cursor-pointer" onClick={() => navigate("/")}>
              LabStore
            </h1>
            <span className="text-sm text-gray-500 ml-2 hidden md:block">Tecnologia & Inovação</span>
          </div>

          {/* Search bar */}
          <div className="flex-1 max-w-xl mx-4 md:mx-8">
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar produtos..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <Search className="absolute right-3 top-2.5 text-gray-400" size={20} />
            </div>
          </div>

          {/* User actions */}
          <div className="flex items-center space-x-2 md:space-x-4">
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
                <div className="text-sm">
                  <span className="text-gray-700 hidden md:inline">Olá, </span>
                  <span className="font-medium text-blue-600">
                    {usuario.nome?.split(" ")[0] || usuario.email.split("@")[0]}
                  </span>
                </div>
                {usuario.tipo === "funcionario" && (
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      usuario.tipo_perfil === "admin" ? "bg-purple-100 text-purple-800" : "bg-green-100 text-green-800"
                    }`}
                  >
                    {usuario.tipo_perfil === "admin" ? "Admin" : "Técnico"}
                  </span>
                )}
                <button onClick={onLogout} className="text-gray-500 hover:text-red-600 transition-colors" title="Sair">
                  <LogOut size={18} />
                </button>
              </div>
            )}

            {/* Carrinho - só aparece para clientes ou visitantes */}
            {(!usuario || usuario.tipo === "cliente") && (
              <button 
                onClick={() => navigate('/carrinho')} // <-- ADICIONADO
                className="relative flex items-center text-gray-700 hover:text-blue-600 transition-colors"
              >
                <ShoppingCart size={20} />
                {totalItens > 0 && ( // <-- ADICIONADO
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {totalItens}
                  </span>
                )}
              </button>
            )}

            {/* Mobile menu button */}
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden text-gray-700 p-1">
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* O resto do componente permanece o mesmo */}
      {/* Desktop Navigation Menu */}
      <div className="bg-gray-100 border-t hidden md:block">
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex space-x-8 py-3">
            {/* Menu público */}
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

            {/* Menu administrativo */}
            {usuario?.tipo === "funcionario" && (
              <>
                <div className="border-l border-gray-300 mx-4"></div>
                <a
                  href="/gestao/produtos"
                  className="flex items-center text-green-700 hover:text-green-600 transition-colors"
                >
                  <Package size={16} className="mr-1" />
                  Gerenciar Produtos
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
                    <a href="/gestao/lgpd" className="flex items-center text-purple-700 hover:text-purple-600 transition-colors">
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
            {/* Menu público */}
            <div className="space-y-2">
              <h4 className="font-semibold text-gray-800 text-sm">Categorias</h4>
              <a href="/produtos" className="flex items-center text-gray-700 hover:text-blue-600 transition-colors py-2">
                <Monitor size={16} className="mr-2" />
                Produtos
              </a>
              <a href="#" className="flex items-center text-gray-700 hover:text-blue-600 transition-colors py-2">
                <Wrench size={16} className="mr-2" />
                Assistência Técnica
              </a>
              <a href="/central-ajuda" className="flex items-center text-gray-700 hover:text-blue-600 transition-colors py-2">
                <CircleQuestionMark size={16} className="mr-2" />
                Ajuda
              </a>
            </div>

            {/* Menu administrativo mobile */}
            {usuario?.tipo === "funcionario" && (
              <div className="border-t pt-3 space-y-2">
                <h4 className="font-semibold text-gray-800 text-sm">Administração</h4>
                <a
                  href="/gestao/produtos"
                  className="flex items-center text-green-700 hover:text-green-600 transition-colors py-2"
                >
                  <Package size={16} className="mr-2" />
                  Gerenciar Produtos
                </a>

                <a href="#" className="flex items-center text-yellow-700 hover:text-yellow-600 transition-colors py-2">
                  <Wrench size={16} className="mr-2" />
                  Solicitações
                </a>

                <a href="/gestao/chamados" className="flex items-center text-yellow-700 hover:text-yellow-600 transition-colors py-2">
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