"use client";

type Props = {
  questions: readonly string[];
  onSelect: (q: string) => void;
};

export function StarterQuestions({ questions, onSelect }: Props) {
  if (!questions.length) return null;
  return (
    <div className="flex flex-wrap gap-2 py-4">
      {questions.map((q) => (
        <button
          key={q}
          onClick={() => onSelect(q)}
          className="text-sm px-3 py-2 rounded-full bg-neutral-900 border border-neutral-800 hover:bg-neutral-800"
        >
          {q}
        </button>
      ))}
    </div>
  );
}
