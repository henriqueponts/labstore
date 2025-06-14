
import React from 'react';
import { Link } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { ROUTES } from '../constants';

const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-unifafibe_gray-light flex flex-col justify-center items-center py-12 sm:px-6 lg:px-8">
      <Card className="max-w-md w-full text-center">
        <h1 className="text-6xl font-extrabold text-unifafibe_orange">404</h1>
        <h2 className="mt-2 text-3xl font-bold text-unifafibe_blue">Página Não Encontrada</h2>
        <p className="mt-4 text-unifafibe_gray">
          Desculpe, a página que você está procurando não existe ou foi movida.
        </p>
        <div className="mt-8">
          <Link to={ROUTES.DASHBOARD}>
            <Button variant="primary" size="lg">
              Voltar para o Início
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
};

export default NotFoundPage;