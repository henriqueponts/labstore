"use client"

import type React from "react"
import { useState, useEffect } from "react"
import axios from "axios"
import Layout from "../components/Layout"
import { useNavigate } from "react-router-dom"
import {
  Package,
  Save,
  ArrowLeft,
  Plus,
  DollarSign,
  Tag,
  Palette,
  Calendar,
  Layers,
  FileText,
  Hash,
  Truck,
  Weight,
  Ruler,
  ImageIcon,
} from "lucide-react"
import { useAlert } from "../components/Alert-container"

interface Categoria {
  id_categoria: number
  nome: string
  descricao: string
}

interface Marca {
  id_marca: number
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
  const [marcas, setMarcas] = useState<Marca[]>([])
  const [showNewCategoryForm, setShowNewCategoryForm] = useState(false)
  const [showNewBrandForm, setShowNewBrandForm] = useState(false)
  const [newCategory, setNewCategory] = useState({ nome: "", descricao: "" })
  const [newBrand, setNewBrand] = useState({ nome: "", descricao: "" })
  const [images, setImages] = useState<ImageFile[]>([])
  const { showErro, showAviso, showSucesso } = useAlert();

  const [formData, setFormData] = useState({
    nome: "",
    descricao: "",
    preco: "",
    id_marca: "",
    modelo: "",
    estoque: "",
    id_categoria: "",
    compatibilidade: "",
    cor: "",
    ano_fabricacao: "",
    peso_kg: "",
    altura_cm: "",
    largura_cm: "",
    comprimento_cm: "",
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

  const fetchMarcas = async () => {
    try {
      const response = await axios.get("http://localhost:3000/gestao/marcas")
      setMarcas(response.data)
    } catch (err) {
      console.error("Erro ao carregar marcas:", err)
    }
  }

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([fetchCategorias(), fetchMarcas()])
    }
    loadData()
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
    if (formData.peso_kg && Number.parseFloat(formData.peso_kg) <= 0) newErrors.peso_kg = "Peso deve ser maior que zero"
    if (formData.altura_cm && Number.parseFloat(formData.altura_cm) <= 0)
      newErrors.altura_cm = "Altura deve ser maior que zero"
    if (formData.largura_cm && Number.parseFloat(formData.largura_cm) <= 0)
      newErrors.largura_cm = "Largura deve ser maior que zero"
    if (formData.comprimento_cm && Number.parseFloat(formData.comprimento_cm) <= 0)
      newErrors.comprimento_cm = "Comprimento deve ser maior que zero"

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }))
    }
  }

  // Criar nova categoria
  const handleCreateCategory = async () => {
    if (!newCategory.nome.trim()) {
      showAviso("Nome da categoria é obrigatório")
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
      showSucesso("Categoria criada com sucesso!")
    } catch (err) {
      console.error("Erro ao criar categoria:", err)
      if (axios.isAxiosError(err) && err.response) {
        showErro(err.response.data.message || "Erro ao criar categoria")
      } else {
        showErro("Erro ao criar categoria")
      }
    }
  }

  const handleCreateBrand = async () => {
    if (!newBrand.nome.trim()) {
      showAviso("Nome da marca é obrigatório")
      return
    }

    try {
      const token = localStorage.getItem("token")
      await axios.post("http://localhost:3000/gestao/marcas", newBrand, {
        headers: { Authorization: `Bearer ${token}` },
      })

      await fetchMarcas()
      setNewBrand({ nome: "", descricao: "" })
      setShowNewBrandForm(false)
      showSucesso("Marca criada com sucesso!")
    } catch (err) {
      console.error("Erro ao criar marca:", err)
      if (axios.isAxiosError(err) && err.response) {
        showErro(err.response.data.message || "Erro ao criar marca")
      } else {
        showErro("Erro ao criar marca")
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

      Object.entries(formData).forEach(([key, value]) => {
        if (value !== null && value !== "") {
          submitData.append(key, value.toString())
        }
      })

      images.forEach((imageFile) => {
        submitData.append("imagens", imageFile.file)
      })

      await axios.post("http://localhost:3000/produtos/produtos", submitData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      })

      showSucesso("Produto cadastrado com sucesso!")
      navigate("/gestao/produtos")
    } catch (err) {
      console.error("Erro ao cadastrar produto:", err)
      if (axios.isAxiosError(err) && err.response) {
        showErro(err.response.data.message || "Erro ao cadastrar produto")
      } else {
        showErro("Erro ao cadastrar produto")
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

          {/* Categoria e Marca */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
              <Layers className="mr-2" size={24} />
              Categoria e Marca
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Marca</label>
                <div className="flex gap-2">
                  <select
                    name="id_marca"
                    value={formData.id_marca}
                    onChange={handleInputChange}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Selecione uma marca</option>
                    {marcas.map((marca) => (
                      <option key={marca.id_marca} value={marca.id_marca}>
                        {marca.nome}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setShowNewBrandForm(!showNewBrandForm)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center"
                  >
                    <Plus size={16} className="mr-1" />
                    Nova
                  </button>
                </div>
              </div>
            </div>

            {showNewCategoryForm && (
              <div className="mt-4 border border-gray-200 rounded-lg p-4 bg-gray-50">
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

            {showNewBrandForm && (
              <div className="mt-4 border border-gray-200 rounded-lg p-4 bg-gray-50">
                <h3 className="font-medium text-gray-800 mb-3">Nova Marca</h3>
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Nome da marca"
                    value={newBrand.nome}
                    onChange={(e) => setNewBrand((prev) => ({ ...prev, nome: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <textarea
                    placeholder="Descrição (opcional)"
                    value={newBrand.descricao}
                    onChange={(e) => setNewBrand((prev) => ({ ...prev, descricao: e.target.value }))}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleCreateBrand}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Criar Marca
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowNewBrandForm(false)}
                      className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Detalhes do Produto */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
              <Hash className="mr-2" size={24} />
              Detalhes do Produto
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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

          {/* Informações de Envio */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
              <Truck className="mr-2" size={24} />
              Informações de Envio
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              Essas informações são essenciais para o cálculo automático do frete.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Weight className="inline mr-1" size={16} />
                  Peso (kg)
                </label>
                <input
                  type="number"
                  name="peso_kg"
                  value={formData.peso_kg}
                  onChange={handleInputChange}
                  step="0.001"
                  min="0"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.peso_kg ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Ex: 0.850"
                />
                {errors.peso_kg && <p className="text-red-500 text-sm mt-1">{errors.peso_kg}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Ruler className="inline mr-1" size={16} />
                  Altura (cm)
                </label>
                <input
                  type="number"
                  name="altura_cm"
                  value={formData.altura_cm}
                  onChange={handleInputChange}
                  step="0.01"
                  min="0"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.altura_cm ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Ex: 15.5"
                />
                {errors.altura_cm && <p className="text-red-500 text-sm mt-1">{errors.altura_cm}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Ruler className="inline mr-1" size={16} />
                  Largura (cm)
                </label>
                <input
                  type="number"
                  name="largura_cm"
                  value={formData.largura_cm}
                  onChange={handleInputChange}
                  step="0.01"
                  min="0"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.largura_cm ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Ex: 25.0"
                />
                {errors.largura_cm && <p className="text-red-500 text-sm mt-1">{errors.largura_cm}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Ruler className="inline mr-1" size={16} />
                  Comprimento (cm)
                </label>
                <input
                  type="number"
                  name="comprimento_cm"
                  value={formData.comprimento_cm}
                  onChange={handleInputChange}
                  step="0.01"
                  min="0"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.comprimento_cm ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Ex: 35.0"
                />
                {errors.comprimento_cm && <p className="text-red-500 text-sm mt-1">{errors.comprimento_cm}</p>}
              </div>
            </div>
          </div>

          {/* Upload de Múltiplas Imagens */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
              <ImageIcon className="mr-2" size={24} />
              Imagens do Produto
            </h2>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <ImageIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-600 mb-2">Arraste e solte imagens aqui ou clique para selecionar</p>
              <p className="text-sm text-gray-500">Máximo de 10 imagens, até 5MB cada</p>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => {
                  const files = Array.from(e.target.files || [])
                  const newImages = files.map((file) => ({
                    file,
                    preview: URL.createObjectURL(file),
                    id: Math.random().toString(36).substr(2, 9),
                  }))
                  setImages((prev) => [...prev, ...newImages].slice(0, 10))
                }}
                className="hidden"
                id="image-upload"
              />
              <label
                htmlFor="image-upload"
                className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors"
              >
                <Plus className="mr-2" size={16} />
                Selecionar Imagens
              </label>
            </div>

            {images.length > 0 && (
              <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                {images.map((image) => (
                  <div key={image.id} className="relative">
                    <img
                      src={image.preview || "/placeholder.svg"}
                      alt="Preview"
                      className="w-full h-24 object-cover rounded-lg border"
                    />
                    <button
                      type="button"
                      onClick={() => setImages((prev) => prev.filter((img) => img.id !== image.id))}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
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
