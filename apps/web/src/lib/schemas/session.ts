import { z } from "zod";

export const sessionTypeSchema = z.enum([
  "big_picture", "problem_market", "business", "ask", "deep_dive",
]);
export type SessionType = z.infer<typeof sessionTypeSchema>;

export const sessionSchema = z.object({
  id: z.string().uuid(),
  session_type: sessionTypeSchema,
  started_at: z.string(),
  completed_at: z.string().nullable(),
  coverage_score: z.number().int().min(0).max(100),
  suggest_complete: z.boolean(),
  target_category: z.string().nullable(),
  target_signal: z.string().nullable(),
});
export type Session = z.infer<typeof sessionSchema>;

export const blueprintSchema = z.object({
  key: sessionTypeSchema,
  title: z.string(),
  subtitle: z.string(),
  order: z.number().int(),
  starter_questions: z.array(z.string()),
});
export type Blueprint = z.infer<typeof blueprintSchema>;

export const deepDiveRecommendationSchema = z.object({
  target_category: z.string(),
  target_signal: z.string(),
  is_default: z.boolean(),
});
export type DeepDiveRecommendation = z.infer<typeof deepDiveRecommendationSchema>;
