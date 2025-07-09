// server/routes/recuperacaoSenha.js
import express from 'express';
import { connectToDatabase } from '../lib/db.js';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { createTransport } from 'nodemailer';
import jwt from 'jsonwebtoken';

const router = express.Router();

// Configuração do Nodemailer
const transporter = createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // seu-email@gmail.com
    pass: process.env.EMAIL_PASS  // senha de app do Gmail
  }
});

// Solicitar recuperação de senha
router.post('/esqueceu-senha', async (req, res) => {
  const { email } = req.body;
  
  try {
    const db = await connectToDatabase();
    
    // Verificar se o email existe (primeiro em Usuario, depois em Cliente)
    let tipo_usuario = null;
    let userId = null;
    
    const [funcionarioRows] = await db.query('SELECT id_usuario FROM Usuario WHERE email = ?', [email]);
    if (funcionarioRows.length > 0) {
      tipo_usuario = 'funcionario';
      userId = funcionarioRows[0].id_usuario;
    } else {
      const [clienteRows] = await db.query('SELECT id_cliente FROM Cliente WHERE email = ?', [email]);
      if (clienteRows.length > 0) {
        tipo_usuario = 'cliente';
        userId = clienteRows[0].id_cliente;
      }
    }
    
    if (!tipo_usuario) {
      // Por segurança, não informamos se o email existe ou não
      return res.status(200).json({ 
        message: 'Se o email existir em nosso sistema, você receberá um link de recuperação.' 
      });
    }
    
    // Gerar token de recuperação
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    const expira_em = new Date(Date.now() + 3600000); // 1 hora
    
    // Salvar token no banco
    await db.query(
      `INSERT INTO reset_senha (email, token, expira_em, tipo_usuario) 
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE token = ?, expira_em = ?`,
      [email, resetTokenHash, expira_em, tipo_usuario, resetTokenHash, expira_em]
    );
    
    // Criar link de recuperação
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/redefinir-senha?token=${resetToken}&email=${email}`;
    
    // Email HTML
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>LAB Store</h1>
            <h2>Recuperação de Senha</h2>
          </div>
          <div class="content">
            <p>Olá,</p>
            <p>Recebemos uma solicitação para redefinir sua senha. Se você não fez esta solicitação, pode ignorar este email.</p>
            <p>Para redefinir sua senha, clique no botão abaixo:</p>
            <div style="text-align: center;">
              <a href="${resetUrl}" class="button">Redefinir Senha</a>
            </div>
            <p><strong>Este link expira em 1 hora.</strong></p>
            <p>Se o botão não funcionar, copie e cole este link no seu navegador:</p>
            <p style="word-break: break-all; background: #eee; padding: 10px; border-radius: 5px;">${resetUrl}</p>
          </div>
          <div class="footer">
            <p>Este é um email automático, não responda.</p>
            <p>&copy; 2024 LAB Store. Todos os direitos reservados.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    // Enviar email
    await transporter.sendMail({
      from: `"LAB Store" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Recuperação de Senha - LAB Store',
      html: emailHtml
    });
    
    res.status(200).json({ 
      message: 'Se o email existir em nosso sistema, você receberá um link de recuperação.' 
    });
    
  } catch (error) {
    console.error('Erro na recuperação de senha:', error);
    res.status(500).json({ message: 'Erro ao processar solicitação' });
  }
});

// Validar token de recuperação
router.post('/validar-token', async (req, res) => {
  const { token, email } = req.body;
  
  try {
    const db = await connectToDatabase();
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    
    const [rows] = await db.query(
      'SELECT * FROM reset_senha WHERE email = ? AND token = ? AND expira_em > NOW()',
      [email, tokenHash]
    );
    
    if (rows.length === 0) {
      return res.status(400).json({ message: 'Token inválido ou expirado' });
    }
    
    res.status(200).json({ message: 'Token válido', tipo_usuario: rows[0].tipo_usuario });
    
  } catch (error) {
    console.error('Erro ao validar token:', error);
    res.status(500).json({ message: 'Erro ao validar token' });
  }
});

// Resetar senha
router.post('/redefinir-senha', async (req, res) => {
  const { token, email, novaSenha } = req.body;
  
  try {
    const db = await connectToDatabase();
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    
    // Verificar token
    const [resetRows] = await db.query(
      'SELECT * FROM reset_senha WHERE email = ? AND token = ? AND expira_em > NOW()',
      [email, tokenHash]
    );
    
    if (resetRows.length === 0) {
      return res.status(400).json({ message: 'Token inválido ou expirado' });
    }
    
    const { tipo_usuario } = resetRows[0];
    
    // Hash da nova senha
    const novaSenhaHash = await bcrypt.hash(novaSenha, 10);
    
    // Atualizar senha
    if (tipo_usuario === 'funcionario') {
      await db.query(
        'UPDATE Usuario SET senha_hash = ? WHERE email = ?',
        [novaSenhaHash, email]
      );
    } else {
      await db.query(
        'UPDATE Cliente SET senha_hash = ? WHERE email = ?',
        [novaSenhaHash, email]
      );
    }
    
    // Deletar token usado
    await db.query('DELETE FROM reset_senha WHERE email = ?', [email]);
    
    res.status(200).json({ message: 'Senha alterada com sucesso!' });
    
  } catch (error) {
    console.error('Erro ao resetar senha:', error);
    res.status(500).json({ message: 'Erro ao alterar senha' });
  }
});

// Alterar senha (usuário logado)
router.post('/alterar-senha', async (req, res) => {
  const { senhaAtual, novaSenha } = req.body;
  
  try {
    // Verificar token
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Token não fornecido' });
    }
    
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const db = await connectToDatabase();
    
    // Buscar usuário e verificar senha atual
    let user = null;
    let tableName = '';
    let idColumn = '';
    
    if (decoded.tipo === 'funcionario') {
      const [rows] = await db.query('SELECT * FROM Usuario WHERE id_usuario = ?', [decoded.id]);
      user = rows[0];
      tableName = 'Usuario';
      idColumn = 'id_usuario';
    } else {
      const [rows] = await db.query('SELECT * FROM Cliente WHERE id_cliente = ?', [decoded.id]);
      user = rows[0];
      tableName = 'Cliente';
      idColumn = 'id_cliente';
    }
    
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }
    
    // Verificar senha atual
    const isMatch = await bcrypt.compare(senhaAtual, user.senha_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Senha atual incorreta' });
    }
    
    // Hash da nova senha
    const novaSenhaHash = await bcrypt.hash(novaSenha, 10);
    
    // Atualizar senha
    await db.query(
      `UPDATE ${tableName} SET senha_hash = ? WHERE ${idColumn} = ?`,
      [novaSenhaHash, decoded.id]
    );
    
    res.status(200).json({ message: 'Senha alterada com sucesso!' });
    
  } catch (error) {
    console.error('Erro ao alterar senha:', error);
    res.status(500).json({ message: 'Erro ao alterar senha' });
  }
});

export default router;