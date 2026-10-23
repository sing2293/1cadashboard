'use client';

import { Monitor, Moon, Sun, type LucideIcon } from 'lucide-react';
import { GlassButton } from '../components/glassyui/glass-button';
import {
  GlassMenu,
  GlassMenuContent,
  GlassMenuRadioGroup,
  GlassMenuRadioItem,
  GlassMenuTrigger,
} from '../components/glassyui/glass-menu';
import {
  GlassSegmentedControl,
  GlassSegmentedControlItem,
} from '../components/glassyui/glass-segmented-control';
import { cn } from '../lib/utils';
import { isThemeChoice, type ThemeChoice } from './theme';
import { useThemeChoice } from './theme-store';

export { useThemeChoice } from './theme-store';
export type { ThemeState } from './theme-store';

const OPTIONS: readonly { value: ThemeChoice; label: string; Icon: LucideIcon }[] = [
  { value: 'light', label: 'Light', Icon: Sun },
  { value: 'dark', label: 'Dark', Icon: Moon },
  { value: 'system', label: 'System', Icon: Monitor },
];

export type ThemeToggleProps = {
  /**
   * "segmented" (default): three icon segments, about 100px wide.
   * "menu": one icon button that opens a Light / Dark / System menu, for tight headers.
   */
  variant?: 'segmented' | 'menu';
  /** Segmented only: show the words beside the icons. */
  showLabels?: boolean;
  /** Accessible name of the control. */
  label?: string;
  className?: string;
};

/**
 * Light / Dark / System. The choice is saved in the shared ca-theme cookie, so it follows the
 * visitor to every 1cleanair.info app; <html> and the glass switch in the same frame. Renders
 * nothing in an app that pins its theme (KitProviders forcedTheme).
 */
export function ThemeToggle({
  variant = 'segmented',
  showLabels = false,
  label = 'Theme',
  className,
}: ThemeToggleProps) {
  const { choice, forcedTheme, setChoice } = useThemeChoice();

  if (forcedTheme) return null;

  const onValueChange = (value: string) => {
    if (isThemeChoice(value) && value !== choice) setChoice(value);
  };

  if (variant === 'menu') {
    const current = OPTIONS.find((option) => option.value === choice) ?? OPTIONS[1];
    const name = `${label}: ${current.label}`;

    return (
      <GlassMenu>
        <GlassMenuTrigger asChild>
          <GlassButton
            variant="ghost"
            size="sm"
            aria-label={name}
            title={name}
            className={cn('ca-theme-menu-trigger', className)}
          >
            <current.Icon aria-hidden className="ca-theme-toggle__icon" />
          </GlassButton>
        </GlassMenuTrigger>
        <GlassMenuContent align="end">
          <GlassMenuRadioGroup value={choice} onValueChange={onValueChange}>
            {OPTIONS.map(({ value, label: text, Icon }) => (
              <GlassMenuRadioItem key={value} value={value}>
                <Icon aria-hidden />
                {text}
              </GlassMenuRadioItem>
            ))}
          </GlassMenuRadioGroup>
        </GlassMenuContent>
      </GlassMenu>
    );
  }

  return (
    <GlassSegmentedControl
      aria-label={label}
      value={choice}
      onValueChange={onValueChange}
      className={cn('ca-theme-toggle', showLabels && 'ca-theme-toggle--labels', className)}
    >
      {OPTIONS.map(({ value, label: text, Icon }) => (
        <GlassSegmentedControlItem
          key={value}
          value={value}
          aria-label={showLabels ? undefined : text}
          title={showLabels ? undefined : text}
        >
          <Icon aria-hidden className="ca-theme-toggle__icon" />
          {showLabels ? <span>{text}</span> : null}
        </GlassSegmentedControlItem>
      ))}
    </GlassSegmentedControl>
  );
}
