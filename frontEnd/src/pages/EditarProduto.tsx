"use client"

import type React from "react"
import { useState, useEffect } from "react"
import axios from "axios"
import Layout from "../components/Layout"
import GaleriaImagensEditavel from "../components/GaleriaImagensEditavel"
import { useNavigate, useParams } from "react-router-dom"
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
  AlertCircle,
} from "lucide-react"

interface Categoria {
  id_categoria: number
  nome: string
  descricao: string
}

interface ImagemExistente {
  id_imagem: number
  url_imagem: string
  nome_arquivo: string
  ordem: number
  is_principal: boolean
}

interface NovaImagemArquivo {
  arquivo: File
  visualizacao: string
  id: string
}

interface Produto {
  id_produto: number
  nome: string
  descricao: string
  preco: number
  marca: string
  modelo: string
  estoque: number
  id_categoria: number
  compatibilidade: string
  cor: string
  ano_fabricacao: number
  status: "ativo" | "inativo"
  categoria_nome: string
  imagens: ImagemExistente[]
}

const EditarProduto: React.FC = () => {
  const navegar = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [mostrarFormularioNovaCategoria, setMostrarFormularioNovaCategoria] = useState(false)
  const [novaCategoria, setNovaCategoria] = useState({ nome: "", descricao: "" })
  const [imagensExistentes, setImagensExistentes] = useState<ImagemExistente[]>([])
  const [novasImagens, setNovasImagens] = useState<NovaImagemArquivo[]>([])
  const [imagensParaRemover, setImagensParaRemover] = useState<number[]>([])

  const [dadosFormulario, setDadosFormulario] = useState({
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
    status: "ativo" as "ativo" | "inativo",
  })

  const [erros, setErros] = useState<Record<string, string>>({})

  // Carregar dados do produto
  const buscarProduto = async () => {
    try {
      const resposta = await axios.get(`http://localhost:3000/produtos/produtos/${id}`)
      const produto: Produto = resposta.data

      setDadosFormulario({
        nome: produto.nome || "",
        descricao: produto.descricao || "",
        preco: produto.preco?.toString() || "",
        marca: produto.marca || "",
        modelo: produto.modelo || "",
        estoque: produto.estoque?.toString() || "",
        id_categoria: produto.id_categoria?.toString() || "",
        compatibilidade: produto.compatibilidade || "",
        cor: produto.cor || "",
        ano_fabricacao: produto.ano_fabricacao?.toString() || "",
        status: produto.status || "ativo",
      })

      setImagensExistentes(produto.imagens || [])
    } catch (err) {
      console.error("Erro ao carregar produto:", err)
      if (axios.isAxiosError(err) && err.response?.status === 404) {
        alert("Produto não encontrado")
        navegar("/gestao/produtos")
      } else {
        alert("Erro ao carregar produto")
      }
    }
  }

  // Carregar categorias
  const buscarCategorias = async () => {
    try {
      const resposta = await axios.get("http://localhost:3000/produtos/categorias")
      setCategorias(resposta.data)
    } catch (err) {
      console.error("Erro ao carregar categorias:", err)
    }
  }

  useEffect(() => {
    if (!id) {
      navegar("/gestao/produtos")
      return
    }

    const carregarDados = async () => {
      setCarregando(true)
      await Promise.all([buscarProduto(), buscarCategorias()])
      setCarregando(false)
    }

    carregarDados()
  }, [id])

  // Validar formulário
  const validarFormulario = () => {
    const novosErros: Record<string, string> = {}

    if (!dadosFormulario.nome.trim()) novosErros.nome = "Nome é obrigatório"
    if (!dadosFormulario.descricao.trim()) novosErros.descricao = "Descrição é obrigatória"
    if (!dadosFormulario.preco || Number.parseFloat(dadosFormulario.preco) <= 0) {
      novosErros.preco = "Preço deve ser maior que zero"
    }
    if (!dadosFormulario.id_categoria) novosErros.id_categoria = "Categoria é obrigatória"
    if (dadosFormulario.estoque && Number.parseInt(dadosFormulario.estoque) < 0) {
      novosErros.estoque = "Estoque não pode ser negativo"
    }
    if (
      dadosFormulario.ano_fabricacao &&
      (Number.parseInt(dadosFormulario.ano_fabricacao) < 1900 ||
        Number.parseInt(dadosFormulario.ano_fabricacao) > new Date().getFullYear())
    ) {
      novosErros.ano_fabricacao = "Ano de fabricação inválido"
    }

    setErros(novosErros)
    return Object.keys(novosErros).length === 0
  }

  // Processar mudanças nos inputs
  const processarMudancaInput = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setDadosFormulario((anterior) => ({ ...anterior, [name]: value }))

    if (erros[name]) {
      setErros((anterior) => ({ ...anterior, [name]: "" }))
    }
  }

  // Processar remoção de imagem
  const processarRemocaoImagem = (idImagem: number) => {
    if (confirm("Tem certeza que deseja remover esta imagem? Esta ação não pode ser desfeita.")) {
      setImagensParaRemover((anterior) => [...anterior, idImagem])
      setImagensExistentes((anterior) => anterior.filter((img) => img.id_imagem !== idImagem))
    }
  }

  // Criar nova categoria
  const processarCriarCategoria = async () => {
    if (!novaCategoria.nome.trim()) {
      alert("Nome da categoria é obrigatório")
      return
    }

    try {
      const token = localStorage.getItem("token")
      await axios.post("http://localhost:3000/produtos/categorias", novaCategoria, {
        headers: { Authorization: `Bearer ${token}` },
      })

      await buscarCategorias()
      setNovaCategoria({ nome: "", descricao: "" })
      setMostrarFormularioNovaCategoria(false)
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

  // Enviar formulário
  const processarEnvio = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validarFormulario()) {
      return
    }

    setSalvando(true)

    try {
      const token = localStorage.getItem("token")
      if (!token) {
        navegar("/login")
        return
      }

      const dadosEnvio = new FormData()

      // Adicionar dados do produto
      Object.entries(dadosFormulario).forEach(([chave, valor]) => {
        if (valor !== null && valor !== "") {
          dadosEnvio.append(chave, valor.toString())
        }
      })

      // Adicionar novas imagens
      novasImagens.forEach((arquivoImagem) => {
        dadosEnvio.append("novas_imagens", arquivoImagem.arquivo)
      })

      // Adicionar IDs das imagens a serem removidas
      if (imagensParaRemover.length > 0) {
        dadosEnvio.append("imagens_removidas", JSON.stringify(imagensParaRemover))
      }

      // Adicionar ID da imagem principal
      const imagemPrincipal = imagensExistentes.find((img) => img.is_principal)
      if (imagemPrincipal) {
        dadosEnvio.append("imagem_principal_id", imagemPrincipal.id_imagem.toString())
      }

      // Adicionar ordens das imagens existentes
      const ordensImagens = imagensExistentes.map((img) => ({
        id_imagem: img.id_imagem,
        ordem: img.ordem,
      }))
      if (ordensImagens.length > 0) {
        dadosEnvio.append("ordens_imagens", JSON.stringify(ordensImagens))
      }

      await axios.put(`http://localhost:3000/produtos/produtos/${id}`, dadosEnvio, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      })

      alert("Produto atualizado com sucesso!")
      navegar("/gestao/produtos")
    } catch (err) {
      console.error("Erro ao atualizar produto:", err)
      if (axios.isAxiosError(err) && err.response) {
        alert(err.response.data.message || "Erro ao atualizar produto")
      } else {
        alert("Erro ao atualizar produto")
      }
    } finally {
      setSalvando(false)
    }
  }

  if (carregando) {
    return (
      <Layout showLoading={true}>
        <div></div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Cabeçalho */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <button
              onClick={() => navegar("/gestao/produtos")}
              className="flex items-center text-gray-600 hover:text-gray-800 mr-4"
            >
              <ArrowLeft size={20} className="mr-1" />
              Voltar
            </button>
            <h1 className="text-3xl font-bold text-gray-800">Editar Produto</h1>
          </div>
          <p className="text-gray-600">Modifique as informações do produto</p>
        </div>

        <form onSubmit={processarEnvio} className="space-y-8">
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
                  value={dadosFormulario.nome}
                  onChange={processarMudancaInput}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    erros.nome ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Ex: Notebook Dell Inspiron 15"
                />
                {erros.nome && <p className="text-red-500 text-sm mt-1">{erros.nome}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <DollarSign className="inline mr-1" size={16} />
                  Preço (R$) *
                </label>
                <input
                  type="number"
                  name="preco"
                  value={dadosFormulario.preco}
                  onChange={processarMudancaInput}
                  step="0.01"
                  min="0"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    erros.preco ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="0.00"
                />
                {erros.preco && <p className="text-red-500 text-sm mt-1">{erros.preco}</p>}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FileText className="inline mr-1" size={16} />
                  Descrição *
                </label>
                <textarea
                  name="descricao"
                  value={dadosFormulario.descricao}
                  onChange={processarMudancaInput}
                  rows={4}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    erros.descricao ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Descreva as características e especificações do produto..."
                />
                {erros.descricao && <p className="text-red-500 text-sm mt-1">{erros.descricao}</p>}
              </div>
            </div>
          </div>

          {/* Categoria e Status */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
              <Layers className="mr-2" size={24} />
              Categoria e Status
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Categoria *</label>
                <div className="flex gap-2">
                  <select
                    name="id_categoria"
                    value={dadosFormulario.id_categoria}
                    onChange={processarMudancaInput}
                    className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      erros.id_categoria ? "border-red-500" : "border-gray-300"
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
                    onClick={() => setMostrarFormularioNovaCategoria(!mostrarFormularioNovaCategoria)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center"
                  >
                    <Plus size={16} className="mr-1" />
                    Nova
                  </button>
                </div>
                {erros.id_categoria && <p className="text-red-500 text-sm mt-1">{erros.id_categoria}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <AlertCircle className="inline mr-1" size={16} />
                  Status
                </label>
                <select
                  name="status"
                  value={dadosFormulario.status}
                  onChange={processarMudancaInput}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="ativo">Ativo</option>
                  <option value="inativo">Inativo</option>
                </select>
              </div>
            </div>

            {/* Formulário de nova categoria */}
            {mostrarFormularioNovaCategoria && (
              <div className="mt-4 border border-gray-200 rounded-lg p-4 bg-gray-50">
                <h3 className="font-medium text-gray-800 mb-3">Nova Categoria</h3>
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Nome da categoria"
                    value={novaCategoria.nome}
                    onChange={(e) => setNovaCategoria((anterior) => ({ ...anterior, nome: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <textarea
                    placeholder="Descrição (opcional)"
                    value={novaCategoria.descricao}
                    onChange={(e) => setNovaCategoria((anterior) => ({ ...anterior, descricao: e.target.value }))}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={processarCriarCategoria}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Criar Categoria
                    </button>
                    <button
                      type="button"
                      onClick={() => setMostrarFormularioNovaCategoria(false)}
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Marca</label>
                <input
                  type="text"
                  name="marca"
                  value={dadosFormulario.marca}
                  onChange={processarMudancaInput}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: Dell, HP, Lenovo"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Modelo</label>
                <input
                  type="text"
                  name="modelo"
                  value={dadosFormulario.modelo}
                  onChange={processarMudancaInput}
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
                  value={dadosFormulario.estoque}
                  onChange={processarMudancaInput}
                  min="0"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    erros.estoque ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="0"
                />
                {erros.estoque && <p className="text-red-500 text-sm mt-1">{erros.estoque}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Palette className="inline mr-1" size={16} />
                  Cor
                </label>
                <input
                  type="text"
                  name="cor"
                  value={dadosFormulario.cor}
                  onChange={processarMudancaInput}
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
                  value={dadosFormulario.ano_fabricacao}
                  onChange={processarMudancaInput}
                  min="1900"
                  max={new Date().getFullYear()}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    erros.ano_fabricacao ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder={new Date().getFullYear().toString()}
                />
                {erros.ano_fabricacao && <p className="text-red-500 text-sm mt-1">{erros.ano_fabricacao}</p>}
              </div>

              <div className="md:col-span-2 lg:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">Compatibilidade</label>
                <textarea
                  name="compatibilidade"
                  value={dadosFormulario.compatibilidade}
                  onChange={processarMudancaInput}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Descreva com quais sistemas, dispositivos ou componentes este produto é compatível..."
                />
              </div>
            </div>
          </div>

          {/* Galeria de Imagens */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
              <ImageIcon className="mr-2" size={24} />
              Imagens do Produto
            </h2>

            <GaleriaImagensEditavel
              imagensExistentes={imagensExistentes}
              novasImagens={novasImagens}
              aoAlterarImagensExistentes={setImagensExistentes}
              aoAlterarNovasImagens={setNovasImagens}
              aoRemoverImagem={processarRemocaoImagem}
              maximoImagens={10}
              tamanhoMaximoPorImagem={5}
            />
          </div>

          {/* Botões de Ação */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navegar("/gestao/produtos")}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={salvando}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {salvando ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="mr-2" size={16} />
                  Atualizar Produto
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  )
}

export default EditarProduto
