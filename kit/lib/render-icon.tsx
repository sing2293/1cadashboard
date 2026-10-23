import type { LucideIcon } from 'lucide-react';
import { cloneElement, isValidElement, type ReactElement } from 'react';
import { cn } from './utils';

/**
 * An icon prop: a lucide-react component (`ChartLine`) or an element (`<ChartLine />`, or any
 * SVG element). Page primitives render on the server too, where a component is fine; a client
 * component's props can only carry the element form.
 */
export type IconProp = LucideIcon | ReactElement<{ className?: string }>;

/** Renders an IconProp decoratively, merging `className` into an element's own classes. */
export function renderIcon(icon: IconProp | undefined, className: string) {
  if (!icon) return null;
  if (isValidElement<{ className?: string; 'aria-hidden'?: boolean }>(icon)) {
    return cloneElement(icon, {
      className: cn(className, icon.props.className),
      'aria-hidden': icon.props['aria-hidden'] ?? true,
    });
  }
  const Icon = icon as LucideIcon;
  return <Icon aria-hidden className={className} strokeWidth={1.9} />;
}
