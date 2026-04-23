import Link from "next/link";

export default function Unauthorized() {
  return (
    <main className="min-h-screen bg-[oklch(0.17_0.03_18)] text-foreground flex items-center justify-center px-6">
      <section className="w-full max-w-lg rounded-2xl border border-[oklch(0.31_0.04_18)] bg-[oklch(0.23_0.03_18)] p-8 shadow-[0_18px_45px_rgba(0,0,0,0.45)] text-center">
        <p className="text-sm text-muted-foreground mb-2">401</p>
        <h1 className="text-2xl font-bold tracking-tight mb-2">Unauthorized</h1>
        <p className="text-sm text-muted-foreground mb-6">
          You do not have permission to access this organisation.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Back to Dashboard
        </Link>
      </section>
    </main>
  );
}
