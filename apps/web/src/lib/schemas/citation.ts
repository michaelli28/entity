import { z } from "zod";

export const citationSchema = z.object({
  index: z.number().int().min(1),
  paper_id: z.string().uuid(),
  paper_title: z.string(),
  section: z.string().nullable().optional(),
  snippet: z.string(),
});
export type Citation = z.infer<typeof citationSchema>;

export const citationsSchema = z.array(citationSchema);
