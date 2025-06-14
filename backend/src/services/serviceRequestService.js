// backend/src/services/serviceRequestService.js
const pool = require('../config/db');
const { UserRole } = require('../utils/constants');
const { mapDbClienteToUser, mapDbUsuarioToUser } = require('./authService');

// Mapeamento de Status: DB (Português) -> Frontend (Português, mas pode ser diferente)
// O frontend/src/types.ts já define ServiceRequestStatus e QuoteStatus em português.
// A ideia é que o status do DB seja diretamente compatível ou mapeado para esses enums do frontend.

// O schema SQL usa:
// SolicitacaoServico.status: ENUM('solicitado', 'em_analise', 'aguardando_aprovacao', 'aprovado', 'rejeitado', 'em_execucao', 'cancelado', 'aguardando_pagamento', 'concluido')
// Orcamento.status_aprovacao: ENUM('pendente', 'aprovado', 'recusado')

// Frontend types.ts usa:
// ServiceRequestStatus: PENDENTE, ORCAMENTO_ENVIADO, EM_ANDAMENTO, CONCLUIDO, CANCELADO
// QuoteStatus: PENDENTE_APROVACAO_CLIENTE, APROVADO_PELO_CLIENTE, RECUSADO_PELO_CLIENTE

const mapDbStatusToFrontendSolicitacao = (dbStatus) => {
    const mapping = {
        'solicitado': 'pendente',
        'em_analise': 'pendente',
        'aguardando_aprovacao': 'orcamento_enviado',
        'aprovado': 'em_andamento', // Após orçamento aprovado, serviço em execução
        'em_execucao': 'em_andamento',
        'rejeitado': 'cancelado', // Orçamento rejeitado
        'cancelado': 'cancelado', // Solicitação cancelada diretamente
        'aguardando_pagamento': 'concluido', // Simplificado: se aguarda pagto, já está quase concluído
        'concluido': 'concluido',
    };
    return mapping[dbStatus] || dbStatus; // Fallback para o próprio status do DB se não mapeado
};

const mapDbStatusToFrontendOrcamento = (dbStatusAprovacao) => {
    const mapping = {
        'pendente': 'pendente_aprovacao_cliente',
        'aprovado': 'aprovado_pelo_cliente',
        'recusado': 'recusado_pelo_cliente',
    };
    return mapping[dbStatusAprovacao] || dbStatusAprovacao;
};


const mapDbSolicitacaoToFrontend = async (dbSolicitacao) => {
    if (!dbSolicitacao) return null;
    
    const clienteRow = (await pool.query('SELECT * FROM Cliente WHERE id_cliente = ?', [dbSolicitacao.id_cliente]))[0][0];
    const cliente = clienteRow ? mapDbClienteToUser(clienteRow) : null;
    
    let quote = null;
    // Assumindo que a tabela Orcamento tem id_solicitacao como FK
    const [orcamentoRows] = await pool.query('SELECT * FROM Orcamento WHERE id_solicitacao = ?', [dbSolicitacao.id_solicitacao]);
    if (orcamentoRows.length > 0) {
        quote = await mapDbOrcamentoToFrontend(orcamentoRows[0]);
    }

    return {
        id: String(dbSolicitacao.id_solicitacao),
        clienteId: cliente?.id,
        clienteNome: cliente?.nome,
        clienteEmail: cliente?.email,
        tipo_equipamento: dbSolicitacao.tipo_equipamento,
        marca: dbSolicitacao.marca,
        modelo: dbSolicitacao.modelo,
        descricao_problema: dbSolicitacao.descricao_problema,
        fotoUrl: dbSolicitacao.fotoUrl || null,
        aceiteLGPD: true, // DB não tem, assumimos
        data_solicitacao: dbSolicitacao.data_solicitacao,
        status: mapDbStatusToFrontendSolicitacao(dbSolicitacao.status),
        forma_envio: dbSolicitacao.forma_envio || null,
        quoteId: quote ? quote.id : undefined, // ID do orçamento como string
        dataAprovacao: dbSolicitacao.data_aprovacao_orcamento || undefined,
        // 'previsaoEntrega' no frontend é string, 'prazo_entrega_dias' no Orcamento é INT
        // Se o orçamento existir e tiver prazo, podemos calcular uma data aqui ou o frontend faz.
        previsaoEntrega: quote?.prazoEntregaDias ? `Aprox. ${quote.prazoEntregaDias} dias após aprovação` : undefined,
        dataConclusao: dbSolicitacao.data_conclusao_servico || undefined,
        motivoRecusa: dbSolicitacao.motivo_recusa_orcamento || undefined,
    };
};

const mapDbOrcamentoToFrontend = async (dbOrcamento) => {
    if (!dbOrcamento) return null;
    
    const analistaRow = (await pool.query('SELECT * FROM Usuario WHERE id_usuario = ?', [dbOrcamento.id_analista]))[0][0];
    const analista = analistaRow ? mapDbUsuarioToUser(analistaRow) : null;

    const valorTotal = parseFloat(dbOrcamento.valor_mao_obra) + (parseFloat(dbOrcamento.valor_pecas) || 0);

    return {
        id: String(dbOrcamento.id_orcamento),
        solicitacaoId: String(dbOrcamento.id_solicitacao),
        analistaId: analista?.id,
        diagnostico: dbOrcamento.diagnostico,
        valorMaoDeObra: parseFloat(dbOrcamento.valor_mao_obra),
        valorPecasEstimado: dbOrcamento.valor_pecas ? parseFloat(dbOrcamento.valor_pecas) : undefined,
        valorTotal: valorTotal,
        prazoEntregaDias: dbOrcamento.prazo_entrega_dias || 0, // Frontend espera number
        tipoEntrega: 'oficina', // DB não tem, usando padrão
        observacoesTecnicas: dbOrcamento.observacoes_tecnicas || undefined,
        status: mapDbStatusToFrontendOrcamento(dbOrcamento.status_aprovacao),
        dataCriacao: dbOrcamento.data_criacao_orcamento || dbOrcamento.data_orcamento, // Usar data_criacao_orcamento se existir
    };
};


const getServiceRequestsInternal = async (requestingUser) => {
    let query = 'SELECT * FROM SolicitacaoServico';
    const params = [];

    if (requestingUser.role === UserRole.CLIENTE) {
        query += ' WHERE id_cliente = ?';
        params.push(parseInt(requestingUser.id.split('_')[1])); 
    }
    query += ' ORDER BY data_solicitacao DESC';
    
    const [rows] = await pool.query(query, params);
    return Promise.all(rows.map(mapDbSolicitacaoToFrontend));
};

const createServiceRequestInternal = async (idClienteDb, requestData) => {
    const { tipo_equipamento, marca, modelo, descricao_problema, fotoUrl, forma_envio } = requestData;
    const sql = `INSERT INTO SolicitacaoServico (id_cliente, tipo_equipamento, marca, modelo, descricao_problema, fotoUrl, forma_envio, status, data_solicitacao)
                 VALUES (?, ?, ?, ?, ?, ?, ?, 'solicitado', NOW())`; // status 'solicitado' no DB
    const [result] = await pool.query(sql, [idClienteDb, tipo_equipamento, marca, modelo, descricao_problema, fotoUrl || null, forma_envio || null]);
    const [newSrRows] = await pool.query('SELECT * FROM SolicitacaoServico WHERE id_solicitacao = ?', [result.insertId]);
    return mapDbSolicitacaoToFrontend(newSrRows[0]);
};

const getQuoteByIdInternal = async (idOrcamento) => {
    const [rows] = await pool.query('SELECT * FROM Orcamento WHERE id_orcamento = ?', [idOrcamento]);
    if (rows.length === 0) return null;
    return mapDbOrcamentoToFrontend(rows[0]);
};

const createQuoteForServiceRequestInternal = async (idSolicitacao, quoteData, idAnalistaDb) => {
    const { diagnostico, valorMaoDeObra, valorPecasEstimado, prazoEntregaDias, observacoesTecnicas } = quoteData;
    
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const [srRows] = await connection.query("SELECT status FROM SolicitacaoServico WHERE id_solicitacao = ?", [idSolicitacao]);
        if (srRows.length === 0 || (srRows[0].status !== 'solicitado' && srRows[0].status !== 'em_analise')) {
            throw new Error('Solicitação não encontrada ou não está em status válido para criar orçamento.');
        }

        // Orcamento.status_aprovacao será 'pendente'
        const sqlOrcamento = `INSERT INTO Orcamento (id_solicitacao, id_analista, diagnostico, valor_pecas, valor_mao_obra, prazo_entrega_dias, observacoes_tecnicas, status_aprovacao, data_criacao_orcamento) 
                              VALUES (?, ?, ?, ?, ?, ?, ?, 'pendente', NOW())`;
        const [resultOrcamento] = await connection.query(sqlOrcamento, [idSolicitacao, idAnalistaDb, diagnostico, valorPecasEstimado || null, valorMaoDeObra, prazoEntregaDias, observacoesTecnicas || null]);
        
        // SolicitacaoServico.status será 'aguardando_aprovacao'
        await connection.query("UPDATE SolicitacaoServico SET status = 'aguardando_aprovacao' WHERE id_solicitacao = ?", [idSolicitacao]);
        
        await connection.commit();
        const [newQuoteRows] = await pool.query('SELECT * FROM Orcamento WHERE id_orcamento = ?', [resultOrcamento.insertId]);
        return mapDbOrcamentoToFrontend(newQuoteRows[0]);

    } catch (error) {
        await connection.rollback();
        error.statusCode = error.statusCode || 500;
        throw error;
    } finally {
        connection.release();
    }
};

const approveQuoteInternal = async (idSolicitacao, idOrcamento) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        // Orcamento.status_aprovacao para 'aprovado'
        await connection.query("UPDATE Orcamento SET status_aprovacao = 'aprovado' WHERE id_orcamento = ? AND id_solicitacao = ?", [idOrcamento, idSolicitacao]);
        // SolicitacaoServico.status para 'aprovado' (ou 'em_execucao')
        // Adicionar data_aprovacao_orcamento
        await connection.query("UPDATE SolicitacaoServico SET status = 'aprovado', data_aprovacao_orcamento = NOW() WHERE id_solicitacao = ?", [idSolicitacao]);
        await connection.commit();
        const [updatedSrRows] = await pool.query('SELECT * FROM SolicitacaoServico WHERE id_solicitacao = ?', [idSolicitacao]);
        return mapDbSolicitacaoToFrontend(updatedSrRows[0]);
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

const refuseQuoteInternal = async (idSolicitacao, idOrcamento, motivo) => {
     const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        // Orcamento.status_aprovacao para 'recusado'
        await connection.query("UPDATE Orcamento SET status_aprovacao = 'recusado' WHERE id_orcamento = ? AND id_solicitacao = ?", [idOrcamento, idSolicitacao]);
        // SolicitacaoServico.status para 'rejeitado'
        await connection.query("UPDATE SolicitacaoServico SET status = 'rejeitado', motivo_recusa_orcamento = ? WHERE id_solicitacao = ?", [motivo, idSolicitacao]);
        await connection.commit();
        const [updatedSrRows] = await pool.query('SELECT * FROM SolicitacaoServico WHERE id_solicitacao = ?', [idSolicitacao]);
        return mapDbSolicitacaoToFrontend(updatedSrRows[0]);
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

const completeServiceRequestByTechnicianInternal = async (idSolicitacao) => {
    // SolicitacaoServico.status para 'concluido'
    // Adicionar data_conclusao_servico
    const [result] = await pool.query("UPDATE SolicitacaoServico SET status = 'concluido', data_conclusao_servico = NOW() WHERE id_solicitacao = ? AND status IN ('aprovado', 'em_execucao')", [idSolicitacao]);
    if (result.affectedRows === 0) {
        const error = new Error('Solicitação não encontrada ou não está em status que permite conclusão.');
        error.statusCode = 400;
        throw error;
    }
    const [updatedSrRows] = await pool.query('SELECT * FROM SolicitacaoServico WHERE id_solicitacao = ?', [idSolicitacao]);
    return mapDbSolicitacaoToFrontend(updatedSrRows[0]);
};

module.exports = {
    getServiceRequestsInternal,
    createServiceRequestInternal,
    getQuoteByIdInternal,
    createQuoteForServiceRequestInternal,
    approveQuoteInternal,
    refuseQuoteInternal,
    completeServiceRequestByTechnicianInternal,
};
