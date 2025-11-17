import { connectToDatabase } from '../lib/db.js';

/**
 * Middleware para registrar logs de ações no sistema
 * @param {string} acao - Tipo de ação realizada
 * @param {string} tabelaAfetada - Nome da tabela afetada
 * @param {number} idRegistro - ID do registro afetado
 * @param {string} descricao - Descrição da ação
 * @param {string} campoAlterado - Campo que foi alterado (opcional)
 * @param {string} valorAnterior - Valor anterior do campo (opcional)
 * @param {string} valorNovo - Valor novo do campo (opcional)
 */
export async function registrarLog(req, {
  acao,
  tabelaAfetada,
  idRegistro,
  descricao,
  campoAlterado = null,
  valorAnterior = null,
  valorNovo = null
}) {
  try {
    const db = await connectToDatabase();
    
    // Extrair informações do usuário do token JWT (se disponível)
    const idUsuario = req.userId || null;
    const tipoUsuario = req.userType || null;
    const tipoPerfil = req.userProfile || null;
    
    // Buscar nome do usuário
    let nomeUsuario = 'Sistema';
    if (idUsuario && tipoUsuario === 'funcionario') {
      const [usuario] = await db.query('SELECT nome FROM Usuario WHERE id_usuario = ?', [idUsuario]);
      nomeUsuario = usuario.length > 0 ? usuario[0].nome : 'Desconhecido';
    } else if (idUsuario && tipoUsuario === 'cliente') {
      const [cliente] = await db.query('SELECT nome FROM Cliente WHERE id_cliente = ?', [idUsuario]);
      nomeUsuario = cliente.length > 0 ? cliente[0].nome : 'Cliente';
    }
    
    // Capturar IP do usuário
    const ipAddress = req.headers['x-forwarded-for']?.split(',')[0] || 
                     req.connection?.remoteAddress || 
                     req.socket?.remoteAddress || 
                     'Desconhecido';
    
    // Inserir log no banco de dados
    await db.query(
      `INSERT INTO LogSistema 
       (id_usuario, nome_usuario, tipo_usuario, tipo_perfil, acao, tabela_afetada, 
        id_registro, campo_alterado, valor_anterior, valor_novo, descricao, ip_address)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        idUsuario,
        nomeUsuario,
        tipoUsuario,
        tipoPerfil,
        acao,
        tabelaAfetada,
        idRegistro,
        campoAlterado,
        valorAnterior,
        valorNovo,
        descricao,
        ipAddress
      ]
    );
    
    console.log(`📝 Log registrado: ${acao} em ${tabelaAfetada} por ${nomeUsuario}`);
  } catch (error) {
    console.error('❌ Erro ao registrar log:', error);
    // Não lançar erro para não interromper a operação principal
  }
}
