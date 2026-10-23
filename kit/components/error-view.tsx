'use client';

import { RotateCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTransition, type ReactNode } from 'react';
import { GlassButton } from './glassyui/glass-button';
import { RouteStateFrame } from './route-state-frame';

export interface ErrorViewProps {
  /** The error Next hands error.tsx. Only its digest is shown, as a reference for support. */
  error: Error & { digest?: string };
  /** error.tsx's `reset`. "Try again" refreshes the route's server data, then resets. */
  reset: () => void;
  /**
   * error.tsx's `retry` (Next 16.3+), which re-fetches and re-renders the segment. When given,
   * "Try again" calls it instead of refresh + reset.
   */
  retry?: () => void;
  /** The app's registry id ("sales"). Inside AppShell it defaults to the shell's app. */
  appId?: string;
  /** Where "Back to …" leads. Defaults to the shell's home inside AppShell, else "/". */
  homeHref?: string;
  /** Defaults to "Something went wrong". */
  title?: string;
  /** Replaces the default explanation (inline text: it renders inside a paragraph). */
  description?: ReactNode;
}

/**
 * The body of every error.tsx: a themed, branded error page inside the app's shell, with
 * "Try again" and "Back to …". Never shows the error's message, which can hold server details;
 * the digest matches the server log.
 *
 *   // app/(dash)/error.tsx
 *   'use client';
 *   import { ErrorView } from '@1ca/ui/components/route-states';
 *
 *   export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
 *     return <ErrorView error={error} reset={reset} appId="sales" />;
 *   }
 */
export function ErrorView({
  error,
  reset,
  retry,
  appId,
  homeHref,
  title = 'Something went wrong',
  description,
}: ErrorViewProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const tryAgain = () => {
    if (retry) {
      retry();
      return;
    }
    // reset() alone re-renders the same failed server payload; refresh fetches it again first.
    startTransition(() => {
      router.refresh();
      reset();
    });
  };

  return (
    <RouteStateFrame
      kind="error"
      appId={appId}
      homeHref={homeHref}
      title={title}
      description={description}
      digest={error.digest}
      primaryAction={
        <GlassButton
          variant="prominent"
          size="sm"
          className="ca-control-sm"
          onClick={tryAgain}
          disabled={pending}
        >
          <RotateCw aria-hidden className="size-4" />
          {pending ? 'Trying again…' : 'Try again'}
        </GlassButton>
      }
    />
  );
}
