import type {
  CompetitorRow,
  DiagnosticInput,
  DiagnosticPillar,
  DiagnosticReport,
  Opportunity,
  PlaceRecord,
  ReviewRecord,
  ReviewTheme,
} from "./types";

const THEME_RULES = [
  { id: "service", label: "Atendimento", terms: ["atendimento", "atencioso", "atenciosa", "equipe", "profissional", "recepção"] },
  { id: "quality", label: "Qualidade", terms: ["qualidade", "excelente", "serviço", "corte", "resultado", "capricho"] },
  { id: "environment", label: "Ambiente", terms: ["ambiente", "espaço", "confortável", "aconchegante", "estrutura"] },
  { id: "waiting", label: "Espera e pontualidade", terms: ["espera", "demora", "atraso", "pontual", "horário", "rápido", "rapidez"] },
  { id: "booking", label: "Agendamento", terms: ["agenda", "agendamento", "marcar", "horário", "aplicativo"] },
  { id: "price", label: "Preço e valor", terms: ["preço", "caro", "barato", "valor", "custo", "dinheiro"] },
  { id: "cleanliness", label: "Limpeza", terms: ["limpo", "limpeza", "higiene", "organizado", "organização"] },
] as const;

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function nameSimilarity(left: string, right: string) {
  const a = normalize(left);
  const b = normalize(right);
  if (a === b) return 1;
  if (a.includes(b) || b.includes(a)) return 0.92;
  const aTokens = new Set(a.split(" ").filter((token) => token.length > 2));
  const bTokens = new Set(b.split(" ").filter((token) => token.length > 2));
  if (!aTokens.size || !bTokens.size) return 0;
  const overlap = [...aTokens].filter((token) => bTokens.has(token)).length;
  return overlap / Math.max(aTokens.size, bTokens.size);
}

export function findTargetPlace(businessName: string, targetRecords: PlaceRecord[], marketRecords: PlaceRecord[]) {
  const candidates = [...targetRecords, ...marketRecords];
  return candidates
    .map((place) => ({ place, similarity: nameSimilarity(businessName, place.title) }))
    .sort((a, b) => b.similarity - a.similarity)[0];
}

function median(values: number[]) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : Math.round((sorted[middle - 1] + sorted[middle]) / 2);
}

function percent(value: number, total: number) {
  return total ? Math.round((value / total) * 100) : null;
}

function analyzeThemes(reviews: ReviewRecord[]): ReviewTheme[] {
  return THEME_RULES.map((theme) => {
    const mentions = reviews.filter((review) => {
      const text = normalize(review.text);
      return theme.terms.some((term) => text.includes(normalize(term)));
    });
    return {
      id: theme.id,
      label: theme.label,
      mentions: mentions.length,
      positive: mentions.filter((review) => (review.stars ?? 0) >= 4).length,
      neutral: mentions.filter((review) => review.stars === 3 || review.stars === null).length,
      negative: mentions.filter((review) => (review.stars ?? 5) <= 2).length,
    };
  }).filter((theme) => theme.mentions > 0).sort((a, b) => b.mentions - a.mentions);
}

function dedupePlaces(records: PlaceRecord[]) {
  const seen = new Set<string>();
  return records.filter((place) => {
    const key = place.placeId ?? `${normalize(place.title)}|${normalize(place.address ?? "")}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function calculateCompleteness(place: PlaceRecord) {
  const checks = [Boolean(place.address), Boolean(place.phone), Boolean(place.website), Boolean(place.categoryName || place.categories.length), place.openingHours.length > 0];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

function identifyProfile(rating: number | null, reviews: number | null, competitorMedian: number | null, searchRank: number | null) {
  if (rating !== null && rating < 4.2 && (reviews ?? 0) >= 30) return "Reputação em atenção";
  if (rating !== null && rating >= 4.7 && reviews !== null && competitorMedian !== null && reviews >= competitorMedian) {
    return searchRank !== null && searchRank > 3 ? "Líder com visibilidade a ampliar" : "Líder de reputação";
  }
  if (rating !== null && rating >= 4.5 && reviews !== null && competitorMedian !== null && reviews < competitorMedian) return "Boa reputação, baixo volume";
  if (searchRank !== null && searchRank > 10) return "Baixa visibilidade local";
  return "Presença local em desenvolvimento";
}

function buildPillars(args: {
  target: PlaceRecord;
  rating: number | null;
  reviewsCount: number | null;
  competitorMedian: number | null;
  responseRate: number | null;
  responseSampleSize: number;
  negativeUnanswered: number;
  completeness: number;
  searchRank: number | null;
  reputationRank: number | null;
  competitorCount: number;
  category: string;
}): DiagnosticPillar[] {
  const { target, rating, reviewsCount, competitorMedian, responseRate, responseSampleSize, negativeUnanswered, completeness, searchRank, reputationRank, competitorCount, category } = args;
  const reputationStatus = rating === null ? "unknown" : rating >= 4.7 && (competitorMedian === null || (reviewsCount ?? 0) >= competitorMedian) ? "strong" : rating < 4.2 ? "opportunity" : "attention";
  const managementStatus = responseRate === null ? "unknown" : responseRate >= 80 ? "strong" : responseRate >= 50 ? "attention" : "opportunity";
  const profileStatus = completeness >= 80 ? "strong" : completeness >= 60 ? "attention" : "opportunity";
  const visibilityStatus = searchRank === null ? "unknown" : searchRank <= 3 ? "strong" : searchRank <= 10 ? "attention" : "opportunity";
  const competitionStatus = reputationRank === null ? "unknown" : reputationRank <= 2 ? "strong" : reputationRank <= Math.max(3, Math.ceil(competitorCount / 2)) ? "attention" : "opportunity";

  return [
    {
      id: "reputation",
      label: "Reputação",
      status: reputationStatus,
      headline: rating === null ? "Sem nota confirmada" : `${rating.toFixed(1)} estrelas`,
      summary: reputationStatus === "strong" ? "A empresa demonstra uma base de reputação forte para o mercado analisado." : "Há espaço para fortalecer a percepção pública e a prova social.",
      evidence: [`${reviewsCount ?? 0} avaliações encontradas`, competitorMedian === null ? "Sem mediana competitiva" : `Mediana dos concorrentes: ${competitorMedian} avaliações`],
      confidence: rating === null ? "baixa" : "alta",
    },
    {
      id: "management",
      label: "Gestão das avaliações",
      status: managementStatus,
      headline: responseRate === null ? "Amostra indisponível" : `${responseRate}% respondidas`,
      summary: responseRate === null ? "Ainda não há avaliações suficientes para medir a gestão de respostas." : responseRate >= 80 ? "A amostra indica uma rotina consistente de resposta aos clientes." : "A amostra revela avaliações que poderiam receber posicionamento da empresa.",
      evidence: [`${responseSampleSize} avaliações na amostra`, `${negativeUnanswered} críticas sem resposta na amostra`],
      confidence: responseSampleSize >= 30 ? "alta" : responseSampleSize >= 10 ? "media" : "baixa",
    },
    {
      id: "profile",
      label: "Presença no perfil",
      status: profileStatus,
      headline: `${completeness}% dos campos essenciais`,
      summary: profileStatus === "strong" ? "As informações essenciais do perfil aparecem bem preenchidas." : "Existem campos essenciais ausentes ou não detectados na coleta.",
      evidence: [`Site ${target.website ? "encontrado" : "não encontrado"}`, `Telefone ${target.phone ? "encontrado" : "não encontrado"}`, `Horários ${target.openingHours.length ? "encontrados" : "não encontrados"}`],
      confidence: "media",
    },
    {
      id: "visibility",
      label: "Visibilidade local",
      status: visibilityStatus,
      headline: searchRank === null ? "Não encontrada na amostra" : `${searchRank}ª posição na busca`,
      summary: searchRank === null ? "A empresa não foi identificada na busca competitiva desta coleta." : searchRank <= 3 ? "A empresa aparece no grupo de maior destaque desta consulta." : "A posição observada indica oportunidade para acompanhar e ampliar presença.",
      evidence: [`Termo analisado: ${category}`, "Uma consulta e uma área nesta versão inicial"],
      confidence: searchRank === null ? "baixa" : "media",
    },
    {
      id: "competition",
      label: "Competitividade",
      status: competitionStatus,
      headline: reputationRank === null ? "Comparação insuficiente" : `${reputationRank}ª entre ${competitorCount}`,
      summary: competitionStatus === "strong" ? "A empresa está entre as referências de reputação do conjunto analisado." : "Concorrentes apresentam sinais de reputação ou volume mais fortes.",
      evidence: [`${competitorCount} empresas comparadas`, "Ordenação por nota e, em caso de empate, volume de avaliações"],
      confidence: competitorCount >= 5 ? "media" : "baixa",
    },
  ];
}

function buildOpportunities(args: {
  target: PlaceRecord;
  reviewsCount: number | null;
  competitorMedian: number | null;
  responseRate: number | null;
  responseSampleSize: number;
  searchRank: number | null;
  completeness: number;
  themes: ReviewTheme[];
}): Opportunity[] {
  const opportunities: Array<Opportunity & { weight: number }> = [];
  const { target, reviewsCount, competitorMedian, responseRate, responseSampleSize, searchRank, completeness, themes } = args;
  if (searchRank === null || searchRank > 3) opportunities.push({ id: "visibility", title: "Ampliar a presença nas buscas locais", evidence: searchRank === null ? "A empresa não foi identificada entre os resultados coletados para a categoria." : `A empresa apareceu na ${searchRank}ª posição da consulta analisada.`, impact: "Mais presença no grupo inicial pode aumentar descoberta, ligações e visitas.", solution: "Monitoramento recorrente por termo e região, acompanhado de melhorias no perfil e presença digital.", priority: "alta", weight: searchRank === null || searchRank > 10 ? 100 : 82 });
  if (responseRate !== null && responseRate < 75) opportunities.push({ id: "responses", title: "Fortalecer a rotina de respostas", evidence: `${responseRate}% das ${responseSampleSize} avaliações coletadas possuem resposta do estabelecimento.`, impact: "Respostas consistentes demonstram atenção e ajudam a transformar feedback em relacionamento.", solution: "Alertas, fila de avaliações e sugestões de resposta revisadas pelo responsável.", priority: responseRate < 50 ? "alta" : "media", weight: responseRate < 50 ? 94 : 72 });
  if (competitorMedian !== null && reviewsCount !== null && reviewsCount < competitorMedian) opportunities.push({ id: "review-volume", title: "Aumentar o volume de prova social", evidence: `${reviewsCount} avaliações contra uma mediana competitiva de ${competitorMedian}.`, impact: "Um volume menor pode reduzir confiança e força competitiva na escolha do cliente.", solution: "Ativação ética de avaliações com placas NFC/QR e acompanhamento da evolução.", priority: reviewsCount < competitorMedian * 0.5 ? "alta" : "media", weight: 84 });
  if (completeness < 100) {
    const missing = [!target.website && "site", !target.phone && "telefone", !target.openingHours.length && "horários", !target.categoryName && !target.categories.length && "categoria"].filter(Boolean).join(", ");
    opportunities.push({ id: "profile", title: "Completar os pontos essenciais do perfil", evidence: missing ? `Não detectados: ${missing}.` : `Completude observada de ${completeness}%.`, impact: "Informações completas ajudam o cliente a entender e escolher o estabelecimento.", solution: "Auditoria e atualização assistida do Perfil da Empresa com autorização do proprietário.", priority: completeness < 60 ? "alta" : "media", weight: completeness < 60 ? 88 : 62 });
  }
  const negativeTheme = themes.filter((theme) => theme.negative > 0).sort((a, b) => b.negative - a.negative)[0];
  if (negativeTheme) opportunities.push({ id: "customer-voice", title: `Investigar sinais sobre ${negativeTheme.label.toLowerCase()}`, evidence: `${negativeTheme.negative} menções negativas em ${negativeTheme.mentions} avaliações da amostra.`, impact: "Um tema recorrente pode afetar experiência, indicação e reputação futura.", solution: "Monitorar o tema ao longo do tempo e conectar o feedback a uma ação operacional.", priority: "media", weight: 68 + negativeTheme.negative });

  if ((target.totalScore ?? 0) >= 4.7 && (reviewsCount ?? 0) >= 50) {
    opportunities.push({
      id: "reputation-intelligence",
      title: "Transformar reputação em inteligência",
      evidence: `${target.totalScore?.toFixed(1)} estrelas e ${reviewsCount} avaliações formam uma base relevante de voz do cliente.`,
      impact: "O histórico pode revelar diferenciais, mudanças de percepção e sinais operacionais que a nota média não mostra.",
      solution: "Análise recorrente de temas, tendências e alertas sobre a experiência percebida.",
      priority: "media",
      weight: 67,
    });
  }

  if (competitorMedian !== null && reviewsCount !== null && reviewsCount >= competitorMedian) {
    opportunities.push({
      id: "protect",
      title: "Proteger a liderança competitiva",
      evidence: `${reviewsCount} avaliações contra uma mediana de ${competitorMedian} entre os concorrentes analisados.`,
      impact: "Uma posição forte pode perder vantagem sem acompanhamento do ritmo dos concorrentes.",
      solution: "Monitoramento mensal de nota, volume, respostas e avanço competitivo.",
      priority: "media",
      weight: 58,
    });
  }

  if (!opportunities.length) opportunities.push({ id: "protect", title: "Proteger a presença construída", evidence: "Os principais indicadores observados estão em nível forte.", impact: "Sem acompanhamento, mudanças de percepção ou avanço dos concorrentes podem passar despercebidos.", solution: "Monitoramento mensal de reputação, concorrência e visibilidade local.", priority: "media", weight: 50 });
  return opportunities.sort((a, b) => b.weight - a.weight).slice(0, 3).map((item) => ({
    id: item.id,
    title: item.title,
    evidence: item.evidence,
    impact: item.impact,
    solution: item.solution,
    priority: item.priority,
  }));
}

export function buildDiagnostic(args: { input: DiagnosticInput; targetRecords: PlaceRecord[]; marketRecords: PlaceRecord[]; mode: "live" | "demo"; actorId?: string; generatedAt?: string }): DiagnosticReport {
  const { input, targetRecords, marketRecords, mode } = args;
  const targetMatch = findTargetPlace(input.businessName, targetRecords, marketRecords);
  if (!targetMatch || targetMatch.similarity < 0.35) throw new Error(`Não foi possível identificar “${input.businessName}” nos resultados coletados.`);
  const detailedTarget = targetRecords.find((place) => place.placeId && place.placeId === targetMatch.place.placeId) ?? targetMatch.place;
  const market = dedupePlaces([...marketRecords, detailedTarget]);
  const targetKey = detailedTarget.placeId ?? normalize(detailedTarget.title);
  const competitorsOnly = market.filter((place) => (place.placeId ?? normalize(place.title)) !== targetKey);
  const competitorMedian = median(competitorsOnly.map((place) => place.reviewsCount).filter((value): value is number => value !== null));
  const ranked = [...market].filter((place) => place.totalScore !== null).sort((a, b) => (b.totalScore ?? 0) - (a.totalScore ?? 0) || (b.reviewsCount ?? 0) - (a.reviewsCount ?? 0));
  const reputationRankIndex = ranked.findIndex((place) => (place.placeId ?? normalize(place.title)) === targetKey);
  const reputationRank = reputationRankIndex >= 0 ? reputationRankIndex + 1 : null;
  const marketTarget = marketRecords.find((place) => place.placeId && place.placeId === detailedTarget.placeId) ?? marketRecords.find((place) => nameSimilarity(place.title, detailedTarget.title) > 0.8);
  const searchRank = marketTarget?.rank ?? null;
  const reviews = detailedTarget.reviews;
  const responded = reviews.filter((review) => Boolean(review.responseFromOwnerText)).length;
  const responseRate = percent(responded, reviews.length);
  const negativeUnanswered = reviews.filter((review) => (review.stars ?? 5) <= 3 && !review.responseFromOwnerText).length;
  const completeness = calculateCompleteness(detailedTarget);
  const themes = analyzeThemes(reviews);
  const profile = identifyProfile(detailedTarget.totalScore, detailedTarget.reviewsCount, competitorMedian, searchRank);
  const pillars = buildPillars({ target: detailedTarget, rating: detailedTarget.totalScore, reviewsCount: detailedTarget.reviewsCount, competitorMedian, responseRate, responseSampleSize: reviews.length, negativeUnanswered, completeness, searchRank, reputationRank, competitorCount: market.length, category: input.category });
  const opportunities = buildOpportunities({ target: detailedTarget, reviewsCount: detailedTarget.reviewsCount, competitorMedian, responseRate, responseSampleSize: reviews.length, searchRank, completeness, themes });
  const competitors: CompetitorRow[] = [...market].sort((a, b) => (a.rank ?? 999) - (b.rank ?? 999)).slice(0, input.maxCompetitors + 1).map((place) => ({ placeId: place.placeId, name: place.title, rating: place.totalScore, reviews: place.reviewsCount, searchRank: place.rank, website: Boolean(place.website), isTarget: (place.placeId ?? normalize(place.title)) === targetKey }));

  return {
    id: crypto.randomUUID(), mode, generatedAt: args.generatedAt ?? new Date().toISOString(), input, business: detailedTarget,
    summary: { profile, narrative: `${detailedTarget.title} foi classificada como “${profile}”. O diagnóstico identificou ${opportunities.length} prioridades com base em reputação, gestão, perfil, visibilidade e concorrência.`, rating: detailedTarget.totalScore, reviewsCount: detailedTarget.reviewsCount, searchRank, responseRate, responseSampleSize: reviews.length, profileCompleteness: completeness, competitorMedianReviews: competitorMedian },
    pillars, competitors, themes, opportunities,
    methodology: ["A empresa-alvo é localizada pelo nome e pela região informada.", "A coleta detalhada busca o perfil e uma amostra das avaliações mais recentes.", "A coleta de mercado pesquisa a categoria na mesma região e preserva a ordem observada.", "As conclusões são geradas por regras determinísticas e mantêm a evidência associada."],
    limitations: ["A posição representa uma fotografia da consulta, não um ranking absoluto ou garantia de resultado.", `A gestão e os temas são calculados sobre uma amostra de ${reviews.length} avaliações, não necessariamente sobre todo o histórico.`, "Campos não detectados podem existir no perfil; devem ser confirmados antes da apresentação comercial.", "Dados coletados por terceiros precisam de revisão periódica de termos, privacidade e continuidade da fonte."],
    source: { provider: mode === "live" ? "Apify" : "Demonstração", actorId: mode === "live" ? (args.actorId ?? null) : null, targetRecords: targetRecords.length, marketRecords: marketRecords.length },
  };
}
