import { vi } from "vitest";

let writeTextSpy: ReturnType<typeof vi.spyOn> | null = null;

export function installClipboardMock() {
  if (!("clipboard" in navigator) || !navigator.clipboard) {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
    writeTextSpy = vi.spyOn(navigator.clipboard, "writeText");
    return;
  }

  writeTextSpy = vi.spyOn(navigator.clipboard, "writeText").mockResolvedValue(undefined);
}

export function resetClipboardMock() {
  writeTextSpy?.mockClear();
  writeTextSpy?.mockResolvedValue(undefined);
}

export function clipboardWriteTextMock() {
  if (!writeTextSpy) {
    throw new Error("Clipboard mock not installed");
  }
  return writeTextSpy;
}
