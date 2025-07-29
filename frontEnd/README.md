-- Cria o banco de dados se ele não existir

CREATE DATABASE IF NOT EXISTS labstore;
USE labstore;

-- Tabela de Usuários (Administradores, Analistas)
CREATE TABLE Usuario (
    id_usuario INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    senha_hash VARCHAR(255) NOT NULL,
    tipo_perfil ENUM('admin', 'analista') NOT NULL,
    data_cadastro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status ENUM('ativo', 'inativo') NOT NULL DEFAULT 'ativo'
);

-- Tabela de Clientes
CREATE TABLE Cliente (
    id_cliente INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    senha_hash VARCHAR(255) NOT NULL,
    cpf_cnpj VARCHAR(20) NOT NULL UNIQUE,
    endereco VARCHAR(255),
    telefone VARCHAR(20),
    data_cadastro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status ENUM('ativo', 'inativo') NOT NULL DEFAULT 'ativo'
);

-- Tabela de Categorias de Produtos
CREATE TABLE Categoria (
    id_categoria INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(100) NOT NULL UNIQUE,
    descricao TEXT
);

-- Tabela de Produtos
CREATE TABLE Produto (
    id_produto INT PRIMARY KEY AUTO_INCREMENT,
    id_categoria INT NOT NULL,
    nome VARCHAR(100) NOT NULL,
    descricao TEXT NOT NULL,
    preco DECIMAL(10,2) NOT NULL,
    marca VARCHAR(50),
    modelo VARCHAR(50),
    estoque INT NOT NULL DEFAULT 0,
    status ENUM('ativo', 'inativo') NOT NULL DEFAULT 'ativo',
    compatibilidade TEXT NULL,
    cor VARCHAR(50) NULL,
    ano_fabricacao INT NULL,
    peso_kg DECIMAL(10, 3) NULL,
    altura_cm DECIMAL(10, 2) NULL,
    largura_cm DECIMAL(10, 2) NULL,
    comprimento_cm DECIMAL(10, 2) NULL,
    FOREIGN KEY (id_categoria) REFERENCES Categoria(id_categoria)
);


CREATE TABLE ProdutoImagem (
    id_imagem INT PRIMARY KEY AUTO_INCREMENT,
    id_produto INT NOT NULL,
    url_imagem VARCHAR(255) NOT NULL,
    nome_arquivo VARCHAR(255) NOT NULL,
    ordem INT DEFAULT 0,
    is_principal BOOLEAN DEFAULT FALSE,
    data_upload DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_produto) REFERENCES Produto(id_produto) ON DELETE CASCADE,
    INDEX idx_produto_imagem (id_produto),
    INDEX idx_imagem_principal (id_produto, is_principal)
);

-- Tabela de Pedidos
CREATE TABLE Pedido (
    id_pedido INT PRIMARY KEY AUTO_INCREMENT,
    id_cliente INT NOT NULL,
    data_pedido DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status ENUM('aguardando_pagamento', 'processando', 'enviado', 'entregue', 'cancelado', 'concluido') NOT NULL DEFAULT 'aguardando_pagamento',
    metodo_pagamento ENUM('pix', 'cartao_credito', 'boleto') NOT NULL,
    endereco_entrega VARCHAR(255) NULL,
    FOREIGN KEY (id_cliente) REFERENCES Cliente(id_cliente)
);

-- Tabela de Itens de um Pedido
CREATE TABLE ItemPedido (
    id_item_pedido INT PRIMARY KEY AUTO_INCREMENT,
    id_pedido INT NOT NULL,
    id_produto INT NOT NULL,
    quantidade INT NOT NULL,
    preco_unitario DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (id_pedido) REFERENCES Pedido(id_pedido) ON DELETE CASCADE,
    FOREIGN KEY (id_produto) REFERENCES Produto(id_produto)
);

-- Tabela de Solicitações de Serviço Técnico
CREATE TABLE SolicitacaoServico (
    id_solicitacao INT PRIMARY KEY AUTO_INCREMENT,
    id_cliente INT NOT NULL,
    tipo_equipamento ENUM('notebook', 'desktop', 'tablet', 'outros') NOT NULL,
    marca VARCHAR(50) NOT NULL,
    modelo VARCHAR(50) NOT NULL,
    descricao_problema TEXT NOT NULL,
    fotoUrl VARCHAR(255) NULL,
    forma_envio VARCHAR(50) NULL,
    data_solicitacao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status ENUM('solicitado', 'em_analise', 'aguardando_aprovacao', 'aprovado', 'rejeitado', 'em_execucao', 'cancelado', 'aguardando_pagamento', 'concluido') NOT NULL DEFAULT 'solicitado',
    data_aprovacao_orcamento DATETIME NULL,
    data_conclusao_servico DATETIME NULL,
    motivo_recusa_orcamento TEXT NULL,
    FOREIGN KEY (id_cliente) REFERENCES Cliente(id_cliente)
);

-- Tabela de Orçamentos para Solicitações de Serviço
CREATE TABLE Orcamento (
    id_orcamento INT PRIMARY KEY AUTO_INCREMENT,
    id_solicitacao INT NOT NULL UNIQUE,
    id_analista INT NOT NULL,
    diagnostico TEXT NOT NULL,
    valor_pecas DECIMAL(10,2) NULL,
    valor_mao_obra DECIMAL(10,2) NOT NULL,
    prazo_entrega_dias INT NULL,
    observacoes_tecnicas TEXT NULL,
    status_aprovacao ENUM('pendente', 'aprovado', 'recusado') NOT NULL DEFAULT 'pendente',
    data_criacao_orcamento DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, -- Adicionado
    FOREIGN KEY (id_solicitacao) REFERENCES SolicitacaoServico(id_solicitacao) ON DELETE CASCADE,
    FOREIGN KEY (id_analista) REFERENCES Usuario(id_usuario)
);

-- Tabela de Logs de Auditoria
CREATE TABLE LogAuditoria (
    id_log INT PRIMARY KEY AUTO_INCREMENT,
    id_usuario INT NULL,
    id_cliente INT NULL,
    tipo_acao VARCHAR(50) NOT NULL,
    detalhes_acao TEXT NOT NULL,
    data_hora DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resultado ENUM('sucesso', 'falha') NOT NULL,
    ip_address VARCHAR(45) NULL,
    FOREIGN KEY (id_usuario) REFERENCES Usuario(id_usuario) ON DELETE SET NULL,
    FOREIGN KEY (id_cliente) REFERENCES Cliente(id_cliente) ON DELETE SET NULL
);

-- Tabela de Termos de Consentimento (LGPD)
CREATE TABLE TermoConsentimento (
    id_termo INT PRIMARY KEY AUTO_INCREMENT,
    conteudo TEXT NOT NULL,
    versao VARCHAR(20) NOT NULL UNIQUE,
	status_termo ENUM('pendente', 'ativo') DEFAULT 'ativo',
    data_efetiva DATE NOT NULL
);

-- Tabela de Consentimento dos Usuários aos Termos (LGPD)
CREATE TABLE ConsentimentoUsuario (
    id_consentimento INT PRIMARY KEY AUTO_INCREMENT,
    id_cliente INT NOT NULL,
    id_termo INT NOT NULL,
    data_aceite DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    data_revogacao DATETIME NULL,
    ip_address_aceite VARCHAR(45) NULL,
    FOREIGN KEY (id_cliente) REFERENCES Cliente(id_cliente) ON DELETE CASCADE,
    FOREIGN KEY (id_termo) REFERENCES TermoConsentimento(id_termo)
);

-- Tabela de Carrinho de Compras
CREATE TABLE Carrinho (
    id_carrinho INT PRIMARY KEY AUTO_INCREMENT,
    id_cliente INT NOT NULL UNIQUE,
    data_criacao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    data_ultima_modificacao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_cliente) REFERENCES Cliente(id_cliente) ON DELETE CASCADE
);

-- Tabela de Itens do Carrinho de Compras
CREATE TABLE ItemCarrinho (
    id_item_carrinho INT PRIMARY KEY AUTO_INCREMENT,
    id_carrinho INT NOT NULL,
    id_produto INT NOT NULL,
    quantidade INT NOT NULL,
    preco_unitario_no_momento_adicao DECIMAL(10,2) NOT NULL,
    data_adicao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_carrinho) REFERENCES Carrinho(id_carrinho) ON DELETE CASCADE,
    FOREIGN KEY (id_produto) REFERENCES Produto(id_produto) ON DELETE CASCADE,
    UNIQUE KEY (id_carrinho, id_produto)
);

CREATE TABLE IF NOT EXISTS reset_senha (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  token VARCHAR(255) NOT NULL,
  expira_em TIMESTAMP NOT NULL,
  tipo_usuario ENUM('cliente', 'funcionario') NOT NULL,
  data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY email_unico (email)
);

-- Tabela de Chamados de Suporte (Help Desk)
CREATE TABLE ChamadoSuporte (
    id_chamado INT PRIMARY KEY AUTO_INCREMENT,
    id_cliente INT NOT NULL,
    assunto VARCHAR(100) NOT NULL,
    descricao TEXT NOT NULL,
    categoria VARCHAR(100) NULL,
    funcionario_responsavel INT NULL,
    ultima_resposta TEXT NULL,
    proximo_responder ENUM('cliente', 'funcionario') DEFAULT 'funcionario',
    total_respostas INT DEFAULT 0,
    ultima_atividade TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    data_ultima_resposta TIMESTAMP,
    data_abertura DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status ENUM('aberto', 'aguardando_cliente', 'aguardando_funcionario', 'resolvido', 'encerrado') NOT NULL DEFAULT 'aberto',
    FOREIGN KEY (id_cliente) REFERENCES Cliente(id_cliente),
    FOREIGN KEY (funcionario_responsavel) REFERENCES Usuario(id_usuario) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS RespostaChamado (
    id_resposta INT AUTO_INCREMENT PRIMARY KEY,
    id_chamado INT NOT NULL,
    id_funcionario INT NULL,
    id_cliente INT NULL,
    resposta TEXT NOT NULL,
    data_resposta TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    tipo_usuario ENUM('cliente', 'funcionario') NOT NULL,
    FOREIGN KEY (id_chamado) REFERENCES ChamadoSuporte(id_chamado) ON DELETE CASCADE,
    FOREIGN KEY (id_funcionario) REFERENCES Usuario(id_usuario) ON DELETE CASCADE,
    FOREIGN KEY (id_cliente) REFERENCES Cliente(id_cliente) ON DELETE CASCADE,
    INDEX idx_chamado (id_chamado),
    INDEX idx_funcionario (id_funcionario),
    INDEX idx_data (data_resposta)
);

DELIMITER //
CREATE PROCEDURE AdicionarItemCarrinho(
    IN p_id_cliente INT,
    IN p_id_produto INT,
    IN p_quantidade INT
)
BEGIN
    DECLARE v_id_carrinho INT;
    DECLARE v_preco_atual DECIMAL(10,2);
    DECLARE v_estoque_disponivel INT;
    
    -- Verifica se o produto existe e está ativo
    SELECT preco, estoque INTO v_preco_atual, v_estoque_disponivel
    FROM Produto 
    WHERE id_produto = p_id_produto AND status = 'ativo';
    
    -- Verifica se há estoque suficiente
    IF v_estoque_disponivel < p_quantidade THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Estoque insuficiente';
    END IF;
    
    -- Busca ou cria o carrinho do cliente
    SELECT id_carrinho INTO v_id_carrinho 
    FROM Carrinho 
    WHERE id_cliente = p_id_cliente;
    
    IF v_id_carrinho IS NULL THEN
        INSERT INTO Carrinho (id_cliente) VALUES (p_id_cliente);
        SET v_id_carrinho = LAST_INSERT_ID();
    END IF;
    
    -- Adiciona ou atualiza o item no carrinho
    INSERT INTO ItemCarrinho (id_carrinho, id_produto, quantidade, preco_unitario_no_momento_adicao)
    VALUES (v_id_carrinho, p_id_produto, p_quantidade, v_preco_atual)
    ON DUPLICATE KEY UPDATE 
        quantidade = quantidade + p_quantidade,
        data_adicao = CURRENT_TIMESTAMP;
        
END//
DELIMITER ;

-- 3. Procedure para atualizar quantidade de um item
DELIMITER //
CREATE PROCEDURE AtualizarQuantidadeItem(
    IN p_id_cliente INT,
    IN p_id_produto INT,
    IN p_nova_quantidade INT
)
BEGIN
    DECLARE v_id_carrinho INT;
    DECLARE v_estoque_disponivel INT;
    
    -- Verifica estoque
    SELECT estoque INTO v_estoque_disponivel
    FROM Produto 
    WHERE id_produto = p_id_produto AND status = 'ativo';
    
    IF v_estoque_disponivel < p_nova_quantidade THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Estoque insuficiente';
    END IF;
    
    -- Busca o carrinho
    SELECT id_carrinho INTO v_id_carrinho 
    FROM Carrinho 
    WHERE id_cliente = p_id_cliente;
    
    -- Atualiza a quantidade ou remove se for 0
    IF p_nova_quantidade > 0 THEN
        UPDATE ItemCarrinho 
        SET quantidade = p_nova_quantidade 
        WHERE id_carrinho = v_id_carrinho 
        AND id_produto = p_id_produto;
    ELSE
        DELETE FROM ItemCarrinho 
        WHERE id_carrinho = v_id_carrinho 
        AND id_produto = p_id_produto;
    END IF;
    
END//
DELIMITER ;

-- 4. Procedure para remover item do carrinho
DELIMITER //
CREATE PROCEDURE RemoverItemCarrinho(
    IN p_id_cliente INT,
    IN p_id_produto INT
)
BEGIN
    DECLARE v_id_carrinho INT;
    
    SELECT id_carrinho INTO v_id_carrinho 
    FROM Carrinho 
    WHERE id_cliente = p_id_cliente;
    
    DELETE FROM ItemCarrinho 
    WHERE id_carrinho = v_id_carrinho 
    AND id_produto = p_id_produto;
    
END//
DELIMITER ;

-- 5. Procedure para limpar carrinho completo
DELIMITER //
CREATE PROCEDURE LimparCarrinho(IN p_id_cliente INT)
BEGIN
    DECLARE v_id_carrinho INT;
    
    SELECT id_carrinho INTO v_id_carrinho 
    FROM Carrinho 
    WHERE id_cliente = p_id_cliente;
    
    DELETE FROM ItemCarrinho WHERE id_carrinho = v_id_carrinho;
    
END//
DELIMITER ;

-- 6. View para facilitar consultas do carrinho com detalhes dos produtos
CREATE VIEW CarrinhoDetalhado AS
SELECT 
    c.id_cliente,
    c.data_criacao as data_criacao_carrinho,
    c.data_ultima_modificacao,
    ic.id_produto,
    p.nome as nome_produto,
    p.descricao as descricao_produto,
    p.preco as preco_atual,
    ic.preco_unitario_no_momento_adicao,
    ic.quantidade,
    (ic.quantidade * ic.preco_unitario_no_momento_adicao) as subtotal,
    p.estoque,
    p.status as status_produto,
    pi.url_imagem as imagem_principal
FROM Carrinho c
JOIN ItemCarrinho ic ON c.id_carrinho = ic.id_carrinho
JOIN Produto p ON ic.id_produto = p.id_produto
LEFT JOIN ProdutoImagem pi ON p.id_produto = pi.id_produto AND pi.is_principal = TRUE;

-- 7. Trigger para limpar carrinhos antigos (opcional - rodar via cron job)
-- Limpa carrinhos sem modificação há mais de 30 dias
DELIMITER //
CREATE EVENT LimparCarrinhosAntigos
ON SCHEDULE EVERY 1 DAY
DO
BEGIN
    DELETE c, ic 
    FROM Carrinho c
    LEFT JOIN ItemCarrinho ic ON c.id_carrinho = ic.id_carrinho
    WHERE c.data_ultima_modificacao < DATE_SUB(NOW(), INTERVAL 30 DAY);
END//
DELIMITER ;

-- 8. Função para calcular total do carrinho
DELIMITER //
CREATE FUNCTION CalcularTotalCarrinho(p_id_cliente INT) 
RETURNS DECIMAL(10,2)
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE v_total DECIMAL(10,2) DEFAULT 0;
    
    SELECT COALESCE(SUM(quantidade * preco_unitario_no_momento_adicao), 0)
    INTO v_total
    FROM Carrinho c
    JOIN ItemCarrinho ic ON c.id_carrinho = ic.id_carrinho
    WHERE c.id_cliente = p_id_cliente;
    
    RETURN v_total;
END//
DELIMITER ;


DELIMITER //

CREATE TRIGGER update_chamado_stats 
AFTER INSERT ON RespostaChamado
FOR EACH ROW
BEGIN
    UPDATE ChamadoSuporte 
    SET total_respostas = total_respostas + 1,
        ultima_atividade = NOW()
    WHERE id_chamado = NEW.id_chamado;
END//
DELIMITER ;


-- admin@gmail.com
-- analista@gmail.com
-- SENHA É 123

INSERT INTO Usuario (nome, email, senha_hash, tipo_perfil, status) VALUES 
('Admin','admin@gmail.com', '$2b$10$be0jgPSIoDkVMjyNHLAsF.ABFs/dZUVapI8/AhT.M3sHSwhWUl4YK', 'admin', 'ativo'),
('Analista','analista@gmail.com', '$2b$10$be0jgPSIoDkVMjyNHLAsF.ABFs/dZUVapI8/AhT.M3sHSwhWUl4YK', 'analista', 'ativo');


-- Inserindo as categorias necessárias para os produtos
-- (Estou assumindo que os IDs 1, 2 e 3 estarão disponíveis na sua tabela Categoria)
INSERT INTO Categoria (id_categoria, nome, descricao) VALUES
(1, 'Monitores', 'Monitores de vídeo para computadores e outros dispositivos.'),
(2, 'Notebooks', 'Computadores portáteis de diversas marcas e modelos.'),
(3, 'PCs Gamer', 'Computadores de mesa montados e otimizados para jogos.');

-- Produto 1: Monitor LG
INSERT INTO Produto 
(id_categoria, nome, descricao, preco, marca, modelo, estoque, status, compatibilidade, cor, ano_fabricacao, peso_kg, altura_cm, largura_cm, comprimento_cm) 
VALUES (
    1,
    'Monitor Gamer LG 26" UltraWide',
    'Monitor Gamer LG 26 polegadas Full HD, 75Hz, 1ms, IPS, HDMI, AMD FreeSync Premium, HDR 10, 99% sRGB, VESA.',
    899.99,
    'LG',
    '26WQ500',
    50,
    'ativo',
    'Compatível com PCs e consoles via HDMI. Suporte VESA para montagem.',
    'Preto',
    2023,
    3.200,
    41.2,
    61.1,
    22.5
);

-- Produto 2: Notebook ASUS
INSERT INTO Produto 
(id_categoria, nome, descricao, preco, marca, modelo, estoque, status, compatibilidade, cor, ano_fabricacao, peso_kg, altura_cm, largura_cm, comprimento_cm) 
VALUES (
    2,
    'Notebook Gamer ASUS ROG Strix G16',
    'Intel Core i9-13980HX, 16GB RAM DDR5, RTX 4060 8GB, SSD 512GB NVMe, Tela 16" FHD 165Hz IPS, Windows 11.',
    12999.90,
    'ASUS',
    'G614JV-N3094W',
    20,
    'ativo',
    'Ideal para jogos de alta performance e softwares de criação. Wi-Fi 6E, Bluetooth 5.2.',
    'Cinza',
    2023,
    2.500,
    2.26,
    35.4,
    26.4
);

-- Produto 3: Notebook MSI
INSERT INTO Produto 
(id_categoria, nome, descricao, preco, marca, modelo, estoque, status, compatibilidade, cor, ano_fabricacao, peso_kg, altura_cm, largura_cm, comprimento_cm) 
VALUES (
    2,
    'Notebook Gamer MSI Alpha 17',
    'AMD Ryzen 9 7945HX, 16GB RAM, SSD 1TB, Tela 17.3" QHD 240Hz, RTX 4060, Windows 11 Home.',
    14599.99,
    'MSI',
    '9S7-17KK11-058',
    15,
    'ativo',
    'Projetado para gamers e criadores de conteúdo que buscam máximo desempenho. Tela com alta taxa de atualização.',
    'Preto',
    2024,
    2.800,
    2.50,
    39.8,
    27.3
);

-- Produto 4: PC Gamer Ludic
INSERT INTO Produto 
(id_categoria, nome, descricao, preco, marca, modelo, estoque, status, compatibilidade, cor, ano_fabricacao, peso_kg, altura_cm, largura_cm, comprimento_cm) 
VALUES (
    3,
    'PC Gamer Ludic by BluePC',
    'AMD Ryzen 5 5500, GeForce RTX 3050 8GB, 16GB RAM, SSD 512GB M.2 NVMe, Fonte 600W 80 Plus.',
    3899.99,
    'Ludic by BluePC',
    'PGBP-1205LUD',
    30,
    'ativo',
    'Computador de mesa pronto para rodar jogos populares em Full HD. Sistema operacional não incluso.',
    'Preto',
    2024,
    8.500,
    45.0,
    20.0,
    45.0
);


-- Inserindo imagens para os produtos
-- Lembre-se de ajustar o id_produto se os IDs dos seus produtos forem diferentes.

-- Imagens para o Monitor Gamer LG (assumindo id_produto = 1)
INSERT INTO ProdutoImagem (id_produto, url_imagem, nome_arquivo, ordem, is_principal) VALUES
(
    1, -- ID do Monitor LG
    '/uploads/produtos/monitor-lg-1.webp', -- Caminho relativo usado pela API
    'monitor-lg-1.webp', -- Nome do arquivo
    0, -- Ordem de exibição (primeira)
    TRUE -- Define esta como a imagem principal
),
(
    1, -- ID do Monitor LG
    '/uploads/produtos/monitor-lg-2.webp',
    'monitor-lg-2.webp',
    1, -- Ordem de exibição (segunda)
    FALSE -- Não é a imagem principal
);

-- Imagens para o Notebook Gamer ASUS (assumindo id_produto = 2)
INSERT INTO ProdutoImagem (id_produto, url_imagem, nome_arquivo, ordem, is_principal) VALUES
(
    2, -- ID do Notebook ASUS
    '/uploads/produtos/notebook-asus-1.webp',
    'notebook-asus-1.webp',
    0,
    TRUE
),
(
    2, -- ID do Notebook ASUS
    '/uploads/produtos/notebook-asus-2.webp',
    'notebook-asus-2.webp',
    1,
    FALSE
);

-- Imagens para o Notebook Gamer MSI (assumindo id_produto = 3)
INSERT INTO ProdutoImagem (id_produto, url_imagem, nome_arquivo, ordem, is_principal) VALUES
(
    3, -- ID do Notebook MSI
    '/uploads/produtos/notebook-msi-1.webp',
    'notebook-msi-1.webp',
    0,
    TRUE
),
(
    3, -- ID do Notebook MSI
    '/uploads/produtos/notebook-msi-2.webp',
    'notebook-msi-2.webp',
    1,
    FALSE
);

-- Imagens para o PC Gamer Ludic (assumindo id_produto = 4)
INSERT INTO ProdutoImagem (id_produto, url_imagem, nome_arquivo, ordem, is_principal) VALUES
(
    4, -- ID do PC Gamer Ludic
    '/uploads/produtos/pc-ludic-1.webp',
    'pc-ludic-1.webp',
    0,
    TRUE
),
(
    4, -- ID do PC Gamer Ludic
    '/uploads/produtos/pc-ludic-2.webp',
    'pc-ludic-2.webp',
    1,
    FALSE
);

