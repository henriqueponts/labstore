import { BrowserRouter, Routes, Route } from "react-router-dom"
import { CartProvider } from "./context/CartContext"
import Home from "./pages/Home"
import LoginComLGPD from "./pages/Login"
import CadastroClienteComLGPD from "./pages/CadastroCliente"
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
import GestaoLGPD from "./pages/GestaoLGPD.tsx"
import NovoTermoLGPD from "./pages/NovoTermoLGPD.tsx"
import VisualizarTermo from "./pages/VisualizarTermo"
import CarrinhoPage from "./pages/CarrinhoPage.tsx"
import EditarHome from "./pages/EditarHome.tsx"
import AguardoPagamento from "./pages/AguardoPagamento"
import PagamentoSucesso from "./pages/PagamentoSucesso"
import MeusPedidos from "./pages/MeusPedidos.tsx"
import NovaSolicitacaoAssistencia from "./pages/NovaSolicitacaoAssistencia.tsx"
import AcompanharSolicitacoes from "./pages/AcompanharSolicitacoes.tsx"
import GestaoSolicitacoes from "./pages/GestaoSolicitacoes.tsx"
import DetalhesSolicitacao from "./pages/DetalhesSolicitacao.tsx"
import RelatorioClientes from "./pages/RelatorioClientes.tsx"

function App() {
  return (
    <CartProvider>
      <BrowserRouter>
        <Routes>
          {/* Rotas Autenticação */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<LoginComLGPD />} />
          <Route path="/cadastro/cliente" element={<CadastroClienteComLGPD />} />
          <Route path="/cadastro/funcionario" element={<CadastroFuncionario />} />
          <Route path="/gestao/usuarios" element={<GestaoUsuarios />} />
          <Route path="/esqueceu-senha" element={<EsqueceuSenha />} />
          <Route path="/redefinir-senha" element={<RedefinirSenha />} />
          <Route path="/alterar-senha" element={<AlterarSenha />} />

          {/* Rotas Chamados */}
          <Route path="/central-ajuda" element={<CentralAjudaPage />} />
          <Route path="/gestao/chamados" element={<AdminChamadosPage />} />

          {/* Rotas Produtos */}
          <Route path="/cadastro/produto" element={<CadastroProdutos />} />
          <Route path="/gestao/produtos" element={<GestaoProdutos />} />
          <Route path="/editar/produto/:id" element={<EditarProduto />} />
          <Route path="/produto/:id" element={<VisualizarProduto />} />
          <Route path="/produtos" element={<ListagemProdutos />} />

          {/* Rotas Carrinho */}
          <Route path="/carrinho" element={<CarrinhoPage />} />
          <Route path="/meus-pedidos" element={<MeusPedidos />} />
          <Route path="/aguardo-pagamento" element={<AguardoPagamento />} />
          <Route path="/pagamento-sucesso" element={<PagamentoSucesso />} />

          {/* Rota Editar Home */}          
          <Route path="/editar-home" element={<EditarHome />} />

          {/* Rotas LGPD */}
          <Route path="/gestao/lgpd" element={<GestaoLGPD />} />
          <Route path="/gestao/lgpd/novo-termo" element={<NovoTermoLGPD />} />
          <Route path="/gestao/lgpd/editar-termo/:id" element={<NovoTermoLGPD />} />
          <Route path="/gestao/lgpd/termo/:id" element={<VisualizarTermo />} />
          <Route path="/visualizar-termo/:id" element={<VisualizarTermo />} />

          {/* Rotas Assistência Técnica */}
          <Route path="/nova-solicitacao-assistencia" element={<NovaSolicitacaoAssistencia />} />
          <Route path="/acompanhar-solicitacoes" element={<AcompanharSolicitacoes />} />
          <Route path="/gestao/solicitacoes" element={<GestaoSolicitacoes />} />
          <Route path="/acompanhar-solicitacoes/:id" element={<DetalhesSolicitacao />} />

          {/* Rotas Relatórios */}
          <Route path="/relatorios/clientes" element={<RelatorioClientes />} />
        </Routes>
      </BrowserRouter>
    </CartProvider>
  )
}

export default App
