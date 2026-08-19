import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import OneTimeSecretDialog from "./components/OneTimeSecretDialog";

describe("one-time client secret", () => {
  it("keeps the secret local until it is explicitly acknowledged", () => {
    const acknowledge = vi.fn();
    render(
      <OneTimeSecretDialog
        secret="aus_once_only"
        onAcknowledge={acknowledge}
      />,
    );
    expect(screen.getByTestId("client-secret")).toHaveTextContent(
      "aus_once_only",
    );
    expect(screen.queryByLabelText("Close")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "I have saved it" }));
    expect(acknowledge).toHaveBeenCalledOnce();
    expect(window.localStorage.length).toBe(0);
    expect(window.sessionStorage.length).toBe(0);
  });
});
