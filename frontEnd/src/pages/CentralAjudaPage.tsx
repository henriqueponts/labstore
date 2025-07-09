"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import Layout from "../components/Layout"
import {
  ArrowLeft,
  Search,
  Phone,
  Mail,
  ChevronDown,
  ChevronUp,
  Package,
  ChevronRight,
  Plus,
  X,
  AlertCircle,
  CheckCircle,
  Clock,
  MessageSquare,
  Shield,
  Users,
  Tag,
  Calendar,
  User,
  Send,
} from "lucide-react"

// Interfaces baseadas no banco de dados
interface Chamado {
  id_chamado: number
  assunto: string
  descricao: string
  categoria: string | null
  status:
    | "aberto"
    | "em_andamento"
    | "respondido"
    | "aguardando_cliente"
    | "aguardando_funcionario"
    | "resolvido"
    | "encerrado"
  data_abertura: string
  proximo_responder?: "cliente" | "funcionario"
  total_respostas?: number
  ultima_atividade?: string
}

interface FAQ {
  id: string
  question: string
  answer: string
  category: string
}

interface TicketCategory {
  id: string
  name: string
  description: string
}

interface UsuarioData {
  id_cliente?: number
  id_usuario?: number
  nome?: string
  email: string
  tipo: "cliente" | "funcionario"
  tipo_perfil?: "admin" | "analista"
}

// Categorias de chamado baseadas no seu sistema
const categoriasChamado: TicketCategory[] = [
  { id: "Problema com Pedido", name: "Problema com Pedido", description: "Questões relacionadas a pedidos realizados" },
  { id: "Problema Técnico", name: "Problema Técnico", description: "Dificuldades técnicas no site ou app" },
  { id: "Dúvida sobre Produto", name: "Dúvida sobre Produto", description: "Informações sobre produtos disponíveis" },
  { id: "Problema de Pagamento", name: "Problema de Pagamento", description: "Questões relacionadas a pagamentos" },
  { id: "Assistência Técnica", name: "Assistência Técnica", description: "Questões sobre serviços técnicos" },
  { id: "Outros", name: "Outros", description: "Outras questões não listadas acima" },
]

// FAQs que podem vir do banco futuramente
const faqsEstaticas: FAQ[] = [
  {
    id: "1",
    question: "Como acompanhar o status do meu pedido?",
    answer:
      'Você pode acompanhar seu pedido através da seção "Meus Pedidos" no seu perfil ou utilizando o código de rastreamento enviado por email.',
    category: "pedidos",
  },
  {
    id: "2",
    question: "Qual o prazo de entrega?",
    answer: "O prazo de entrega varia conforme sua localização e o tipo de produto. Geralmente entre 3 a 7 dias úteis.",
    category: "pedidos",
  },
  {
    id: "3",
    question: "Posso alterar meu pedido após a confirmação?",
    answer:
      'Alterações em pedidos já confirmados são possíveis apenas se o status ainda estiver como "Processando". Entre em contato com nosso suporte o mais rápido possível para verificar a possibilidade de alteração.',
    category: "pedidos",
  },
  {
    id: "4",
    question: "Como obter a nota fiscal do meu pedido?",
    answer:
      'A nota fiscal é enviada automaticamente por email após a confirmação do pedido. Você também pode baixá-la na seção "Meus Pedidos".',
    category: "pedidos",
  },
  {
    id: "5",
    question: "Como solicitar assistência técnica?",
    answer:
      "Acesse a seção 'Assistência Técnica' no menu principal, preencha o formulário com os dados do seu equipamento e aguarde o contato da nossa equipe.",
    category: "servicos",
  },
]

const CentralAjudaPage: React.FC = () => {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<"faq" | "contact">("faq")
  const [searchTerm, setSearchTerm] = useState("")
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null)
  const [showTicketForm, setShowTicketForm] = useState(false)
  const [showMyTickets, setShowMyTickets] = useState(false)
  const [chamados, setChamados] = useState<Chamado[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [usuario, setUsuario] = useState<UsuarioData | null>(null)

  // Adicionar após os estados existentes
  const [showChamadoDetalhes, setShowChamadoDetalhes] = useState(false)
  const [chamadoDetalhado, setChamadoDetalhado] = useState<any>(null)

  // Adicionar após os estados existentes
  const [respostaCliente, setRespostaCliente] = useState("")
  const [enviandoResposta, setEnviandoResposta] = useState(false)

  // Form states
  const [selectedCategory, setSelectedCategory] = useState("")
  const [subject, setSubject] = useState("")
  const [description, setDescription] = useState("")

  const filteredFAQs = faqsEstaticas.filter(
    (faq) =>
      faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // Verificar se usuário está logado e buscar dados do usuário
  const checkUser = async () => {
    const token = localStorage.getItem("token")
    if (!token) return

    try {
      const response = await axios.get("http://localhost:3000/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      })
      setUsuario(response.data)
    } catch (err) {
      console.error("Erro ao buscar dados do usuário:", err)
      localStorage.removeItem("token")
    }
  }

  useEffect(() => {
    checkUser()
  }, [])

  // Verificar se usuário está logado
  const isLoggedIn = () => {
    return !!localStorage.getItem("token")
  }

  // Verificar se é cliente
  const isCliente = () => {
    return usuario?.tipo === "cliente"
  }

  // Verificar se é funcionário
  const isFuncionario = () => {
    return usuario?.tipo === "funcionario"
  }

  // Buscar chamados do usuário (apenas para clientes)
  const fetchChamados = async () => {
    if (!isLoggedIn() || !isCliente()) return

    setLoading(true)
    setError(null)
    try {
      const token = localStorage.getItem("token")
      const response = await axios.get("http://localhost:3000/chamados/meus-chamados", {
        headers: { Authorization: `Bearer ${token}` },
      })
      setChamados(response.data)
    } catch (err: any) {
      console.error("Erro ao buscar chamados:", err)
      if (err.response?.status === 401) {
        setError("Sessão expirada. Faça login novamente.")
        localStorage.removeItem("token")
      } else if (err.response?.status === 403) {
        setError("Acesso negado. Apenas clientes podem visualizar chamados próprios.")
      } else {
        setError("Erro ao carregar chamados")
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (showMyTickets) {
      fetchChamados()
    }
  }, [showMyTickets, usuario])

  // Criar novo chamado (apenas para clientes)
  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isLoggedIn()) {
      setError("Você precisa estar logado para abrir um chamado")
      return
    }

    if (!isCliente()) {
      setError("Apenas clientes podem abrir chamados")
      return
    }

    if (!subject.trim() || !description.trim()) {
      setError("Assunto e descrição são obrigatórios")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const token = localStorage.getItem("token")
      const response = await axios.post(
        "http://localhost:3000/chamados/criar",
        {
          assunto: subject.trim(),
          descricao: description.trim(),
          categoria: selectedCategory || null,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      )

      setSuccess(`Chamado criado com sucesso! Protocolo: ${response.data.protocolo}`)

      // Reset form
      setSelectedCategory("")
      setSubject("")
      setDescription("")
      setShowTicketForm(false)

      // Refresh chamados se estiver na tela de chamados
      if (showMyTickets) {
        fetchChamados()
      }
    } catch (err: any) {
      console.error("Erro ao criar chamado:", err)
      if (err.response?.status === 401) {
        setError("Sessão expirada. Faça login novamente.")
        localStorage.removeItem("token")
      } else if (err.response?.status === 403) {
        setError("Acesso negado. Apenas clientes podem abrir chamados.")
      } else {
        setError(err.response?.data?.message || "Erro ao criar chamado")
      }
    } finally {
      setLoading(false)
    }
  }

  // Encerrar chamado (apenas para clientes)
  const closeTicket = async (chamadoId: number) => {
    if (!confirm("Tem certeza que deseja encerrar este chamado?")) return

    setLoading(true)
    setError(null)
    try {
      const token = localStorage.getItem("token")
      await axios.put(
        `http://localhost:3000/chamados/${chamadoId}/encerrar`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      )

      setSuccess("Chamado encerrado com sucesso!")
      fetchChamados() // Refresh lista
    } catch (err: any) {
      console.error("Erro ao encerrar chamado:", err)
      if (err.response?.status === 401) {
        setError("Sessão expirada. Faça login novamente.")
        localStorage.removeItem("token")
      } else {
        setError(err.response?.data?.message || "Erro ao encerrar chamado")
      }
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "aberto":
        return "text-blue-600 bg-blue-100"
      case "em_andamento":
        return "text-yellow-600 bg-yellow-100"
      case "respondido":
        return "text-purple-600 bg-purple-100"
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
      case "em_andamento":
        return "Em Andamento"
      case "respondido":
        return "Respondido"
      case "aguardando_cliente":
        return "Aguardando Sua Resposta"
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "aberto":
        return <AlertCircle className="w-4 h-4" />
      case "em_andamento":
        return <Clock className="w-4 h-4" />
      case "respondido":
        return <MessageSquare className="w-4 h-4" />
      case "aguardando_cliente":
        return <User className="w-4 h-4" />
      case "aguardando_funcionario":
        return <Clock className="w-4 h-4" />
      case "resolvido":
        return <CheckCircle className="w-4 h-4" />
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

  // Buscar detalhes de um chamado específico
  const fetchChamadoDetalhes = async (chamadoId: number) => {
    setLoading(true)
    setError(null)
    try {
      const token = localStorage.getItem("token")
      const response = await axios.get(`http://localhost:3000/chamados/meu-chamado/${chamadoId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setChamadoDetalhado(response.data)
      setShowChamadoDetalhes(true)
    } catch (err: any) {
      console.error("Erro ao buscar detalhes do chamado:", err)
      setError("Erro ao carregar detalhes do chamado")
    } finally {
      setLoading(false)
    }
  }

  // Função para cliente responder chamado
  const handleClienteResponder = async () => {
    if (!chamadoDetalhado || !respostaCliente.trim()) return

    setEnviandoResposta(true)
    setError(null)
    try {
      const token = localStorage.getItem("token")
      await axios.post(
        `http://localhost:3000/chamados/${chamadoDetalhado.id_chamado}/responder-cliente`,
        { resposta: respostaCliente.trim() },
        { headers: { Authorization: `Bearer ${token}` } },
      )

      setSuccess("Resposta enviada com sucesso!")
      setRespostaCliente("")

      // Atualizar detalhes do chamado
      await fetchChamadoDetalhes(chamadoDetalhado.id_chamado)
    } catch (err: any) {
      console.error("Erro ao responder chamado:", err)
      setError(err.response?.data?.message || "Erro ao enviar resposta")
    } finally {
      setEnviandoResposta(false)
    }
  }

  // Tela de Detalhes do Chamado
  if (showChamadoDetalhes && chamadoDetalhado) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center mb-8">
            <button
              onClick={() => {
                setShowChamadoDetalhes(false)
                setChamadoDetalhado(null)
              }}
              className="flex items-center text-gray-600 hover:text-gray-800 mr-4"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Voltar
            </button>
            <h1 className="text-2xl font-bold text-gray-900">
              Detalhes do Chamado LAB{chamadoDetalhado.id_chamado.toString().padStart(6, "0")}
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
                <h2 className="text-lg font-semibold text-gray-900">Informações do Chamado</h2>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium flex items-center ${getStatusColor(chamadoDetalhado.status)}`}
                >
                  {getStatusIcon(chamadoDetalhado.status)}
                  <span className="ml-1">{getStatusText(chamadoDetalhado.status)}</span>
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Assunto</label>
                  <p className="text-gray-900">{chamadoDetalhado.assunto}</p>
                </div>

                {chamadoDetalhado.categoria && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      <Tag className="w-3 h-3 mr-1" />
                      {chamadoDetalhado.categoria}
                    </span>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data de Abertura</label>
                  <div className="flex items-center text-gray-900">
                    <Calendar className="w-4 h-4 mr-2" />
                    {formatDate(chamadoDetalhado.data_abertura)}
                  </div>
                </div>

                {chamadoDetalhado.funcionario_nome && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Atendido por</label>
                    <div className="flex items-center text-gray-900">
                      <User className="w-4 h-4 mr-2" />
                      {chamadoDetalhado.funcionario_nome}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                <div className="bg-gray-50 rounded-md p-3">
                  <p className="text-gray-900 whitespace-pre-wrap">{chamadoDetalhado.descricao}</p>
                </div>
              </div>
            </div>

            {/* Histórico de Respostas */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Histórico de Atendimento</h3>

              {chamadoDetalhado.respostas && chamadoDetalhado.respostas.length > 0 ? (
                <div className="space-y-4">
                  {chamadoDetalhado.respostas.map((resposta: any, index: number) => (
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
                            {resposta.tipo_usuario === "cliente" ? "Você" : `${resposta.nome_usuario} (Suporte)`}
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
                  {chamadoDetalhado.status === "aberto" && (
                    <p className="text-sm text-gray-400 mt-2">Nossa equipe analisará seu chamado em breve.</p>
                  )}
                </div>
              )}
            </div>

            {/* Área de Resposta do Cliente */}
            {chamadoDetalhado.proximo_responder === "cliente" && chamadoDetalhado.status !== "encerrado" && (
              <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Sua Resposta</h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Responder ao Suporte</label>
                    <textarea
                      value={respostaCliente}
                      onChange={(e) => setRespostaCliente(e.target.value)}
                      rows={4}
                      maxLength={1000}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Digite sua resposta ou forneça informações adicionais..."
                    />
                    <p className="text-xs text-gray-500 mt-1">{respostaCliente.length}/1000 caracteres</p>
                  </div>

                  <button
                    onClick={handleClienteResponder}
                    disabled={enviandoResposta || !respostaCliente.trim()}
                    className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    {enviandoResposta ? "Enviando..." : "Enviar Resposta"}
                  </button>
                </div>
              </div>
            )}

            {/* Mensagem quando aguardando funcionário */}
            {chamadoDetalhado.proximo_responder === "funcionario" &&
              chamadoDetalhado.status === "aguardando_funcionario" && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <Clock className="w-5 h-5 text-blue-600 mr-3" />
                    <div>
                      <h4 className="text-sm font-medium text-blue-900">Aguardando resposta do suporte</h4>
                      <p className="text-sm text-blue-700 mt-1">
                        Sua mensagem foi enviada. Nossa equipe responderá em breve.
                      </p>
                    </div>
                  </div>
                </div>
              )}

            {/* Ações */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Ações</h3>
              <div className="flex space-x-4">
                {chamadoDetalhado.status !== "encerrado" && (
                  <button
                    onClick={() => {
                      closeTicket(chamadoDetalhado.id_chamado)
                      setShowChamadoDetalhes(false)
                      setChamadoDetalhado(null)
                    }}
                    disabled={loading}
                    className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    {loading ? "Encerrando..." : "Encerrar Chamado"}
                  </button>
                )}
                <button
                  onClick={() => {
                    setShowChamadoDetalhes(false)
                    setChamadoDetalhado(null)
                  }}
                  className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Voltar para Lista
                </button>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  // Tela de Meus Chamados
  if (showMyTickets) {
    // Verificar se é funcionário
    if (isFuncionario()) {
      return (
        <Layout>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center mb-8">
              <button
                onClick={() => setShowMyTickets(false)}
                className="flex items-center text-gray-600 hover:text-gray-800 mr-4"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Voltar
              </button>
              <h1 className="text-2xl font-bold text-gray-900">Meus Chamados</h1>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center shadow-sm">
              <Shield className="w-16 h-16 text-blue-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Acesso Restrito</h2>
              <p className="text-gray-600 mb-6">
                Como {usuario?.tipo_perfil === "admin" ? "administrador" : "analista"}, você não pode visualizar
                chamados próprios.
              </p>
              <p className="text-sm text-gray-500 mb-6">
                Para gerenciar todos os chamados do sistema, acesse a área administrativa.
              </p>
              <button
                onClick={() => navigate("/admin/chamados")}
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors mr-4"
              >
                <Users className="w-4 h-4 inline mr-2" />
                Gerenciar Todos os Chamados
              </button>
              <button
                onClick={() => setShowMyTickets(false)}
                className="bg-gray-200 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-300 transition-colors"
              >
                Voltar
              </button>
            </div>
          </div>
        </Layout>
      )
    }

    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center mb-8">
            <button
              onClick={() => setShowMyTickets(false)}
              className="flex items-center text-gray-600 hover:text-gray-800 mr-4"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Voltar
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Meus Chamados</h1>
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

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Carregando chamados...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {chamados.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                  <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum chamado encontrado</h3>
                  <p className="text-gray-500 mb-6">Você ainda não abriu nenhum chamado de suporte.</p>
                  <button
                    onClick={() => {
                      setShowMyTickets(false)
                      setShowTicketForm(true)
                    }}
                    className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Abrir Primeiro Chamado
                  </button>
                </div>
              ) : (
                chamados.map((chamado) => (
                  <div key={chamado.id_chamado} className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          Protocolo: LAB{chamado.id_chamado.toString().padStart(6, "0")}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">{chamado.assunto}</p>
                      </div>
                      <div className="flex items-center">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium flex items-center ${getStatusColor(chamado.status)}`}
                        >
                          {getStatusIcon(chamado.status)}
                          <span className="ml-1">{getStatusText(chamado.status)}</span>
                        </span>
                      </div>
                    </div>

                    <div className="mb-4">
                      {chamado.categoria && (
                        <p className="text-sm text-gray-600 mb-2">
                          <strong>Categoria:</strong> {chamado.categoria}
                        </p>
                      )}
                      <p className="text-sm text-gray-600 mb-2">
                        <strong>Descrição:</strong> {chamado.descricao}
                      </p>
                      <p className="text-sm text-gray-500">Criado em: {formatDate(chamado.data_abertura)}</p>
                    </div>

                    {chamado.proximo_responder === "cliente" && chamado.status === "aguardando_cliente" && (
                      <div className="mt-2">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          Resposta necessária
                        </span>
                      </div>
                    )}

                    {chamado.status !== "encerrado" && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => fetchChamadoDetalhes(chamado.id_chamado)}
                          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                        >
                          Ver Detalhes
                        </button>
                        <button
                          onClick={() => closeTicket(chamado.id_chamado)}
                          disabled={loading}
                          className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
                        >
                          {loading ? "Encerrando..." : "Encerrar Chamado"}
                        </button>
                      </div>
                    )}

                    {chamado.status === "encerrado" && (
                      <button
                        onClick={() => fetchChamadoDetalhes(chamado.id_chamado)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                      >
                        Ver Detalhes
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </Layout>
    )
  }

  // Tela de Formulário de Chamado
  if (showTicketForm) {
    if (!isLoggedIn()) {
      return (
        <Layout>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center mb-8">
              <button
                onClick={() => setShowTicketForm(false)}
                className="flex items-center text-gray-600 hover:text-gray-800 mr-4"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Voltar
              </button>
              <h1 className="text-2xl font-bold text-gray-900">Abrir Chamado</h1>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center shadow-sm">
              <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Login Necessário</h2>
              <p className="text-gray-600 mb-6">Você precisa estar logado para abrir um chamado de suporte.</p>
              <button
                onClick={() => navigate("/login")}
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Fazer Login
              </button>
            </div>
          </div>
        </Layout>
      )
    }

    // Verificar se é funcionário
    if (isFuncionario()) {
      return (
        <Layout>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center mb-8">
              <button
                onClick={() => setShowTicketForm(false)}
                className="flex items-center text-gray-600 hover:text-gray-800 mr-4"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Voltar
              </button>
              <h1 className="text-2xl font-bold text-gray-900">Abrir Chamado</h1>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center shadow-sm">
              <Shield className="w-16 h-16 text-blue-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Acesso Restrito</h2>
              <p className="text-gray-600 mb-4">
                Como {usuario?.tipo_perfil === "admin" ? "administrador" : "analista"}, você não pode abrir chamados.
              </p>
              <p className="text-sm text-gray-500 mb-6">
                Funcionários não podem abrir chamados de suporte. Esta funcionalidade é exclusiva para clientes.
              </p>
              <button
                onClick={() => navigate("/admin/chamados")}
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors mr-4"
              >
                <Users className="w-4 h-4 inline mr-2" />
                Gerenciar Chamados
              </button>
              <button
                onClick={() => setShowTicketForm(false)}
                className="bg-gray-200 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-300 transition-colors"
              >
                Voltar
              </button>
            </div>
          </div>
        </Layout>
      )
    }

    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center mb-8">
            <button
              onClick={() => setShowTicketForm(false)}
              className="flex items-center text-gray-600 hover:text-gray-800 mr-4"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Voltar
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Abrir Chamado</h1>
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

          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <form onSubmit={handleSubmitTicket} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Categoria do Problema</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Selecione uma categoria (opcional)</option>
                  {categoriasChamado.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Selecionar uma categoria ajuda nossa equipe a direcionar melhor seu chamado
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Assunto *</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                  maxLength={100}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Descreva brevemente o problema"
                />
                <p className="text-xs text-gray-500 mt-1">{subject.length}/100 caracteres</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Descrição do Problema *</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  rows={5}
                  maxLength={1000}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Descreva detalhadamente o problema que você está enfrentando. Inclua informações como quando o problema começou, o que você estava fazendo, mensagens de erro, etc."
                />
                <p className="text-xs text-gray-500 mt-1">{description.length}/1000 caracteres</p>
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setShowTicketForm(false)}
                  className="px-6 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading || !subject.trim() || !description.trim()}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Enviando..." : "Enviar Chamado"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </Layout>
    )
  }

  // Tela Principal da Central de Ajuda
  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center mb-8">
          <button onClick={() => navigate("/")} className="flex items-center text-gray-600 hover:text-gray-800 mr-4">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Voltar
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Central de Ajuda</h1>
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Como podemos ajudar?</h2>
              <p className="text-gray-600 mb-4">Pesquise por dúvidas frequentes ou entre em contato conosco</p>

              <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Digite sua dúvida..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="flex space-x-1 mb-6 border-b border-gray-200">
                <button
                  onClick={() => setActiveTab("faq")}
                  className={`px-4 py-2 rounded-t-md transition-colors ${
                    activeTab === "faq"
                      ? "bg-blue-50 text-blue-700 border-b-2 border-blue-700"
                      : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                  }`}
                >
                  Perguntas Frequentes
                </button>
                <button
                  onClick={() => setActiveTab("contact")}
                  className={`px-4 py-2 rounded-t-md transition-colors ${
                    activeTab === "contact"
                      ? "bg-blue-50 text-blue-700 border-b-2 border-blue-700"
                      : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                  }`}
                >
                  Fale Conosco
                </button>
              </div>

              {activeTab === "faq" && (
                <div>
                  <div className="flex items-center mb-4">
                    <Package className="w-5 h-5 text-gray-600 mr-2" />
                    <h3 className="text-lg font-semibold text-gray-900">Perguntas Frequentes</h3>
                  </div>

                  <div className="space-y-2">
                    {filteredFAQs.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-gray-500">Nenhuma pergunta encontrada para "{searchTerm}"</p>
                      </div>
                    ) : (
                      filteredFAQs.map((faq) => (
                        <div key={faq.id} className="border border-gray-200 rounded-md">
                          <button
                            onClick={() => setExpandedFAQ(expandedFAQ === faq.id ? null : faq.id)}
                            className="w-full px-4 py-3 text-left flex justify-between items-center hover:bg-gray-50 transition-colors"
                          >
                            <span className="text-gray-900 font-medium">{faq.question}</span>
                            {expandedFAQ === faq.id ? (
                              <ChevronUp className="w-5 h-5 text-gray-500 flex-shrink-0" />
                            ) : (
                              <ChevronDown className="w-5 h-5 text-gray-500 flex-shrink-0" />
                            )}
                          </button>
                          {expandedFAQ === faq.id && (
                            <div className="px-4 pb-3 text-gray-600 border-t border-gray-200 bg-gray-50">
                              <p className="pt-3">{faq.answer}</p>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {activeTab === "contact" && (
                <div className="space-y-6">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Não encontrou o que procurava?</h3>
                    <p className="text-gray-600 mb-6">
                      {isCliente()
                        ? "Abra um chamado e nossa equipe entrará em contato com você"
                        : isFuncionario()
                          ? "Como funcionário, você pode gerenciar chamados na área administrativa"
                          : "Faça login como cliente para abrir um chamado de suporte"}
                    </p>

                    {isCliente() && (
                      <button
                        onClick={() => setShowTicketForm(true)}
                        className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors flex items-center mx-auto"
                      >
                        <Plus className="w-5 h-5 mr-2" />
                        Abrir Chamado
                      </button>
                    )}

                    {isFuncionario() && (
                      <button
                        onClick={() => navigate("/admin/chamados")}
                        className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors flex items-center mx-auto"
                      >
                        <Users className="w-5 h-5 mr-2" />
                        Gerenciar Chamados
                      </button>
                    )}

                    {!isLoggedIn() && (
                      <button
                        onClick={() => navigate("/login")}
                        className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors flex items-center mx-auto"
                      >
                        Fazer Login
                      </button>
                    )}
                  </div>

                  {isLoggedIn() && isCliente() && (
                    <div className="border-t border-gray-200 pt-6">
                      <button
                        onClick={() => setShowMyTickets(true)}
                        className="w-full text-left p-4 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <h4 className="font-medium text-gray-900">Meus Chamados</h4>
                            <p className="text-sm text-gray-600">Acompanhe o status dos seus chamados abertos</p>
                          </div>
                          <ChevronRight className="w-5 h-5 text-gray-400" />
                        </div>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Channels */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Canais de Atendimento</h3>

              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Phone className="w-5 h-5 text-gray-600 mt-1" />
                  <div>
                    <h4 className="font-medium text-gray-900">Telefone</h4>
                    <p className="text-sm text-gray-600">(11) 9999-9999</p>
                    <p className="text-xs text-gray-500">Segunda a Sexta, das 9h às 18h</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Mail className="w-5 h-5 text-gray-600 mt-1" />
                  <div>
                    <h4 className="font-medium text-gray-900">E-mail</h4>
                    <p className="text-sm text-gray-600">atendimento@labstore.com.br</p>
                    <p className="text-xs text-gray-500">Resposta em até 24h úteis</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Links Rápidos</h3>

              <div className="space-y-2">
                <button
                  onClick={() => navigate("/pedidos")}
                  className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-md transition-colors w-full text-left"
                >
                  <div className="flex items-center">
                    <Package className="w-5 h-5 text-gray-600 mr-3" />
                    <span className="text-gray-900">Meus Pedidos</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>

                <button
                  onClick={() => navigate("/servicos")}
                  className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-md transition-colors w-full text-left"
                >
                  <div className="flex items-center">
                    <Package className="w-5 h-5 text-gray-600 mr-3" />
                    <span className="text-gray-900">Meus Serviços</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default CentralAjudaPage
