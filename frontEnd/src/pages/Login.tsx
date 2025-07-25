"use client"

import axios from "axios"
import type React from "react"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import TermoLGPDModal from "../components/TermoLGPDModal"
import ErrorBoundary from "../components/ErrorBoundary"
import { useCart } from "../context/CartContext" // <-- 1. IMPORTADO

interface TermoData {
  id_termo: number
  conteudo: string
  versao: string
  data_efetiva: string
}

const LoginComLGPD: React.FC = () => {
  const [values, setValues] = useState({
    email: "",
    senha: "",
  })

  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [showTermoModal, setShowTermoModal] = useState(false)
  const [termoAtual, setTermoAtual] = useState<TermoData | null>(null)
  const [tempUserData, setTempUserData] = useState<any>(null)

  const navigate = useNavigate()
  const { buscarCarrinho } = useCart() // <-- 2. OBTENDO A FUNÇÃO DO CONTEXTO

  const handleChanges = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setValues({ ...values, [e.target.name]: e.target.value })
    if (error) setError("")
  }

  // Função auxiliar para finalizar o login e atualizar o carrinho
  const finalizarLogin = async (token: string, usuario: any) => {
    localStorage.setItem("token", token)
    localStorage.setItem("usuario", JSON.stringify(usuario))
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`

    // Se o usuário for um cliente, busca os dados do carrinho
    if (usuario.tipo === 'cliente') {
      await buscarCarrinho()
    }

    navigate("/")
  }

  const verificarConsentimento = async (userData: any, token: string) => {
    try {
      if (userData.tipo !== "cliente") {
        console.log("👤 Usuário é funcionário - não precisa aceitar termo LGPD")
        return false
      }

      console.log("🔍 Verificando consentimento para cliente:", userData.id)

      const response = await axios.get(`http://localhost:3000/lgpd/verificar-consentimento/${userData.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      console.log("📄 Resposta da verificação:", response.data)

      if (response.data.precisa_aceitar) {
        const termoAtual = response.data.termo_atual

        if (!termoAtual || !termoAtual.conteudo) {
          console.error("❌ Termo atual inválido ou sem conteúdo:", termoAtual)
          setError("Erro ao carregar termo LGPD. Contate o administrador.")
          return false
        }

        console.log("📋 Termo carregado:", termoAtual.versao)
        setTermoAtual(termoAtual)
        setTempUserData({ userData, token })
        setShowTermoModal(true)
        return true
      }

      console.log("✅ Cliente não precisa aceitar novo termo")
      return false
    } catch (error) {
      console.error("❌ Erro ao verificar consentimento:", error)

      if (axios.isAxiosError(error) && error.response?.status === 404) {
        console.log("⚠️ Nenhum termo LGPD cadastrado - prosseguindo com login")
        return false
      }

      setError("Erro ao verificar consentimento LGPD. Tente novamente.")
      return false
    }
  }

  const handleAcceptTermo = async (termoId: number) => {
    try {
      const token = tempUserData.token
      await axios.post(
        "http://localhost:3000/lgpd/aceitar-termo",
        { id_termo: termoId },
        { headers: { Authorization: `Bearer ${token}` } },
      )

      setShowTermoModal(false)
      // <-- 3. CHAMANDO A FUNÇÃO CENTRALIZADA APÓS ACEITAR O TERMO
      await finalizarLogin(token, tempUserData.userData)

    } catch (error) {
      console.error("Erro ao aceitar termo:", error)
      setError("Erro ao processar consentimento. Tente novamente.")
      setShowTermoModal(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await axios.post("http://localhost:3000/auth/login", values)
      const { token, usuario } = response.data

      const precisaAceitarTermo = await verificarConsentimento(usuario, token)

      if (!precisaAceitarTermo) {
        // <-- 4. CHAMANDO A FUNÇÃO CENTRALIZADA NO LOGIN DIRETO
        await finalizarLogin(token, usuario)
      }
    } catch (error) {
      console.error("Erro no login:", error)

      if (axios.isAxiosError(error) && error.response) {
        setError(error.response.data.message || "Erro ao fazer login. Tente novamente.")
      } else {
        setError("Erro ao fazer login. Tente novamente.")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
          <div className="text-center mb-6">
            <a href="/">
              <h2 className="text-2xl font-bold text-gray-800">LAB Store</h2>
            </a>
            <p className="text-gray-600 text-sm mt-2">Acesse sua conta</p>
          </div>

          {error && <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={values.email}
                onChange={handleChanges}
                placeholder="Digite seu email"
                className="w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div className="mb-6">
              <label htmlFor="senha" className="block text-sm font-medium text-gray-700 mb-1">
                Senha
              </label>
              <input
                type="password"
                id="senha"
                name="senha"
                value={values.senha}
                onChange={handleChanges}
                placeholder="Digite sua senha"
                className="w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div className="mb-6">
              <button
                type="submit"
                disabled={loading}
                className={`w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition duration-150 ease-in-out ${
                  loading ? "opacity-70 cursor-not-allowed" : ""
                }`}
              >
                {loading ? "Entrando..." : "Entrar"}
              </button>
            </div>

            <div className="border-t pt-4">
              <div className="text-center mb-3">
                <span className="text-sm text-gray-600">Não tem uma conta?</span>
                <a href="/cadastro/cliente"> Registre-se </a>
              </div>

              <div className="text-center mb-3">
                <a href="/esqueceu-senha">Esqueceu sua senha?</a>
              </div>
            </div>
          </form>
        </div>
      </div>

      <ErrorBoundary>
        <TermoLGPDModal
          isOpen={showTermoModal}
          termo={termoAtual}
          onAccept={handleAcceptTermo}
          canClose={false}
          title="Aceite dos Termos LGPD Necessário"
        />
      </ErrorBoundary>
    </>
  )
}

export default LoginComLGPD