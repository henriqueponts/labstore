"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
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
  ArrowLeft,
  Ban,
  CreditCard,
  Calendar,
  User,
  Truck,
  X,
} from "lucide-react"

interface SolicitacaoDetalhes {
  id_solicitacao: number
  tipo_equipamento: string
  marca: string
  modelo: string
  descricao_problema: string
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
  nome_cliente: string
  email_cliente: string
  telefone_cliente: string | null
  fotos: string[]
}

export default function DetalhesSolicitacao() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [solicitacao, setSolicitacao] = useState<SolicitacaoDetalhes | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const fetchSolicitacao = async () => {
    try {
      const response = await axios.get(`http://localhost:3000/assistencia/solicitacao/${id}`)
      setSolicitacao(response.data)
    } catch (err: any) {
      setError(err.response?.data?.message || "Erro ao carregar solicitação")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (id) {
      fetchSolicitacao()
    }
  }, [id])

  const handleAprovarOrcamento = async () => {
    try {
      await axios.put(`http://localhost:3000/assistencia/aprovar-orcamento/${id}`)
      setSuccess("Orçamento aprovado! Prossiga com a confirmação do pagamento.")
      fetchSolicitacao()
    } catch (err: any) {
      setError(err.response?.data?.message || "Erro ao aprovar orçamento")
    }
  }

  const handleRejeitarOrcamento = async () => {
    try {
      await axios.put(`http://localhost:3000/assistencia/rejeitar-orcamento/${id}`)
      setSuccess("Orçamento rejeitado com sucesso!")
      fetchSolicitacao()
    } catch (err: any) {
      setError(err.response?.data?.message || "Erro ao rejeitar orçamento")
    }
  }

  const handleCancelarSolicitacao = async () => {
    try {
      await axios.put(`http://localhost:3000/assistencia/cancelar/${id}`)
      navigate("/acompanhar-solicitacoes")
    } catch (err: any) {
      setError(err.response?.data?.message || "Erro ao cancelar solicitação")
    }
  }

  const handleConfirmarPagamento = async () => {
    try {
      await axios.put(`http://localhost:3000/assistencia/confirmar-pagamento/${id}`)
      setSuccess("Pagamento confirmado com sucesso! Envie o equipamento conforme o método informado.")
      fetchSolicitacao()
    } catch (err: any) {
      setError(err.response?.data?.message || "Erro ao confirmar pagamento")
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
      solicitado: { label: "Solicitado", color: "bg-blue-100 text-blue-800", icon: <Clock className="h-5 w-5" /> },
      em_analise: { label: "Em Análise", color: "bg-yellow-100 text-yellow-800", icon: <AlertCircle className="h-5 w-5" /> },
      aguardando_aprovacao: { label: "Aguardando Aprovação", color: "bg-purple-100 text-purple-800", icon: <DollarSign className="h-5 w-5" /> },
      aguardando_pagamento: { label: "Aguardando Pagamento", color: "bg-orange-100 text-orange-800", icon: <CreditCard className="h-5 w-5" /> },
      aprovado: { label: "Aprovado (Aguard. Equip.)", color: "bg-teal-100 text-teal-800", icon: <Package className="h-5 w-5" /> },
      em_execucao: { label: "Em Execução", color: "bg-indigo-100 text-indigo-800", icon: <Wrench className="h-5 w-5" /> },
      aguardando_retirada_envio: { label: "Aguardando Retirada/Envio", color: "bg-cyan-100 text-cyan-800", icon: <Truck className="h-5 w-5" /> },
      concluido: { label: "Concluído", color: "bg-green-100 text-green-800", icon: <CheckCircle className="h-5 w-5" /> },
      rejeitado: { label: "Rejeitado", color: "bg-red-100 text-red-800", icon: <XCircle className="h-5 w-5" /> },
      cancelado: { label: "Cancelado", color: "bg-gray-100 text-gray-800", icon: <Ban className="h-5 w-5" /> },
    }
    const config = statusConfig[status] || statusConfig.solicitado
    return (
      <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${config.color}`}>
        {config.icon}
        <span className="text-lg font-semibold">{config.label}</span>
      </div>
    )
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Data não disponível"
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
            <p className="text-gray-600">Carregando detalhes...</p>
          </div>
        </div>
      </Layout>
    )
  }

  if (!solicitacao) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 py-12">
          <div className="max-w-4xl mx-auto px-4">
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Erro ao Carregar Solicitação</h2>
              <p className="text-gray-600 mb-6">{error || "Solicitação não encontrada"}</p>
              <button
                onClick={() => navigate("/acompanhar-solicitacoes")}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Voltar
              </button>
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-5xl mx-auto px-4">
          {/* Componente de Notificação */}
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

          {/* Header */}
          <div className="mb-6">
            <button
              onClick={() => navigate("/acompanhar-solicitacoes")}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4"
            >
              <ArrowLeft className="h-5 w-5" />
              Voltar para Solicitações
            </button>
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-gray-800 mb-2">
                  Protocolo: AT-{solicitacao.id_solicitacao.toString().padStart(6, "0")}
                </h1>
                <p className="text-gray-600">Solicitado em: {formatDate(solicitacao.data_solicitacao)}</p>
              </div>
              {getStatusBadge(solicitacao.status)}
            </div>
          </div>

          {/* Conteúdo Principal */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Informações do Equipamento */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Wrench className="h-6 w-6 text-blue-600" />
                  Informações do Equipamento
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  <div><p className="text-sm text-gray-600">Tipo</p><p className="font-semibold text-gray-800">{solicitacao.tipo_equipamento}</p></div>
                  <div><p className="text-sm text-gray-600">Marca</p><p className="font-semibold text-gray-800">{solicitacao.marca}</p></div>
                  <div><p className="text-sm text-gray-600">Modelo</p><p className="font-semibold text-gray-800">{solicitacao.modelo}</p></div>
                  <div><p className="text-sm text-gray-600">Forma de Envio</p><p className="font-semibold text-gray-800 flex items-center gap-2"><Truck className="h-4 w-4" />{solicitacao.forma_envio}</p></div>
                </div>
              </div>

              {/* Descrição do Problema */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Descrição do Problema</h2>
                <p className="text-gray-700 whitespace-pre-wrap break-words">{solicitacao.descricao_problema}</p>
              </div>

              {/* Fotos */}
              {solicitacao.fotos && solicitacao.fotos.length > 0 && (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-xl font-bold text-gray-800 mb-4">Fotos do Equipamento</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {solicitacao.fotos.map((foto, index) => (
                      <a key={index} href={`http://localhost:3000${foto}`} target="_blank" rel="noopener noreferrer" className="cursor-pointer">
                        <img src={`http://localhost:3000${foto}`} alt={`Foto ${index + 1}`} className="w-full h-40 object-cover rounded-lg border border-gray-300 hover:opacity-90 transition-opacity" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Orçamento */}
              {solicitacao.id_orcamento && (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2"><DollarSign className="h-6 w-6 text-green-600" />Orçamento</h2>
                  {solicitacao.diagnostico && <div className="mb-4"><p className="text-sm text-gray-600 mb-1">Diagnóstico</p><p className="text-gray-700 whitespace-pre-wrap break-words">{solicitacao.diagnostico}</p></div>}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    {solicitacao.valor_pecas !== null && <div><p className="text-sm text-gray-600">Valor das Peças</p><p className="text-lg font-semibold text-gray-800">{formatCurrency(solicitacao.valor_pecas)}</p></div>}
                    {solicitacao.valor_mao_obra !== null && <div><p className="text-sm text-gray-600">Mão de Obra</p><p className="text-lg font-semibold text-gray-800">{formatCurrency(solicitacao.valor_mao_obra)}</p></div>}
                  </div>
                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center mb-4"><p className="text-lg font-semibold text-gray-700">Valor Total</p><p className="text-2xl font-bold text-green-600">{formatCurrency(Number(solicitacao.valor_pecas || 0) + Number(solicitacao.valor_mao_obra || 0))}</p></div>
                    {solicitacao.prazo_entrega_dias && <div className="flex items-center gap-2 text-gray-600 mb-2"><Calendar className="h-5 w-5" /><span>Prazo de entrega: {solicitacao.prazo_entrega_dias} dias</span></div>}
                    {solicitacao.nome_analista && <div className="flex items-center gap-2 text-gray-600"><User className="h-5 w-5" /><span>Analista: {solicitacao.nome_analista}</span></div>}
                  </div>
                  {solicitacao.observacoes_tecnicas && <div className="mt-4 p-4 bg-gray-50 rounded-lg"><p className="text-sm text-gray-600 mb-1">Observações Técnicas</p><p className="text-gray-700 whitespace-pre-wrap break-words">{solicitacao.observacoes_tecnicas}</p></div>}
                </div>
              )}
            </div>

            {/* Coluna Direita - Ações e Linha do Tempo */}
            <div className="lg:col-span-1 space-y-6">
              {/* CORREÇÃO AQUI: A classe "sticky" foi removida */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="font-semibold text-gray-800 mb-4">Ações Disponíveis</h3>
                <div className="space-y-3">
                  {solicitacao.status === "aguardando_aprovacao" && (
                    <>
                      <button onClick={handleAprovarOrcamento} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"><CheckCircle className="h-5 w-5" />Aprovar Orçamento</button>
                      <button onClick={handleRejeitarOrcamento} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold"><XCircle className="h-5 w-5" />Rejeitar Orçamento</button>
                    </>
                  )}
                  {solicitacao.status === "aguardando_pagamento" && (
                    <button onClick={handleConfirmarPagamento} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"><CreditCard className="h-5 w-5" />Confirmar Pagamento</button>
                  )}
                  {solicitacao.status === "solicitado" && (
                    <button onClick={handleCancelarSolicitacao} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-semibold"><Ban className="h-5 w-5" />Cancelar Solicitação</button>
                  )}
                  {!["solicitado", "aguardando_aprovacao", "aguardando_pagamento"].includes(solicitacao.status) && (
                    <p className="text-sm text-gray-500 text-center">Nenhuma ação disponível no momento.</p>
                  )}
                </div>
              </div>

              {/* Linha do Tempo */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="font-semibold text-gray-800 mb-4">Linha do Tempo</h3>
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="flex flex-col items-center"><div className="w-3 h-3 bg-green-500 rounded-full"></div><div className="w-0.5 h-full bg-gray-200"></div></div>
                    <div className="pb-4 -mt-1"><p className="font-medium text-gray-800">Solicitação Criada</p><p className="text-sm text-gray-500">{formatDate(solicitacao.data_solicitacao)}</p></div>
                  </div>
                  {solicitacao.data_criacao_orcamento && (
                    <div className="flex gap-3">
                      <div className="flex flex-col items-center"><div className={`w-3 h-3 ${solicitacao.status === 'rejeitado' ? 'bg-red-500' : 'bg-green-500'} rounded-full`}></div><div className="w-0.5 h-full bg-gray-200"></div></div>
                      <div className="pb-4 -mt-1"><p className="font-medium text-gray-800">Orçamento Disponível</p><p className="text-sm text-gray-500">{formatDate(solicitacao.data_criacao_orcamento)}</p></div>
                    </div>
                  )}
                  {solicitacao.data_aprovacao_orcamento && (
                    <div className="flex gap-3">
                      <div className="flex flex-col items-center"><div className="w-3 h-3 bg-green-500 rounded-full"></div><div className="w-0.5 h-full bg-gray-200"></div></div>
                      <div className="pb-4 -mt-1"><p className="font-medium text-gray-800">Orçamento Aprovado</p><p className="text-sm text-gray-500">{formatDate(solicitacao.data_aprovacao_orcamento)}</p></div>
                    </div>
                  )}
                  {solicitacao.data_conclusao_servico && (
                    <div className="flex gap-3">
                      <div className="flex flex-col items-center"><div className="w-3 h-3 bg-green-500 rounded-full"></div></div>
                      <div className="-mt-1"><p className="font-medium text-gray-800">Serviço Concluído</p><p className="text-sm text-gray-500">{formatDate(solicitacao.data_conclusao_servico)}</p></div>
                    </div>
                  )}
                  {solicitacao.status === 'rejeitado' && (
                     <div className="flex gap-3">
                      <div className="flex flex-col items-center"><div className="w-3 h-3 bg-red-500 rounded-full"></div></div>
                      <div className="-mt-1"><p className="font-medium text-gray-800">Orçamento Rejeitado</p><p className="text-sm text-gray-500">O orçamento foi recusado pelo cliente.</p></div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}