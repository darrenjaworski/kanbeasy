import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { tc } from "../theme/classNames";

type Props = Readonly<{
  content: string;
  className?: string;
}>;

const components: Components = {
  h1: ({ children }) => <h1 className="text-lg font-bold mb-2">{children}</h1>,
  h2: ({ children }) => (
    <h2 className="text-base font-bold mb-2">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-sm font-semibold mb-1">{children}</h3>
  ),
  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
  ul: ({ children }) => <ul className="list-disc pl-4 mb-2">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal pl-4 mb-2">{children}</ol>,
  li: ({ children }) => <li className="mb-0.5">{children}</li>,
  a: ({ href, children }) => (
    <a
      href={href}
      className="text-accent underline"
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </a>
  ),
  code: ({ className, children }) => {
    const isBlock = className?.includes("language-");
    if (isBlock) {
      return (
        <code className={`text-xs font-mono ${className ?? ""}`}>
          {children}
        </code>
      );
    }
    return (
      <code className="bg-black/10 dark:bg-white/10 px-1 rounded text-xs font-mono">
        {children}
      </code>
    );
  },
  pre: ({ children }) => (
    <pre className="bg-black/10 dark:bg-white/10 p-2 rounded overflow-x-auto mb-2 text-xs">
      {children}
    </pre>
  ),
  blockquote: ({ children }) => (
    <blockquote
      className={`border-l-2 ${tc.border} pl-3 ${tc.textMuted} italic mb-2`}
    >
      {children}
    </blockquote>
  ),
  hr: () => <hr className={`${tc.separator} border-0 h-px my-3`} />,
  table: ({ children }) => (
    <div className="overflow-x-auto mb-2">
      <table className={`w-full border-collapse border ${tc.border} text-xs`}>
        {children}
      </table>
    </div>
  ),
  thead: ({ children }) => <thead className={tc.glass}>{children}</thead>,
  th: ({ children }) => (
    <th className={`border ${tc.border} px-2 py-1 text-left font-semibold`}>
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className={`border ${tc.border} px-2 py-1`}>{children}</td>
  ),
  input: (props) => {
    if (props.type === "checkbox") {
      return (
        <input
          type="checkbox"
          checked={props.checked}
          disabled
          className="mr-1.5 align-middle"
        />
      );
    }
    return <input {...props} />;
  },
};

export function MarkdownPreview({ content, className = "" }: Props) {
  if (!content) return null;

  return (
    <div className={`text-sm ${tc.text} ${className}`}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
