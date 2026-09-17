export type ReviewRecord = {
  text: string;
  stars: number | null;
  publishedAtDate: string | null;
  responseFromOwnerText: string | null;
};

export type PlaceRecord = {
  placeId: string | null;
  title: string;
  address: string | null;
  city: string | null;
  categoryName: string | null;
  categories: string[];
  location: { lat: number; lng: number } | null;
  website: string | null;
  phone: string | null;
  totalScore: number | null;
  reviewsCount: number | null;
  rank: number | null;
  openingHours: Array<{ day: string; hours: string }>;
  reviewsDistribution: Record<string, number> | null;
  reviews: ReviewRecord[];
  url: string | null;
};

export type DiagnosticInput = {
  businessName: string;
  location: string;
  category: string;
  maxCompetitors: number;
  maxReviews: number;
};

export type PillarStatus = "strong" | "attention" | "opportunity" | "unknown";

export type DiagnosticPillar = {
  id: "reputation" | "management" | "profile" | "visibility" | "competition";
  label: string;
  status: PillarStatus;
  headline: string;
  summary: string;
  evidence: string[];
  confidence: "alta" | "media" | "baixa";
};

export type ReviewTheme = {
  id: string;
  label: string;
  mentions: number;
  positive: number;
  neutral: number;
  negative: number;
};

export type Opportunity = {
  id: string;
  title: string;
  evidence: string;
  impact: string;
  solution: string;
  priority: "alta" | "media";
};

export type CompetitorRow = {
  placeId: string | null;
  name: string;
  rating: number | null;
  reviews: number | null;
  searchRank: number | null;
  website: boolean;
  isTarget: boolean;
};

export type DiagnosticReport = {
  id: string;
  accountId?: number;
  mode: "live" | "demo";
  generatedAt: string;
  input: DiagnosticInput;
  business: PlaceRecord;
  summary: {
    profile: string;
    narrative: string;
    rating: number | null;
    reviewsCount: number | null;
    searchRank: number | null;
    responseRate: number | null;
    responseSampleSize: number;
    profileCompleteness: number;
    competitorMedianReviews: number | null;
  };
  pillars: DiagnosticPillar[];
  competitors: CompetitorRow[];
  themes: ReviewTheme[];
  opportunities: Opportunity[];
  methodology: string[];
  limitations: string[];
  source: {
    provider: "Apify" | "Demonstração";
    actorId: string | null;
    targetRecords: number;
    marketRecords: number;
  };
};
