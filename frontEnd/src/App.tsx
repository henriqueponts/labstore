import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Login from './pages/Login'
import CadastroCliente from './pages/CadastroCliente.tsx'
import CadastroFuncionario from './pages/CadastroFuncionario.tsx'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/cadastro/cliente" element={<CadastroCliente />} />
        <Route path="/cadastro/funcionario" element={<CadastroFuncionario />} />
        
        {/* Rotas de compatibilidade com o sistema antigo */}
        <Route path="/registro" element={<CadastroFuncionario />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App