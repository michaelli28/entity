"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  type Blueprint,
  blueprintSchema,
  type DeepDiveRecommendation,
  deepDiveRecommendationSchema,
  type Session,
  type SessionType,
  sessionSchema,
} from "@/lib/schemas/session";

export function useBlueprints() {
  return useQuery<Blueprint[]>({
    queryKey: ["blueprints"],
    staleTime: 1000 * 60 * 60,
    queryFn: async () => {
      const r = await fetch("/api/sessions/blueprints");
      if (!r.ok) throw new Error(`blueprints ${r.status}`);
      return blueprintSchema.array().parse(await r.json());
    },
  });
}

export function useSessions() {
  return useQuery<Session[]>({
    queryKey: ["sessions"],
    staleTime: 30 * 1000,
    queryFn: async () => {
      const r = await fetch("/api/sessions");
      if (!r.ok) throw new Error(`sessions ${r.status}`);
      return sessionSchema.array().parse(await r.json());
    },
  });
}

export function useSession(id: string | null) {
  return useQuery<Session | null>({
    queryKey: ["session", id],
    enabled: !!id,
    queryFn: async () => {
      if (!id) return null;
      const r = await fetch(`/api/sessions/${id}`);
      if (r.status === 404) return null;
      if (!r.ok) throw new Error(`session ${r.status}`);
      return sessionSchema.parse(await r.json());
    },
  });
}

interface CreateSessionBody {
  session_type: SessionType;
  target_category?: string;
  target_signal?: string;
}

export function useCreateSession() {
  const qc = useQueryClient();
  return useMutation<Session, Error, CreateSessionBody>({
    mutationFn: async (body) => {
      const r = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!r.ok) throw new Error(`create session ${r.status}`);
      return sessionSchema.parse(await r.json());
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sessions"] }),
  });
}

export function useCompleteSession() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (sessionId) => {
      const r = await fetch(`/api/sessions/${sessionId}/complete`, {
        method: "POST",
      });
      if (!r.ok) throw new Error(`complete ${r.status}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sessions"] }),
  });
}

export function useDeepDiveRecommendation(enabled: boolean) {
  return useQuery<DeepDiveRecommendation>({
    queryKey: ["deep-dive-recommendation"],
    enabled,
    queryFn: async () => {
      const r = await fetch("/api/sessions/deep-dive/recommendation");
      if (!r.ok) throw new Error(`recommendation ${r.status}`);
      return deepDiveRecommendationSchema.parse(await r.json());
    },
  });
}
