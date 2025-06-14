
import React, { useEffect, useState } from 'react';
import { HelpTicket, UserRole } from '../types';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { fetchHelpTickets, createHelpTicket } from '../services/mockApiService';
import { useAuth } from '../hooks/useAuth';
import Input from '../components/ui/Input';

const HelpDeskPage: React.FC = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<HelpTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newTicket, setNewTicket] = useState<Omit<HelpTicket, 'id' | 'clienteId' | 'data_abertura' | 'status' | 'respostas'>>({
    assunto: '',
    descricao: '',
    categoria: 'Problemas com a entrega', // Categoria padrão
  });

  const loadTickets = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const data = await fetchHelpTickets(user.id, user.role);
      setTickets(data);
      setError(null);
    } catch (err) {
      console.error("Falha ao buscar chamados:", err);
      setError("Não foi possível carregar os chamados.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewTicket(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
        setError("Usuário não autenticado.");
        return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
        await createHelpTicket(user.id, newTicket);
        setShowForm(false);
        setNewTicket({ assunto: '', descricao: '', categoria: 'Problemas com a entrega' });
        await loadTickets(); // Atualiza lista
        alert("Chamado aberto com sucesso!");
    } catch (err) {
        console.error("Falha ao criar chamado:", err);
        setError("Falha ao abrir chamado. Tente novamente.");
    } finally {
        setIsSubmitting(false);
    }
  };
  
  const getStatusText = (status: HelpTicket['status']): string => {
    const map = {
      'aberto': 'Aberto',
      'em_andamento': 'Em Andamento',
      'respondido': 'Respondido',
      'encerrado': 'Encerrado',
      'resolvido': 'Resolvido'
    };
    return map[status] || status;
  }


  if (loading) {
    return <LoadingSpinner fullscreen message="Carregando chamados..." />;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-unifafibe_gray-dark">Central de Ajuda</h1>
        {user?.role === UserRole.CLIENTE && (
             <Button onClick={() => setShowForm(prev => !prev)} variant="primary">
                {showForm ? 'Cancelar Novo Chamado' : 'Abrir Novo Chamado'}
            </Button>
        )}
      </div>

      {error && <Card title="Erro"><p className="text-red-500">{error}</p></Card>}

      {showForm && user?.role === UserRole.CLIENTE && (
        <Card title="Abrir Novo Chamado" className="mb-6">
            <form onSubmit={handleSubmitTicket} className="space-y-4">
                 <div>
                    <label htmlFor="categoria" className="block text-sm font-medium text-unifafibe_gray-dark mb-1">Categoria</label>
                    <select name="categoria" value={newTicket.categoria} onChange={handleInputChange} className="w-full p-2 border rounded-md">
                        <option value="Problemas com a entrega">Problemas com a entrega</option>
                        <option value="Dúvidas sobre produto">Dúvidas sobre produto</option>
                        <option value="Problemas com pagamento">Problemas com pagamento</option>
                        <option value="Outros">Outros</option>
                    </select>
                </div>
                <Input label="Assunto" name="assunto" value={newTicket.assunto} onChange={handleInputChange} required />
                <div>
                    <label htmlFor="descricao" className="block text-sm font-medium text-unifafibe_gray-dark mb-1">Descrição Detalhada</label>
                    <textarea name="descricao" value={newTicket.descricao} onChange={handleInputChange} rows={5} className="w-full p-2 border rounded-md" required />
                </div>
                {/* Anexo de arquivo poderia ser adicionado aqui */}
                <Button type="submit" isLoading={isSubmitting}>Enviar Chamado</Button>
            </form>
        </Card>
      )}

      <Card title={user?.role === UserRole.CLIENTE ? "Meus Chamados" : "Todos os Chamados"}>
        {tickets.length === 0 ? (
          <p>Nenhum chamado encontrado.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-unifafibe_gray-light">
              <thead className="bg-unifafibe_gray-light">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-unifafibe_gray uppercase tracking-wider">Protocolo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-unifafibe_gray uppercase tracking-wider">Assunto</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-unifafibe_gray uppercase tracking-wider">Categoria</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-unifafibe_gray uppercase tracking-wider">Data Abertura</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-unifafibe_gray uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-unifafibe_gray uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-unifafibe_gray-light">
                {tickets.map((ticket) => (
                  <tr key={ticket.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-unifafibe_gray-dark">{ticket.id.substring(0,8)}...</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-unifafibe_gray truncate max-w-xs" title={ticket.assunto}>{ticket.assunto}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-unifafibe_gray">{ticket.categoria}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-unifafibe_gray">{new Date(ticket.data_abertura).toLocaleDateString()}</td>
                     <td className="px-6 py-4 whitespace-nowrap text-sm">
                       <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        ticket.status === 'resolvido' || ticket.status === 'encerrado' ? 'bg-green-100 text-green-800' 
                        : ticket.status === 'aberto' ? 'bg-blue-100 text-blue-800'
                        : 'bg-yellow-100 text-yellow-800' // em_andamento, respondido
                      }`}>
                        {getStatusText(ticket.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Button size="sm" variant="ghost">Ver Detalhes</Button> {/* TODO: Link para página de detalhes */}
                      {/* Admin/Analista podem ter botões "Responder", "Encerrar" */}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

export default HelpDeskPage;