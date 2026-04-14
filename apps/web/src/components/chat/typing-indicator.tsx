export function TypingIndicator() {
  return (
    <div
      className="zs-chat-msg"
      data-role="assistant"
      aria-live="polite"
      aria-label="Mentor is thinking"
    >
      <span className="zs-chat-msg__role">Mentor</span>
      <span className="zs-typing">
        <span className="zs-typing__label">Thinking</span>
        <span className="zs-typing__cursor" aria-hidden="true" />
      </span>
    </div>
  );
}
