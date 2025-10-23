"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import Layout from "../components/Layout"
import axios from "axios"
import { Wrench, CheckCircle, AlertCircle, Clock, Eye } from "lucide-react"

interface Solicitacao {
  id_solicitacao: number
  tipo_equipamento: string
  marca: string
  modelo: string
  descricao_problema: string
  data_solicitacao: string
  status: string
}

export default function NovaSolicitacaoAssistencia() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [protocolo, setProtocolo] = useState("")
  const [error, setError] = useState("")
  const [usuarioLogado, setUsuarioLogado] = useState<any>(null)
  const [verificandoAuth, setVerificandoAuth] = useState(true)

  const [solicitacoesAbertas, setSolicitacoesAbertas] = useState<Solicitacao[]>([])
  const [loadingSolicitacoes, setLoadingSolicitacoes] = useState(false)

  const [formData, setFormData] = useState({
    tipo_equipamento: "",
    marca: "",
    modelo: "",
    descricao_problema: "",
    forma_envio: "",
  })

  const [fotos, setFotos] = useState<File[]>([])
  const [fotoPreviews, setFotoPreviews] = useState<string[]>([])

  useEffect(() => {
    const verificarUsuario = async () => {
      const token = localStorage.getItem("token")

      if (!token) {
        setVerificandoAuth(false)
        return
      }

      try {
        axios.defaults.headers.common["Authorization"] = `Bearer ${token}`
        const response = await axios.get("http://localhost:3000/auth/me")

        if (response.status === 200 && response.data.tipo === "cliente") {
          setUsuarioLogado(response.data)
          fetchSolicitacoesAbertas()
        }
      } catch (err) {
        console.error("Erro ao verificar usuário:", err)
      } finally {
        setVerificandoAuth(false)
      }
    }

    verificarUsuario()
  }, [])

  const fetchSolicitacoesAbertas = async () => {
    setLoadingSolicitacoes(true)
    try {
      const response = await axios.get("http://localhost:3000/assistencia/minhas-solicitacoes")
      // Filter only open requests (not concluded, rejected or cancelled)
      const abertas = response.data.filter(
        (s: Solicitacao) => !["concluido", "rejeitado", "cancelado"].includes(s.status),
      )
      setSolicitacoesAbertas(abertas)
    } catch (err) {
      console.error("Erro ao buscar solicitações abertas:", err)
    } finally {
      setLoadingSolicitacoes(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; color: string }> = {
      solicitado: { label: "Solicitado", color: "bg-blue-100 text-blue-800" },
      em_analise: { label: "Em Análise", color: "bg-yellow-100 text-yellow-800" },
      aguardando_aprovacao: { label: "Aguardando Aprovação", color: "bg-purple-100 text-purple-800" },
      aguardando_pagamento: { label: "Aguardando Pagamento", color: "bg-orange-100 text-orange-800" },
      aprovado: { label: "Aprovado", color: "bg-green-100 text-green-800" },
      em_execucao: { label: "Em Execução", color: "bg-indigo-100 text-indigo-800" },
    }

    const config = statusConfig[status] || statusConfig.solicitado
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    setError("")
  }

  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])

    if (fotos.length + files.length > 5) {
      setError("Você pode adicionar no máximo 5 fotos")
      return
    }

    const validFiles: File[] = []
    const previews: string[] = []

    files.forEach((file) => {
      if (file.size > 5 * 1024 * 1024) {
        setError("Cada imagem deve ter no máximo 5MB")
        return
      }

      validFiles.push(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        previews.push(reader.result as string)
        if (previews.length === validFiles.length) {
          setFotos((prev) => [...prev, ...validFiles])
          setFotoPreviews((prev) => [...prev, ...previews])
        }
      }
      reader.readAsDataURL(file)
    })
  }

  const removerFoto = (index: number) => {
    setFotos((prev) => prev.filter((_, i) => i !== index))
    setFotoPreviews((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const formDataToSend = new FormData()
      formDataToSend.append("tipo_equipamento", formData.tipo_equipamento)
      formDataToSend.append("marca", formData.marca)
      formDataToSend.append("modelo", formData.modelo)
      formDataToSend.append("descricao_problema", formData.descricao_problema)
      formDataToSend.append("forma_envio", formData.forma_envio)

      fotos.forEach((foto) => {
        formDataToSend.append("fotos", foto)
      })

      const token = localStorage.getItem("token")
      const response = await axios.post("http://localhost:3000/assistencia/solicitar", formDataToSend, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      })

      setProtocolo(response.data.protocolo)
      setSuccess(true)
      fetchSolicitacoesAbertas()
    } catch (err: any) {
      console.error("Erro ao criar solicitação:", err)
      setError(err.response?.data?.message || "Erro ao criar solicitação. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  if (verificandoAuth) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Verificando autenticação...</p>
          </div>
        </div>
      </Layout>
    )
  }

  if (!usuarioLogado) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 py-12">
          <div className="max-w-2xl mx-auto px-4">
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <div className="flex justify-center mb-4">
                <AlertCircle className="h-16 w-16 text-yellow-500" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Autenticação Necessária</h2>
              <p className="text-gray-600 mb-6">
                Você precisa estar logado como cliente para solicitar assistência técnica.
              </p>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => navigate("/login")}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Fazer Login
                </button>
                <button
                  onClick={() => navigate("/")}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Voltar ao Início
                </button>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  if (success) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 py-12">
          <div className="max-w-2xl mx-auto px-4">
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <div className="flex justify-center mb-4">
                <CheckCircle className="h-16 w-16 text-green-500" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Solicitação Criada com Sucesso!</h2>
              <p className="text-gray-600 mb-4">Seu protocolo de atendimento é:</p>
              <div className="bg-blue-50 border-2 border-blue-500 rounded-lg p-4 mb-6">
                <p className="text-3xl font-bold text-blue-600">{protocolo}</p>
              </div>
              <p className="text-gray-600 mb-6">
                Guarde este número para acompanhar o status da sua solicitação.
              </p>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => navigate("/acompanhar-solicitacoes")}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Acompanhar Solicitações
                </button>
                <button
                  onClick={() => {
                    setSuccess(false)
                    setProtocolo("")
                    setFormData({
                      tipo_equipamento: "",
                      marca: "",
                      modelo: "",
                      descricao_problema: "",
                      forma_envio: "",
                    })
                    setFotos([])
                    setFotoPreviews([])
                  }}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Nova Solicitação
                </button>
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
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Form Section */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-md p-8">
                <div className="flex items-center mb-6">
                  <Wrench className="h-8 w-8 text-blue-600 mr-3" />
                  <h1 className="text-3xl font-bold text-gray-800">Nova Solicitação de Assistência Técnica</h1>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Solicitação para:</h3>
                  <p className="text-gray-800 font-medium">{usuarioLogado.nome}</p>
                  <p className="text-sm text-gray-600">{usuarioLogado.email}</p>
                  {usuarioLogado.telefone && <p className="text-sm text-gray-600">{usuarioLogado.telefone}</p>}
                </div>

                <p className="text-gray-600 mb-8">
                  Preencha os dados abaixo para solicitar assistência técnica para seu equipamento. Nossa equipe
                  analisará e entrará em contato com um orçamento.
                </p>

                {error && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-600">{error}</p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Dados do Equipamento */}
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Dados do Equipamento</h3>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Equipamento *</label>
                        <select
                          name="tipo_equipamento"
                          value={formData.tipo_equipamento}
                          onChange={handleInputChange}
                          required
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="">Selecione o tipo</option>
                          <option value="Notebook">Notebook</option>
                          <option value="Desktop">Desktop</option>
                        </select>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Marca *</label>
                          <input
                            type="text"
                            name="marca"
                            value={formData.marca}
                            onChange={handleInputChange}
                            required
                            placeholder="Ex: Dell, HP, Lenovo"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Modelo *</label>
                          <input
                            type="text"
                            name="modelo"
                            value={formData.modelo}
                            onChange={handleInputChange}
                            required
                            placeholder="Ex: Inspiron 15, Pavilion"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Descrição do Problema *</label>
                        <textarea
                          name="descricao_problema"
                          value={formData.descricao_problema}
                          onChange={handleInputChange}
                          required
                          rows={4}
                          placeholder="Descreva detalhadamente o problema que está enfrentando..."
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Forma de Envio *</label>
                        <select
                          name="forma_envio"
                          value={formData.forma_envio}
                          onChange={handleInputChange}
                          required
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="">Selecione como enviará o equipamento</option>
                          <option value="Entrega Pessoal">Entrega Pessoal na Loja</option>
                          <option value="Correios">Envio pelos Correios</option>
                          <option value="Transportadora">Transportadora</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Fotos do Equipamento (Opcional)
                        </label>
                        <p className="text-xs text-gray-500 mb-2">
                          Adicione até 5 fotos do equipamento e do problema (máx. 5MB cada)
                        </p>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleFotoChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />

                        {fotoPreviews.length > 0 && (
                          <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
                            {fotoPreviews.map((preview, index) => (
                              <div key={index} className="relative">
                                <img
                                  src={preview || "/placeholder.svg"}
                                  alt={`Preview ${index + 1}`}
                                  className="w-full h-32 object-cover rounded-lg border border-gray-300"
                                />
                                <button
                                  type="button"
                                  onClick={() => removerFoto(index)}
                                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M6 18L18 6M6 6l12 12"
                                    />
                                  </svg>
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Botões */}
                  <div className="flex gap-4 pt-4">
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
                    >
                      {loading ? "Enviando..." : "Enviar Solicitação"}
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate("/")}
                      className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-800">Chamados Abertos</h2>
                  <Clock className="h-6 w-6 text-blue-600" />
                </div>

                {loadingSolicitacoes ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto mb-2"></div>
                    <p className="text-sm text-gray-600">Carregando...</p>
                  </div>
                ) : solicitacoesAbertas.length === 0 ? (
                  <div className="text-center py-8">
                    <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Nenhum chamado aberto</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[600px] overflow-y-auto">
                    {solicitacoesAbertas.map((solicitacao) => (
                      <div
                        key={solicitacao.id_solicitacao}
                        className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <p className="text-sm font-semibold text-gray-800">
                            AT-{solicitacao.id_solicitacao.toString().padStart(6, "0")}
                          </p>
                          {getStatusBadge(solicitacao.status)}
                        </div>
                        <p className="text-sm text-gray-700 mb-1">
                          {solicitacao.marca} {solicitacao.modelo}
                        </p>
                        <p className="text-xs text-gray-500 mb-3">{formatDate(solicitacao.data_solicitacao)}</p>
                        <button
                          onClick={() => navigate(`/acompanhar-solicitacoes/${solicitacao.id_solicitacao}`)}
                          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <Eye className="h-4 w-4" />
                          Ver Detalhes
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  onClick={() => navigate("/acompanhar-solicitacoes")}
                  className="w-full mt-4 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                >
                  Ver Todas as Solicitações
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
