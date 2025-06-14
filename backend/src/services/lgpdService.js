// backend/src/services/lgpdService.js
const pool = require('../config/db');

const mapDbTermoToFrontend = (dbTermo) => {
    if(!dbTermo) return null;
    return {
        id: String(dbTermo.id_termo),
        conteudo: dbTermo.conteudo,
        versao: dbTermo.versao,
        data_efetiva: dbTermo.data_efetiva,
    };
};

const getLgpdTermsInternal = async () => {
    const [rows] = await pool.query('SELECT * FROM TermoConsentimento ORDER BY data_efetiva DESC');
    return rows.map(mapDbTermoToFrontend);
};

const updateLgpdTermInternal = async (idTermo, termData) => {
    const { conteudo, versao } = termData; 
    if (!conteudo || !versao) {
        const error = new Error('Conteúdo e versão são obrigatórios para atualizar o termo.');
        error.statusCode = 400;
        throw error;
    }
    // O schema SQL tem data_efetiva DATE. Se for atualizar, usar a data atual.
    const dataEfetiva = new Date().toISOString().slice(0, 10); // Formato YYYY-MM-DD

    const [result] = await pool.query(
        'UPDATE TermoConsentimento SET conteudo = ?, versao = ?, data_efetiva = ? WHERE id_termo = ?',
        [conteudo, versao, dataEfetiva, idTermo]
    );

    if (result.affectedRows === 0) {
        const error = new Error('Termo LGPD não encontrado.');
        error.statusCode = 404;
        throw error;
    }
    const [updatedTermRows] = await pool.query('SELECT * FROM TermoConsentimento WHERE id_termo = ?', [idTermo]);
    return mapDbTermoToFrontend(updatedTermRows[0]);
};

const createLgpdTermInternal = async (termData) => {
    const { conteudo, versao } = termData;
     if (!conteudo || !versao ) {
        const error = new Error('Conteúdo e versão são obrigatórios para criar o termo.');
        error.statusCode = 400;
        throw error;
    }
    const dataEfetiva = new Date().toISOString().slice(0, 10); // Formato YYYY-MM-DD
    const sql = 'INSERT INTO TermoConsentimento (conteudo, versao, data_efetiva) VALUES (?, ?, ?)';
    const [result] = await pool.query(sql, [conteudo, versao, dataEfetiva]);
    const [newTermRows] = await pool.query('SELECT * FROM TermoConsentimento WHERE id_termo = ?', [result.insertId]);
    return mapDbTermoToFrontend(newTermRows[0]);
}

module.exports = {
    getLgpdTermsInternal,
    updateLgpdTermInternal,
    createLgpdTermInternal,
};
