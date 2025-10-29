"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import Layout from "../components/Layout"
import axios from "axios"
import {
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Wrench,
  DollarSign,
  Package,
  Eye,
  Ban,
  CreditCard,
  X,
} from "lucide-react"

interface Solicitacao {
  id_solicitacao: number
  tipo_equipamento: string
  marca: string
  modelo: string
  descricao_problema: string
  fotoUrl: string | null
  forma_envio: string
  data_solicitacao: string
  status: string
  data_aprovacao_orcamento: string | null
  data_conclusao_servico: string | null
  motivo_recusa_orcamento: string | null
  id_orcamento: number | null
  diagnostico: string | null
  valor_pecas: number | null
  valor_mao_obra: number | null
  prazo_entrega_dias: number | null
  observacoes_tecnicas: string | null
  status_aprovacao: string | null
  data_criacao_orcamento: string | null
  nome_analista: string | null
}

export default function AcompanharSolicitacoes() {
  const navigate = useNavigate()
  const [solicitacoes, setSolicitacoes] = useState<Solicitacao[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const fetchSolicitacoes = async () => {
    setError(null)
    try {
      const token = localStorage.getItem("token")
      const response = await axios.get("http://localhost:3000/assistencia/minhas-solicitacoes", {
        headers: { Authorization: `Bearer ${token}` },
      })
      setSolicitacoes(response.data)
    } catch (err: any) {
      setError(err.response?.data?.message || "Erro ao carregar solicitações")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSolicitacoes()
  }, [])

  const handleAprovarOrcamento = async (id: number) => {
    try {
      await axios.put(`http://localhost:3000/assistencia/aprovar-orcamento/${id}`)
      setSuccess("Orçamento aprovado! Prossiga com a confirmação do pagamento.")
      fetchSolicitacoes()
    } catch (err: any) {
      setError(err.response?.data?.message || "Erro ao aprovar orçamento")
    }
  }

  const handleRejeitarOrcamento = async (id: number) => {
    try {
      await axios.put(`http://localhost:3000/assistencia/rejeitar-orcamento/${id}`)
      setSuccess("Orçamento rejeitado com sucesso.")
      fetchSolicitacoes()
    } catch (err: any) {
      setError(err.response?.data?.message || "Erro ao rejeitar orçamento")
    }
  }

  const handleCancelarSolicitacao = async (id: number) => {
    try {
      await axios.put(`http://localhost:3000/assistencia/cancelar/${id}`)
      setSuccess("Solicitação cancelada com sucesso.")
      fetchSolicitacoes()
    } catch (err: any) {
      setError(err.response?.data?.message || "Erro ao cancelar solicitação")
    }
  }

  const handleConfirmarPagamento = async (id: number) => {
    try {
      await axios.put(`http://localhost:3000/assistencia/confirmar-pagamento/${id}`)
      setSuccess("Pagamento confirmado com sucesso! O serviço foi aprovado.")
      fetchSolicitacoes()
    } catch (err: any) {
      setError(err.response?.data?.message || "Erro ao confirmar pagamento")
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
      solicitado: { label: "Solicitado", color: "bg-blue-100 text-blue-800", icon: <Clock className="h-4 w-4" /> },
      em_analise: { label: "Em Análise", color: "bg-yellow-100 text-yellow-800", icon: <AlertCircle className="h-4 w-4" /> },
      aguardando_aprovacao: { label: "Aguardando Aprovação", color: "bg-purple-100 text-purple-800", icon: <DollarSign className="h-4 w-4" /> },
      aguardando_pagamento: { label: "Aguardando Pagamento", color: "bg-orange-100 text-orange-800", icon: <CreditCard className="h-4 w-4" /> },
      aprovado: { label: "Aprovado", color: "bg-green-100 text-green-800", icon: <CheckCircle className="h-4 w-4" /> },
      em_execucao: { label: "Em Execução", color: "bg-indigo-100 text-indigo-800", icon: <Wrench className="h-4 w-4" /> },
      concluido: { label: "Concluído", color: "bg-green-100 text-green-800", icon: <Package className="h-4 w-4" /> },
      rejeitado: { label: "Rejeitado", color: "bg-red-100 text-red-800", icon: <XCircle className="h-4 w-4" /> },
      cancelado: { label: "Cancelado", color: "bg-gray-100 text-gray-800", icon: <Ban className="h-4 w-4" /> },
    }
    const config = statusConfig[status] || statusConfig.solicitado
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
        {config.icon} {config.label}
      </span>
    )
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return ""
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatCurrency = (value: number | null) => {
    if (value === null) return "N/A"
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value)
  }

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando solicitações...</p>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Minhas Solicitações de Assistência</h1>
            <p className="text-gray-600">Acompanhe o status das suas solicitações de manutenção</p>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded flex justify-between items-center shadow">
              <span>{error}</span>
              <button onClick={() => setError(null)}>
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
          {success && (
            <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded flex justify-between items-center shadow">
              <span>{success}</span>
              <button onClick={() => setSuccess(null)}>
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {solicitacoes.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <Wrench className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">Nenhuma solicitação encontrada</h3>
              <p className="text-gray-500 mb-6">Você ainda não possui solicitações de assistência técnica.</p>
              <button onClick={() => navigate("/nova-solicitacao-assistencia")} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Nova Solicitação
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {solicitacoes.map((solicitacao) => (
                <div key={solicitacao.id_solicitacao} className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start mb-4 gap-4">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-800 mb-1">
                        Protocolo: AT-{solicitacao.id_solicitacao.toString().padStart(6, "0")}
                      </h3>
                      <p className="text-gray-600">{solicitacao.marca} {solicitacao.modelo} - {solicitacao.tipo_equipamento}</p>
                      <p className="text-sm text-gray-500 mt-1">Solicitado em: {formatDate(solicitacao.data_solicitacao)}</p>
                    </div>
                    <div className="flex-shrink-0">{getStatusBadge(solicitacao.status)}</div>
                  </div>
                  <div className="border-t pt-4 mb-4">
                    <p className="text-gray-700 line-clamp-2 break-words">{solicitacao.descricao_problema}</p>
                  </div>
                  {solicitacao.status === "aguardando_aprovacao" && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                      <p className="font-semibold text-yellow-800 mb-2">Orçamento Disponível!</p>
                      <p className="text-yellow-700">Valor Total: {formatCurrency(Number(solicitacao.valor_pecas || 0) + Number(solicitacao.valor_mao_obra || 0))}</p>
                    </div>
                  )}
                  {solicitacao.status === "aguardando_pagamento" && (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
                      <p className="font-semibold text-orange-800">Aguardando Pagamento</p>
                      <p className="text-orange-700 text-sm">Realize o pagamento para iniciar o serviço</p>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => navigate(`/acompanhar-solicitacoes/${solicitacao.id_solicitacao}`)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                      <Eye className="h-4 w-4" /> Ver Detalhes
                    </button>
                    {solicitacao.status === "solicitado" && (
                      <button onClick={() => handleCancelarSolicitacao(solicitacao.id_solicitacao)} className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors">
                        <Ban className="h-4 w-4" /> Cancelar
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}