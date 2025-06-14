import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRegistrationData, AuthResponse } from '@/types';
import * as apiService from '@/services/apiService'; // Importa o serviço de API atualizado

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<User | null>; // Mantém a assinatura pública como 'login'
  register: (userData: UserRegistrationData) => Promise<User | null>; // Mantém a assinatura pública como 'register'
  logout: () => Promise<void>; // Mantém a assinatura pública como 'logout'
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const token = apiService.obterTokenAutenticacao(); // Usa a função traduzida
      const storedUser = localStorage.getItem('authUser');

      if (token && storedUser) {
        try {
          setUser(JSON.parse(storedUser));
          apiService.definirTokenAutenticacao(token); // Configura o token no axios para futuras requisições
        } catch (error) {
          console.error("Erro ao parsear usuário do localStorage:", error);
          localStorage.removeItem('authUser');
          apiService.definirTokenAutenticacao(null);
        }
      }
      setIsLoading(false);
    };
    initializeAuth();
  }, []);

  const loginInternal = async (email: string, pass: string): Promise<User | null> => {
    setIsLoading(true);
    try {
      // Chama a função traduzida do serviço
      const authResponse: AuthResponse = await apiService.entrar(email, pass); 
      if (authResponse.user && authResponse.token) {
        setUser(authResponse.user);
        localStorage.setItem('authUser', JSON.stringify(authResponse.user));
        // apiService.entrar já chama definirTokenAutenticacao internamente
        setIsLoading(false);
        return authResponse.user;
      }
      setUser(null);
      localStorage.removeItem('authUser');
      apiService.definirTokenAutenticacao(null);
      setIsLoading(false);
      return null;
    } catch (error) {
      console.error("Falha no login (AuthContext):", error);
      setUser(null);
      localStorage.removeItem('authUser');
      apiService.definirTokenAutenticacao(null);
      setIsLoading(false);
      throw error; 
    }
  };

  const registerInternal = async (userData: UserRegistrationData): Promise<User | null> => {
    setIsLoading(true);
    try {
      // Chama a função traduzida do serviço
      const authResponse: AuthResponse = await apiService.registrar(userData);
      
      if (authResponse.user && authResponse.token) {
        setUser(authResponse.user);
        localStorage.setItem('authUser', JSON.stringify(authResponse.user));
        // apiService.registrar já pode ter chamado definirTokenAutenticacao
        setIsLoading(false);
        return authResponse.user;
      } else if (authResponse.user) { 
        setIsLoading(false);
        return authResponse.user;
      }
      
      setIsLoading(false);
      return null;
    } catch (error) {
      console.error("Falha no registro (AuthContext):", error);
      setIsLoading(false);
      throw error;
    }
  };

  const logoutInternal = async () => {
    setIsLoading(true);
    await apiService.sair(); // Chama a função traduzida
    setUser(null);
    localStorage.removeItem('authUser');
    setIsLoading(false);
  };
  
  const handleSetUser = (newUserState: User | null | ((prevState: User | null) => User | null)) => {
    if (typeof newUserState === 'function') {
        setUser(prevUser => {
            const updatedUser = newUserState(prevUser);
            if(updatedUser) localStorage.setItem('authUser', JSON.stringify(updatedUser));
            else localStorage.removeItem('authUser');
            return updatedUser;
        });
    } else {
        setUser(newUserState);
        if(newUserState) localStorage.setItem('authUser', JSON.stringify(newUserState));
        else localStorage.removeItem('authUser');
    }
  };

  return (
    <AuthContext.Provider value={{ 
        user, 
        isAuthenticated: !!user, 
        isLoading, 
        login: loginInternal,  // Mapeia para a função interna que chama o serviço traduzido
        register: registerInternal, // Mapeia para a função interna
        logout: logoutInternal, // Mapeia para a função interna
        setUser: handleSetUser 
    }}>
      {children}
    </AuthContext.Provider>
  );
};
