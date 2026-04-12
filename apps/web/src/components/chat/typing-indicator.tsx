export function TypingIndicator() {
  return (
    <div className="flex gap-1 px-4 py-2">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="bg-primary h-2 w-2 animate-pulse rounded-full"
          style={{ animationDelay: `${i * 150}ms` }}
        />
      ))}
    </div>
  );
}
