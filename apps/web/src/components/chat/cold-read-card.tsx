"use client";
import Link from "next/link";

type ColdRead = {
  id: string;
  what_i_heard: string;
  investor_pushback: string[];
  three_unanswered_questions: string[];
};

type ColdReadCardProps = {
  coldRead: ColdRead;
};

export function ColdReadCard({ coldRead }: ColdReadCardProps) {
  return (
    <div className="border-primary/30 bg-primary/5 mx-4 mt-4 rounded-2xl border p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-primary font-semibold">Your Cold Read</h3>
        <Link
          href={`/dashboard/artifacts/${coldRead.id}`}
          className="text-primary/80 text-xs underline"
        >
          Full view
        </Link>
      </div>
      <p className="line-clamp-3 text-sm text-white/80">
        {coldRead.what_i_heard}
      </p>
    </div>
  );
}
