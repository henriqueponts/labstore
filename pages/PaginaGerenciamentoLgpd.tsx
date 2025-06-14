import React, { useEffect, useState } from 'react';
import { LgpdTerm } from '../types';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { buscarTermosLgpd, atualizarTermoLgpd } from '../services/apiService'; // Alterado para apiService

const LgpdManagementPage: React.FC = () => {
  const [terms, setTerms] = useState<LgpdTerm[]>([]);
  const [currentTerm, setCurrentTerm] = useState<LgpdTerm | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadTerms = async () => {
      try {
        setLoading(true);
        const data = await buscarTermosLgpd();
        setTerms(data);
        if (data.length > 0) {
            const latestTerm = data.sort((a,b) => new Date(b.data_efetiva).getTime() - new Date(a.data_efetiva).getTime())[0];
            setCurrentTerm(latestTerm);
            setEditingContent(latestTerm.conteudo);
        }
        setError(null);
      } catch (err: any) {
        console.error("Falha ao buscar termos LGPD:", err);
        setError(err.message || "Não foi possível carregar os termos LGPD.");
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
      const updatedTermData: Partial<LgpdTerm> = { // Envia apenas o que pode ser atualizado
        conteudo: editingContent,
        versao: `v${(parseFloat(currentTerm.versao.replace('v','')) + 0.1).toFixed(1)}`,
        data_efetiva: new Date().toISOString(),
      };
      const savedTerm = await atualizarTermoLgpd(currentTerm.id, updatedTermData);
      setCurrentTerm(savedTerm);
      setEditingContent(savedTerm.conteudo);
      setTerms(prevTerms => prevTerms.map(t => t.id === savedTerm.id ? savedTerm : t));
      alert("Termo LGPD atualizado com sucesso!");
    } catch (err: any) {
      console.error("Falha ao salvar termo LGPD:", err);
      setError(err.message || "Falha ao salvar termo LGPD.");
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
        </Card>
      )}
    </div>
  );
};

export default LgpdManagementPage;
