# Comercial e Administrativo — Plano de Implementação

> **Para execução por agentes:** execução sequencial no workspace atual, com um checkpoint de verificação ao final de cada entrega.

**Objetivo:** concluir as ações operacionais pendentes de `/app` e `/adm`, mantendo a base única no Supabase e excluindo qualquer integração com Asaas.

**Arquitetura:** as interfaces continuarão a usar os workspaces vivos já existentes. As mutações passam por funções tipadas do cliente Supabase, protegidas por RLS e acompanhadas por registros em `activities`. A camada visual não guardará uma segunda fonte de verdade: após cada sucesso, atualiza os dados remotos exibidos.

**Tecnologias:** Next.js App Router, TypeScript, Supabase Auth/Postgres/RLS/Edge Functions existentes, Tailwind/CSS do projeto e Vitest/checagens TypeScript já configuradas.

**Especificação:** `docs/superpowers/specs/2026-09-18-commercial-admin-operations.md`

---

## Entrega 1 — Comercial: rota, visita, follow-up e fechamento

### 1. Criar a migration operacional aditiva

**Arquivos:**
- Criar: `supabase/migrations/<timestamp>_commercial_operations.sql`
- Verificar: `supabase/migrations/20260918021449_diagnostic_journey_foundation.sql`
- Verificar: `src/app/components/commercial-workspace.tsx`

**Passos:**
1. Conferir o formato real de `activities`, `follow_ups`, `accounts` e as helpers de função/organização existentes.
2. Adicionar somente os índices, valores de status e campos que faltarem para rota/visita, sem quebrar dados atuais.
3. Criar políticas RLS aditivas para comercial atualizar leads de sua organização e registrar suas atividades; preservar controle administrativo já existente.
4. Adicionar consultas de verificação da migration para tabela, índices e políticas.

### 2. Implementar o repositório de ações comerciais

**Arquivos:**
- Criar: `src/lib/commercial-operations.ts`
- Modificar: `src/app/components/commercial-workspace.tsx`
- Criar ou modificar: `src/lib/types.ts` (apenas se o projeto concentrar tipos aqui)

**Passos:**
1. Criar funções de leitura e mutação para iniciar/finalizar rota, iniciar/concluir visita, criar/reagendar/concluir follow-up e registrar fechamento.
2. Toda mutação deve validar campos obrigatórios, usar o usuário e a organização autenticados, registrar atividade e devolver erro legível.
3. Ao fechar, atualizar estágio do lead, criar atividade de fechamento e follow-up de implantação; não criar cobrança ou assinatura.
4. Atualizar dados da tela pelo resultado remoto, sem simular uma alteração local em caso de erro.

### 3. Ligar os controles de `/app`

**Arquivos:**
- Modificar: `src/app/components/commercial-workspace.tsx`
- Modificar: estilos/componentes compartilhados estritamente necessários

**Passos:**
1. Trocar “Começar rota” pelo estado persistente com início/fim e resumo do dia.
2. Trocar “Iniciar visita” por iniciar/concluir visita com registro de horário e observação opcional.
3. Exibir follow-ups reais pendentes, com motivo, responsável, data, conclusão e reagendamento.
4. Fazer o fechamento chamar a ação remota e mostrar o checklist/onboarding criado.
5. Tratar carregamento, sucesso, falha e bloqueio por dados ausentes em todos os botões.

### 4. Verificar a entrega comercial

**Arquivos:**
- Criar/modificar testes próximos às helpers quando houver estrutura de testes apropriada

**Passos:**
1. Executar typecheck e lint.
2. Criar um lead de teste, criar/reagendar/concluir follow-up, iniciar/concluir visita e fechar o lead em ambiente autenticado depois da migration.
3. Confirmar no banco os registros correspondentes em `activities` e `follow_ups`.

## Entrega 2 — Administrativo: catálogo, assinaturas, cobrança interna e tags

### 5. Preparar operações administrativas e permissões

**Arquivos:**
- Criar: `src/lib/admin-operations.ts`
- Modificar: `src/app/components/management-live-workspace.tsx`
- Criar: `supabase/migrations/<timestamp>_admin_operations.sql` (somente se a inspeção detectar lacuna de coluna/política)

**Passos:**
1. Mapear as colunas reais de `products`, `subscriptions`, `invoices`, `tags` e `account_tags` antes de escrever mutações.
2. Implementar validação e ações de criar, editar, pausar/reativar e exclusão segura de produto; impedir exclusão com assinatura vinculada.
3. Implementar edição de assinatura, pausa, reativação e cancelamento somente na base interna.
4. Implementar abrir link, marcar paga, cancelar e reenviar cobrança por WhatsApp/e-mail; não chamar Asaas.
5. Implementar editar/excluir tag e remover/aplicar tag a clientes, impedindo exclusão com vínculo quando essa for a regra de dados.
6. Registrar atividades administrativas relevantes e respeitar `canAdmin`/`canFinance` na UI e nas consultas.

### 6. Ligar os controles de produtos, clientes e cobrança

**Arquivos:**
- Modificar: `src/app/components/management-live-workspace.tsx`
- Criar: componentes focados em `src/app/components/` se o arquivo ficar excessivamente grande

**Passos:**
1. Converter botões de produto, assinatura, invoice e tag em diálogos/formulários com validação, confirmação de ação crítica e retorno visível.
2. Exibir estados de vazio, carregamento e erro nas listagens.
3. Fazer links externos de cobrança abrirem somente com URL válida; gerar mensagens de WhatsApp/e-mail com dados reais disponíveis.
4. Recarregar apenas os conjuntos afetados após cada alteração bem-sucedida.

### 7. Verificar a entrega administrativa financeira interna

**Passos:**
1. Executar typecheck, lint e build.
2. Testar criação/edição/pausa de produto, ciclo de assinatura, marcação/cancelamento de cobrança e ciclo completo de tag.
3. Confirmar que nenhum fluxo exige token, URL ou chamada da API Asaas.

## Entrega 3 — Distribuição, placas e equipe

### 8. Implementar gestão de distribuição e placas

**Arquivos:**
- Modificar: `src/lib/admin-operations.ts`
- Modificar: `src/app/components/management-live-workspace.tsx`
- Modificar: `src/app/components/commercial-workspace.tsx`
- Criar migration aditiva somente se faltarem campos ou políticas

**Passos:**
1. Implementar editar, remover, ativar/pausar e reordenar regras de distribuição; manter os tipos desta fase como manual ou responsável fixo.
2. Preservar prioridade por uma transação ou atualização ordenada e validar que toda regra pertence à organização ativa.
3. Implementar vínculo de placa com cliente/local, ativação, bloqueio, desvínculo e abertura segura de URL/QR.
4. Trocar a tela comercial estática de placas por leitura real, ação de ativação e estado vazio explicativo.

### 9. Implementar gestão da equipe

**Arquivos:**
- Modificar: `src/lib/admin-operations.ts`
- Modificar: `src/app/components/management-live-workspace.tsx`
- Verificar: `supabase/functions/invite-member/index.ts`

**Passos:**
1. Implementar alteração de papel e capacidade, ativação/desativação e revogação de vínculo para membros permitidos.
2. Reenvio de convite reutiliza a função `invite-member`; não expor segredo no navegador.
3. Impedir a remoção do último administrador e impedir que um operador altere permissões acima das suas.
4. Registrar mudanças de equipe em `activities` e atualizar a lista remota.

### 10. Verificar distribuição, placas e equipe

**Passos:**
1. Executar typecheck e lint.
2. Testar reordenação, pausa e remoção de regra; ciclo de placa; atualização e revogação de membro.
3. Confirmar RLS com pelo menos um perfil sem permissão administrativa, quando os acessos de demonstração estiverem disponíveis.

## Entrega 4 — Apoio comercial, configurações, acesso e publicação

### 11. Concluir conteúdos e configurações de operação

**Arquivos:**
- Criar/modificar: `src/app/components/` para manual, objeções e checklist
- Modificar: `src/app/components/commercial-workspace.tsx`
- Modificar: `src/app/components/management-live-workspace.tsx`

**Passos:**
1. Trocar cartões vazios do comercial por conteúdo operacional navegável: manual, objeções e checklist de fechamento/implantação.
2. Conectar a configuração administrativa ao nome, fuso, moeda e parâmetros internos existentes, com validação e feedback.
3. Garantir que não seja possível configurar gateway, chave ou cobrança externa nesta entrega.

### 12. Implementar roteamento inicial por papel e estados de acesso

**Arquivos:**
- Localizar e modificar a ação/tela de login em `src/app/`
- Modificar guardas dos workspaces `/app`, `/adm` e `/cliente`

**Passos:**
1. Após login, buscar o papel ativo e redirecionar: administrador para `/adm`, comercial/parceiro para `/app`, cliente para `/cliente`.
2. Para rota sem permissão, mostrar tela de acesso negado com destino apropriado em vez de tela vazia.
3. Preservar login único e sessão atual; não criar credenciais paralelas.

### 13. Aplicar banco, publicar serviços e versão web

**Arquivos:**
- Aplicar migrations em `supabase/migrations/`
- Publicar funções necessárias em `supabase/functions/`
- Verificar: `.github/workflows/pages.yml`, `next.config.ts`, `README.md`

**Passos:**
1. Aplicar as migrations pendentes pelo Supabase, incluindo a jornada pública de diagnóstico e as migrations novas desta entrega.
2. Publicar/republicar as Edge Functions usadas pelo app, especialmente `public-diagnostic`, `public-page`, `invite-member` e as funções de placas existentes.
3. Executar typecheck, lint e build com `NEXT_PUBLIC_BASE_PATH=/octareview`.
4. Fazer commit somente dos arquivos do escopo, enviar para `main` e verificar o workflow Pages/URL de produção.
5. Testar rotas `/app`, `/adm`, `/cliente` e `/pagina` no endereço publicado.

## Checklist final

- [ ] Todos os botões anteriormente sem ação nos módulos comercial e administrativo passam a uma ação real, navegação útil ou estado explicitamente indisponível.
- [ ] Nenhuma integração Asaas é criada.
- [ ] Listagens de leads, follow-ups, produtos, assinaturas, cobranças, tags, regras, placas e equipe leem a fonte Supabase e refletem mudanças após mutação.
- [ ] Migrations e funções publicadas são verificadas remotamente.
- [ ] Typecheck, lint, build e teste manual das rotas principais concluídos.
