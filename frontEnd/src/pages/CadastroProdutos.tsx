"use client"

import type React from "react"
import { useState, useEffect } from "react"
import axios from "axios"
import Layout from "../components/Layout"
import MultipleImageUpload from "../components/MultipleImageUpload"
import { useNavigate } from "react-router-dom"
import {
  Package,
  Save,
  ArrowLeft,
  Plus,
  ImageIcon,
  DollarSign,
  Tag,
  Palette,
  Calendar,
  Layers,
  FileText,
  Hash,
  Truck,
} from "lucide-react"

interface Categoria {
  id_categoria: number
  nome: string
  descricao: string
}

interface ImageFile {
  file: File
  preview: string
  id: string
}

const CadastroProdutos: React.FC = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [showNewCategoryForm, setShowNewCategoryForm] = useState(false)
  const [newCategory, setNewCategory] = useState({ nome: "", descricao: "" })
  const [images, setImages] = useState<ImageFile[]>([])

  const [formData, setFormData] = useState({
    nome: "",
    descricao: "",
    preco: "",
    marca: "",
    modelo: "",
    estoque: "",
    id_categoria: "",
    compatibilidade: "",
    cor: "",
    ano_fabricacao: "",
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  // Carregar categorias
  const fetchCategorias = async () => {
    try {
      const response = await axios.get("http://localhost:3000/produtos/categorias")
      setCategorias(response.data)
    } catch (err) {
      console.error("Erro ao carregar categorias:", err)
    }
  }

  useEffect(() => {
    fetchCategorias()
  }, [])

  // Validar formulário
  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.nome.trim()) newErrors.nome = "Nome é obrigatório"
    if (!formData.descricao.trim()) newErrors.descricao = "Descrição é obrigatória"
    if (!formData.preco || Number.parseFloat(formData.preco) <= 0) {
      newErrors.preco = "Preço deve ser maior que zero"
    }
    if (!formData.id_categoria) newErrors.id_categoria = "Categoria é obrigatória"
    if (formData.estoque && Number.parseInt(formData.estoque) < 0) {
      newErrors.estoque = "Estoque não pode ser negativo"
    }
    if (
      formData.ano_fabricacao &&
      (Number.parseInt(formData.ano_fabricacao) < 1900 ||
        Number.parseInt(formData.ano_fabricacao) > new Date().getFullYear())
    ) {
      newErrors.ano_fabricacao = "Ano de fabricação inválido"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))

    // Limpar erro do campo quando usuário começar a digitar
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }))
    }
  }

  // Criar nova categoria
  const handleCreateCategory = async () => {
    if (!newCategory.nome.trim()) {
      alert("Nome da categoria é obrigatório")
      return
    }

    try {
      const token = localStorage.getItem("token")
      await axios.post("http://localhost:3000/produtos/categorias", newCategory, {
        headers: { Authorization: `Bearer ${token}` },
      })

      await fetchCategorias()
      setNewCategory({ nome: "", descricao: "" })
      setShowNewCategoryForm(false)
      alert("Categoria criada com sucesso!")
    } catch (err) {
      console.error("Erro ao criar categoria:", err)
      if (axios.isAxiosError(err) && err.response) {
        alert(err.response.data.message || "Erro ao criar categoria")
      } else {
        alert("Erro ao criar categoria")
      }
    }
  }

  // Submit do formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      const token = localStorage.getItem("token")
      if (!token) {
        navigate("/login")
        return
      }

      const submitData = new FormData()

      // Adicionar dados do produto
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== null && value !== "") {
          submitData.append(key, value.toString())
        }
      })

      // Adicionar imagens
      images.forEach((imageFile) => {
        submitData.append("imagens", imageFile.file)
      })

      await axios.post("http://localhost:3000/produtos/produtos", submitData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      })

      alert("Produto cadastrado com sucesso!")
      navigate("/gestao/produtos")
    } catch (err) {
      console.error("Erro ao cadastrar produto:", err)
      if (axios.isAxiosError(err) && err.response) {
        alert(err.response.data.message || "Erro ao cadastrar produto")
      } else {
        alert("Erro ao cadastrar produto")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <button
              onClick={() => navigate("/gestao/produtos")}
              className="flex items-center text-gray-600 hover:text-gray-800 mr-4"
            >
              <ArrowLeft size={20} className="mr-1" />
              Voltar
            </button>
            <h1 className="text-3xl font-bold text-gray-800">Cadastrar Produto</h1>
          </div>
          <p className="text-gray-600">Adicione um novo produto ao catálogo</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Informações Básicas */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
              <Package className="mr-2" size={24} />
              Informações Básicas
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Tag className="inline mr-1" size={16} />
                  Nome do Produto *
                </label>
                <input
                  type="text"
                  name="nome"
                  value={formData.nome}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.nome ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Ex: Notebook Dell Inspiron 15"
                />
                {errors.nome && <p className="text-red-500 text-sm mt-1">{errors.nome}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <DollarSign className="inline mr-1" size={16} />
                  Preço (R$) *
                </label>
                <input
                  type="number"
                  name="preco"
                  value={formData.preco}
                  onChange={handleInputChange}
                  step="0.01"
                  min="0"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.preco ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="0.00"
                />
                {errors.preco && <p className="text-red-500 text-sm mt-1">{errors.preco}</p>}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FileText className="inline mr-1" size={16} />
                  Descrição *
                </label>
                <textarea
                  name="descricao"
                  value={formData.descricao}
                  onChange={handleInputChange}
                  rows={4}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.descricao ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Descreva as características e especificações do produto..."
                />
                {errors.descricao && <p className="text-red-500 text-sm mt-1">{errors.descricao}</p>}
              </div>
            </div>
          </div>

          {/* Categoria */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
              <Layers className="mr-2" size={24} />
              Categoria
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Categoria *</label>
                <div className="flex gap-2">
                  <select
                    name="id_categoria"
                    value={formData.id_categoria}
                    onChange={handleInputChange}
                    className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.id_categoria ? "border-red-500" : "border-gray-300"
                    }`}
                  >
                    <option value="">Selecione uma categoria</option>
                    {categorias.map((categoria) => (
                      <option key={categoria.id_categoria} value={categoria.id_categoria}>
                        {categoria.nome}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setShowNewCategoryForm(!showNewCategoryForm)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center"
                  >
                    <Plus size={16} className="mr-1" />
                    Nova
                  </button>
                </div>
                {errors.id_categoria && <p className="text-red-500 text-sm mt-1">{errors.id_categoria}</p>}
              </div>

              {/* Formulário de nova categoria */}
              {showNewCategoryForm && (
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <h3 className="font-medium text-gray-800 mb-3">Nova Categoria</h3>
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="Nome da categoria"
                      value={newCategory.nome}
                      onChange={(e) => setNewCategory((prev) => ({ ...prev, nome: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <textarea
                      placeholder="Descrição (opcional)"
                      value={newCategory.descricao}
                      onChange={(e) => setNewCategory((prev) => ({ ...prev, descricao: e.target.value }))}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleCreateCategory}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Criar Categoria
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowNewCategoryForm(false)}
                        className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Detalhes do Produto */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
              <Hash className="mr-2" size={24} />
              Detalhes do Produto
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Marca</label>
                <input
                  type="text"
                  name="marca"
                  value={formData.marca}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: Dell, HP, Lenovo"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Modelo</label>
                <input
                  type="text"
                  name="modelo"
                  value={formData.modelo}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: Inspiron 15 3000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Truck className="inline mr-1" size={16} />
                  Estoque
                </label>
                <input
                  type="number"
                  name="estoque"
                  value={formData.estoque}
                  onChange={handleInputChange}
                  min="0"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.estoque ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="0"
                />
                {errors.estoque && <p className="text-red-500 text-sm mt-1">{errors.estoque}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Palette className="inline mr-1" size={16} />
                  Cor
                </label>
                <input
                  type="text"
                  name="cor"
                  value={formData.cor}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: Preto, Prata, Azul"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="inline mr-1" size={16} />
                  Ano de Fabricação
                </label>
                <input
                  type="number"
                  name="ano_fabricacao"
                  value={formData.ano_fabricacao}
                  onChange={handleInputChange}
                  min="1900"
                  max={new Date().getFullYear()}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.ano_fabricacao ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder={new Date().getFullYear().toString()}
                />
                {errors.ano_fabricacao && <p className="text-red-500 text-sm mt-1">{errors.ano_fabricacao}</p>}
              </div>

              <div className="md:col-span-2 lg:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">Compatibilidade</label>
                <textarea
                  name="compatibilidade"
                  value={formData.compatibilidade}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Descreva com quais sistemas, dispositivos ou componentes este produto é compatível..."
                />
              </div>
            </div>
          </div>

          {/* Upload de Múltiplas Imagens */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
              <ImageIcon className="mr-2" size={24} />
              Imagens do Produto
            </h2>

            <MultipleImageUpload images={images} onImagesChange={setImages} maxImages={10} maxSizePerImage={5} />
          </div>

          {/* Botões de Ação */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate("/gestao/produtos")}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="mr-2" size={16} />
                  Cadastrar Produto
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  )
}

export default CadastroProdutos
