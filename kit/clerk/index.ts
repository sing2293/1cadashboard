/**
 * The Clerk theme bridge: Clerk Core 3's appearance in the 1CA palette for light and dark, and
 * a ClerkProvider that switches it with the visitor's theme.
 *
 *   import { ThemedClerkProvider } from '@1ca/ui/clerk';
 *   import { clerkAppearance, mergeClerkAppearance, signInAppearance } from '@1ca/ui/clerk';
 */
export {
  clerkAppearance,
  clerkElements,
  clerkVariables,
  mergeClerkAppearance,
  signInAppearance,
  userButtonAppearance,
  type ClerkAppearance,
  type ClerkElements,
  type ClerkVariables,
} from './appearance';
export { ThemedClerkProvider, type ThemedClerkProviderProps } from './themed-clerk-provider';
