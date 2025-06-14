
import React, { useEffect, useState, FormEvent } from 'react';
import { ServiceRequest, UserRole, Quote, ServiceRequestStatus, QuoteStatus, TipoEntregaQuote } from '../types';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import Input from '../components/ui/Input';
import ProgressBar from '../components/ui/ProgressBar';
import { 
    fetchServiceRequests, 
    createServiceRequest,
    fetchQuote,
    createQuoteForServiceRequest,
    approveQuote,
    refuseQuote,
    completeServiceRequestByTechnician
} from '../services/mockApiService';
import { useAuth } from '../hooks/useAuth';

type NewRequestForm = Omit<ServiceRequest, 'id' | 'clienteId' | 'data_solicitacao' | 'status' | 'quoteId' | 'dataAprovacao' | 'previsaoEntrega' | 'dataConclusao' | 'motivoRecusa' | 'clienteNome' | 'clienteEmail'>;
type NewQuoteForm = Omit<Quote, 'id' | 'solicitacaoId' | 'status' | 'analistaId' | 'dataCriacao'>;

const ServiceRequestsPage: React.FC = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estados do cliente
  const [showClientForm, setShowClientForm] = useState(false);
  const [isSubmittingClientRequest, setIsSubmittingClientRequest] = useState(false);
  const [newRequestData, setNewRequestData] = useState<NewRequestForm>({
    tipo_equipamento: 'notebook',
    marca: '',
    modelo: '',
    descricao_problema: '',
    aceiteLGPD: false,
    fotoUrl: '', // Mock: será uma string
    forma_envio: 'Correios',
  });
  const [viewingQuote, setViewingQuote] = useState<Quote | null>(null);
  const [selectedRequestForQuoteView, setSelectedRequestForQuoteView] = useState<ServiceRequest | null>(null);
  const [motivoRecusa, setMotivoRecusa] = useState('');

  // Estados do técnico
  const [activeTab, setActiveTab] = useState<ServiceRequestStatus>(ServiceRequestStatus.PENDENTE);
  const [showTechnicianQuoteForm, setShowTechnicianQuoteForm] = useState(false);
  const [selectedRequestForTechQuote, setSelectedRequestForTechQuote] = useState<ServiceRequest | null>(null);
  const [isSubmittingTechQuote, setIsSubmittingTechQuote] = useState(false);
  const [newQuoteData, setNewQuoteData] = useState<NewQuoteForm>({
    diagnostico: '',
    valorMaoDeObra: 0,
    valorPecasEstimado: 0,
    valorTotal: 0,
    prazoEntregaDias: 1,
    tipoEntrega: 'oficina',
    observacoesTecnicas: '',
  });

  const loadRequests = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const data = await fetchServiceRequests(user.id, user.role);
      setRequests(data);
      setError(null);
    } catch (err) {
      console.error("Falha ao buscar solicitações de serviço:", err);
      setError("Não foi possível carregar as solicitações.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, [user]);

  // Comum: Obter cor e progresso do status
  const getStatusColor = (status: ServiceRequestStatus): string => {
    switch (status) {
      case ServiceRequestStatus.PENDENTE: return 'bg-gray-400';
      case ServiceRequestStatus.ORCAMENTO_ENVIADO: return 'bg-yellow-500';
      case ServiceRequestStatus.EM_ANDAMENTO: return 'bg-unifafibe_blue';
      case ServiceRequestStatus.CONCLUIDO: return 'bg-green-500';
      case ServiceRequestStatus.CANCELADO: return 'bg-red-500';
      default: return 'bg-gray-300';
    }
  };

  const getProgress = (status: ServiceRequestStatus): number => {
    switch (status) {
      case ServiceRequestStatus.PENDENTE: return 0;
      case ServiceRequestStatus.ORCAMENTO_ENVIADO: return 25;
      case ServiceRequestStatus.EM_ANDAMENTO: return 75;
      case ServiceRequestStatus.CONCLUIDO: return 100;
      case ServiceRequestStatus.CANCELADO: return 0; // Ou tratar de forma diferente
      default: return 0;
    }
  };
  
  const getStatusText = (status: ServiceRequestStatus): string => {
    const textMap: Record<ServiceRequestStatus, string> = {
        [ServiceRequestStatus.PENDENTE]: 'Pendente',
        [ServiceRequestStatus.ORCAMENTO_ENVIADO]: 'Orçamento Enviado',
        [ServiceRequestStatus.EM_ANDAMENTO]: 'Em Andamento',
        [ServiceRequestStatus.CONCLUIDO]: 'Concluído',
        [ServiceRequestStatus.CANCELADO]: 'Cancelado',
    };
    return textMap[status] || status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }


  // --- Fluxo do Cliente ---
  const handleClientInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
        setNewRequestData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else if (name === "fotoUrl") { // Mock de upload de arquivo - apenas armazena nome/caminho
        setNewRequestData(prev => ({ ...prev, fotoUrl: (e.target as HTMLInputElement).files?.[0]?.name || '' }));
    }
    else {
        setNewRequestData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleClientSubmitRequest = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) { setError("Usuário não autenticado."); return; }
    if (!newRequestData.aceiteLGPD) { setError("Você deve aceitar o termo LGPD."); return; }
    
    setIsSubmittingClientRequest(true); setError(null);
    try {
      await createServiceRequest(user.id, newRequestData);
      setShowClientForm(false);
      setNewRequestData({ tipo_equipamento: 'notebook', marca: '', modelo: '', descricao_problema: '', aceiteLGPD: false, fotoUrl: '', forma_envio: 'Correios'});
      await loadRequests();
      alert("Solicitação enviada com sucesso!");
    } catch (err) {
      setError("Falha ao enviar solicitação.");
    } finally {
      setIsSubmittingClientRequest(false);
    }
  };

  const handleViewQuote = async (request: ServiceRequest) => {
    if (!request.quoteId) return;
    setSelectedRequestForQuoteView(request);
    try {
        const quote = await fetchQuote(request.quoteId);
        setViewingQuote(quote);
    } catch (err) {
        setError("Não foi possível carregar o orçamento.");
    }
  };

  const handleApproveQuote = async () => {
    if (!user || !selectedRequestForQuoteView || !viewingQuote) return;
    try {
        await approveQuote(user.id, selectedRequestForQuoteView.id, viewingQuote.id);
        setViewingQuote(null);
        setSelectedRequestForQuoteView(null);
        await loadRequests();
        alert("Orçamento aprovado! O serviço será iniciado.");
    } catch (err) {
        setError("Falha ao aprovar orçamento.");
    }
  };

  const handleRefuseQuote = async () => {
    if (!user || !selectedRequestForQuoteView || !viewingQuote ) { // Motivo da recusa é opcional ao recusar
        return;
    }
    try {
        await refuseQuote(user.id, selectedRequestForQuoteView.id, viewingQuote.id, motivoRecusa || "Recusado pelo cliente");
        setViewingQuote(null);
        setSelectedRequestForQuoteView(null);
        setMotivoRecusa('');
        await loadRequests();
        alert("Orçamento recusado.");
    } catch (err) {
        setError("Falha ao recusar orçamento.");
    }
  };

  // --- Fluxo do Técnico ---
  const handleTechQuoteInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'number' ? parseFloat(value) || 0 : value;
    setNewQuoteData(prev => {
        const updated = { ...prev, [name]: val };
        if (name === "valorMaoDeObra" || name === "valorPecasEstimado") {
            updated.valorTotal = (updated.valorMaoDeObra || 0) + (updated.valorPecasEstimado || 0);
        }
        return updated;
    });
  };

  const handleTechSubmitQuote = async (e: FormEvent) => {
    e.preventDefault();
    if (!user || !selectedRequestForTechQuote) { setError("Erro interno."); return;}
    setIsSubmittingTechQuote(true); setError(null);
    try {
        await createQuoteForServiceRequest(selectedRequestForTechQuote.id, newQuoteData, user.id);
        setShowTechnicianQuoteForm(false);
        setSelectedRequestForTechQuote(null);
        setNewQuoteData({diagnostico: '', valorMaoDeObra: 0, valorPecasEstimado: 0, valorTotal: 0, prazoEntregaDias: 1, tipoEntrega: 'oficina', observacoesTecnicas: ''});
        await loadRequests();
        alert("Orçamento enviado ao cliente!");
    } catch (err) {
        setError("Falha ao criar orçamento.");
    } finally {
        setIsSubmittingTechQuote(false);
    }
  };
  
  const handleCompleteService = async (requestId: string) => {
    if(!user) return;
    try {
        await completeServiceRequestByTechnician(user.id, requestId);
        await loadRequests();
        alert("Serviço marcado como concluído!");
    } catch (err) {
        setError("Falha ao concluir serviço.");
    }
  };

  const renderClientForm = () => (
    <Card title="Nova Solicitação de Serviço" className="mb-6">
      <form onSubmit={handleClientSubmitRequest} className="space-y-4">
        <Input label="Nome (Cliente)" value={user?.nome || ''} disabled />
        <Input label="Email (Cliente)" value={user?.email || ''} disabled />
        <div>
          <label htmlFor="tipo_equipamento" className="block text-sm font-medium text-unifafibe_gray-dark mb-1">Tipo de Equipamento</label>
          <select name="tipo_equipamento" value={newRequestData.tipo_equipamento} onChange={handleClientInputChange} className="w-full p-2 border rounded-md">
            <option value="notebook">Notebook</option>
            <option value="desktop">Desktop</option>
            <option value="tablet">Tablet</option>
            <option value="outros">Outros</option>
          </select>
        </div>
        <Input label="Marca" name="marca" value={newRequestData.marca} onChange={handleClientInputChange} required />
        <Input label="Modelo" name="modelo" value={newRequestData.modelo} onChange={handleClientInputChange} required />
        <div>
          <label htmlFor="descricao_problema" className="block text-sm font-medium text-unifafibe_gray-dark mb-1">Descrição Detalhada do Problema</label>
          <textarea name="descricao_problema" value={newRequestData.descricao_problema} onChange={handleClientInputChange} rows={4} className="w-full p-2 border rounded-md" required />
        </div>
        <Input label="Foto do Problema (Opcional)" name="fotoUrl" type="file" onChange={handleClientInputChange} />
         <div>
            <label htmlFor="forma_envio" className="block text-sm font-medium text-unifafibe_gray-dark mb-1">Forma de Envio Inicial</label>
            <select name="forma_envio" value={newRequestData.forma_envio} onChange={handleClientInputChange} className="w-full p-2 border rounded-md">
                <option value="Correios">Correios</option>
                <option value="Presencial">Presencial (Trazer à loja)</option>
            </select>
        </div>
        <div className="flex items-center">
          <input type="checkbox" name="aceiteLGPD" id="aceiteLGPDClient" checked={newRequestData.aceiteLGPD} onChange={handleClientInputChange} className="h-4 w-4 text-unifafibe_orange focus:ring-unifafibe_orange border-gray-300 rounded"/>
          <label htmlFor="aceiteLGPDClient" className="ml-2 block text-sm text-unifafibe_gray-dark">Li e aceito o termo LGPD.</label>
        </div>
        <Button type="submit" isLoading={isSubmittingClientRequest}>Enviar Solicitação</Button>
        <Button type="button" variant="ghost" onClick={() => setShowClientForm(false)}>Cancelar</Button>
      </form>
    </Card>
  );
  
  const renderViewQuoteModal = () => {
    if (!viewingQuote || !selectedRequestForQuoteView) return null;
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <Card title={`Orçamento para SR #${selectedRequestForQuoteView.id.substring(0,6)}`} className="w-full max-w-lg">
            <p><strong>Diagnóstico:</strong> {viewingQuote.diagnostico}</p>
            <p><strong>Custo do Serviço (Mão de Obra):</strong> R$ {viewingQuote.valorMaoDeObra.toFixed(2)}</p>
            {viewingQuote.valorPecasEstimado && <p><strong>Custo Estimado Peças:</strong> R$ {viewingQuote.valorPecasEstimado.toFixed(2)}</p>}
            <p><strong>Valor Total:</strong> R$ {viewingQuote.valorTotal.toFixed(2)}</p>
            <p><strong>Prazo de Entrega Estimado:</strong> {viewingQuote.prazoEntregaDias} dias úteis após aprovação</p>
            <p><strong>Tipo de Entrega:</strong> {viewingQuote.tipoEntrega.replace('_', ' ')}</p>
            {viewingQuote.observacoesTecnicas && <p><strong>Observações Técnicas:</strong> {viewingQuote.observacoesTecnicas}</p>}
            <hr className="my-4"/>
            <div className="space-y-2">
                <label htmlFor="motivoRecusa" className="text-sm">Motivo da Recusa (Opcional):</label>
                <textarea id="motivoRecusa" value={motivoRecusa} onChange={(e) => setMotivoRecusa(e.target.value)} rows={2} className="w-full p-2 border rounded-md" placeholder="Informe o motivo se for recusar"/>
            </div>
            <div className="flex justify-end gap-4 mt-4">
                <Button onClick={handleApproveQuote} variant="primary">Aprovar Orçamento</Button>
                <Button onClick={handleRefuseQuote} variant="danger">Recusar Orçamento</Button>
                <Button onClick={() => { setViewingQuote(null); setSelectedRequestForQuoteView(null); setMotivoRecusa('');}} variant="ghost">Fechar</Button>
            </div>
        </Card>
      </div>
    );
  };

  const renderTechnicianQuoteForm = () => {
    if (!selectedRequestForTechQuote) return null;
    return (
         <Card title={`Criar Orçamento para SR #${selectedRequestForTechQuote.id.substring(0,6)}`} className="mb-6">
            <form onSubmit={handleTechSubmitQuote} className="space-y-4">
                <p><strong>Cliente:</strong> {selectedRequestForTechQuote.clienteNome}</p>
                <p><strong>Problema Descrito:</strong> {selectedRequestForTechQuote.descricao_problema}</p>
                <Input label="Diagnóstico Técnico (incluir peças se houver)" name="diagnostico" type="textarea" value={newQuoteData.diagnostico} onChange={handleTechQuoteInputChange} required />
                <Input label="Valor Mão de Obra (R$)" name="valorMaoDeObra" type="number" step="0.01" value={newQuoteData.valorMaoDeObra} onChange={handleTechQuoteInputChange} required />
                <Input label="Valor Estimado Peças (R$)" name="valorPecasEstimado" type="number" step="0.01" value={newQuoteData.valorPecasEstimado || 0} onChange={handleTechQuoteInputChange} />
                <Input label="Valor Total (R$)" name="valorTotal" type="number" step="0.01" value={newQuoteData.valorTotal} disabled />
                <Input label="Prazo de Entrega (dias úteis após aprovação)" name="prazoEntregaDias" type="number" min="1" value={newQuoteData.prazoEntregaDias} onChange={handleTechQuoteInputChange} required />
                 <div>
                    <label htmlFor="tipoEntrega" className="block text-sm font-medium text-unifafibe_gray-dark mb-1">Tipo de Entrega Final</label>
                    <select name="tipoEntrega" value={newQuoteData.tipoEntrega} onChange={handleTechQuoteInputChange} className="w-full p-2 border rounded-md">
                        <option value="oficina">Retirada na Oficina</option>
                        <option value="visita_tecnica">Visita Técnica (Entrega)</option>
                        <option value="correios">Envio por Correios</option>
                    </select>
                </div>
                <Input label="Observações Técnicas (Opcional)" name="observacoesTecnicas" type="textarea" value={newQuoteData.observacoesTecnicas || ''} onChange={handleTechQuoteInputChange} />
                <Button type="submit" isLoading={isSubmittingTechQuote}>Enviar Orçamento ao Cliente</Button>
                <Button type="button" variant="ghost" onClick={() => {setShowTechnicianQuoteForm(false); setSelectedRequestForTechQuote(null);}}>Cancelar</Button>
            </form>
         </Card>
    );
  };
  
  const renderRequestList = (filteredRequests: ServiceRequest[]) => (
     <div className="space-y-4">
        {filteredRequests.length === 0 ? <p>Nenhuma solicitação nesta categoria.</p> : 
            filteredRequests.map((req) => (
            <Card key={req.id} className="hover:shadow-lg transition-shadow">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-2">
                <h3 className="text-lg font-semibold text-unifafibe_blue">Solicitação #{req.id.substring(0,6)}...</h3>
                <span className={`px-3 py-1 text-xs font-semibold rounded-full text-white ${getStatusColor(req.status)}`}>
                  {getStatusText(req.status)}
                </span>
              </div>
              <ProgressBar progress={getProgress(req.status)} colorClass={getStatusColor(req.status)} />
              <div className="mt-3 text-sm text-unifafibe_gray-dark space-y-1">
                <p><strong>Data:</strong> {new Date(req.data_solicitacao).toLocaleDateString()}</p>
                {user?.role !== UserRole.CLIENTE && <p><strong>Cliente:</strong> {req.clienteNome} ({req.clienteEmail})</p>}
                <p><strong>Equipamento:</strong> {req.marca} {req.modelo} ({req.tipo_equipamento})</p>
                <p><strong>Problema:</strong> {req.descricao_problema}</p>
                {req.fotoUrl && <p><strong>Foto:</strong> <a href={req.fotoUrl} target="_blank" rel="noopener noreferrer" className="text-unifafibe_orange hover:underline">{req.fotoUrl}</a></p>}
                {req.status === ServiceRequestStatus.ORCAMENTO_ENVIADO && user?.role === UserRole.CLIENTE && req.quoteId &&
                    <Button onClick={() => handleViewQuote(req)} size="sm">Ver Orçamento</Button>
                }
                {req.status === ServiceRequestStatus.PENDENTE && user?.role !== UserRole.CLIENTE &&
                    <Button onClick={() => {setSelectedRequestForTechQuote(req); setShowTechnicianQuoteForm(true);}} size="sm">Criar Orçamento</Button>
                }
                 {req.status === ServiceRequestStatus.EM_ANDAMENTO && user?.role !== UserRole.CLIENTE &&
                    <Button onClick={() => handleCompleteService(req.id)} size="sm" variant="secondary">Marcar como Concluído</Button>
                }
                {req.status === ServiceRequestStatus.CANCELADO && req.motivoRecusa &&
                    <p className="text-red-600"><strong>Motivo da Recusa:</strong> {req.motivoRecusa}</p>
                }
                 {req.status === ServiceRequestStatus.EM_ANDAMENTO && req.previsaoEntrega &&
                    <p className="text-blue-600"><strong>Previsão de Entrega:</strong> {new Date(req.previsaoEntrega).toLocaleDateString()}</p>
                }
                {req.status === ServiceRequestStatus.CONCLUIDO && req.dataConclusao &&
                    <p className="text-green-600"><strong>Concluído em:</strong> {new Date(req.dataConclusao).toLocaleDateString()}</p>
                }
              </div>
            </Card>
          ))}
      </div>
  );


  if (loading || !user) {
    return <LoadingSpinner fullscreen message="Carregando solicitações..." />;
  }

  const technicianTabs: {status: ServiceRequestStatus, label: string}[] = [
      {status: ServiceRequestStatus.PENDENTE, label: 'Pendentes'}, 
      {status: ServiceRequestStatus.ORCAMENTO_ENVIADO, label: 'Orçamentos Enviados'}, 
      {status: ServiceRequestStatus.EM_ANDAMENTO, label: 'Em Andamento'}, 
      {status: ServiceRequestStatus.CONCLUIDO, label: 'Concluídos'}, 
      {status: ServiceRequestStatus.CANCELADO, label: 'Cancelados'}
    ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-unifafibe_gray-dark">
            {user.role === UserRole.CLIENTE ? "Minhas Solicitações de Serviço" : "Gerenciar Solicitações de Serviço"}
        </h1>
        {user.role === UserRole.CLIENTE && !showClientForm && (
            <Button onClick={() => setShowClientForm(true)} variant="primary">Abrir Nova Solicitação</Button>
        )}
      </div>

      {error && <Card title="Erro" className="mb-4"><p className="text-red-500">{error}</p></Card>}
      
      {user.role === UserRole.CLIENTE && showClientForm && renderClientForm()}
      {user.role !== UserRole.CLIENTE && showTechnicianQuoteForm && renderTechnicianQuoteForm()}
      {viewingQuote && renderViewQuoteModal()}


      {user.role === UserRole.CLIENTE ? (
        renderRequestList(requests)
      ) : (
        <>
            <div className="mb-4 border-b border-gray-200">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                {technicianTabs.map((tab) => (
                    <button
                    key={tab.status}
                    onClick={() => setActiveTab(tab.status)}
                    className={`${
                        activeTab === tab.status
                        ? 'border-unifafibe_orange text-unifafibe_orange'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                    >
                    {tab.label} ({requests.filter(r => r.status === tab.status).length})
                    </button>
                ))}
                </nav>
            </div>
            {renderRequestList(requests.filter(r => r.status === activeTab))}
        </>
      )}
    </div>
  );
};

export default ServiceRequestsPage;