import "server-only";

import { ApifyClient } from "apify-client";
import { findTargetPlace } from "./diagnostic";
import type { DiagnosticInput, PlaceRecord, ReviewRecord } from "./types";

const DEFAULT_ACTOR_ID = "compass/crawler-google-places";
type UnknownRecord = Record<string, unknown>;

function asString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function asNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function mapReview(value: unknown): ReviewRecord | null {
  if (!value || typeof value !== "object") return null;
  const review = value as UnknownRecord;
  return {
    text: asString(review.text) ?? asString(review.textTranslated) ?? "",
    stars: asNumber(review.stars) ?? asNumber(review.rating),
    publishedAtDate: asString(review.publishedAtDate) ?? asString(review.publishAt),
    responseFromOwnerText: asString(review.responseFromOwnerText),
  };
}

export function mapPlace(value: unknown): PlaceRecord | null {
  if (!value || typeof value !== "object") return null;
  const place = value as UnknownRecord;
  const title = asString(place.title);
  if (!title) return null;
  const rawLocation = place.location && typeof place.location === "object" ? place.location as UnknownRecord : null;
  const lat = rawLocation ? asNumber(rawLocation.lat) : null;
  const lng = rawLocation ? asNumber(rawLocation.lng) : null;
  const rawHours = Array.isArray(place.openingHours) ? place.openingHours : [];
  const rawReviews = Array.isArray(place.reviews) ? place.reviews : [];
  const distribution = place.reviewsDistribution && typeof place.reviewsDistribution === "object"
    ? Object.fromEntries(
        Object.entries(place.reviewsDistribution as UnknownRecord)
          .filter((entry): entry is [string, number] => typeof entry[1] === "number"),
      )
    : null;

  return {
    placeId: asString(place.placeId),
    title,
    address: asString(place.address),
    city: asString(place.city),
    categoryName: asString(place.categoryName),
    categories: Array.isArray(place.categories) ? place.categories.filter((item): item is string => typeof item === "string") : [],
    location: lat !== null && lng !== null ? { lat, lng } : null,
    website: asString(place.website),
    phone: asString(place.phone) ?? asString(place.phoneUnformatted),
    totalScore: asNumber(place.totalScore),
    reviewsCount: asNumber(place.reviewsCount),
    rank: asNumber(place.rank),
    openingHours: rawHours.flatMap((item) => {
      if (!item || typeof item !== "object") return [];
      const record = item as UnknownRecord;
      const day = asString(record.day);
      const hours = asString(record.hours);
      return day && hours ? [{ day, hours }] : [];
    }),
    reviewsDistribution: distribution,
    reviews: rawReviews.map(mapReview).filter((review): review is ReviewRecord => review !== null),
    url: asString(place.url),
  };
}

async function getRunItems(client: ApifyClient, runId: string, datasetId: string | undefined) {
  if (!datasetId) throw new Error(`A execução ${runId} não retornou um dataset.`);
  const { items } = await client.dataset(datasetId).listItems({ clean: true });
  return items.map(mapPlace).filter((place): place is PlaceRecord => place !== null);
}

export async function collectDiagnosticData(input: DiagnosticInput) {
  const token = process.env.APIFY_API_TOKEN;
  if (!token) {
    throw new Error("A integração Apify ainda não foi configurada. Adicione APIFY_API_TOKEN ao arquivo .env.local.");
  }
  const actorId = process.env.APIFY_GOOGLE_MAPS_ACTOR_ID || DEFAULT_ACTOR_ID;
  const client = new ApifyClient({ token });
  const targetInput = {
    searchStringsArray: [input.businessName],
    locationQuery: input.location,
    maxCrawledPlacesPerSearch: 3,
    language: "pt-BR",
    skipClosedPlaces: true,
    scrapePlaceDetailPage: true,
    maxReviews: input.maxReviews,
    reviewsSort: "newest",
    reviewsOrigin: "google",
    scrapeReviewsPersonalData: false,
  };
  const targetRun = await client.actor(actorId).call(targetInput);
  const targetRecords = await getRunItems(client, targetRun.id, targetRun.defaultDatasetId);
  const targetMatch = findTargetPlace(input.businessName, targetRecords, []);
  if (!targetMatch || targetMatch.similarity < 0.35) {
    throw new Error(`Não foi possível identificar “${input.businessName}” em ${input.location}. Confira o nome e a cidade.`);
  }

  const detectedCategory = input.category.trim()
    || targetMatch.place.categoryName
    || targetMatch.place.categories[0];
  if (!detectedCategory) {
    throw new Error("A empresa foi localizada, mas o Google não informou uma categoria para comparar o mercado.");
  }

  const marketInput = {
    searchStringsArray: [detectedCategory],
    locationQuery: input.location,
    maxCrawledPlacesPerSearch: input.maxCompetitors,
    language: "pt-BR",
    skipClosedPlaces: true,
    scrapePlaceDetailPage: true,
    maxReviews: 0,
    scrapeReviewsPersonalData: false,
  };
  const marketRun = await client.actor(actorId).call(marketInput);
  const marketRecords = await getRunItems(client, marketRun.id, marketRun.defaultDatasetId);
  return { actorId, targetRecords, marketRecords, detectedCategory };
}
