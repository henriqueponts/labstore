"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import Layout from "../components/Layout"
import {
  FileText,
  Plus,
  Eye,
  Calendar,
  Users,
  BarChart3,
  AlertCircle,
  Clock,
  CheckCircle,
  Edit,
  RefreshCw,
} from "lucide-react"

interface Termo {
  id_termo: number
  versao: string
  data_efetiva: string
  status_termo: "ativo" | "pendente"
  preview_conteudo?: string
  conteudo?: string
  pode_editar?: boolean
}

interface RelatorioItem {
  versao: string
  data_efetiva: string
  status_termo: "ativo" | "pendente"
  total_aceites: number
  aceites_ativos: number
}

interface StatusLGPD {
  configurado: boolean
  total_termos_ativos: number
  total_termos_pendentes: number
  pode_criar_novo: boolean
}

const GestaoLGPD: React.FC = () => {
  const [termos, setTermos] = useState<Termo[]>([])
  const [relatorio, setRelatorio] = useState<RelatorioItem[]>([])
  const [statusLGPD, setStatusLGPD] = useState<StatusLGPD | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState("")
  const [activeTab, setActiveTab] = useState<"termos" | "relatorio">("termos")
  const navigate = useNavigate()

  useEffect(() => {
    checkAuth()
    loadData()
  }, [])

  const checkAuth = () => {
    const usuario = localStorage.getItem("usuario")
    if (!usuario) {
      navigate("/login")
      return
    }

    const userData = JSON.parse(usuario)
    if (userData.tipo !== "funcionario" || userData.tipo_perfil !== "admin") {
      navigate("/")
      return
    }
  }

  const loadData = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem("token")

      const [termosResponse, relatorioResponse, statusResponse] = await Promise.all([
        axios.get("http://localhost:3000/lgpd/termos", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get("http://localhost:3000/lgpd/relatorio-consentimentos", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get("http://localhost:3000/lgpd/status"),
      ])

      setTermos(termosResponse.data)
      setRelatorio(relatorioResponse.data)
      setStatusLGPD(statusResponse.data)
    } catch (err) {
      console.error("Erro ao carregar dados:", err)
      setError("Erro ao carregar dados. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  // ✅ NOVA FUNÇÃO: Atualizar termos pendentes manualmente
  const handleUpdatePendingTerms = async () => {
    try {
      setUpdating(true)
      const token = localStorage.getItem("token")

      console.log("🔄 Atualizando termos pendentes...")

      const response = await axios.post(
        "http://localhost:3000/lgpd/atualizar-termos-pendentes",
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      )

      console.log("✅ Resposta:", response.data)

      // Recarregar dados após atualização
      await loadData()

      // Mostrar mensagem de sucesso
      if (response.data.total_atualizados > 0) {
        alert(`✅ ${response.data.total_atualizados} termo(s) atualizado(s) com sucesso!`)
      } else {
        alert("ℹ️ Nenhum termo pendente para ativar no momento.")
      }
    } catch (err: any) {
      console.error("❌ Erro ao atualizar termos:", err)
      alert("❌ Erro ao atualizar termos pendentes. Tente novamente.")
    } finally {
      setUpdating(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR")
  }

  const getStatusBadge = (status: "ativo" | "pendente", dataEfetiva: string) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const dataEfetivaDate = new Date(dataEfetiva)
    dataEfetivaDate.setHours(0, 0, 0, 0)

    const isToday = dataEfetivaDate.getTime() === today.getTime()
    const isPast = dataEfetivaDate.getTime() < today.getTime()

    if (status === "ativo") {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle size={12} className="mr-1" />
          Ativo
        </span>
      )
    } else {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <Clock size={12} className="mr-1" />
          {isToday ? "Ativa hoje" : isPast ? "Deveria estar ativo" : "Pendente"}
        </span>
      )
    }
  }

  const canEditTerm = (termo: Termo) => {
    if (termo.status_termo !== "pendente") return false

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const dataImplementacao = new Date(termo.data_efetiva)
    dataImplementacao.setHours(0, 0, 0, 0)

    return today < dataImplementacao
  }

  const getTermoPendente = () => {
    return termos.find((termo) => termo.status_termo === "pendente")
  }

  const hasTermsToUpdate = () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    return termos.some((termo) => {
      if (termo.status_termo !== "pendente") return false

      const dataEfetiva = new Date(termo.data_efetiva)
      dataEfetiva.setHours(0, 0, 0, 0)

      return dataEfetiva <= today
    })
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando...</p>
          </div>
        </div>
      </Layout>
    )
  }

  const termoPendente = getTermoPendente()

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <FileText className="text-blue-600 mr-3" size={32} />
              <div>
                <h1 className="text-3xl font-bold text-gray-800">Gestão LGPD</h1>
                <p className="text-gray-600">Gerenciar termos de consentimento e relatórios</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {statusLGPD && (
                <div className="text-sm text-gray-600">
                  <div className="flex items-center space-x-4">
                    <span className="flex items-center">
                      <CheckCircle size={16} className="text-green-500 mr-1" />
                      {statusLGPD.total_termos_ativos} ativo(s)
                    </span>
                    <span className="flex items-center">
                      <Clock size={16} className="text-yellow-500 mr-1" />
                      {statusLGPD.total_termos_pendentes} pendente(s)
                    </span>
                  </div>
                </div>
              )}

              {/* ✅ BOTÃO PARA ATUALIZAR TERMOS PENDENTES */}
              {hasTermsToUpdate() && (
                <button
                  onClick={handleUpdatePendingTerms}
                  disabled={updating}
                  className={`px-4 py-2 rounded-md flex items-center transition-colors ${
                    updating
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-orange-600 hover:bg-orange-700 text-white"
                  }`}
                  title="Ativar termos pendentes cuja data efetiva já chegou"
                >
                  <RefreshCw size={16} className={`mr-2 ${updating ? "animate-spin" : ""}`} />
                  {updating ? "Atualizando..." : "Ativar Termos"}
                </button>
              )}

              <button
                onClick={() => navigate("/gestao/lgpd/novo-termo")}
                disabled={!statusLGPD?.pode_criar_novo}
                className={`px-4 py-2 rounded-md flex items-center transition-colors ${
                  statusLGPD?.pode_criar_novo
                    ? "bg-blue-600 hover:bg-blue-700 text-white"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
                title={!statusLGPD?.pode_criar_novo ? "Não é possível criar novo termo enquanto há um pendente" : ""}
              >
                <Plus size={16} className="mr-2" />
                {termos.length === 0 ? "Criar Primeiro Termo" : "Novo Termo"}
              </button>
            </div>
          </div>
        </div>

        {/* ✅ ALERTA PARA TERMOS QUE DEVERIAM ESTAR ATIVOS */}
        {hasTermsToUpdate() && (
          <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <AlertCircle className="text-orange-600 mr-3" size={20} />
                <div>
                  <h3 className="text-orange-800 font-medium">Termos Pendentes Precisam ser Ativados</h3>
                  <p className="text-orange-700 text-sm mt-1">
                    Existem termos pendentes cuja data efetiva já chegou. Clique em "Ativar Termos" para atualizá-los
                    automaticamente.
                  </p>
                </div>
              </div>
              <button
                onClick={handleUpdatePendingTerms}
                disabled={updating}
                className={`px-4 py-2 rounded-md flex items-center transition-colors ${
                  updating
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-orange-600 hover:bg-orange-700 text-white"
                }`}
              >
                <RefreshCw size={16} className={`mr-2 ${updating ? "animate-spin" : ""}`} />
                {updating ? "Atualizando..." : "Ativar Agora"}
              </button>
            </div>
          </div>
        )}

        {/* Alerta quando há termo pendente */}
        {termoPendente && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center">
              <Clock className="text-blue-600 mr-3" size={20} />
              <div>
                <h3 className="text-blue-800 font-medium">Termo Pendente de Implementação</h3>
                <p className="text-blue-700 text-sm mt-1">
                  Versão {termoPendente.versao} será implementada em {formatDate(termoPendente.data_efetiva)}.
                  {canEditTerm(termoPendente)
                    ? " Você ainda pode editá-lo até o dia anterior à implementação."
                    : " Não é mais possível editá-lo pois a data de implementação chegou."}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Alerta quando não há termos */}
        {termos.length === 0 && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center">
              <AlertCircle className="text-yellow-600 mr-3" size={20} />
              <div>
                <h3 className="text-yellow-800 font-medium">Sistema LGPD não configurado</h3>
                <p className="text-yellow-700 text-sm mt-1">
                  Nenhum termo de consentimento foi cadastrado ainda. Clientes poderão se cadastrar e fazer login
                  normalmente, mas sem aceite de termo LGPD.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">{error}</div>}

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab("termos")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "termos"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <FileText size={16} className="inline mr-2" />
                Termos ({termos.length})
              </button>
              <button
                onClick={() => setActiveTab("relatorio")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "relatorio"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <BarChart3 size={16} className="inline mr-2" />
                Relatórios
              </button>
            </nav>
          </div>
        </div>

        {/* Content */}
        {activeTab === "termos" && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">Termos de Consentimento</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Versão
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data Efetiva
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Preview
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {termos.map((termo) => (
                    <tr key={termo.id_termo} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="text-sm font-medium text-gray-900">v{termo.versao}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(termo.status_termo, termo.data_efetiva)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-500">
                          <Calendar size={14} className="mr-1" />
                          {formatDate(termo.data_efetiva)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-md truncate">{termo.preview_conteudo}...</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => {
                              console.log("👁️ Visualizando termo:", termo.id_termo)
                              navigate(`/gestao/lgpd/termo/${termo.id_termo}`)
                            }}
                            className="text-blue-600 hover:text-blue-900 p-1"
                            title="Visualizar"
                          >
                            <Eye size={16} />
                          </button>
                          {canEditTerm(termo) && (
                            <button
                              onClick={() => {
                                console.log("🔧 Editando termo:", termo.id_termo)
                                navigate(`/gestao/lgpd/editar-termo/${termo.id_termo}`)
                              }}
                              className="text-green-600 hover:text-green-900 p-1"
                              title="Editar (disponível até o dia anterior à implementação)"
                            >
                              <Edit size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {termos.length === 0 && (
                <div className="text-center py-12">
                  <FileText className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum termo encontrado</h3>
                  <p className="text-gray-500 mb-6 max-w-md mx-auto">
                    O sistema LGPD ainda não foi configurado. Crie o primeiro termo de consentimento para começar a
                    coletar aceites dos clientes.
                  </p>
                  <button
                    onClick={() => navigate("/gestao/lgpd/novo-termo")}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md flex items-center mx-auto transition-colors"
                  >
                    <Plus size={16} className="mr-2" />
                    Criar Primeiro Termo
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "relatorio" && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">Relatório de Consentimentos</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Versão
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data Efetiva
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Aceites
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {relatorio.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">v{item.versao}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(item.status_termo, item.data_efetiva)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-500">
                          <Calendar size={14} className="mr-1" />
                          {formatDate(item.data_efetiva)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-900">
                          <Users size={14} className="mr-1" />
                          {item.total_aceites}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {relatorio.length === 0 && (
                <div className="text-center py-12">
                  <BarChart3 className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum dado encontrado</h3>
                  <p className="text-gray-500 mb-6 max-w-md mx-auto">
                    Os relatórios aparecerão quando houver termos cadastrados e consentimentos registrados pelos
                    clientes.
                  </p>
                  {termos.length === 0 && (
                    <button
                      onClick={() => navigate("/gestao/lgpd/novo-termo")}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md flex items-center mx-auto transition-colors"
                    >
                      <Plus size={16} className="mr-2" />
                      Criar Primeiro Termo
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

export default GestaoLGPD
