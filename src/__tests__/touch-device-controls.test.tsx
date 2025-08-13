import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
import { BoardProvider } from "../board/BoardProvider";
import { Board } from "../components/Board";
import { ThemeProvider } from "../theme/ThemeProvider";

function TestWrapper({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <BoardProvider>
        {children}
      </BoardProvider>
    </ThemeProvider>
  );
}

test("card and column controls are accessible on touch devices", async () => {
  const user = userEvent.setup();
  
  render(
    <TestWrapper>
      <Board />
    </TestWrapper>
  );

  // Add a column first
  const addColumnButton = screen.getByTestId("add-column-button");
  await user.click(addColumnButton);

  // Wait for the column to be added
  await waitFor(() => {
    expect(screen.getByTestId("add-card-button-0")).toBeInTheDocument();
  });

  // Add first card to the column
  const addCardButton = screen.getByTestId("add-card-button-0");
  await user.click(addCardButton);

  // Wait for the first card to be added
  await waitFor(() => {
    expect(screen.getByTestId("card-0")).toBeInTheDocument();
  });

  // Add second card to enable drag functionality
  await user.click(addCardButton);

  // Wait for the second card to be added
  await waitFor(() => {
    expect(screen.getByTestId("card-1")).toBeInTheDocument();
  });

  // Check that card controls exist and are accessible (should now have drag buttons)
  const cardDragButton = screen.getByTestId("card-drag-0");
  const cardRemoveButton = screen.getByTestId("card-remove-0");
  
  expect(cardDragButton).toBeInTheDocument();
  expect(cardRemoveButton).toBeInTheDocument();
  
  // Check that column controls exist and are accessible
  const columnDeleteButton = screen.getByTestId("delete-column-button-0");
  
  expect(columnDeleteButton).toBeInTheDocument();

  // Verify controls have proper accessibility labels
  expect(cardDragButton).toHaveAttribute("aria-label");
  expect(cardRemoveButton).toHaveAttribute("aria-label");
  expect(columnDeleteButton).toHaveAttribute("aria-label");
});

test("touch-specific CSS classes are applied", async () => {
  const user = userEvent.setup();
  
  render(
    <TestWrapper>
      <Board />
    </TestWrapper>
  );

  // Add a column first
  const addColumnButton = screen.getByTestId("add-column-button");
  await user.click(addColumnButton);

  // Wait for the column to be added
  await waitFor(() => {
    expect(screen.getByTestId("add-card-button-0")).toBeInTheDocument();
  });

  // Add two cards to the column to enable drag functionality
  const addCardButton = screen.getByTestId("add-card-button-0");
  await user.click(addCardButton);
  await user.click(addCardButton);

  // Wait for the cards to be added
  await waitFor(() => {
    expect(screen.getByTestId("card-0")).toBeInTheDocument();
    expect(screen.getByTestId("card-1")).toBeInTheDocument();
  });

  // Check that controls containers have touch-friendly classes
  const cardElement = screen.getByTestId("card-0");
  const cardControlsContainer = cardElement.querySelector('[class*="touch:opacity-100"]');
  
  expect(cardControlsContainer).toBeInTheDocument();
  expect(cardControlsContainer).toHaveClass("touch:opacity-100");

  const columnElement = screen.getByTestId("column-0");
  const columnControlsContainer = columnElement.querySelector('[class*="touch:opacity-100"]');
  
  expect(columnControlsContainer).toBeInTheDocument();
  expect(columnControlsContainer).toHaveClass("touch:opacity-100");
});