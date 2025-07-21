"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import Layout from "../components/Layout"
import { FileText, Plus, Eye, Calendar, Users, BarChart3, AlertCircle } from "lucide-react"

interface Termo {
  id_termo: number
  versao: string
  data_efetiva: string
  preview_conteudo?: string
  conteudo?: string
}

interface RelatorioItem {
  versao: string
  data_efetiva: string
  total_aceites: number
  aceites_ativos: number
}

const GestaoLGPD: React.FC = () => {
  const [termos, setTermos] = useState<Termo[]>([])
  const [relatorio, setRelatorio] = useState<RelatorioItem[]>([])
  const [loading, setLoading] = useState(true)
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

      const [termosResponse, relatorioResponse] = await Promise.all([
        axios.get("http://localhost:3000/lgpd/termos", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get("http://localhost:3000/lgpd/relatorio-consentimentos", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ])

      setTermos(termosResponse.data)
      setRelatorio(relatorioResponse.data)
    } catch (err) {
      console.error("Erro ao carregar dados:", err)
      setError("Erro ao carregar dados. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR")
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
            <button
              onClick={() => navigate("/gestao/lgpd/novo-termo")}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center transition-colors"
            >
              <Plus size={16} className="mr-2" />
              {termos.length === 0 ? "Criar Primeiro Termo" : "Novo Termo"}
            </button>
          </div>
        </div>

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
                            onClick={() => navigate(`/gestao/lgpd/termo/${termo.id_termo}`)}
                            className="text-blue-600 hover:text-blue-900 p-1"
                            title="Visualizar"
                          >
                            <Eye size={16} />
                          </button>
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
