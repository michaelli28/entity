export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-[var(--color-bg)] text-[var(--color-text)] min-h-screen">
      <main className="prose prose-invert mx-auto max-w-3xl p-8">
        {children}
      </main>
    </div>
  );
}
