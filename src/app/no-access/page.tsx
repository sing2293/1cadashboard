import { SignOutButton } from "@clerk/nextjs";
import { HUB_URL } from "@/lib/hub-access";

// proxy.ts rewrites here when the signed-in user has no grant for this app.
export default function NoAccessPage() {
  return (
    <main className="flex flex-1 items-center justify-center p-4">
      <div className="fade-up w-full max-w-sm rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 text-center shadow-lg shadow-black/10">
        <h1 className="text-lg font-semibold text-[var(--text)]">
          No access yet
        </h1>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          Your account hasn&apos;t been granted the Sales dashboard. Ask a
          1CleanAir Hub admin to add it for you.
        </p>
        <div className="mt-5 flex justify-center gap-2">
          <a
            href={HUB_URL}
            className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            Back to the hub
          </a>
          <SignOutButton>
            <button
              type="button"
              className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-white/5"
            >
              Sign out
            </button>
          </SignOutButton>
        </div>
      </div>
    </main>
  );
}
