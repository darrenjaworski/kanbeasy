import { Marked, type RendererObject } from "marked";
import { useMemo } from "react";
import { tc } from "../../theme/classNames";

type Props = Readonly<{
  content: string;
  className?: string;
}>;

const renderer: RendererObject = {
  // Strip raw HTML (block and inline) for security
  html() {
    return "";
  },
  heading({ tokens, depth }) {
    const text = this.parser.parseInline(tokens);
    const styles: Record<number, string> = {
      1: "text-lg font-bold mb-2",
      2: "text-base font-bold mb-2",
      3: "text-sm font-semibold mb-1",
    };
    return `<h${depth} class="${styles[depth] ?? ""}">${text}</h${depth}>`;
  },
  paragraph({ tokens }) {
    const text = this.parser.parseInline(tokens);
    return `<p class="mb-2 last:mb-0">${text}</p>`;
  },
  list(token) {
    const items = token.items.map((item) => this.listitem(item)).join("");
    const tag = token.ordered ? "ol" : "ul";
    const cls = token.ordered ? "list-decimal" : "list-disc";
    return `<${tag} class="${cls} pl-4 mb-2">${items}</${tag}>`;
  },
  listitem(item) {
    return `<li class="mb-0.5">${this.parser.parse(item.tokens)}</li>`;
  },
  checkbox({ checked }) {
    return `<input type="checkbox" ${checked ? 'checked="" ' : ""}disabled="" class="mr-1.5 align-middle"> `;
  },
  link({ href, title, tokens }) {
    const text = this.parser.parseInline(tokens);
    const titleAttr = title ? ` title="${title}"` : "";
    return `<a href="${href}"${titleAttr} class="text-accent underline" target="_blank" rel="noopener noreferrer">${text}</a>`;
  },
  code({ text, lang, escaped }) {
    const langClass = lang ? ` language-${lang}` : "";
    const content = escaped
      ? text
      : text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    return `<pre class="bg-black/10 dark:bg-white/10 p-2 rounded overflow-x-auto mb-2 text-xs"><code class="text-xs font-mono${langClass}">${content}</code></pre>`;
  },
  codespan({ text }) {
    return `<code class="bg-black/10 dark:bg-white/10 px-1 rounded text-xs font-mono">${text}</code>`;
  },
  blockquote({ tokens }) {
    const body = this.parser.parse(tokens);
    return `<blockquote class="border-l-2 ${tc.border} pl-3 ${tc.textMuted} italic mb-2">${body}</blockquote>`;
  },
  hr() {
    return `<hr class="${tc.separator} border-0 h-px my-3">`;
  },
  table(token) {
    const headerCells = token.header
      .map((cell) => this.tablecell(cell))
      .join("");
    const headerRow = this.tablerow({ text: headerCells });
    const bodyRows = token.rows
      .map((row) => {
        const cells = row.map((cell) => this.tablecell(cell)).join("");
        return this.tablerow({ text: cells });
      })
      .join("");
    const body = bodyRows ? `<tbody>${bodyRows}</tbody>` : "";
    return `<div class="overflow-x-auto mb-2"><table class="w-full border-collapse border ${tc.border} text-xs"><thead class="${tc.glass}">${headerRow}</thead>${body}</table></div>`;
  },
  tablerow({ text }) {
    return `<tr>${text}</tr>`;
  },
  tablecell(token) {
    const content = this.parser.parseInline(token.tokens);
    const tag = token.header ? "th" : "td";
    const cls = token.header
      ? `border ${tc.border} px-2 py-1 text-left font-semibold`
      : `border ${tc.border} px-2 py-1`;
    return `<${tag} class="${cls}">${content}</${tag}>`;
  },
};

const md = new Marked({ renderer, gfm: true, async: false });

export function MarkdownPreview({ content, className = "" }: Props) {
  const html = useMemo(
    () => (content ? (md.parse(content) as string) : null),
    [content],
  );

  if (!html) return null;

  return (
    <div
      className={`text-sm ${tc.text} ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
