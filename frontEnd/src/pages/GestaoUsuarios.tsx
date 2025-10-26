"use client"

import type React from "react"
import { useState, useEffect } from "react"
import axios from "axios"
import Layout from "../components/Layout"
import { useNavigate } from "react-router-dom"
import {
  Users,
  UserCheck,
  UserX,
  Edit3,
  Shield,
  ShieldCheck,
  Calendar,
  Mail,
  Phone,
  User,
  Search,
  Filter,
  Save,
  X,
  BarChart3,
} from "lucide-react"

interface Usuario {
  id_usuario: number
  nome: string
  email: string
  tipo_perfil: "admin" | "analista"
  data_cadastro: string
  status: "ativo" | "inativo"
}

interface Cliente {
  id_cliente: number
  nome: string
  email: string
  telefone: string
  data_cadastro: string
  status: "ativo" | "inativo"
}

interface SearchFilters {
  nome: string
  email: string
  telefone: string
  status: string
}

const GestaoUsuarios: React.FC = () => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [activeTab, setActiveTab] = useState<"usuarios" | "clientes">("usuarios")
  const [editingUserId, setEditingUserId] = useState<number | null>(null)
  const [editingClienteId, setEditingClienteId] = useState<number | null>(null)
  const [newProfile, setNewProfile] = useState<"admin" | "analista">("analista")

  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    nome: "",
    email: "",
    telefone: "",
    status: "",
  })
  const [showFilters, setShowFilters] = useState(false)

  const [editingUserData, setEditingUserData] = useState({
    nome: "",
    email: "",
  })
  const [editingClienteData, setEditingClienteData] = useState({
    nome: "",
    telefone: "",
  })

  const navigate = useNavigate()

  const fetchData = async (useFilters = false) => {
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        navigate("/")
        return
      }

      const headers = { Authorization: `Bearer ${token}` }

      let usuariosUrl = "http://localhost:3000/gestao/usuarios"
      let clientesUrl = "http://localhost:3000/gestao/clientes"

      if (useFilters) {
        const params = new URLSearchParams()
        if (searchFilters.nome) params.append("nome", searchFilters.nome)
        if (searchFilters.email) params.append("email", searchFilters.email)
        if (searchFilters.telefone) params.append("telefone", searchFilters.telefone)
        if (searchFilters.status) params.append("status", searchFilters.status)

        if (params.toString()) {
          usuariosUrl += `/buscar?${params.toString()}`
          clientesUrl += `/buscar?${params.toString()}`
        }
      }

      const [usuariosRes, clientesRes] = await Promise.all([
        axios.get(usuariosUrl, { headers }),
        axios.get(clientesUrl, { headers }),
      ])

      setUsuarios(usuariosRes.data)
      setClientes(clientesRes.data)
    } catch (err) {
      console.error("Erro ao carregar dados:", err)
      if (axios.isAxiosError(err) && err.response?.status === 403) {
        setError("Acesso negado. Apenas funcionários podem acessar esta página.")
      } else {
        setError("Erro ao carregar dados. Tente novamente.")
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleSearch = () => {
    setLoading(true)
    fetchData(true)
  }

  const clearFilters = () => {
    setSearchFilters({
      nome: "",
      email: "",
      telefone: "",
      status: "",
    })
    setLoading(true)
    fetchData(false)
  }

  const startEditingUser = async (userId: number) => {
    try {
      const token = localStorage.getItem("token")
      const response = await axios.get(`http://localhost:3000/gestao/usuarios/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      setEditingUserData({
        nome: response.data.nome,
        email: response.data.email,
      })
      setEditingUserId(userId)
    } catch (err) {
      console.error("Erro ao carregar dados do usuário:", err)
      alert("Erro ao carregar dados do usuário")
    }
  }

  const saveUserEdit = async () => {
    try {
      const token = localStorage.getItem("token")
      await axios.put(`http://localhost:3000/gestao/usuarios/${editingUserId}/editar`, editingUserData, {
        headers: { Authorization: `Bearer ${token}` },
      })

      // Update local state
      setUsuarios(
        usuarios.map((user) =>
          user.id_usuario === editingUserId
            ? { ...user, nome: editingUserData.nome, email: editingUserData.email }
            : user,
        ),
      )

      setEditingUserId(null)
      alert("Dados do usuário atualizados com sucesso!")
    } catch (err) {
      console.error("Erro ao salvar usuário:", err)
      if (axios.isAxiosError(err) && err.response) {
        alert(err.response.data.message || "Erro ao salvar dados")
      } else {
        alert("Erro ao salvar dados")
      }
    }
  }

  const startEditingCliente = async (clienteId: number) => {
    try {
      const token = localStorage.getItem("token")
      const response = await axios.get(`http://localhost:3000/gestao/clientes/${clienteId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      setEditingClienteData({
        nome: response.data.nome,
        telefone: response.data.telefone || "",
      })
      setEditingClienteId(clienteId)
    } catch (err) {
      console.error("Erro ao carregar dados do cliente:", err)
      alert("Erro ao carregar dados do cliente")
    }
  }

  const saveClienteEdit = async () => {
    try {
      const token = localStorage.getItem("token")
      await axios.put(`http://localhost:3000/gestao/clientes/${editingClienteId}/editar`, editingClienteData, {
        headers: { Authorization: `Bearer ${token}` },
      })

      // Update local state
      setClientes(
        clientes.map((cliente) =>
          cliente.id_cliente === editingClienteId ? { ...cliente, ...editingClienteData } : cliente,
        ),
      )

      setEditingClienteId(null)
      alert("Dados do cliente atualizados com sucesso!")
    } catch (err) {
      console.error("Erro ao salvar cliente:", err)
      if (axios.isAxiosError(err) && err.response) {
        alert(err.response.data.message || "Erro ao salvar dados")
      } else {
        alert("Erro ao salvar dados")
      }
    }
  }

  // Alterar perfil de usuário
  const alterarPerfil = async (userId: number, novoPerfil: "admin" | "analista") => {
    try {
      const token = localStorage.getItem("token")
      await axios.put(
        `http://localhost:3000/gestao/usuarios/${userId}/perfil`,
        { tipo_perfil: novoPerfil },
        { headers: { Authorization: `Bearer ${token}` } },
      )

      // Atualizar lista local
      setUsuarios(usuarios.map((user) => (user.id_usuario === userId ? { ...user, tipo_perfil: novoPerfil } : user)))

      setEditingUserId(null)
      alert("Perfil alterado com sucesso!")
    } catch (err) {
      console.error("Erro ao alterar perfil:", err)
      if (axios.isAxiosError(err) && err.response) {
        alert(err.response.data.message || "Erro ao alterar perfil")
      } else {
        alert("Erro ao alterar perfil")
      }
    }
  }

  // Inativar/Reativar usuário
  const toggleUsuarioStatus = async (userId: number, isActive: boolean) => {
    try {
      const token = localStorage.getItem("token")
      const action = isActive ? "inativar" : "reativar"

      await axios.put(
        `http://localhost:3000/gestao/usuarios/${userId}/${action}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      )

      // Atualizar lista local
      setUsuarios(
        usuarios.map((user) =>
          user.id_usuario === userId ? { ...user, status: isActive ? "inativo" : "ativo" } : user,
        ),
      )

      alert(`Usuário ${isActive ? "inativado" : "reativado"} com sucesso!`)
    } catch (err) {
      console.error("Erro ao alterar status:", err)
      if (axios.isAxiosError(err) && err.response) {
        alert(err.response.data.message || "Erro ao alterar status")
      } else {
        alert("Erro ao alterar status")
      }
    }
  }

  // Inativar/Reativar cliente
  const toggleClienteStatus = async (clienteId: number, isActive: boolean) => {
    try {
      const token = localStorage.getItem("token")
      const action = isActive ? "inativar" : "reativar"

      await axios.put(
        `http://localhost:3000/gestao/clientes/${clienteId}/${action}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      )

      // Atualizar lista local
      setClientes(
        clientes.map((cliente) =>
          cliente.id_cliente === clienteId ? { ...cliente, status: isActive ? "inativo" : "ativo" } : cliente,
        ),
      )

      alert(`Cliente ${isActive ? "inativado" : "reativado"} com sucesso!`)
    } catch (err) {
      console.error("Erro ao alterar status:", err)
      if (axios.isAxiosError(err) && err.response) {
        alert(err.response.data.message || "Erro ao alterar status")
      } else {
        alert("Erro ao alterar status")
      }
    }
  }

  // Formatar data
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (loading) {
    return (
      <Layout showLoading={true}>
        <div></div>
      </Layout>
    )
  }

  if (error) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">{error}</div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          {/* Linha com título e botão */}
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">
              Gestão de Usuários e Clientes
            </h1>

            <button
              onClick={() => navigate("/relatorios/clientes")}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors shadow-md"
            >
              <BarChart3 size={20} />
              Dashboard
            </button>
          </div>

          {/* Subtítulo / descrição */}
          <p className="text-gray-600 mt-2">
            Gerencie funcionários e clientes do sistema
          </p>
        </div>



        <div className="mb-6 bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center">
              <Filter size={20} className="mr-2" />
              Filtros de Pesquisa
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
              <input
                type="text"
                value={searchFilters.nome}
                onChange={(e) => setSearchFilters({ ...searchFilters, nome: e.target.value })}
                placeholder="Buscar por nome"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="text"
                value={searchFilters.email}
                onChange={(e) => setSearchFilters({ ...searchFilters, email: e.target.value })}
                placeholder="Buscar por email"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
              <input
                type="text"
                value={searchFilters.telefone}
                onChange={(e) => setSearchFilters({ ...searchFilters, telefone: e.target.value })}
                placeholder="Buscar por telefone"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={searchFilters.status}
                onChange={(e) => setSearchFilters({ ...searchFilters, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos</option>
                <option value="ativo">Ativo</option>
                <option value="inativo">Inativo</option>
              </select>
            </div>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={handleSearch}
              className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
            >
              <Search size={18} className="mr-2" />
              Buscar
            </button>
            <button
              onClick={clearFilters}
              className="flex items-center bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
            >
              <X size={18} className="mr-2" />
              Limpar Filtros
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab("usuarios")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === "usuarios"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
              >
                <div className="flex items-center">
                  <Users size={20} className="mr-2" />
                  Funcionários ({usuarios.length})
                </div>
              </button>
              <button
                onClick={() => setActiveTab("clientes")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === "clientes"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
              >
                <div className="flex items-center">
                  <User size={20} className="mr-2" />
                  Clientes ({clientes.length})
                </div>
              </button>
            </nav>
          </div>
        </div>

        {/* Conteúdo das Tabs */}
        {activeTab === "usuarios" ? (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-800">Lista de Funcionários</h2>
              <button
                onClick={() => navigate("/cadastro/funcionario")}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center"
              >
                <Users size={20} className="mr-2" />
                Adicionar Funcionário
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nome
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Perfil
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data Cadastro
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {usuarios.map((usuario) => (
                    <tr key={usuario.id_usuario} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingUserId === usuario.id_usuario ? (
                          <input
                            type="text"
                            value={editingUserData.nome}
                            onChange={(e) => setEditingUserData({ ...editingUserData, nome: e.target.value })}
                            className="text-sm font-medium text-gray-900 border border-gray-300 rounded px-2 py-1 w-full"
                          />
                        ) : (
                          <div className="text-sm font-medium text-gray-900">{usuario.nome}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingUserId === usuario.id_usuario ? (
                          <input
                            type="email"
                            value={editingUserData.email}
                            onChange={(e) => setEditingUserData({ ...editingUserData, email: e.target.value })}
                            className="text-sm text-gray-900 border border-gray-300 rounded px-2 py-1 w-full"
                          />
                        ) : (
                          <div className="flex items-center">
                            <Mail size={16} className="text-gray-400 mr-2" />
                            <span className="text-sm text-gray-900">{usuario.email}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${usuario.tipo_perfil === "admin"
                            ? "bg-purple-100 text-purple-800"
                            : "bg-green-100 text-green-800"
                            }`}
                        >
                          {usuario.tipo_perfil === "admin" ? (
                            <>
                              <Shield size={12} className="mr-1" /> Admin
                            </>
                          ) : (
                            <>
                              <ShieldCheck size={12} className="mr-1" /> Técnico
                            </>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-500">
                          <Calendar size={16} className="mr-2" />
                          {formatDate(usuario.data_cadastro)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${usuario.status === "ativo" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                            }`}
                        >
                          {usuario.status === "ativo" ? (
                            <>
                              <UserCheck size={12} className="mr-1" /> Ativo
                            </>
                          ) : (
                            <>
                              <UserX size={12} className="mr-1" /> Inativo
                            </>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          {editingUserId === usuario.id_usuario ? (
                            <>
                              <button
                                onClick={saveUserEdit}
                                className="text-green-600 hover:text-green-800"
                                title="Salvar"
                              >
                                <Save size={16} />
                              </button>
                              <button
                                onClick={() => setEditingUserId(null)}
                                className="text-red-600 hover:text-red-800"
                                title="Cancelar"
                              >
                                <X size={16} />
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => startEditingUser(usuario.id_usuario)}
                              className="text-blue-600 hover:text-blue-800"
                              title="Editar Dados"
                            >
                              <Edit3 size={16} />
                            </button>
                          )}
                          <button
                            onClick={() => toggleUsuarioStatus(usuario.id_usuario, usuario.status === "ativo")}
                            className={`${usuario.status === "ativo"
                              ? "text-red-600 hover:text-red-800"
                              : "text-green-600 hover:text-green-800"
                              }`}
                            title={usuario.status === "ativo" ? "Inativar" : "Reativar"}
                          >
                            {usuario.status === "ativo" ? <UserX size={16} /> : <UserCheck size={16} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">Lista de Clientes</h2>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nome
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Telefone
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data Cadastro
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {clientes.map((cliente) => (
                    <tr key={cliente.id_cliente} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingClienteId === cliente.id_cliente ? (
                          <input
                            type="text"
                            value={editingClienteData.nome}
                            onChange={(e) => setEditingClienteData({ ...editingClienteData, nome: e.target.value })}
                            className="text-sm font-medium text-gray-900 border border-gray-300 rounded px-2 py-1 w-full"
                          />
                        ) : (
                          <div className="flex items-center">
                            <User size={16} className="text-gray-400 mr-2" />
                            <span className="text-sm font-medium text-gray-900">{cliente.nome}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Mail size={16} className="text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900">{cliente.email}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingClienteId === cliente.id_cliente ? (
                          <input
                            type="text"
                            value={editingClienteData.telefone}
                            onChange={(e) => setEditingClienteData({ ...editingClienteData, telefone: e.target.value })}
                            placeholder="Telefone"
                            className="text-sm text-gray-900 border border-gray-300 rounded px-2 py-1 w-full"
                          />
                        ) : (
                          <div className="flex items-center">
                            <Phone size={16} className="text-gray-400 mr-2" />
                            <span className="text-sm text-gray-900">{cliente.telefone || "Não informado"}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-500">
                          <Calendar size={16} className="mr-2" />
                          {formatDate(cliente.data_cadastro)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${cliente.status === "ativo" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                            }`}
                        >
                          {cliente.status === "ativo" ? (
                            <>
                              <UserCheck size={12} className="mr-1" /> Ativo
                            </>
                          ) : (
                            <>
                              <UserX size={12} className="mr-1" /> Inativo
                            </>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          {editingClienteId === cliente.id_cliente ? (
                            <>
                              <button
                                onClick={saveClienteEdit}
                                className="text-green-600 hover:text-green-800"
                                title="Salvar"
                              >
                                <Save size={16} />
                              </button>
                              <button
                                onClick={() => setEditingClienteId(null)}
                                className="text-red-600 hover:text-red-800"
                                title="Cancelar"
                              >
                                <X size={16} />
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => startEditingCliente(cliente.id_cliente)}
                              className="text-blue-600 hover:text-blue-800"
                              title="Editar Dados"
                            >
                              <Edit3 size={16} />
                            </button>
                          )}
                          <button
                            onClick={() => toggleClienteStatus(cliente.id_cliente, cliente.status === "ativo")}
                            className={`${cliente.status === "ativo"
                              ? "text-red-600 hover:text-red-800"
                              : "text-green-600 hover:text-green-800"
                              }`}
                            title={cliente.status === "ativo" ? "Inativar" : "Reativar"}
                          >
                            {cliente.status === "ativo" ? <UserX size={16} /> : <UserCheck size={16} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Estatísticas */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Funcionários</p>
                <p className="text-2xl font-semibold text-gray-900">{usuarios.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Administradores</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {usuarios.filter((u) => u.tipo_perfil === "admin").length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <User className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Clientes</p>
                <p className="text-2xl font-semibold text-gray-900">{clientes.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <UserCheck className="h-8 w-8 text-emerald-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Clientes Ativos</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {clientes.filter((c) => c.status === "ativo").length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default GestaoUsuarios
