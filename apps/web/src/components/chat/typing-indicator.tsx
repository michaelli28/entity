export function TypingIndicator() {
  return (
    <div
      className="en-chat-msg"
      data-role="assistant"
      aria-live="polite"
      aria-label="Mentor is thinking"
    >
      <span className="en-chat-msg__role">Mentor</span>
      <span className="en-typing">
        <span className="en-typing__label">Thinking</span>
        <span className="en-typing__cursor" aria-hidden="true" />
      </span>
    </div>
  );
}
