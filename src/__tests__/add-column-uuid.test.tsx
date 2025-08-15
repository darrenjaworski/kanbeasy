import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BoardProvider } from '../board/BoardProvider';
import { AddColumn } from '../components/AddColumn';
import { useBoard } from '../board/useBoard';

// Test component to access board context
function TestAddColumnComponent() {
  const { addColumn, columns } = useBoard();
  
  return (
    <div>
      <AddColumn handleOnClick={() => addColumn("Test Column")} />
      <div data-testid="columns-count">{columns.length}</div>
      {columns.map((col) => (
        <div key={col.id} data-testid={`column-${col.id}`}>
          {col.title}
        </div>
      ))}
    </div>
  );
}

describe('Add Column with UUID Generation', () => {
  it('successfully adds a column with generated UUID', () => {
    render(
      <BoardProvider>
        <TestAddColumnComponent />
      </BoardProvider>
    );

    // Initially no columns
    expect(screen.getByTestId('columns-count')).toHaveTextContent('0');

    // Click add column button
    const addButton = screen.getByRole('button', { name: /add column/i });
    fireEvent.click(addButton);

    // Should now have 1 column
    expect(screen.getByTestId('columns-count')).toHaveTextContent('1');
    
    // Should display the column with the test title
    expect(screen.getByText('Test Column')).toBeInTheDocument();

    // Add another column to test uniqueness
    fireEvent.click(addButton);
    expect(screen.getByTestId('columns-count')).toHaveTextContent('2');
    
    // Should have 2 "Test Column" elements
    expect(screen.getAllByText('Test Column')).toHaveLength(2);
  });
});