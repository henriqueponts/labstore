// backend/src/controllers/serviceRequestController.js
const serviceRequestService = require('../services/serviceRequestService');
const { UserRole } = require('../utils/constants');

// Helper para extrair o ID numérico do tipo de usuário do ID composto
const getDbIdFromComposite = (compositeId, expectedType) => {
    if (compositeId && compositeId.startsWith(expectedType + '_')) {
        return parseInt(compositeId.split('_')[1], 10);
    }
    throw new Error(`ID de ${expectedType} inválido no token.`);
};

const listServiceRequests = async (req, res, next) => {
    try {
        const serviceRequests = await serviceRequestService.getServiceRequestsInternal(req.user);
        res.json(serviceRequests);
    } catch (error) {
        if(!error.statusCode) error.statusCode = 500;
        next(error);
    }
};

const createServiceRequest = async (req, res, next) => {
    try {
        if (req.user.role !== UserRole.CLIENTE) {
            return res.status(403).json({ message: 'Apenas clientes podem criar solicitações de serviço.' });
        }
        const idClienteDb = getDbIdFromComposite(req.user.id, 'cliente');
        const { tipo_equipamento, marca, modelo, descricao_problema, fotoUrl, aceiteLGPD, forma_envio } = req.body;
        
        if (!tipo_equipamento || !marca || !modelo || !descricao_problema || aceiteLGPD === undefined) {
            return res.status(400).json({ message: 'Campos obrigatórios ausentes.' });
        }
        if (!aceiteLGPD) {
            return res.status(400).json({message: "É necessário aceitar o termo LGPD."})
        }

        const newServiceRequest = await serviceRequestService.createServiceRequestInternal(idClienteDb, req.body);
        res.status(201).json(newServiceRequest);
    } catch (error) {
        if(!error.statusCode) error.statusCode = 500;
        next(error);
    }
};

const getQuote = async (req, res, next) => {
    try {
        const { quoteId } = req.params;
        const quote = await serviceRequestService.getQuoteByIdInternal(quoteId);
        if (!quote) {
            return res.status(404).json({ message: 'Orçamento não encontrado.' });
        }
        // Adicionar verificação se o usuário tem permissão para ver este orçamento
        res.json(quote);
    } catch (error) {
        if(!error.statusCode) error.statusCode = 500;
        next(error);
    }
};

const createQuote = async (req, res, next) => {
    try {
        if (req.user.role !== UserRole.ANALISTA && req.user.role !== UserRole.ADMIN) {
            return res.status(403).json({ message: 'Apenas analistas ou administradores podem criar orçamentos.' });
        }
        const idAnalistaDb = getDbIdFromComposite(req.user.id, 'usuario');
        const { serviceRequestId } = req.params;
        const quoteData = req.body;

        if(!quoteData.diagnostico || quoteData.valorMaoDeObra === undefined || quoteData.prazoEntregaDias === undefined) {
             return res.status(400).json({ message: 'Campos obrigatórios do orçamento ausentes.' });
        }

        const newQuote = await serviceRequestService.createQuoteForServiceRequestInternal(serviceRequestId, quoteData, idAnalistaDb);
        res.status(201).json(newQuote);
    } catch (error) {
        if(!error.statusCode) error.statusCode = 500;
        next(error);
    }
};

const approveQuote = async (req, res, next) => {
    try {
        if (req.user.role !== UserRole.CLIENTE) {
            return res.status(403).json({ message: 'Apenas clientes podem aprovar orçamentos.' });
        }
        const { serviceRequestId, quoteId } = req.params;
        const updatedServiceRequest = await serviceRequestService.approveQuoteInternal(serviceRequestId, quoteId);
        res.json(updatedServiceRequest);
    } catch (error) {
        if(!error.statusCode) error.statusCode = 500;
        next(error);
    }
};

const refuseQuote = async (req, res, next) => {
    try {
        if (req.user.role !== UserRole.CLIENTE) {
            return res.status(403).json({ message: 'Apenas clientes podem recusar orçamentos.' });
        }
        const { serviceRequestId, quoteId } = req.params;
        const { motivo } = req.body;
        if (!motivo) {
            // No frontend, se motivo for opcional e não fornecido, o service usa um padrão.
            // Aqui, podemos tornar obrigatório ou seguir o mesmo padrão.
        }
        const updatedServiceRequest = await serviceRequestService.refuseQuoteInternal(serviceRequestId, quoteId, motivo || "Recusado pelo cliente");
        res.json(updatedServiceRequest);
    } catch (error) {
        if(!error.statusCode) error.statusCode = 500;
        next(error);
    }
};

const completeServiceByTechnician = async (req, res, next) => {
     try {
        if (req.user.role !== UserRole.ANALISTA && req.user.role !== UserRole.ADMIN) {
            return res.status(403).json({ message: 'Apenas analistas ou administradores podem concluir serviços.' });
        }
        const { serviceRequestId } = req.params;
        const updatedServiceRequest = await serviceRequestService.completeServiceRequestByTechnicianInternal(serviceRequestId);
        res.json(updatedServiceRequest);
    } catch (error) {
        if(!error.statusCode) error.statusCode = 500;
        next(error);
    }
};


module.exports = {
    listServiceRequests,
    createServiceRequest,
    getQuote,
    createQuote,
    approveQuote,
    refuseQuote,
    completeServiceByTechnician
};
