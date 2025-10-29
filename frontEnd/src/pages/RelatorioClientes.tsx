"use client"

import { useState, useEffect } from "react"
import Layout from "../components/Layout"
import axios from "axios"
import { useNavigate } from "react-router-dom"
import {
  Users,
  UserCheck,
  UserX,
  Download,
  Filter,
  Search,
  FileText,
  BarChart3,
  User,
  Building2,
} from "lucide-react"
import { useAlert } from "../components/Alert-container"

// --- Interfaces ---

interface DashboardStats {
  totalClientes: number
  clientesAtivos: number
  clientesInativos: number
}

interface ClientesPorTipo {
  clientesPF: number
  clientesPJ: number
}

interface ClienteDetalhado {
  id_cliente: number
  nome: string
  cpf_cnpj: string
  email: string
  telefone: string | null
  endereco: string | null
  data_cadastro: string
  status: "ativo" | "inativo"
  quantidade_compras: number
}

interface Filtros {
  dataInicial: string
  dataFinal: string
  status: string
  termoBusca: string
}

export default function RelatorioClientes() {
  const navigate = useNavigate()

  // --- Estados ---
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [clientesPorTipo, setClientesPorTipo] = useState<ClientesPorTipo | null>(null)
  const [clientes, setClientes] = useState<ClienteDetalhado[]>([])
  const [filtros, setFiltros] = useState<Filtros>({
    dataInicial: "",
    dataFinal: "",
    status: "",
    termoBusca: "",
  })
  const [loadingDashboard, setLoadingDashboard] = useState(true)
  const [loadingRelatorio, setLoadingRelatorio] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const { showErro, showAviso, showSucesso } = useAlert();

  // --- Funções de Carregamento de Dados ---

  const carregarDadosDashboard = async () => {
    setLoadingDashboard(true)
    try {
      const token = localStorage.getItem("token")
      const [statsRes, tipoRes] = await Promise.all([
        axios.get("http://localhost:3000/relatorios/clientes/dashboard/estatisticas", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get("http://localhost:3000/relatorios/clientes/dashboard/por-tipo", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ])

      setStats(statsRes.data)
      setClientesPorTipo(tipoRes.data)
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
      const response = await axios.get(`http://localhost:3000/relatorios/clientes?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setClientes(response.data)
    } catch (error) {
      console.error("Erro ao carregar relatório de clientes:", error)
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
      const response = await axios.get(`http://localhost:3000/relatorios/clientes/exportar?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: "blob",
      })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement("a")
      link.href = url
      link.setAttribute("download", `relatorio-clientes-${Date.now()}.xlsx`)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (error) {
      console.error("Erro ao exportar relatório:", error)
      showErro("Erro ao exportar relatório. Tente novamente.")
    }
  }

  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString("pt-BR")
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <BarChart3 className="h-7 w-7 text-blue-600" />
                Relatório de Clientes
              </h1>
              <p className="text-gray-600 mt-1">Análises e dados sobre a sua base de clientes.</p>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Dashboard de Resumo</h2>
          {loadingDashboard ? (
            <p className="text-center text-gray-500 py-8">Carregando estatísticas...</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Card 1 */}
              <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Total de Clientes</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.totalClientes ?? 0}</p>
                  </div>
                  <Users className="h-10 w-10 text-blue-500 opacity-70" />
                </div>
              </div>
              {/* Card 2 */}
              <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Clientes Ativos</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.clientesAtivos ?? 0}</p>
                  </div>
                  <UserCheck className="h-10 w-10 text-green-500 opacity-70" />
                </div>
              </div>
              {/* Card 3 */}
              <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-red-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Clientes Inativos</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.clientesInativos ?? 0}</p>
                  </div>
                  <UserX className="h-10 w-10 text-red-500 opacity-70" />
                </div>
              </div>
              {/* Card 4 - Clientes por Tipo */}
              <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-indigo-500">
                <h3 className="text-gray-600 text-sm font-medium mb-4">Clientes por Tipo</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <User className="h-5 w-5 text-gray-500" />
                      <span className="font-medium text-gray-700 text-sm">Pessoa Física</span>
                    </div>
                    <span className="font-bold text-xl text-indigo-600">{clientesPorTipo?.clientesPF ?? 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Building2 className="h-5 w-5 text-gray-500" />
                      <span className="font-medium text-gray-700 text-sm">Pessoa Jurídica</span>
                    </div>
                    <span className="font-bold text-xl text-indigo-600">{clientesPorTipo?.clientesPJ ?? 0}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6 border-b">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                <FileText className="h-6 w-6 text-blue-600" />
                Relatório Detalhado de Clientes
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
                    placeholder="Nome, email, CPF/CNPJ..."
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
                    <option value="ativo">Ativo</option>
                    <option value="inativo">Inativo</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={aplicarFiltros}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Search className="h-4 w-4" />
                  Aplicar
                </button>
                <button onClick={limparFiltros} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">
                  Limpar
                </button>
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            {loadingRelatorio ? (
              <div className="p-8 text-center text-gray-500">Carregando relatório...</div>
            ) : clientes.length === 0 ? (
              <div className="p-8 text-center">
                <Users className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500">Nenhum cliente encontrado com os filtros aplicados.</p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contato</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Endereço</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cadastro</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Compras</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {clientes.map((cliente) => (
                    <tr key={cliente.id_cliente} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-sm font-medium text-gray-900">{cliente.nome}</p>
                        <p className="text-sm text-gray-500">{cliente.cpf_cnpj}</p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-sm text-gray-800">{cliente.email}</p>
                        <p className="text-sm text-gray-500">{cliente.telefone ?? "Não informado"}</p>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                        {cliente.endereco ?? "Não informado"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatarData(cliente.data_cadastro)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${cliente.status === "ativo" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                            }`}
                        >
                          {cliente.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-medium text-gray-800">
                        {cliente.quantidade_compras}
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