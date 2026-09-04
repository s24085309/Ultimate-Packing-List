import type { FontFamilyId, FontSizeId, ThemeMode } from '../types';
import { THEME_DEFAULT_TEXT_COLOR } from '../types';

export const FONT_STACKS: Record<FontFamilyId, { display: string; body: string; label: string }> = {
  default: { label: 'Default (Outfit / Inter)', display: "'Outfit', 'Segoe UI', system-ui, sans-serif", body: "'Inter', 'Segoe UI', system-ui, sans-serif" },
  rounded: { label: 'Rounded (Quicksand)', display: "'Quicksand', 'Segoe UI', system-ui, sans-serif", body: "'Quicksand', 'Segoe UI', system-ui, sans-serif" },
  serif: { label: 'Classic Serif', display: "Georgia, 'Iowan Old Style', 'Palatino Linotype', 'Book Antiqua', serif", body: "Georgia, 'Iowan Old Style', 'Palatino Linotype', 'Book Antiqua', serif" },
  mono: { label: 'Monospace', display: "ui-monospace, 'SF Mono', 'Cascadia Code', Menlo, Consolas, monospace", body: "ui-monospace, 'SF Mono', 'Cascadia Code', Menlo, Consolas, monospace" },
};

export const FONT_SIZE_SCALE: Record<FontSizeId, number> = {
  small: 0.875, medium: 1, large: 1.15, xlarge: 1.3,
};

export const FONT_SIZE_LABEL: Record<FontSizeId, string> = {
  small: 'Small', medium: 'Medium', large: 'Large', xlarge: 'Extra Large',
};

export const FONT_SIZE_ORDER: FontSizeId[] = ['small', 'medium', 'large', 'xlarge'];

export function applyAppearance(settings: { fontFamily: FontFamilyId; textColor?: string; accentColor: string; themeMode: ThemeMode }) {
  const root = document.documentElement;
  const fonts = FONT_STACKS[settings.fontFamily];
  root.style.setProperty('--font-display', fonts.display);
  root.style.setProperty('--font-body', fonts.body);
  if (settings.textColor) root.style.setProperty('--text-hi', settings.textColor);
  else root.style.removeProperty('--text-hi'); // fall back to the theme's own readable default
  root.style.setProperty('--accent-1', settings.accentColor);
  root.style.setProperty('--grad-a', `linear-gradient(135deg, ${settings.accentColor}, #ec4899)`);
  root.dataset.theme = settings.themeMode;
}

export function effectiveTextColor(settings: { textColor?: string; themeMode: ThemeMode }): string {
  return settings.textColor ?? THEME_DEFAULT_TEXT_COLOR[settings.themeMode];
}
