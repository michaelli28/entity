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

export interface StoredMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export function useSessionMessages(sessionId: string | null) {
  return useQuery<StoredMessage[]>({
    queryKey: ["session-messages", sessionId],
    enabled: !!sessionId,
    staleTime: 10 * 1000,
    queryFn: async () => {
      if (!sessionId) return [];
      const r = await fetch(`/api/sessions/${sessionId}/messages`, {
        credentials: "include",
      });
      if (r.status === 404) return [];
      if (!r.ok) throw new Error(`messages ${r.status}`);
      const rows = (await r.json()) as StoredMessage[];
      return rows.filter(
        (m) => m.role === "user" || m.role === "assistant",
      );
    },
  });
}

export function useResetSessionMessages() {
  const qc = useQueryClient();
  return useMutation<{ deleted: number }, Error, string>({
    mutationFn: async (sessionId) => {
      const r = await fetch(`/api/sessions/${sessionId}/messages`, {
        method: "DELETE",
      });
      if (!r.ok) throw new Error(`reset ${r.status}`);
      return (await r.json()) as { deleted: number };
    },
    onSuccess: (_, sessionId) => {
      qc.invalidateQueries({ queryKey: ["session-messages", sessionId] });
      qc.invalidateQueries({ queryKey: ["session", sessionId] });
    },
  });
}

export function useDeleteAllSessions() {
  const qc = useQueryClient();
  return useMutation<{ deleted: number }, Error, void>({
    mutationFn: async () => {
      const r = await fetch(`/api/founders/me/sessions`, {
        method: "DELETE",
      });
      if (!r.ok) throw new Error(`delete-all ${r.status}`);
      return (await r.json()) as { deleted: number };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sessions"] });
      qc.invalidateQueries({ queryKey: ["session-messages"] });
      qc.invalidateQueries({ queryKey: ["session"] });
    },
  });
}

export interface SessionCoverage {
  coverage_score: number;
  suggest_complete: boolean;
  target_signals: { key: string; label: string; covered: boolean }[];
}

export function useSessionCoverage(sessionId: string | null) {
  return useQuery<SessionCoverage>({
    queryKey: ["session-coverage", sessionId],
    enabled: !!sessionId,
    staleTime: 5 * 1000,
    queryFn: async () => {
      if (!sessionId) throw new Error("no session id");
      const r = await fetch(`/api/sessions/${sessionId}/coverage`);
      if (!r.ok) throw new Error(`coverage ${r.status}`);
      return (await r.json()) as SessionCoverage;
    },
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
