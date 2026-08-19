import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AccountUser } from "@/features/account/types";
import { accountKeys } from "@/features/account/query-keys";
import { AppShellProvider } from "./AppShellContext";
import AppShell from "./components/AppShell";

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
}));

const user: AccountUser = {
  id: "user-1",
  email: "user@example.com",
  name: "User Name",
  username: null,
  avatar: null,
};

describe("authenticated app shell", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("renders an accessible header avatar menu without the dashboard title block", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    queryClient.setQueryData(accountKeys.me, user);
    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <AppShellProvider>
          <AppShell area="dashboard">
            <p>Dashboard content</p>
          </AppShell>
        </AppShellProvider>
      </QueryClientProvider>,
    );

    expect(screen.queryByText("Personal dashboard")).not.toBeInTheDocument();
    const accountButtons = screen.getAllByRole("button", {
      name: "Open account menu",
    });
    fireEvent.click(accountButtons.at(-1)!);
    expect(await screen.findByRole("menu")).toBeInTheDocument();
    expect(
      screen.getByRole("menuitem", { name: "Account settings" }),
    ).toHaveAttribute("href", "/dashboard/settings");

    await act(async () => {
      queryClient.setQueryData(accountKeys.me, {
        ...user,
        avatar: "https://res.cloudinary.com/aurescore/avatar.jpg",
      });
    });

    await waitFor(() =>
      expect(
        container.querySelectorAll(
          'img[src="https://res.cloudinary.com/aurescore/avatar.jpg"]',
        ),
      ).toHaveLength(2),
    );
  });
});
