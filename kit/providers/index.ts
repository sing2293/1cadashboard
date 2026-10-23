// Brings the kit's missing DOM declarations into any app program that imports the providers,
// so the vendored GlassyUI source type-checks there too. Type-only: nothing reaches the bundle.
import type {} from '../types/view-timeline';

export { KitProviders, type KitProvidersProps } from './kit-providers';
export { useGlassEffects, type GlassEffects } from './glass-effects';
