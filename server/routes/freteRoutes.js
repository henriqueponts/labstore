// Arquivo: server/routes/freteRoutes.js

import express from 'express';
import { connectToDatabase } from '../lib/db.js';
import https from 'https';

const router = express.Router();

const MELHORENVIO_URL = 'https://www.melhorenvio.com.br/api/v2/me/shipment/calculate';

router.post('/calcular', async (req, res) => {
    // 1. Recebe a nova opção 'comSeguro' do frontend
    const { cepDestino, itens, comSeguro } = req.body;

    if (!cepDestino || !itens || itens.length === 0) {
        return res.status(400).json({ message: 'CEP de destino e itens do carrinho são obrigatórios.' });
    }

    const { MELHORENVIO_TOKEN, CEP_ORIGEM } = process.env;
    if (!MELHORENVIO_TOKEN || !CEP_ORIGEM) {
        return res.status(500).json({ message: 'Erro de configuração: Token do Melhor Envio ou CEP de Origem não definidos.' });
    }

    try {
        const db = await connectToDatabase();
        
        const idsProdutos = itens.map(item => item.id_produto);
        const placeholders = idsProdutos.map(() => '?').join(',');
        
        const [produtosDb] = await db.query(
            `SELECT id_produto, nome, preco, peso_kg, altura_cm, largura_cm, comprimento_cm FROM Produto WHERE id_produto IN (${placeholders})`,
            idsProdutos
        );
        const produtosInfo = produtosDb.reduce((acc, p) => { acc[p.id_produto] = p; return acc; }, {});

        const productsPayload = [];
        for (const item of itens) {
            const produto = produtosInfo[item.id_produto];
            if (!produto || produto.peso_kg == null || produto.altura_cm == null || produto.largura_cm == null || produto.comprimento_cm == null) {
                return res.status(400).json({ message: `O produto "${produto?.nome || 'Desconhecido'}" não possui informações completas de peso/dimensões.` });
            }

            productsPayload.push({
                id: String(produto.id_produto),
                width: Math.ceil(produto.largura_cm),
                height: Math.ceil(produto.altura_cm),
                length: Math.ceil(produto.comprimento_cm),
                weight: parseFloat(produto.peso_kg),
                // 2. Lógica para definir o valor do seguro
                // Se comSeguro for true, usa o preço do produto. Senão, usa 0.
                insurance_value: comSeguro ? parseFloat(produto.preco) : 0,
                quantity: item.quantidade,
            });
        }

        const payload = {
            from: { postal_code: CEP_ORIGEM.replace(/\D/g, '') },
            to: { postal_code: cepDestino.replace(/\D/g, '') },
            products: productsPayload,
        };

        const payloadString = JSON.stringify(payload);

        const options = {
            hostname: 'www.melhorenvio.com.br',
            path: '/api/v2/me/shipment/calculate',
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${MELHORENVIO_TOKEN}`,
                'User-Agent': 'LabStore (seu.email@tecnico.com)',
                'Content-Length': Buffer.byteLength(payloadString)
            },
        };

        console.log("Enviando para API Melhor Envio (via HTTPS nativo):", JSON.stringify(payload, null, 2));

        const responseData = await new Promise((resolve, reject) => {
            const req = https.request(options, (res) => {
                let data = '';
                res.on('data', (chunk) => { data += chunk; });
                res.on('end', () => {
                    try {
                        const parsedData = JSON.parse(data);
                        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
                            resolve(parsedData);
                        } else {
                            reject({ response: { data: parsedData, status: res.statusCode }, message: `Erro HTTP: ${res.statusCode}` });
                        }
                    } catch (e) {
                        reject({ message: `Erro ao parsear JSON: ${e.message}`, rawData: data });
                    }
                });
            });
            req.on('error', (e) => { reject({ message: `Erro na requisição: ${e.message}` }); });
            req.write(payloadString);
            req.end();
        });

        console.log("Resposta COMPLETA da API Melhor Envio:", responseData);

        const opcoesCorreios = responseData.filter(servico => 
            servico.company && servico.company.name === 'Correios'
        );

        console.log("Resposta FILTRADA (apenas Correios):", opcoesCorreios);
        
        res.status(200).json(opcoesCorreios);

    } catch (error) {
        console.error('---------------------------------');
        console.error('ERRO DETALHADO AO CALCULAR FRETE (Melhor Envio):');
        if (error.response) {
            console.error('Data:', error.response.data);
            console.error('Status:', error.response.status);
        } else {
            console.error('Error:', error.message);
        }
        console.error('---------------------------------');
        
        res.status(500).json({ message: error.response?.data?.error || 'Não foi possível calcular o frete.' });
    }
});

export default router;