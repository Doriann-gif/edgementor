import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// --- Mocks -----------------------------------------------------------------

const invokeMock = vi.fn();
const fromMock = vi.fn();

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    functions: { invoke: (...args: unknown[]) => invokeMock(...args) },
    from: (...args: unknown[]) => fromMock(...args),
  },
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: { id: "user-1", email: "student@example.com" },
    loading: false,
  }),
}));

vi.mock("canvas-confetti", () => ({ default: vi.fn() }));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import PaymentSuccess from "@/pages/PaymentSuccess";

// --- Helpers ----------------------------------------------------------------

const renderPage = (search: string) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/payment-success${search}`]}>
        <PaymentSuccess />
      </MemoryRouter>
    </QueryClientProvider>
  );
};

beforeEach(() => {
  invokeMock.mockReset();
  fromMock.mockReset();
});

// --- Tests --------------------------------------------------------------------

describe("PaymentSuccess", () => {
  it("activates access via the verify-payment edge function", async () => {
    invokeMock.mockResolvedValue({ data: { activated: true }, error: null });

    renderPage("?mentor_id=mentor-1&session_id=cs_test_123");

    await waitFor(() => {
      expect(invokeMock).toHaveBeenCalledWith("verify-payment", {
        body: { sessionId: "cs_test_123" },
      });
    });

    expect(await screen.findByText("Payment Successful!")).toBeInTheDocument();
  });

  it("never writes to the subscriptions table from the client", async () => {
    invokeMock.mockResolvedValue({ data: { activated: true }, error: null });

    renderPage("?mentor_id=mentor-1&session_id=cs_test_123");

    await waitFor(() => expect(invokeMock).toHaveBeenCalled());
    // The old payment-bypass path inserted directly into "subscriptions" —
    // it must stay dead.
    expect(fromMock).not.toHaveBeenCalledWith("subscriptions");
  });

  it("does not activate anything without a Stripe session id", async () => {
    renderPage("?mentor_id=mentor-1");

    expect(await screen.findByText("Payment Received")).toBeInTheDocument();
    expect(invokeMock).not.toHaveBeenCalled();
  });

  it("shows an error state when the payment is not paid", async () => {
    invokeMock.mockResolvedValue({
      data: { activated: false, reason: "not_paid" },
      error: null,
    });

    renderPage("?mentor_id=mentor-1&session_id=cs_test_456");

    await waitFor(() => expect(invokeMock).toHaveBeenCalled());
    expect(await screen.findByText("Something went wrong")).toBeInTheDocument();
  });
});
