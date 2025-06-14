// backend/src/services/helpTicketService.js
const pool = require('../config/db');
const { UserRole } = require('../utils/constants');
const { mapDbClienteToUser } = require('./authService');

const mapDbHelpTicketToFrontend = async (dbTicket) => {
    if(!dbTicket) return null;
    
    const clienteRow = (await pool.query('SELECT * FROM Cliente WHERE id_cliente = ?', [dbTicket.id_cliente]))[0][0];
    const cliente = clienteRow ? mapDbClienteToUser(clienteRow) : null;

    return {
        id: String(dbTicket.id_chamado),
        clienteId: cliente?.id, 
        assunto: dbTicket.assunto,
        descricao: dbTicket.descricao,
        categoria: dbTicket.categoria || null, 
        data_abertura: dbTicket.data_abertura,
        status: dbTicket.status, 
        respostas: [], 
    };
};

const getHelpTicketsInternal = async (requestingUser) => {
    let sql = 'SELECT * FROM ChamadoSuporte';
    const params = [];

    if (requestingUser.role === UserRole.CLIENTE) {
        sql += ' WHERE id_cliente = ?';
        params.push(parseInt(requestingUser.id.split('_')[1])); 
    }
    sql += ' ORDER BY data_abertura DESC';

    const [rows] = await pool.query(sql, params);
    return Promise.all(rows.map(mapDbHelpTicketToFrontend));
};

const createHelpTicketInternal = async (idClienteDb, ticketData) => {
    const { assunto, descricao, categoria } = ticketData;
    const sql = 'INSERT INTO ChamadoSuporte (id_cliente, assunto, descricao, categoria, status, data_abertura) VALUES (?, ?, ?, ?, \'aberto\', NOW())';
    const [result] = await pool.query(sql, [idClienteDb, assunto, descricao, categoria || null]);
    const [newTicketRows] = await pool.query('SELECT * FROM ChamadoSuporte WHERE id_chamado = ?', [result.insertId]);
    return mapDbHelpTicketToFrontend(newTicketRows[0]);
};

module.exports = {
    getHelpTicketsInternal,
    createHelpTicketInternal,
};
