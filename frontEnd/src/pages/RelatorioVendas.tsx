"use client"

import { useState, useEffect } from "react"
import Layout from "../components/Layout"
import axios from "axios"
import { useNavigate } from "react-router-dom"
import { ShoppingBag, TrendingUp, DollarSign, Package, Download, Filter, Search, BarChart3, Calendar, AlertCircle } from 'lucide-react'
import { useAlert } from "../components/Alert-container"

interface DashboardStats {
  totalVendas: number
  faturamentoTotal: number
  ticketMedio: number
  totalProdutosVendidos: number
}

interface VendasPorStatus {
  status: string
  quantidade: number
  valor_total: number
}

interface Venda {
  id_pedido: number
  data_pedido: string
  nome_cliente: string
  email_cliente: string
  telefone_cliente?: string
  status: string
  valor_total: number
  quantidade_itens: number
  codigo_rastreio?: string
  frete_valor?: number
}

interface Filtros {
  dataInicial: string
  dataFinal: string
  status: string
  termoBusca: string
}

const STATUS_LABELS: Record<string, string> = {
  aguardando_pagamento: "Aguardando Pagamento",
  pago: "Pago",
  processando: "Em Preparação",
  enviado: "Enviado",
  entregue: "Entregue",
  cancelado: "Cancelado",
  estornado: "Estornado",
  falha_pagamento: "Falha no Pagamento",
}

const STATUS_COLORS: Record<string, string> = {
  aguardando_pagamento: "bg-yellow-100 text-yellow-800",
  pago: "bg-green-100 text-green-800",
  processando: "bg-blue-100 text-blue-800",
  enviado: "bg-purple-100 text-purple-800",
  entregue: "bg-green-100 text-green-800",
  cancelado: "bg-red-100 text-red-800",
  estornado: "bg-orange-100 text-orange-800",
  falha_pagamento: "bg-red-100 text-red-800",
}

export default function RelatorioVendas() {
  const navigate = useNavigate()
  const { showErro } = useAlert()

  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [vendasPorStatus, setVendasPorStatus] = useState<VendasPorStatus[]>([])
  const [vendas, setVendas] = useState<Venda[]>([])
  const [filtros, setFiltros] = useState<Filtros>({
    dataInicial: "",
    dataFinal: "",
    status: "",
    termoBusca: "",
  })
  const [loadingDashboard, setLoadingDashboard] = useState(true)
  const [loadingRelatorio, setLoadingRelatorio] = useState(true)
  const [showFilters, setShowFilters] = useState(false)

  const carregarDadosDashboard = async () => {
    setLoadingDashboard(true)
    try {
      const token = localStorage.getItem("token")
      const [statsRes, statusRes] = await Promise.all([
        axios.get("http://localhost:3000/relatorios/vendas/dashboard/estatisticas", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get("http://localhost:3000/relatorios/vendas/dashboard/por-status", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ])

      setStats(statsRes.data)
      setVendasPorStatus(statusRes.data)
    } catch (error) {
      console.error("Erro ao carregar dados do dashboard:", error)
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        navigate("/login")
      }
    } finally {
      setLoadingDashboard(false)
    }
  }

  const carregarRelatorio = async () => {
    setLoadingRelatorio(true)
    try {
      const token = localStorage.getItem("token")
      const params = new URLSearchParams()
      if (filtros.dataInicial) params.append("dataInicial", filtros.dataInicial)
      if (filtros.dataFinal) params.append("dataFinal", filtros.dataFinal)
      if (filtros.status) params.append("status", filtros.status)
      if (filtros.termoBusca) params.append("busca", filtros.termoBusca)
      const response = await axios.get(`http://localhost:3000/relatorios/vendas?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setVendas(response.data)
    } catch (error) {
      console.error("Erro ao carregar relatório de vendas:", error)
    } finally {
      setLoadingRelatorio(false)
    }
  }

  useEffect(() => {
    carregarDadosDashboard()
    carregarRelatorio()
  }, [])

  const aplicarFiltros = () => {
    carregarRelatorio()
    setShowFilters(false)
  }

  const limparFiltros = () => {
    setFiltros({ dataInicial: "", dataFinal: "", status: "", termoBusca: "" })
    setTimeout(carregarRelatorio, 100)
  }

  const exportarExcel = async () => {
    try {
      const token = localStorage.getItem("token")
      const params = new URLSearchParams()
      if (filtros.dataInicial) params.append("dataInicial", filtros.dataInicial)
      if (filtros.dataFinal) params.append("dataFinal", filtros.dataFinal)
      if (filtros.status) params.append("status", filtros.status)
      if (filtros.termoBusca) params.append("busca", filtros.termoBusca)
      const response = await axios.get(`http://localhost:3000/relatorios/vendas/exportar?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: "blob",
      })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement("a")
      link.href = url
      link.setAttribute("download", `relatorio-vendas-${Date.now()}.xlsx`)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (error) {
      console.error("Erro ao exportar relatório:", error)
      showErro("Erro ao exportar relatório. Tente novamente.")
    }
  }

  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(valor)
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <BarChart3 className="h-7 w-7 text-purple-600" />
                Relatório de Vendas
              </h1>
              <p className="text-gray-600 mt-1">Análise de desempenho e faturamento do e-commerce</p>
            </div>
          </div>
        </div>

        {/* Dashboard Cards */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Dashboard de Vendas</h2>
          {loadingDashboard ? (
            <p className="text-center text-gray-500 py-8">Carregando estatísticas...</p>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm font-medium">Total de Vendas</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.totalVendas ?? 0}</p>
                    </div>
                    <ShoppingBag className="h-10 w-10 text-purple-500 opacity-70" />
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm font-medium">Faturamento Total</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">
                        {formatarMoeda(stats?.faturamentoTotal ?? 0)}
                      </p>
                    </div>
                    <DollarSign className="h-10 w-10 text-green-500 opacity-70" />
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm font-medium">Ticket Médio</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">{formatarMoeda(stats?.ticketMedio ?? 0)}</p>
                    </div>
                    <TrendingUp className="h-10 w-10 text-blue-500 opacity-70" />
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-orange-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm font-medium">Produtos Vendidos</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.totalProdutosVendidos ?? 0}</p>
                    </div>
                    <Package className="h-10 w-10 text-orange-500 opacity-70" />
                  </div>
                </div>
              </div>

              {/* Vendas por Status */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Vendas por Status</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {vendasPorStatus.map((item) => (
                    <div key={item.status} className="border rounded-lg p-4">
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mb-2 ${STATUS_COLORS[item.status]}`}>
                        {STATUS_LABELS[item.status]}
                      </span>
                      <p className="text-2xl font-bold text-gray-900">{item.quantidade}</p>
                      <p className="text-sm text-gray-600">{formatarMoeda(item.valor_total)}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Tabela de Vendas */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6 border-b">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                <ShoppingBag className="h-6 w-6 text-purple-600" />
                Histórico Detalhado de Vendas
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                >
                  <Filter className="h-4 w-4" />
                  Filtros
                </button>
                <button
                  onClick={exportarExcel}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                >
                  <Download className="h-4 w-4" />
                  Exportar
                </button>
              </div>
            </div>
          </div>

          {showFilters && (
            <div className="p-6 bg-gray-50 border-b">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Busca</label>
                  <input
                    type="text"
                    placeholder="Cliente, pedido..."
                    value={filtros.termoBusca}
                    onChange={(e) => setFiltros({ ...filtros, termoBusca: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data Inicial</label>
                  <input
                    type="date"
                    value={filtros.dataInicial}
                    onChange={(e) => setFiltros({ ...filtros, dataInicial: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data Final</label>
                  <input
                    type="date"
                    value={filtros.dataFinal}
                    onChange={(e) => setFiltros({ ...filtros, dataFinal: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={filtros.status}
                    onChange={(e) => setFiltros({ ...filtros, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="">Todos</option>
                    {Object.entries(STATUS_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={aplicarFiltros}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  <Search className="h-4 w-4" />
                  Aplicar
                </button>
                <button
                  onClick={limparFiltros}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Limpar
                </button>
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            {loadingRelatorio ? (
              <div className="p-8 text-center text-gray-500">Carregando relatório...</div>
            ) : vendas.length === 0 ? (
              <div className="p-8 text-center">
                <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500">Nenhuma venda encontrada com os filtros aplicados.</p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pedido</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Itens</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valor Total</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rastreio</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {vendas.map((venda) => (
                    <tr key={venda.id_pedido} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        #{venda.id_pedido}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {formatarData(venda.data_pedido)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <p className="font-medium text-gray-900">{venda.nome_cliente}</p>
                          <p className="text-gray-500">{venda.email_cliente}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${STATUS_COLORS[venda.status]}`}>
                          {STATUS_LABELS[venda.status]}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">
                        {venda.quantidade_itens}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        {formatarMoeda(venda.valor_total)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {venda.codigo_rastreio || "N/A"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}
