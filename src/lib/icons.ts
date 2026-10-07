// Phosphor icons (regular weight), inlined at build time as raw SVG: no runtime JS.
import arrowRight from '@phosphor-icons/core/assets/regular/arrow-right.svg?raw';
import arrowUpRight from '@phosphor-icons/core/assets/regular/arrow-up-right.svg?raw';
import crosshair from '@phosphor-icons/core/assets/regular/crosshair-simple.svg?raw';
import search from '@phosphor-icons/core/assets/regular/magnifying-glass.svg?raw';

const icons = { 'arrow-right': arrowRight, 'arrow-up-right': arrowUpRight, crosshair, search };
export type IconName = keyof typeof icons;

/** The icon's paths without the <svg> wrapper (viewBox 0 0 256 256). */
export const inner = (name: IconName) => icons[name].replace(/^<svg[^>]*>|<\/svg>$/g, '');
