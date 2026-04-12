"use client";
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts";

import type { CategoryScores } from "@/lib/schemas/score";

type Props = {
  scores: CategoryScores;
};

const LABEL: Record<keyof CategoryScores, string> = {
  founder: "Founder",
  market: "Market",
  problem: "Problem",
  competition: "Competition",
  product: "Product",
  traction: "Traction",
  pricing: "Pricing",
  team: "Team",
};

export function ScoreRadar({ scores }: Props) {
  const data = (Object.keys(LABEL) as (keyof CategoryScores)[]).map((k) => ({
    category: LABEL[k],
    value: scores[k],
  }));
  return (
    <ResponsiveContainer width="100%" height={360}>
      <RadarChart data={data} outerRadius="75%">
        <PolarGrid stroke="rgba(255,255,255,0.15)" />
        <PolarAngleAxis
          dataKey="category"
          tick={{ fill: "rgba(255,255,255,0.7)", fontSize: 12 }}
        />
        <PolarRadiusAxis
          angle={90}
          domain={[0, 100]}
          tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }}
        />
        <Radar
          name="Score"
          dataKey="value"
          stroke="rgb(16 185 129)"
          fill="rgb(16 185 129)"
          fillOpacity={0.3}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
