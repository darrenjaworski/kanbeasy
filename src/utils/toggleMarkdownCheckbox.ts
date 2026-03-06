const CHECKBOX_PATTERN = /^(\s*[-*+]\s+)\[([ xX])\]/gm;

/**
 * Toggle the nth checkbox in a markdown string.
 * Returns the updated markdown, or the original if the index is out of range.
 */
export function toggleMarkdownCheckbox(
  markdown: string,
  index: number,
): string {
  let count = 0;
  return markdown.replace(CHECKBOX_PATTERN, (match, prefix: string, state) => {
    if (count++ !== index) return match;
    const toggled = state === " " ? "x" : " ";
    return `${prefix}[${toggled}]`;
  });
}
