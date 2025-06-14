
import React, { useEffect, useState } from 'react';
import { LgpdTerm } from '../types';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { fetchLgpdTerms, updateLgpdTerm } from '../services/mockApiService'; // Assumindo estas funções

const LgpdManagementPage: React.FC = () => {
  const [terms, setTerms] = useState<LgpdTerm[]>([]); // Assumindo que múltiplas versões podem existir, mas a UI gerencia uma ativa
  const [currentTerm, setCurrentTerm] = useState<LgpdTerm | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadTerms = async () => {
      try {
        setLoading(true);
        const data = await fetchLgpdTerms();
        setTerms(data);
        // Por simplicidade, vamos assumir que o primeiro termo é o atual/editável
        // ou aquele com a data_efetiva mais recente
        if (data.length > 0) {
            const latestTerm = data.sort((a,b) => new Date(b.data_efetiva).getTime() - new Date(a.data_efetiva).getTime())[0];
            setCurrentTerm(latestTerm);
            setEditingContent(latestTerm.conteudo);
        }
        setError(null);
      } catch (err) {
        console.error("Falha ao buscar termos LGPD:", err);
        setError("Não foi possível carregar os termos LGPD.");
      } finally {
        setLoading(false);
      }
    };
    loadTerms();
  }, []);

  const handleSaveTerm = async () => {
    if (!currentTerm || editingContent.trim() === '') {
      setError("O conteúdo do termo LGPD não pode estar em branco.");
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      // Em uma app real, salvar pode criar uma nova versão ou atualizar existente.
      // Mock apenas atualizará o atual.
      const updatedTermData: LgpdTerm = {
        ...currentTerm,
        conteudo: editingContent,
        versao: `v${(parseFloat(currentTerm.versao.replace('v','')) + 0.1).toFixed(1)}`, // Incremento simples de versão
        data_efetiva: new Date().toISOString(),
      };
      const savedTerm = await updateLgpdTerm(currentTerm.id, updatedTermData);
      setCurrentTerm(savedTerm);
      setEditingContent(savedTerm.conteudo);
      // Atualizar todos os termos se necessário, ou atualizar no estado local
      setTerms(prevTerms => prevTerms.map(t => t.id === savedTerm.id ? savedTerm : t));
      alert("Termo LGPD atualizado com sucesso!");
    } catch (err) {
      console.error("Falha ao salvar termo LGPD:", err);
      setError("Falha ao salvar termo LGPD.");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return <LoadingSpinner fullscreen message="Carregando termos LGPD..." />;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-unifafibe_gray-dark mb-6">Gerenciamento de Termo LGPD</h1>
      {error && <Card title="Erro"><p className="text-red-500">{error}</p></Card>}

      {currentTerm ? (
        <Card title={`Termo LGPD Atual (Versão: ${currentTerm.versao})`}>
          <div className="space-y-4">
            <div>
              <label htmlFor="lgpdContent" className="block text-sm font-medium text-unifafibe_gray-dark mb-1">
                Conteúdo do Termo:
              </label>
              <textarea
                id="lgpdContent"
                value={editingContent}
                onChange={(e) => setEditingContent(e.target.value)}
                rows={15}
                className="w-full p-2 border rounded-md focus:ring-unifafibe_blue focus:border-unifafibe_blue"
                placeholder="Digite o conteúdo do termo LGPD aqui..."
              />
            </div>
            <p className="text-xs text-unifafibe_gray">
                Última atualização: {new Date(currentTerm.data_efetiva).toLocaleDateString()}
            </p>
            <Button onClick={handleSaveTerm} isLoading={isSaving} variant="primary">
              Salvar Alterações
            </Button>
          </div>
        </Card>
      ) : (
        <Card>
          <p>Nenhum termo LGPD encontrado. Você pode precisar criar um inicial.</p>
          {/* TODO: Adicionar botão/formulário para criar termo inicial se nenhum existir */}
        </Card>
      )}
      
      {/* Opcionalmente, listar versões históricas dos termos aqui */}
    </div>
  );
};

export default LgpdManagementPage;