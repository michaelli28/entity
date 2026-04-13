"use client";
import { useState } from "react";

interface Commitment {
  id: string;
  description: string;
}

interface CommitmentCardProps {
  commitment: Commitment;
  onDone: (id: string) => Promise<void>;
}

export function CommitmentCard({ commitment, onDone }: CommitmentCardProps) {
  const [done, setDone] = useState(false);
  return (
    <div className="bg-black/60 mx-4 mt-2 flex items-center justify-between rounded-xl border border-white/10 p-4">
      <div>
        <p className="mb-1 text-xs uppercase text-white/50">Your commitment</p>
        <p className="text-sm">{commitment.description}</p>
      </div>
      <button
        type="button"
        disabled={done}
        onClick={() => {
          setDone(true);
          void onDone(commitment.id);
        }}
        className="rounded-lg border border-white/20 px-3 py-1.5 text-sm hover:bg-white/5 disabled:opacity-40"
      >
        {done ? "✓ Done" : "Mark done"}
      </button>
    </div>
  );
}
