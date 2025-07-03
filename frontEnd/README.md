-- Cria o banco de dados se ele não existir

CREATE DATABASE IF NOT EXISTS labstore;
USE labstore;

-- Tabela de Usuários (Administradores, Analistas)
CREATE TABLE Usuario (
    id_usuario INT PRIMARY KEY AUTO_INCREMENT,
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
    imagemUrl VARCHAR(255) NULL,
    compatibilidade TEXT NULL,
    cor VARCHAR(50) NULL,
    ano_fabricacao INT NULL,
    FOREIGN KEY (id_categoria) REFERENCES Categoria(id_categoria)
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

-- Tabela de Chamados de Suporte (Help Desk)
CREATE TABLE ChamadoSuporte (
    id_chamado INT PRIMARY KEY AUTO_INCREMENT,
    id_cliente INT NOT NULL,
    assunto VARCHAR(100) NOT NULL,
    descricao TEXT NOT NULL,
    categoria VARCHAR(100) NULL,
    data_abertura DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status ENUM('aberto', 'em_andamento', 'respondido', 'encerrado', 'resolvido') NOT NULL DEFAULT 'aberto',
    FOREIGN KEY (id_cliente) REFERENCES Cliente(id_cliente)
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


--SENHA ADMIN É 123

INSERT INTO Usuario (email, senha_hash, tipo_perfil, status) VALUES 
('admin@gmail.com', '$10$Rslrf6oSMi.IfCTxhUHiAOTWo7BdKrXfcGaAWSg45ZGur8cxxBObi', 'admin', 'ativo'),
('analista@gmail.com', '$10$Rslrf6oSMi.IfCTxhUHiAOTWo7BdKrXfcGaAWSg45ZGur8cxxBObi', 'analista', 'ativo');
