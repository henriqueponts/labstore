import { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from '../components/Layout';
import { FileText, Calendar, User, Filter, BarChart3, Activity, Users, Database, TrendingUp, Eye, X } from 'lucide-react';
import '../components/LogsSistema.css';

interface Log {
  id_log: number;
  id_usuario: number | null;
  nome_usuario: string;
  tipo_usuario: string | null;
  tipo_perfil: string | null;
  acao: string;
  tabela_afetada: string | null;
  id_registro: number | null;
  campo_alterado: string | null;
  valor_anterior: string | null;
  valor_novo: string | null;
  descricao: string | null;
  ip_address: string | null;
  data_acao: string;
}

interface Estatisticas {
  total_acoes: number;
  acoes_por_tipo: Array<{ acao: string; total: number }>;
  usuarios_mais_ativos: Array<{ nome_usuario: string; tipo_perfil: string; total: number }>;
  tabelas_mais_alteradas: Array<{ tabela_afetada: string; total: number }>;
  acoes_por_dia: Array<{ data: string; total: number }>;
}

const LogsSistema = () => {
  const [logs, setLogs] = useState<Log[]>([]);
  const [estatisticas, setEstatisticas] = useState<Estatisticas | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  
  // Filtros
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [usuario, setUsuario] = useState('');
  const [acao, setAcao] = useState('');
  const [tabela, setTabela] = useState('');
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  
  // Opções de filtros
  const [tiposAcao, setTiposAcao] = useState<string[]>([]);
  const [tabelas, setTabelas] = useState<string[]>([]);
  
  const [abaMostrada, setAbaMostrada] = useState<'logs' | 'estatisticas'>('logs');
  const [logSelecionado, setLogSelecionado] = useState<Log | null>(null);
  const [mostrarModal, setMostrarModal] = useState(false);

  useEffect(() => {
    buscarLogs();
    buscarEstatisticas();
    buscarTiposAcao();
    buscarTabelas();
  }, [paginaAtual, dataInicio, dataFim, usuario, acao, tabela]);

  const buscarLogs = async () => {
    try {
      setCarregando(true);
      const token = localStorage.getItem('token');
      
      const params = new URLSearchParams();
      if (dataInicio) params.append('data_inicio', dataInicio);
      if (dataFim) params.append('data_fim', dataFim);
      if (usuario) params.append('usuario', usuario);
      if (acao) params.append('acao', acao);
      if (tabela) params.append('tabela', tabela);
      params.append('pagina', paginaAtual.toString());
      params.append('limite', '50');
      
      const response = await axios.get(
        `http://localhost:3000/logs?${params.toString()}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setLogs(response.data.logs);
      setTotalPaginas(response.data.paginacao.total_paginas);
      setErro(null);
    } catch (error) {
      console.error('Erro ao buscar logs:', error);
      setErro('Erro ao carregar logs do sistema');
    } finally {
      setCarregando(false);
    }
  };

  const buscarEstatisticas = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const params = new URLSearchParams();
      if (dataInicio) params.append('data_inicio', dataInicio);
      if (dataFim) params.append('data_fim', dataFim);
      
      const response = await axios.get(
        `http://localhost:3000/logs/estatisticas?${params.toString()}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setEstatisticas(response.data);
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
    }
  };

  const buscarTiposAcao = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:3000/logs/tipos-acao', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTiposAcao(response.data);
    } catch (error) {
      console.error('Erro ao buscar tipos de ação:', error);
    }
  };

  const buscarTabelas = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:3000/logs/tabelas', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTabelas(response.data);
    } catch (error) {
      console.error('Erro ao buscar tabelas:', error);
    }
  };

  const limparFiltros = () => {
    setDataInicio('');
    setDataFim('');
    setUsuario('');
    setAcao('');
    setTabela('');
    setPaginaAtual(1);
  };

  const formatarData = (dataISO: string) => {
    const data = new Date(dataISO);
    return data.toLocaleString('pt-BR');
  };

  const getCorAcao = (acao: string) => {
    const cores: { [key: string]: string } = {
      CREATE: 'bg-green-100 text-green-800',
      UPDATE: 'bg-blue-100 text-blue-800',
      DELETE: 'bg-red-100 text-red-800',
      LOGIN: 'bg-purple-100 text-purple-800',
      LOGOUT: 'bg-gray-100 text-gray-800',
      ESTORNO: 'bg-orange-100 text-orange-800',
      CANCELAMENTO: 'bg-orange-100 text-orange-800',
      STATUS_CHANGE: 'bg-orange-100 text-orange-800',
      STOCK_UPDATE: 'bg-blue-100 text-blue-800'
    };
    return cores[acao] || 'bg-gray-100 text-gray-800';
  };

  const abrirDetalhes = (log: Log) => {
    setLogSelecionado(log);
    setMostrarModal(true);
  };

  const fecharModal = () => {
    setLogSelecionado(null);
    setMostrarModal(false);
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <FileText className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Logs do Sistema</h1>
              <p className="text-gray-600">Visualize todas as ações realizadas no sistema</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex">
              <button
                onClick={() => setAbaMostrada('logs')}
                className={`px-6 py-4 text-sm font-medium transition-colors flex items-center ${
                  abaMostrada === 'logs'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Activity className="mr-2" size={18} />
                Logs
              </button>
              <button
                onClick={() => setAbaMostrada('estatisticas')}
                className={`px-6 py-4 text-sm font-medium transition-colors flex items-center ${
                  abaMostrada === 'estatisticas'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <BarChart3 className="mr-2" size={18} />
                Estatísticas
              </button>
            </nav>
          </div>
        </div>

        {abaMostrada === 'logs' && (
          <>
            {/* Filtros */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="inline mr-1" size={16} />
                    Data Início
                  </label>
                  <input
                    type="date"
                    value={dataInicio}
                    onChange={(e) => setDataInicio(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="inline mr-1" size={16} />
                    Data Fim
                  </label>
                  <input
                    type="date"
                    value={dataFim}
                    onChange={(e) => setDataFim(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <User className="inline mr-1" size={16} />
                    Usuário
                  </label>
                  <input
                    type="text"
                    placeholder="Nome do usuário"
                    value={usuario}
                    onChange={(e) => setUsuario(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Filter className="inline mr-1" size={16} />
                    Ação
                  </label>
                  <select
                    value={acao}
                    onChange={(e) => setAcao(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Todas</option>
                    {tiposAcao.map((tipo) => (
                      <option key={tipo} value={tipo}>{tipo}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Database className="inline mr-1" size={16} />
                    Tabela
                  </label>
                  <select
                    value={tabela}
                    onChange={(e) => setTabela(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Todas</option>
                    {tabelas.map((tab) => (
                      <option key={tab} value={tab}>{tab}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    onClick={limparFiltros}
                    className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Limpar Filtros
                  </button>
                </div>
              </div>
            </div>

            {/* Lista de Logs */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-800">
                  Registros de Logs ({logs.length})
                </h2>
              </div>

              {carregando ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  <p className="mt-4 text-gray-600">Carregando logs...</p>
                </div>
              ) : erro ? (
                <div className="text-center py-12">
                  <Activity className="mx-auto h-12 w-12 text-red-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Erro ao carregar logs</h3>
                  <p className="text-red-500">{erro}</p>
                </div>
              ) : logs.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum log encontrado</h3>
                  <p className="text-gray-500">Tente ajustar os filtros de busca.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Data/Hora
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Usuário
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ação
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tabela
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Descrição
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Detalhes
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {logs.map((log) => (
                        <tr key={log.id_log} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatarData(log.data_acao)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <User className="h-5 w-5 text-gray-400 mr-2" />
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {log.nome_usuario}
                                </div>
                                {log.tipo_perfil && (
                                  <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${
                                    log.tipo_perfil === 'ADMIN' 
                                      ? 'bg-red-100 text-red-800' 
                                      : log.tipo_perfil === 'ANALISTA'
                                      ? 'bg-blue-100 text-blue-800'
                                      : 'bg-gray-100 text-gray-800'
                                  }`}>
                                    {log.tipo_perfil}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getCorAcao(log.acao)}`}>
                              {log.acao}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {log.tabela_afetada || '-'}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 max-w-md">
                            <div className="truncate">
                              {log.descricao || '-'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => abrirDetalhes(log)}
                              className="text-blue-600 hover:text-blue-800 flex items-center"
                              title="Ver detalhes completos"
                            >
                              <Eye size={16} className="mr-1" />
                              Ver mais
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {totalPaginas > 1 && (
                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                  <button
                    onClick={() => setPaginaAtual(prev => Math.max(1, prev - 1))}
                    disabled={paginaAtual === 1}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    Anterior
                  </button>
                  <span className="text-sm text-gray-700">
                    Página {paginaAtual} de {totalPaginas}
                  </span>
                  <button
                    onClick={() => setPaginaAtual(prev => Math.min(totalPaginas, prev + 1))}
                    disabled={paginaAtual === totalPaginas}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    Próxima
                  </button>
                </div>
              )}
            </div>
          </>
        )}

        {abaMostrada === 'estatisticas' && estatisticas && (
          <>
            {/* Cards de Estatísticas */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <Activity className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total de Ações</p>
                    <p className="text-2xl font-semibold text-gray-900">{estatisticas.total_acoes}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <Users className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Usuários Ativos</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {estatisticas.usuarios_mais_ativos.length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <Database className="h-8 w-8 text-purple-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Tabelas Alteradas</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {estatisticas.tabelas_mais_alteradas.length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <TrendingUp className="h-8 w-8 text-orange-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Tipos de Ação</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {estatisticas.acoes_por_tipo.length}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Detalhes das Estatísticas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <Filter className="mr-2" size={20} />
                  Ações por Tipo
                </h3>
                <div className="space-y-3">
                  {estatisticas.acoes_por_tipo.map((item) => (
                    <div key={item.acao} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getCorAcao(item.acao)}`}>
                        {item.acao}
                      </span>
                      <span className="text-lg font-semibold text-blue-600">{item.total}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <Users className="mr-2" size={20} />
                  Usuários Mais Ativos
                </h3>
                <div className="space-y-3">
                  {estatisticas.usuarios_mais_ativos.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <User className="h-5 w-5 text-gray-400 mr-2" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{item.nome_usuario}</div>
                          <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${
                            item.tipo_perfil === 'ADMIN' 
                              ? 'bg-red-100 text-red-800' 
                              : item.tipo_perfil === 'ANALISTA'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {item.tipo_perfil}
                          </span>
                        </div>
                      </div>
                      <span className="text-lg font-semibold text-blue-600">{item.total}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <Database className="mr-2" size={20} />
                  Tabelas Mais Alteradas
                </h3>
                <div className="space-y-3">
                  {estatisticas.tabelas_mais_alteradas.map((item) => (
                    <div key={item.tabela_afetada} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-900">{item.tabela_afetada}</span>
                      <span className="text-lg font-semibold text-blue-600">{item.total}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <Calendar className="mr-2" size={20} />
                  Ações por Dia (Últimos 7 dias)
                </h3>
                <div className="space-y-3">
                  {estatisticas.acoes_por_dia.map((item) => (
                    <div key={item.data} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-900">
                        {new Date(item.data).toLocaleDateString('pt-BR')}
                      </span>
                      <span className="text-lg font-semibold text-blue-600">{item.total}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {mostrarModal && logSelecionado && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white">
              <h3 className="text-xl font-semibold text-gray-900">Detalhes do Log</h3>
              <button
                onClick={fecharModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Data/Hora</label>
                  <p className="text-gray-900">{formatarData(logSelecionado.data_acao)}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Usuário</label>
                  <div className="flex items-center">
                    <p className="text-gray-900 mr-2">{logSelecionado.nome_usuario}</p>
                    {logSelecionado.tipo_perfil && (
                      <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${
                        logSelecionado.tipo_perfil === 'ADMIN' 
                          ? 'bg-red-100 text-red-800' 
                          : logSelecionado.tipo_perfil === 'ANALISTA'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {logSelecionado.tipo_perfil}
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Ação</label>
                  <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getCorAcao(logSelecionado.acao)}`}>
                    {logSelecionado.acao}
                  </span>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">IP</label>
                  <p className="text-gray-900">{logSelecionado.ip_address || '-'}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Tabela Afetada</label>
                  <p className="text-gray-900">{logSelecionado.tabela_afetada || '-'}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Campo Alterado</label>
                  <p className="text-gray-900">{logSelecionado.campo_alterado || '-'}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Descrição</label>
                <p className="text-gray-900 bg-gray-50 p-4 rounded-lg whitespace-pre-wrap">
                  {logSelecionado.descricao || '-'}
                </p>
              </div>

              {(logSelecionado.valor_anterior || logSelecionado.valor_novo) && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Valor Anterior</label>
                    <p className="text-gray-900 bg-red-50 p-4 rounded-lg break-words">
                      {logSelecionado.valor_anterior || '-'}
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Valor Novo</label>
                    <p className="text-gray-900 bg-green-50 p-4 rounded-lg break-words">
                      {logSelecionado.valor_novo || '-'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end">
              <button
                onClick={fecharModal}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default LogsSistema;
