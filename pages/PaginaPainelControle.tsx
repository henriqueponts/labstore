import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { UserRole, DashboardStats } from '../types';
import Card from '../components/ui/Card';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { buscarEstatisticasPainel } from '../services/apiService'; // Alterado para apiService
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const AdminDashboard: React.FC<{ stats: DashboardStats }> = ({ stats }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    <Card title="Total de Clientes">
      <p className="text-3xl font-bold text-unifafibe_blue">{stats.totalClientes}</p>
    </Card>
    <Card title="Vendas no Período">
      <p className="text-3xl font-bold text-unifafibe_blue">{stats.vendasPeriodo}</p>
    </Card>
    <Card title="Assistências Técnicas">
      <p className="text-3xl font-bold text-unifafibe_blue">{stats.assistenciasPeriodo}</p>
    </Card>
    <Card title="Visão Geral (Últimos 30 dias)" className="md:col-span-2 lg:col-span-3">
        <ResponsiveContainer width="100%" height={300}>
            <BarChart data={[{name: 'Vendas', uv: stats.vendasPeriodo}, {name: 'Assistências', uv: stats.assistenciasPeriodo}, {name: 'Clientes Novos', uv: Math.floor(stats.totalClientes / 10)}]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="uv" fill="#F58220" name="Quantidade"/>
            </BarChart>
        </ResponsiveContainer>
    </Card>
  </div>
);

const AnalystDashboard: React.FC<{ stats: DashboardStats }> = ({ stats }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    <Card title="Assistências Técnicas">
      <p className="text-3xl font-bold text-unifafibe_blue">{stats.assistenciasPeriodo}</p>
      {stats.chamadosAbertos !== undefined && <p className="text-sm text-unifafibe_gray">Chamados abertos: {stats.chamadosAbertos}</p>}
    </Card>
    <Card title="Vendas no Período (informativo)">
      <p className="text-3xl font-bold text-unifafibe_blue">{stats.vendasPeriodo}</p>
    </Card>
     <Card title="Performance (Últimos 30 dias)" className="md:col-span-2">
        <ResponsiveContainer width="100%" height={300}>
            <BarChart data={[{name: 'Assistências Realizadas', uv: stats.assistenciasPeriodo}, {name: 'Chamados Abertos', uv: stats.chamadosAbertos || 0}]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="uv" fill="#005A9C" name="Quantidade" />
            </BarChart>
        </ResponsiveContainer>
    </Card>
  </div>
);

const ClientDashboard: React.FC<{ stats: DashboardStats }> = ({ stats }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    <Card title="Meus Pedidos Recentes">
      <p className="text-3xl font-bold text-unifafibe_blue">{stats.novosPedidos ?? 0}</p>
      <p className="text-sm text-unifafibe_gray">Consulte seus pedidos em "Meus Pedidos".</p>
    </Card>
    <Card title="Meus Chamados Abertos">
      <p className="text-3xl font-bold text-unifafibe_blue">{stats.chamadosAbertos ?? 0}</p>
      <p className="text-sm text-unifafibe_gray">Acompanhe em "Central de Ajuda".</p>
    </Card>
  </div>
);


const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadStats = async () => {
      if (user) {
        try {
          setLoading(true);
          const data = await buscarEstatisticasPainel(); // Usa a função traduzida do apiService
          setStats(data);
          setError(null);
        } catch (err: any) {
          console.error("Falha ao buscar estatísticas do painel:", err);
          setError(err.message || "Não foi possível carregar os dados do painel.");
        } finally {
          setLoading(false);
        }
      }
    };
    loadStats();
  }, [user]);

  if (loading || !user) {
    return <LoadingSpinner fullscreen message="Carregando painel..." />;
  }

  if (error) {
    return <Card title="Erro"><p className="text-red-500">{error}</p></Card>;
  }
  
  if (!stats) {
    return <Card title="Painel"><p>Nenhuma informação disponível no momento.</p></Card>;
  }

  const renderDashboardByRole = () => {
    switch (user.role) {
      case UserRole.ADMIN:
        return <AdminDashboard stats={stats} />;
      case UserRole.ANALISTA:
        return <AnalystDashboard stats={stats} />;
      case UserRole.CLIENTE:
        return <ClientDashboard stats={stats} />;
      default:
        return <p>Painel não disponível para este perfil.</p>;
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-unifafibe_gray-dark mb-6">
        Bem-vindo(a) ao seu Painel, {user.nome.split(' ')[0]}!
      </h1>
      {renderDashboardByRole()}
    </div>
  );
};

export default DashboardPage;
