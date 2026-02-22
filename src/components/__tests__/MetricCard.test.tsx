import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { MetricCard } from "../MetricCard";
import { ThemeProvider } from "../../theme/ThemeProvider";

function renderMetricCard(
  props: Partial<{
    label: string;
    value: string | null;
    fallback: string;
    description: string;
  }> = {},
) {
  const defaults = {
    label: "Test Metric",
    value: "42",
    description: "A test description",
  };
  return render(
    <ThemeProvider>
      <MetricCard {...defaults} {...props} />
    </ThemeProvider>,
  );
}

describe("MetricCard", () => {
  it("renders label, value, and description", () => {
    renderMetricCard({
      label: "Total Cards",
      value: "15",
      description: "Across all columns",
    });

    expect(screen.getByText("Total Cards")).toBeInTheDocument();
    expect(screen.getByText("15")).toBeInTheDocument();
    expect(screen.getByText("Across all columns")).toBeInTheDocument();
  });

  it("renders fallback text when value is null", () => {
    renderMetricCard({ value: null });

    expect(screen.getByText("Not enough data")).toBeInTheDocument();
    expect(screen.queryByText("42")).not.toBeInTheDocument();
  });

  it("renders custom fallback when value is null", () => {
    renderMetricCard({ value: null, fallback: "No data yet" });

    expect(screen.getByText("No data yet")).toBeInTheDocument();
    expect(screen.queryByText("Not enough data")).not.toBeInTheDocument();
  });

  it("renders value of '0' instead of fallback", () => {
    renderMetricCard({ value: "0" });

    expect(screen.getByText("0")).toBeInTheDocument();
    expect(screen.queryByText("Not enough data")).not.toBeInTheDocument();
  });
});
