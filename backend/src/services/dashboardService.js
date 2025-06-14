// backend/src/services/dashboardService.js
const pool = require('../config/db');
const { UserRole } = require('../utils/constants');

const getDashboardStatsInternal = async (requestingUser) => {
    const [type, idStr] = requestingUser.id.split('_');
    const dbId = parseInt(idStr, 10);

    let totalClientes = 0;
    let vendasPeriodo = 0;
    let assistenciasPeriodo = 0;
    let novosPedidosCliente = 0;
    let chamadosAbertosCliente = 0;
    let chamadosAbertosAnalistaAdmin = 0;

    if (requestingUser.role === UserRole.ADMIN || requestingUser.role === UserRole.ANALISTA) {
        const [clienteCountRows] = await pool.query("SELECT COUNT(*) as count FROM Cliente WHERE status = 'ativo'");
        totalClientes = clienteCountRows[0].count;
    
        const [vendasRows] = await pool.query(
            `SELECT SUM(ip.quantidade * ip.preco_unitario) as totalVendas 
             FROM Pedido p JOIN ItemPedido ip ON p.id_pedido = ip.id_pedido 
             WHERE p.status = 'concluido' OR p.status = 'entregue'`
        );
        vendasPeriodo = parseFloat(vendasRows[0].totalVendas || 0);

        const [assistenciasRows] = await pool.query(
            "SELECT COUNT(*) as count FROM SolicitacaoServico WHERE status = 'concluido'"
        );
        assistenciasPeriodo = assistenciasRows[0].count;
    }
    

    if (requestingUser.role === UserRole.CLIENTE) {
        const [pedidosClienteRows] = await pool.query(
            'SELECT COUNT(*) as count FROM Pedido WHERE id_cliente = ? AND data_pedido >= DATE_SUB(NOW(), INTERVAL 30 DAY)',
            [dbId]
        );
        novosPedidosCliente = pedidosClienteRows[0].count;

        const [chamadosClienteRows] = await pool.query(
            "SELECT COUNT(*) as count FROM ChamadoSuporte WHERE id_cliente = ? AND status IN ('aberto', 'em_andamento')",
            [dbId]
        );
        chamadosAbertosCliente = chamadosClienteRows[0].count;
    } else if (requestingUser.role === UserRole.ADMIN || requestingUser.role === UserRole.ANALISTA) {
        const [chamadosGeralRows] = await pool.query(
            "SELECT COUNT(*) as count FROM ChamadoSuporte WHERE status IN ('aberto', 'em_andamento')"
        );
        chamadosAbertosAnalistaAdmin = chamadosGeralRows[0].count;
    }
    
    let stats = {
        totalClientes: (requestingUser.role === UserRole.ADMIN || requestingUser.role === UserRole.ANALISTA) ? totalClientes : undefined,
        vendasPeriodo: (requestingUser.role === UserRole.ADMIN || requestingUser.role === UserRole.ANALISTA) ? vendasPeriodo : undefined,
        assistenciasPeriodo: (requestingUser.role === UserRole.ADMIN || requestingUser.role === UserRole.ANALISTA) ? assistenciasPeriodo : undefined,
        novosPedidos: (requestingUser.role === UserRole.CLIENTE) ? novosPedidosCliente : undefined,
        chamadosAbertos: (requestingUser.role === UserRole.CLIENTE) ? chamadosAbertosCliente : chamadosAbertosAnalistaAdmin,
    };
    
    Object.keys(stats).forEach(key => stats[key] === undefined && delete stats[key]);

    return stats;
};

module.exports = { getDashboardStatsInternal };
