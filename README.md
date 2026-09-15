# Reputta — diagnóstico comercial v1

Primeiro fluxo funcional da Reputta: recebe empresa e localização, com uma categoria de comparação opcional; identifica a categoria automaticamente quando ela fica vazia; executa duas coletas na Apify; normaliza os dados; e produz um diagnóstico comercial explicável.

## O que está pronto

- área comercial mobile em `/comercial`, com visão do dia, prospects, ficha de abordagem, diagnóstico e modo de apresentação;
- coleta detalhada do estabelecimento-alvo;
- identificação automática da categoria informada no perfil do Google;
- coleta leve de concorrentes da mesma categoria e região;
- cinco pilares: reputação, gestão, perfil, visibilidade e concorrência;
- temas objetivos na amostra de avaliações;
- três oportunidades priorizadas com evidência, impacto e solução;
- modo de demonstração sem consumo de créditos;
- proteção do token no servidor;
- testes do motor de diagnóstico.

## Configuração

1. Copie `.env.example` para `.env.local`.
2. Coloque seu token da Apify em `APIFY_API_TOKEN`.
3. Mantenha o Actor padrão ou substitua `APIFY_GOOGLE_MAPS_ACTOR_ID` por outro compatível.

O Actor padrão é `compass/crawler-google-places`. A coleta detalhada de avaliações é executada apenas para o alvo; os concorrentes são coletados sem textos de reviews para limitar custo e latência.

Na interface de campo, os limites técnicos ficam ocultos: até 10 concorrentes e até 40 avaliações recentes. A categoria é opcional: vazia usa a principal do perfil; preenchida permite analisar o posicionamento em outro tipo de negócio. A localização continua sendo informada para diferenciar empresas com nomes iguais em cidades diferentes.

## Rodar e verificar

```bash
pnpm dev
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## GitHub e publicação

O código pode ser versionado normalmente no GitHub. A automação em `.github/workflows/ci.yml` valida lint, tipos, testes e build a cada envio para a branch `main`.

O GitHub Pages, isoladamente, não executa a rota dinâmica `/api/diagnostics`. Para preservar o token da Apify no servidor, a publicação completa precisa combinar o repositório GitHub com um ambiente que execute Next.js ou separar a API em um serviço de backend. O token nunca deve ser colocado em variáveis públicas ou no código do navegador.

## Limites conscientes desta versão

- os indicadores da tela comercial estão marcados como demonstração; somente o diagnóstico conectado à Apify usa dados ao vivo;
- a posição é uma fotografia de uma consulta e região, não uma grade geográfica;
- a análise de respostas e temas usa uma amostra recente;
- campos não detectados devem ser confirmados antes da apresentação;
- ainda não há persistência, autenticação ou geração de PDF;
- o uso da fonte deve ser revisado continuamente quanto a termos e privacidade.
