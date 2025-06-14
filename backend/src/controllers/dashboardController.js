// backend/src/controllers/dashboardController.js
const dashboardService = require('../services/dashboardService');

const getStats = async (req, res, next) => {
  try {
    // req.user já contém o usuário autenticado com seu ID composto e role
    const stats = await dashboardService.getDashboardStatsInternal(req.user);
    res.json(stats);
  } catch (error) {
    if(!error.statusCode) error.statusCode = 500;
    next(error);
  }
};

module.exports = { getStats };
