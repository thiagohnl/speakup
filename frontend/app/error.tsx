'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-6">
      <h2 className="font-display text-2xl text-text-primary">Something went wrong</h2>
      <p className="mt-2 text-sm text-text-secondary">{error.message}</p>
      <button
        onClick={reset}
        className="mt-6 min-h-[48px] rounded-xl bg-teal px-6 font-semibold text-navy transition-transform active:scale-95"
      >
        Try Again
      </button>
    </div>
  );
}
