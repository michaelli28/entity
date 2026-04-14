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

const GRID_STROKE = "oklch(0.28 0.020 290)";
const AXIS_COLOR = "oklch(0.72 0.012 290)";
const TICK_COLOR = "oklch(0.52 0.018 290)";
const ACCENT = "oklch(0.68 0.220 295)";

export function ScoreRadar({ scores }: Props) {
  const data = (Object.keys(LABEL) as (keyof CategoryScores)[]).map((k) => ({
    category: LABEL[k],
    value: scores[k],
  }));
  return (
    <ResponsiveContainer width="100%" height={340}>
      <RadarChart data={data} outerRadius="72%">
        <PolarGrid stroke={GRID_STROKE} strokeDasharray="0" />
        <PolarAngleAxis
          dataKey="category"
          tick={{
            fill: AXIS_COLOR,
            fontSize: 11,
            fontFamily: "var(--font-mono)",
            letterSpacing: "0.08em",
          }}
          tickLine={false}
        />
        <PolarRadiusAxis
          angle={90}
          domain={[0, 100]}
          tick={{
            fill: TICK_COLOR,
            fontSize: 9,
            fontFamily: "var(--font-mono)",
          }}
          stroke={GRID_STROKE}
          tickCount={5}
          axisLine={false}
        />
        <Radar
          name="Score"
          dataKey="value"
          stroke={ACCENT}
          strokeWidth={1.5}
          fill={ACCENT}
          fillOpacity={0.18}
          dot={{ fill: ACCENT, r: 2.5, strokeWidth: 0 }}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
