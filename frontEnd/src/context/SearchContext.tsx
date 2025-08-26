import React, { createContext, useState, useContext, type ReactNode } from 'react';

// Define o formato do nosso contexto
interface SearchContextType {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}

// Cria o contexto com um valor padrão
const SearchContext = createContext<SearchContextType | undefined>(undefined);

// Cria o Provedor que irá gerenciar o estado
export const SearchProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <SearchContext.Provider value={{ searchTerm, setSearchTerm }}>
      {children}
    </SearchContext.Provider>
  );
};

// Cria um hook customizado para facilitar o uso do contexto
export const useSearch = (): SearchContextType => {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error('useSearch deve ser usado dentro de um SearchProvider');
  }
  return context;
};