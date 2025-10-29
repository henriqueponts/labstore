"use client"

import type React from "react"
import { useEffect, useState, useRef } from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
import Layout from "../components/Layout"
import { Clock, CheckCircle, XCircle, Loader2, Home, Package } from "lucide-react"

interface PedidoStatus {
  status: "pago" | "pending" | "failed" | string
}

const AguardoPagamento: React.FC = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const [paymentLinkId, setPaymentLinkId] = useState<string | null>(null)
  const [pedidoStatus, setPedidoStatus] = useState<PedidoStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tentativas, setTentativas] = useState(0)
  const maxTentativas = 60

  // Usamos uma ref para guardar o ID do intervalo, evitando que ele cause re-renderizações
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const id = searchParams.get("order_id")
    if (id) {
      setPaymentLinkId(id)
    } else {
      navigate("/")
    }
  }, [searchParams, navigate])

  const verificarStatusNoNossoDB = async () => {
    if (!paymentLinkId) return

    // Incrementa o contador de tentativas para a UI
    setTentativas((prev) => prev + 1)

    try {
      const token = localStorage.getItem("token")
      if (!token) {
        setError("Sessão expirada. Faça login novamente.")
        if (intervalRef.current) clearInterval(intervalRef.current) // Para o intervalo
        return
      }

      const response = await fetch(`http://localhost:3000/pedido/status-geral/${paymentLinkId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const data: PedidoStatus = await response.json()
        setPedidoStatus(data)
        setError(null)

        if (data.status === "pago") {
          console.log("Status 'pago' recebido! Parando verificações e redirecionando...")
          if (intervalRef.current) clearInterval(intervalRef.current) // Para o intervalo
          navigate(`/pagamento-sucesso?order_id=${paymentLinkId}`)
        }
      } else {
        const errorData = await response.json()
        setError(errorData.message || "Erro ao verificar status do pedido.")
      }
    } catch (err) {
      console.error("Erro de conexão:", err)
      setError("Não foi possível conectar ao servidor.")
    } finally {
      if (loading) setLoading(false)
    }
  }

  // ================== useEffect CORRIGIDO ==================
  useEffect(() => {
    // Só começa o processo se tivermos o ID do link de pagamento
    if (paymentLinkId) {
      // Limpa qualquer intervalo anterior para segurança
      if (intervalRef.current) clearInterval(intervalRef.current)

      // Faz a primeira verificação imediatamente
      verificarStatusNoNossoDB()

      // Configura o intervalo para as verificações seguintes
      intervalRef.current = setInterval(verificarStatusNoNossoDB, 5000)

      // Função de limpeza: será chamada quando o componente for desmontado
      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
        }
      }
    }
    // A dependência é apenas o `paymentLinkId`. O efeito só reinicia se o ID na URL mudar.
  }, [paymentLinkId])

  // Efeito separado para parar o polling quando o máximo de tentativas for atingido
  useEffect(() => {
    if (tentativas >= maxTentativas) {
      console.log("Máximo de tentativas atingido. Parando o polling.")
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [tentativas])

  // Funções auxiliares para a UI (sem alterações)
  const getStatusIcon = () => {
    if (loading) return <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
    if (error) return <XCircle className="h-12 w-12 text-red-600" />
    if (pedidoStatus?.status === "pago") return <CheckCircle className="h-12 w-12 text-green-600" />
    return <Clock className="h-12 w-12 text-yellow-600" />
  }

  const getStatusMessage = () => {
    if (loading) return "Verificando status do pedido..."
    if (error) return error
    if (pedidoStatus?.status === "pago") return "Pagamento confirmado! Redirecionando..."
    if (tentativas > maxTentativas)
      return "O tempo de verificação excedeu. Por favor, verifique seus pedidos ou entre em contato conosco."
    return "Aguardando confirmação do pagamento..."
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="mb-6 flex justify-center">{getStatusIcon()}</div>

          <h1 className="text-2xl font-bold text-gray-900 mb-4">Verificando Pagamento</h1>

          <p className="text-gray-600 mb-6 min-h-[40px]">{getStatusMessage()}</p>

          {paymentLinkId && (
            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <p className="text-sm text-gray-500 mb-1">Referência do Pedido:</p>
              <p className="font-mono text-sm font-semibold text-gray-900 break-all">{paymentLinkId}</p>
            </div>
          )}

          {tentativas > maxTentativas && pedidoStatus?.status !== "pago" && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
              <p className="text-yellow-800 text-sm">
                Se você já realizou o pagamento, não se preocupe. Ele será processado. Você pode verificar o status mais
                tarde na página "Meus Pedidos".
              </p>
            </div>
          )}

          <div className="space-y-3 mt-8">
            <button
              onClick={() => navigate("/meus-pedidos")}
              className="w-full border border-gray-300 hover:border-gray-400 text-gray-700 px-6 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center"
            >
              <Package size={20} className="mr-2" />
              Ver Meus Pedidos
            </button>

            <button
              onClick={() => navigate("/")}
              className="w-full text-gray-500 hover:text-gray-700 px-6 py-2 rounded-xl transition-all duration-200 flex items-center justify-center"
            >
              <Home size={20} className="mr-2" />
              Voltar ao Início
            </button>
          </div>

          {!loading && pedidoStatus?.status !== "pago" && tentativas <= maxTentativas && (
            <p className="text-xs text-gray-400 mt-6">
              Verificando automaticamente... ({tentativas}/{maxTentativas})
            </p>
          )}
        </div>
      </div>
    </Layout>
  )
}

export default AguardoPagamento
