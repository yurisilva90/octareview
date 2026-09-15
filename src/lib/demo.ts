import type { DiagnosticInput, PlaceRecord } from "./types";

export const demoInput: DiagnosticInput = {
  businessName: "Studio Aurora",
  location: "Teresópolis, Brasil",
  category: "salão de beleza",
  maxCompetitors: 8,
  maxReviews: 40,
};

const reviews = [
  [5, "Atendimento excelente e ambiente muito agradável.", "Muito obrigado pela visita!"],
  [5, "Equipe atenciosa, serviço de qualidade e tudo muito limpo.", "Ficamos felizes com seu comentário!"],
  [4, "Gostei do resultado e do atendimento.", null],
  [2, "Esperei muito mesmo tendo feito agendamento.", null],
  [5, "Ótimo atendimento, profissionais excelentes.", "Obrigado por confiar em nossa equipe."],
  [3, "O corte ficou bom, mas o preço está um pouco alto.", null],
  [5, "Ambiente confortável, limpo e organizado.", null],
  [4, "Atendimento rápido e equipe simpática.", "Esperamos ver você novamente!"],
  [2, "Demora no atendimento e problema com o horário marcado.", "Sentimos muito. Vamos revisar o ocorrido."],
  [5, "Excelente qualidade e preço justo.", null],
  [5, "Agendamento fácil e atendimento pontual.", "Obrigado pelo carinho!"],
  [4, "Bom ambiente e serviço caprichado.", null],
] as const;

const target: PlaceRecord = {
  placeId: "demo-studio-aurora",
  title: "Studio Aurora",
  address: "Centro, Teresópolis - RJ",
  city: "Teresópolis",
  categoryName: "Salão de beleza",
  categories: ["Salão de beleza"],
  location: { lat: -22.411, lng: -42.966 },
  website: null,
  phone: "+55 21 99999-0000",
  totalScore: 4.6,
  reviewsCount: 128,
  rank: 5,
  openingHours: [{ day: "segunda-feira", hours: "09:00–18:00" }],
  reviewsDistribution: { oneStar: 2, twoStar: 3, threeStar: 8, fourStar: 22, fiveStar: 93 },
  reviews: reviews.map(([stars, text, response]) => ({
    stars,
    text,
    responseFromOwnerText: response,
    publishedAtDate: "2026-09-01T12:00:00.000Z",
  })),
  url: "https://www.google.com/maps",
};

function competitor(name: string, rating: number, count: number, rank: number): PlaceRecord {
  return {
    ...target,
    placeId: `demo-${rank}`,
    title: name,
    totalScore: rating,
    reviewsCount: count,
    rank,
    website: rank % 2 === 0 ? "https://example.com" : null,
    reviews: [],
  };
}

export const demoTargetRecords = [target];
export const demoMarketRecords = [
  competitor("Belle Maison", 4.8, 241, 1),
  competitor("Espaço Essenza", 4.7, 196, 2),
  competitor("Ateliê da Beleza", 4.6, 154, 3),
  competitor("Dona Flor Studio", 4.5, 93, 4),
  target,
  competitor("Casa Leve", 4.5, 82, 6),
  competitor("Studio Serena", 4.4, 74, 7),
  competitor("Espaço Bella", 4.3, 51, 8),
];

