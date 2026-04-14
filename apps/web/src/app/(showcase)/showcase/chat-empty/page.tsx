import "../../../(dashboard)/chat.css";

const STARTERS = [
  "Who is this most painful for right now?",
  "What specific moment in the last week proved it?",
  "How are they solving this today without you?",
  "What makes this the right thing to build this quarter?",
];

export default function ChatEmptyPreviewPage() {
  return (
    <div className="zs-chat">
      <div className="zs-chat__inner">
        <header className="zs-chat__head">
          <div className="zs-chat__title-group">
            <span className="zs-chat__eyebrow">Mentor session</span>
            <h1 className="zs-chat__title">Big Picture</h1>
            <p className="zs-chat__subtitle">
              The highest-leverage framing of what you&rsquo;re building.
            </p>
          </div>
          <button type="button" className="zs-chat-menu__toggle" aria-label="Chat options">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
              <circle cx="3.5" cy="8" r="1.25" fill="currentColor" />
              <circle cx="8" cy="8" r="1.25" fill="currentColor" />
              <circle cx="12.5" cy="8" r="1.25" fill="currentColor" />
            </svg>
          </button>
        </header>

        <div className="zs-chat-progress">
          <div className="zs-chat-progress__row">
            <span className="zs-chat-progress__label">Coverage</span>
            <span className="zs-chat-progress__count">
              00 / 06
              <span className="zs-chat-progress__count-pct">0%</span>
            </span>
          </div>
          <div className="zs-chat-progress__track" role="progressbar" aria-valuenow={0}>
            <div
              className="zs-chat-progress__fill"
              style={{ "--zs-progress": 0 } as React.CSSProperties}
            />
          </div>
          <ul className="zs-chat-progress__signals">
            {["Thesis", "Wedge", "Insight", "Bet", "Differentiator", "Proof"].map((label) => (
              <li key={label} className="zs-chat-progress__signal">
                <span className="zs-chat-progress__signal-dot" aria-hidden />
                <span>{label}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="zs-chat-list" />

        <div className="zs-starters" role="list">
          <p className="zs-starters__heading">Mentor may open with</p>
          {STARTERS.map((q, i) => (
            <button key={q} type="button" className="zs-starters__item" role="listitem">
              <span className="zs-starters__num">{String(i + 1).padStart(2, "0")}</span>
              <span>{q}</span>
            </button>
          ))}
        </div>

        <div className="zs-chat-input">
          <div className="zs-chat-input__row">
            <textarea
              className="zs-chat-input__textarea"
              rows={1}
              placeholder="Share what you&rsquo;re working on…"
              defaultValue=""
            />
            <button type="button" className="zs-chat-input__send" aria-label="Send" disabled>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
                <path d="M1.5 7.5l13-5.5-5.5 13-2-5-5.5-2.5z" />
              </svg>
            </button>
          </div>
          <p className="zs-chat-input__hint">
            <kbd>↵</kbd> to send · <kbd>⇧ ↵</kbd> for new line
          </p>
        </div>
      </div>
    </div>
  );
}
