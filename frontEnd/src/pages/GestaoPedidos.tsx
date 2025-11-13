"use client"

import type React from "react"
import { useState, useEffect } from "react"
import axios from "axios"
import Layout from "../components/Layout"
import { useNavigate } from "react-router-dom"
import {
  Package,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  Calendar,
  CreditCard,
  MapPin,
  AlertTriangle,
  RefreshCw,
  Search,
  Filter,
  X,
  User,
  Mail,
  Phone,
  ChevronDown,
  ChevronUp,
  DollarSign,
  FileText,
  Bell,
} from "lucide-react"
import { useAlert } from "../components/Alert-container"

interface ItemPedido {
  id_produto: number
  nome_produto: string
  quantidade: number
  preco_unitario: number
  subtotal: number
  imagem_principal?: string
}

interface SolicitacaoEstorno {
  id_solicitacao_estorno: number
  status: string
  motivo: string
  data_solicitacao: string
  data_resposta?: string
  motivo_recusa?: string
  nome_funcionario?: string
}

interface Pedido {
  id_pedido: number
  id_cliente: number
  nome_cliente: string
  email_cliente: string
  telefone_cliente?: string
  data_pedido: string
  status: string
  frete_nome?: string
  frete_valor?: number
  frete_prazo_dias?: number
  endereco_entrega?: string
  valor_total: number
  itens: ItemPedido[]
  solicitacao_estorno?: SolicitacaoEstorno | null
}

const GestaoPedidos: React.FC = () => {
  const navigate = useNavigate()
  const { showSucesso, showErro } = useAlert()

  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [pedidosOcultos, setPedidosOcultos] = useState<Set<number>>(new Set())

  // Filtros
  const [filtros, setFiltros] = useState({
    busca: "",
    status: "",
  })
  const [mostrarFiltros, setMostrarFiltros] = useState(false)

  // Modal de cancelamento/estorno

  const [modalEstornoAberto, setModalEstornoAberto] = useState(false)
  const [solicitacaoEstornoSelecionada, setSolicitacaoEstornoSelecionada] = useState<number | null>(null)
  const [acaoEstorno, setAcaoEstorno] = useState<"aprovar" | "recusar" | null>(null)
  const [motivoRecusa, setMotivoRecusa] = useState("")

  const formatarPreco = (preco: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(preco)
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

  const getStatusInfo = (status: string) => {
    const statusMap = {
      aguardando_pagamento: {
        label: "Aguardando Pagamento",
        color: "text-yellow-600 bg-yellow-50 border-yellow-200",
        icon: Clock,
      },
      pago: {
        label: "Pago",
        color: "text-green-600 bg-green-50 border-green-200",
        icon: CheckCircle,
      },
      processando: {
        label: "Processando",
        color: "text-blue-600 bg-blue-50 border-blue-200",
        icon: RefreshCw,
      },
      enviado: {
        label: "Enviado",
        color: "text-purple-600 bg-purple-50 border-purple-200",
        icon: Truck,
      },
      entregue: {
        label: "Entregue",
        color: "text-green-600 bg-green-50 border-green-200",
        icon: CheckCircle,
      },
      cancelado: {
        label: "Cancelado",
        color: "text-red-600 bg-red-50 border-red-200",
        icon: XCircle,
      },
      estornado: {
        label: "Estornado",
        color: "text-orange-600 bg-orange-50 border-orange-200",
        icon: RefreshCw,
      },
      falha_pagamento: {
        label: "Falha no Pagamento",
        color: "text-red-600 bg-red-50 border-red-200",
        icon: AlertTriangle,
      },
    }

    return (
      statusMap[status as keyof typeof statusMap] || {
        label: status,
        color: "text-gray-600 bg-gray-50 border-gray-200",
        icon: Package,
      }
    )
  }

  const buscarPedidos = async (usarFiltros = false) => {
    try {
      setCarregando(true)
      setErro(null)

      const token = localStorage.getItem("token")
      if (!token) {
        navigate("/login")
        return
      }

      let url = "http://localhost:3000/gestao/pedidos"

      if (usarFiltros) {
        const params = new URLSearchParams()
        if (filtros.busca) params.append("busca", filtros.busca)
        if (filtros.status) params.append("status", filtros.status)

        if (params.toString()) {
          url += `?${params.toString()}`
        }
      }

      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      setPedidos(response.data)
    } catch (error) {
      console.error("Erro ao buscar pedidos:", error)
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          localStorage.removeItem("token")
          navigate("/login")
        } else if (error.response?.status === 403) {
          setErro("Acesso negado. Apenas funcionários podem acessar esta página.")
        } else {
          setErro(error.response?.data?.message || "Erro ao carregar pedidos")
        }
      } else {
        setErro("Erro de conexão com o servidor")
      }
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    buscarPedidos()
  }, []) // Removed buscarPedidos from the dependency array

  const responderSolicitacaoEstorno = async (
    idSolicitacao: number,
    acao: "aprovar" | "recusar",
    motivoRecusa?: string,
  ) => {
    try {
      const token = localStorage.getItem("token")
      const endpoint = acao === "aprovar" ? "aprovar" : "recusar"
      const body = acao === "recusar" ? { motivo_recusa: motivoRecusa } : {}

      await axios.put(`http://localhost:3000/gestao/estornos/${idSolicitacao}/${endpoint}`, body, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      showSucesso(`Solicitação de estorno ${acao === "aprovar" ? "aprovada" : "recusada"} com sucesso!`)
      buscarPedidos() // Recarregar pedidos
      setModalEstornoAberto(false)
      setSolicitacaoEstornoSelecionada(null)
      setAcaoEstorno(null)
      setMotivoRecusa("")
    } catch (error) {
      console.error("Erro ao responder solicitação:", error)
      if (axios.isAxiosError(error)) {
        showErro(error.response?.data?.message || "Erro ao responder solicitação de estorno")
      } else {
        showErro("Erro ao responder solicitação de estorno")
      }
    }
  }

  const abrirModalEstorno = (idSolicitacao: number, acao: "aprovar" | "recusar") => {
    setSolicitacaoEstornoSelecionada(idSolicitacao)
    setAcaoEstorno(acao)
    setMotivoRecusa("")
    setModalEstornoAberto(true)
  }

  const confirmarAcaoEstorno = () => {
    if (!solicitacaoEstornoSelecionada || !acaoEstorno) {
      return
    }

    if (acaoEstorno === "recusar" && !motivoRecusa.trim()) {
      showErro("Por favor, informe o motivo da recusa")
      return
    }

    responderSolicitacaoEstorno(solicitacaoEstornoSelecionada, acaoEstorno, motivoRecusa)
  }

  const calcularEstatisticas = () => {
    const estornosPendentes = pedidos.filter(
      (p) => p.solicitacao_estorno && p.solicitacao_estorno.status === "pendente",
    ).length

    return {
      total: pedidos.length,
      aguardando: pedidos.filter((p) => p.status === "aguardando_pagamento").length,
      processando: pedidos.filter((p) => ["pago", "processando", "enviado"].includes(p.status)).length,
      concluidos: pedidos.filter((p) => p.status === "entregue").length,
      cancelados: pedidos.filter((p) => ["cancelado", "estornado", "falha_pagamento"].includes(p.status)).length,
      valorTotal: pedidos.reduce((acc, p) => acc + (Number(p.valor_total) || 0), 0),
      estornosPendentes,
    }
  }

  const stats = calcularEstatisticas()

  const handleBuscar = () => {
    buscarPedidos(true)
  }

  const limparFiltros = () => {
    setFiltros({ busca: "", status: "" })
    buscarPedidos()
  }

  return (
    <Layout>
      {carregando ? (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
          <div className="max-w-7xl mx-auto px-4 py-8">
            {/* Cabeçalho */}
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-slate-900 mb-2">Gestão de Pedidos</h1>
              <p className="text-slate-600">Gerencie todos os pedidos e atualize seus status</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
          <div className="max-w-7xl mx-auto px-4 py-8">
            {/* Cabeçalho */}
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-slate-900 mb-2">Gestão de Pedidos</h1>
              <p className="text-slate-600">Gerencie todos os pedidos e atualize seus status</p>
            </div>

            {/* Estatísticas */}
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
              <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow border border-white/20 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600 font-medium">Total de Pedidos</p>
                    <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
                  </div>
                  <Package className="h-8 w-8 text-blue-600" />
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow border border-white/20 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600 font-medium">Aguardando Pgto</p>
                    <p className="text-2xl font-bold text-yellow-600">{stats.aguardando}</p>
                  </div>
                  <Clock className="h-8 w-8 text-yellow-600" />
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow border border-white/20 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600 font-medium">Em Processamento</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.processando}</p>
                  </div>
                  <RefreshCw className="h-8 w-8 text-blue-600" />
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow border border-white/20 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600 font-medium">Concluídos</p>
                    <p className="text-2xl font-bold text-green-600">{stats.concluidos}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow border border-white/20 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600 font-medium">Estornos Pendentes</p>
                    <p className="text-2xl font-bold text-orange-600">{stats.estornosPendentes}</p>
                  </div>
                  <Bell className="h-8 w-8 text-orange-600" />
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow border border-white/20 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600 font-medium">Valor Total</p>
                    <p className="text-xl font-bold text-green-600">{formatarPreco(stats.valorTotal)}</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-600" />
                </div>
              </div>
            </div>

            {/* Filtros */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow border border-white/20 p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900 flex items-center">
                  <Filter size={20} className="mr-2" />
                  Filtros de Busca
                </h3>
                <button
                  onClick={() => setMostrarFiltros(!mostrarFiltros)}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  {mostrarFiltros ? "Ocultar" : "Mostrar"}
                </button>
              </div>

              {mostrarFiltros && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Buscar por ID, Nome ou Email
                      </label>
                      <input
                        type="text"
                        value={filtros.busca}
                        onChange={(e) => setFiltros({ ...filtros, busca: e.target.value })}
                        placeholder="Digite para buscar..."
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                      <select
                        value={filtros.status}
                        onChange={(e) => setFiltros({ ...filtros, status: e.target.value })}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Todos os status</option>
                        <option value="aguardando_pagamento">Aguardando Pagamento</option>
                        <option value="pago">Pago</option>
                        <option value="processando">Processando</option>
                        <option value="enviado">Enviado</option>
                        <option value="entregue">Entregue</option>
                        <option value="cancelado">Cancelado</option>
                        <option value="estornado">Estornado</option>
                        <option value="falha_pagamento">Falha no Pagamento</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex space-x-3">
                    <button
                      onClick={handleBuscar}
                      className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors shadow"
                    >
                      <Search size={18} className="mr-2" />
                      Buscar
                    </button>
                    <button
                      onClick={limparFiltros}
                      className="flex items-center bg-slate-600 hover:bg-slate-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                    >
                      <X size={18} className="mr-2" />
                      Limpar Filtros
                    </button>
                  </div>
                </>
              )}
            </div>

            {erro && (
              <div className="bg-red-50/80 backdrop-blur-sm border border-red-200 rounded-xl p-6 mb-6 flex items-center shadow">
                <AlertTriangle className="h-5 w-5 text-red-600 mr-3" />
                <p className="text-red-800 font-medium">{erro}</p>
              </div>
            )}

            {/* Lista de Pedidos */}
            {pedidos.length === 0 ? (
              <div className="text-center py-16">
                <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow border border-white/20 p-12 max-w-md mx-auto">
                  <Package className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-slate-900 mb-3">Nenhum pedido encontrado</h2>
                  <p className="text-slate-600">Não há pedidos com os filtros selecionados.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {pedidos.map((pedido) => {
                  const statusInfo = getStatusInfo(pedido.status)
                  const StatusIcon = statusInfo.icon

                  return (
                    <div
                      key={pedido.id_pedido}
                      className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 overflow-hidden"
                    >
                      {/* Cabeçalho do Pedido */}
                      <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-slate-50/50 to-blue-50/30">
                        <div className="flex items-center justify-between flex-wrap gap-4">
                          <div className="flex items-center space-x-4">
                            <div className="bg-gradient-to-br from-blue-100 to-indigo-100 p-3 rounded-xl">
                              <Package className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                              <div className="flex items-center space-x-3">
                                <span className="font-bold text-xl text-slate-900">Pedido #{pedido.id_pedido}</span>
                                <div
                                  className={`inline-flex items-center px-3 py-1 rounded-lg text-sm font-semibold shadow-sm border ${statusInfo.color}`}
                                >
                                  <StatusIcon size={14} className="mr-1" />
                                  {statusInfo.label}
                                </div>
                              </div>
                              <div className="flex items-center text-sm text-slate-500 mt-1">
                                <Calendar size={14} className="mr-1" />
                                {formatarData(pedido.data_pedido)}
                              </div>
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="text-sm text-slate-500 font-medium">Valor Total</div>
                            <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                              {formatarPreco(pedido.valor_total)}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Informações do Cliente */}
                      <div className="p-6 border-b border-slate-200 bg-slate-50/30">
                        <h4 className="font-semibold text-slate-900 mb-3 flex items-center">
                          <User size={18} className="mr-2" />
                          Informações do Cliente
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="flex items-center space-x-2">
                            <User size={16} className="text-slate-500" />
                            <div>
                              <div className="text-xs text-slate-500">Nome</div>
                              <div className="font-medium text-slate-900">{pedido.nome_cliente}</div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Mail size={16} className="text-slate-500" />
                            <div>
                              <div className="text-xs text-slate-500">Email</div>
                              <div className="font-medium text-slate-900">{pedido.email_cliente}</div>
                            </div>
                          </div>
                          {pedido.telefone_cliente && (
                            <div className="flex items-center space-x-2">
                              <Phone size={16} className="text-slate-500" />
                              <div>
                                <div className="text-xs text-slate-500">Telefone</div>
                                <div className="font-medium text-slate-900">{pedido.telefone_cliente}</div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Informações de Entrega */}
                      <div className="p-6 border-b border-slate-200">
                        <h4 className="font-semibold text-slate-900 mb-3 flex items-center">
                          <Truck size={18} className="mr-2" />
                          Informações de Entrega
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="flex items-center space-x-2">
                            <Truck size={16} className="text-slate-500" />
                            <div>
                              <div className="text-xs text-slate-500">Frete</div>
                              <div className="font-medium text-slate-900">{pedido.frete_nome || "Não informado"}</div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <CreditCard size={16} className="text-slate-500" />
                            <div>
                              <div className="text-xs text-slate-500">Valor do Frete</div>
                              <div className="font-medium text-slate-900">
                                {pedido.frete_valor ? formatarPreco(pedido.frete_valor) : "Grátis"}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <MapPin size={16} className="text-slate-500" />
                            <div>
                              <div className="text-xs text-slate-500">Endereço</div>
                              <div className="font-medium text-slate-900 text-sm">
                                {pedido.endereco_entrega || "Não informado"}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Itens do Pedido */}
                      <div className="p-6 border-b border-slate-200">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-semibold text-slate-900 flex items-center">
                            <FileText size={18} className="mr-2" />
                            Itens do Pedido ({pedido.itens.length})
                          </h4>
                          <button
                            onClick={() => {
                              const novosOcultos = new Set(pedidosOcultos)
                              if (pedidosOcultos.has(pedido.id_pedido)) {
                                novosOcultos.delete(pedido.id_pedido)
                              } else {
                                novosOcultos.add(pedido.id_pedido)
                              }
                              setPedidosOcultos(novosOcultos)
                            }}
                            className="flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            {pedidosOcultos.has(pedido.id_pedido) ? (
                              <>
                                <ChevronDown size={16} className="mr-1" />
                                Mostrar
                              </>
                            ) : (
                              <>
                                <ChevronUp size={16} className="mr-1" />
                                Ocultar
                              </>
                            )}
                          </button>
                        </div>

                        {!pedidosOcultos.has(pedido.id_pedido) && (
                          <div className="space-y-3">
                            {pedido.itens.map((item) => (
                              <div
                                key={item.id_produto}
                                className="flex items-center space-x-4 p-3 bg-slate-50 rounded-lg"
                              >
                                <div className="w-14 h-14 bg-white rounded-lg overflow-hidden flex-shrink-0 border border-slate-200">
                                  {item.imagem_principal ? (
                                    <img
                                      src={`http://localhost:3000/produtos${item.imagem_principal}`}
                                      alt={item.nome_produto}
                                      className="w-full h-full object-contain"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <Package className="h-6 w-6 text-slate-400" />
                                    </div>
                                  )}
                                </div>
                                <div className="flex-grow">
                                  <h5 className="font-semibold text-slate-900">{item.nome_produto}</h5>
                                  <p className="text-sm text-slate-600">
                                    {item.quantidade} × {formatarPreco(item.preco_unitario)}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-lg font-bold text-slate-900">{formatarPreco(item.subtotal)}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Solicitação de Estorno */}
                      {pedido.solicitacao_estorno && (
                        <div className="p-6 border-b border-slate-200 bg-orange-50/30">
                          <h4 className="font-semibold text-slate-900 mb-3 flex items-center">
                            <RefreshCw size={18} className="mr-2 text-orange-600" />
                            Solicitação de Estorno
                          </h4>
                          <div className="bg-white rounded-lg p-4 border border-orange-200">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                              <div>
                                <div className="text-xs text-slate-500">Status</div>
                                <div className="font-medium text-slate-900">
                                  {pedido.solicitacao_estorno.status === "pendente" && (
                                    <span className="text-yellow-600">⏳ Aguardando análise</span>
                                  )}
                                  {pedido.solicitacao_estorno.status === "aprovado" && (
                                    <span className="text-green-600">✅ Aprovado</span>
                                  )}
                                  {pedido.solicitacao_estorno.status === "recusado" && (
                                    <span className="text-red-600">❌ Recusado</span>
                                  )}
                                </div>
                              </div>
                              <div>
                                <div className="text-xs text-slate-500">Data da Solicitação</div>
                                <div className="font-medium text-slate-900">
                                  {formatarData(pedido.solicitacao_estorno.data_solicitacao)}
                                </div>
                              </div>
                            </div>
                            <div className="mb-3">
                              <div className="text-xs text-slate-500 mb-1">Motivo do Cliente</div>
                              <div className="text-sm text-slate-700 bg-slate-50 p-2 rounded">
                                {pedido.solicitacao_estorno.motivo}
                              </div>
                            </div>
                            {pedido.solicitacao_estorno.status === "recusado" &&
                              pedido.solicitacao_estorno.motivo_recusa && (
                                <div className="mb-3">
                                  <div className="text-xs text-slate-500 mb-1">Motivo da Recusa</div>
                                  <div className="text-sm text-red-700 bg-red-50 p-2 rounded">
                                    {pedido.solicitacao_estorno.motivo_recusa}
                                  </div>
                                </div>
                              )}

                            {pedido.solicitacao_estorno.status === "pendente" && (
                              <div className="flex space-x-3 mt-4">
                                <button
                                  onClick={() =>
                                    responderSolicitacaoEstorno(
                                      pedido.solicitacao_estorno!.id_solicitacao_estorno,
                                      "aprovar",
                                    )
                                  }
                                  className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow"
                                >
                                  <CheckCircle size={16} className="inline mr-2" />
                                  Aprovar Estorno
                                </button>
                                <button
                                  onClick={() =>
                                    abrirModalEstorno(pedido.solicitacao_estorno!.id_solicitacao_estorno, "recusar")
                                  }
                                  className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow"
                                >
                                  <XCircle size={16} className="inline mr-2" />
                                  Recusar Estorno
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {modalEstornoAberto && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-slate-900">
                {acaoEstorno === "aprovar" ? "Aprovar Estorno" : "Recusar Estorno"}
              </h3>
              <button
                onClick={() => {
                  setModalEstornoAberto(false)
                  setSolicitacaoEstornoSelecionada(null)
                  setAcaoEstorno(null)
                  setMotivoRecusa("")
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={24} />
              </button>
            </div>

            {acaoEstorno === "aprovar" ? (
              <div>
                <p className="text-slate-600 mb-6">
                  Tem certeza que deseja aprovar esta solicitação de estorno? O pedido será marcado como estornado e o
                  cliente será notificado.
                </p>
                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      setModalEstornoAberto(false)
                      setSolicitacaoEstornoSelecionada(null)
                      setAcaoEstorno(null)
                    }}
                    className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={confirmarAcaoEstorno}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow"
                  >
                    Confirmar Aprovação
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-slate-600 mb-4">Por favor, informe o motivo da recusa da solicitação de estorno:</p>
                <textarea
                  value={motivoRecusa}
                  onChange={(e) => setMotivoRecusa(e.target.value)}
                  placeholder="Digite o motivo da recusa..."
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 mb-4 min-h-[120px]"
                />
                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      setModalEstornoAberto(false)
                      setSolicitacaoEstornoSelecionada(null)
                      setAcaoEstorno(null)
                      setMotivoRecusa("")
                    }}
                    className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={confirmarAcaoEstorno}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow"
                  >
                    Confirmar Recusa
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </Layout>
  )
}

export default GestaoPedidos
