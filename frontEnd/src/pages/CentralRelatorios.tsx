"use client"

import Layout from "../components/Layout"
import { useNavigate } from "react-router-dom"
import { BarChart3, Users, Wrench, ShoppingBag, ArrowRight, FileText } from 'lucide-react'

export default function CentralRelatorios() {
  const navigate = useNavigate()

  const relatorios = [
    {
      titulo: "Relatório de Clientes",
      descricao: "Estatísticas, análises e dados completos sobre sua base de clientes",
      icone: Users,
      cor: "blue",
      rota: "/relatorios/clientes",
      disponivel: true,
    },
    {
      titulo: "Relatório de Assistências",
      descricao: "Acompanhe solicitações, orçamentos e serviços técnicos realizados",
      icone: Wrench,
      cor: "green",
      rota: "/relatorios/assistencias",
      disponivel: true,
    },
    {
      titulo: "Relatório de Vendas",
      descricao: "Análise de vendas, faturamento e desempenho comercial do e-commerce",
      icone: ShoppingBag,
      cor: "purple",
      rota: "/relatorios/vendas",
      disponivel: true,
    },
  ]

  const getCoresBorda = (cor: string) => {
    const cores: Record<string, string> = {
      blue: "border-blue-500",
      green: "border-green-500",
      purple: "border-purple-500",
      orange: "border-orange-500",
      red: "border-red-500",
    }
    return cores[cor] || "border-gray-500"
  }

  const getCoresIcone = (cor: string) => {
    const cores: Record<string, string> = {
      blue: "text-blue-600 bg-blue-100",
      green: "text-green-600 bg-green-100",
      purple: "text-purple-600 bg-purple-100",
      orange: "text-orange-600 bg-orange-100",
      red: "text-red-600 bg-red-100",
    }
    return cores[cor] || "text-gray-600 bg-gray-100"
  }

  const getCoresBotao = (cor: string) => {
    const cores: Record<string, string> = {
      blue: "bg-blue-600 hover:bg-blue-700",
      green: "bg-green-600 hover:bg-green-700",
      purple: "bg-purple-600 hover:bg-purple-700",
      orange: "bg-orange-600 hover:bg-orange-700",
      red: "bg-red-600 hover:bg-red-700",
    }
    return cores[cor] || "bg-gray-600 hover:bg-gray-700"
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <BarChart3 className="h-10 w-10 text-purple-600 mr-3" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Central de Relatórios</h1>
              <p className="text-gray-600 mt-1">Acesse análises e relatórios detalhados do sistema</p>
            </div>
          </div>
        </div>

        {/* Cards de Relatórios */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {relatorios.map((relatorio, index) => {
            const Icone = relatorio.icone
            return (
              <div
                key={index}
                className={`bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow border-l-4 ${getCoresBorda(relatorio.cor)} overflow-hidden`}
              >
                <div className="p-6">
                  {/* Ícone */}
                  <div className={`w-14 h-14 rounded-lg ${getCoresIcone(relatorio.cor)} flex items-center justify-center mb-4`}>
                    <Icone className="h-7 w-7" />
                  </div>

                  {/* Título */}
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{relatorio.titulo}</h3>

                  {/* Descrição */}
                  <p className="text-gray-600 text-sm mb-6 min-h-[3rem]">{relatorio.descricao}</p>

                  {/* Botão de Ação */}
                  <button
                    onClick={() => navigate(relatorio.rota)}
                    disabled={!relatorio.disponivel}
                    className={`w-full ${getCoresBotao(relatorio.cor)} text-white font-medium py-2.5 px-4 rounded-lg flex items-center justify-center transition-colors ${
                      !relatorio.disponivel ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    {relatorio.disponivel ? (
                      <>
                        Acessar Relatório
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    ) : (
                      "Em breve"
                    )}
                  </button>
                </div>

                {/* Rodapé com status */}
                {relatorio.disponivel && (
                  <div className="bg-gray-50 px-6 py-3 border-t border-gray-100">
                    <div className="flex items-center text-xs text-gray-500">
                      <FileText className="h-3.5 w-3.5 mr-1.5" />
                      Dashboard e Exportação Excel disponíveis
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

      </div>
    </Layout>
  )
}
