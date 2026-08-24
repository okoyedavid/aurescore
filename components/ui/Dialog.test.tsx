import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { Dialog } from "./Dialog";

function ControlledDialog({ onClose }: { onClose: () => void }) {
  const [value, setValue] = useState("");
  return (
    <Dialog open title="Edit value" onClose={() => onClose()}>
      <label>
        Value
        <input
          autoFocus
          value={value}
          onChange={(event) => setValue(event.target.value)}
        />
      </label>
      <button type="button">Cancel</button>
    </Dialog>
  );
}

describe("Dialog focus management", () => {
  it("retains input focus when controlled children recreate onClose", () => {
    render(<ControlledDialog onClose={vi.fn()} />);
    const input = screen.getByLabelText("Value");
    expect(input).toHaveFocus();

    fireEvent.change(input, { target: { value: "Assessment" } });

    expect(input).toHaveValue("Assessment");
    expect(input).toHaveFocus();
  });

  it("uses the latest close callback without restarting the focus effect", () => {
    const first = vi.fn();
    const second = vi.fn();
    const view = render(<ControlledDialog onClose={first} />);
    view.rerender(<ControlledDialog onClose={second} />);

    fireEvent.keyDown(document, { key: "Escape" });

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledOnce();
  });
});
