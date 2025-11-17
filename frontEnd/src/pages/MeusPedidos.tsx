"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Layout from "../components/Layout"
import { useNavigate } from "react-router-dom"
import { Package, Clock, CheckCircle, XCircle, Truck, ArrowLeft, Calendar, CreditCard, MapPin, AlertTriangle, RefreshCw, ShoppingBag, ChevronDown, ChevronUp } from 'lucide-react'
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
}

interface Pedido {
  id_pedido: number
  data_pedido: string
  status: string
  frete_nome?: string
  frete_valor?: number
  frete_prazo_dias?: number
  endereco_entrega?: string
  codigo_rastreio?: string
  motivo_cancelamento?: string
  motivo_estorno?: string
  valor_total: number
  itens: ItemPedido[]
  solicitacao_estorno?: SolicitacaoEstorno
}

const MeusPedidos: React.FC = () => {
  const navigate = useNavigate()
  const { showSucesso, showErro } = useAlert()

  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [pedidosOcultos, setPedidosOcultos] = useState<Set<number>>(new Set())

  const [modalEstornoAberto, setModalEstornoAberto] = useState(false)
  const [pedidoEstornoSelecionado, setPedidoEstornoSelecionado] = useState<number | null>(null)
  const [motivoEstorno, setMotivoEstorno] = useState("")

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
      falha_pagamento: {
        label: "Falha no Pagamento",
        color: "text-red-600 bg-red-50 border-red-200",
        icon: AlertTriangle,
      },
      concluido: {
        label: "Concluído",
        color: "text-green-600 bg-green-50 border-green-200",
        icon: CheckCircle,
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

  const buscarPedidos = async () => {
    try {
      setCarregando(true)
      setErro(null)

      const token = localStorage.getItem("token")
      if (!token) {
        navigate("/login")
        return
      }

      const response = await fetch("http://localhost:3000/pedido/meus-pedidos", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const data = await response.json()
        setPedidos(data)
      } else if (response.status === 401) {
        localStorage.removeItem("token")
        navigate("/login")
      } else {
        let errorMessage = "Erro ao carregar pedidos"
        const responseText = await response.text()

        try {
          const errorData = JSON.parse(responseText)
          errorMessage = errorData.message || errorMessage
        } catch {
          if (response.status === 404) {
            errorMessage = "Rota não encontrada. Verifique se o servidor está configurado corretamente."
          } else {
            errorMessage = `Erro ${response.status}: ${response.statusText}`
          }
        }
        setErro(errorMessage)
      }
    } catch (error) {
      console.error("Erro ao buscar pedidos:", error)
      if (error instanceof Error) {
        if (error instanceof TypeError && error.message.includes("fetch")) {
          setErro("Erro de conexão. Verifique se o servidor está rodando na porta 3000.")
        } else {
          setErro(`Erro de conexão: ${error.message}`)
        }
      } else {
        setErro("Erro de conexão inesperado")
      }
    } finally {
      setCarregando(false)
    }
  }

  const solicitarEstorno = async (idPedido: number, motivo: string) => {
    try {
      const token = localStorage.getItem("token")

      const response = await fetch(`http://localhost:3000/pedido/${idPedido}/solicitar-estorno`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ motivo }),
      })

      if (response.ok) {
        showSucesso("Solicitação de estorno enviada com sucesso!")
        buscarPedidos()
        setModalEstornoAberto(false)
        setPedidoEstornoSelecionado(null)
        setMotivoEstorno("")
      } else {
        const errorData = await response.json()
        showErro(errorData.message || "Erro ao solicitar estorno")
      }
    } catch (error) {
      console.error("Erro ao solicitar estorno:", error)
      showErro("Erro ao solicitar estorno")
    }
  }

  const abrirModalEstorno = (idPedido: number) => {
    setPedidoEstornoSelecionado(idPedido)
    setMotivoEstorno("")
    setModalEstornoAberto(true)
  }

  const confirmarEstorno = () => {
    if (!pedidoEstornoSelecionado || !motivoEstorno.trim()) {
      showErro("Por favor, informe o motivo do estorno")
      return
    }

    solicitarEstorno(pedidoEstornoSelecionado, motivoEstorno)
  }

  useEffect(() => {
    buscarPedidos()
  }, [])

  if (carregando) {
    return (
      <Layout showLoading={true}>
        <div />
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => navigate("/")}
                className="flex items-center text-slate-600 hover:text-slate-900 transition-colors duration-200 bg-white/50 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/20 hover:bg-white/70"
              >
                <ArrowLeft size={20} className="mr-2" />
                Voltar
              </button>
              <div></div>
            </div>

            <div className="text-center mb-8">
              <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent">
                Meus Pedidos
              </h1>
            </div>
          </div>

          {erro && (
            <div className="bg-red-50/80 backdrop-blur-sm border border-red-200 rounded-2xl p-6 mb-6 flex items-center shadow-lg">
              <div className="bg-red-100 p-2 rounded-xl mr-4">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-red-800 font-medium">{erro}</p>
                <button
                  onClick={buscarPedidos}
                  className="text-red-600 hover:text-red-800 text-sm font-medium mt-2 flex items-center bg-red-100 hover:bg-red-200 px-3 py-1 rounded-lg transition-all duration-200"
                >
                  <RefreshCw size={14} className="mr-1" />
                  Tentar novamente
                </button>
              </div>
            </div>
          )}

          {pedidos.length === 0 ? (
            <div className="text-center py-16">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-12 max-w-md mx-auto">
                <div className="bg-gradient-to-br from-blue-100 to-indigo-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                  <ShoppingBag className="h-12 w-12 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-3">Nenhum pedido encontrado</h2>
                <p className="text-slate-600 mb-8 leading-relaxed">
                  Você ainda não fez nenhuma compra. Que tal explorar nossos produtos?
                </p>
                <button
                  onClick={() => navigate("/produtos")}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-4 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center mx-auto"
                >
                  <Package size={20} className="mr-2" />
                  Explorar Produtos
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              {pedidos.map((pedido) => {
                const statusInfo = getStatusInfo(pedido.status)
                const StatusIcon = statusInfo.icon
                const podeEstornar = ["pago", "entregue"].includes(pedido.status) && !pedido.solicitacao_estorno

                return (
                  <div
                    key={pedido.id_pedido}
                    className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden"
                  >
                    <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-slate-50/50 to-blue-50/30">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-3">
                            <div className="bg-gradient-to-br from-blue-100 to-indigo-100 p-2 rounded-xl">
                              <Package className="h-5 w-5 text-blue-600" />
                            </div>
                            <span className="font-bold text-xl text-slate-900">Pedido #{pedido.id_pedido}</span>
                          </div>
                          <div className="flex items-center text-sm text-slate-500 bg-white/50 px-3 py-1 rounded-lg">
                            <Calendar size={14} className="mr-2" />
                            {formatarData(pedido.data_pedido)}
                          </div>
                        </div>

                        <div className="flex items-center space-x-4">
                          <div
                            className={`inline-flex items-center px-4 py-2 rounded-xl text-sm font-semibold shadow-sm ${statusInfo.color}`}
                          >
                            <StatusIcon size={16} className="mr-2" />
                            {statusInfo.label}
                          </div>
                        </div>
                      </div>

                      <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-slate-25/50 to-blue-25/30">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="flex items-center space-x-3">
                            <div className="bg-gradient-to-br from-green-100 to-emerald-100 p-2 rounded-xl">
                              <Truck className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                              <div className="text-sm text-slate-500 font-medium">Entrega</div>
                              <div className="font-semibold text-slate-900">{pedido.frete_nome || "Não informado"}</div>
                            </div>
                          </div>

                          <div className="flex items-center space-x-3">
                            <div className="bg-gradient-to-br from-blue-100 to-cyan-100 p-2 rounded-xl">
                              <CreditCard className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <div className="text-sm text-slate-500 font-medium">Frete</div>
                              <div className="font-semibold text-slate-900">
                                {pedido.frete_valor ? formatarPreco(pedido.frete_valor) : "Grátis"}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center space-x-3">
                            <div className="bg-gradient-to-br from-purple-100 to-pink-100 p-2 rounded-xl">
                              <MapPin className="h-5 w-5 text-purple-600" />
                            </div>
                            <div>
                              <div className="text-sm text-slate-500 font-medium">Endereço</div>
                              <div className="font-semibold text-slate-900 text-sm">
                                {pedido.endereco_entrega || "Não informado"}
                              </div>
                            </div>
                          </div>
                        </div>

                        {pedido.codigo_rastreio && (pedido.status === "enviado" || pedido.status === "entregue") && (
                          <div className="mt-4 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 border-2 border-purple-200 rounded-xl">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <div className="bg-gradient-to-br from-purple-100 to-indigo-100 p-2 rounded-lg">
                                  <Truck className="h-5 w-5 text-purple-600" />
                                </div>
                                <div>
                                  <div className="text-sm text-purple-600 font-semibold">Código de Rastreio</div>
                                  <div className="font-bold text-purple-900 text-lg">{pedido.codigo_rastreio}</div>
                                </div>
                              </div>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(pedido.codigo_rastreio || "")
                                  showSucesso("Código copiado!")
                                }}
                                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                              >
                                Copiar
                              </button>
                            </div>
                            <p className="text-xs text-purple-600 mt-2">
                              Use este código para rastrear seu pedido no site da transportadora
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="p-6">
                        <div className="flex items-center justify-between mb-6">
                          <h4 className="font-bold text-slate-900 text-lg">Itens ({pedido.itens.length})</h4>
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
                            className="flex items-center text-blue-600 hover:text-blue-800 text-sm font-semibold bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-xl transition-all duration-200"
                          >
                            {pedidosOcultos.has(pedido.id_pedido) ? (
                              <>
                                <ChevronDown size={16} className="mr-2" />
                                Mostrar itens
                              </>
                            ) : (
                              <>
                                <ChevronUp size={16} className="mr-2" />
                                Ocultar itens
                              </>
                            )}
                          </button>
                        </div>

                        {!pedidosOcultos.has(pedido.id_pedido) && (
                          <div className="space-y-4 mb-6">
                            {pedido.itens.map((item) => (
                              <div
                                key={item.id_produto}
                                className="flex items-center space-x-4 p-4 bg-gradient-to-r from-slate-50/50 to-blue-50/30 rounded-xl border border-white/20"
                              >
                                <div className="w-16 h-16 bg-white rounded-xl overflow-hidden flex-shrink-0 border border-slate-200 shadow-sm">
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
                                  <h5 className="font-bold text-slate-900 mb-1">{item.nome_produto}</h5>
                                  <p className="text-sm text-slate-600 font-medium">
                                    Quantidade: {item.quantidade} × {formatarPreco(item.preco_unitario)}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                    {formatarPreco(item.subtotal)}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {(pedido.motivo_cancelamento || pedido.motivo_estorno) && (
                          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                            <h5 className="font-semibold text-red-900 mb-2 flex items-center">
                              <AlertTriangle size={16} className="mr-2" />
                              Motivo {pedido.status === "cancelado" ? "do Cancelamento" : "do Estorno"}
                            </h5>
                            <p className="text-sm text-red-700">
                              {pedido.motivo_cancelamento || pedido.motivo_estorno}
                            </p>
                          </div>
                        )}

                        {pedido.solicitacao_estorno && (
                          <div className="mt-6 p-4 bg-orange-50 border border-orange-200 rounded-xl">
                            <h5 className="font-semibold text-orange-900 mb-3 flex items-center">
                              <RefreshCw size={16} className="mr-2" />
                              Solicitação de Estorno
                            </h5>
                            <div className="space-y-2 text-sm">
                              <div>
                                <span className="text-orange-600 font-medium">Status: </span>
                                <span className="text-orange-900">
                                  {pedido.solicitacao_estorno.status === "pendente" && "⏳ Aguardando análise"}
                                  {pedido.solicitacao_estorno.status === "aprovado" && "✅ Aprovado"}
                                  {pedido.solicitacao_estorno.status === "recusado" && "❌ Recusado"}
                                </span>
                              </div>
                              <div>
                                <span className="text-orange-600 font-medium">Seu motivo: </span>
                                <span className="text-orange-900">{pedido.solicitacao_estorno.motivo}</span>
                              </div>
                              {pedido.solicitacao_estorno.status === "recusado" &&
                                pedido.solicitacao_estorno.motivo_recusa && (
                                  <div className="mt-2 p-3 bg-red-100 border border-red-300 rounded-lg">
                                    <span className="text-red-700 font-semibold">Motivo da recusa: </span>
                                    <span className="text-red-800">{pedido.solicitacao_estorno.motivo_recusa}</span>
                                  </div>
                                )}
                            </div>
                          </div>
                        )}

                        <div className="border-t border-slate-200 pt-6">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center space-x-6">
                              {podeEstornar && (
                                <button
                                  onClick={() => abrirModalEstorno(pedido.id_pedido)}
                                  className="flex items-center bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-xl font-medium transition-colors shadow-lg text-sm"
                                >
                                  <RefreshCw size={16} className="mr-2" />
                                  Solicitar Estorno
                                </button>
                              )}

                              {pedido.solicitacao_estorno && (
                                <div className="flex items-center space-x-2">
                                  {pedido.solicitacao_estorno.status === "pendente" && (
                                    <div className="flex items-center bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-2 rounded-xl text-sm font-medium">
                                      <Clock size={16} className="mr-2" />
                                      Estorno em análise
                                    </div>
                                  )}
                                  {pedido.solicitacao_estorno.status === "aprovado" && (
                                    <div className="flex items-center bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded-xl text-sm font-medium">
                                      <CheckCircle size={16} className="mr-2" />
                                      Estorno aprovado
                                    </div>
                                  )}
                                  {pedido.solicitacao_estorno.status === "recusado" && (
                                    <div className="flex items-center bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-xl text-sm font-medium">
                                      <XCircle size={16} className="mr-2" />
                                      Estorno recusado
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                            <div className="text-right bg-gradient-to-r from-slate-100 to-blue-100 px-6 py-4 rounded-xl">
                              <div className="text-sm text-slate-500 font-medium">Total Pago</div>
                              <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                {formatarPreco(pedido.valor_total)}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {modalEstornoAberto && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-slate-900 mb-4">Solicitar Estorno</h3>
            <p className="text-slate-600 mb-4">
              Por favor, informe o motivo para solicitar o estorno do pedido #{pedidoEstornoSelecionado}:
            </p>
            <textarea
              value={motivoEstorno}
              onChange={(e) => setMotivoEstorno(e.target.value)}
              placeholder="Descreva o motivo do estorno..."
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 mb-4"
              rows={4}
            />
            <div className="flex space-x-3">
              <button
                onClick={confirmarEstorno}
                className="flex-1 bg-orange-600 hover:bg-orange-700 text-white px-4 py-3 rounded-lg font-medium transition-colors"
              >
                Confirmar Solicitação
              </button>
              <button
                onClick={() => {
                  setModalEstornoAberto(false)
                  setPedidoEstornoSelecionado(null)
                  setMotivoEstorno("")
                }}
                className="flex-1 bg-slate-600 hover:bg-slate-700 text-white px-4 py-3 rounded-lg font-medium transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}

export default MeusPedidos
