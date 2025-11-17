# Documentação do Sistema de Logs

## Visão Geral

O sistema de logs registra automaticamente todas as ações importantes realizadas no sistema LabStore, incluindo autenticação, gerenciamento de produtos, pedidos e assistências técnicas.

## Estrutura da Tabela LogSistema

A tabela `LogSistema` armazena as seguintes informações:

- **id_log**: ID único do log
- **id_usuario**: ID do usuário que realizou a ação
- **nome_usuario**: Nome do usuário
- **tipo_usuario**: Tipo (cliente ou funcionario)
- **tipo_perfil**: Perfil (admin ou analista)
- **acao**: Tipo de ação realizada
- **tabela_afetada**: Tabela do banco de dados afetada
- **id_registro**: ID do registro afetado
- **campo_alterado**: Campo específico alterado
- **valor_anterior**: Valor antes da alteração
- **valor_novo**: Valor após a alteração
- **descricao**: Descrição detalhada da ação
- **ip_address**: Endereço IP do usuário
- **data_acao**: Data e hora da ação

## Tipos de Logs Registrados

### 1. Autenticação (authRoutes.js)

#### LOGIN
- **Quando**: Usuário faz login com sucesso
- **Tabela**: Cliente ou Usuario
- **Descrição**: "Login realizado com sucesso"
- **Exemplo**: Admin faz login → Log com ação LOGIN

#### LOGIN_FAILED
- **Quando**: Tentativa de login falhou
- **Tabela**: N/A
- **Descrição**: "Tentativa de login falhou para email: [email]"
- **Exemplo**: Senha incorreta → Log com ação LOGIN_FAILED

#### LOGOUT
- **Quando**: Usuário faz logout
- **Tabela**: Cliente ou Usuario
- **Descrição**: "Logout realizado"
- **Exemplo**: Admin faz logout → Log com ação LOGOUT

#### CREATE (Cadastro)
- **Quando**: Novo cliente ou funcionário é cadastrado
- **Tabela**: Cliente ou Usuario
- **Descrição**: "Novo [cliente/funcionário] cadastrado: [nome]"
- **Exemplo**: Novo cliente se registra → Log com ação CREATE

### 2. Produtos (produtoRoutes.js)

#### CREATE (Criação)
- **Quando**: Novo produto é criado
- **Tabela**: Produto
- **Descrição**: "Produto '[nome]' criado com estoque inicial de [quantidade] unidades"
- **Valor Novo**: JSON com dados do produto
- **Exemplo**: Admin cria produto "Mouse Gamer" → Log com ação CREATE

#### UPDATE (Atualização)
- **Quando**: Informações do produto são alteradas (nome, preço, etc.)
- **Tabela**: Produto
- **Campo Alterado**: nome, preco, descricao, etc.
- **Descrição**: Varia conforme o campo
  - Nome: "Nome do produto alterado de '[antigo]' para '[novo]'"
  - Preço: "Preço do produto '[nome]' alterado de R$ [antigo] para R$ [novo]"
- **Exemplo**: Admin altera preço de R$ 50,00 para R$ 45,00 → Log com ação UPDATE

#### STOCK_UPDATE (Atualização de Estoque)
- **Quando**: Estoque do produto é alterado
- **Tabela**: Produto
- **Campo Alterado**: estoque
- **Descrição**: "Estoque do produto '[nome]' alterado de [antigo] para [novo]"
- **Valor Anterior**: Estoque antigo
- **Valor Novo**: Estoque novo
- **Exemplo**: Estoque alterado de 10 para 15 → Log com ação STOCK_UPDATE

#### DELETE (Exclusão)
- **Quando**: Produto é deletado
- **Tabela**: Produto
- **Descrição**: "Produto '[nome]' deletado (tinha [quantidade] unidades em estoque e custava R$ [preço])"
- **Valor Anterior**: JSON com dados do produto
- **Exemplo**: Admin deleta produto → Log com ação DELETE

### 3. Pedidos (pedidoRoutes.js)

#### REFUND_REQUEST (Solicitação de Estorno)
- **Quando**: Cliente solicita estorno de um pedido
- **Tabela**: Pedido
- **Descrição**: "Cliente [nome] solicitou estorno para o pedido #[id]"
- **Exemplo**: Cliente solicita reembolso → Log com ação REFUND_REQUEST

### 4. Assistência Técnica (assistenciaRoutes.js)

#### CREATE (Nova Solicitação)
- **Quando**: Cliente cria nova solicitação de assistência
- **Tabela**: SolicitacaoAssistencia
- **Descrição**: "Nova solicitação de assistência criada: [descrição]"
- **Exemplo**: Cliente solicita reparo → Log com ação CREATE

#### BUDGET_APPROVE (Aprovar Orçamento)
- **Quando**: Cliente aprova um orçamento
- **Tabela**: Orcamento
- **Descrição**: "Orçamento #[id] aprovado pelo cliente"
- **Exemplo**: Cliente aceita orçamento → Log com ação BUDGET_APPROVE

#### BUDGET_REJECT (Rejeitar Orçamento)
- **Quando**: Cliente rejeita um orçamento
- **Tabela**: Orcamento
- **Descrição**: "Orçamento #[id] rejeitado pelo cliente"
- **Exemplo**: Cliente recusa orçamento → Log com ação BUDGET_REJECT

#### ASSISTANCE_CANCEL (Cancelar Assistência)
- **Quando**: Solicitação de assistência é cancelada
- **Tabela**: SolicitacaoAssistencia
- **Descrição**: "Solicitação de assistência #[id] cancelada"
- **Exemplo**: Cliente cancela solicitação → Log com ação ASSISTANCE_CANCEL

#### BUDGET_CREATE (Criar Orçamento)
- **Quando**: Técnico cria um orçamento para uma solicitação
- **Tabela**: Orcamento
- **Descrição**: "Orçamento criado para a solicitação #[id] no valor de R$ [valor]"
- **Valor Novo**: Valor do orçamento
- **Exemplo**: Técnico cria orçamento de R$ 150,00 → Log com ação BUDGET_CREATE

#### STATUS_CHANGE (Mudança de Status)
- **Quando**: Status da solicitação de assistência é alterado
- **Tabela**: SolicitacaoAssistencia
- **Campo Alterado**: status
- **Descrição**: "Status da solicitação #[id] alterado de '[antigo]' para '[novo]'"
- **Valor Anterior**: Status antigo
- **Valor Novo**: Status novo
- **Exemplo**: Status muda de "Aguardando" para "Em análise" → Log com ação STATUS_CHANGE

## Como Visualizar os Logs

### Acesso
1. Faça login como **admin** (admin@gmail.com / 123)
2. Acesse a página de logs em: http://localhost:5173/logs
3. Ou clique no menu "Logs" no header (disponível apenas para admins)

### Filtros Disponíveis
- **Data Início/Fim**: Filtra logs por período
- **Usuário**: Busca por nome de usuário
- **Ação**: Filtra por tipo de ação (CREATE, UPDATE, DELETE, etc.)
- **Tabela**: Filtra por tabela afetada (Produto, Cliente, Pedido, etc.)
- **Paginação**: 50 logs por página

### Estatísticas
A aba "Estatísticas" mostra:
- Total de ações realizadas
- Ações mais comuns por tipo
- Usuários mais ativos
- Tabelas mais alteradas
- Ações por dia (últimos 7 dias)

## Cores dos Badges de Ação

- **CREATE** (Verde): Nova criação
- **UPDATE** (Azul): Atualização
- **DELETE** (Vermelho): Exclusão
- **LOGIN** (Roxo): Login
- **LOGOUT** (Cinza): Logout
- **REFUND_REQUEST / ESTORNO** (Laranja): Estorno
- **ASSISTANCE_CANCEL / CANCELAMENTO** (Vermelho escuro): Cancelamento
- **STATUS_CHANGE** (Verde-azulado): Mudança de status
- **STOCK_UPDATE** (Amarelo): Atualização de estoque

## Segurança

- Apenas admins podem visualizar logs
- Logs são gerados automaticamente, sem intervenção manual
- Registra IP do usuário para auditoria
- Não é possível deletar ou editar logs (apenas visualizar)
- Logs capturam valores antes e depois das alterações para rastreabilidade

## Benefícios

1. **Auditoria Completa**: Rastreamento de todas as ações no sistema
2. **Segurança**: Identificação de ações suspeitas
3. **Conformidade**: Atende requisitos de LGPD e auditoria
4. **Debug**: Facilita identificação de problemas
5. **Análise**: Estatísticas de uso do sistema
