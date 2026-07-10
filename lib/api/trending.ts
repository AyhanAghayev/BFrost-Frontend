import { api } from "./client";
import type { TrendingTopic } from "../mock/trending";

export async function getTrending(): Promise<TrendingTopic[]> {
  return api.get<TrendingTopic[]>("/api/v1/trending");
}
