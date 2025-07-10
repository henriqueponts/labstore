"use client"

import type React from "react"
import { useState, useEffect } from "react"
import axios from "axios"
import {
  BarChart3,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Users,
  Calendar,
  Target,
  Activity,
  RefreshCw,
  X,
  User,
  Award,
  AlertTriangle,
} from "lucide-react"

// Interfaces para os dados do dashboard
interface EstatisticasGerais {
  total: number
  abertos: number
  aguardando_cliente: number
  aguardando_funcionario: number
  resolvidos: number
  encerrados: number
  hoje: number
  ultimos_7_dias: number
  ultimos_30_dias: number
}

interface EstatisticasPeriodo {
  total_periodo: number
  resolvidos_periodo: number
  tempo_medio_resolucao_horas: number
}

interface CategoriaStats {
  categoria: string
  quantidade: number
  resolvidos: number
  tempo_medio_horas: number
}

interface TendenciaDiaria {
  data: string
  total: number
  abertos: number
  resolvidos: number
}

interface TendenciaSemanal {
  semana: string
  inicio_semana: string
  total: number
  resolvidos: number
}

interface PerformanceFuncionario {
  funcionario: string
  total_atendidos: number
  resolvidos: number
  tempo_medio_horas: number
  ultimos_7_dias: number
}

interface ChamadoAntigo {
  id_chamado: number
  assunto: string
  status: string
  data_abertura: string
  cliente_nome: string
  dias_aberto: number
}

interface TaxaResolucao {
  periodo: string
  total: number
  resolvidos: number
  taxa_resolucao: number
}

interface DashboardData {
  geral: EstatisticasGerais
  periodo: EstatisticasPeriodo
  categorias: CategoriaStats[]
  tendenciaDiaria: TendenciaDiaria[]
  tendenciaSemanal: TendenciaSemanal[]
  performanceFuncionarios: PerformanceFuncionario[]
  chamadosAntigos: ChamadoAntigo[]
  taxaResolucao: TaxaResolucao[]
}

interface DashboardChamadosProps {
  onVoltar: () => void
}

const DashboardChamados: React.FC<DashboardChamadosProps> = ({ onVoltar }) => {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [periodo, setPeriodo] = useState("30")
  const [viewMode, setViewMode] = useState<"overview" | "trends" | "performance">("overview")

  // Buscar dados do dashboard
  const fetchDashboardData = async () => {
    setLoading(true)
    setError(null)
    try {
      const token = localStorage.getItem("token")
      const response = await axios.get(`http://localhost:3000/chamados/stats/dashboard?periodo=${periodo}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setData(response.data)
    } catch (err: unknown) {
      console.error("Erro ao buscar dados do dashboard:", err)
      setError("Erro ao carregar dados do dashboard")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [periodo])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
    })
  }

  const formatHours = (hours: number) => {
    if (hours < 24) {
      return `${Math.round(hours)}h`
    }
    const days = Math.floor(hours / 24)
    const remainingHours = Math.round(hours % 24)
    return `${days}d ${remainingHours}h`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "aberto":
        return "text-blue-600 bg-blue-100"
      case "aguardando_cliente":
        return "text-orange-600 bg-orange-100"
      case "aguardando_funcionario":
        return "text-indigo-600 bg-indigo-100"
      case "resolvido":
        return "text-green-600 bg-green-100"
      case "encerrado":
        return "text-gray-600 bg-gray-100"
      default:
        return "text-gray-600 bg-gray-100"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "aberto":
        return "Aberto"
      case "aguardando_cliente":
        return "Aguardando Cliente"
      case "aguardando_funcionario":
        return "Aguardando Funcionário"
      case "resolvido":
        return "Resolvido"
      case "encerrado":
        return "Encerrado"
      default:
        return status
    }
  }

  const calculateTaxaResolucao = (resolvidos: number, total: number) => {
    return total > 0 ? Math.round((resolvidos / total) * 100) : 0
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-gray-600">Carregando dashboard...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
        <button onClick={() => setError(null)} className="float-right">
          <X className="w-4 h-4" />
        </button>
        {error}
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="space-y-6">
      {/* Header do Dashboard */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard de Suporte</h1>
          <p className="text-gray-600">Visão completa do sistema de chamados</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <select
            value={periodo}
            onChange={(e) => setPeriodo(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="7">Últimos 7 dias</option>
            <option value="30">Últimos 30 dias</option>
            <option value="90">Últimos 90 dias</option>
          </select>

          <div className="flex rounded-md border border-gray-300">
            <button
              onClick={() => setViewMode("overview")}
              className={`px-3 py-2 text-sm font-medium rounded-l-md ${
                viewMode === "overview" ? "bg-blue-600 text-white" : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              Visão Geral
            </button>
            <button
              onClick={() => setViewMode("trends")}
              className={`px-3 py-2 text-sm font-medium border-l border-gray-300 ${
                viewMode === "trends" ? "bg-blue-600 text-white" : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              Tendências
            </button>
            <button
              onClick={() => setViewMode("performance")}
              className={`px-3 py-2 text-sm font-medium border-l border-gray-300 rounded-r-md ${
                viewMode === "performance" ? "bg-blue-600 text-white" : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              Performance
            </button>
          </div>

          <button
            onClick={fetchDashboardData}
            className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors"
          >
            <RefreshCw className="w-4 h-4 inline mr-2" />
            Atualizar
          </button>

          <button
            onClick={onVoltar}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Voltar para Lista
          </button>
        </div>
      </div>

      {/* Visão Geral */}
      {viewMode === "overview" && (
        <div className="space-y-6">
          {/* Cards de Estatísticas Principais */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total de Chamados</p>
                  <p className="text-3xl font-bold text-gray-900">{data.geral.total}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {data.geral.hoje} hoje • {data.geral.ultimos_7_dias} últimos 7 dias
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <BarChart3 className="w-8 h-8 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Em Aberto</p>
                  <p className="text-3xl font-bold text-red-600">{data.geral.abertos}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {data.geral.aguardando_funcionario} aguardando funcionário
                  </p>
                </div>
                <div className="p-3 bg-red-100 rounded-lg">
                  <AlertCircle className="w-8 h-8 text-red-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Resolvidos</p>
                  <p className="text-3xl font-bold text-green-600">{data.geral.resolvidos + data.geral.encerrados}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Taxa: {calculateTaxaResolucao(data.geral.resolvidos + data.geral.encerrados, data.geral.total)}%
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Tempo Médio</p>
                  <p className="text-3xl font-bold text-purple-600">
                    {data.periodo.tempo_medio_resolucao_horas
                      ? formatHours(data.periodo.tempo_medio_resolucao_horas)
                      : "N/A"}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Resolução</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Clock className="w-8 h-8 text-purple-600" />
                </div>
              </div>
            </div>
          </div>

          {/* KPIs Detalhados */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Taxa de Resolução por Período */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Target className="w-5 h-5 mr-2 text-blue-600" />
                Taxa de Resolução
              </h3>
              <div className="space-y-4">
                {data.taxaResolucao.map((taxa, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{taxa.periodo}</span>
                    <div className="flex items-center">
                      <div className="w-24 bg-gray-200 rounded-full h-2 mr-3">
                        <div
                          className="bg-green-600 h-2 rounded-full"
                          style={{ width: `${taxa.taxa_resolucao}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900 w-12 text-right">{taxa.taxa_resolucao}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Distribuição por Status */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Activity className="w-5 h-5 mr-2 text-blue-600" />
                Status dos Chamados
              </h3>
              <div className="space-y-3">
                {[
                  { status: "aberto", count: data.geral.abertos, label: "Abertos" },
                  {
                    status: "aguardando_funcionario",
                    count: data.geral.aguardando_funcionario,
                    label: "Aguardando Funcionário",
                  },
                  { status: "aguardando_cliente", count: data.geral.aguardando_cliente, label: "Aguardando Cliente" },
                  { status: "resolvido", count: data.geral.resolvidos, label: "Resolvidos" },
                  { status: "encerrado", count: data.geral.encerrados, label: "Encerrados" },
                ].map((item) => (
                  <div key={item.status} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className={`w-3 h-3 rounded-full mr-2 ${getStatusColor(item.status).split(" ")[1]}`}></span>
                      <span className="text-sm text-gray-600">{item.label}</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Chamados por Categoria */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <BarChart3 className="w-5 h-5 mr-2 text-blue-600" />
                Por Categoria
              </h3>
              <div className="space-y-3">
                {data.categorias.slice(0, 5).map((categoria, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 truncate flex-1 mr-2">{categoria.categoria}</span>
                    <div className="flex items-center">
                      <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{
                            width: `${(categoria.quantidade / Math.max(...data.categorias.map((c) => c.quantidade))) * 100}%`,
                          }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900 w-8 text-right">{categoria.quantidade}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Chamados Mais Antigos */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2 text-orange-600" />
              Chamados Mais Antigos em Aberto
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Protocolo
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Assunto
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Dias em Aberto
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.chamadosAntigos.map((chamado) => (
                    <tr key={chamado.id_chamado} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                        LAB{chamado.id_chamado.toString().padStart(6, "0")}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 max-w-xs truncate">{chamado.assunto}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{chamado.cliente_nome}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(chamado.status)}`}
                        >
                          {getStatusText(chamado.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        <span
                          className={`font-medium ${chamado.dias_aberto > 7 ? "text-red-600" : chamado.dias_aberto > 3 ? "text-orange-600" : "text-gray-900"}`}
                        >
                          {chamado.dias_aberto} dias
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tendências */}
      {viewMode === "trends" && (
        <div className="space-y-6">
          {/* Tendência Diária */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
              Tendência Diária (Últimos 30 dias)
            </h3>
            <div className="space-y-2">
              {data.tendenciaDiaria.slice(0, 10).map((dia, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0"
                >
                  <span className="text-sm text-gray-600">{formatDate(dia.data)}</span>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center">
                      <span className="text-xs text-gray-500 mr-2">Total:</span>
                      <span className="text-sm font-medium text-gray-900">{dia.total}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-xs text-gray-500 mr-2">Resolvidos:</span>
                      <span className="text-sm font-medium text-green-600">{dia.resolvidos}</span>
                    </div>
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{
                          width: `${Math.max((dia.total / Math.max(...data.tendenciaDiaria.map((d) => d.total))) * 100, 5)}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tendência Semanal */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-blue-600" />
              Tendência Semanal (Últimas 12 semanas)
            </h3>
            <div className="space-y-2">
              {data.tendenciaSemanal.map((semana, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0"
                >
                  <span className="text-sm text-gray-600">Semana de {formatDate(semana.inicio_semana)}</span>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center">
                      <span className="text-xs text-gray-500 mr-2">Total:</span>
                      <span className="text-sm font-medium text-gray-900">{semana.total}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-xs text-gray-500 mr-2">Resolvidos:</span>
                      <span className="text-sm font-medium text-green-600">{semana.resolvidos}</span>
                    </div>
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{
                          width: `${Math.max((semana.total / Math.max(...data.tendenciaSemanal.map((s) => s.total))) * 100, 5)}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Performance */}
      {viewMode === "performance" && (
        <div className="space-y-6">
          {/* Performance dos Funcionários */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Users className="w-5 h-5 mr-2 text-blue-600" />
              Performance da Equipe
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Funcionário
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Atendidos
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Resolvidos
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Taxa de Resolução
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tempo Médio
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Últimos 7 dias
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.performanceFuncionarios.map((funcionario, index) => {
                    const taxaResolucao = calculateTaxaResolucao(funcionario.resolvidos, funcionario.total_atendidos)
                    return (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="p-2 bg-blue-100 rounded-full mr-3">
                              <User className="w-4 h-4 text-blue-600" />
                            </div>
                            <span className="text-sm font-medium text-gray-900">{funcionario.funcionario}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {funcionario.total_atendidos}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-green-600 font-medium">
                          {funcionario.resolvidos}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                              <div
                                className={`h-2 rounded-full ${
                                  taxaResolucao >= 80
                                    ? "bg-green-600"
                                    : taxaResolucao >= 60
                                      ? "bg-yellow-600"
                                      : "bg-red-600"
                                }`}
                                style={{ width: `${taxaResolucao}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium text-gray-900">{taxaResolucao}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {funcionario.tempo_medio_horas ? formatHours(funcionario.tempo_medio_horas) : "N/A"}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {funcionario.ultimos_7_dias}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Métricas de Performance por Categoria */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Award className="w-5 h-5 mr-2 text-blue-600" />
              Performance por Categoria
            </h3>
            <div className="space-y-4">
              {data.categorias.map((categoria, index) => {
                const taxaResolucao = calculateTaxaResolucao(categoria.resolvidos, categoria.quantidade)
                return (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="text-sm font-medium text-gray-900">{categoria.categoria}</h4>
                      <span className="text-xs text-gray-500">{categoria.quantidade} chamados</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs text-gray-500">Taxa de Resolução</p>
                        <div className="flex items-center mt-1">
                          <div className="w-full bg-gray-200 rounded-full h-2 mr-2">
                            <div
                              className={`h-2 rounded-full ${
                                taxaResolucao >= 80
                                  ? "bg-green-600"
                                  : taxaResolucao >= 60
                                    ? "bg-yellow-600"
                                    : "bg-red-600"
                              }`}
                              style={{ width: `${taxaResolucao}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium text-gray-900 whitespace-nowrap">{taxaResolucao}%</span>
                        </div>
                      </div>

                      <div>
                        <p className="text-xs text-gray-500">Resolvidos</p>
                        <p className="text-sm font-medium text-green-600 mt-1">{categoria.resolvidos}</p>
                      </div>

                      <div>
                        <p className="text-xs text-gray-500">Tempo Médio</p>
                        <p className="text-sm font-medium text-purple-600 mt-1">
                          {categoria.tempo_medio_horas ? formatHours(categoria.tempo_medio_horas) : "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DashboardChamados
