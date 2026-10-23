/**
 * Scroll-driven animation timelines (CSS Scroll-driven Animations 1), which TypeScript 5.9's
 * lib.dom does not declare yet. GlassyUI's lib/use-refraction-filter.tsx feature-detects and
 * constructs a ViewTimeline, so the kit needs these globals to type-check.
 *
 * Only what that file uses is declared, shaped exactly like the spec's WebIDL so a future
 * lib.dom merges with it instead of clashing: interfaces merge, a repeated `var` of an
 * identical type is allowed, and no type alias (which cannot merge) is introduced. Delete this
 * file, and the `import type {} from '../types/view-timeline'` lines in theme/index.ts and
 * providers/index.ts, once the TypeScript version in the catalog ships ViewTimeline.
 *
 * Apps compile the kit's source as part of their own program, so the kit's entry modules pull
 * this file in with a type-only import.
 */

export {};

declare global {
  interface ScrollTimeline extends AnimationTimeline {
    readonly source: Element | null;
  }

  interface ViewTimelineOptions {
    subject?: Element;
    axis?: 'block' | 'inline' | 'x' | 'y';
  }

  interface ViewTimeline extends ScrollTimeline {
    readonly subject: Element;
    readonly startOffset: CSSNumericValue;
    readonly endOffset: CSSNumericValue;
  }

  var ViewTimeline: {
    prototype: ViewTimeline;
    new (options?: ViewTimelineOptions): ViewTimeline;
  };
}
