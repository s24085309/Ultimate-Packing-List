import { type ReactNode } from 'react';
import { createPortal } from 'react-dom';

/**
 * Escapes any ancestor that creates a CSS containing block (backdrop-filter,
 * filter, transform, etc.) so position:fixed overlays truly cover the viewport
 * even when triggered from inside a `.glass` card.
 */
export default function Portal({ children }: { children: ReactNode }) {
  return createPortal(children, document.body);
}
