'use client';

import { Check } from 'lucide-react';
import { useCallback, useState, type ReactNode } from 'react';
import { GlassToast, GlassToastClose, GlassToastTitle } from './glassyui/glass-toast';

interface Notice {
  id: number;
  title: string;
  open: boolean;
}

export interface NoticeToast {
  /** Shows a confirmation. A second one replaces the first and gets its own four seconds. */
  notify: (title: string) => void;
  /** The toast element. Render it once in the component that calls notify. */
  toast: ReactNode;
}

/**
 * The one success confirmation every app uses: a GlassToast (KitProviders mounts the viewport)
 * that floats in with a tick, clears itself after four seconds and keeps its text while it
 * slides away. Each notice is a new toast, so a second notice within four seconds restarts the
 * timer instead of being cut short by the first one's. A client hook.
 *
 *   const { notify, toast } = useNoticeToast();
 *   notify('Role saved');
 *   return <>…{toast}</>;
 *
 * Only for a confirmation of something the page already shows ("Saved", "Invite sent"). A
 * notice with something to remember stays inline as an info GlassAlert until it is dismissed,
 * and a failure stays inline as a danger GlassAlert.
 */
export function useNoticeToast(): NoticeToast {
  const [notice, setNotice] = useState<Notice | null>(null);

  const notify = useCallback((title: string) => {
    setNotice((prev) => ({ id: (prev?.id ?? 0) + 1, title, open: true }));
  }, []);

  const toast = notice ? (
    <GlassToast
      // A new notice is a new toast, so its timer starts over.
      key={notice.id}
      open={notice.open}
      duration={4000}
      onOpenChange={(open) => {
        if (!open) {
          setNotice((current) => (current?.id === notice.id ? { ...current, open: false } : current));
        }
      }}
    >
      {/* Top-aligned, so the tick stays on the first line when a long title wraps. */}
      <span className="flex min-w-0 items-start gap-2.5">
        <Check aria-hidden className="mt-0.5 size-4 shrink-0 text-ca-success" />
        <GlassToastTitle>{notice.title}</GlassToastTitle>
      </span>
      <GlassToastClose />
    </GlassToast>
  ) : null;

  return { notify, toast };
}
