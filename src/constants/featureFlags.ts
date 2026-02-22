/**
 * Feature flags for gating in-progress features.
 *
 * Flags set to `import.meta.env.DEV` are visible during local
 * development but hidden in production builds.
 * Set a flag to `true` to enable it for all users.
 */
export const featureFlags = {
  /** Analytics button and modal in the header. */
  analytics: import.meta.env.DEV,
} as const;
