# OctaReview — inteligência comercial e reputação

Plataforma da OctaReview: organiza leads do primeiro contato ao pós-venda, gera diagnósticos conectados à Apify e transforma cada diagnóstico em uma oportunidade comercial acompanhável. O frontend é publicado no GitHub Pages e o backend usa Supabase.

## O que está pronto

- área comercial mobile em `/comercial`, com visão do dia, leads, follow-ups, fechamento, clientes e modo de apresentação;
- painel interno desktop-first em `/gestao`, com visão executiva, distribuição de leads, carteira de clientes, tags, cobrança, catálogo de produtos, placas, equipe e configurações;
- todo diagnóstico iniciado pela área comercial cria ou atualiza um lead;
- filtros por potencial, situação de follow-up, etapa e busca;
- dados do lead salvos localmente no aparelho nesta fase;
- coleta detalhada do estabelecimento-alvo;
- identificação automática da categoria informada no perfil do Google;
- coleta leve de concorrentes da mesma categoria e região;
- cinco pilares: reputação, gestão, perfil, visibilidade e concorrência;
- temas objetivos na amostra de avaliações;
- três oportunidades priorizadas com evidência, impacto e solução;
- modo de demonstração sem consumo de créditos;
- proteção do token no servidor;
- testes do motor de diagnóstico.
- banco multiempresa Supabase com RLS para Administrador, Comercial/Parceiro, Financeiro, Sucesso do Cliente e Cliente;
- Edge Function `diagnostics`, responsável pela Apify e pela criação automática do lead;
- publicação estática automática no GitHub Pages.

## Arquitetura

- **GitHub Pages:** interface web estática em `/comercial`, `/gestao` e, futuramente, `/cliente`.
- **Supabase Auth:** login e sessões.
- **Supabase Postgres:** organizações, membros, empresas, leads, clientes, tags, follow-ups, diagnósticos, produtos, assinaturas, cobranças, pagamentos, placas e configurações.
- **Supabase Edge Functions:** integrações que precisam de segredo, começando pela Apify e depois pelo Asaas.

## Configuração do Supabase

1. Crie um projeto Supabase e copie a URL e a **publishable key** do painel Connect.
2. Copie `.env.example` para `.env.local` e preencha `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
3. Vincule a CLI: `pnpm supabase link --project-ref SEU_PROJECT_REF`.
4. Aplique o schema: `pnpm supabase db push`.
5. Cadastre o token apenas nos segredos da função: `pnpm supabase secrets set APIFY_API_TOKEN=...`.
6. Publique a função: `pnpm supabase functions deploy diagnostics`.

O token da Apify não vai para o GitHub, para o GitHub Pages nem para o navegador. O Actor padrão é `compass/crawler-google-places`; para alterá-lo, salve também `APIFY_GOOGLE_MAPS_ACTOR_ID` nos segredos da Edge Function.

Na interface de campo, os limites técnicos ficam ocultos: até 10 concorrentes e até 40 avaliações recentes. A categoria é opcional: vazia usa a principal do perfil; preenchida permite analisar o posicionamento em outro tipo de negócio. A localização continua sendo informada para diferenciar empresas com nomes iguais em cidades diferentes.

## Rodar e verificar

```bash
pnpm dev
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## GitHub Pages

O workflow `.github/workflows/ci.yml` valida lint, tipos, testes e build. O workflow `.github/workflows/pages.yml` gera o diretório `out` e publica automaticamente no GitHub Pages.

Configure no repositório, em **Settings → Secrets and variables → Actions → Variables**:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Depois, em **Settings → Pages**, selecione **GitHub Actions** como origem. A URL padrão será `https://yurisilva90.github.io/octareview/`.

## Limites conscientes desta versão

- os indicadores da tela comercial estão marcados como demonstração; somente o diagnóstico conectado à Apify usa dados ao vivo;
- as telas ainda exibem dados demonstrativos enquanto a ligação visual de todos os módulos ao banco é concluída;
- a integração Asaas ainda não está ativa; o schema já possui produtos, assinaturas, faturas, pagamentos e campos para os identificadores externos;
- a posição é uma fotografia de uma consulta e região, não uma grade geográfica;
- a análise de respostas e temas usa uma amostra recente;
- campos não detectados devem ser confirmados antes da apresentação;
- ainda não há persistência, autenticação ou geração de PDF;
- o uso da fonte deve ser revisado continuamente quanto a termos e privacidade.
