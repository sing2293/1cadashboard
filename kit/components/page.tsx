import type { ComponentProps } from 'react';
import { cn } from '../lib/utils';

export type PageWidth = 'narrow' | 'default' | 'wide' | 'full';

const WIDTH: Record<PageWidth, string> = {
  narrow: 'max-w-3xl',
  default: 'max-w-7xl',
  wide: 'max-w-[100rem]',
  full: 'max-w-none',
};

export interface PageProps extends ComponentProps<'div'> {
  /**
   * How wide the content may grow. "wide" (default, 1600px) suits dashboards, "default"
   * (1280px) settings and detail pages, "narrow" (768px) forms, "full" wallboards and maps.
   */
  width?: PageWidth;
}

/**
 * The content column of every page inside AppShell: the shared gutters (16px on phones, 24px
 * from 768px, 32px from 1024px), 24px top and bottom, and a 24px gap between blocks.
 * Server-safe.
 *
 *   <Page>
 *     <PageHeader title="Sales" />
 *     <Section title="This month">…</Section>
 *   </Page>
 *
 * It also exposes the gutters as --ca-page-gutter and --ca-page-top, which a sticky
 * PageHeader uses to bleed its frosted band to the column's edges.
 */
export function Page({ width = 'wide', className, ...props }: PageProps) {
  return (
    <div
      {...props}
      className={cn(
        'mx-auto flex w-full min-w-0 flex-col gap-6',
        '[--ca-page-gutter:1rem] [--ca-page-top:1.5rem] md:[--ca-page-gutter:1.5rem] lg:[--ca-page-gutter:2rem]',
        'px-[var(--ca-page-gutter)] py-[var(--ca-page-top)]',
        WIDTH[width],
        className,
      )}
    />
  );
}
