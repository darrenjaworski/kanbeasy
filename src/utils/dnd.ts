import type { HTMLAttributes } from "react";

/**
 * Casts @dnd-kit attributes/listeners to React HTML attributes so they can be
 * spread directly on a JSX element.
 *
 * The mismatch: dnd-kit's `DraggableAttributes` uses narrow literal types for
 * aria fields, and `SyntheticListenerMap` uses native `EventListener` instead
 * of React's `SyntheticEvent` handlers. The objects are structurally
 * compatible at runtime; this utility centralizes the type boundary crossing.
 */
export function asDOMAttributes<T extends HTMLElement>(
  ...maps: (Record<string, unknown> | undefined)[]
): HTMLAttributes<T> {
  return Object.assign({}, ...maps) as React.HTMLAttributes<T>;
}
