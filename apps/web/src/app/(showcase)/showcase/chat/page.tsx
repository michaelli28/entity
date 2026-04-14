import "../../../(dashboard)/chat.css";

export default function ChatPreviewPage() {
  return (
    <div className="zs-chat">
      <div className="zs-chat__inner">
        <header className="zs-chat__head">
          <div className="zs-chat__title-group">
            <span className="zs-chat__eyebrow">Mentor session</span>
            <h1 className="zs-chat__title">Problem &amp; Market</h1>
            <p className="zs-chat__subtitle">
              What you&rsquo;re solving, who it hurts, and why now.
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

        <div className="zs-chat-progress" role="group" aria-label="Coverage 4 of 8">
          <div className="zs-chat-progress__row">
            <span className="zs-chat-progress__label">Coverage</span>
            <span className="zs-chat-progress__count">
              04 / 08
              <span className="zs-chat-progress__count-pct">50%</span>
            </span>
          </div>
          <div
            className="zs-chat-progress__track"
            role="progressbar"
            aria-valuenow={50}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="zs-chat-progress__fill"
              style={{ "--zs-progress": 0.5 } as React.CSSProperties}
            />
          </div>
          <ul className="zs-chat-progress__signals">
            {[
              ["pain-points", "Pain points", true],
              ["icp", "ICP", true],
              ["market-timing", "Market timing", true],
              ["tam", "TAM", true],
              ["competition", "Competition", false],
              ["moat", "Moat", false],
              ["evidence", "Evidence", false],
              ["frequency", "Frequency", false],
            ].map(([k, label, covered]) => (
              <li
                key={String(k)}
                className="zs-chat-progress__signal"
                data-covered={covered ? true : undefined}
              >
                <span className="zs-chat-progress__signal-dot" aria-hidden />
                <span>{label}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="zs-chat-list">
          <div className="zs-chat-msg" data-role="assistant">
            <span className="zs-chat-msg__role">Mentor</span>
            <div className="zs-chat-msg__body">
              Let&rsquo;s start with the sharpest thing we can anchor on: name one
              specific moment in the last two weeks where a target customer hit the
              problem you&rsquo;re solving. Who was it, what were they trying to do,
              and what made it painful?
            </div>
          </div>

          <div className="zs-chat-msg" data-role="user">
            <span className="zs-chat-msg__role">You</span>
            <div className="zs-chat-msg__body">
              Talked to a seed-stage founder on Tuesday. She was spending 90 minutes
              prepping for every investor update — digging through Linear, Notion,
              and Slack to summarize the week. Told me she was &ldquo;losing her
              Friday to status theater.&rdquo;
            </div>
          </div>

          <div className="zs-chat-msg" data-role="assistant">
            <span className="zs-chat-msg__role">Mentor</span>
            <div className="zs-chat-msg__body">
              Good — concrete and recent. Two things to push on: (1) how often does
              she do this? Weekly, per investor, or only when someone asks? (2)
              Today she spends 90 minutes — is that in her budget forever, or is
              there a dollar cost she&rsquo;d pay to skip it?
            </div>
          </div>

          <div className="zs-chat-msg" data-role="assistant" aria-live="polite">
            <span className="zs-chat-msg__role">Mentor</span>
            <span className="zs-typing">
              <span className="zs-typing__label">Thinking</span>
              <span className="zs-typing__cursor" aria-hidden />
            </span>
          </div>
        </div>

        <div className="zs-chat-input">
          <div className="zs-chat-input__row">
            <textarea
              className="zs-chat-input__textarea"
              rows={1}
              placeholder="Share what you&rsquo;re working on…"
              defaultValue=""
            />
            <button
              type="button"
              className="zs-chat-input__send"
              aria-label="Send message"
              disabled
            >
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
