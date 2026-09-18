# Operações Comercial e Administrativa

## Objetivo

Concluir os controles operacionais dos módulos `/app` e `/adm`, sem integrar Asaas. A fonte de verdade continua sendo o Supabase; não haverá listas paralelas no navegador.

## Escopo

### Comercial

- Persistir início de rota e início/fim de visita como `activities`.
- Criar e manter um `follow_ups` ativo por lead, com motivo, responsável, data e status.
- Ao registrar fechamento, converter o lead para onboarding, criar a atividade de fechamento e criar follow-up de implantação. Não criar cobrança nem chamar Asaas.
- Substituir os três cartões vazios de apoio por telas úteis: manual comercial, objeções e checklist de fechamento/implantação.
- Transformar Placas em operação: listar placas da organização, abrir código/URL e iniciar ativação/vínculo de placa existente.
- Manter os links WhatsApp e e-mail como ações externas condicionadas a telefone/e-mail e link de compra válidos.

### Administrativo

- Produtos: editar preço/ciclo/código, ativar/pausar e excluir quando não houver assinatura vinculada.
- Assinaturas: editar quantidade, valor, ciclo e vencimento; pausar/reativar/cancelar. Ações alteram somente a base interna.
- Cobranças internas: abrir link salvo, marcar paga, cancelar e reenviar o link por WhatsApp/e-mail quando houver dados. Não criar nem consultar cobrança no Asaas.
- Tags: aplicar, remover de cliente, editar e excluir quando não houver vínculo.
- Distribuição: editar nome/prioridade/responsável/estado, remover e reordenar. Condições continuam simples nesta fase (manual ou responsável fixo).
- Placas: vincular cliente/local, ativar, bloquear e desvincular. A geração continua usando a função `create-plate`.
- Equipe: editar papel/capacidade, desativar/reativar, revogar vínculo e reenviar convite. Convites continuam usando `invite-member`.
- Configurações: editar nome, fuso e moeda da organização e parâmetros internos, sem configurações de gateway financeiro.

### Acesso

- O login permanece único.
- A rota inicial será definida por função: admin para `/adm`, comercial/parceiro para `/app`, cliente para `/cliente`.
- Cada módulo mostrará estado de acesso negado em vez de apenas carregar uma interface sem dados.
- RLS continua como barreira de dados; o bloqueio de rota é uma camada adicional de experiência e segurança.

## Modelo e dados

- Reusar `activities`, `follow_ups`, `accounts`, `subscriptions`, `invoices`, `products`, `tags`, `account_tags`, `plates`, `plate_assignments` e `organization_members` existentes.
- Acrescentar apenas campos indispensáveis para status de visita/rota e controles administrativos que não existam.
- Migrations serão aditivas, com RLS mantido e políticas baseadas na função de operação da organização existente.
- Todas as mutações registram uma atividade de auditoria operacional.

## Entregas verticais

1. Follow-up, visita, rota e fechamento persistentes no Comercial.
2. Gestão de produtos, serviços, tags e cobranças internas no Administrativo.
3. Operação de placas e gestão da equipe no Administrativo, com visualização no Comercial.
4. Apoio comercial, configurações e redirecionamento por papel.

## Tratamento de erro

- Toda ação mutável terá estado de envio, retorno de sucesso e mensagem de falha legível.
- Botões são desabilitados somente durante a operação ou quando faltarem dados obrigatórios.
- Links externos não alteram o banco; abertura falha não muda status interno.

## Verificação

- Testes de tipos, lint e build após cada entrega.
- Teste manual autenticado para criar/editar/concluir follow-up, converter lead, administrar produto/assinatura/tag/placa/equipe e validar acesso por perfil.
- Migrations aplicadas e verificadas no Supabase antes de testar fluxos que dependam delas.

## Fora de escopo

- API, token, webhook, conciliação ou qualquer automação do Asaas.
- Cobrança externa automática.
- Roteirização com GPS e navegação turn-by-turn; rota desta fase registra progresso operacional e visita.
