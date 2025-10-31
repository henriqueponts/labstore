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
  Search,
  Filter,
  CreditCard,
  FileText,
  ArrowLeft,
  User,
  Truck,
  X,
  BarChart3,
} from "lucide-react"

// Interfaces
interface Solicitacao {
  id_solicitacao: number
  tipo_equipamento: string
  marca: string
  modelo: string
  data_solicitacao: string
  status: string
  nome_cliente: string
  email_cliente: string
}

interface SolicitacaoDetalhada extends Solicitacao {
  fotos: string[]
  descricao_problema: string
  forma_envio: string
  telefone_cliente: string | null
  id_orcamento: number | null
  status_aprovacao: string | null
  nome_analista: string | null
  data_aprovacao_orcamento: string | null
  data_conclusao_servico: string | null
  motivo_recusa_orcamento: string | null
  diagnostico: string | null
  valor_pecas: number | null
  valor_mao_obra: number | null
  prazo_entrega_dias: number | null
  observacoes_tecnicas: string | null
  data_criacao_orcamento: string | null
}

export default function GestaoSolicitacoes() {
  const navigate = useNavigate()
  const [solicitacoes, setSolicitacoes] = useState<Solicitacao[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [filtroStatus, setFiltroStatus] = useState("")
  const [inputBusca, setInputBusca] = useState("")
  const [busca, setBusca] = useState("")

  const [solicitacaoSelecionada, setSolicitacaoSelecionada] = useState<SolicitacaoDetalhada | null>(null)

  const [showOrcamentoForm, setShowOrcamentoForm] = useState(false)
  const [orcamentoForm, setOrcamentoForm] = useState({
    diagnostico: "",
    valor_pecas: "",
    valor_mao_obra: "",
    prazo_entrega_dias: "",
    observacoes_tecnicas: "",
  })

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setBusca(inputBusca)
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [inputBusca])

  const fetchSolicitacoesList = async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (filtroStatus) params.append("status", filtroStatus)
      if (busca) params.append("busca", busca)

      const response = await axios.get(`http://localhost:3000/assistencia/gestao/solicitacoes?${params.toString()}`)
      setSolicitacoes(response.data)
    } catch (err: any) {
      setError(err.response?.data?.message || "Erro ao carregar solicitações")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!solicitacaoSelecionada) {
      fetchSolicitacoesList()
    }
  }, [filtroStatus, busca, solicitacaoSelecionada])

  const handleViewDetails = async (id: number) => {
    setLoading(true)
    setError(null)
    setSuccess(null)
    try {
      const response = await axios.get(`http://localhost:3000/assistencia/solicitacao/${id}`)
      setSolicitacaoSelecionada(response.data)
    } catch (err: any) {
      setError(err.response?.data?.message || "Erro ao carregar detalhes da solicitação")
    } finally {
      setLoading(false)
    }
  }

  const handleAtualizarStatus = async (id: number, novoStatus: string) => {
    setActionLoading(true)
    try {
      await axios.put(`http://localhost:3000/assistencia/gestao/atualizar-status/${id}`, { status: novoStatus })
      setSuccess(`Status atualizado para "${novoStatus}" com sucesso!`)
      await handleViewDetails(id)
    } catch (err: any) {
      setError(err.response?.data?.message || "Erro ao atualizar status")
    } finally {
      setActionLoading(false)
    }
  }

  const handleCriarOrcamento = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!solicitacaoSelecionada) return
    setError(null)

    const prazoDias = orcamentoForm.prazo_entrega_dias ? Number.parseInt(orcamentoForm.prazo_entrega_dias) : null
    if (prazoDias && prazoDias > 365) {
      setError("O prazo de entrega não pode exceder 365 dias.")
      return
    }

    setActionLoading(true)
    try {
      await axios.post(
        `http://localhost:3000/assistencia/gestao/criar-orcamento/${solicitacaoSelecionada.id_solicitacao}`,
        {
          diagnostico: orcamentoForm.diagnostico,
          valor_pecas: orcamentoForm.valor_pecas ? Number.parseFloat(orcamentoForm.valor_pecas) : null,
          valor_mao_obra: Number.parseFloat(orcamentoForm.valor_mao_obra),
          prazo_entrega_dias: prazoDias,
          observacoes_tecnicas: orcamentoForm.observacoes_tecnicas || null,
        },
      )
      setSuccess("Orçamento criado e enviado ao cliente com sucesso!")
      setShowOrcamentoForm(false)
      await handleViewDetails(solicitacaoSelecionada.id_solicitacao)
    } catch (err: any) {
      setError(err.response?.data?.message || "Erro ao criar orçamento")
    } finally {
      setActionLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
      solicitado: { label: "Solicitado", color: "bg-blue-100 text-blue-800", icon: <Clock className="h-4 w-4" /> },
      em_analise: {
        label: "Em Análise",
        color: "bg-yellow-100 text-yellow-800",
        icon: <AlertCircle className="h-4 w-4" />,
      },
      aguardando_aprovacao: {
        label: "Aguardando Aprovação",
        color: "bg-purple-100 text-purple-800",
        icon: <DollarSign className="h-4 w-4" />,
      },
      aguardando_pagamento: {
        label: "Aguardando Pagamento",
        color: "bg-orange-100 text-orange-800",
        icon: <CreditCard className="h-4 w-4" />,
      },
      aprovado: {
        label: "Aprovado (Aguard. Equip.)",
        color: "bg-teal-100 text-teal-800",
        icon: <Package className="h-4 w-4" />,
      },
      em_execucao: {
        label: "Em Execução",
        color: "bg-indigo-100 text-indigo-800",
        icon: <Wrench className="h-4 w-4" />,
      },
      aguardando_retirada_envio: {
        label: "Aguardando Retirada/Envio",
        color: "bg-cyan-100 text-cyan-800",
        icon: <Truck className="h-4 w-4" />,
      },
      concluido: {
        label: "Concluído",
        color: "bg-green-100 text-green-800",
        icon: <CheckCircle className="h-4 w-4" />,
      },
      rejeitado: { label: "Rejeitado", color: "bg-red-100 text-red-800", icon: <XCircle className="h-4 w-4" /> },
      cancelado: { label: "Cancelado", color: "bg-gray-100 text-gray-800", icon: <Ban className="h-4 w-4" /> },
    }
    const config = statusConfig[status] || statusConfig.solicitado
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
        {config.icon}
        {config.label}
      </span>
    )
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A"
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

  // REMOVIDO: A verificação de loading de tela cheia foi removida daqui.
  // if (loading && !solicitacaoSelecionada) { ... }

  if (solicitacaoSelecionada) {
    // A tela de detalhes permanece a mesma
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 py-12">
          <div className="max-w-5xl mx-auto px-4">
            {error && (
              <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded flex justify-between items-center">
                <span>{error}</span>
                <button onClick={() => setError(null)}>
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
            {success && (
              <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded flex justify-between items-center">
                <span>{success}</span>
                <button onClick={() => setSuccess(null)}>
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <div className="mb-6">
              <button
                onClick={() => setSolicitacaoSelecionada(null)}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4"
              >
                <ArrowLeft className="h-5 w-5" />
                Voltar para a Lista
              </button>
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-3xl font-bold text-gray-800 mb-2">
                    Protocolo: AT-{solicitacaoSelecionada.id_solicitacao.toString().padStart(6, "0")}
                  </h1>
                  <p className="text-gray-600">Solicitado em: {formatDate(solicitacaoSelecionada.data_solicitacao)}</p>
                </div>
                {getStatusBadge(solicitacaoSelecionada.status)}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                        <User className="h-5 w-5 text-blue-600" />
                        Cliente
                      </h3>
                      <div className="bg-gray-50 rounded-lg p-3 space-y-1 text-sm">
                        <p>
                          <strong>Nome:</strong> {solicitacaoSelecionada.nome_cliente}
                        </p>
                        <p>
                          <strong>Email:</strong> {solicitacaoSelecionada.email_cliente}
                        </p>
                        {solicitacaoSelecionada.telefone_cliente && (
                          <p>
                            <strong>Telefone:</strong> {solicitacaoSelecionada.telefone_cliente}
                          </p>
                        )}
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                        <Wrench className="h-5 w-5 text-blue-600" />
                        Equipamento
                      </h3>
                      <div className="bg-gray-50 rounded-lg p-3 space-y-1 text-sm">
                        <p>
                          <strong>Tipo:</strong> {solicitacaoSelecionada.tipo_equipamento}
                        </p>
                        <p>
                          <strong>Marca:</strong> {solicitacaoSelecionada.marca}
                        </p>
                        <p>
                          <strong>Modelo:</strong> {solicitacaoSelecionada.modelo}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="font-semibold text-gray-800 mb-3">Problema Relatado pelo Cliente</h3>
                  <p className="text-gray-700 whitespace-pre-wrap break-words">
                    {solicitacaoSelecionada.descricao_problema}
                  </p>
                  {solicitacaoSelecionada.fotos && solicitacaoSelecionada.fotos.length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-medium text-gray-700 mb-2">Fotos Enviadas:</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {solicitacaoSelecionada.fotos.map((foto, index) => (
                          <a
                            key={index}
                            href={`http://localhost:3000${foto}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <img
                              src={`http://localhost:3000${foto}`}
                              alt={`Foto ${index + 1}`}
                              className="w-full h-24 object-cover rounded-lg border"
                            />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-green-600" />
                    Orçamento
                  </h3>
                  {!solicitacaoSelecionada.id_orcamento && !showOrcamentoForm && (
                    <div className="text-center py-4 bg-gray-50 rounded-lg">
                      <p className="text-gray-600 mb-3">Nenhum orçamento criado para esta solicitação.</p>
                      <button
                        onClick={() => setShowOrcamentoForm(true)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        <FileText className="inline h-4 w-4 mr-2" />
                        Criar Orçamento
                      </button>
                    </div>
                  )}
                  {solicitacaoSelecionada.id_orcamento && (
                    <div className="space-y-2 text-sm">
                      <p>
                        <strong>Diagnóstico:</strong> {solicitacaoSelecionada.diagnostico}
                      </p>
                      <p>
                        <strong>Valor Peças:</strong> {formatCurrency(solicitacaoSelecionada.valor_pecas)}
                      </p>
                      <p>
                        <strong>Mão de Obra:</strong> {formatCurrency(solicitacaoSelecionada.valor_mao_obra)}
                      </p>
                      <p className="text-base font-bold">
                        <strong>Total:</strong>{" "}
                        {formatCurrency(
                          Number(solicitacaoSelecionada.valor_pecas || 0) +
                            Number(solicitacaoSelecionada.valor_mao_obra || 0),
                        )}
                      </p>
                    </div>
                  )}
                  {showOrcamentoForm && (
                    <form onSubmit={handleCriarOrcamento} className="space-y-4 pt-4 border-t">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Diagnóstico *</label>
                        <textarea
                          value={orcamentoForm.diagnostico}
                          onChange={(e) => setOrcamentoForm({ ...orcamentoForm, diagnostico: e.target.value })}
                          required
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          placeholder="Descreva o diagnóstico técnico..."
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Valor das Peças (R$)</label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={orcamentoForm.valor_pecas}
                            onChange={(e) => setOrcamentoForm({ ...orcamentoForm, valor_pecas: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            placeholder="0.00"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Mão de Obra (R$) *</label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={orcamentoForm.valor_mao_obra}
                            onChange={(e) => setOrcamentoForm({ ...orcamentoForm, valor_mao_obra: e.target.value })}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Prazo de Entrega (dias)</label>
                        <input
                          type="number"
                          min="1"
                          max="365"
                          value={orcamentoForm.prazo_entrega_dias}
                          onChange={(e) => setOrcamentoForm({ ...orcamentoForm, prazo_entrega_dias: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          placeholder="Ex: 7"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Observações Técnicas</label>
                        <textarea
                          value={orcamentoForm.observacoes_tecnicas}
                          onChange={(e) => setOrcamentoForm({ ...orcamentoForm, observacoes_tecnicas: e.target.value })}
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          placeholder="Observações adicionais..."
                        />
                      </div>
                      <div className="flex gap-4 pt-2">
                        <button
                          type="submit"
                          disabled={actionLoading}
                          className="flex-1 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                        >
                          {actionLoading ? "Criando..." : "Criar e Enviar Orçamento"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowOrcamentoForm(false)}
                          className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                        >
                          Cancelar
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>

              <div className="lg:col-span-1">
                <div className="bg-white rounded-lg shadow-md p-6 sticky top-6">
                  <h3 className="font-semibold text-gray-800 mb-4">Ações do Analista</h3>
                  <div className="space-y-2">
                    {solicitacaoSelecionada.status === "solicitado" && (
                      <button
                        onClick={() => handleAtualizarStatus(solicitacaoSelecionada.id_solicitacao, "em_analise")}
                        disabled={actionLoading}
                        className="w-full px-4 py-2 text-center bg-yellow-100 text-yellow-800 rounded-lg hover:bg-yellow-200 disabled:opacity-50"
                      >
                        Iniciar Análise
                      </button>
                    )}
                    {solicitacaoSelecionada.status === "aprovado" && (
                      <button
                        onClick={() => handleAtualizarStatus(solicitacaoSelecionada.id_solicitacao, "em_execucao")}
                        disabled={actionLoading}
                        className="w-full px-4 py-2 text-center bg-indigo-100 text-indigo-800 rounded-lg hover:bg-indigo-200 disabled:opacity-50"
                      >
                        Iniciar Execução do Reparo
                      </button>
                    )}
                    {solicitacaoSelecionada.status === "em_execucao" && (
                      <button
                        onClick={() =>
                          handleAtualizarStatus(solicitacaoSelecionada.id_solicitacao, "aguardando_retirada_envio")
                        }
                        disabled={actionLoading}
                        className="w-full px-4 py-2 text-center bg-cyan-100 text-cyan-800 rounded-lg hover:bg-cyan-200 disabled:opacity-50"
                      >
                        Finalizar Reparo
                      </button>
                    )}
                    {solicitacaoSelecionada.status === "aguardando_retirada_envio" && (
                      <button
                        onClick={() => handleAtualizarStatus(solicitacaoSelecionada.id_solicitacao, "concluido")}
                        disabled={actionLoading}
                        className="w-full px-4 py-2 text-center bg-green-100 text-green-800 rounded-lg hover:bg-green-200 disabled:opacity-50"
                      >
                        Marcar como Concluído
                      </button>
                    )}
                    <p className="text-xs text-center text-gray-500 pt-2">
                      Apenas ações disponíveis para o status atual são exibidas.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center">
              <button onClick={() => navigate(-1)} className="flex items-center text-gray-600 hover:text-gray-800 mr-4">
                <ArrowLeft className="w-5 h-5 mr-2" />
                Voltar
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-800">Gestão de Solicitações</h1>
                <p className="text-gray-600">Gerencie todas as solicitações de manutenção dos clientes</p>
              </div>
            </div>
            <button
              onClick={() => navigate("/relatorios/assistencias")}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <BarChart3 className="h-5 w-5" />
              Dashboard
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Filter className="inline h-4 w-4 mr-1" />
                  Filtrar por Status
                </label>
                <select
                  value={filtroStatus}
                  onChange={(e) => setFiltroStatus(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Todos os Status</option>
                  <option value="solicitado">Solicitado</option>
                  <option value="em_analise">Em Análise</option>
                  <option value="aguardando_aprovacao">Aguardando Aprovação</option>
                  <option value="aguardando_pagamento">Aguardando Pagamento</option>
                  <option value="aprovado">Aprovado</option>
                  <option value="em_execucao">Em Execução</option>
                  <option value="aguardando_retirada_envio">Aguardando Retirada/Envio</option>
                  <option value="concluido">Concluído</option>
                  <option value="rejeitado">Rejeitado</option>
                  <option value="cancelado">Cancelado</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Search className="inline h-4 w-4 mr-1" />
                  Buscar
                </label>
                <input
                  type="text"
                  value={inputBusca}
                  onChange={(e) => setInputBusca(e.target.value)}
                  placeholder="Protocolo, cliente, marca ou modelo..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {/* AJUSTE PRINCIPAL: Lógica de carregamento e exibição da tabela */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden min-h-[300px]">
            {loading ? (
              <div className="flex items-center justify-center h-full p-12">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
                <p className="ml-4 text-gray-600">Carregando solicitações...</p>
              </div>
            ) : solicitacoes.length === 0 ? (
              <div className="p-12 text-center">
                <Wrench className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">Nenhuma solicitação encontrada</h3>
                <p className="text-gray-500">Não há solicitações com os filtros aplicados.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Protocolo</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Equipamento</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {solicitacoes.map((solicitacao) => (
                      <tr key={solicitacao.id_solicitacao} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <span className="font-medium text-gray-900">
                            AT-{solicitacao.id_solicitacao.toString().padStart(6, "0")}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium text-gray-900">{solicitacao.nome_cliente}</p>
                            <p className="text-sm text-gray-500">{solicitacao.email_cliente}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium text-gray-900">
                              {solicitacao.marca} {solicitacao.modelo}
                            </p>
                            <p className="text-sm text-gray-500">{solicitacao.tipo_equipamento}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">{formatDate(solicitacao.data_solicitacao)}</td>
                        <td className="px-6 py-4">{getStatusBadge(solicitacao.status)}</td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleViewDetails(solicitacao.id_solicitacao)}
                            className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                          >
                            <Eye className="h-4 w-4" /> Ver
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}
