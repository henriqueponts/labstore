"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import Layout from "../components/Layout"
import {
  ArrowLeft,
  Search,
  Eye,
  MessageSquare,
  Clock,
  CheckCircle,
  AlertCircle,
  X,
  User,
  Mail,
  Phone,
  Calendar,
  Tag,
  FileText,
  Send,
  RefreshCw,
  BarChart3,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"

// Importar o novo componente de dashboard
import DashboardChamados from "../components/DashboardChamados"

// Interfaces (mantém as mesmas)
interface Chamado {
  id_chamado: number
  assunto: string
  descricao: string
  categoria: string | null
  status: "aberto" | "aguardando_cliente" | "aguardando_funcionario" | "encerrado"
  data_abertura: string
  cliente_nome: string
  cliente_email: string
  cliente_telefone?: string
}

interface RespostaChamado {
  id_resposta: number
  resposta: string
  data_resposta: string
  tipo_usuario: "cliente" | "suporte"
  nome_usuario: string
}

interface ChamadoDetalhado extends Chamado {
  id_cliente: number
  cliente_documento: string
  respostas?: RespostaChamado[]
}

interface Estatisticas {
  geral: {
    total: number
    abertos: number
    aguardando_cliente: number
    aguardando_funcionario: number
    encerrados: number
  }
  categorias: Array<{
    categoria: string
    quantidade: number
  }>
  recentes: Array<{
    data: string
    quantidade: number
  }>
}

interface Paginacao {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
}

const AdminChamadosPage: React.FC = () => {
  const navigate = useNavigate()
  const [view, setView] = useState<"lista" | "detalhes" | "dashboard">("lista")

  // Estados da lista
  const [chamados, setChamados] = useState<Chamado[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Estados dos filtros
  const [filtroStatus, setFiltroStatus] = useState("todos")
  const [filtroCategoria, setFiltroCategoria] = useState("todas")
  const [searchTerm, setSearchTerm] = useState("")
  const [mostrarEncerrados, setMostrarEncerrados] = useState(false)
  const [paginacao, setPaginacao] = useState<Paginacao>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
  })

  // Estados dos detalhes
  const [chamadoSelecionado, setChamadoSelecionado] = useState<ChamadoDetalhado | null>(null)
  const [resposta, setResposta] = useState("")
  const [novoStatus, setNovoStatus] = useState("")

  // Estados do dashboard
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [estatisticas, setEstatisticas] = useState<Estatisticas | null>(null)

  // No componente AdminChamadosPage, adicionar estado para justificativa de reabertura
  const [justificativaReabertura, setJustificativaReabertura] = useState("")

  const statusOptions = [
    { value: "todos", label: "Todos os Status", color: "gray" },
    { value: "aberto", label: "Aberto", color: "blue" },
    { value: "aguardando_cliente", label: "Aguardando Cliente", color: "orange" },
    { value: "aguardando_funcionario", label: "Aguardando Funcionário", color: "indigo" },
    { value: "encerrado", label: "Encerrado", color: "gray" },
  ]

  const categoriaOptions = [
    { value: "todas", label: "Todas as Categorias" },
    { value: "Problema com Pedido", label: "Problema com Pedido" },
    { value: "Problema Técnico", label: "Problema Técnico" },
    { value: "Dúvida sobre Produto", label: "Dúvida sobre Produto" },
    { value: "Problema de Pagamento", label: "Problema de Pagamento" },
    { value: "Assistência Técnica", label: "Assistência Técnica" },
    { value: "Outros", label: "Outros" },
  ]

  // Verificar se usuário é funcionário
  const checkAccess = async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        navigate("/login")
        return
      }

      const response = await axios.get("http://localhost:3000/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.data.tipo !== "funcionario") {
        navigate("/")
        return
      }
    } catch (err) {
      console.error("Erro ao verificar acesso:", err)
      navigate("/login")
    }
  }

  useEffect(() => {
    checkAccess()
  }, [])

  // Buscar chamados
  const fetchChamados = async (page = 1) => {
    setLoading(true)
    setError(null)
    try {
      const token = localStorage.getItem("token")
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        ...(filtroStatus !== "todos" && { status: filtroStatus }),
        ...(filtroCategoria !== "todas" && { categoria: filtroCategoria }),
        ...(!mostrarEncerrados && { excluir_encerrados: "true" }),
      })

      const response = await axios.get(`http://localhost:3000/chamados/todos?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      setChamados(response.data.chamados)
      setPaginacao(response.data.pagination)
    } catch (err: unknown) {
      console.error("Erro ao buscar chamados:", err)
      setError("Erro ao carregar chamados")
    } finally {
      setLoading(false)
    }
  }

  // Buscar chamado específico
  const fetchChamadoDetalhes = async (chamadoId: number) => {
    setLoading(true)
    setError(null)
    try {
      const token = localStorage.getItem("token")
      const response = await axios.get(`http://localhost:3000/chamados/${chamadoId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      // Buscar histórico de respostas também
      const respostasResponse = await axios.get(`http://localhost:3000/chamados/${chamadoId}/respostas`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      const chamadoCompleto = {
        ...response.data,
        respostas: respostasResponse.data,
      }

      setChamadoSelecionado(chamadoCompleto)
      setNovoStatus("")
      setView("detalhes")
    } catch (err: unknown) {
      console.error("Erro ao buscar detalhes do chamado:", err)
      setError("Erro ao carregar detalhes do chamado")
    } finally {
      setLoading(false)
    }
  }

  // Buscar estatísticas
  const fetchEstatisticas = async () => {
    setLoading(true)
    setError(null)
    try {
      const token = localStorage.getItem("token")
      const response = await axios.get("http://localhost:3000/chamados/stats/dashboard", {
        headers: { Authorization: `Bearer ${token}` },
      })

      setEstatisticas(response.data)
    } catch (err: unknown) {
      console.error("Erro ao buscar estatísticas:", err)
      setError("Erro ao carregar estatísticas")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (view === "lista") {
      fetchChamados(1)
    } else if (view === "dashboard") {
      fetchEstatisticas()
    }
  }, [view, filtroStatus, filtroCategoria, mostrarEncerrados])

  // Modificar a função handleUpdateStatus para incluir redirecionamento
  const handleUpdateStatus = async () => {
    if (!chamadoSelecionado || !novoStatus) return

    // Validar se é necessária justificativa para reabertura
    if (novoStatus === "aberto" && !justificativaReabertura.trim()) {
      setError("É obrigatório informar o motivo da reabertura do chamado")
      return
    }

    setLoading(true)
    setError(null)
    try {
      const token = localStorage.getItem("token")

      const payload: { status: string; justificativa?: string } = { status: novoStatus }
      if (novoStatus === "aberto") {
        payload.justificativa = justificativaReabertura.trim()
      }

      await axios.put(`http://localhost:3000/chamados/${chamadoSelecionado.id_chamado}/status`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      })

      setSuccess("Status atualizado com sucesso!")

      // Limpar estados
      if (novoStatus === "aberto") {
        setJustificativaReabertura("")
      }

      // Redirecionar imediatamente para a lista de chamados
      setView("lista")
      setChamadoSelecionado(null)
      setNovoStatus("")
    } catch (err: unknown) {
      console.error("Erro ao atualizar status:", err)
      if (
        err &&
        typeof err === "object" &&
        "response" in err &&
        err.response &&
        typeof err.response === "object" &&
        "data" in err.response &&
        err.response.data &&
        typeof err.response.data === "object" &&
        "message" in err.response.data
      ) {
        setError((err.response as { data: { message?: string } }).data.message || "Erro ao atualizar status")
      } else {
        setError("Erro ao atualizar status")
      }
    } finally {
      setLoading(false)
    }
  }

  // Responder chamado
  const handleResponder = async () => {
    if (!chamadoSelecionado || !resposta.trim()) return

    setLoading(true)
    setError(null)
    try {
      const token = localStorage.getItem("token")
      await axios.post(
        `http://localhost:3000/chamados/${chamadoSelecionado.id_chamado}/responder`,
        { resposta: resposta.trim() },
        { headers: { Authorization: `Bearer ${token}` } },
      )

      setSuccess("Resposta enviada com sucesso!")
      setResposta("")

      // Refresh the ticket details to show the new response immediately
      const respostasResponse = await axios.get(
        `http://localhost:3000/chamados/${chamadoSelecionado.id_chamado}/respostas`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      )

      setChamadoSelecionado({
        ...chamadoSelecionado,
        respostas: respostasResponse.data,
      })
    } catch (err: unknown) {
      console.error("Erro ao responder chamado:", err)
      if (
        err &&
        typeof err === "object" &&
        "response" in err &&
        err.response &&
        typeof err.response === "object" &&
        "data" in err.response &&
        err.response.data &&
        typeof err.response.data === "object" &&
        "message" in err.response.data
      ) {
        setError((err.response as { data: { message?: string } }).data.message || "Erro ao enviar resposta")
      } else {
        setError("Erro ao enviar resposta")
      }
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "aberto":
        return "text-blue-600 bg-blue-100"
      case "aguardando_cliente":
        return "text-orange-600 bg-orange-100"
      case "aguardando_funcionario":
        return "text-indigo-600 bg-indigo-100"
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
      case "encerrado":
        return "Encerrado"
      default:
        return status
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "aberto":
        return <AlertCircle className="w-4 h-4" />
      case "aguardando_cliente":
        return <User className="w-4 h-4" />
      case "aguardando_funcionario":
        return <Clock className="w-4 h-4" />
      case "encerrado":
        return <X className="w-4 h-4" />
      default:
        return <AlertCircle className="w-4 h-4" />
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const filteredChamados = chamados.filter(
    (chamado) =>
      (chamado.assunto.toLowerCase().includes(searchTerm.toLowerCase()) ||
        chamado.cliente_nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        chamado.cliente_email.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (mostrarEncerrados || chamado.status !== "encerrado"),
  )

  // Remover todo o código do dashboard view e substituir por:

  // Dashboard View
  if (view === "dashboard") {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <DashboardChamados onVoltar={() => setView("lista")} />
        </div>
      </Layout>
    )
  }

  // Detalhes View
  if (view === "detalhes" && chamadoSelecionado) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center mb-8">
            <button
              onClick={() => {
                setView("lista")
                setChamadoSelecionado(null)
              }}
              className="flex items-center text-gray-600 hover:text-gray-800 mr-4"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Voltar para Lista
            </button>
            <h1 className="text-2xl font-bold text-gray-900">
              Chamado LAB{chamadoSelecionado.id_chamado.toString().padStart(6, "0")}
            </h1>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
              <button onClick={() => setError(null)} className="float-right">
                <X className="w-4 h-4" />
              </button>
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
              <button onClick={() => setSuccess(null)} className="float-right">
                <X className="w-4 h-4" />
              </button>
              {success}
            </div>
          )}

          <div className="space-y-6">
            {/* Informações do Chamado */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Detalhes do Chamado</h2>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium flex items-center ${getStatusColor(chamadoSelecionado.status)}`}
                >
                  {getStatusIcon(chamadoSelecionado.status)}
                  <span className="ml-1">{getStatusText(chamadoSelecionado.status)}</span>
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Assunto</label>
                  <p className="text-gray-900">{chamadoSelecionado.assunto}</p>
                </div>

                {chamadoSelecionado.categoria && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      <Tag className="w-3 h-3 mr-1" />
                      {chamadoSelecionado.categoria}
                    </span>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data de Abertura</label>
                  <div className="flex items-center text-gray-900">
                    <Calendar className="w-4 h-4 mr-2" />
                    {formatDate(chamadoSelecionado.data_abertura)}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
                  <div className="flex items-center text-gray-900">
                    <User className="w-4 h-4 mr-2" />
                    {chamadoSelecionado.cliente_nome}
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                <div className="bg-gray-50 rounded-md p-3">
                  <p className="text-gray-900 whitespace-pre-wrap">{chamadoSelecionado.descricao}</p>
                </div>
              </div>
            </div>

            {/* Histórico de Respostas */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Histórico de Atendimento</h3>

              {chamadoSelecionado.respostas && chamadoSelecionado.respostas.length > 0 ? (
                <div className="space-y-4">
                  {chamadoSelecionado.respostas.map((resposta: RespostaChamado, index: number) => (
                    <div
                      key={index}
                      className={`border-l-4 pl-4 py-2 ${
                        resposta.tipo_usuario === "cliente" ? "border-green-500" : "border-blue-500"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          {resposta.tipo_usuario === "cliente" ? (
                            <User className="w-4 h-4 text-green-600 mr-2" />
                          ) : (
                            <MessageSquare className="w-4 h-4 text-blue-600 mr-2" />
                          )}
                          <span className="text-sm font-medium text-gray-900">
                            {resposta.tipo_usuario === "cliente"
                              ? `${resposta.nome_usuario} (Cliente)`
                              : `${resposta.nome_usuario} (Suporte)`}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">{formatDate(resposta.data_resposta)}</span>
                      </div>
                      <div
                        className={`rounded-md p-3 ${
                          resposta.tipo_usuario === "cliente" ? "bg-green-50" : "bg-blue-50"
                        }`}
                      >
                        <p className="text-gray-900 whitespace-pre-wrap">{resposta.resposta}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Ainda não há respostas para este chamado.</p>
                  <p className="text-sm text-gray-400 mt-2">Seja o primeiro a responder ao cliente.</p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Área de Resposta */}
              <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Responder Chamado</h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Sua Resposta</label>
                    <textarea
                      value={resposta}
                      onChange={(e) => setResposta(e.target.value)}
                      rows={5}
                      maxLength={1000}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Digite sua resposta para o cliente..."
                      disabled={chamadoSelecionado.status === "encerrado"}
                    />
                    <p className="text-xs text-gray-500 mt-1">{resposta.length}/1000 caracteres</p>
                  </div>

                  <button
                    onClick={handleResponder}
                    disabled={loading || !resposta.trim() || chamadoSelecionado.status === "encerrado"}
                    className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    {loading ? "Enviando..." : "Enviar Resposta"}
                  </button>
                </div>
              </div>

              {/* Alterar Status e Informações do Cliente */}
              <div className="space-y-6">
                {/* Informações do Cliente */}
                <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Informações do Cliente</h3>

                  <div className="space-y-3">
                    <div className="flex items-center">
                      <User className="w-4 h-4 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{chamadoSelecionado.cliente_nome}</p>
                        <p className="text-xs text-gray-500">Nome</p>
                      </div>
                    </div>

                    <div className="flex items-center">
                      <Mail className="w-4 h-4 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{chamadoSelecionado.cliente_email}</p>
                        <p className="text-xs text-gray-500">E-mail</p>
                      </div>
                    </div>

                    {chamadoSelecionado.cliente_telefone && (
                      <div className="flex items-center">
                        <Phone className="w-4 h-4 text-gray-400 mr-3" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{chamadoSelecionado.cliente_telefone}</p>
                          <p className="text-xs text-gray-500">Telefone</p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center">
                      <FileText className="w-4 h-4 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{chamadoSelecionado.cliente_documento}</p>
                        <p className="text-xs text-gray-500">CPF/CNPJ</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Alterar Status */}
                {/* Na seção "Alterar Status", modificar o conteúdo para incluir campo de justificativa */}
                <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Alterar Status</h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Novo Status</label>
                      <select
                        value={novoStatus}
                        onChange={(e) => {
                          setNovoStatus(e.target.value)
                          // Limpar justificativa se não for reabertura
                          if (e.target.value !== "aberto") {
                            setJustificativaReabertura("")
                          }
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Selecione um novo status</option>
                        {statusOptions.slice(1).map((status) => {
                          // Allow "aberto" if current status is "encerrado"
                          if (
                            status.value === "aberto" &&
                            chamadoSelecionado.status !== "encerrado"
                          ) {
                            return null
                          }
                          // Don't show system-managed statuses in dropdown
                          if (status.value === "aguardando_cliente" || status.value === "aguardando_funcionario") {
                            return null
                          }
                          return (
                            <option key={status.value} value={status.value}>
                              {status.label}
                            </option>
                          )
                        })}
                      </select>
                    </div>

                    {/* Campo de justificativa para reabertura */}
                    {novoStatus === "aberto" && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Motivo da Reabertura *</label>
                        <textarea
                          value={justificativaReabertura}
                          onChange={(e) => setJustificativaReabertura(e.target.value)}
                          rows={3}
                          maxLength={500}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Explique o motivo da reabertura deste chamado..."
                        />
                        <p className="text-xs text-gray-500 mt-1">{justificativaReabertura.length}/500 caracteres</p>
                        <p className="text-xs text-orange-600 mt-1">
                          ⚠️ Obrigatório informar o motivo para reabrir o chamado
                        </p>
                      </div>
                    )}

                    <button
                      onClick={handleUpdateStatus}
                      disabled={
                        loading ||
                        !novoStatus || // Agora exige que um status seja selecionado
                        (novoStatus === "aberto" && !justificativaReabertura.trim())
                      }
                      className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? "Atualizando..." : "Atualizar Status"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  // Lista View (padrão)
  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <button
              onClick={() => navigate("/admin")}
              className="flex items-center text-gray-600 hover:text-gray-800 mr-4"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Voltar
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Gerenciar Chamados</h1>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setView("dashboard")}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              <BarChart3 className="w-4 h-4 inline mr-2" />
              Dashboard
            </button>
            <button
              onClick={() => fetchChamados(1)}
              className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors"
            >
              <RefreshCw className="w-4 h-4 inline mr-2" />
              Atualizar
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            <button onClick={() => setError(null)} className="float-right">
              <X className="w-4 h-4" />
            </button>
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
            <button onClick={() => setSuccess(null)} className="float-right">
              <X className="w-4 h-4" />
            </button>
            {success}
          </div>
        )}

        {/* Filtros e Busca */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Buscar</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Buscar por assunto, cliente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {statusOptions.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Categoria</label>
              <select
                value={filtroCategoria}
                onChange={(e) => setFiltroCategoria(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {categoriaOptions.map((categoria) => (
                  <option key={categoria.value} value={categoria.value}>
                    {categoria.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col space-y-2">
              <button
                onClick={() => setMostrarEncerrados(!mostrarEncerrados)}
                className={`w-full px-4 py-2 rounded-md transition-colors text-sm font-medium ${
                  mostrarEncerrados
                    ? "bg-red-100 text-red-700 hover:bg-red-200"
                    : "bg-green-100 text-green-700 hover:bg-green-200"
                }`}
              >
                {mostrarEncerrados ? "Ocultar Encerrados" : "Mostrar Encerrados"}
              </button>
              <button
                onClick={() => {
                  setFiltroStatus("todos")
                  setFiltroCategoria("todas")
                  setSearchTerm("")
                  setMostrarEncerrados(false)
                }}
                className="w-full px-4 py-2 rounded-md transition-colors text-sm font-medium bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
              >
                Limpar Filtros
              </button>
            </div>
          </div>
        </div>

        {/* Lista de Chamados */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando chamados...</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Protocolo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Assunto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredChamados.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center">
                        <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">Nenhum chamado encontrado</p>
                      </td>
                    </tr>
                  ) : (
                    filteredChamados.map((chamado) => (
                      <tr key={chamado.id_chamado} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-medium text-gray-900">
                            LAB{chamado.id_chamado.toString().padStart(6, "0")}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{chamado.cliente_nome}</div>
                            <div className="text-sm text-gray-500">{chamado.cliente_email}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900 max-w-xs truncate">{chamado.assunto}</div>
                          {chamado.categoria && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 mt-1">
                              {chamado.categoria}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(chamado.status)}`}
                          >
                            {getStatusIcon(chamado.status)}
                            <span className="ml-1">{getStatusText(chamado.status)}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(chamado.data_abertura)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => fetchChamadoDetalhes(chamado.id_chamado)}
                            className="text-blue-600 hover:text-blue-900 flex items-center"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Ver Detalhes
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Paginação */}
            {paginacao.totalPages > 1 && (
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => fetchChamados(paginacao.currentPage - 1)}
                    disabled={paginacao.currentPage === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Anterior
                  </button>
                  <button
                    onClick={() => fetchChamados(paginacao.currentPage + 1)}
                    disabled={paginacao.currentPage === paginacao.totalPages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Próximo
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Mostrando{" "}
                      <span className="font-medium">{(paginacao.currentPage - 1) * paginacao.itemsPerPage + 1}</span>{" "}
                      até{" "}
                      <span className="font-medium">
                        {Math.min(paginacao.currentPage * paginacao.itemsPerPage, paginacao.totalItems)}
                      </span>{" "}
                      de <span className="font-medium">{paginacao.totalItems}</span> resultados
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                      <button
                        onClick={() => fetchChamados(paginacao.currentPage - 1)}
                        disabled={paginacao.currentPage === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>

                      {Array.from({ length: Math.min(5, paginacao.totalPages) }, (_, i) => {
                        const pageNum = i + 1
                        return (
                          <button
                            key={pageNum}
                            onClick={() => fetchChamados(pageNum)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              pageNum === paginacao.currentPage
                                ? "z-10 bg-blue-50 border-blue-500 text-blue-600"
                                : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                            }`}
                          >
                            {pageNum}
                          </button>
                        )
                      })}

                      <button
                        onClick={() => fetchChamados(paginacao.currentPage + 1)}
                        disabled={paginacao.currentPage === paginacao.totalPages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  )
}

export default AdminChamadosPage
