// backend/src/controllers/lgpdController.js
const lgpdService = require('../services/lgpdService');

const listLgpdTerms = async (req, res, next) => {
    try {
        const terms = await lgpdService.getLgpdTermsInternal();
        res.json(terms);
    } catch (error) {
        if(!error.statusCode) error.statusCode = 500;
        next(error);
    }
};

const updateLgpdTerm = async (req, res, next) => {
    try {
        const { termId } = req.params;
        const termData = req.body; // Espera { conteudo, versao }
        const updatedTerm = await lgpdService.updateLgpdTermInternal(termId, termData);
        res.json(updatedTerm);
    } catch (error) {
        if(!error.statusCode) error.statusCode = 500;
        next(error);
    }
};

// Se for permitido criar novos termos via API (além de apenas atualizar o "atual")
const createLgpdTerm = async (req, res, next) => {
    try {
        const termData = req.body; // Espera { conteudo, versao }
        const newTerm = await lgpdService.createLgpdTermInternal(termData);
        res.status(201).json(newTerm);
    } catch (error) {
        if(!error.statusCode) error.statusCode = 500;
        next(error);
    }
};


module.exports = {
    listLgpdTerms,
    updateLgpdTerm,
    createLgpdTerm, // Adicionar à rota se for usar
};
