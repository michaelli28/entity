import { z } from "zod";

export const categoryScoresSchema = z.object({
  founder: z.number().int().min(0).max(100),
  market: z.number().int().min(0).max(100),
  problem: z.number().int().min(0).max(100),
  competition: z.number().int().min(0).max(100),
  product: z.number().int().min(0).max(100),
  traction: z.number().int().min(0).max(100),
  pricing: z.number().int().min(0).max(100),
  team: z.number().int().min(0).max(100),
});
export type CategoryScores = z.infer<typeof categoryScoresSchema>;

export const latestScoresSchema = z.object({
  overall_score: z.number().int().min(0).max(100).nullable(),
  category_scores: categoryScoresSchema,
  computed_at: z.string().nullable(),
  present: z.boolean(),
});
export type LatestScores = z.infer<typeof latestScoresSchema>;
