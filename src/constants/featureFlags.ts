/**
 * Feature flags for gating in-progress features.
 *
 * Flags set to `import.meta.env.DEV` are visible during local
 * development but hidden in production builds.
 * Set a flag to `true` to enable it for all users.
 */
export const featureFlags = {
  /** Analytics button and modal in the header. */
  analytics: true,
  /** Undo/redo for board actions via Cmd+Z / Cmd+Shift+Z and floating controls. */
  undoRedo: true,
} as const;
