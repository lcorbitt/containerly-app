import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";
import { installClipboardMock, resetClipboardMock } from "./test/clipboard-mock";

process.env.NEXT_PUBLIC_SUPABASE_URL ??= "https://test.supabase.co";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??= "test-anon-key";

installClipboardMock();

afterEach(() => {
  cleanup();
  resetClipboardMock();
});

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

window.ResizeObserver = ResizeObserverStub;

Element.prototype.getBoundingClientRect = vi.fn(() => ({
  width: 120,
  height: 32,
  top: 100,
  left: 200,
  bottom: 132,
  right: 320,
  x: 200,
  y: 100,
  toJSON: () => ({}),
}));
