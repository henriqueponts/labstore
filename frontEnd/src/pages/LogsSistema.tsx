import { useState, useEffect } from 'react';
import axios from 'axios';
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
      CREATE: 'acao-create',
      UPDATE: 'acao-update',
      DELETE: 'acao-delete',
      LOGIN: 'acao-login',
      LOGOUT: 'acao-logout',
      ESTORNO: 'acao-estorno',
      CANCELAMENTO: 'acao-cancelamento',
      STATUS_CHANGE: 'acao-status',
      STOCK_UPDATE: 'acao-stock'
    };
    return cores[acao] || 'acao-default';
  };

  return (
    <div className="logs-container">
      <div className="logs-header">
        <h1>Logs do Sistema</h1>
        <p>Visualize todas as ações realizadas no sistema</p>
      </div>

      <div className="logs-tabs">
        <button 
          className={`tab-button ${abaMostrada === 'logs' ? 'active' : ''}`}
          onClick={() => setAbaMostrada('logs')}
        >
          Logs
        </button>
        <button 
          className={`tab-button ${abaMostrada === 'estatisticas' ? 'active' : ''}`}
          onClick={() => setAbaMostrada('estatisticas')}
        >
          Estatísticas
        </button>
      </div>

      {abaMostrada === 'logs' && (
        <>
          <div className="logs-filtros">
            <div className="filtro-grupo">
              <label>Data Início:</label>
              <input
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
              />
            </div>

            <div className="filtro-grupo">
              <label>Data Fim:</label>
              <input
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
              />
            </div>

            <div className="filtro-grupo">
              <label>Usuário:</label>
              <input
                type="text"
                placeholder="Nome do usuário"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
              />
            </div>

            <div className="filtro-grupo">
              <label>Ação:</label>
              <select value={acao} onChange={(e) => setAcao(e.target.value)}>
                <option value="">Todas</option>
                {tiposAcao.map((tipo) => (
                  <option key={tipo} value={tipo}>{tipo}</option>
                ))}
              </select>
            </div>

            <div className="filtro-grupo">
              <label>Tabela:</label>
              <select value={tabela} onChange={(e) => setTabela(e.target.value)}>
                <option value="">Todas</option>
                {tabelas.map((tab) => (
                  <option key={tab} value={tab}>{tab}</option>
                ))}
              </select>
            </div>

            <button className="btn-limpar-filtros" onClick={limparFiltros}>
              Limpar Filtros
            </button>
          </div>

          {carregando ? (
            <div className="logs-loading">Carregando logs...</div>
          ) : erro ? (
            <div className="logs-erro">{erro}</div>
          ) : (
            <>
              <div className="logs-tabela-container">
                <table className="logs-tabela">
                  <thead>
                    <tr>
                      <th>Data/Hora</th>
                      <th>Usuário</th>
                      <th>Perfil</th>
                      <th>Ação</th>
                      <th>Tabela</th>
                      <th>Campo</th>
                      <th>Valor Anterior</th>
                      <th>Valor Novo</th>
                      <th>Descrição</th>
                      <th>IP</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="sem-registros">
                          Nenhum log encontrado
                        </td>
                      </tr>
                    ) : (
                      logs.map((log) => (
                        <tr key={log.id_log}>
                          <td>{formatarData(log.data_acao)}</td>
                          <td>{log.nome_usuario}</td>
                          <td>
                            <span className={`badge-perfil ${log.tipo_perfil}`}>
                              {log.tipo_perfil || 'N/A'}
                            </span>
                          </td>
                          <td>
                            <span className={`badge-acao ${getCorAcao(log.acao)}`}>
                              {log.acao}
                            </span>
                          </td>
                          <td>{log.tabela_afetada || '-'}</td>
                          <td>{log.campo_alterado || '-'}</td>
                          <td className="valor-campo">{log.valor_anterior || '-'}</td>
                          <td className="valor-campo">{log.valor_novo || '-'}</td>
                          <td className="descricao-campo">{log.descricao || '-'}</td>
                          <td>{log.ip_address || '-'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {totalPaginas > 1 && (
                <div className="logs-paginacao">
                  <button
                    onClick={() => setPaginaAtual(prev => Math.max(1, prev - 1))}
                    disabled={paginaAtual === 1}
                  >
                    Anterior
                  </button>
                  <span>
                    Página {paginaAtual} de {totalPaginas}
                  </span>
                  <button
                    onClick={() => setPaginaAtual(prev => Math.min(totalPaginas, prev + 1))}
                    disabled={paginaAtual === totalPaginas}
                  >
                    Próxima
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}

      {abaMostrada === 'estatisticas' && estatisticas && (
        <div className="logs-estatisticas">
          <div className="estatistica-card">
            <h3>Total de Ações</h3>
            <div className="estatistica-valor">{estatisticas.total_acoes}</div>
          </div>

          <div className="estatistica-card">
            <h3>Ações por Tipo</h3>
            <div className="estatistica-lista">
              {estatisticas.acoes_por_tipo.map((item) => (
                <div key={item.acao} className="estatistica-item">
                  <span className={`badge-acao ${getCorAcao(item.acao)}`}>
                    {item.acao}
                  </span>
                  <span className="estatistica-numero">{item.total}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="estatistica-card">
            <h3>Usuários Mais Ativos</h3>
            <div className="estatistica-lista">
              {estatisticas.usuarios_mais_ativos.map((item, index) => (
                <div key={index} className="estatistica-item">
                  <span>{item.nome_usuario}</span>
                  <span className={`badge-perfil ${item.tipo_perfil}`}>
                    {item.tipo_perfil}
                  </span>
                  <span className="estatistica-numero">{item.total}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="estatistica-card">
            <h3>Tabelas Mais Alteradas</h3>
            <div className="estatistica-lista">
              {estatisticas.tabelas_mais_alteradas.map((item) => (
                <div key={item.tabela_afetada} className="estatistica-item">
                  <span>{item.tabela_afetada}</span>
                  <span className="estatistica-numero">{item.total}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="estatistica-card">
            <h3>Ações por Dia (Últimos 7 dias)</h3>
            <div className="estatistica-lista">
              {estatisticas.acoes_por_dia.map((item) => (
                <div key={item.data} className="estatistica-item">
                  <span>{new Date(item.data).toLocaleDateString('pt-BR')}</span>
                  <span className="estatistica-numero">{item.total}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LogsSistema;
