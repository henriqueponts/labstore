"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import axios from "axios"
import Layout from "../components/Layout"
import { FileText, Save, ArrowLeft, Eye } from "lucide-react"

const NovoTermoLGPD: React.FC = () => {
  const [formData, setFormData] = useState({
    conteudo: "",
    versao: "",
    data_efetiva: "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [isEditing, setIsEditing] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

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

  const loadTermo = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem("token")
      const response = await axios.get(`http://localhost:3000/lgpd/termos/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      const termo = response.data
      setFormData({
        conteudo: termo.conteudo,
        versao: termo.versao,
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.conteudo.trim() || !formData.versao.trim() || !formData.data_efetiva) {
      setError("Todos os campos são obrigatórios.")
      return
    }

    setLoading(true)
    try {
      const token = localStorage.getItem("token")

      if (isEditing) {
        // Para edição, criar uma nova versão
        await axios.post("http://localhost:3000/lgpd/termos", formData, {
          headers: { Authorization: `Bearer ${token}` },
        })
      } else {
        await axios.post("http://localhost:3000/lgpd/termos", formData, {
          headers: { Authorization: `Bearer ${token}` },
        })
      }

      navigate("/gestao/lgpd")
    } catch (err: any) {
      console.error("Erro ao salvar termo:", err)
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
                  {isEditing ? "Nova Versão do Termo" : "Novo Termo LGPD"}
                </h1>
                <p className="text-gray-600">
                  {isEditing ? "Criar uma nova versão do termo existente" : "Criar um novo termo de consentimento"}
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

        {/* Error Message */}
        {error && <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">{error}</div>}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form */}
          <div className="bg-white rounded-lg shadow p-6">
            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
                <div>
                  <label htmlFor="versao" className="block text-sm font-medium text-gray-700 mb-2">
                    Versão *
                  </label>
                  <input
                    type="text"
                    id="versao"
                    name="versao"
                    value={formData.versao}
                    onChange={handleChange}
                    placeholder="Ex: 1.0, 2.1, etc."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

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
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label htmlFor="conteudo" className="block text-sm font-medium text-gray-700">
                      Conteúdo do Termo *
                    </label>
                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, conteudo: termoExemplo }))}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      Usar exemplo
                    </button>
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
                    disabled={loading}
                    className={`px-6 py-2 rounded-md font-medium transition-all flex items-center ${
                      loading
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
                        Salvar Termo
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
