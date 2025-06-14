
import React from 'react';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="bg-unifafibe_gray-dark text-unifafibe_gray-light text-center p-4 text-sm">
      <p>&copy; {currentYear} UNIFAFIBE. Todos os direitos reservados.</p>
      <p>Rua Prof. Orlando França de Carvalho, 325 - Bebedouro/SP - CEP 14701-070</p>
      <p>Fone: (17) 3344-7100 | contato@unifafibe.com.br</p>
    </footer>
  );
};

export default Footer;