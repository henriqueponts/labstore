import { BrowserRouter, Routes, Route } from "react-router-dom"
import Home from "./pages/Home"
import Login from "./pages/Login"
import CadastroCliente from "./pages/CadastroCliente.tsx"
import CadastroFuncionario from "./pages/CadastroFuncionario.tsx"
import GestaoUsuarios from "./pages/GestaoUsuarios.tsx"
import EsqueceuSenha from "./pages/EsqueceuSenha"
import RedefinirSenha from "./pages/RedefinirSenha"
import AlterarSenha from "./pages/AlterarSenha"
import CentralAjudaPage from "./pages/CentralAjudaPage.tsx"
import AdminChamadosPage from "./pages/AdminChamadosPage.tsx"
import CadastroProdutos from "./pages/CadastroProdutos.tsx"
import GestaoProdutos from "./pages/GestaoProdutos.tsx"
import EditarProduto from "./pages/EditarProduto.tsx"
import VisualizarProduto from "./pages/VisualizarProduto.tsx"
import ListagemProdutos from "./pages/ListagemProdutos.tsx"

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/cadastro/cliente" element={<CadastroCliente />} />
        <Route path="/cadastro/funcionario" element={<CadastroFuncionario />} />
        <Route path="/gestao/usuarios" element={<GestaoUsuarios />} />
        <Route path="/esqueceu-senha" element={<EsqueceuSenha />} />
        <Route path="/redefinir-senha" element={<RedefinirSenha />} />
        <Route path="/alterar-senha" element={<AlterarSenha />} />
        <Route path="/central-ajuda" element={<CentralAjudaPage />} />
        <Route path="/gestao/chamados" element={<AdminChamadosPage />} />
        <Route path="/cadastro/produto" element={<CadastroProdutos />} />
        <Route path="/gestao/produtos" element={<GestaoProdutos />} />
        <Route path="/editar/produto/:id" element={<EditarProduto />} />
        <Route path="/produto/:id" element={<VisualizarProduto />} />
        <Route path="/produtos" element={<ListagemProdutos />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
