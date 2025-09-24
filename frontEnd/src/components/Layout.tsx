// Salve como: frontEnd/src/components/Layout.tsx

"use client"

/* eslint-disable @typescript-eslint/no-unused-vars */
import axios from "axios"
import type React from "react"
import { useEffect, useState, useCallback } from "react"
import type { ReactNode } from "react"
import Header from "./Header"
import { useNavigate, useLocation } from "react-router-dom"
import { useCart } from "../context/CartContext"

interface UsuarioData {
  id_cliente?: number
  id_usuario?: number
  nome?: string
  email: string
  tipo: "cliente" | "funcionario"
  tipo_perfil?: "admin" | "analista"
}

interface LayoutProps {
  children: ReactNode
  showHeader?: boolean
  backgroundColor?: string
  showLoading?: boolean
}

const Layout: React.FC<LayoutProps> = ({
  children,
  showHeader = true,
  backgroundColor = "bg-gray-50",
  showLoading = true,
}) => {
  const navigate = useNavigate()
  const location = useLocation()
  const [usuario, setUsuario] = useState<UsuarioData | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const { handleLogoutAndClearCart } = useCart()

  // Usamos useCallback para garantir que a função checkUser não mude a cada render
  const checkUser = useCallback(async () => {
    // A lógica de setLoading é movida para dentro para evitar flashes
    // e só é ativada se showLoading for true
    if (showLoading) setLoading(true)
    try {
      const token = localStorage.getItem("token")
      if (token) {
        // Define o header para a verificação
        axios.defaults.headers.common["Authorization"] = `Bearer ${token}`
        const response = await axios.get("http://localhost:3000/auth/me")

        if (response.status === 200) {
          setUsuario(response.data)
        } else {
          // Se a resposta não for 200, trata como logout
          handleLogoutAndClearCart()
          setUsuario(null)
        }
      } else {
        // Se não há token, garante que o estado esteja limpo
        setUsuario(null)
      }
    } catch (err) {
      // Se a requisição falhar (ex: token inválido), limpa tudo
      handleLogoutAndClearCart()
      setUsuario(null)
    } finally {
      if (showLoading) setLoading(false)
    }
  }, [handleLogoutAndClearCart, showLoading]) // A função depende do logout do contexto e da prop showLoading

  // O useEffect agora roda na montagem inicial E toda vez que o pathname da URL muda.
  useEffect(() => {
    checkUser()
  }, [location.pathname, checkUser]) // Dependência de rota ajustada para pathname para evitar re-renders desnecessários em mudanças de query params

  const handleLogout = () => {
    handleLogoutAndClearCart() // Chama a função do contexto que limpa o carrinho e o localStorage
    setUsuario(null) // Atualiza o estado do usuário no Layout imediatamente
    navigate("/") // Redireciona para a página inicial
  }

  if (loading && showLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen ${backgroundColor}`}>
      {showHeader && (
        <Header usuario={usuario} onLogout={handleLogout} searchTerm={searchTerm} onSearchChange={setSearchTerm} />
      )}

      {children}
    </div>
  )
}

export default Layout