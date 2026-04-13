import type { Citation } from "@/lib/schemas/citation";

export type CategoryKey =
  | "founder"
  | "market"
  | "problem"
  | "competition"
  | "product"
  | "traction"
  | "pricing"
  | "team";

export interface MentorSummaryData {
  headline: string;
  strengths: string[];
  weaknesses: string[];
  tips: string[];
  category_rationales?: Partial<Record<CategoryKey, string>>;
  citations?: Citation[];
}
