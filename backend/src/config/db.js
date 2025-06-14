// backend/src/config/db.js
const mysql = require('mysql2/promise');
const config = require('./index'); // Para pegar variáveis de ambiente se necessário no futuro

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'root', // Substitua pelo seu usuário do MySQL
  password: process.env.DB_PASSWORD || '07151814', // Substitua pela sua senha do MySQL
  database: process.env.DB_NAME || 'labstore',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Testa a conexão (opcional, mas bom para depuração inicial)
pool.getConnection()
  .then(connection => {
    console.log('Conectado ao banco de dados MySQL com sucesso!');
    connection.release();
  })
  .catch(err => {
    console.error('Erro ao conectar ao banco de dados MySQL:', err);
  });

module.exports = pool;
