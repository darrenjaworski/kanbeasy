import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { MarkdownPreview } from "../MarkdownPreview";

describe("MarkdownPreview", () => {
  it("renders nothing for empty content", () => {
    const { container } = render(<MarkdownPreview content="" />);
    expect(container.innerHTML).toBe("");
  });

  it("renders headings", () => {
    render(
      <MarkdownPreview content={`# Heading 1\n## Heading 2\n### Heading 3`} />,
    );
    expect(screen.getByText("Heading 1")).toBeInTheDocument();
    expect(screen.getByText("Heading 2")).toBeInTheDocument();
    expect(screen.getByText("Heading 3")).toBeInTheDocument();
  });

  it("renders paragraphs", () => {
    render(<MarkdownPreview content="Hello world" />);
    expect(screen.getByText("Hello world")).toBeInTheDocument();
  });

  it("renders unordered lists", () => {
    render(<MarkdownPreview content={`- Item 1\n- Item 2`} />);
    expect(screen.getByText("Item 1")).toBeInTheDocument();
    expect(screen.getByText("Item 2")).toBeInTheDocument();
  });

  it("renders ordered lists", () => {
    render(<MarkdownPreview content={`1. First\n2. Second`} />);
    expect(screen.getByText("First")).toBeInTheDocument();
    expect(screen.getByText("Second")).toBeInTheDocument();
  });

  it("renders links with target=_blank and rel=noopener noreferrer", () => {
    render(<MarkdownPreview content="[Example](https://example.com)" />);
    const link = screen.getByRole("link", { name: "Example" });
    expect(link).toHaveAttribute("href", "https://example.com");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("renders inline code", () => {
    render(<MarkdownPreview content="Use `console.log` for debugging" />);
    const code = screen.getByText("console.log");
    expect(code.tagName).toBe("CODE");
  });

  it("renders code blocks", () => {
    render(<MarkdownPreview content={`\`\`\`\nconst x = 1;\n\`\`\``} />);
    expect(screen.getByText("const x = 1;")).toBeInTheDocument();
  });

  it("renders blockquotes", () => {
    render(<MarkdownPreview content="> A wise quote" />);
    const blockquote = screen.getByText("A wise quote").closest("blockquote");
    expect(blockquote).toBeInTheDocument();
  });

  it("renders horizontal rules", () => {
    const { container } = render(
      <MarkdownPreview content={`Above\n\n---\n\nBelow`} />,
    );
    expect(container.querySelector("hr")).toBeInTheDocument();
  });

  it("strips raw HTML for safety", () => {
    const { container } = render(
      <MarkdownPreview content='<script>alert("xss")</script><b>safe</b>' />,
    );
    expect(container.querySelector("script")).not.toBeInTheDocument();
    // Custom html renderer strips all raw HTML tags
    expect(container.querySelector("b")).not.toBeInTheDocument();
  });

  it("renders GFM strikethrough", () => {
    render(<MarkdownPreview content="~~deleted~~" />);
    const del = screen.getByText("deleted");
    expect(del.closest("del")).toBeInTheDocument();
  });

  it("renders GFM task lists as disabled by default", () => {
    const { container } = render(
      <MarkdownPreview content={`- [x] Done\n- [ ] Not done`} />,
    );
    const checkboxes = container.querySelectorAll('input[type="checkbox"]');
    expect(checkboxes).toHaveLength(2);
    expect(checkboxes[0]).toBeChecked();
    expect(checkboxes[0]).toBeDisabled();
    expect(checkboxes[1]).not.toBeChecked();
    expect(checkboxes[1]).toBeDisabled();
  });

  it("renders interactive checkboxes when onCheckboxToggle is provided", () => {
    const onToggle = vi.fn();
    const { container } = render(
      <MarkdownPreview
        content={`- [x] Done\n- [ ] Not done`}
        onCheckboxToggle={onToggle}
      />,
    );
    const checkboxes = container.querySelectorAll('input[type="checkbox"]');
    expect(checkboxes).toHaveLength(2);
    expect(checkboxes[0]).not.toBeDisabled();
    expect(checkboxes[1]).not.toBeDisabled();
  });

  it("calls onCheckboxToggle with correct index on click", async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    const { container } = render(
      <MarkdownPreview
        content={`- [x] Done\n- [ ] Not done`}
        onCheckboxToggle={onToggle}
      />,
    );
    const checkboxes = container.querySelectorAll('input[type="checkbox"]');
    await user.click(checkboxes[1]);
    expect(onToggle).toHaveBeenCalledWith(1);
  });

  it("assigns sequential data-checkbox-index attributes", () => {
    const { container } = render(
      <MarkdownPreview content={`- [ ] A\n- [ ] B\n- [ ] C`} />,
    );
    const checkboxes = container.querySelectorAll('input[type="checkbox"]');
    expect(checkboxes[0]).toHaveAttribute("data-checkbox-index", "0");
    expect(checkboxes[1]).toHaveAttribute("data-checkbox-index", "1");
    expect(checkboxes[2]).toHaveAttribute("data-checkbox-index", "2");
  });

  it("renders GFM tables", () => {
    const md = `| A | B |\n|---|---|\n| 1 | 2 |`;
    render(<MarkdownPreview content={md} />);
    expect(screen.getByText("A")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    const { container } = render(
      <MarkdownPreview content="Test" className="custom-class" />,
    );
    expect(container.firstChild).toHaveClass("custom-class");
  });
});
