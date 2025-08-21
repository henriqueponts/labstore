import { createTransport } from 'nodemailer';
import { connectToDatabase } from '../lib/db.js';

// Reutilizamos a configuração do transporter que você já tem
const transporter = createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // seu-email@gmail.com
    pass: process.env.EMAIL_PASS  // senha de app do Gmail
  }
});

const formatarPreco = (preco) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(preco);
};

// Função principal para enviar o e-mail de confirmação
export const enviarEmailConfirmacaoCompra = async (pedidoId) => {
  try {
    const db = await connectToDatabase();

    // 1. Buscar todos os dados necessários do pedido e do cliente
    const [pedidoRows] = await db.query(`
      SELECT 
        p.id_pedido, p.data_pedido, p.status, p.frete_nome, p.frete_valor, 
        p.frete_prazo_dias, p.endereco_entrega,
        c.nome as cliente_nome, c.email as cliente_email
      FROM Pedido p
      JOIN Cliente c ON p.id_cliente = c.id_cliente
      WHERE p.id_pedido = ?
    `, [pedidoId]);

    if (pedidoRows.length === 0) {
      console.error(`Email não enviado: Pedido ${pedidoId} não encontrado.`);
      return;
    }

    const pedido = pedidoRows[0];

    // 2. Buscar os itens do pedido
    const [itens] = await db.query(`
      SELECT 
        ip.quantidade, ip.preco_unitario, pr.nome as nome_produto
      FROM ItemPedido ip
      JOIN Produto pr ON ip.id_produto = pr.id_produto
      WHERE ip.id_pedido = ?
    `, [pedidoId]);

    // 3. Montar o HTML do e-mail
    let subtotal = 0;
    const itensHtml = itens.map(item => {
      const itemSubtotal = Number(item.quantidade) * Number(item.preco_unitario);
      subtotal += itemSubtotal;
      return `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.nome_produto}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantidade}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${formatarPreco(item.preco_unitario)}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${formatarPreco(itemSubtotal)}</td>
        </tr>
      `;
    }).join('');

    const valorTotal = subtotal + Number(pedido.frete_valor || 0);

    // 4. Lógica condicional para a seção de entrega
    let secaoEntrega = '';
    if (pedido.frete_nome === 'Retirar na Loja') {
      secaoEntrega = `
        <h3 style="color: #333;">Retirada na Loja</h3>
        <p style="font-size: 14px; color: #555;">
          Seu pedido está sendo preparado e estará disponível para retirada em breve.
          <br>
          <strong>Status:</strong> Pronta Entrega (Aguardando separação)
          <br>
          <strong>Nosso Endereço:</strong> Rua Angelo Rimoli 1672, Parque Residencial Parati, Bebedouro - SP CEP: 14708-040
          <br>
          <strong>Horário de Funcionamento:</strong> Segunda a Sexta, das 9h às 18h.
        </p>
      `;
    } else {
      secaoEntrega = `
        <h3 style="color: #333;">Detalhes da Entrega</h3>
        <p style="font-size: 14px; color: #555;">
          <strong>Método de Envio:</strong> ${pedido.frete_nome}
          <br>
          <strong>Prazo de Entrega:</strong> ${pedido.frete_prazo_dias} dia(s) útil(eis) após o envio.
          <br>
          <strong>Endereço:</strong> ${pedido.endereco_entrega}
        </p>
        <p style="font-size: 12px; color: #777;">
          Seu pedido é de pronta entrega e será despachado o mais breve possível. Você receberá um novo e-mail com o código de rastreamento assim que ele for enviado.
        </p>
      `;
    }

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px; }
          .header { background: #007bff; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { padding: 20px; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          table { width: 100%; border-collapse: collapse; }
          th { background: #f9f9f9; padding: 10px; text-align: left; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Obrigado pela sua compra!</h1>
          </div>
          <div class="content">
            <p>Olá, ${pedido.cliente_nome},</p>
            <p>Seu pedido <strong>#${String(pedido.id_pedido).padStart(6, '0')}</strong> foi confirmado com sucesso!</p>
            
            ${secaoEntrega}

            <h3 style="color: #333; border-top: 1px solid #eee; padding-top: 20px;">Resumo do Pedido</h3>
            <table>
              <thead>
                <tr>
                  <th>Produto</th>
                  <th style="text-align: center;">Qtd.</th>
                  <th style="text-align: right;">Preço Unit.</th>
                  <th style="text-align: right;">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                ${itensHtml}
              </tbody>
            </table>
            <div style="text-align: right; margin-top: 20px;">
              <p>Subtotal: <strong>${formatarPreco(subtotal)}</strong></p>
              <p>Frete: <strong>${formatarPreco(pedido.frete_valor || 0)}</strong></p>
              <p style="font-size: 18px;">Total: <strong>${formatarPreco(valorTotal)}</strong></p>
            </div>
            <p>Agradecemos a sua preferência!</p>
            <p>Atenciosamente,<br>Equipe LabStore</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} LabStore. Todos os direitos reservados.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // 5. Enviar o e-mail
    await transporter.sendMail({
      from: `"LabStore" <${process.env.EMAIL_USER}>`,
      to: pedido.cliente_email,
      subject: `Confirmação do seu Pedido LabStore #${String(pedido.id_pedido).padStart(6, '0')}`,
      html: emailHtml
    });

    console.log(`✅ E-mail de confirmação enviado para ${pedido.cliente_email} referente ao pedido ${pedidoId}`);

  } catch (error) {
    console.error(`❌ Erro ao enviar e-mail de confirmação para o pedido ${pedidoId}:`, error);
    // Não relance o erro para não quebrar o fluxo do webhook, apenas logue.
  }
};