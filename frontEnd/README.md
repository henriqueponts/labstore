

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

-- Inserindo os produtos com base nos links fornecidos
-- Produto 1: Monitor Gamer LG 26"
INSERT INTO Produto (id_categoria, nome, descricao, preco, marca, modelo, estoque, status, compatibilidade, cor, ano_fabricacao) VALUES
(
    1,
    'Monitor Gamer LG 26" UltraWide',
    'Monitor Gamer LG 26 polegadas Full HD, 75Hz, 1ms, IPS, HDMI, AMD FreeSync Premium, HDR 10, 99% sRGB, VESA.',
    899.99, -- Preço exemplo, ajuste se necessário
    'LG',
    '26WQ500',
    50, -- Estoque exemplo
    'ativo',
    'Compatível com PCs e consoles via HDMI. Suporte VESA para montagem.',
    'Preto',
    2023 -- Ano exemplo
);

-- Produto 2: Notebook Gamer ASUS ROG Strix G16
INSERT INTO Produto (id_categoria, nome, descricao, preco, marca, modelo, estoque, status, compatibilidade, cor, ano_fabricacao) VALUES
(
    2,
    'Notebook Gamer ASUS ROG Strix G16',
    'Intel Core i9-13980HX, 16GB RAM DDR5, RTX 4060 8GB, SSD 512GB NVMe, Tela 16" FHD 165Hz IPS, Windows 11.',
    12999.90, -- Preço exemplo, ajuste se necessário
    'ASUS',
    'G614JV-N3094W',
    20, -- Estoque exemplo
    'ativo',
    'Ideal para jogos de alta performance e softwares de criação. Wi-Fi 6E, Bluetooth 5.2.',
    'Cinza',
    2023 -- Ano exemplo
);

-- Produto 3: Notebook Gamer MSI Alpha 17
INSERT INTO Produto (id_categoria, nome, descricao, preco, marca, modelo, estoque, status, compatibilidade, cor, ano_fabricacao) VALUES
(
    2,
    'Notebook Gamer MSI Alpha 17',
    'AMD Ryzen 9 7945HX, 16GB RAM, SSD 1TB, Tela 17.3" QHD 240Hz, RTX 4060, Windows 11 Home.',
    14599.99, -- Preço exemplo, ajuste se necessário
    'MSI',
    '9S7-17KK11-058',
    15, -- Estoque exemplo
    'ativo',
    'Projetado para gamers e criadores de conteúdo que buscam máximo desempenho. Tela com alta taxa de atualização.',
    'Preto',
    2024 -- Ano exemplo
);

-- Produto 4: PC Gamer Ludic by BluePC
INSERT INTO Produto (id_categoria, nome, descricao, preco, marca, modelo, estoque, status, compatibilidade, cor, ano_fabricacao) VALUES
(
    3,
    'PC Gamer Ludic by BluePC',
    'AMD Ryzen 5 5500, GeForce RTX 3050 8GB, 16GB RAM, SSD 512GB M.2 NVMe, Fonte 600W 80 Plus.',
    3899.99, -- Preço exemplo, ajuste se necessário
    'Ludic by BluePC',
    'PGBP-1205LUD',
    30, -- Estoque exemplo
    'ativo',
    'Computador de mesa pronto para rodar jogos populares em Full HD. Sistema operacional não incluso.',
    'Preto',
    2024 -- Ano exemplo
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