// frontEnd/src/pages/CarrinhoPage.tsx - VERSÃƒO COMPLETA E CORRIGIDA
"use client"

import type React from "react"
import { useState } from "react"
import Layout from "../components/Layout"
import { useCart } from "../context/CartContext"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import {
  Trash2,
  Plus,
  Minus,
  ShoppingCart,
  AlertTriangle,
  ArrowLeft,
  Package,
  CreditCard,
  Truck,
  MapPin,
  Calculator,
  Clock,
  Store,
  Loader2,
  ShieldCheck,
} from "lucide-react"

interface OpcaoFrete {
  id: number;
  name: string;
  price: string;
  delivery_time: number;
  company: {
    name: string;
    picture: string;
  };
  error?: string;
}

interface FreteSelecionado {
  nome: string;
  valor: number;
  prazo: number;
}

const CarrinhoPage: React.FC = () => {
  const { itensCarrinho, carregando, atualizarQuantidade, removerDoCarrinho, limparCarrinho, totalItens, totalPreco } =
    useCart()
  const navigate = useNavigate()

  const [cep, setCep] = useState("")
  const [opcoesFrete, setOpcoesFrete] = useState<OpcaoFrete[]>([])
  const [freteSelecionado, setFreteSelecionado] = useState<FreteSelecionado | null>(null)
  const [calculandoFrete, setCalculandoFrete] = useState(false)
  const [erroFrete, setErroFrete] = useState("")
  const [comSeguro, setComSeguro] = useState(false)
  const [processandoPagamento, setProcessandoPagamento] = useState(false)

  const formatarPreco = (preco: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(preco)
  }

  const handleCalcularFrete = async (seguroHabilitado = comSeguro) => {
    if (cep.replace(/\D/g, "").length !== 8) {
      setErroFrete("CEP invÃ¡lido. Deve conter 8 dÃ­gitos.")
      return
    }
    setCalculandoFrete(true)
    setErroFrete("")
    setOpcoesFrete([])
    setFreteSelecionado(null)

    try {
      const itensParaCalculo = itensCarrinho.map((item) => ({
        id_produto: item.id_produto,
        quantidade: item.quantidade,
      }))

      const response = await axios.post("http://localhost:3000/frete/calcular", {
        cepDestino: cep,
        itens: itensParaCalculo,
        comSeguro: seguroHabilitado,
      })

      const opcoesValidas: OpcaoFrete[] = response.data.filter((opcao: OpcaoFrete) => !opcao.error) || []

      if (opcoesValidas.length === 0) {
        setErroFrete(response.data[0]?.error || "Nenhuma opçãoo de frete encontrada para este CEP.")
      }

      setOpcoesFrete(opcoesValidas)
    } catch (error) {
      console.error("Erro ao calcular frete:", error)
      if (axios.isAxiosError(error) && error.response) {
        setErroFrete(error.response.data.message || "Erro ao se comunicar com o serviço de frete.")
      } else {
        setErroFrete("Ocorreu um erro inesperado.")
      }
    } finally {
      setCalculandoFrete(false)
    }
  }

  const handleSeguroChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const novoValor = e.target.checked
    setComSeguro(novoValor)
    if (cep.replace(/\D/g, "").length === 8) {
      handleCalcularFrete(novoValor)
    }
  }

  const handleSelecionarFrete = (opcao: FreteSelecionado) => {
    setFreteSelecionado(opcao)
  }

  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = e.target.value.replace(/\D/g, "")
    if (valor.length <= 8) {
      setCep(valor)
      if (opcoesFrete.length > 0) {
        setOpcoesFrete([])
        setFreteSelecionado(null)
      }
    }
  }

  if (carregando) {
    return <Layout showLoading={true}><div/></Layout>
  }

  const valorTotalFinal = totalPreco + (freteSelecionado?.valor || 0)

  const handleFinalizarCompra = async () => {
    if (!freteSelecionado) {
      alert('Selecione uma opção de entrega');
      return;
    }
  
    setProcessandoPagamento(true);
  
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch('http://localhost:3000/pagamento/criar-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          
          frete_nome: freteSelecionado.nome,
          frete_valor: freteSelecionado.valor,
          frete_prazo_dias: freteSelecionado.prazo,
          endereco_entrega: 'EndereÃ§o do cliente' // TODO: Implementar busca do endereÃ§o
        })
      });
  
      const data = await response.json();
  
      // =================== ALTERAÃ‡ÃƒO AQUI ===================
      // Adicionamos uma verificação para 'data.payment_url'.
      // Se a URL não vier, o processo para com uma mensagem de erro clara.
      if (response.ok && data.success && data.payment_url) {
        localStorage.setItem('current_order_id', data.order_id);
        
        // Abre a pÃ¡gina de pagamento em uma nova aba
        window.open(data.payment_url, '_blank');
        
        // Navega a aba atual para a pÃ¡gina de espera
        navigate(`/aguardo-pagamento?order_id=${data.order_id}`);
        
      } else {
        // Mensagem de erro mais especÃ­fica se a URL não for criada
        const errorMessage = data.message || 'Não foi possÃ­vel obter a URL de pagamento do servidor.';
        console.error('Erro ao criar link de pagamento:', data);
        alert(`Erro ao criar link de pagamento: ${errorMessage}`);
      }
      // =======================================================
  
    } catch (error) {
      console.error('Erro ao criar link de pagamento:', error);
      alert('Erro ao processar pagamento. Tente novamente.');
    } finally {
      setProcessandoPagamento(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="mb-8">
            <div className="flex items-center mb-6">
              <button
                onClick={() => navigate("/produtos")}
                className="flex items-center text-slate-600 hover:text-slate-900 transition-colors duration-200 mr-4 bg-white/50 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/20 hover:bg-white/70"
              >
                <ArrowLeft size={20} className="mr-2" />
                Continuar Comprando
              </button>
            </div>

            <div className="text-center mb-8">
              <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-full text-blue-700 text-sm font-medium mb-4">
                <ShoppingCart size={16} className="mr-2" />
                Carrinho de Compras
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4 bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent">
                Meu Carrinho
              </h1>
            </div>
          </div>

          {itensCarrinho.length === 0 ? (
            <div className="text-center py-16">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-12 max-w-md mx-auto">
                <div className="bg-gradient-to-br from-blue-100 to-indigo-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                  <ShoppingCart className="h-12 w-12 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-3">Seu carrinho estÃ¡ vazio</h2>
                <p className="text-slate-600 mb-8 leading-relaxed">
                  Que tal explorar nossos produtos e encontrar algo especial para vocÃª?
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
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              <div className="xl:col-span-2">
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6 mb-6">
                  <div className="flex justify-between items-center mb-6 pb-6 border-b border-slate-200">
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900 flex items-center">
                        Itens do Carrinho
                      </h2>
                      <p className="text-slate-600 mt-1">
                        {totalItens} {totalItens === 1 ? "produto" : "produtos"} selecionados
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        if (confirm("Tem certeza que deseja esvaziar o carrinho?")) {
                          limparCarrinho()
                        }
                      }}
                      className="text-sm text-red-600 hover:text-red-800 font-medium flex items-center bg-red-50 hover:bg-red-100 px-4 py-2 rounded-xl transition-all duration-200"
                    >
                      <Trash2 size={16} className="mr-2" />
                      Esvaziar Carrinho
                    </button>
                  </div>

                  <div className="space-y-6">
                    {itensCarrinho.map((item, index) => (
                      <div
                        key={item.id_produto}
                        className={`group ${index !== itensCarrinho.length - 1 ? "border-b border-slate-100 pb-6" : ""}`}
                      >
                        <div className="flex items-center gap-6">
                          <div className="relative">
                            <div className="w-24 h-24 bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl overflow-hidden flex-shrink-0">
                              {item.imagem_principal ? (
                                <img
                                  src={`http://localhost:3000/produtos${item.imagem_principal}`}
                                  alt={item.nome_produto}
                                  className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Package className="h-8 w-8 text-slate-400" />
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex-grow min-w-0">
                            <h3 className="font-bold text-slate-900 text-lg mb-2 truncate group-hover:text-blue-600 transition-colors duration-200">
                              {item.nome_produto}
                            </h3>
                            <div className="flex items-center gap-4 mb-3">
                              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                {formatarPreco(item.preco_atual)}
                              </span>
                              <span className="text-sm text-slate-500">por unidade</span>
                            </div>
                            {item.estoque < item.quantidade && (
                              <div className="flex items-center text-red-600 bg-red-50 px-3 py-2 rounded-lg text-sm font-medium">
                                <AlertTriangle size={16} className="mr-2" />
                                Quantidade excede o estoque disponÃ­vel!
                              </div>
                            )}
                          </div>

                          <div className="flex flex-col items-center gap-4">
                            <div className="flex items-center bg-slate-100 rounded-xl border border-slate-200 overflow-hidden">
                              <button
                                onClick={() => atualizarQuantidade(item.id_produto, item.quantidade - 1)}
                                disabled={item.quantidade <= 1}
                                className="p-3 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-slate-600 hover:text-slate-900"
                              >
                                <Minus size={16} />
                              </button>
                              <div className="px-6 py-3 font-bold text-slate-900 bg-white min-w-[60px] text-center">
                                {item.quantidade}
                              </div>
                              <button
                                onClick={() => atualizarQuantidade(item.id_produto, item.quantidade + 1)}
                                disabled={item.quantidade >= item.estoque}
                                className="p-3 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-slate-600 hover:text-slate-900"
                              >
                                <Plus size={16} />
                              </button>
                            </div>
                            <span className="text-xs text-slate-500">{item.estoque} disponÃ­vel</span>
                          </div>

                          <div className="text-right flex flex-col items-end gap-4">
                            <div>
                              <p className="text-sm text-slate-500 mb-1">Subtotal</p>
                              <p className="text-2xl font-bold text-slate-900">{formatarPreco(item.subtotal)}</p>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => removerDoCarrinho(item.id_produto)}
                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                                title="Remover do carrinho"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="xl:col-span-1">
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6 sticky top-4">
                  <h2 className="text-2xl font-bold text-slate-900 mb-6 pb-4 border-b border-slate-200 flex items-center">
                    Resumo do Pedido
                  </h2>

                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
                      <Truck size={18} className="mr-2 text-blue-600" />
                      Opçµes de Entrega
                    </h3>
                    <div className="space-y-3">
                      <label
                        className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                          freteSelecionado?.nome === "Retirar na Loja"
                            ? "border-green-500 bg-green-50 shadow-md"
                            : "border-slate-200 hover:border-green-300 hover:bg-green-50/50"
                        }`}
                      >
                        <input
                          type="radio"
                          name="frete"
                          checked={freteSelecionado?.nome === "Retirar na Loja"}
                          onChange={() => handleSelecionarFrete({ nome: "Retirar na Loja", valor: 0, prazo: 0 })}
                          className="mr-4 w-4 h-4 text-green-600 focus:ring-green-500"
                        />
                        <div className="bg-green-100 p-2 rounded-lg mr-3">
                          <Store size={20} className="text-green-600" />
                        </div>
                        <div className="flex-grow">
                          <p className="font-bold text-slate-900">Retirar na Loja</p>
                          <p className="text-sm text-slate-600">DisponÃ­vel para retirada</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-600 text-lg">GrÃ¡tis</p>
                        </div>
                      </label>

                      {opcoesFrete.map((opcao) => {
                        const isSelected = freteSelecionado?.nome === `${opcao.company.name} - ${opcao.name}`
                        return (
                          <label
                            key={opcao.id}
                            className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                              isSelected
                                ? "border-blue-500 bg-blue-50 shadow-md"
                                : "border-slate-200 hover:border-blue-300 hover:bg-blue-50/50"
                            }`}
                          >
                            <input
                              type="radio"
                              name="frete"
                              checked={isSelected}
                              onChange={() =>
                                handleSelecionarFrete({
                                  nome: `${opcao.company.name} - ${opcao.name}`,
                                  valor: parseFloat(opcao.price),
                                  prazo: opcao.delivery_time,
                                })
                              }
                              className="mr-4 w-4 h-4 text-blue-600 focus:ring-blue-500"
                            />
                            <div className="bg-white p-2 rounded-lg mr-3 border border-slate-200">
                              <img
                                src={opcao.company.picture || "/placeholder.svg"}
                                alt={opcao.company.name}
                                className="w-6 h-6 object-contain"
                              />
                            </div>
                            <div className="flex-grow">
                              <p className="font-bold text-slate-900">{opcao.name}</p>
                              <p className="text-sm text-slate-600 flex items-center">
                                <Clock size={12} className="mr-1" />
                                {opcao.delivery_time} {opcao.delivery_time === 1 ? "dia Ãºtil" : "dias Ãºteis"}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-slate-900 text-lg">
                                {formatarPreco(parseFloat(opcao.price))}
                              </p>
                            </div>
                          </label>
                        )
                      })}
                    </div>
                  </div>

                  <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                    <h3 className="text-lg font-semibold text-slate-900 mb-3 flex items-center">
                      <MapPin size={18} className="mr-2 text-blue-600" />
                      Calcular Entrega
                    </h3>
                    <div className="flex gap-2 mb-3">
                      <div className="flex-1">
                        <input
                          type="text"
                          id="cep"
                          value={cep}
                          onChange={handleCepChange}
                          placeholder="00000-000"
                          className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 backdrop-blur-sm transition-all duration-200 font-medium"
                        />
                      </div>
                      <button
                        onClick={() => handleCalcularFrete()}
                        disabled={calculandoFrete || cep.replace(/\D/g, "").length !== 8}
                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-semibold px-6 py-3 rounded-xl transition-all duration-200 flex items-center justify-center disabled:cursor-not-allowed min-w-[60px]"
                      >
                        {calculandoFrete ? <Loader2 className="animate-spin" size={20} /> : <Calculator size={20} />}
                      </button>
                    </div>

                    {erroFrete && (
                      <div className="flex items-center text-red-600 bg-red-50 px-3 py-2 rounded-lg text-sm font-medium mb-3">
                        <AlertTriangle size={16} className="mr-2" />
                        {erroFrete}
                      </div>
                    )}

                    <div className="flex items-center">
                      <label className="flex items-center cursor-pointer select-none group">
                        <input
                          type="checkbox"
                          checked={comSeguro}
                          onChange={handleSeguroChange}
                          className="h-4 w-4 rounded border-slate-300 text-green-600 focus:ring-green-500 transition-colors"
                        />
                        <div className="ml-3 flex items-center">
                          <div className="bg-green-100 p-1 rounded-full mr-2 group-hover:bg-green-200 transition-colors">
                            <ShieldCheck size={14} className="text-green-600" />
                          </div>
                          <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900 transition-colors">
                            Adicionar seguro Ã  encomenda
                          </span>
                        </div>
                      </label>
                    </div>
                  </div>

                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
                      <Calculator size={18} className="mr-2 text-blue-600" />
                      Resumo Financeiro
                    </h3>
                    <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <span className="text-slate-700 font-medium">
                            Subtotal ({totalItens} {totalItens === 1 ? "item" : "itens"})
                          </span>
                        </div>
                        <span className="font-bold text-slate-900">{formatarPreco(totalPreco)}</span>
                      </div>

                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <span className="text-slate-700 font-medium">Entrega</span>
                        </div>
                        <div className="text-right">
                          {freteSelecionado ? (
                            <>
                              <span className="font-bold text-slate-900">{formatarPreco(freteSelecionado.valor)}</span>
                              {freteSelecionado.prazo > 0 && (
                                <p className="text-xs text-slate-500 flex items-center justify-end">
                                  <Clock size={10} className="mr-1" />
                                  {freteSelecionado.prazo} {freteSelecionado.prazo === 1 ? "dia" : "dias"}
                                </p>
                              )}
                            </>
                          ) : (
                            <span className="text-slate-500 font-medium">Selecione uma opção</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-slate-100 to-slate-200 rounded-xl p-4 mb-6">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <span className="text-xl font-bold text-slate-900">Total</span>
                      </div>
                      <div className="text-right">
                        <span className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                          {formatarPreco(valorTotalFinal)}
                        </span>
                        {freteSelecionado && freteSelecionado.prazo > 0 && (
                          <p className="text-sm text-slate-600 mt-1">
                            Em atÃ© 12x de {formatarPreco(valorTotalFinal / 12)} sem juros
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <button
                      onClick={handleFinalizarCompra}
                      disabled={!freteSelecionado || processandoPagamento}
                      className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-slate-300 disabled:to-slate-400 text-white px-6 py-4 rounded-xl font-bold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none flex items-center justify-center text-lg disabled:cursor-not-allowed"
                    >
                      {processandoPagamento ? (
                        <>
                          <Loader2 className="animate-spin mr-2" size={20} />
                          Criando pagamento...
                        </>
                      ) : (
                        <>
                          <CreditCard size={20} className="mr-2" />
                          {freteSelecionado ? "Finalizar Compra" : "Selecione uma forma de entrega"}
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => navigate("/produtos")}
                      className="w-full border-2 border-slate-200 hover:border-blue-300 text-slate-700 hover:text-blue-600 px-6 py-3 rounded-xl font-semibold transition-all duration-200 hover:bg-blue-50"
                    >
                      Continuar Comprando
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}

export default CarrinhoPage