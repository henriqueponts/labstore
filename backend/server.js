// backend/server.js
require('dotenv').config(); // Carrega .env da raiz da pasta backend
const http = require('http');
const app = require('./src/app');
const config = require('./src/config');
// A importação do pool já tenta conectar, então o teste de conexão no db.js é suficiente
// require('./src/config/db'); // Garante que o pool de conexão seja inicializado

const server = http.createServer(app);

server.listen(config.port, () => {
  console.log(`Servidor backend rodando na porta ${config.port}`);
  console.log(`API base URL: http://localhost:${config.port}${config.apiPrefix}`);
});
