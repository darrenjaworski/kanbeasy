import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TicketTypeSection } from "../TicketTypeSection";
import { ThemeProvider } from "../../../theme/ThemeProvider";
import { BoardProvider } from "../../../board/BoardProvider";
import { TICKET_TYPE_PRESETS } from "../../../constants/ticketTypes";
import { describe, beforeEach, it, expect } from "vitest";

function renderSection() {
  return render(
    <BoardProvider>
      <ThemeProvider>
        <TicketTypeSection />
      </ThemeProvider>
    </BoardProvider>,
  );
}

function expandEditor() {
  fireEvent.click(screen.getByTestId("ticket-type-editor-toggle"));
}

const devPreset = TICKET_TYPE_PRESETS.find((p) => p.id === "development")!;
const personalPreset = TICKET_TYPE_PRESETS.find((p) => p.id === "personal")!;

describe("TicketTypeSection", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe("rendering", () => {
    it("renders the preset selector with development as default", () => {
      renderSection();
      const select = screen.getByTestId("ticket-type-preset");
      expect(select).toHaveValue("development");
    });

    it("renders all default development ticket types", () => {
      renderSection();
      expandEditor();
      for (const type of devPreset.types) {
        expect(screen.getByDisplayValue(type.id)).toBeInTheDocument();
        expect(screen.getByDisplayValue(type.label)).toBeInTheDocument();
      }
    });

    it("renders add type button", () => {
      renderSection();
      expandEditor();
      expect(screen.getByTestId("ticket-type-add")).toBeInTheDocument();
    });

    it("renders a color swatch for each type", () => {
      renderSection();
      expandEditor();
      for (const type of devPreset.types) {
        expect(
          screen.getByLabelText(`Change color for ${type.label}`),
        ).toBeInTheDocument();
      }
    });

    it("renders a remove button for each type", () => {
      renderSection();
      expandEditor();
      for (const type of devPreset.types) {
        expect(
          screen.getByLabelText(`Remove ${type.label} type`),
        ).toBeInTheDocument();
      }
    });
  });

  describe("preset selection", () => {
    it("switches to personal preset", () => {
      renderSection();
      expandEditor();
      fireEvent.change(screen.getByTestId("ticket-type-preset"), {
        target: { value: "personal" },
      });

      for (const type of personalPreset.types) {
        expect(screen.getByDisplayValue(type.id)).toBeInTheDocument();
        expect(screen.getByDisplayValue(type.label)).toBeInTheDocument();
      }
    });

    it("switches to custom without changing types", () => {
      renderSection();
      expandEditor();
      fireEvent.change(screen.getByTestId("ticket-type-preset"), {
        target: { value: "custom" },
      });

      expect(screen.getByTestId("ticket-type-preset")).toHaveValue("custom");
      // Types should remain as development defaults
      for (const type of devPreset.types) {
        expect(screen.getByDisplayValue(type.id)).toBeInTheDocument();
      }
    });
  });

  describe("editing types", () => {
    it("updates label and switches to custom preset", async () => {
      const user = userEvent.setup();
      renderSection();
      expandEditor();

      const labelInput = screen.getByTestId("ticket-type-label-0");
      await user.clear(labelInput);
      await user.type(labelInput, "Story");

      expect(screen.getByTestId("ticket-type-preset")).toHaveValue("custom");
      expect(labelInput).toHaveValue("Story");
    });

    it("updates type ID and switches to custom preset", async () => {
      const user = userEvent.setup();
      renderSection();
      expandEditor();

      const idInput = screen.getByTestId("ticket-type-id-0");
      await user.clear(idInput);
      await user.type(idInput, "story");

      expect(screen.getByTestId("ticket-type-preset")).toHaveValue("custom");
      expect(idInput).toHaveValue("story");
    });
  });

  describe("removing types", () => {
    it("removes a type and switches to custom preset", () => {
      renderSection();
      expandEditor();
      const initialCount = devPreset.types.length;

      fireEvent.click(screen.getByTestId("ticket-type-remove-0"));

      expect(screen.getByTestId("ticket-type-preset")).toHaveValue("custom");
      // One fewer type should be rendered
      const remaining = screen.queryAllByTestId(/^ticket-type-id-/);
      expect(remaining).toHaveLength(initialCount - 1);
      // The removed type's ID should no longer appear
      expect(
        screen.queryByDisplayValue(devPreset.types[0].id),
      ).not.toBeInTheDocument();
    });
  });

  describe("adding types", () => {
    it("adds a new type with default values and switches to custom preset", () => {
      renderSection();
      expandEditor();
      const initialCount = devPreset.types.length;

      fireEvent.click(screen.getByTestId("ticket-type-add"));

      expect(screen.getByTestId("ticket-type-preset")).toHaveValue("custom");
      const allTypeIds = screen.queryAllByTestId(/^ticket-type-id-/);
      expect(allTypeIds).toHaveLength(initialCount + 1);
      // New type has default id "new" and label "New Type"
      expect(screen.getByDisplayValue("new")).toBeInTheDocument();
      expect(screen.getByDisplayValue("New Type")).toBeInTheDocument();
    });

    it("picks the first unused color for a new type", () => {
      renderSection();
      expandEditor();

      fireEvent.click(screen.getByTestId("ticket-type-add"));

      // The new type should have a color swatch button
      const newColorButton = screen.getByLabelText("Change color for New Type");
      expect(newColorButton).toBeInTheDocument();
    });
  });

  describe("color picker", () => {
    it("opens color picker when swatch is clicked", () => {
      renderSection();
      expandEditor();
      const swatch = screen.getByLabelText(
        `Change color for ${devPreset.types[0].label}`,
      );

      fireEvent.click(swatch);

      // Should show color palette buttons
      const colorButtons = screen.getAllByLabelText(/^Color #/);
      expect(colorButtons.length).toBeGreaterThan(0);
    });

    it("closes color picker when swatch is clicked again", () => {
      renderSection();
      expandEditor();
      const swatch = screen.getByLabelText(
        `Change color for ${devPreset.types[0].label}`,
      );

      fireEvent.click(swatch);
      expect(screen.getAllByLabelText(/^Color #/).length).toBeGreaterThan(0);

      fireEvent.click(swatch);
      expect(screen.queryAllByLabelText(/^Color #/)).toHaveLength(0);
    });

    it("changes color and closes picker when a color is selected", () => {
      renderSection();
      expandEditor();
      const swatch = screen.getByLabelText(
        `Change color for ${devPreset.types[0].label}`,
      );

      fireEvent.click(swatch);

      // Pick the first color button
      const colorButtons = screen.getAllByLabelText(/^Color #/);
      fireEvent.click(colorButtons[0]);

      // Picker should close
      expect(screen.queryAllByLabelText(/^Color #/)).toHaveLength(0);
      // Preset should switch to custom
      expect(screen.getByTestId("ticket-type-preset")).toHaveValue("custom");
    });

    it("only shows one color picker at a time", () => {
      renderSection();
      expandEditor();
      const swatch0 = screen.getByLabelText(
        `Change color for ${devPreset.types[0].label}`,
      );
      const swatch1 = screen.getByLabelText(
        `Change color for ${devPreset.types[1].label}`,
      );

      fireEvent.click(swatch0);
      const firstPickers = screen.getAllByLabelText(/^Color #/);

      fireEvent.click(swatch1);
      const secondPickers = screen.getAllByLabelText(/^Color #/);

      // Same number of color buttons (one palette, not two)
      expect(secondPickers).toHaveLength(firstPickers.length);
    });
  });
});
