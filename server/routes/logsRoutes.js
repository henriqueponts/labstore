import express from 'express';
import { connectToDatabase } from '../lib/db.js';
import jwt from 'jsonwebtoken';

const router = express.Router();

// Middleware de verificação de admin
const verifyAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Token não fornecido' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.tipo !== 'funcionario') {
      return res.status(403).json({ message: 'Acesso negado. Apenas funcionários.' });
    }

    req.userId = decoded.id;
    req.userType = decoded.tipo;
    req.userProfile = decoded.perfil;

    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token inválido' });
  }
};

// Listar todos os logs com filtros
router.get('/', verifyAdmin, async (req, res) => {
  try {
    const { 
      data_inicio, 
      data_fim, 
      usuario, 
      acao, 
      tabela, 
      limite = 100,
      pagina = 1 
    } = req.query;
    
    const db = await connectToDatabase();
    
    let query = `
      SELECT 
        id_log,
        id_usuario,
        nome_usuario,
        tipo_usuario,
        tipo_perfil,
        acao,
        tabela_afetada,
        id_registro,
        campo_alterado,
        valor_anterior,
        valor_novo,
        descricao,
        ip_address,
        data_acao
      FROM LogSistema
      WHERE 1=1
    `;
    
    const params = [];
    
    if (data_inicio) {
      query += ' AND data_acao >= ?';
      params.push(data_inicio);
    }
    
    if (data_fim) {
      query += ' AND data_acao <= ?';
      params.push(data_fim + ' 23:59:59');
    }
    
    if (usuario) {
      query += ' AND nome_usuario LIKE ?';
      params.push(`%${usuario}%`);
    }
    
    if (acao) {
      query += ' AND acao = ?';
      params.push(acao);
    }
    
    if (tabela) {
      query += ' AND tabela_afetada = ?';
      params.push(tabela);
    }
    
    query += ' ORDER BY data_acao DESC';
    
    // Calcular offset para paginação
    const offset = (parseInt(pagina) - 1) * parseInt(limite);
    query += ` LIMIT ? OFFSET ?`;
    params.push(parseInt(limite), offset);
    
    const [logs] = await db.query(query, params);
    
    // Contar total de registros
    let countQuery = 'SELECT COUNT(*) as total FROM LogSistema WHERE 1=1';
    const countParams = [];
    
    if (data_inicio) {
      countQuery += ' AND data_acao >= ?';
      countParams.push(data_inicio);
    }
    
    if (data_fim) {
      countQuery += ' AND data_acao <= ?';
      countParams.push(data_fim + ' 23:59:59');
    }
    
    if (usuario) {
      countQuery += ' AND nome_usuario LIKE ?';
      countParams.push(`%${usuario}%`);
    }
    
    if (acao) {
      countQuery += ' AND acao = ?';
      countParams.push(acao);
    }
    
    if (tabela) {
      countQuery += ' AND tabela_afetada = ?';
      countParams.push(tabela);
    }
    
    const [countResult] = await db.query(countQuery, countParams);
    const total = countResult[0].total;
    
    res.status(200).json({
      logs,
      paginacao: {
        pagina_atual: parseInt(pagina),
        total_registros: total,
        total_paginas: Math.ceil(total / parseInt(limite)),
        registros_por_pagina: parseInt(limite)
      }
    });
  } catch (error) {
    console.error('Erro ao buscar logs:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Buscar estatísticas dos logs
router.get('/estatisticas', verifyAdmin, async (req, res) => {
  try {
    const { data_inicio, data_fim } = req.query;
    const db = await connectToDatabase();
    
    let whereClause = '1=1';
    const params = [];
    
    if (data_inicio) {
      whereClause += ' AND data_acao >= ?';
      params.push(data_inicio);
    }
    
    if (data_fim) {
      whereClause += ' AND data_acao <= ?';
      params.push(data_fim + ' 23:59:59');
    }
    
    // Total de ações
    const [totalAcoes] = await db.query(
      `SELECT COUNT(*) as total FROM LogSistema WHERE ${whereClause}`,
      params
    );
    
    // Ações por tipo
    const [acoesPorTipo] = await db.query(
      `SELECT acao, COUNT(*) as total 
       FROM LogSistema 
       WHERE ${whereClause}
       GROUP BY acao 
       ORDER BY total DESC`,
      params
    );
    
    // Usuários mais ativos
    const [usuariosAtivos] = await db.query(
      `SELECT nome_usuario, tipo_perfil, COUNT(*) as total 
       FROM LogSistema 
       WHERE ${whereClause} AND nome_usuario != 'Sistema'
       GROUP BY nome_usuario, tipo_perfil 
       ORDER BY total DESC 
       LIMIT 10`,
      params
    );
    
    // Tabelas mais alteradas
    const [tabelasAlteradas] = await db.query(
      `SELECT tabela_afetada, COUNT(*) as total 
       FROM LogSistema 
       WHERE ${whereClause} AND tabela_afetada IS NOT NULL
       GROUP BY tabela_afetada 
       ORDER BY total DESC 
       LIMIT 10`,
      params
    );
    
    // Ações por dia (últimos 7 dias)
    const [acoesPorDia] = await db.query(
      `SELECT DATE(data_acao) as data, COUNT(*) as total 
       FROM LogSistema 
       WHERE ${whereClause}
       GROUP BY DATE(data_acao) 
       ORDER BY data DESC 
       LIMIT 7`,
      params
    );
    
    res.status(200).json({
      total_acoes: totalAcoes[0].total,
      acoes_por_tipo: acoesPorTipo,
      usuarios_mais_ativos: usuariosAtivos,
      tabelas_mais_alteradas: tabelasAlteradas,
      acoes_por_dia: acoesPorDia
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Buscar tipos de ações disponíveis
router.get('/tipos-acao', verifyAdmin, async (req, res) => {
  try {
    const db = await connectToDatabase();
    const [tipos] = await db.query(
      'SELECT DISTINCT acao FROM LogSistema ORDER BY acao'
    );
    res.status(200).json(tipos.map(t => t.acao));
  } catch (error) {
    console.error('Erro ao buscar tipos de ação:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Buscar tabelas disponíveis
router.get('/tabelas', verifyAdmin, async (req, res) => {
  try {
    const db = await connectToDatabase();
    const [tabelas] = await db.query(
      'SELECT DISTINCT tabela_afetada FROM LogSistema WHERE tabela_afetada IS NOT NULL ORDER BY tabela_afetada'
    );
    res.status(200).json(tabelas.map(t => t.tabela_afetada));
  } catch (error) {
    console.error('Erro ao buscar tabelas:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

export default router;
