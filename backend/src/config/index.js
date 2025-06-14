
// backend/src/config/index.js
// require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') }); // REMOVED: server.js handles .env loading

module.exports = {
  port: process.env.PORT || 3001,
  jwtSecret: process.env.JWT_SECRET || 'fallbackSecret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1h',
  apiPrefix: '/api',
  // Configurações de DB (se não for usar variáveis de ambiente diretamente no db.js)
  dbHost: process.env.DB_HOST || '127.0.0.1',
  dbUser: process.env.DB_USER || 'root',
  dbPassword: process.env.DB_PASSWORD || '07151814', // Manter vazio se não houver senha no dev
  dbName: process.env.DB_NAME || 'labstore',
};
