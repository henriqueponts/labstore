// Arquivo: server/index.js

import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import gestaoRoutes from './routes/gestaoRoutes.js';
import recuperacaoSenhaRoutes from './routes/recuperacaoSenha.js';

const app = express();

console.log('🚀 LabStore Server iniciando...');

// Middlewares
app.use(cors());
app.use(express.json());

// Rota raiz
app.get('/', (req, res) => {
    res.json({ 
        message: 'LabStore API funcionando!',
        version: '1.0.0',
        routes: {
            auth: ['/auth/login', '/auth/me', '/auth/registro/cliente', '/auth/registro/funcionario'],
            gestao: ['/gestao/usuarios', '/gestao/clientes']
        },
        status: 'online'
    });
});

// Registrar rotas
console.log('🔗 Registrando rotas...');
app.use('/auth', authRoutes);
app.use('/gestao', gestaoRoutes);
app.use('/auth', recuperacaoSenhaRoutes);
console.log('✅ Rotas registradas!');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`🌐 Server running on http://localhost:${PORT}`);
    console.log('📋 Rotas ativas:');
    console.log('  - GET  / (API info)');
    console.log('  - POST /auth/login');
    console.log('  - GET  /auth/me');
    console.log('  - POST /auth/registro/cliente');
    console.log('  - POST /auth/registro/funcionario');
    console.log('  - GET  /gestao/test');
    console.log('  - GET  /gestao/usuarios');
    console.log('  - GET  /gestao/clientes');
    console.log('  - PUT  /gestao/usuarios/:id/perfil');
    console.log('  - PUT  /gestao/usuarios/:id/inativar');
    console.log('  - PUT  /gestao/clientes/:id/inativar');
    console.log('');
    console.log('🗄️  Conecte ao banco MySQL e configure JWT_SECRET no .env');
});