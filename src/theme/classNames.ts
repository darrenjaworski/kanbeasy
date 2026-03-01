/**
 * Centralized theme class tokens.
 *
 * Base tokens are individual color/interaction patterns.
 * Composites combine base tokens for common element types.
 * Components keep structural classes (sizes, padding, rounded, flex)
 * and reference these tokens for colors.
 */

// ── Base tokens ──────────────────────────────────────────

const border = "border-black/10 dark:border-white/10";
const borderSubtle = "border-black/5 dark:border-white/10";
const text = "text-black/80 dark:text-white/80";
const textMuted = "text-black/70 dark:text-white/70";
const textFaint = "text-black/60 dark:text-white/60";
const textHover = "hover:text-black dark:hover:text-white";
const glass = "bg-white/60 dark:bg-black/20";
const bgHover = "hover:bg-black/10 dark:hover:bg-white/10";
const focusRing =
  "focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-accent";
const separator = "bg-black/10 dark:bg-white/10";
const pressed = "bg-black/10 dark:bg-white/10";
const glassSubtle = "bg-white/40 dark:bg-black/10";
const glassOpaque = "bg-white/80 dark:bg-black/30";
const placeholder = "placeholder:text-black/40 dark:placeholder:text-white/40";
const borderHover = "hover:border-black/20 dark:hover:border-white/20";
const error = "text-red-600 dark:text-red-400";
const codeBg = "bg-black/10 dark:bg-white/10";
const searchHighlight = "ring-2 ring-accent/60 bg-accent/5 dark:bg-accent/10";

// ── Composites ───────────────────────────────────────────

const button = `border ${border} ${glass} text-sm ${bgHover} transition-colors ${text} ${textHover}`;
const dangerButton = `border border-red-400 ${glass} text-sm hover:bg-red-100 dark:hover:bg-red-900 transition-colors text-red-700 dark:text-red-300 hover:text-red-900 dark:hover:text-red-100`;
const iconButton = `inline-flex items-center justify-center ${bgHover} ${focusRing} ${text} ${textHover}`;
const buttonGroup = `inline-flex items-center overflow-hidden border ${border} ${glass}`;
const input = `bg-transparent border-0 outline-hidden ${focusRing}`;

// ── Exported object ──────────────────────────────────────

export const tc = {
  // Base tokens
  border,
  borderSubtle,
  text,
  textMuted,
  textFaint,
  textHover,
  glass,
  bgHover,
  focusRing,
  separator,
  pressed,
  glassSubtle,
  glassOpaque,
  placeholder,
  borderHover,
  error,
  codeBg,
  searchHighlight,

  // Composites
  button,
  dangerButton,
  iconButton,
  buttonGroup,
  input,
} as const;
