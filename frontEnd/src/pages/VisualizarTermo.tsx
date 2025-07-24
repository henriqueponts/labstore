"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import axios from "axios"
import Layout from "../components/Layout"
import { FileText, ArrowLeft, Edit, Calendar, CheckCircle, Clock } from "lucide-react"

interface Termo {
  id_termo: number
  versao: string
  data_efetiva: string
  status_termo: "ativo" | "pendente"
  conteudo: string
  pode_editar?: boolean
}

const VisualizarTermo: React.FC = () => {
  const [termo, setTermo] = useState<Termo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const navigate = useNavigate()
  const { id } = useParams()

  useEffect(() => {
    checkAuth()
    loadTermo()
  }, [id])

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

  const loadTermo = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem("token")
      console.log("📋 Carregando termo ID:", id)

      const response = await axios.get(`http://localhost:3000/lgpd/termos/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      console.log("✅ Termo carregado:", response.data)
      setTermo(response.data)
    } catch (err) {
      console.error("❌ Erro ao carregar termo:", err)
      setError("Erro ao carregar termo. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR")
  }

  const getStatusBadge = (status: "ativo" | "pendente", dataEfetiva: string) => {
    const isToday = new Date().toDateString() === new Date(dataEfetiva).toDateString()

    if (status === "ativo") {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
          <CheckCircle size={16} className="mr-1" />
          Ativo
        </span>
      )
    } else {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
          <Clock size={16} className="mr-1" />
          {isToday ? "Implementando hoje" : "Pendente"}
        </span>
      )
    }
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

  if (error || !termo) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center">
            <FileText className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Erro ao carregar termo</h3>
            <p className="text-gray-500 mb-6">{error || "Termo não encontrado"}</p>
            <button
              onClick={() => navigate("/gestao/lgpd")}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md transition-colors"
            >
              Voltar para Gestão LGPD
            </button>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => navigate("/gestao/lgpd")}
                className="mr-4 p-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
              <FileText className="text-blue-600 mr-3" size={32} />
              <div>
                <h1 className="text-3xl font-bold text-gray-800">Termo LGPD v{termo.versao}</h1>
                <div className="flex items-center space-x-4 mt-2">
                  {getStatusBadge(termo.status_termo, termo.data_efetiva)}
                  <div className="flex items-center text-gray-600">
                    <Calendar size={16} className="mr-1" />
                    <span className="text-sm">Data efetiva: {formatDate(termo.data_efetiva)}</span>
                  </div>
                </div>
              </div>
            </div>
            {termo.pode_editar && (
              <button
                onClick={() => {
                  console.log("🔧 Navegando para edição do termo:", termo.id_termo)
                  navigate(`/gestao/lgpd/editar-termo/${termo.id_termo}`)
                }}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md flex items-center transition-colors"
              >
                <Edit size={16} className="mr-2" />
                Editar
              </button>
            )}
          </div>
        </div>

        {/* Aviso sobre status do termo */}
        {termo.status_termo === "pendente" && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center">
              <Clock className="text-blue-600 mr-3" size={20} />
              <div>
                <h3 className="text-blue-800 font-medium">Termo Pendente</h3>
                <p className="text-blue-700 text-sm mt-1">
                  Este termo será implementado automaticamente em {formatDate(termo.data_efetiva)}.
                  {termo.pode_editar
                    ? " Você ainda pode editá-lo até o dia anterior à implementação."
                    : " Não é mais possível editá-lo pois a data de implementação chegou."}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Conteúdo do termo */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">Conteúdo do Termo</h2>
          </div>
          <div className="p-6">
            <div className="prose max-w-none">
              <div
                className="text-gray-700 leading-relaxed whitespace-pre-wrap"
                dangerouslySetInnerHTML={{
                  __html: termo.conteudo.replace(/\n/g, "<br>"),
                }}
              />
            </div>
          </div>
        </div>

        {/* Informações adicionais */}
        <div className="mt-6 bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-800 mb-2">Informações do Termo</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-600">ID:</span>
              <span className="ml-2 font-medium">{termo.id_termo}</span>
            </div>
            <div>
              <span className="text-gray-600">Versão:</span>
              <span className="ml-2 font-medium">v{termo.versao}</span>
            </div>
            <div>
              <span className="text-gray-600">Status:</span>
              <span className="ml-2">{getStatusBadge(termo.status_termo, termo.data_efetiva)}</span>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default VisualizarTermo
