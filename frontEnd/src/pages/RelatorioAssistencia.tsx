"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import Layout from "../components/Layout"
import axios from "axios"
import {
  Calendar,
  FileSpreadsheet,
  Filter,
  Search,
  ArrowLeft,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Wrench,
  DollarSign,
  Package,
  CreditCard,
  Truck,
  Ban,
  User,
  Activity,
  BarChart3,
  Target,
  Laptop,
  Monitor,
} from "lucide-react"

interface Assistencia {
  id_solicitacao: number
  protocolo: string
  tipo_equipamento: string
  marca: string
  modelo: string
  problema_relatado: string
  data_solicitacao: string
  status: string
  nome_cliente: string
  cpf_cnpj: string
  email_cliente: string
  telefone_cliente: string | null
  valor_total: number | null
  prazo_entrega_dias: number | null
  tecnico_responsavel: string | null
  forma_envio: string
}

interface Estatisticas {
  total: number
  concluidas: number
  valorTotal: number
  topMarcas: { marca: string; count: number }[]
  tiposEquipamento: { tipo: string; count: number }[]
  statusDistribuicao: { status: string; count: number }[]
  prazosResolucao: {
    hoje: { total: number; concluidas: number; percentual: number }
    ultimos7Dias: { total: number; concluidas: number; percentual: number }
    ultimos30Dias: { total: number; concluidas: number; percentual: number }
  }
}

export default function RelatorioAssistencia() {
  const navigate = useNavigate()
  const [assistencias, setAssistencias] = useState<Assistencia[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [exportando, setExportando] = useState(false)

  // Filtros
  const hoje = new Date()
  const umMesAtras = new Date(hoje.getFullYear(), hoje.getMonth() - 1, hoje.getDate())

  const [dataInicio, setDataInicio] = useState(umMesAtras.toISOString().split("T")[0])
  const [dataFim, setDataFim] = useState(hoje.toISOString().split("T")[0])
  const [filtroStatus, setFiltroStatus] = useState("")
  const [filtroCliente, setFiltroCliente] = useState("")

  const buscarAssistencias = async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (dataInicio) params.append("dataInicio", dataInicio)
      if (dataFim) params.append("dataFim", dataFim)
      if (filtroStatus) params.append("status", filtroStatus)
      if (filtroCliente) params.append("cliente", filtroCliente)

      const response = await axios.get(`http://localhost:3000/assistencia/relatorio?${params.toString()}`)
      setAssistencias(response.data)
    } catch (err: any) {
      setError(err.response?.data?.message || "Erro ao buscar assistências")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    buscarAssistencias()
  }, [])

  const exportarExcel = async () => {
    setExportando(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (dataInicio) params.append("dataInicio", dataInicio)
      if (dataFim) params.append("dataFim", dataFim)
      if (filtroStatus) params.append("status", filtroStatus)
      if (filtroCliente) params.append("cliente", filtroCliente)

      const response = await axios.get(`http://localhost:3000/assistencia/relatorio/exportar?${params.toString()}`, {
        responseType: "blob",
      })

      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement("a")
      link.href = url
      link.setAttribute("download", `relatorio_assistencias_${dataInicio}_${dataFim}.xlsx`)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (err: any) {
      setError("Erro ao exportar relatório")
    } finally {
      setExportando(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
      solicitado: { label: "Solicitado", color: "bg-blue-100 text-blue-800", icon: <Clock className="h-3 w-3" /> },
      em_analise: {
        label: "Em Análise",
        color: "bg-yellow-100 text-yellow-800",
        icon: <AlertCircle className="h-3 w-3" />,
      },
      aguardando_aprovacao: {
        label: "Aguardando Aprovação",
        color: "bg-purple-100 text-purple-800",
        icon: <DollarSign className="h-3 w-3" />,
      },
      aguardando_pagamento: {
        label: "Aguardando Pagamento",
        color: "bg-orange-100 text-orange-800",
        icon: <CreditCard className="h-3 w-3" />,
      },
      aprovado: {
        label: "Aprovado",
        color: "bg-teal-100 text-teal-800",
        icon: <Package className="h-3 w-3" />,
      },
      em_execucao: {
        label: "Em Execução",
        color: "bg-indigo-100 text-indigo-800",
        icon: <Wrench className="h-3 w-3" />,
      },
      aguardando_retirada_envio: {
        label: "Aguardando Retirada/Envio",
        color: "bg-cyan-100 text-cyan-800",
        icon: <Truck className="h-3 w-3" />,
      },
      concluido: {
        label: "Concluído",
        color: "bg-green-100 text-green-800",
        icon: <CheckCircle className="h-3 w-3" />,
      },
      rejeitado: { label: "Rejeitado", color: "bg-red-100 text-red-800", icon: <XCircle className="h-3 w-3" /> },
      cancelado: { label: "Cancelado", color: "bg-gray-100 text-gray-800", icon: <Ban className="h-3 w-3" /> },
    }
    const config = statusConfig[status] || statusConfig.solicitado
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.icon}
        {config.label}
      </span>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  const formatCurrency = (value: number | null) => {
    if (value === null) return "N/A"
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value)
  }

  const formatCpfCnpj = (value: string) => {
    if (!value) return "N/A"
    const numbers = value.replace(/\D/g, "")
    if (numbers.length === 11) {
      return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
    } else if (numbers.length === 14) {
      return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5")
    }
    return value
  }

  const calcularEstatisticas = (): Estatisticas => {
    const total = assistencias.length
    const concluidas = assistencias.filter((a) => a.status === "concluido").length
    const valorTotal = assistencias.reduce((acc, a) => acc + (a.valor_total || 0), 0)

    // Top 3 marcas
    const marcasCount: Record<string, number> = {}
    assistencias.forEach((a) => {
      marcasCount[a.marca] = (marcasCount[a.marca] || 0) + 1
    })
    const topMarcas = Object.entries(marcasCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([marca, count]) => ({ marca, count }))

    // Tipos de equipamento (Desktop vs Notebook)
    const tiposCount: Record<string, number> = {}
    assistencias.forEach((a) => {
      const tipo = a.tipo_equipamento.toLowerCase()
      tiposCount[tipo] = (tiposCount[tipo] || 0) + 1
    })
    const tiposEquipamento = Object.entries(tiposCount).map(([tipo, count]) => ({ tipo, count }))

    // Distribuição de status
    const statusCount: Record<string, number> = {}
    assistencias.forEach((a) => {
      statusCount[a.status] = (statusCount[a.status] || 0) + 1
    })
    const statusDistribuicao = Object.entries(statusCount).map(([status, count]) => ({ status, count }))

    // Taxa de resolução por período
    const agora = new Date()
    const seteDiasAtras = new Date(agora.getTime() - 7 * 24 * 60 * 60 * 1000)
    const trintaDiasAtras = new Date(agora.getTime() - 30 * 24 * 60 * 60 * 1000)

    const hoje = assistencias.filter((a) => {
      const data = new Date(a.data_solicitacao)
      return data.toDateString() === agora.toDateString()
    })
    const ultimos7 = assistencias.filter((a) => new Date(a.data_solicitacao) >= seteDiasAtras)
    const ultimos30 = assistencias.filter((a) => new Date(a.data_solicitacao) >= trintaDiasAtras)

    const prazosResolucao = {
      hoje: {
        total: hoje.length,
        concluidas: hoje.filter((a) => a.status === "concluido").length,
        percentual: hoje.length > 0 ? (hoje.filter((a) => a.status === "concluido").length / hoje.length) * 100 : 0,
      },
      ultimos7Dias: {
        total: ultimos7.length,
        concluidas: ultimos7.filter((a) => a.status === "concluido").length,
        percentual:
          ultimos7.length > 0 ? (ultimos7.filter((a) => a.status === "concluido").length / ultimos7.length) * 100 : 0,
      },
      ultimos30Dias: {
        total: ultimos30.length,
        concluidas: ultimos30.filter((a) => a.status === "concluido").length,
        percentual:
          ultimos30.length > 0
            ? (ultimos30.filter((a) => a.status === "concluido").length / ultimos30.length) * 100
            : 0,
      },
    }

    return {
      total,
      concluidas,
      valorTotal,
      topMarcas,
      tiposEquipamento,
      statusDistribuicao,
      prazosResolucao,
    }
  }

  const stats = calcularEstatisticas()

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center">
              <div>
                <div className="flex items-center">
                  <BarChart3 className="h-7 w-7 text-blue-600 mr-3" />
                  <h1 className="text-2xl font-bold text-gray-900">Dashboard de Assistências Técnicas</h1>
                </div>
                <p className="text-sm text-gray-600 mt-1">Relatório e exportação de assistências por período</p>
              </div>
            </div>
          </div>

          {/* Cards de estatísticas principais */}
          {!loading && assistencias.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {/* Total de Assistências */}
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total de Assistências</p>
                    <p className="text-2xl font-bold text-gray-900 mt-2">{stats.total}</p>
                  </div>
                  <div className="bg-blue-100 rounded-full p-3">
                    <FileSpreadsheet className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </div>

              {/* Concluídas */}
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Concluídas</p>
                    <p className="text-2xl font-bold text-gray-900 mt-2">{stats.concluidas}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {stats.total > 0 ? ((stats.concluidas / stats.total) * 100).toFixed(0) : 0}% do total
                    </p>
                  </div>
                  <div className="bg-green-100 rounded-full p-3">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </div>

              {/* Aguardando Interação */}
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Aguardando Interação</p>
                    <p className="text-2xl font-bold text-gray-900 mt-2">
                      {assistencias.filter((a) => a.status === "solicitado").length}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {stats.total > 0
                        ? ((assistencias.filter((a) => a.status === "solicitado").length / stats.total) * 100).toFixed(
                            0,
                          )
                        : 0}
                      % do total
                    </p>
                  </div>
                  <div className="bg-orange-100 rounded-full p-3">
                    <Clock className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {!loading && assistencias.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {/* Taxa de Resolução */}
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                <div className="flex items-center mb-4">
                  <Target className="h-5 w-5 text-blue-600 mr-2" />
                  <h3 className="text-base font-semibold text-gray-900">Taxa de Resolução</h3>
                </div>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Hoje</span>
                      <span className="font-medium text-gray-900">
                        {stats.prazosResolucao.hoje.percentual.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${stats.prazosResolucao.hoje.percentual}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Últimos 7 dias</span>
                      <span className="font-medium text-gray-900">
                        {stats.prazosResolucao.ultimos7Dias.percentual.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${stats.prazosResolucao.ultimos7Dias.percentual}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Últimos 30 dias</span>
                      <span className="font-medium text-gray-900">
                        {stats.prazosResolucao.ultimos30Dias.percentual.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${stats.prazosResolucao.ultimos30Dias.percentual}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Status das Assistências */}
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                <div className="flex items-center mb-4">
                  <Activity className="h-5 w-5 text-blue-600 mr-2" />
                  <h3 className="text-base font-semibold text-gray-900">Status das Assistências</h3>
                </div>
                <div className="space-y-2">
                  {stats.statusDistribuicao.slice(0, 5).map((item) => (
                    <div key={item.status} className="flex items-center justify-between text-sm">
                      <div className="flex items-center">
                        <div
                          className={`w-2 h-2 rounded-full mr-2 ${
                            item.status === "concluido"
                              ? "bg-green-500"
                              : item.status === "em_execucao"
                                ? "bg-indigo-500"
                                : item.status === "aguardando_aprovacao"
                                  ? "bg-purple-500"
                                  : item.status === "solicitado"
                                    ? "bg-blue-500"
                                    : "bg-gray-400"
                          }`}
                        />
                        <span className="text-gray-700 capitalize">{item.status.replace(/_/g, " ")}</span>
                      </div>
                      <span className="font-medium text-gray-900">{item.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Por Tipo de Equipamento */}
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                <div className="flex items-center mb-4">
                  <BarChart3 className="h-5 w-5 text-blue-600 mr-2" />
                  <h3 className="text-base font-semibold text-gray-900">Por Tipo de Equipamento</h3>
                </div>
                <div className="space-y-3">
                  {stats.tiposEquipamento.map((item) => {
                    const percentual = (item.count / stats.total) * 100
                    const isNotebook = item.tipo.toLowerCase().includes("notebook")
                    return (
                      <div key={item.tipo}>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <div className="flex items-center">
                            {isNotebook ? (
                              <Laptop className="h-4 w-4 text-gray-600 mr-2" />
                            ) : (
                              <Monitor className="h-4 w-4 text-gray-600 mr-2" />
                            )}
                            <span className="text-gray-700 capitalize">{item.tipo}</span>
                          </div>
                          <span className="font-medium text-gray-900">{item.count}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${isNotebook ? "bg-purple-600" : "bg-blue-600"}`}
                            style={{ width: `${percentual}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {!loading && assistencias.length > 0 && stats.topMarcas.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
              <div className="flex items-center mb-4">
                <BarChart3 className="h-5 w-5 text-blue-600 mr-2" />
                <h3 className="text-base font-semibold text-gray-900">Top 3 Marcas Mais Registradas</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {stats.topMarcas.map((item, index) => {
                  const percentual = (item.count / stats.total) * 100
                  return (
                    <div key={item.marca} className="flex items-center">
                      <div
                        className={`flex items-center justify-center w-10 h-10 rounded-full mr-3 ${
                          index === 0
                            ? "bg-yellow-100 text-yellow-700"
                            : index === 1
                              ? "bg-gray-100 text-gray-700"
                              : "bg-orange-100 text-orange-700"
                        }`}
                      >
                        <span className="font-bold text-lg">{index + 1}</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-900">{item.marca}</p>
                        <p className="text-xs text-gray-600">
                          {item.count} assistências ({percentual.toFixed(1)}%)
                        </p>
                        <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                          <div
                            className={`h-1.5 rounded-full transition-all ${
                              index === 0 ? "bg-yellow-500" : index === 1 ? "bg-gray-500" : "bg-orange-500"
                            }`}
                            style={{ width: `${percentual}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
            <div className="flex items-center mb-4">
              <Filter className="h-5 w-5 text-gray-600 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">Filtros de Pesquisa</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="inline h-4 w-4 mr-1 text-gray-500" />
                  Data Início
                </label>
                <input
                  type="date"
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="inline h-4 w-4 mr-1 text-gray-500" />
                  Data Fim
                </label>
                <input
                  type="date"
                  value={dataFim}
                  onChange={(e) => setDataFim(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <AlertCircle className="inline h-4 w-4 mr-1 text-gray-500" />
                  Status
                </label>
                <select
                  value={filtroStatus}
                  onChange={(e) => setFiltroStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                  <User className="inline h-4 w-4 mr-1 text-gray-500" />
                  Cliente
                </label>
                <input
                  type="text"
                  value={filtroCliente}
                  onChange={(e) => setFiltroCliente(e.target.value)}
                  placeholder="Nome ou CPF/CNPJ"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={buscarAssistencias}
                  disabled={loading}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Search className="h-4 w-4" />
                  {loading ? "Buscando..." : "Buscar"}
                </button>
              </div>
            </div>
          </div>

          {/* Mensagem de Erro */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
              <XCircle className="h-5 w-5 text-red-600 mr-2" />
              <p className="text-red-600">{error}</p>
            </div>
          )}

          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            {/* Table Header with Export Button */}
            {!loading && assistencias.length > 0 && (
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Assistências Encontradas</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Período: {formatDate(dataInicio)} até {formatDate(dataFim)} • {assistencias.length}{" "}
                    {assistencias.length === 1 ? "registro" : "registros"}
                  </p>
                </div>
                <button
                  onClick={exportarExcel}
                  disabled={exportando}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {exportando ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                      Exportando...
                    </>
                  ) : (
                    <>
                      <FileSpreadsheet className="h-4 w-4" />
                      Exportar Excel
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Table Content */}
            {loading ? (
              <div className="flex items-center justify-center p-12">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500" />
                <p className="ml-4 text-gray-600">Carregando assistências...</p>
              </div>
            ) : assistencias.length === 0 ? (
              <div className="p-12 text-center">
                <FileSpreadsheet className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">Nenhuma assistência encontrada</h3>
                <p className="text-gray-500">Não há assistências no período selecionado com os filtros aplicados.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Protocolo
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Data
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cliente
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        CPF/CNPJ
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contato
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Equipamento
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Problema
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Valor
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Prazo
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Técnico
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {assistencias.map((assistencia) => (
                      <tr key={assistencia.id_solicitacao} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-medium text-gray-900">{assistencia.protocolo}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(assistencia.data_solicitacao)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <p className="text-sm font-medium text-gray-900">{assistencia.nome_cliente}</p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {formatCpfCnpj(assistencia.cpf_cnpj)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm">
                            <p className="text-gray-900">{assistencia.telefone_cliente || "N/A"}</p>
                            <p className="text-gray-500 text-xs">{assistencia.email_cliente}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {assistencia.marca} {assistencia.modelo}
                            </p>
                            <p className="text-xs text-gray-500">{assistencia.tipo_equipamento}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-700 max-w-xs truncate" title={assistencia.problema_relatado}>
                            {assistencia.problema_relatado}
                          </p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(assistencia.status)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatCurrency(assistencia.valor_total)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {assistencia.prazo_entrega_dias ? `${assistencia.prazo_entrega_dias} dias` : "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {assistencia.tecnico_responsavel || "N/A"}
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
