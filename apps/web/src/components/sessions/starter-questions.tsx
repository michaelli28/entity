"use client";

type Props = {
  questions: readonly string[];
  onSelect: (q: string) => void;
};

export function StarterQuestions({ questions, onSelect }: Props) {
  if (!questions.length) return null;
  return (
    <div className="en-starters" role="list">
      <p className="en-starters__heading">Mentor may open with</p>
      {questions.map((q, i) => (
        <button
          key={q}
          type="button"
          onClick={() => onSelect(q)}
          className="en-starters__item"
          role="listitem"
        >
          <span className="en-starters__num">
            {String(i + 1).padStart(2, "0")}
          </span>
          <span>{q}</span>
        </button>
      ))}
    </div>
  );
}
