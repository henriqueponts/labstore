"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import axios from "axios"
import Layout from "../components/Layout"
import { FileText, Save, ArrowLeft, Eye, AlertCircle, Clock, Calendar } from "lucide-react"

interface StatusCriacao {
  pode_criar: boolean
  termo_pendente: any
  motivo: string | null
}

const NovoTermoLGPD: React.FC = () => {
  const [formData, setFormData] = useState({
    conteudo: "",
    data_efetiva: "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [isEditing, setIsEditing] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [statusCriacao, setStatusCriacao] = useState<StatusCriacao | null>(null)
  const [termoOriginal, setTermoOriginal] = useState<any>(null)

  const navigate = useNavigate()
  const { id } = useParams()

  useEffect(() => {
    checkAuth()
    if (id) {
      setIsEditing(true)
      loadTermo()
    } else {
      // Definir data padrão como hoje
      const today = new Date().toISOString().split("T")[0]
      setFormData((prev) => ({ ...prev, data_efetiva: today }))
      verificarStatusCriacao()
    }
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

  const verificarStatusCriacao = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await axios.get("http://localhost:3000/lgpd/pode-criar-termo", {
        headers: { Authorization: `Bearer ${token}` },
      })
      setStatusCriacao(response.data)
    } catch (err) {
      console.error("Erro ao verificar status de criação:", err)
    }
  }

  const loadTermo = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem("token")
      const response = await axios.get(`http://localhost:3000/lgpd/termos/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      const termo = response.data
      setTermoOriginal(termo)
      setFormData({
        conteudo: termo.conteudo,
        data_efetiva: termo.data_efetiva.split("T")[0], // Converter para formato de input date
      })
    } catch (err) {
      console.error("Erro ao carregar termo:", err)
      setError("Erro ao carregar termo. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (error) setError("")
  }

  const getDataInfo = () => {
    if (!formData.data_efetiva) return null

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // CORREÇÃO: Criar data no timezone local para evitar problemas de UTC
    const [year, month, day] = formData.data_efetiva.split("-").map(Number)
    const selectedDate = new Date(year, month - 1, day) // month é 0-indexed

    console.log("🔍 DEBUG COMPARAÇÃO DE DATAS:")
    console.log("formData.data_efetiva:", formData.data_efetiva)
    console.log("today (zerado):", today)
    console.log("selectedDate (zerado):", selectedDate)
    console.log("selectedDate >= today:", selectedDate.getTime() >= today.getTime())
    console.log("selectedDate < today:", selectedDate.getTime() < today.getTime())

    if (selectedDate.getTime() >= today.getTime()) {
      // ✅ CORREÇÃO: Data de hoje ou futura = ATIVO na data efetiva
      const isToday = selectedDate.getTime() === today.getTime()
      console.log("✅ RESULTADO:", isToday ? "today" : "future")
      return {
        type: isToday ? "today" : "future",
        message: isToday
          ? "Termo será ATIVO imediatamente"
          : "Termo ficará ATIVO na data efetiva e não poderá ser editado após essa data",
        color: "green",
      }
    } else {
      console.log("❌ RESULTADO: past")
      return {
        type: "past",
        message: "Data não pode ser no passado",
        color: "red",
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.conteudo.trim() || !formData.data_efetiva) {
      setError("Todos os campos são obrigatórios.")
      return
    }

    const dataInfo = getDataInfo()
    if (dataInfo?.type === "past") {
      setError("A data efetiva não pode ser no passado.")
      return
    }

    setLoading(true)
    try {
      const token = localStorage.getItem("token")

      // CORREÇÃO: Enviar data com horário meio-dia para evitar problemas de timezone
      const [year, month, day] = formData.data_efetiva.split("-").map(Number)
      const dataParaEnvio = new Date(year, month - 1, day, 12, 0, 0) // Meio-dia no timezone local
      const dataFormatada = dataParaEnvio.toISOString() // Envia com horário completo

      const dadosParaEnvio = {
        ...formData,
        data_efetiva: dataFormatada,
      }

      // LOGS DETALHADOS PARA DEBUG DO BACKEND
      console.log("📤 ENVIANDO DADOS PARA O SERVIDOR:")
      console.log("URL:", isEditing ? `PUT /lgpd/termos/${id}` : "POST /lgpd/termos")
      console.log("formData original:", formData)
      console.log("dataParaEnvio (com horário):", dataParaEnvio)
      console.log("dataFormatada (ISO):", dataFormatada)
      console.log("dadosParaEnvio (corrigido):", dadosParaEnvio)
      console.log("token:", token ? "✅ Presente" : "❌ Ausente")

      if (isEditing) {
        // Editar termo existente
        console.log("🔧 Editando termo existente...")
        await axios.put(`http://localhost:3000/lgpd/termos/${id}`, dadosParaEnvio, {
          headers: { Authorization: `Bearer ${token}` },
        })
      } else {
        // Criar novo termo
        console.log("📝 Criando novo termo...")
        const response = await axios.post("http://localhost:3000/lgpd/termos", dadosParaEnvio, {
          headers: { Authorization: `Bearer ${token}` },
        })
        console.log("✅ Resposta do servidor:", response.data)
      }

      navigate("/gestao/lgpd")
    } catch (err: any) {
      console.error("❌ ERRO DETALHADO:")
      console.error("Status:", err.response?.status)
      console.error("Data:", err.response?.data)
      console.error("Headers:", err.response?.headers)
      console.error("Config:", err.config)
      console.error("Full error:", err)

      if (err.response?.data?.message) {
        setError(err.response.data.message)
      } else {
        setError("Erro ao salvar termo. Tente novamente.")
      }
    } finally {
      setLoading(false)
    }
  }

  const termoExemplo = `TERMO DE CONSENTIMENTO PARA TRATAMENTO DE DADOS PESSOAIS

Em conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018), informamos que:

1. DADOS COLETADOS
Coletamos e tratamos os seguintes dados pessoais:
- Nome completo
- E-mail
- CPF/CNPJ
- Endereço completo
- Telefone
- Dados de navegação e uso do sistema

2. FINALIDADES DO TRATAMENTO
Seus dados são utilizados para:
- Prestação de serviços de assistência técnica
- Processamento de pedidos e vendas
- Comunicação sobre produtos e serviços
- Cumprimento de obrigações legais
- Melhoria da experiência do usuário

3. BASE LEGAL
O tratamento de seus dados é baseado em:
- Consentimento do titular
- Execução de contrato
- Cumprimento de obrigação legal
- Legítimo interesse

4. COMPARTILHAMENTO
Seus dados podem ser compartilhados com:
- Prestadores de serviços terceirizados
- Órgãos públicos quando exigido por lei
- Parceiros comerciais (mediante consentimento)

5. SEUS DIREITOS
Você tem direito a:
- Confirmar a existência de tratamento
- Acessar seus dados
- Corrigir dados incompletos ou inexatos
- Anonimizar, bloquear ou eliminar dados
- Revogar o consentimento

6. CONTATO
Para exercer seus direitos ou esclarecer dúvidas:
E-mail: lgpd@labstore.com
Telefone: (11) 1234-5678

Ao aceitar este termo, você consente com o tratamento de seus dados pessoais conforme descrito acima.`

  // Se não pode criar novo termo, mostrar aviso
  if (!isEditing && statusCriacao && !statusCriacao.pode_criar) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="mb-8">
            <div className="flex items-center">
              <button
                onClick={() => navigate("/gestao/lgpd")}
                className="mr-4 p-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
              <FileText className="text-blue-600 mr-3" size={32} />
              <div>
                <h1 className="text-3xl font-bold text-gray-800">Novo Termo LGPD</h1>
                <p className="text-gray-600">Criar um novo termo de consentimento</p>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <div className="flex items-center">
              <AlertCircle className="text-yellow-600 mr-3" size={24} />
              <div>
                <h3 className="text-yellow-800 font-medium text-lg">Não é possível criar novo termo</h3>
                <p className="text-yellow-700 mt-2">{statusCriacao.motivo}</p>
                {statusCriacao.termo_pendente && (
                  <div className="mt-4 p-3 bg-yellow-100 rounded border">
                    <p className="text-yellow-800 text-sm">
                      <strong>Termo Pendente:</strong> Versão {statusCriacao.termo_pendente.versao} - Implementação em{" "}
                      {new Date(statusCriacao.termo_pendente.data_efetiva).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                )}
                <div className="mt-4">
                  <button
                    onClick={() => navigate("/gestao/lgpd")}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
                  >
                    Voltar para Gestão LGPD
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  if (loading && isEditing) {
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

  const dataInfo = getDataInfo()

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
                <h1 className="text-3xl font-bold text-gray-800">
                  {isEditing ? `Editar Termo v${termoOriginal?.versao}` : "Novo Termo LGPD"}
                </h1>
                <p className="text-gray-600">
                  {isEditing
                    ? "Editar termo pendente (versão será mantida)"
                    : "Criar um novo termo de consentimento (versão será gerada automaticamente)"}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md flex items-center transition-colors"
            >
              <Eye size={16} className="mr-2" />
              {showPreview ? "Ocultar" : "Preview"}
            </button>
          </div>
        </div>

        {/* Aviso sobre edição de termo pendente */}
        {isEditing && termoOriginal?.status_termo === "pendente" && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center">
              <Clock className="text-blue-600 mr-3" size={20} />
              <div>
                <h3 className="text-blue-800 font-medium">Editando Termo Pendente</h3>
                <p className="text-blue-700 text-sm mt-1">
                  Este termo está pendente e pode ser editado até o dia anterior à implementação (
                  {new Date(termoOriginal.data_efetiva).toLocaleDateString("pt-BR")}).
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">{error}</div>}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form */}
          <div className="bg-white rounded-lg shadow p-6">
            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
                {!isEditing && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-800 mb-2">Versão Automática</h4>
                    <p className="text-sm text-gray-600">
                      A versão será gerada automaticamente baseada na última versão existente (ex: 1.1, 1.2, 1.3...).
                    </p>
                  </div>
                )}

                <div>
                  <label htmlFor="data_efetiva" className="block text-sm font-medium text-gray-700 mb-2">
                    Data Efetiva *
                  </label>
                  <input
                    type="date"
                    id="data_efetiva"
                    name="data_efetiva"
                    value={formData.data_efetiva}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />

                  {/* Info sobre a data selecionada */}
                  {dataInfo && (
                    <div
                      className={`mt-2 p-3 rounded-md border ${
                        dataInfo.color === "green"
                          ? "bg-green-50 border-green-200"
                          : dataInfo.color === "blue"
                            ? "bg-blue-50 border-blue-200"
                            : "bg-red-50 border-red-200"
                      }`}
                    >
                      <div className="flex items-center">
                        {dataInfo.color === "green" && <Calendar className="text-green-600 mr-2" size={16} />}
                        {dataInfo.color === "blue" && <Clock className="text-blue-600 mr-2" size={16} />}
                        {dataInfo.color === "red" && <AlertCircle className="text-red-600 mr-2" size={16} />}
                        <p
                          className={`text-sm ${
                            dataInfo.color === "green"
                              ? "text-green-700"
                              : dataInfo.color === "blue"
                                ? "text-blue-700"
                                : "text-red-700"
                          }`}
                        >
                          {dataInfo.message}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label htmlFor="conteudo" className="block text-sm font-medium text-gray-700">
                      Conteúdo do Termo *
                    </label>
                    {!isEditing && (
                      <button
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, conteudo: termoExemplo }))}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        Usar exemplo
                      </button>
                    )}
                  </div>
                  <textarea
                    id="conteudo"
                    name="conteudo"
                    value={formData.conteudo}
                    onChange={handleChange}
                    rows={20}
                    placeholder="Digite o conteúdo do termo de consentimento..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                    required
                  />
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => navigate("/gestao/lgpd")}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading || dataInfo?.type === "past"}
                    className={`px-6 py-2 rounded-md font-medium transition-all flex items-center ${
                      loading || dataInfo?.type === "past"
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : "bg-blue-600 hover:bg-blue-700 text-white"
                    }`}
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save size={16} className="mr-2" />
                        {isEditing ? "Salvar Alterações" : "Criar Termo"}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Preview */}
          {showPreview && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Preview</h3>
              <div className="border rounded-md p-4 max-h-96 overflow-y-auto bg-gray-50">
                <div className="prose max-w-none">
                  <div
                    className="text-gray-700 leading-relaxed whitespace-pre-wrap text-sm"
                    dangerouslySetInnerHTML={{
                      __html: formData.conteudo.replace(/\n/g, "<br>"),
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}

export default NovoTermoLGPD
