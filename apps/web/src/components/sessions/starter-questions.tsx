"use client";

type Props = {
  questions: readonly string[];
  onSelect: (q: string) => void;
};

export function StarterQuestions({ questions, onSelect }: Props) {
  if (!questions.length) return null;
  return (
    <div className="zs-starters" role="list">
      <p className="zs-starters__heading">Mentor may open with</p>
      {questions.map((q, i) => (
        <button
          key={q}
          type="button"
          onClick={() => onSelect(q)}
          className="zs-starters__item"
          role="listitem"
        >
          <span className="zs-starters__num">
            {String(i + 1).padStart(2, "0")}
          </span>
          <span>{q}</span>
        </button>
      ))}
    </div>
  );
}
